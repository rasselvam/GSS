<?php
header('Content-Type: application/json');
session_start();
require_once $_SERVER['DOCUMENT_ROOT'] . "/config/db.php";

$page = $_GET['page'] ?? '';
$application_id = $_SESSION['application_id'] ?? null;

if (!$application_id) {
    echo json_encode(['success' => false, 'message' => 'No application ID']);
    exit;
}

try {
    $pdo = getDB();
    $data = [];

    switch ($page) {
        case 'basic-details':
            $stmt = $pdo->prepare(
                "SELECT * FROM Vati_Payfiller_Candidate_Basic_details WHERE application_id = ?"
            );
            $stmt->execute([$application_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row) {
                $data = $row;
                // Split mobile number if needed
                if (!empty($row['mobile'])) {
                    $parts = explode(' ', $row['mobile'], 2);
                    $data['mobile_country_code'] = $parts[0] ?? '+91';
                    $data['mobile'] = $parts[1] ?? '';
                }
            }
            break;
            
        case 'identification':
            $stmt = $pdo->prepare(
                "SELECT * FROM Vati_Payfiller_Identification_details WHERE application_id = ? ORDER BY document_index"
            );
            $stmt->execute([$application_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        // Add other cases for other pages...
    }

    echo json_encode(['success' => true, 'data' => $data]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}