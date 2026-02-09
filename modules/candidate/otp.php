<?php
session_start();
require_once __DIR__ . '/../../config/env.php';

header('Location: ' . app_url('/modules/candidate/login.php?step=otp'));
exit;
