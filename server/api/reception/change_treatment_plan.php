<?php
require_once '../../common/auth.php';
require_once '../../common/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$patientId = $input['old_patient_id'] ?? null;
// New Plan Details
$newType = $input['new_treatment_type'] ?? 'package';
$newRate = floatval($input['new_total_amount'] ?? 0); // Can be package cost OR daily rate
$newDays = intval($input['new_treatment_days'] ?? 0);
$newDiscount = floatval($input['new_discount_percentage'] ?? 0);
$advance = floatval($input['new_advance_payment'] ?? 0);
$payMethod = $input['change_plan_payment_method'] ?? 'cash';
$reason = $input['reason_for_change'] ?? '';

if (!$patientId) {
    echo json_encode(['success' => false, 'message' => 'Patient ID required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Fetch Current Patient Details
    $stmt = $pdo->prepare("SELECT * FROM patients WHERE patient_id = ?");
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$patient) throw new Exception("Patient not found");

    // 2. Archive Current Plan to History
    // (Assuming schema based on standard fields)
    $stmtHist = $pdo->prepare("
        INSERT INTO patients_treatment (
            patient_id, treatment_type, start_date, end_date, 
            treatment_days, attendance_count, 
            treatment_cost_per_day, package_cost, discount_percentage, 
            remarks, created_at
        ) VALUES (
            ?, ?, ?, ?, 
            ?, ?, 
            ?, ?, ?, 
            ?, NOW()
        )
    ");
    
    // Map current values
    // For cost: if type is package, use package_cost, else cost_per_day
    // Actually store both as they were
    $histStart = $patient['start_date'];
    $histEnd = $patient['end_date']; // Might be null or future
    // If ending now, maybe update end_date to today?
    // "End Date" in history usually means when the plan ended.
    $actualEndDate = date('Y-m-d');

    $stmtHist->execute([
        $patientId,
        $patient['treatment_type'],
        $histStart,
        $actualEndDate, // Plan ended today
        $patient['treatment_days'],
        $patient['attendance_count'],
        $patient['cost_per_day'],
        $patient['package_cost'], // Assuming this column exists
        $patient['discount_percentage'],
        "Changed Plan. Reason: " . $reason
    ]);

    // 3. Update Patient with New Plan
    $newStartDate = date('Y-m-d');
    $newEndDate = date('Y-m-d', strtotime("+$newDays days"));
    
    // Determine Cost Fields
    $newCostPerDay = 0;
    $newPackageCost = 0;

    // Logic: In legacy JS, 'ChangePlan' passes 'new_total_amount'.
    // If Package, this is Package Cost. If Daily, this is Cost/Day.
    if ($newType === 'package') {
        $newPackageCost = $newRate;
        $newCostPerDay = 0; // Or derived? Usually 0 for package logic.
    } else {
        $newCostPerDay = $newRate;
        $newPackageCost = 0;
    }

    $stmtUpd = $pdo->prepare("
        UPDATE patients SET
            treatment_type = ?,
            treatment_days = ?,
            start_date = ?,
            end_date = ?,
            cost_per_day = ?,
            package_cost = ?,
            discount_percentage = ?,
            attendance_count = 0, -- Reset for new plan
            remarks = CONCAT(remarks, '\n[Plan Changed on ', CURDATE(), ']'),
            status = 'active'
        WHERE patient_id = ?
    ");
    $stmtUpd->execute([
        $newType, $newDays, $newStartDate, $newEndDate,
        $newCostPerDay, $newPackageCost, $newDiscount,
        $patientId
    ]);

    // 4. Insert Advance Payment (if any)
    if ($advance > 0) {
        $stmtPay = $pdo->prepare("INSERT INTO payments (patient_id, amount, payment_method, payment_date, remarks, branch_id, created_at) VALUES (?, ?, ?, CURDATE(), ?, ?, NOW())");
        $stmtPay->execute([$patientId, $advance, $payMethod, 'Advance for New Plan', $patient['branch_id']]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Plan changed successfully']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
