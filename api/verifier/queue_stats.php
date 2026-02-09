<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('verifier');

auth_session_start();
$userId = (int)($_SESSION['auth_user_id'] ?? 0);
$clientId = 0;

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

try {
    $pdo = getDB();

    // Ensure queue exists (all clients) so verifier dashboard doesn't appear empty
    $ensure = $pdo->prepare('CALL SP_Vati_Payfiller_VR_EnsureGroupQueue(?)');
    $ensure->execute([$clientId > 0 ? $clientId : null]);
    while ($ensure->nextRowset()) {
    }

    $stmt = $pdo->prepare(
        'SELECT group_key, ' .
        'SUM(CASE WHEN completed_at IS NULL AND assigned_user_id IS NULL THEN 1 ELSE 0 END) AS pending, ' .
        'SUM(CASE WHEN completed_at IS NULL AND assigned_user_id = ? AND LOWER(TRIM(status)) = \'followup\' THEN 1 ELSE 0 END) AS followup, ' .
        'SUM(CASE WHEN completed_at IS NULL AND assigned_user_id = ? AND (LOWER(TRIM(status)) <> \'followup\' OR status IS NULL OR TRIM(status) = \'\') THEN 1 ELSE 0 END) AS in_progress, ' .
        'SUM(CASE WHEN completed_at IS NOT NULL AND assigned_user_id = ? THEN 1 ELSE 0 END) AS completed_total, ' .
        'SUM(CASE WHEN completed_at IS NOT NULL AND assigned_user_id = ? AND DATE(completed_at) = CURDATE() THEN 1 ELSE 0 END) AS completed_today ' .
        'FROM Vati_Payfiller_Verifier_Group_Queue ' .
        'WHERE (? = 0 OR client_id = ?) ' .
        'GROUP BY group_key'
    );
    $stmt->execute([$userId, $userId, $userId, $userId, $clientId, $clientId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $allowedSet = verifier_allowed_sections_set();
    $rows = array_values(array_filter($rows, function ($r) use ($allowedSet) {
        $g = isset($r['group_key']) ? (string)$r['group_key'] : '';
        return verifier_can_group($allowedSet, $g);
    }));

    echo json_encode(['status' => 1, 'message' => 'ok', 'data' => $rows]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
