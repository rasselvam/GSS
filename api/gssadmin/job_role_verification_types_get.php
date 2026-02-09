<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $jobRoleId = isset($_GET['job_role_id']) ? (int)$_GET['job_role_id'] : 0;
    if ($jobRoleId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'job_role_id is required']);
        exit;
    }

    $pdo = getDB();

    // New SP. If not installed, fallback: return all active verification types.
    try {
        $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_GetVerificationTypesByJobRole(?)');
        $stmt->execute([$jobRoleId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        while ($stmt->nextRowset()) {
        }
    } catch (Throwable $e) {
        $stmt2 = $pdo->prepare('CALL SP_Vati_Payfiller_GetAllActiveVerificationTypes()');
        $stmt2->execute();
        $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        while ($stmt2->nextRowset()) {
        }
    }

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'verification_type_id' => isset($r['verification_type_id']) ? (int)$r['verification_type_id'] : 0,
            'type_name' => (string)($r['type_name'] ?? ''),
            'type_category' => (string)($r['type_category'] ?? ''),
            'is_enabled' => isset($r['is_enabled']) ? (int)$r['is_enabled'] : 0,
            'sort_order' => isset($r['sort_order']) ? (int)$r['sort_order'] : 0,
            'required_count' => isset($r['required_count']) ? (int)$r['required_count'] : 1,
        ];
    }

    echo json_encode(['status' => 1, 'message' => 'ok', 'data' => $out]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
