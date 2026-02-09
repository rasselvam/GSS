<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

// Any logged-in staff user can access this page.
auth_require_login();

$access = strtolower(trim(auth_module_access()));
$menu = client_admin_menu();
$roleLabel = 'User';

if ($access === 'gss_admin') {
    $menu = gss_admin_menu();
    $roleLabel = 'GSS Admin';
} elseif ($access === 'db_verifier') {
    $menu = db_verifier_menu();
    $roleLabel = 'DB Verifier';
} elseif ($access === 'verifier') {
    $menu = verifier_menu();
    $roleLabel = 'Component Verifier';
} elseif ($access === 'qa') {
    $menu = qa_menu();
    $roleLabel = 'QA / Team Lead';
} elseif ($access === 'client_admin') {
    $menu = client_admin_menu();
    $roleLabel = 'Client Admin';
}

ob_start();
?>
<div class="card" style="max-width:720px; margin:0 auto;">
    <h3>Change Password</h3>
    <p class="card-subtitle">For security, you must set a new password before continuing.</p>

    <div id="changePasswordMessage" style="display:none; margin-top:10px;"></div>

    <form id="changePasswordForm" style="margin-top:14px;">
        <div class="form-grid">
            <div class="form-control">
                <label>Current Password *</label>
                <input type="password" name="current_password" id="cpCurrent" required>
            </div>
            <div class="form-control">
                <label>New Password *</label>
                <input type="password" name="new_password" id="cpNew" required>
            </div>
            <div class="form-control">
                <label>Confirm New Password *</label>
                <input type="password" name="confirm_password" id="cpConfirm" required>
            </div>
        </div>

        <div class="form-actions" style="margin-top:12px;">
            <button type="submit" class="btn" id="cpSubmitBtn">Update Password</button>
        </div>
    </form>
</div>

<script>
    window.APP_BASE_URL = <?php echo json_encode(app_base_url()); ?>;
</script>
<?php
$content = ob_get_clean();
render_layout('Change Password', $roleLabel, $menu, $content);
