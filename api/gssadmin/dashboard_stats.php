<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('gss_admin');

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

    $clientsTotal = (int)($pdo->query('SELECT COUNT(*) FROM Vati_Payfiller_Clients')->fetchColumn() ?: 0);

    $jobRolesTotal = 0;
    try {
        $jobRolesTotal = (int)($pdo->query('SELECT COUNT(*) FROM Vati_Payfiller_Job_Roles')->fetchColumn() ?: 0);
    } catch (Throwable $e) {
        $jobRolesTotal = 0;
    }

    $casesTotal = (int)($pdo->query('SELECT COUNT(*) FROM Vati_Payfiller_Cases')->fetchColumn() ?: 0);

    $caseStatuses = [
        'DRAFT' => 0,
        'IN_PROGRESS' => 0,
        'HOLD' => 0,
        'APPROVED' => 0,
        'REJECTED' => 0,
        'STOPPED' => 0
    ];

    $stmt = $pdo->query('SELECT case_status, COUNT(*) AS cnt FROM Vati_Payfiller_Cases GROUP BY case_status');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($rows as $r) {
        $k = strtoupper(trim((string)($r['case_status'] ?? '')));
        $cnt = isset($r['cnt']) ? (int)$r['cnt'] : 0;
        if ($k === '') continue;
        if (!isset($caseStatuses[$k])) {
            $caseStatuses[$k] = 0;
        }
        $caseStatuses[$k] += $cnt;
    }

    $inProgress = 0;
    foreach (['DRAFT', 'IN_PROGRESS', 'HOLD'] as $k) {
        $inProgress += (int)($caseStatuses[$k] ?? 0);
    }

    $completed = 0;
    foreach (['APPROVED', 'REJECTED', 'STOPPED'] as $k) {
        $completed += (int)($caseStatuses[$k] ?? 0);
    }

    $todayCreated = (int)($pdo->query('SELECT COUNT(*) FROM Vati_Payfiller_Cases WHERE DATE(created_at) = CURDATE()')->fetchColumn() ?: 0);

    $trend = [];
    $trendStmt = $pdo->query(
        'SELECT DATE(created_at) AS d, COUNT(*) AS cnt ' .
        'FROM Vati_Payfiller_Cases ' .
        'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) ' .
        'GROUP BY DATE(created_at) ' .
        'ORDER BY DATE(created_at) ASC'
    );
    $trendRows = $trendStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $trendMap = [];
    foreach ($trendRows as $tr) {
        $d = (string)($tr['d'] ?? '');
        if ($d === '') continue;
        $trendMap[$d] = (int)($tr['cnt'] ?? 0);
    }
    for ($i = 13; $i >= 0; $i--) {
        $d = (new DateTime())->modify('-' . $i . ' day')->format('Y-m-d');
        $trend[] = ['date' => $d, 'count' => (int)($trendMap[$d] ?? 0)];
    }

    $recentCases = [];
    $rcStmt = $pdo->query(
        'SELECT c.case_id, c.application_id, c.client_id, cl.customer_name, ' .
        'c.candidate_first_name, c.candidate_last_name, c.candidate_email, c.case_status, c.created_at ' .
        'FROM Vati_Payfiller_Cases c ' .
        'LEFT JOIN Vati_Payfiller_Clients cl ON cl.client_id = c.client_id ' .
        'ORDER BY c.created_at DESC LIMIT 8'
    );
    $recentCases = $rcStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $upcomingHolidays = [];
    try {
        $hStmt = $pdo->query(
            'SELECT holiday_id, holiday_date, holiday_name ' .
            'FROM Vati_Payfiller_Holidays ' .
            'WHERE is_active = 1 AND holiday_date >= CURDATE() AND holiday_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) ' .
            'ORDER BY holiday_date ASC LIMIT 6'
        );
        $upcomingHolidays = $hStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Throwable $e) {
        $upcomingHolidays = [];
    }

    echo json_encode([
        'status' => 1,
        'message' => 'ok',
        'data' => [
            'kpis' => [
                'clients_total' => $clientsTotal,
                'job_roles_total' => $jobRolesTotal,
                'cases_total' => $casesTotal,
                'cases_in_progress' => $inProgress,
                'cases_completed' => $completed,
                'cases_created_today' => $todayCreated
            ],
            'cases_by_status' => $caseStatuses,
            'cases_trend_14d' => $trend,
            'recent_cases' => $recentCases,
            'upcoming_holidays' => $upcomingHolidays
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
