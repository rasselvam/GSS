<?php
require_once __DIR__ . '/../config/env.php';

function auth_session_start(): void {
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
}

function auth_user_id(): int {
    auth_session_start();
    return !empty($_SESSION['auth_user_id']) ? (int)$_SESSION['auth_user_id'] : 0;
}

function auth_module_access(): string {
    auth_session_start();
    return !empty($_SESSION['auth_moduleAccess']) ? (string)$_SESSION['auth_moduleAccess'] : '';
}

function auth_is_logged_in(): bool {
    return auth_user_id() > 0;
}

function auth_has_access(string $required): bool {
    $required = trim($required);
    if ($required === '') return true;

    $access = strtolower(auth_module_access());
    $required = strtolower($required);

    if ($access === '') return false;
    if ($access === $required) return true;

    $parts = preg_split('/[\s,|]+/', $access) ?: [];
    foreach ($parts as $p) {
        if (trim($p) === $required) return true;
    }

    return (strpos($access, $required) !== false);
}

function auth_require_login(?string $requiredAccess = null): void {
    auth_session_start();

    // Prevent cached authenticated pages from being shown after logout via browser back button
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    header('Expires: 0');

    if (!auth_is_logged_in()) {
        $redirect = $_SERVER['REQUEST_URI'] ?? '';
        $to = app_url('/login.php');
        if ($redirect !== '') {
            $to .= '?redirect=' . rawurlencode($redirect);
        }
        header('Location: ' . $to);
        exit;
    }

    if ($requiredAccess !== null && $requiredAccess !== '' && !auth_has_access($requiredAccess)) {
        http_response_code(403);
        echo 'Access denied';
        exit;
    }
}

function auth_require_any_access(array $requiredAny): void {
    auth_session_start();

    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    header('Expires: 0');

    if (!auth_is_logged_in()) {
        $redirect = $_SERVER['REQUEST_URI'] ?? '';
        $to = app_url('/login.php');
        if ($redirect !== '') {
            $to .= '?redirect=' . rawurlencode($redirect);
        }
        header('Location: ' . $to);
        exit;
    }

    $requiredAny = array_values(array_filter(array_map(function ($v) {
        return strtolower(trim((string)$v));
    }, $requiredAny), function ($v) {
        return $v !== '';
    }));

    if (empty($requiredAny)) {
        return;
    }

    foreach ($requiredAny as $r) {
        if (auth_has_access($r)) {
            return;
        }
    }

    http_response_code(403);
    echo 'Access denied';
    exit;
}
