<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('gss_admin');

$menu = gss_admin_menu();

ob_start();
?>
<!-- <div class="subnav">
    <a href="clients_create.php" class="subnav-link">Customer Settings</a>
    <a href="locations_list.php" class="subnav-link">Locations</a>
    <a href="users_list.php" class="subnav-link">Users</a>
    <a href="verification_profiles_list.php" class="subnav-link active">Verification Profiles</a>
</div> -->

<div class="card">
    <h3>Verification Profile Master</h3>
    <p class="card-subtitle">Manage verification profiles as per SOW (client-wise).</p>
</div>

<div class="card">
    <div id="vpListMessage" style="display:none; margin-bottom: 10px;"></div>

    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <label style="font-size:13px; margin-right:6px;">Customer</label>
                <select id="vpClientSelect" style="font-size:13px; padding:4px 6px; min-width:260px;"></select>
                <input id="vpListSearch" type="text" placeholder="Search profile name" style="font-size:13px; padding:4px 6px;">
                <button class="btn" id="vpListRefreshBtn" type="button">Refresh</button>
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <a href="verification_profile_edit.php" id="vpCreateBtn" class="btn" style="text-decoration:none;">Create New</a>
            </div>
        </div>
    </div>

    <table class="table" id="vpListTable">
        <thead>
        <tr>
            <th>Customer</th>
            <th>Name</th>
            <th>Description</th>
            <th>Location</th>
            <th>Active</th>
        </tr>
        </thead>
        <tbody id="vpListTbody">
        <tr>
            <td colspan="5" style="color:#6b7280;">Loading...</td>
        </tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Verification Profile Master', 'GSS Admin', $menu, $content);
