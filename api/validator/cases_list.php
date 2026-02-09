<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('validator');
auth_session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function get_str(string $key, string $default = ''): string {
    return trim((string)($_GET[$key] ?? $default));
}

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

    $view = strtolower(get_str('view', 'mine'));
    $search = get_str('search', '');

    $pdo = getDB();

    // Ensure validator queue is seeded (candidate-submitted cases only) before listing.
    // Without this, the list can appear empty on new/clean environments.
    if ($view === 'available' || $view === 'mine') {
        $seed = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_EnsureQueue(?)');
        $seed->execute([null]);
        while ($seed->nextRowset()) {
        }
    }

    if ($view === 'available') {
        $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_ListAvailable(?, ?)');
        $stmt->execute([null, $search !== '' ? $search : null]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        while ($stmt->nextRowset()) {
        }
        echo json_encode(['status' => 1, 'message' => 'ok', 'data' => $rows]);
        exit;
    }

    if ($view === 'completed') {
        $params = [];
        $sql = "SELECT q.case_id, q.application_id, q.client_id, q.status, q.assigned_user_id, q.claimed_at, q.completed_at,\n" .
               "       c.candidate_first_name, c.candidate_last_name, c.candidate_email, c.candidate_mobile, c.case_status, c.created_at\n" .
               "  FROM Vati_Payfiller_Validator_Queue q\n" .
               "  JOIN Vati_Payfiller_Cases c ON c.case_id = q.case_id\n" .
               " WHERE (q.completed_at IS NOT NULL OR q.status = 'completed')";

        if ($search !== '') {
            $sql .= " AND (c.application_id LIKE ? OR c.candidate_first_name LIKE ? OR c.candidate_last_name LIKE ? OR c.candidate_email LIKE ? OR c.candidate_mobile LIKE ?)";
            $like = '%' . $search . '%';
            $params = [$like, $like, $like, $like, $like];
        }

        $sql .= " ORDER BY COALESCE(q.completed_at, q.claimed_at, c.created_at) DESC LIMIT 500";
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode(['status' => 1, 'message' => 'ok', 'data' => $rows]);
        exit;
    }

    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_ListMine(?, ?, ?)');
    $stmt->execute([$userId, null, $search !== '' ? $search : null]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    while ($stmt->nextRowset()) {
    }

    echo json_encode(['status' => 1, 'message' => 'ok', 'data' => $rows]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
