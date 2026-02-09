<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('client_admin');

require __DIR__ . '/../shared/candidate_report_get.php';
