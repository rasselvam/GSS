<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('client_admin');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function get_int(string $key, int $default = 0): int {
    return isset($_GET[$key]) && $_GET[$key] !== '' ? (int)$_GET[$key] : $default;
}

function resolve_client_id(): int {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $cid = isset($_SESSION['auth_client_id']) ? (int)$_SESSION['auth_client_id'] : 0;
    if ($cid > 0) return $cid;

    http_response_code(401);
    echo json_encode(['status' => 0, 'message' => 'Unauthorized']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $clientId = resolve_client_id();

    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'user_id is required']);
        exit;
    }

    $pdo = getDB();

    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_GetUserById(?)');
    $stmt->execute([$userId]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    while ($stmt->nextRowset()) {
    }

    if (!$row) {
        http_response_code(404);
        echo json_encode(['status' => 0, 'message' => 'User not found']);
        exit;
    }

    $rowClientId = isset($row['client_id']) ? (int)$row['client_id'] : 0;
    if ($rowClientId !== $clientId) {
        http_response_code(403);
        echo json_encode(['status' => 0, 'message' => 'Forbidden']);
        exit;
    }

    try {
        $locStmt = $pdo->prepare('CALL SP_Vati_Payfiller_GetUserLocationsByUser(?)');
        $locStmt->execute([$userId]);
        $locRows = $locStmt->fetchAll(PDO::FETCH_ASSOC);
        while ($locStmt->nextRowset()) {
        }

        $names = [];
        foreach ($locRows as $lr) {
            $n = trim((string)($lr['location_name'] ?? ''));
            if ($n === '') continue;
            $names[] = $n;
        }
        if (!empty($names)) {
            $row['locations'] = $names;
        }
    } catch (Throwable $e) {
    }

    echo json_encode([
        'status' => 1,
        'message' => 'ok',
        'data' => $row
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
