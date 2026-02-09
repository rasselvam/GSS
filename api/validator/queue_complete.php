<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('validator');
auth_session_start();
$userId = (int)($_SESSION['auth_user_id'] ?? 0);

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$caseId = isset($input['case_id']) ? (int)$input['case_id'] : 0;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    if ($userId <= 0) {
        http_response_code(401);
        echo json_encode(['status' => 0, 'message' => 'Unauthorized']);
        exit;
    }

    if ($caseId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'case_id is required']);
        exit;
    }

    $pdo = getDB();
    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_CompleteCase(?, ?)');
    $stmt->execute([$userId, $caseId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    while ($stmt->nextRowset()) {
    }

    $affected = isset($row['affected_rows']) ? (int)$row['affected_rows'] : 0;
    if ($affected <= 0) {
        http_response_code(409);
        echo json_encode(['status' => 0, 'message' => 'Not claimed by you or already completed']);
        exit;
    }

    // Best-effort: log to case timeline
    try {
        $log = $pdo->prepare('INSERT INTO Vati_Payfiller_Case_Timeline (application_id, actor_user_id, actor_role, event_type, section_key, message, created_at) SELECT application_id, ?, ?, ?, ?, ?, NOW() FROM Vati_Payfiller_Cases WHERE case_id = ? LIMIT 1');
        $log->execute([$userId, (string)($_SESSION['auth_moduleAccess'] ?? 'validator'), 'action', 'validator', 'Validator completed case', $caseId]);
    } catch (Throwable $e) {
    }

    echo json_encode(['status' => 1, 'message' => 'completed', 'data' => ['affected_rows' => $affected]]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
