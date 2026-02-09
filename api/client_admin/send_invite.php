<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/mail.php';

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

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function post_int(string $key, int $default = 0): int {
    return isset($_POST[$key]) && $_POST[$key] !== '' ? (int)$_POST[$key] : $default;
}

function new_token(): string {
    try {
        return bin2hex(random_bytes(16));
    } catch (Throwable $e) {
        return bin2hex(openssl_random_pseudo_bytes(16));
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $caseId = post_int('case_id', 0);
    if ($caseId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'case_id is required']);
        exit;
    }

    $pdo = getDB();

    $clientId = resolve_client_id();

    $stmt = $pdo->prepare('SELECT client_id, candidate_email, candidate_first_name, candidate_last_name FROM Vati_Payfiller_Cases WHERE case_id = ?');
    $stmt->execute([$caseId]);
    $case = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$case) {
        http_response_code(404);
        echo json_encode(['status' => 0, 'message' => 'Case not found']);
        exit;
    }

    $caseClientId = isset($case['client_id']) ? (int)$case['client_id'] : 0;
    if ($caseClientId !== $clientId) {
        http_response_code(403);
        echo json_encode(['status' => 0, 'message' => 'Forbidden']);
        exit;
    }

    $token = new_token();

    $sp = $pdo->prepare('CALL SP_Vati_Payfiller_SetCaseInvite(?, ?)');
    $sp->execute([$caseId, $token]);
    $row = $sp->fetch(PDO::FETCH_ASSOC) ?: [];
    while ($sp->nextRowset()) {
    }

    $affected = isset($row['affected_rows']) ? (int)$row['affected_rows'] : 0;
    if ($affected <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Invite could not be saved']);
        exit;
    }

    $inviteUrl = app_url('/modules/candidate/login.php?token=' . urlencode($token));

    $to = (string)$case['candidate_email'];
    $candidateName = trim((string)($case['candidate_first_name'] ?? '') . ' ' . (string)($case['candidate_last_name'] ?? ''));

    $subject = 'Background Verification - Candidate Invitation';
    $safeName = htmlspecialchars($candidateName);
    $safeUrl = htmlspecialchars($inviteUrl);
    $body = ''
        . '<div style="font-family:Arial, sans-serif; font-size:14px; color:#0f172a; line-height:1.5;">'
        . '<p>Hello ' . $safeName . ',</p>'
        . '<p>You have been invited to complete your Background Verification.</p>'
        . '<p><a href="' . $safeUrl . '" style="display:inline-block; padding:10px 14px; background:#2563eb; color:#fff; text-decoration:none; border-radius:10px; font-weight:700;">Start Verification</a></p>'
        . '<p style="font-size:12px; color:#64748b;">If the button does not work, copy and paste this link into your browser:<br>'
        . '<span style="word-break:break-all;">' . $safeUrl . '</span></p>'
        . '<p>Thanks,<br>VATI GSS</p>'
        . '</div>';

    $sent = send_app_mail($to, $subject, $body, 'VATI GSS');

    echo json_encode([
        'status' => 1,
        'message' => $sent ? 'Invite sent successfully.' : 'Invite saved. Email sending not configured on server.',
        'data' => [
            'case_id' => $caseId,
            'invite_token' => $token,
            'invite_url' => $inviteUrl,
            'email_sent' => $sent ? 1 : 0
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
