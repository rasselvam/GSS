<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';

$menu = gss_admin_menu();

ob_start();
?>
<div class="subnav">
    <a href="clients_create.php" class="subnav-link active">Customer Settings</a>
    <a href="verification_profiles_list.php" class="subnav-link">Verification Profiles</a>
</div>

<div class="card">
    <h3>Create / Edit Location</h3>
    <p class="card-subtitle">UI shell for managing customer locations. No save logic wired yet.</p>

    <form style="margin-top: 14px;" class="form-grid">
        <div class="form-control">
            <label>Customer *</label>
            <select>
                <option>Bswi ft Technology Services</option>
                <option>Sample Client</option>
            </select>
        </div>
        <div class="form-control">
            <label>Location Name *</label>
            <input type="text" value="Bangalore">
        </div>
        <div class="form-control">
            <label>Description</label>
            <input type="text" value="Head Office">
        </div>
        <div class="form-control">
            <label>Active</label>
            <select>
                <option>Yes</option>
                <option>No</option>
            </select>
        </div>
    </form>
    <div class="form-actions">
        <button type="button" class="btn">Save (UI only)</button>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Create Location', 'GSS Admin', $menu, $content);
