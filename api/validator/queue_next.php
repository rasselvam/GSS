<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/env.php';

auth_require_login('validator');

auth_session_start();
$userId = (int)($_SESSION['auth_user_id'] ?? 0);

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$clientId = isset($input['client_id']) ? (int)$input['client_id'] : 0;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    if ($userId <= 0) {
        http_response_code(401);
        echo json_encode(['status' => 0, 'message' => 'Unauthorized']);
        exit;
    }

    $pdo = getDB();

    // Seed validator queue before listing mine/available
    $seed = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_EnsureQueue(?)');
    $seed->execute([$clientId > 0 ? $clientId : null]);
    while ($seed->nextRowset()) {
    }

    // For validator FIFO queue we allow pulling from all clients unless an explicit client_id is provided.
    // Some sessions may carry auth_client_id which would incorrectly restrict availability.

    // Prefer continuing an in-progress case already assigned to this user
    $mine = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_ListMine(?, ?, ?)');
    $mine->execute([$userId, $clientId > 0 ? $clientId : null, null]);
    $mineRows = $mine->fetchAll(PDO::FETCH_ASSOC) ?: [];
    while ($mine->nextRowset()) {
    }

    if (!empty($mineRows)) {
        $row = $mineRows[0];
        $appId = trim((string)($row['application_id'] ?? ''));
        $cid = (string)($row['client_id'] ?? '');
        $caseId = (string)($row['case_id'] ?? '');
        $view = app_url('/modules/validator/candidate_view.php');
        if ($appId !== '') {
            $view .= '?application_id=' . rawurlencode($appId);
        } else if ($caseId !== '') {
            $view .= '?case_id=' . rawurlencode($caseId);
        }
        if ($cid !== '') {
            $view .= (strpos($view, '?') !== false ? '&' : '?') . 'client_id=' . rawurlencode($cid);
        }
        echo json_encode(['status' => 1, 'message' => 'ok', 'data' => ['case' => $row, 'url' => $view]]);
        exit;
    }

    // Otherwise claim the oldest available
    $avail = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_ListAvailable(?, ?)');
    $avail->execute([$clientId > 0 ? $clientId : null, null]);
    $availRows = $avail->fetchAll(PDO::FETCH_ASSOC) ?: [];
    while ($avail->nextRowset()) {
    }

    if (empty($availRows)) {
        echo json_encode(['status' => 1, 'message' => 'No pending cases', 'data' => ['url' => null]]);
        exit;
    }

    $row = $availRows[0];
    $caseId = (int)($row['case_id'] ?? 0);

    $claim = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_ClaimCase(?, ?)');
    $claim->execute([$userId, $caseId]);
    $claimRow = $claim->fetch(PDO::FETCH_ASSOC) ?: [];
    while ($claim->nextRowset()) {
    }

    $affected = isset($claimRow['affected_rows']) ? (int)$claimRow['affected_rows'] : 0;
    if ($affected <= 0) {
        http_response_code(409);
        echo json_encode(['status' => 0, 'message' => 'Unable to claim case. Try again.']);
        exit;
    }

    $appId = trim((string)($row['application_id'] ?? ''));
    $cid = (string)($row['client_id'] ?? '');
    $caseIdStr = (string)($row['case_id'] ?? '');
    $view = app_url('/modules/validator/candidate_view.php');
    if ($appId !== '') {
        $view .= '?application_id=' . rawurlencode($appId);
    } else if ($caseIdStr !== '') {
        $view .= '?case_id=' . rawurlencode($caseIdStr);
    }
    if ($cid !== '') {
        $view .= (strpos($view, '?') !== false ? '&' : '?') . 'client_id=' . rawurlencode($cid);
    }

    echo json_encode(['status' => 1, 'message' => 'ok', 'data' => ['case' => $row, 'url' => $view]]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
