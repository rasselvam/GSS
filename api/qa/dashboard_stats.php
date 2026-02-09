<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_any_access(['qa', 'team_lead']);
auth_session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $pdo = getDB();

    $usersByRole = [];
    $stmt = $pdo->query(
        "SELECT LOWER(TRIM(role)) AS role, COUNT(*) AS cnt\n" .
        "FROM Vati_Payfiller_Users\n" .
        "WHERE is_active = 1\n" .
        "GROUP BY LOWER(TRIM(role))"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($rows as $r) {
        $k = (string)($r['role'] ?? '');
        if ($k === '') continue;
        $usersByRole[$k] = (int)($r['cnt'] ?? 0);
    }

    $usersTotal = 0;
    foreach ($usersByRole as $cnt) {
        $usersTotal += (int)$cnt;
    }

    // Verifier group queue workload (active claims)
    $vrWorkload = [];
    try {
        $stmt = $pdo->query(
            "SELECT q.assigned_user_id AS user_id, u.username, u.first_name, u.last_name, LOWER(TRIM(u.role)) AS role,\n" .
            "       COUNT(*) AS open_items\n" .
            "FROM Vati_Payfiller_Verifier_Group_Queue q\n" .
            "JOIN Vati_Payfiller_Users u ON u.user_id = q.assigned_user_id\n" .
            "WHERE q.assigned_user_id IS NOT NULL AND q.completed_at IS NULL\n" .
            "GROUP BY q.assigned_user_id, u.username, u.first_name, u.last_name, u.role\n" .
            "ORDER BY open_items DESC"
        );
        $vrWorkload = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Throwable $e) {
        $vrWorkload = [];
    }

    // DBV workload (active claims)
    $dbvWorkload = [];
    try {
        $stmt = $pdo->query(
            "SELECT c.dbv_assigned_user_id AS user_id, u.username, u.first_name, u.last_name, LOWER(TRIM(u.role)) AS role,\n" .
            "       COUNT(*) AS open_items\n" .
            "FROM Vati_Payfiller_Cases c\n" .
            "JOIN Vati_Payfiller_Users u ON u.user_id = c.dbv_assigned_user_id\n" .
            "WHERE c.dbv_assigned_user_id IS NOT NULL AND c.dbv_completed_at IS NULL\n" .
            "GROUP BY c.dbv_assigned_user_id, u.username, u.first_name, u.last_name, u.role\n" .
            "ORDER BY open_items DESC"
        );
        $dbvWorkload = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Throwable $e) {
        $dbvWorkload = [];
    }

    // Live assignments list (VR queue + DBV)
    $assignments = [];
    try {
        $stmt = $pdo->query(
            "(\n" .
            "  SELECT 'VR' AS queue_type, q.group_key, q.status AS queue_status, q.claimed_at AS assigned_at,\n" .
            "         c.case_id, c.application_id, c.case_status,\n" .
            "         u.user_id, u.username, u.first_name, u.last_name, LOWER(TRIM(u.role)) AS role\n" .
            "    FROM Vati_Payfiller_Verifier_Group_Queue q\n" .
            "    JOIN Vati_Payfiller_Cases c ON c.case_id = q.case_id\n" .
            "    JOIN Vati_Payfiller_Users u ON u.user_id = q.assigned_user_id\n" .
            "   WHERE q.assigned_user_id IS NOT NULL AND q.completed_at IS NULL\n" .
            ")\n" .
            "UNION ALL\n" .
            "(\n" .
            "  SELECT 'DBV' AS queue_type, NULL AS group_key, NULL AS queue_status, c.dbv_claimed_at AS assigned_at,\n" .
            "         c.case_id, c.application_id, c.case_status,\n" .
            "         u.user_id, u.username, u.first_name, u.last_name, LOWER(TRIM(u.role)) AS role\n" .
            "    FROM Vati_Payfiller_Cases c\n" .
            "    JOIN Vati_Payfiller_Users u ON u.user_id = c.dbv_assigned_user_id\n" .
            "   WHERE c.dbv_assigned_user_id IS NOT NULL AND c.dbv_completed_at IS NULL\n" .
            ")\n" .
            "ORDER BY assigned_at DESC\n" .
            "LIMIT 120"
        );
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Throwable $e) {
        $assignments = [];
    }

    echo json_encode([
        'status' => 1,
        'message' => 'ok',
        'data' => [
            'kpis' => [
                'users_total' => $usersTotal,
                'users_by_role' => $usersByRole,
                'verifier_queue_open_total' => array_sum(array_map(fn($r) => (int)($r['open_items'] ?? 0), $vrWorkload)),
                'dbv_open_total' => array_sum(array_map(fn($r) => (int)($r['open_items'] ?? 0), $dbvWorkload)),
            ],
            'workload' => [
                'vr' => $vrWorkload,
                'dbv' => $dbvWorkload,
            ],
            'assignments' => $assignments
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
