<?php
/**
 * Registration Submit API - Desktop Application
 * Requires authentication. Standard rate limiting.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security - requires authentication
$authData = applySecurity(['requireAuth' => true]);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Use branch_id and employee_id from auth data
$branch_id = $authData['branch_id'] ?? $data['branch_id'] ?? null;
$employee_id = $authData['employee_id'] ?? $data['employee_id'] ?? null;

if (!$branch_id || !$employee_id) {
    echo json_encode(['success' => false, 'message' => 'Branch ID and Employee ID required']);
    exit;
}

$pdo->beginTransaction();

try {
    // Collect and Sanitize Inputs
    $patient_name      = trim($data['patient_name'] ?? '');
    $phone             = trim($data['phone'] ?? '');
    $email             = trim($data['email'] ?? '');
    $gender            = $data['gender'] ?? '';
    $age               = trim($data['age'] ?? '');
    // Handle Chief Complaint (can be array from modern frontend or string from legacy)
    $chief_complain = '';
    $conditionType = $data['conditionType'] ?? '';
    
    if (is_array($conditionType)) {
        // Remove 'other' from the array if we have a specific other value
        $hasOther = in_array('other', $conditionType);
        $complaints = array_filter($conditionType, function($c) { return $c !== 'other'; });
        
        if ($hasOther && !empty($data['conditionType_other'])) {
            $complaints[] = trim($data['conditionType_other']);
        }
        $chief_complain = implode(', ', $complaints);
    } else {
        $chief_complain = ($conditionType === 'other' && !empty($data['conditionType_other'])) 
                             ? $data['conditionType_other'] 
                             : ($conditionType ?: 'other');
    }
    $referralSource    = $data['referralSource'] ?? 'self';
    $referred_by       = trim($data['referred_by'] ?? '');
    $occupation        = trim($data['occupation'] ?? '');
    $address           = trim($data['address'] ?? '');
    $consultation_type = $data['inquiry_type'] ?? 'in-clinic';
    $appointment_date  = $data['appointment_date'] ?? null;
    $appointment_time  = $data['appointment_time'] ?? null;
    $consultation_amt  = (float)($data['amount'] ?? 0);
    $payment_method    = $data['payment_method'] ?? 'cash';
    $remarks           = trim($data['remarks'] ?? '');

    // Validation
    if (empty($patient_name) || empty($phone) || empty($gender) || empty($age)) {
        throw new Exception("Please fill in all required fields: Name, Phone, Gender, and Age.");
    }

    // Generate Unique Patient UID
    $today = date('Y-m-d');
    $pdo->exec("
        INSERT INTO daily_patient_counter (entry_date, counter) VALUES ('$today', 1)
        ON DUPLICATE KEY UPDATE counter = counter + 1
    ");
    $stmtCounter = $pdo->prepare("SELECT counter FROM daily_patient_counter WHERE entry_date = ?");
    $stmtCounter->execute([$today]);
    $serialNumber = $stmtCounter->fetchColumn();
    $patientUID = date('ymd') . $serialNumber;

    // Check for Existing Patient and Create Master Record
    $stmtCheck = $pdo->prepare("SELECT master_patient_id FROM patient_master WHERE phone_number = ? LIMIT 1");
    $stmtCheck->execute([$phone]);
    $masterPatientId = $stmtCheck->fetchColumn();

    if (!$masterPatientId) {
        $stmtMaster = $pdo->prepare(
            "INSERT INTO patient_master (patient_uid, full_name, phone_number, gender, age, first_registered_branch_id)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmtMaster->execute([$patientUID, $patient_name, $phone, $gender, $age, $branch_id]);
        $masterPatientId = $pdo->lastInsertId();
    }

    // Create the Branch-Specific Registration Record
    $stmtReg = $pdo->prepare("
        INSERT INTO registration 
        (master_patient_id, branch_id, created_by_employee_id, patient_name, phone_number, email, gender, age, chief_complain, referralSource, reffered_by, occupation, address, consultation_type, appointment_date, appointment_time, consultation_amount, payment_method, remarks, status)
        VALUES
        (:master_patient_id, :branch_id, :created_by_employee_id, :patient_name, :phone, :email, :gender, :age, :chief_complain, :referralSource, :referred_by, :occupation, :address, :consultation_type, :appointment_date, :appointment_time, :consultation_amount, :payment_method, :remarks, 'Pending')
    ");
    $stmtReg->execute([
        ':master_patient_id'   => $masterPatientId,
        ':branch_id'           => $branch_id,
        ':created_by_employee_id' => $employee_id,
        ':patient_name'        => $patient_name,
        ':phone'               => $phone,
        ':email'               => $email,
        ':gender'              => $gender,
        ':age'                 => $age,
        ':chief_complain'      => $chief_complain,
        ':referralSource'      => $referralSource,
        ':referred_by'         => $referred_by,
        ':occupation'          => $occupation,
        ':address'             => $address,
        ':consultation_type'   => $consultation_type,
        ':appointment_date'    => $appointment_date ?: null,
        ':appointment_time'    => $appointment_time ?: null,
        ':consultation_amount' => $consultation_amt,
        ':payment_method'      => $payment_method,
        ':remarks'             => $remarks
    ]);
    $newRegistrationId = $pdo->lastInsertId();

    // Handle Payment Breakdown
    $paymentAmounts = $data['payment_amounts'] ?? [];
    if (!empty($paymentAmounts) && is_array($paymentAmounts)) {
        $stmtPaySplit = $pdo->prepare("INSERT INTO registration_payments (registration_id, payment_method, amount, branch_id) VALUES (?, ?, ?, ?)");
        foreach ($paymentAmounts as $method => $amt) {
            $amt = (float)$amt;
            if ($amt > 0) {
                $stmtPaySplit->execute([$newRegistrationId, $method, $amt, $branch_id]);
            }
        }
    }

    // Referral Partner Linking & Commission (Auto)
    if (!empty($referred_by)) {
        $stmtP = $pdo->prepare("SELECT partner_id FROM referral_partners WHERE TRIM(name) = ? LIMIT 1");
        $stmtP->execute([$referred_by]);
        $pId = $stmtP->fetchColumn();
        
        if ($pId) {
            $pdo->prepare("UPDATE registration SET referral_partner_id = ? WHERE registration_id = ?")->execute([$pId, $newRegistrationId]);
            
            $stmtRate = $pdo->prepare("SELECT commission_amount FROM referral_rates WHERE partner_id = ? AND service_type = 'registration' LIMIT 1");
            $stmtRate->execute([$pId]);
            $commAmt = $stmtRate->fetchColumn();
            
            if ($commAmt !== false) {
                $pdo->prepare("UPDATE registration SET commission_amount = ? WHERE registration_id = ?")->execute([$commAmt, $newRegistrationId]);
            }
        }
    }

    // Handle Patient Photo (if provided)
    if (!empty($data['patient_photo_data'])) {
        try {
            $imageData = $data['patient_photo_data'];
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]);
                
                if (in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                    $imageData = base64_decode($imageData);
                    if ($imageData !== false) {
                        $uploadDir = '../../uploads/patient_photos/';
                        if (!is_dir($uploadDir)) {
                            mkdir($uploadDir, 0777, true);
                        }
                        
                        $fileName = "reg_{$newRegistrationId}_" . time() . ".{$type}";
                        $filePath = $uploadDir . $fileName;
                        
                        if (file_put_contents($filePath, $imageData)) {
                            $relativePath = 'admin/desktop/server/uploads/patient_photos/' . $fileName;
                            $pdo->prepare("UPDATE registration SET patient_photo_path = :path WHERE registration_id = :id")
                                ->execute([':path' => $relativePath, ':id' => $newRegistrationId]);
                        }
                    }
                }
            }
        } catch (Exception $e) {
            error_log("Photo upload failed: " . $e->getMessage());
        }
    }

    $pdo->commit();
    echo json_encode([
        "success" => true,
        "message" => "Patient registered successfully!",
        "patient_uid" => $patientUID,
        "registration_id" => $newRegistrationId
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Registration API Error: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
