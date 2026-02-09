<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_any_access(['qa', 'team_lead']);
auth_session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $applicationId = isset($input['application_id']) ? trim((string)$input['application_id']) : '';
    $event = isset($input['event']) ? strtolower(trim((string)$input['event'])) : '';
    $meta = isset($input['meta']) ? $input['meta'] : null;

    if ($applicationId === '' || $event === '') {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'application_id and event are required']);
        exit;
    }

    $allowed = ['view', 'open', 'print', 'export', 'download'];
    if (!in_array($event, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Invalid event']);
        exit;
    }

    $userId = !empty($_SESSION['auth_user_id']) ? (int)$_SESSION['auth_user_id'] : 0;
    $role = !empty($_SESSION['auth_moduleAccess']) ? (string)$_SESSION['auth_moduleAccess'] : 'qa';

    $pdo = getDB();

    // Ensure application exists (prevents junk logging)
    $st = $pdo->prepare('SELECT case_id FROM Vati_Payfiller_Cases WHERE application_id = ? LIMIT 1');
    $st->execute([$applicationId]);
    $row = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    if (!$row) {
        http_response_code(404);
        echo json_encode(['status' => 0, 'message' => 'Case not found']);
        exit;
    }

    $msg = 'TL Audit: ' . strtoupper($event);

    $metaJson = null;
    if ($meta !== null) {
        $json = json_encode($meta);
        if ($json !== false) {
            $metaJson = $json;
        }
    }

    $ins = $pdo->prepare('INSERT INTO Vati_Payfiller_Case_Timeline (application_id, actor_user_id, actor_role, event_type, section_key, message, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
    $ins->execute([
        $applicationId,
        $userId > 0 ? $userId : null,
        $role,
        'audit',
        'report',
        $msg,
        $metaJson
    ]);

    echo json_encode(['status' => 1, 'message' => 'ok']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
