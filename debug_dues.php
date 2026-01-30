<?php
require_once 'server/common/db.php';

$branchId = 1;
$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

echo "Current server time: " . date('Y-m-d H:i:s') . "\n";
echo "Date used for 'Today': $today\n";
echo "Date used for 'Yesterday': $yesterday\n";

function check_stats($pdo, $branchId, $date, $label) {
    echo "\n--- checking for $label ($date) ---\n";
    
    // Test Revenue (based on visit_date)
    $stmtRev = $pdo->prepare("SELECT SUM(advance_amount) FROM tests WHERE branch_id = ? AND DATE(visit_date) = ? AND test_status != 'cancelled'");
    $stmtRev->execute([$branchId, $date]);
    echo "Test Revenue (by visit_date): " . (float)$stmtRev->fetchColumn() . "\n";

    // Test Dues (based on created_at)
    $stmtDue = $pdo->prepare("SELECT SUM(due_amount) FROM tests WHERE branch_id = ? AND DATE(created_at) = ?");
    $stmtDue->execute([$branchId, $date]);
    echo "Test Dues (by created_at): " . (float)$stmtDue->fetchColumn() . "\n";

    // Count tests
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = ? AND DATE(created_at) = ?");
    $stmtCount->execute([$branchId, $date]);
    echo "Count Tests (by created_at): " . $stmtCount->fetchColumn() . "\n";
}

check_stats($pdo, $branchId, $today, "TODAY");
check_stats($pdo, $branchId, $yesterday, "YESTERDAY");
