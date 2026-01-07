<?php
/**
 * Quick Add Patient API - Desktop Application
 * Handles adding Physio/Speech patients from Registration screen.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security - requires authentication
$authData = applySecurity(['requireAuth' => true]);

$input = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

try {
    $pdo->beginTransaction();

    $branchId = $authData['branch_id'] ?? 0;
    $employeeId = $authData['employee_id'] ?? 0;

    if (!$branchId || !$employeeId) {
        throw new Exception('Branch ID or Employee ID missing from session');
    }

    $registrationId = $input['registrationId'] ?? null;
    $serviceType = $input['serviceType'] ?? 'physio'; // 'physio' or 'speech_therapy'
    $treatmentType = $input['treatmentType'] ?? null;
    $treatmentDays = isset($input['treatmentDays']) ? (int)$input['treatmentDays'] : 0;
    $totalAmount = (float)($input['totalCost'] ?? 0);
    $advancePayment = (float)($input['advancePayment'] ?? 0);
    $discount = (float)($input['discount'] ?? 0);
    $dueAmount = (float)($input['dueAmount'] ?? 0);
    $startDate = $input['startDate'] ?? null;
    $paymentMethodString = $input['paymentMethod'] ?? 'Cash'; // Combined string or primary method
    $timeSlot = $input['treatment_time_slot'] ?? null;
    $discountApprovedBy = $input['discount_approved_by_employee_id'] ?? null;

    if (!$registrationId || !$treatmentType || !$startDate || !$timeSlot) {
        throw new Exception('Missing required fields: registrationId, treatmentType, startDate, and timeSlot are mandatory.');
    }

    // Check if already exist and get master_patient_id
    $stmtReg = $pdo->prepare("SELECT master_patient_id FROM registration WHERE registration_id = ?");
    $stmtReg->execute([$registrationId]);
    $regData = $stmtReg->fetch();
    if (!$regData) {
        throw new Exception("Registration not found.");
    }
    $masterPatientId = $regData['master_patient_id'];

    $stmtCheck = $pdo->prepare("SELECT patient_id FROM patients WHERE registration_id = ? AND service_type = ?");
    $stmtCheck->execute([$registrationId, $serviceType]);
    if ($stmtCheck->fetch()) {
        throw new Exception("This registration has already been converted to a $serviceType patient.");
    }

    // Calculate end date based on days
    $endDate = null;
    if ($startDate && $treatmentDays > 0) {
        $dt = new DateTime($startDate);
        $dt->modify('+' . ($treatmentDays - 1) . ' days');
        $endDate = $dt->format('Y-m-d');
    }

    // Treatment logic (Daily vs Package)
    $treatmentCostPerDay = null;
    $packageCost = null;

    if ($treatmentType === 'daily' || $treatmentType === 'advance') {
        if ($treatmentDays <= 0) throw new Exception('Number of days is required for daily/advance treatment.');
        $treatmentCostPerDay = $totalAmount / $treatmentDays;
    } elseif ($treatmentType === 'package') {
        $packageCost = $totalAmount;
        if ($treatmentDays <= 0) $treatmentDays = ($serviceType === 'speech_therapy' ? 26 : 21); // Defaults
    }

    // Insert into patients table
    $sqlPatient = "INSERT INTO patients (
        registration_id, branch_id, master_patient_id, created_by_employee_id, 
        treatment_type, service_type, treatment_cost_per_day, package_cost, 
        treatment_days, total_amount, payment_method, 
        discount_percentage, discount_approved_by_employee_id, discount_approved_by,
        advance_payment, due_amount, start_date, end_date, treatment_time_slot, status
    ) VALUES (
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?,
        ?, ?, ?, ?, ?, 'active'
    )";

    $stmtPatient = $pdo->prepare($sqlPatient);
    $stmtPatient->execute([
        $registrationId, $branchId, $masterPatientId, $employeeId,
        $treatmentType, $serviceType, $treatmentCostPerDay, $packageCost,
        $treatmentDays, $totalAmount, $paymentMethodString,
        $discount, $discountApprovedBy ?: null, $discountApprovedBy ?: null,
        $advancePayment, $dueAmount, $startDate, $endDate, $timeSlot
    ]);

    $newPatientId = (int)$pdo->lastInsertId();

    // Generate Appointments
    if ($treatmentDays > 0) {
        $apptStmt = $pdo->prepare("
            INSERT INTO patient_appointments (patient_id, branch_id, created_by_employee_id, appointment_date, time_slot, service_type, status)
            VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
        ");

        $currDate = new DateTime($startDate);
        for ($i = 0; $i < $treatmentDays; $i++) {
            $apptStmt->execute([
                $newPatientId, $branchId, $employeeId, $currDate->format('Y-m-d'), $timeSlot, $serviceType
            ]);
            $currDate->modify('+1 day');
        }
    }

    // Record Payment if advance > 0
    if ($advancePayment > 0) {
        $stmtPayment = $pdo->prepare("
            INSERT INTO payments (patient_id, payment_date, amount, mode, remarks, processed_by_employee_id)
            VALUES (?, ?, ?, ?, 'Initial advance payment', ?)
        ");
        $stmtPayment->execute([$newPatientId, $startDate, $advancePayment, $paymentMethodString, $employeeId]);
        $newPaymentIdPayment = (int)$pdo->lastInsertId();

        // Handle payment splits if provided
        $paymentSplits = $input['paymentSplits'] ?? [];
        if (!empty($paymentSplits) && is_array($paymentSplits)) {
            $stmtSplit = $pdo->prepare("INSERT INTO payment_splits (payment_id, payment_method, amount) VALUES (?, ?, ?)");
            foreach ($paymentSplits as $split) {
                if (isset($split['method'], $split['amount']) && (float)$split['amount'] > 0) {
                    $stmtSplit->execute([$newPaymentIdPayment, $split['method'], (float)$split['amount']]);
                }
            }
        }
    }

    // Update original registration status to 'Consulted'
    $stmtUpdateReg = $pdo->prepare("UPDATE registration SET status = 'consulted' WHERE registration_id = ?");
    $stmtUpdateReg->execute([$registrationId]);

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Patient added successfully', 'patient_id' => $newPatientId]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
