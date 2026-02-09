<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('verifier');
auth_session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function allowed_sections_set(): array {
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

function compute_allowed_groups(array $set): array {
    if (isset($set['*'])) return ['BASIC', 'EDUCATION'];

    $basicKeys = ['basic', 'id', 'contact'];
    $eduKeys = ['education', 'employment', 'reference'];

    $hasBasic = false;
    foreach ($basicKeys as $k) {
        if (isset($set[$k])) { $hasBasic = true; break; }
    }

    $hasEdu = false;
    foreach ($eduKeys as $k) {
        if (isset($set[$k])) { $hasEdu = true; break; }
    }

    $out = [];
    if ($hasBasic) $out[] = 'BASIC';
    if ($hasEdu) $out[] = 'EDUCATION';
    return $out;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $set = allowed_sections_set();
    $groups = compute_allowed_groups($set);

    echo json_encode([
        'status' => 1,
        'message' => 'ok',
        'data' => [
            'allowed_sections' => isset($set['*']) ? '*' : implode(',', array_keys($set)),
            'allowed_groups' => $groups
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
