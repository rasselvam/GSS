<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('client_admin');
auth_session_start();

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
    $pdo = getDB();

    $totalStmt = $pdo->prepare('SELECT COUNT(*) AS c FROM Vati_Payfiller_Cases WHERE client_id = ?');
    $totalStmt->execute([$clientId]);
    $total = (int)(($totalStmt->fetch(PDO::FETCH_ASSOC) ?: [])['c'] ?? 0);

    $statusStmt = $pdo->prepare('SELECT UPPER(TRIM(case_status)) AS s, COUNT(*) AS c FROM Vati_Payfiller_Cases WHERE client_id = ? GROUP BY UPPER(TRIM(case_status))');
    $statusStmt->execute([$clientId]);
    $statusRows = $statusStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $byStatus = [];
    foreach ($statusRows as $r) {
        $k = (string)($r['s'] ?? '');
        $k = $k !== '' ? $k : 'UNKNOWN';
        $byStatus[$k] = (int)($r['c'] ?? 0);
    }

    $get = function (array $map, array $keys): int {
        $sum = 0;
        foreach ($keys as $k) {
            $k = strtoupper(trim((string)$k));
            if ($k !== '' && isset($map[$k])) $sum += (int)$map[$k];
        }
        return $sum;
    };

    $kpi = [
        'total' => $total,
        'awaiting' => $get($byStatus, ['AWAITING', 'PENDING', 'NEW', 'INVITED', 'SUBMITTED', 'READY_FOR_VERIFIER']),
        'wip' => $get($byStatus, ['WIP', 'IN PROGRESS', 'IN_PROGRESS', 'IN-PROGRESS', 'RUNNING']),
        'bgv_stop' => $get($byStatus, ['BGV STOP', 'BGV_STOP', 'STOPPED', 'STOP', 'HOLD']),
        'completed_clear' => $get($byStatus, ['APPROVED', 'VERIFIED', 'COMPLETED', 'CLEAR']),
        'unable_to_verify' => $get($byStatus, ['UNABLE TO VERIFY', 'UNABLE_TO_VERIFY', 'UTV']),
        'discrepancy' => $get($byStatus, ['DISCREPANCY', 'DISCREPANCY FOUND', 'REJECTED']),
        'insufficient' => $get($byStatus, ['INSUFFICIENT', 'INSUFF', 'INSUFFICIENCY'])
    ];

    $trendStmt = $pdo->prepare(
        'SELECT DATE(created_at) AS d, COUNT(*) AS c '
        . 'FROM Vati_Payfiller_Cases '
        . 'WHERE client_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) '
        . 'GROUP BY DATE(created_at) '
        . 'ORDER BY d ASC'
    );
    $trendStmt->execute([$clientId]);
    $trendRows = $trendStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $trendMap = [];
    foreach ($trendRows as $r) {
        $d = (string)($r['d'] ?? '');
        if ($d === '') continue;
        $trendMap[$d] = (int)($r['c'] ?? 0);
    }

    $trend = [];
    for ($i = 13; $i >= 0; $i--) {
        $d = (new DateTimeImmutable('today'))->sub(new DateInterval('P' . $i . 'D'))->format('Y-m-d');
        $trend[] = ['date' => $d, 'count' => (int)($trendMap[$d] ?? 0)];
    }

    $ageStmt = $pdo->prepare(
        'SELECT '
        . 'SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(created_at)) BETWEEN 0 AND 6 THEN 1 ELSE 0 END) AS b0_6, '
        . 'SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(created_at)) BETWEEN 7 AND 12 THEN 1 ELSE 0 END) AS b7_12, '
        . 'SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(created_at)) BETWEEN 13 AND 24 THEN 1 ELSE 0 END) AS b13_24, '
        . 'SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(created_at)) >= 25 THEN 1 ELSE 0 END) AS b25p '
        . 'FROM Vati_Payfiller_Cases '
        . 'WHERE client_id = ?'
    );
    $ageStmt->execute([$clientId]);
    $age = $ageStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $ageing = [
        '0_6' => (int)($age['b0_6'] ?? 0),
        '7_12' => (int)($age['b7_12'] ?? 0),
        '13_24' => (int)($age['b13_24'] ?? 0),
        '25_plus' => (int)($age['b25p'] ?? 0)
    ];

    echo json_encode([
        'status' => 1,
        'message' => 'ok',
        'data' => [
            'kpi' => $kpi,
            'by_status' => $byStatus,
            'trend' => $trend,
            'ageing' => $ageing
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
