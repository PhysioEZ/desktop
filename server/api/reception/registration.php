<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../common/db.php';

$action = $_GET['action'] ?? null;
$input = json_decode(file_get_contents("php://input"), true);

if (!$action && isset($input['action'])) {
    $action = $input['action'];
}

try {
    switch ($action) {
        case 'fetch':
            fetchRegistrations($pdo, $input);
            break;
        case 'options':
            fetchFilterOptions($pdo, $_GET['branch_id'] ?? null);
            break;
        case 'details':
            fetchRegistrationDetails($pdo, $_GET['id'] ?? null);
            break;
        case 'update_status':
            updateRegistrationStatus($pdo, $input);
            break;
        case 'update_details':
            updateRegistrationDetails($pdo, $input);
            break;
        case 'refund':
            initiateRegistrationRefund($pdo, $input);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

function initiateRegistrationRefund($pdo, $input) {
    $registrationId = $input['registration_id'] ?? null;
    $refundAmount = $input['refund_amount'] ?? null;
    $refundReason = $input['refund_reason'] ?? '';
    $branch_id = $input['branch_id'] ?? null;

    if (!$registrationId || !$refundAmount || !$branch_id) {
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
        return;
    }

    try {
        $pdo->beginTransaction();

        $stmtFetch = $pdo->prepare("SELECT consultation_amount FROM registration WHERE registration_id = ? AND branch_id = ?");
        $stmtFetch->execute([$registrationId, $branch_id]);
        $reg = $stmtFetch->fetch();

        if (!$reg || $refundAmount > (float)$reg['consultation_amount']) {
            echo json_encode(["status" => "error", "message" => "Refund amount cannot exceed the amount paid"]);
            $pdo->rollBack();
            return;
        }

        $stmtUpdate = $pdo->prepare("UPDATE registration SET refund_status = 'initiated' WHERE registration_id = ?");
        $stmtUpdate->execute([$registrationId]);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Refund initiated successfully"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

function fetchRegistrations($pdo, $input) {
    $branch_id = $input['branch_id'] ?? null;
    $search = $input['search'] ?? '';
    $status = $input['status'] ?? '';
    $referred_by = $input['referred_by'] ?? '';
    $condition = $input['condition'] ?? '';
    $type = $input['type'] ?? ''; // consultation_type
    
    if (!$branch_id) {
        echo json_encode(["status" => "error", "message" => "Branch ID required"]);
        return;
    }

    $page = isset($input['page']) ? (int)$input['page'] : 1;
    $limit = isset($input['limit']) ? (int)$input['limit'] : 10;
    $offset = ($page - 1) * $limit;

    $where = ["reg.branch_id = ?"];
    $params = [$branch_id];

    if (!empty($search)) {
        $where[] = "(reg.patient_name LIKE ? OR reg.phone_number LIKE ? OR pm.patient_uid LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if (!empty($status)) {
        $where[] = "reg.status = ?";
        $params[] = $status;
    } else {
        // Default behavior: Exclude closed/cancelled registrations from main list
        $where[] = "reg.status != 'closed'";
    }

    if (!empty($referred_by)) {
        $where[] = "reg.reffered_by = ?";
        $params[] = $referred_by; 
    }

    if (!empty($condition)) {
        $where[] = "reg.chief_complain = ?";
        $params[] = $condition;
    }

    if (!empty($type)) {
        $where[] = "reg.consultation_type = ?";
        $params[] = $type;
    }

    $whereSql = implode(" AND ", $where);

    // Count total for pagination
    $countSql = "SELECT COUNT(*) FROM registration reg 
                 LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
                 WHERE $whereSql";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    $sql = "SELECT reg.*, pm.patient_uid, pm.full_name as master_full_name 
            FROM registration reg 
            LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
            WHERE $whereSql 
            ORDER BY reg.registration_id DESC
            LIMIT ? OFFSET ?";
    
    $stmt = $pdo->prepare($sql);
    $bindIdx = 1;
    foreach ($params as $val) {
        $stmt->bindValue($bindIdx++, $val);
    }
    $stmt->bindValue($bindIdx++, $limit, PDO::PARAM_INT);
    $stmt->bindValue($bindIdx++, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "data" => $data,
        "pagination" => [
            "total" => (int)$total,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => ceil($total / $limit)
        ]
    ]);
}

function fetchFilterOptions($pdo, $branch_id) {
    if (!$branch_id) {
        echo json_encode(["status" => "error", "message" => "Branch ID required"]);
        return;
    }

    $options = [];
    
    // Referrers
    $stmt = $pdo->prepare("SELECT DISTINCT reffered_by FROM registration WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != '' ORDER BY reffered_by");
    $stmt->execute([$branch_id]);
    $options['referred_by'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Conditions
    $stmt = $pdo->prepare("SELECT DISTINCT chief_complain FROM registration WHERE branch_id = ? AND chief_complain IS NOT NULL AND chief_complain != '' ORDER BY chief_complain");
    $stmt->execute([$branch_id]);
    $options['conditions'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Types
    $stmt = $pdo->prepare("SELECT DISTINCT consultation_type FROM registration WHERE branch_id = ? AND consultation_type IS NOT NULL AND consultation_type != '' ORDER BY consultation_type");
    $stmt->execute([$branch_id]);
    $options['types'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode(["status" => "success", "data" => $options]);
}

function fetchRegistrationDetails($pdo, $id) {
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Registration ID required"]);
        return;
    }

    $stmt = $pdo->prepare("SELECT reg.*, pm.patient_uid, 
                                 b.branch_name, b.clinic_name, b.address_line_1, b.address_line_2, 
                                 b.city, b.phone_primary, b.logo_primary_path
                          FROM registration reg 
                          LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
                          LEFT JOIN branches b ON reg.branch_id = b.branch_id
                          WHERE reg.registration_id = ?");
    $stmt->execute([$id]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {
        // Also check if they are already added as patient in physio/speech
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE registration_id = ?");
        $stmt->execute([$id]);
        $data['patient_exists_count'] = $stmt->fetchColumn();
    }

    echo json_encode(["status" => "success", "data" => $data]);
}

function updateRegistrationStatus($pdo, $input) {
    $id = $input['id'] ?? null;
    $status = $input['status'] ?? null;

    if (!$id || !$status) {
        echo json_encode(["status" => "error", "message" => "ID and status required"]);
        return;
    }

    $stmt = $pdo->prepare("UPDATE registration SET status = ? WHERE registration_id = ?");
    $stmt->execute([$status, $id]);

    echo json_encode(["status" => "success"]);
}

function updateRegistrationDetails($pdo, $input) {
    $id = $input['registration_id'] ?? null;
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Registration ID required"]);
        return;
    }

    $fields = [
        'patient_name', 'age', 'gender', 'phone_number', 'email', 'address',
        'chief_complain', 'consultation_type', 'reffered_by', 
        'consultation_amount', 'payment_method', 'doctor_notes', 
        'prescription', 'follow_up_date', 'remarks', 'status'
    ];

    $updates = [];
    $params = [];
    foreach ($fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) {
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        return;
    }

    $params[] = $id;
    $sql = "UPDATE registration SET " . implode(", ", $updates) . " WHERE registration_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["status" => "success"]);
}
