<?php
declare(strict_types=1);

require_once '../../common/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$branch_id = $data['branch_id'] ?? null;
$employee_id = $data['employee_id'] ?? null;

if (!$branch_id || !$employee_id) {
    echo json_encode(['success' => false, 'message' => 'Branch ID and Employee ID required']);
    exit;
}

$errors = [];

try {
    // Collect inputs
    $visit_date         = $data['visit_date'] ?? date('Y-m-d');
    $assigned_test_date = $data['assigned_test_date'] ?? date('Y-m-d');
    $patient_name       = trim($data['patient_name'] ?? '');
    $age                = trim($data['age'] ?? '');
    $dob                = !empty($data['dob']) ? $data['dob'] : null;
    $gender             = $data['gender'] ?? '';
    $parents            = !empty(trim($data['parents'] ?? '')) ? trim($data['parents']) : null;
    $relation           = !empty(trim($data['relation'] ?? '')) ? trim($data['relation']) : null;
    $phone_number       = trim($data['phone_number'] ?? '');
    $alternate_phone_no = !empty(trim($data['alternate_phone_no'] ?? '')) ? trim($data['alternate_phone_no']) : null;
    $referred_by        = !empty(trim($data['referred_by'] ?? '')) ? trim($data['referred_by']) : null;
    
    // Handle test names and amounts
    $test_names = $data['test_names'] ?? [];
    $test_amounts = $data['test_amounts'] ?? [];
    
    // Handle "Other" test name replacement
    if (in_array('other', $test_names)) {
        $other_name = trim($data['other_test_name'] ?? '');
        if (!empty($other_name)) {
            $key = array_search('other', $test_names);
            if ($key !== false) {
                $test_names[$key] = $other_name;
                if (isset($test_amounts['other'])) {
                    $test_amounts[$other_name] = $test_amounts['other'];
                    unset($test_amounts['other']);
                }
            }
        } else {
            throw new Exception('Please specify the name for the "Other" test.');
        }
    }
    
    $limb               = !empty($data['limb']) ? $data['limb'] : null;
    $test_done_by       = $data['test_done_by'] ?? '';
    
    $total_amount       = (float)($data['total_amount'] ?? 0);
    $advance_amount     = (float)($data['advance_amount'] ?? 0);
    $discount           = (float)($data['discount'] ?? 0);
    $payment_method     = $data['payment_method'] ?? 'cash';

    // Validation
    if (empty($patient_name) || empty($gender) || empty($age)) {
        throw new Exception('Required fields missing: Patient Name, Gender, Age.');
    }
    
    if (empty($test_names)) {
        throw new Exception('Please select at least one test.');
    }

    $pdo->beginTransaction();

    // Generate UID
    $datePrefix = date('ymd', strtotime($visit_date));
    $stmtLastUid = $pdo->prepare(
        "SELECT test_uid FROM tests 
         WHERE test_uid LIKE :prefix 
         ORDER BY test_uid DESC 
         LIMIT 1"
    );
    $stmtLastUid->execute([':prefix' => $datePrefix . '%']);
    $lastUid = $stmtLastUid->fetchColumn();

    $serial = 0;
    if ($lastUid) {
        $serial = (int)substr($lastUid, 6);
    }
    $serial++;
    $newTestUid = $datePrefix . str_pad((string)$serial, 2, '0', STR_PAD_LEFT);

    // Calculate Global Totals
    $global_total_amount = 0.00;
    foreach ($test_names as $name) {
        $global_total_amount += isset($test_amounts[$name]) ? (float)$test_amounts[$name] : 0.00;
    }
    
    $global_due_amount = $global_total_amount - $advance_amount - $discount;

    // Determine global payment status
    $global_payment_status = 'pending';
    if ($global_total_amount == 0) {
        $global_payment_status = 'paid';
    } elseif ($global_due_amount <= 0 && $global_total_amount > 0) {
        $global_payment_status = 'paid';
    } elseif ($advance_amount > 0 && $global_due_amount > 0) {
        $global_payment_status = 'partial';
    }

    // Insert Parent Record into `tests`
    $parent_test_name = implode(', ', array_map('strtoupper', $test_names));
    
    $stmtParent = $pdo->prepare("
        INSERT INTO tests (
            test_uid, visit_date, assigned_test_date, patient_name, phone_number,
            gender, age, dob, parents, relation, alternate_phone_no,
            limb, test_name, referred_by, test_done_by, created_by_employee_id,
            total_amount, advance_amount, discount, due_amount, payment_method,
            payment_status, branch_id
        ) VALUES (
            :test_uid, :visit_date, :assigned_test_date, :patient_name, :phone_number,
            :gender, :age, :dob, :parents, :relation, :alternate_phone_no,
            :limb, :test_name, :referred_by, :test_done_by, :created_by_employee_id,
            :total_amount, :advance_amount, :discount, :due_amount, :payment_method,
            :payment_status, :branch_id
        )
    ");

    $stmtParent->execute([
        ':test_uid'           => $newTestUid,
        ':visit_date'         => $visit_date,
        ':assigned_test_date' => $assigned_test_date,
        ':patient_name'       => $patient_name,
        ':phone_number'       => $phone_number,
        ':gender'             => $gender,
        ':age'                => $age,
        ':dob'                => $dob,
        ':parents'            => $parents,
        ':relation'           => $relation,
        ':alternate_phone_no' => $alternate_phone_no,
        ':limb'               => $limb,
        ':test_name'          => $parent_test_name,
        ':referred_by'        => $referred_by,
        ':test_done_by'       => $test_done_by,
        ':created_by_employee_id' => $employee_id,
        ':total_amount'       => $global_total_amount,
        ':advance_amount'     => $advance_amount,
        ':discount'           => $discount,
        ':due_amount'         => max(0, $global_due_amount),
        ':payment_method'     => $payment_method,
        ':payment_status'     => $global_payment_status,
        ':branch_id'          => $branch_id
    ]);

    $parent_test_id = $pdo->lastInsertId();

    // Insert Child Records into `test_items`
    $remaining_advance = $advance_amount;
    $remaining_discount = $discount;

    foreach ($test_names as $single_test_name) {
        $current_total_amount = isset($test_amounts[$single_test_name]) ? (float)$test_amounts[$single_test_name] : 0.00;
        
        // Distribute advance payment
        $current_advance_amount = 0.00;
        if ($remaining_advance > 0) {
            if ($remaining_advance >= $current_total_amount) {
                $current_advance_amount = $current_total_amount;
                $remaining_advance -= $current_total_amount;
            } else {
                $current_advance_amount = $remaining_advance;
                $remaining_advance = 0;
            }
        }

        // Distribute discount
        $current_discount_amount = 0.00;
        if ($remaining_discount > 0) {
            $max_discount_for_item = max(0, $current_total_amount - $current_advance_amount);
            
            if ($remaining_discount >= $max_discount_for_item) {
                $current_discount_amount = $max_discount_for_item;
                $remaining_discount -= $max_discount_for_item;
            } else {
                $current_discount_amount = $remaining_discount;
                $remaining_discount = 0;
            }
        }
        
        $current_due_amount = $current_total_amount - $current_advance_amount - $current_discount_amount;

        // Determine payment status for this item
        $current_payment_status = 'pending';
        if ($current_total_amount == 0) {
            $current_payment_status = 'paid';
        } elseif ($current_due_amount <= 0 && $current_total_amount > 0) {
            $current_payment_status = 'paid';
        } elseif ($current_advance_amount > 0 && $current_due_amount > 0) {
            $current_payment_status = 'partial';
        }

        $stmtItem = $pdo->prepare("
            INSERT INTO test_items (
                test_id, created_by_employee_id, assigned_test_date, test_name,
                limb, referred_by, test_done_by, total_amount, advance_amount, discount,
                due_amount, payment_method, test_status, payment_status, created_at
            ) VALUES (
                :test_id, :created_by_employee_id, :assigned_test_date, :test_name,
                :limb, :referred_by, :test_done_by, :total_amount, :advance_amount, :discount,
                :due_amount, :payment_method, 'pending', :payment_status, NOW()
            )
        ");

        $stmtItem->execute([
            ':test_id'                => $parent_test_id,
            ':created_by_employee_id' => $employee_id,
            ':assigned_test_date'     => $assigned_test_date,
            ':test_name'              => $single_test_name,
            ':limb'                   => $limb,
            ':referred_by'            => $referred_by,
            ':test_done_by'           => $test_done_by,
            ':total_amount'           => $current_total_amount,
            ':advance_amount'         => $current_advance_amount,
            ':discount'               => $current_discount_amount,
            ':due_amount'             => max(0, $current_due_amount),
            ':payment_method'         => $payment_method,
            ':payment_status'         => $current_payment_status
        ]);
        $newItemId = $pdo->lastInsertId();

        // Auto-Link Referral & Calculate Commission for this item
        if (!empty($referred_by)) {
            $stmtP = $pdo->prepare("SELECT partner_id FROM referral_partners WHERE TRIM(name) = ? LIMIT 1");
            $stmtP->execute([$referred_by]);
            $pId = $stmtP->fetchColumn();
            
            if ($pId) {
                $pdo->prepare("UPDATE tests SET referral_partner_id = ? WHERE test_id = ?")->execute([$pId, $parent_test_id]);
                $pdo->prepare("UPDATE test_items SET referral_partner_id = ? WHERE item_id = ?")->execute([$pId, $newItemId]);
                
                $stmtRate = $pdo->prepare("SELECT commission_amount FROM referral_rates WHERE partner_id = ? AND service_type = 'test' AND service_item_name = ? LIMIT 1");
                $stmtRate->execute([$pId, $single_test_name]);
                $commAmt = $stmtRate->fetchColumn();
                
                if ($commAmt !== false) {
                    $pdo->prepare("UPDATE test_items SET commission_amount = ? WHERE item_id = ?")->execute([$commAmt, $newItemId]);
                }
            }
        }
    }

    $pdo->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Test record added successfully with UID: " . $newTestUid,
        "test_uid" => $newTestUid,
        "test_id" => $parent_test_id
    ]);
    
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Test Submission Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
