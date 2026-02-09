<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth.php';

function audit_log_debug_enabled(): bool {
    return trim((string)(env_get('APP_AUDIT_LOG_DEBUG', '0') ?? '0')) === '1';
}

function audit_log_event(string $eventType, string $eventAction, string $status, array $payload = [], ?int $userId = null, ?string $role = null, ?int $clientId = null): void {
    $eventType = trim($eventType);
    $eventAction = trim($eventAction);
    $status = trim($status);

    if ($eventType === '' || $eventAction === '' || $status === '') {
        return;
    }

    try {
        auth_session_start();

        $sid = session_id();
        $uid = $userId !== null ? (int)$userId : (!empty($_SESSION['auth_user_id']) ? (int)$_SESSION['auth_user_id'] : 0);
        $uname = !empty($_SESSION['auth_user_name']) ? (string)$_SESSION['auth_user_name'] : '';
        $activeRole = $role !== null ? (string)$role : (!empty($_SESSION['auth_moduleAccess']) ? (string)$_SESSION['auth_moduleAccess'] : '');
        $cid = $clientId !== null ? (int)$clientId : (!empty($_SESSION['auth_client_id']) ? (int)$_SESSION['auth_client_id'] : 0);

        $ip = '';
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = trim((string)explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = trim((string)$_SERVER['REMOTE_ADDR']);
        }

        $ua = !empty($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : '';
        $path = !empty($_SERVER['REQUEST_URI']) ? (string)$_SERVER['REQUEST_URI'] : '';

        $safePayload = $payload;
        if (isset($safePayload['password'])) unset($safePayload['password']);
        if (isset($safePayload['otp'])) unset($safePayload['otp']);

        $payloadJson = '';
        try {
            $payloadJson = json_encode($safePayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (Throwable $e) {
            $payloadJson = '';
        }

        $pdo = getDB();
        $stmt = $pdo->prepare('CALL SP_GSS_AuditLog_Insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $eventType,
            $eventAction,
            $status,
            $uid,
            $uname,
            $activeRole,
            $cid,
            $ip,
            $ua,
            $path,
            $sid,
            $payloadJson
        ]);
        while ($stmt->nextRowset()) {
        }
        $stmt->closeCursor();
    } catch (Throwable $e) {
        if (audit_log_debug_enabled()) {
            @error_log('audit_log_event failed: ' . $e->getMessage());
        }
    }
}
