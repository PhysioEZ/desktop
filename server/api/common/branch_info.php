<?php
// desktop/server/api/common/branch_info.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../../common/db.php';

$branchId = $_GET['branch_id'] ?? null;

if (!$branchId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Branch ID required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT branch_name, logo_primary_path FROM branches WHERE branch_id = ? LIMIT 1");
    $stmt->execute([$branchId]);
    $branch = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($branch) {
        // Fix logo path: ensure it points to the correct serving URL
        // If stored as relative path like '../assets/...', convert to absolute '/admin/assets/...'
        // Usually PHP app stores relative paths from its root.
        // Assuming desktop app serves 'http://localhost:XYZ' and images are on 'http://locahost/admin/...'
        // The frontend will likely proxy or needs a full URL.
        // Let's assume standard web path for now.
        
        $logo = $branch['logo_primary_path'];
        // Quick clean up if it starts with dots
        $logo = str_replace('../', '/admin/', $logo); 
        // If it doesn't start with /admin/, prepend it (heuristic)
        if (strpos($logo, '/admin/') !== 0 && strpos($logo, 'http') !== 0) {
             $logo = '/admin/' . ltrim($logo, '/');
        }

        echo json_encode([
            "status" => "success",
            "data" => [
                "name" => $branch['branch_name'],
                "logo" => $logo
            ]
        ]);
    } else {
         echo json_encode(["status" => "error", "message" => "Branch not found"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
