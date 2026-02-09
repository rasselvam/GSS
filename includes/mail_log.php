<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/db.php';

function mail_log_debug_enabled(): bool {
    return trim((string)(env_get('APP_MAIL_LOG_DEBUG', '0') ?? '0')) === '1';
}

function mail_log_event(string $status, string $driver, ?string $fromEmail, ?string $toEmail, ?string $subject, array $meta = [], ?string $errorMessage = null): void {
    $status = trim($status);
    $driver = trim($driver);

    if ($status === '') return;
    if ($driver === '') $driver = 'mail';

    try {
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }

        $sid = session_id();
        $uid = !empty($_SESSION['auth_user_id']) ? (int)$_SESSION['auth_user_id'] : null;
        $uname = !empty($_SESSION['auth_user_name']) ? (string)$_SESSION['auth_user_name'] : null;
        $cid = !empty($_SESSION['auth_client_id']) ? (int)$_SESSION['auth_client_id'] : null;

        $ip = null;
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = trim((string)explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = trim((string)$_SERVER['REMOTE_ADDR']);
        }

        $ua = !empty($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : null;
        $path = !empty($_SERVER['REQUEST_URI']) ? (string)$_SERVER['REQUEST_URI'] : null;

        $templateId = isset($meta['template_id']) ? (int)$meta['template_id'] : null;
        $applicationId = isset($meta['application_id']) ? trim((string)$meta['application_id']) : null;
        $caseId = isset($meta['case_id']) ? (int)$meta['case_id'] : null;
        $moduleRole = isset($meta['role']) ? trim((string)$meta['role']) : null;
        $groupKey = isset($meta['group']) ? trim((string)$meta['group']) : null;

        if ($templateId !== null && $templateId <= 0) $templateId = null;
        if ($caseId !== null && $caseId <= 0) $caseId = null;
        if ($applicationId !== null && $applicationId === '') $applicationId = null;
        if ($moduleRole !== null && $moduleRole === '') $moduleRole = null;
        if ($groupKey !== null && $groupKey === '') $groupKey = null;

        $safeMeta = $meta;
        if (isset($safeMeta['password'])) unset($safeMeta['password']);
        if (isset($safeMeta['otp'])) unset($safeMeta['otp']);
        if (isset($safeMeta['html'])) unset($safeMeta['html']);
        if (isset($safeMeta['body'])) unset($safeMeta['body']);

        $metaJson = null;
        try {
            $metaJson = json_encode($safeMeta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (Throwable $e) {
            $metaJson = null;
        }

        $pdo = getDB();
        $stmt = $pdo->prepare('CALL SP_GSS_MailLog_Insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $status,
            $driver,
            $fromEmail !== null ? trim($fromEmail) : '',
            $toEmail !== null ? trim($toEmail) : '',
            $subject !== null ? mb_substr(trim($subject), 0, 255) : '',
            $templateId !== null ? $templateId : 0,
            $applicationId !== null ? $applicationId : '',
            $caseId !== null ? $caseId : 0,
            $moduleRole !== null ? $moduleRole : '',
            $groupKey !== null ? $groupKey : '',
            $uid !== null ? (int)$uid : 0,
            $uname !== null ? (string)$uname : '',
            $cid !== null ? (int)$cid : 0,
            $ip !== null ? (string)$ip : '',
            $ua !== null ? (string)$ua : '',
            $path !== null ? (string)$path : '',
            $sid !== '' ? $sid : '',
            $errorMessage !== null ? trim($errorMessage) : '',
            $metaJson !== null ? $metaJson : ''
        ]);
        while ($stmt->nextRowset()) {
        }
        $stmt->closeCursor();
    } catch (Throwable $e) {
        if (mail_log_debug_enabled()) {
            @error_log('mail_log_event failed: ' . $e->getMessage());
        }
    }
}
