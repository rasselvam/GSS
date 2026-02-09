<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('validator');
auth_session_start();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $userId = (int)($_SESSION['auth_user_id'] ?? 0);
    if ($userId <= 0) {
        http_response_code(401);
        echo json_encode(['status' => 0, 'message' => 'Unauthorized']);
        exit;
    }

    $pdo = getDB();
    $stmt = $pdo->prepare(
        "SELECT q.case_id, q.application_id, q.client_id, q.status, q.assigned_user_id, q.claimed_at, q.completed_at,\n" .
        "       c.candidate_first_name, c.candidate_last_name, c.candidate_email, c.candidate_mobile, c.case_status, c.created_at\n" .
        "  FROM Vati_Payfiller_Validator_Queue q\n" .
        "  JOIN Vati_Payfiller_Cases c ON c.case_id = q.case_id\n" .
        " WHERE q.assigned_user_id = ? AND q.completed_at IS NULL\n" .
        " ORDER BY q.claimed_at DESC, c.created_at ASC\n" .
        " LIMIT 10"
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    echo json_encode(['status' => 1, 'message' => 'ok', 'data' => $rows]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
