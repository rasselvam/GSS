<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('db_verifier');

$menu = db_verifier_menu();

ob_start();
?>
<div class="card">
    <h3>DB Verifier (Module 6)</h3>
    <p>Queue for database-level checks (identity, courts, credit etc.).</p>
</div>
<div class="card">
    <h3>Pending DB Checks (sample)</h3>
    <table class="table">
        <thead>
        <tr>
            <th>Candidate</th>
            <th>Check Type</th>
            <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>Amit Sharma</td><td>e-Court</td><td><span class="badge">Pending</span></td></tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('DB Verifier Queue', 'DB Verifier', $menu, $content);
