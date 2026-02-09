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

function get_int(string $key, int $default = 0): int {
    return isset($_GET[$key]) && $_GET[$key] !== '' ? (int)$_GET[$key] : $default;
}

function get_str(string $key, string $default = ''): string {
    return trim((string)($_GET[$key] ?? $default));
}

function resolve_user_id(): int {
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }

    if (!empty($_SESSION['auth_user_id'])) {
        return (int)$_SESSION['auth_user_id'];
    }

    // UI-first fallback (until login is fully enforced)
    return isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $mode = strtolower(get_str('mode', 'available')); // available | mine
    $clientId = get_int('client_id', 0);
    $search = get_str('search', '');

    $userId = resolve_user_id();
    if ($mode === 'mine' && $userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'user_id missing (login not detected)']);
        exit;
    }

    $pdo = getDB();
    $rows = [];

    if ($mode === 'available') {
        $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_DBV_ListAvailable(?, ?)');
        $stmt->execute([$clientId, $search]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $stmt->closeCursor();
    } elseif ($mode === 'mine') {
        $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_DBV_ListMine(?, ?, ?)');
        $stmt->execute([$userId, $clientId, $search]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $stmt->closeCursor();
    } else {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Invalid mode']);
        exit;
    }

    echo json_encode([
        'status' => 1,
        'message' => 'OK',
        'data' => $rows
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
