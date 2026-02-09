<?php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/mail_log.php';

$autoload = __DIR__ . '/../vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;
}

function app_mail_debug_enabled(): bool {
    return trim((string)(env_get('APP_MAIL_DEBUG', '0') ?? '0')) === '1';
}

function app_mail_debug_log(string $message): void {
    if (!app_mail_debug_enabled()) return;

    $prefix = '[' . date('Y-m-d H:i:s') . '] ';
    $line = $prefix . $message . "\r\n";

    $configured = trim((string)(env_get('APP_MAIL_DEBUG_LOG', '') ?? ''));
    $default = realpath(__DIR__ . '/..');
    $defaultLog = $default ? ($default . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'mail.log') : '';
    $logFile = $configured !== '' ? $configured : $defaultLog;

    if ($logFile !== '') {
        $dir = dirname($logFile);
        if (is_dir($dir) && is_writable($dir)) {
            @error_log($line, 3, $logFile);
            return;
        }
    }

    @error_log($line);
}

function app_mail_set_log_meta(array $meta): void {
    $GLOBALS['APP_MAIL_LOG_META'] = $meta;
}

function app_mail_clear_log_meta(): void {
    $GLOBALS['APP_MAIL_LOG_META'] = [];
}

function app_mail_get_log_meta(): array {
    $m = $GLOBALS['APP_MAIL_LOG_META'] ?? [];
    return is_array($m) ? $m : [];
}

function send_app_mail(string $to, string $subject, string $htmlBody, ?string $fromName = null): bool {
    $to = trim($to);
    $meta = app_mail_get_log_meta();
    $driver = strtolower(trim((string)(env_get('APP_MAIL_DRIVER', 'mail') ?? 'mail')));

    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        mail_log_event('failed', $driver, (string)(env_get('APP_MAIL_FROM', '') ?? ''), $to, $subject, $meta, 'Invalid recipient email');
        return false;
    }

    $fromEmail = (string)(env_get('APP_MAIL_FROM', '') ?? '');
    if ($fromEmail === '' || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
        mail_log_event('failed', $driver, $fromEmail, $to, $subject, $meta, 'Invalid from email');
        return false;
    }

    $envFromName = (string)(env_get('APP_MAIL_FROM_NAME', '') ?? '');
    $effectiveFromName = trim((string)($fromName ?? ''));
    if ($effectiveFromName === '' && $envFromName !== '') $effectiveFromName = $envFromName;
    if ($effectiveFromName === '') $effectiveFromName = 'VATI GSS';

    $effectiveFromName = str_replace(["\r", "\n"], '', $effectiveFromName);
    $fromEmail = str_replace(["\r", "\n"], '', $fromEmail);

    $encodedSubject = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n")
        : $subject;

    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . $effectiveFromName . ' <' . $fromEmail . '>';
    $headers[] = 'Reply-To: ' . $effectiveFromName . ' <' . $fromEmail . '>';
    $headers[] = 'X-Mailer: PHP/' . PHP_VERSION;

    if (app_mail_debug_enabled()) {
        app_mail_debug_log('autoload=' . (is_file(__DIR__ . '/../vendor/autoload.php') ? 'present' : 'missing') . ', driver=' . $driver);
        app_mail_debug_log('php=' . PHP_VERSION);
    }

    if ($driver === 'smtp' && class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        try {
            $host = trim((string)(env_get('APP_MAIL_HOST', '') ?? ''));
            $port = (int)(env_get('APP_MAIL_PORT', '587') ?? '587');
            $username = (string)(env_get('APP_MAIL_USERNAME', '') ?? '');
            $password = (string)(env_get('APP_MAIL_PASSWORD', '') ?? '');
            $encryption = strtolower(trim((string)(env_get('APP_MAIL_ENCRYPTION', 'tls') ?? 'tls')));

            app_mail_debug_log('smtp host=' . $host . ', port=' . $port . ', user=' . $username . ', enc=' . $encryption);

            if ($host === '' || $username === '' || $password === '') return false;

            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->SMTPAuth = true;
            $mail->Username = $username;
            $mail->Password = $password;
            $mail->Port = $port;

            if ($encryption === 'ssl' || $encryption === 'smtps') {
                $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($encryption === 'tls' || $encryption === 'starttls') {
                $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = false;
                $mail->SMTPAutoTLS = false;
            }

            $mail->CharSet = 'UTF-8';
            $mail->setFrom($fromEmail, $effectiveFromName);
            $mail->addAddress($to);
            $mail->addReplyTo($fromEmail, $effectiveFromName);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = strip_tags($htmlBody);

            $ok = $mail->send();
            mail_log_event($ok ? 'sent' : 'failed', $driver, $fromEmail, $to, $subject, $meta, $ok ? null : 'SMTP send failed');
            return $ok;
        } catch (Throwable $e) {
            app_mail_debug_log('smtp exception: ' . $e->getMessage());
            mail_log_event('failed', $driver, $fromEmail, $to, $subject, $meta, 'SMTP exception: ' . $e->getMessage());
            return false;
        }
    }

    if ($driver === 'smtp' && !class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        app_mail_debug_log('smtp requested but PHPMailer class not found. Did you upload vendor/?');
    }

    $params = '-f' . $fromEmail;
    $ok = @mail($to, $encodedSubject, $htmlBody, implode("\r\n", $headers), $params);
    mail_log_event($ok ? 'sent' : 'failed', $driver, $fromEmail, $to, $subject, $meta, $ok ? null : 'mail() returned false');
    return $ok;
}
