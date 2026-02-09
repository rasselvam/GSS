<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';

$menu = gss_admin_menu();

ob_start();
?>
<div class="subnav">
    <a href="clients_create.php" class="subnav-link">Customer Settings</a>
    <a href="locations_list.php" class="subnav-link active">Locations</a>
    <a href="users_list.php" class="subnav-link">Users</a>
    <a href="verification_profiles_list.php" class="subnav-link">Verification Profiles</a>
</div>

<div class="card">
    <h3>Customer Locations</h3>
    <p class="card-subtitle">View and manage all locations for a selected customer (UI only).</p>
</div>

<div class="card">
    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px;">
        <div>
            <label style="font-size:13px; margin-right:6px;">Customer</label>
            <select style="font-size:13px; padding:4px 6px;">
                <option>Bswi ft Technology Services</option>
                <option>Sample Client</option>
            </select>
        </div>
        <div>
            <a href="location_create.php" class="btn" style="text-decoration:none;">Create New</a>
            <input type="text" placeholder="Search" style="font-size:13px; padding:4px 6px; margin-left:10px;">
        </div>
    </div>

    <table class="table">
        <thead>
        <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Active</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td><a href="location_create.php" style="text-decoration:none; color:#2563eb;">Bangalore</a></td>
            <td>Head Office</td>
            <td><span class="badge">Active</span></td>
        </tr>
        <tr>
            <td><a href="location_create.php" style="text-decoration:none; color:#2563eb;">Hyderabad</a></td>
            <td>Regional Office</td>
            <td><span class="badge">Inactive</span></td>
        </tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Customer Locations', 'GSS Admin', $menu, $content);
