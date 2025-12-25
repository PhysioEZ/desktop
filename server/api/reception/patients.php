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

$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? $_GET['action'] ?? 'fetch';

try {
    switch ($action) {
        case 'fetch':
            fetchPatients($pdo, $input);
            break;
        case 'fetch_filters':
            fetchFilters($pdo, $input);
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchFilters($pdo, $input) {
    $branchId = $input['branch_id'] ?? null;
    if (!$branchId) {
        echo json_encode(['status' => 'error', 'message' => 'Branch ID required']);
        return;
    }

    $filterOptions = [];
    $filterQueries = [
        'doctors' => "SELECT DISTINCT assigned_doctor FROM patients WHERE branch_id = :branch_id AND assigned_doctor IS NOT NULL AND assigned_doctor != '' ORDER BY assigned_doctor",
        'treatments' => "SELECT DISTINCT treatment_type FROM patients WHERE branch_id = :branch_id AND treatment_type IS NOT NULL AND treatment_type != '' ORDER BY treatment_type",
        'statuses' => "SELECT DISTINCT status FROM patients WHERE branch_id = :branch_id AND status IS NOT NULL AND status != '' ORDER BY status",
        'services' => "SELECT DISTINCT service_type FROM patients WHERE branch_id = :branch_id AND service_type IS NOT NULL AND service_type != '' ORDER BY service_type",
    ];

    foreach ($filterQueries as $key => $query) {
        $stmt = $pdo->prepare($query);
        $stmt->execute([':branch_id' => $branchId]);
        $filterOptions[$key] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    echo json_encode(['status' => 'success', 'data' => $filterOptions]);
}

function fetchPatients($pdo, $input) {
    $branchId = $input['branch_id'] ?? null;
    $page = $input['page'] ?? 1;
    $limit = $input['limit'] ?? 15;
    $search = $input['search'] ?? '';
    // Filters
    $service_type = $input['service_type'] ?? '';
    $doctor = $input['doctor'] ?? '';
    $treatment = $input['treatment'] ?? '';
    $status = $input['status'] ?? '';

    if (!$branchId) {
        echo json_encode(['status' => 'error', 'message' => 'Branch ID required']);
        return;
    }

    $offset = ($page - 1) * $limit;

    // --- Build Query ---
    $whereClauses = ["p.branch_id = :branch_id"];
    $params = [':branch_id' => $branchId];

    if (!empty($search)) {
        $whereClauses[] = "(r.patient_name LIKE :search1 OR r.phone_number LIKE :search2 OR pm.patient_uid LIKE :search3)";
        $params[':search1'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
    }
    if (!empty($service_type)) {
        $whereClauses[] = "p.service_type = :service_type";
        $params[':service_type'] = $service_type;
    }
    if (!empty($doctor)) {
        $whereClauses[] = "p.assigned_doctor = :doctor";
        $params[':doctor'] = $doctor;
    }
    if (!empty($treatment)) {
        $whereClauses[] = "p.treatment_type = :treatment";
        $params[':treatment'] = $treatment;
    }
    if (!empty($status)) {
        $whereClauses[] = "p.status = :status";
        $params[':status'] = $status;
    }

    $whereSql = implode(' AND ', $whereClauses);

    // Count Total
    $stmtTotal = $pdo->prepare("
        SELECT COUNT(*) 
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        WHERE $whereSql
    ");
    $stmtTotal->execute($params);
    $total_records = (int)$stmtTotal->fetchColumn();
    $total_pages = ceil($total_records / $limit);

    // Fetch Data
    $sql = "SELECT
            p.patient_id,
            p.treatment_type,
            p.service_type,
            p.treatment_cost_per_day,
            p.package_cost,
            p.treatment_days,
            p.total_amount,
            p.advance_payment,
            p.discount_percentage,
            p.due_amount,
            p.assigned_doctor,
            p.start_date,
            pm.patient_uid,
            p.end_date,
            p.status AS patient_status,
            r.registration_id,
            r.patient_name AS patient_name,
            r.phone_number AS patient_phone,
            r.age AS patient_age,
            r.chief_complain AS patient_condition,
            r.created_at,
            r.patient_photo_path
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        WHERE $whereSql
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    $stmt->execute();
    $rawPatients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- Calculate Effective Balance ---
    $patients = [];
    foreach ($rawPatients as $p) {
        $pid = (int)$p['patient_id'];
        
        // 1. Total Paid
        $paidStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE patient_id = ?");
        $paidStmt->execute([$pid]);
        $totalPaid = (float)$paidStmt->fetchColumn();

        // 2. Total Consumed
        $totalConsumed = 0.0;

        // A. Historical Consumption
        $stmtHistory = $pdo->prepare("
            SELECT treatment_type, treatment_days, package_cost, treatment_cost_per_day, start_date, end_date 
            FROM patients_treatment 
            WHERE patient_id = ?
        ");
        $stmtHistory->execute([$pid]);
        while ($h = $stmtHistory->fetch(PDO::FETCH_ASSOC)) {
            $stmtHAtt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND attendance_date < ? AND status = 'present'");
            $stmtHAtt->execute([$pid, $h['start_date'], $h['end_date']]);
            $hCount = (int)$stmtHAtt->fetchColumn();
            
            $hRate = ($h['treatment_type'] === 'package' && (int)$h['treatment_days'] > 0) 
                     ? (float)$h['package_cost'] / (int)$h['treatment_days'] 
                     : (float)$h['treatment_cost_per_day'];
            $totalConsumed += ($hCount * $hRate);
        }

        // B. Current Plan Consumption
        $curRate = ($p['treatment_type'] === 'package' && (int)$p['treatment_days'] > 0) 
                   ? (float)$p['package_cost'] / (int)$p['treatment_days'] 
                   : (float)$p['treatment_cost_per_day'];
        
        $stmtCAtt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND status = 'present'");
        $stmtCAtt->execute([$pid, $p['start_date'] ?? '2000-01-01']);
        $cCount = (int)$stmtCAtt->fetchColumn();
        
        $totalConsumed += ($cCount * $curRate);

        $p['effective_balance'] = $totalPaid - $totalConsumed;
        $p['attendance_count'] = $cCount;
        $p['cost_per_day'] = $curRate;
        
        // Check today's attendance status
        $todayStmt = $pdo->prepare("SELECT status FROM attendance WHERE patient_id = ? AND attendance_date = CURDATE()");
        $todayStmt->execute([$pid]);
        $p['today_attendance'] = $todayStmt->fetchColumn() ?: null;

        // Check today's token
        $tokenStmt = $pdo->prepare("SELECT COUNT(*) FROM tokens WHERE patient_id = ? AND token_date = CURDATE()");
        $tokenStmt->execute([$pid]);
        $p['has_token_today'] = $tokenStmt->fetchColumn() > 0;

        $patients[] = $p;
    }

    echo json_encode([
        'status' => 'success',
        'data' => $patients,
        'pagination' => [
            'total' => $total_records,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => $total_pages
        ]
    ]);
}
