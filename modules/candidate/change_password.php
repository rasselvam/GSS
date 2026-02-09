<?php
session_start();
require_once __DIR__ . '/../../config/env.php';

if (empty($_SESSION['logged_in']) || empty($_SESSION['application_id'])) {
    header('Location: ' . app_url('/modules/candidate/login.php'));
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Change Password - Candidate</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="<?php echo htmlspecialchars(app_url('/assets/css/candidate.css')); ?>">
</head>
<body class="candidate-page">
<div class="container" style="max-width:520px; padding-top:30px; padding-bottom:30px;">
    <div class="card p-4">
        <h4 class="mb-2">Change Password</h4>
        <p class="text-muted" style="font-size:13px;">For security, you must set a new password before continuing.</p>

        <div id="changePasswordMessage" style="display:none; margin-top:10px; font-size:13px;"></div>

        <form id="changePasswordForm" autocomplete="off">
            <div class="mb-3">
                <label class="form-label">Current Password *</label>
                <input type="password" name="current_password" id="cpCurrent" class="form-control" required>
            </div>
            <div class="mb-3">
                <label class="form-label">New Password *</label>
                <input type="password" name="new_password" id="cpNew" class="form-control" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Confirm New Password *</label>
                <input type="password" name="confirm_password" id="cpConfirm" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary w-100" id="cpSubmitBtn">Update Password</button>
        </form>
    </div>
</div>

<script>
    window.APP_BASE_URL = <?php echo json_encode(app_base_url()); ?>;
</script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/change_password.js')); ?>"></script>
</body>
</html>
