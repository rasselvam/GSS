<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('client_admin');

$menu = client_admin_menu();

ob_start();
?>
<div class="card">
    <h3>Users</h3>
    <p class="card-subtitle">Manage users for your client.</p>
</div>

<div class="card">
    <div id="clientUsersListMessage" style="display:none; margin-bottom: 10px;"></div>

    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <input id="clientUsersListSearch" type="text" placeholder="Search username / name / email" style="font-size:13px; padding:4px 6px;">
                <button class="btn" id="clientUsersListRefreshBtn" type="button">Refresh</button>
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span id="clientUsersListExportButtons" style="display:inline-flex; gap:6px; vertical-align:middle;"></span>
                <a href="user_create.php" id="clientUsersCreateBtn" class="btn" style="text-decoration:none;">Create New User</a>
            </div>
        </div>
    </div>

    <div style="overflow:auto;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Client Users</h4>
        <table class="table" id="clientUsersListTable">
            <thead>
            <tr>
                <th>Username</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Location</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td colspan="6" style="color:#6b7280;">Loading...</td>
            </tr>
            </tbody>
        </table>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Users', 'Client Admin', $menu, $content);
