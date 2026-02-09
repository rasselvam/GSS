<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('verifier');

auth_session_start();

function verifier_allowed_sections_set(): array {
    $raw = isset($_SESSION['auth_allowed_sections']) ? (string)$_SESSION['auth_allowed_sections'] : '';
    $raw = strtolower(trim($raw));
    if ($raw === '*') return ['*' => true];
    if ($raw === '') return [];
    $parts = preg_split('/[\s,|]+/', $raw) ?: [];
    $out = [];
    foreach ($parts as $p) {
        $k = strtolower(trim((string)$p));
        if ($k === '') continue;
        $out[$k] = true;
    }
    return $out;
}

function verifier_can_group(array $set, string $groupKey): bool {
    if (isset($set['*'])) return true;
    $g = strtoupper(trim($groupKey));
    $need = $g === 'BASIC' ? ['basic', 'id', 'contact'] : ($g === 'EDUCATION' ? ['education', 'employment', 'reference'] : []);
    foreach ($need as $k) {
        if (isset($set[$k])) return true;
    }
    return false;
}

function get_str(string $key, string $default = ''): string {
    return trim((string)($_GET[$key] ?? $default));
}

function get_int(string $key, int $default = 0): int {
    return isset($_GET[$key]) && $_GET[$key] !== '' ? (int)$_GET[$key] : $default;
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

    $clientId = get_int('client_id', 0);
    $groupKey = strtoupper(get_str('group', ''));
    $search = get_str('search', '');

    if ($groupKey !== '' && !in_array($groupKey, ['BASIC', 'EDUCATION'], true)) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Invalid group']);
        exit;
    }

    if ($groupKey !== '') {
        $allowedSet = verifier_allowed_sections_set();
        if (!verifier_can_group($allowedSet, $groupKey)) {
            http_response_code(403);
            echo json_encode(['status' => 0, 'message' => 'Access denied']);
            exit;
        }
    }

    $pdo = getDB();

    // Pool vs Dedicated assignment rule
    try {
        $ruleStmt = $pdo->prepare(
            "SELECT mode, dedicated_user_id\n" .
            "  FROM Vati_Payfiller_VR_Assignment_Rules\n" .
            " WHERE is_active = 1\n" .
            "   AND (client_id <=> ?)\n" .
            "   AND UPPER(TRIM(group_key)) = ?\n" .
            " LIMIT 1"
        );
        $ruleStmt->execute([$clientId > 0 ? $clientId : null, $groupKey !== '' ? $groupKey : null]);
        $rule = $ruleStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        $mode = $rule ? strtolower(trim((string)($rule['mode'] ?? ''))) : '';
        $dedicatedUserId = $rule && isset($rule['dedicated_user_id']) ? (int)$rule['dedicated_user_id'] : 0;
        if ($mode === 'dedicated' && $dedicatedUserId > 0 && $dedicatedUserId !== $userId) {
            echo json_encode(['status' => 1, 'message' => 'ok', 'data' => []]);
            exit;
        }
    } catch (Throwable $e) {
        // ignore rule lookup if table not present
    }

    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_VR_ListAvailable(?, ?, ?, ?)');
    $stmt->execute([$userId, $clientId > 0 ? $clientId : null, $groupKey !== '' ? $groupKey : null, $search !== '' ? $search : null]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    while ($stmt->nextRowset()) {
    }

    echo json_encode(['status' => 1, 'message' => 'ok', 'data' => $rows]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
