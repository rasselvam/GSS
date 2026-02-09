<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (empty($_SESSION['logged_in']) || empty($_SESSION['application_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 0, 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$current = trim((string)($input['current_password'] ?? ''));
$newp = trim((string)($input['new_password'] ?? ''));

if ($current === '' || $newp === '') {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => 'current_password and new_password are required']);
    exit;
}

if (strlen($newp) < 6) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => 'New password must be at least 6 characters']);
    exit;
}

$username = (string)($_SESSION['application_id'] ?? '');
$userId = !empty($_SESSION['candidate_user_id']) ? (int)$_SESSION['candidate_user_id'] : 0;

if ($userId <= 0 && $username !== '') {
    try {
        $pdo = getDB();
        $uidStmt = $pdo->prepare('SELECT user_id FROM Vati_Payfiller_Users WHERE username = ? AND is_active = 1 LIMIT 1');
        $uidStmt->execute([$username]);
        $userId = (int)($uidStmt->fetchColumn() ?: 0);
        if ($userId > 0) {
            $_SESSION['candidate_user_id'] = $userId;
        }
    } catch (Throwable $e) {
        $userId = 0;
    }
}

if ($userId <= 0) {
    http_response_code(401);
    echo json_encode(['status' => 0, 'message' => 'Unauthorized']);
    exit;
}

try {
    $pdo = getDB();
    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_ChangePassword(?, ?, ?)');
    $stmt->execute([$userId, $current, $newp]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    while ($stmt->nextRowset()) {
    }

    $ok = isset($row['ok']) ? (int)$row['ok'] : 0;
    if ($ok !== 1) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Current password is incorrect']);
        exit;
    }

    echo json_encode([
        'status' => 1,
        'message' => 'Password changed',
        'data' => [
            'redirect' => 'modules/candidate/index.php'
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
