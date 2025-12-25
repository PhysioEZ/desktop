<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../common/db.php';

$input = json_decode(file_get_contents("php://input"), true) ?? $_REQUEST;
$action = $input['action'] ?? 'fetch';
$branch_id = $input['branch_id'] ?? null;

if (!$branch_id) {
    echo json_encode(['status' => 'error', 'message' => 'Branch ID required']);
    exit;
}

try {
    switch ($action) {
        case 'fetch':
            $type = $input['type'] ?? 'consultation'; // consultation or test
            $search = $input['search'] ?? '';
            $status = $input['status'] ?? '';
            
            if ($type === 'consultation') {
                $query = "SELECT * FROM quick_inquiry WHERE branch_id = :branch_id";
                $params = [':branch_id' => $branch_id];
                
                if (!empty($search)) {
                    $query .= " AND (name LIKE :search OR phone_number LIKE :search)";
                    $params[':search'] = "%$search%";
                }
                
                if (!empty($status)) {
                    $query .= " AND status = :status";
                    $params[':status'] = $status;
                }
                
                $query .= " ORDER BY created_at DESC LIMIT 100";
            } else {
                $query = "SELECT * FROM test_inquiry WHERE branch_id = :branch_id";
                $params = [':branch_id' => $branch_id];
                
                if (!empty($search)) {
                    $query .= " AND (name LIKE :search OR mobile_number LIKE :search)";
                    $params[':search'] = "%$search%";
                }
                
                if (!empty($status)) {
                    $query .= " AND status = :status";
                    $params[':status'] = $status;
                }
                
                $query .= " ORDER BY created_at DESC LIMIT 100";
            }
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['status' => 'success', 'data' => $data]);
            break;

        case 'options':
            // Complaints
            $stmt = $pdo->prepare("SELECT complaint_code as value, complaint_name as label FROM chief_complaints WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
            $stmt->execute([$branch_id]);
            $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Referral Sources
            $stmt = $pdo->prepare("SELECT source_code as value, source_name as label FROM referral_sources WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
            $stmt->execute([$branch_id]);
            $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Staff for tests
            $stmt = $pdo->prepare("SELECT staff_id as value, staff_name as label FROM test_staff WHERE branch_id = ? AND is_active = 1 ORDER BY display_order, staff_name");
            $stmt->execute([$branch_id]);
            $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Test Types
            $stmt = $pdo->prepare("SELECT test_code as value, test_name as label FROM test_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
            $stmt->execute([$branch_id]);
            $tests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Limb Types
            $stmt = $pdo->prepare("SELECT limb_code as value, limb_name as label FROM limb_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
            $stmt->execute([$branch_id]);
            $limbs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success', 
                'data' => [
                    'complaints' => $complaints,
                    'sources' => $sources,
                    'staff' => $staff,
                    'tests' => $tests,
                    'limbs' => $limbs
                ]
            ]);
            break;

        case 'submit_consultation':
            $id = $input['inquiry_id'] ?? null;
            $data = [
                'branch_id' => $branch_id,
                'name' => $input['name'],
                'age' => $input['age'],
                'gender' => $input['gender'],
                'phone_number' => $input['phone_number'],
                'email' => $input['email'] ?? null,
                'occupation' => $input['occupation'] ?? null,
                'address' => $input['address'] ?? null,
                'referred_by' => $input['referred_by'] ?? null,
                'referralSource' => $input['referralSource'] ?? 'self',
                'chief_complain' => $input['chief_complain'] ?? null,
                'review' => $input['review'] ?? null,
                'expected_visit_date' => $input['expected_visit_date'] ?? date('Y-m-d'),
                'status' => $input['status'] ?? 'pending'
            ];

            if ($id) {
                $sql = "UPDATE quick_inquiry SET 
                        name = :name, age = :age, gender = :gender, phone_number = :phone_number, 
                        email = :email, occupation = :occupation, address = :address, 
                        referred_by = :referred_by, referralSource = :referralSource, 
                        chief_complain = :chief_complain, review = :review, 
                        expected_visit_date = :expected_visit_date, status = :status 
                        WHERE inquiry_id = :id AND branch_id = :branch_id";
                $data['id'] = $id;
            } else {
                $sql = "INSERT INTO quick_inquiry (
                        branch_id, name, age, gender, phone_number, email, occupation, address, 
                        referred_by, referralSource, chief_complain, review, expected_visit_date, status
                        ) VALUES (
                        :branch_id, :name, :age, :gender, :phone_number, :email, :occupation, :address, 
                        :referred_by, :referralSource, :chief_complain, :review, :expected_visit_date, :status
                        )";
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($data);
            echo json_encode(['status' => 'success', 'message' => 'Consultation inquiry saved']);
            break;

        case 'submit_test':
            $id = $input['inquiry_id'] ?? null;
            $data = [
                'branch_id' => $branch_id,
                'name' => $input['name'],
                'age' => $input['age'],
                'gender' => $input['gender'],
                'mobile_number' => $input['mobile_number'],
                'parents' => $input['parents'] ?? null,
                'relation' => $input['relation'] ?? null,
                'reffered_by' => $input['reffered_by'] ?? null,
                'testname' => $input['testname'],
                'limb' => $input['limb'] ?? null,
                'expected_visit_date' => $input['expected_visit_date'] ?? date('Y-m-d'),
                'assigned_test_date' => $input['assigned_test_date'] ?? date('Y-m-d'),
                'test_done_by' => $input['test_done_by'] ?? null,
                'status' => $input['status'] ?? 'pending'
            ];

            if ($id) {
                $sql = "UPDATE test_inquiry SET 
                        name = :name, age = :age, gender = :gender, mobile_number = :mobile_number, 
                        parents = :parents, relation = :relation, reffered_by = :reffered_by, 
                        testname = :testname, limb = :limb, expected_visit_date = :expected_visit_date, 
                        assigned_test_date = :assigned_test_date, test_done_by = :test_done_by, 
                        status = :status 
                        WHERE inquiry_id = :id AND branch_id = :branch_id";
                $data['id'] = $id;
            } else {
                $sql = "INSERT INTO test_inquiry (
                        branch_id, name, age, gender, mobile_number, parents, relation, 
                        reffered_by, testname, limb, expected_visit_date, assigned_test_date, 
                        test_done_by, status
                        ) VALUES (
                        :branch_id, :name, :age, :gender, :mobile_number, :parents, :relation, 
                        :reffered_by, :testname, :limb, :expected_visit_date, :assigned_test_date, 
                        :test_done_by, :status
                        )";
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($data);
            echo json_encode(['status' => 'success', 'message' => 'Test inquiry saved']);
            break;

        case 'update_status':
            $type = $input['type'] ?? 'consultation';
            $id = $input['id'];
            $new_status = $input['status'];
            
            $table = ($type === 'consultation') ? 'quick_inquiry' : 'test_inquiry';
            $stmt = $pdo->prepare("UPDATE $table SET status = ? WHERE inquiry_id = ? AND branch_id = ?");
            $stmt->execute([$new_status, $id, $branch_id]);
            echo json_encode(['status' => 'success', 'message' => 'Status updated']);
            break;

        case 'delete':
            $type = $input['type'] ?? 'consultation';
            $id = $input['id'];
            
            $table = ($type === 'consultation') ? 'quick_inquiry' : 'test_inquiry';
            $stmt = $pdo->prepare("DELETE FROM $table WHERE inquiry_id = ? AND branch_id = ?");
            $stmt->execute([$id, $branch_id]);
            echo json_encode(['status' => 'success', 'message' => 'Inquiry deleted']);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            break;
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
