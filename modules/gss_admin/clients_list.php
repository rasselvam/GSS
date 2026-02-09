<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';

$menu = gss_admin_menu();

ob_start();
?>
<!-- <div class="subnav">
    <a href="clients_create.php" class="subnav-link">Customer Settings</a>
    <a href="locations_list.php" class="subnav-link">Locations</a>
    <a href="users_list.php" class="subnav-link">Users</a>
    <a href="verification_profiles_list.php" class="subnav-link">Verification Profiles</a>
</div>

<div class="card">
    <h3>Clients List</h3>
    <p class="card-subtitle">All clients created in the system.</p>
</div> -->

<div class="card">
    <div id="clientsListMessage" style="display:none; margin-bottom: 10px;"></div>

    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <input id="clientsListSearch" type="text" placeholder="Search customer" style="font-size:13px; padding:4px 6px;">
                <button class="btn" id="clientsListRefreshBtn" type="button">Refresh</button>
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span id="clientsListExportButtons" style="display:inline-flex; gap:6px; vertical-align:middle;"></span>
                <a href="clients_create.php" class="btn" style="text-decoration:none;">Create New Client</a>
            </div>
        </div>
    </div>

    <div style="overflow:auto;">
        <table class="table" id="clientsListTable">
            <thead>
            <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Internal TAT</th>
                <th>External TAT</th>
                <th>Created</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody id="clientsListTbody">
            <tr>
                <td colspan="10" style="color:#6b7280;">Loading...</td>
            </tr>
            </tbody>
        </table>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Clients List', 'GSS Admin', $menu, $content);
