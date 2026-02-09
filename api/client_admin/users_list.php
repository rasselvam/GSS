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

function get_str(string $key, string $default = ''): string {
    return trim((string)($_GET[$key] ?? $default));
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
    $search = get_str('search', '');
    $group = strtolower(get_str('group', ''));

    $pdo = getDB();

    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_GetUsers(?, ?)');
    $stmt->execute([$clientId, $search !== '' ? $search : null]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    while ($stmt->nextRowset()) {
    }

    // Never show candidate accounts in Users list
    $filteredBase = [];
    foreach ($rows as $r) {
        $role = strtolower(trim((string)($r['role'] ?? '')));
        if ($role === 'candidate') continue;
        $filteredBase[] = $r;
    }
    $rows = $filteredBase;

    $staffRoles = ['gss_admin' => true, 'verifier' => true, 'db_verifier' => true, 'qa' => true];
    if ($group === 'staff' || $group === 'client') {
        $filtered = [];
        foreach ($rows as $r) {
            $role = strtolower(trim((string)($r['role'] ?? '')));
            $isStaff = isset($staffRoles[$role]);
            if ($group === 'staff' && !$isStaff) continue;
            if ($group === 'client' && $isStaff) continue;
            $filtered[] = $r;
        }
        $rows = $filtered;
    }

    echo json_encode([
        'status' => 1,
        'message' => 'ok',
        'data' => $rows
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
