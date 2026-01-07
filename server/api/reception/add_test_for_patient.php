<?php
require_once '../../common/auth.php';
require_once '../../common/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$patientId = $input['test_patient_id'] ?? null;
$total = floatval($input['total_amount'] ?? 0);
$advance = floatval($input['advance_amount'] ?? 0);
$due = floatval($input['due_amount'] ?? 0);

if (!$patientId) {
    echo json_encode(['success' => false, 'message' => 'Patient ID required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Fetch Patient Info
    $stmtP = $pdo->prepare("SELECT * FROM patients WHERE patient_id = ?");
    $stmtP->execute([$patientId]);
    $patient = $stmtP->fetch(PDO::FETCH_ASSOC);

    if (!$patient) throw new Exception("Patient not found");

    // 2. Generate UID (Copied from test_submit.php logic)
    $today = date('Y-m-d');
    $datePrefix = date('ymd');
    $stmtLastUid = $pdo->prepare("SELECT test_uid FROM tests WHERE test_uid LIKE ? ORDER BY test_uid DESC LIMIT 1");
    $stmtLastUid->execute([$datePrefix . '%']);
    $lastUid = $stmtLastUid->fetchColumn();
    $serial = $lastUid ? intval(substr($lastUid, 6)) : 0;
    $serial++;
    $newTestUid = $datePrefix . str_pad((string)$serial, 2, '0', STR_PAD_LEFT);

    // 3. Insert into `tests`
    // We don't have specific test names, so we use "General Test" or similar
    $status = ($due <= 0) ? 'paid' : (($advance > 0) ? 'partial' : 'pending');
    
    $stmtTest = $pdo->prepare("
        INSERT INTO tests (
            test_uid, visit_date, assigned_test_date, patient_name, phone_number,
            gender, age, 
            test_name, 
            total_amount, advance_amount, due_amount, 
            payment_status, branch_id
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, 
            'General Test (Patient Module)', 
            ?, ?, ?, 
            ?, ?
        )
    ");
    $stmtTest->execute([
        $newTestUid, $today, $today, $patient['patient_name'], $patient['patient_phone'],
        $patient['patient_gender'], $patient['patient_age'],
        $total, $advance, $due,
        $status, $patient['branch_id']
    ]);
    
    // 4. Insert into `test_items` (Optional but good for consistency)
    $testId = $pdo->lastInsertId();
    $stmtItem = $pdo->prepare("
        INSERT INTO test_items (
            test_id, test_name, total_amount, advance_amount, due_amount, payment_status, created_at
        ) VALUES (
            ?, 'General Test', ?, ?, ?, ?, NOW()
        )
    ");
    $stmtItem->execute([$testId, $total, $advance, $due, $status]);

    // 5. Insert into `payments` (To reflect in patient ledger)
    if ($advance > 0) {
        $stmtPay = $pdo->prepare("INSERT INTO payments (patient_id, amount, payment_method, payment_date, remarks, branch_id, created_at) VALUES (?, ?, 'Cash', ?, 'Test Advance', ?, NOW())");
        $stmtPay->execute([$patientId, $advance, $today, $patient['branch_id']]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Test added successfully']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
