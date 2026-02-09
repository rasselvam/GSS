<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';

$menu = gss_admin_menu();

$clientId = isset($_GET['client_id']) ? (int)$_GET['client_id'] : 0;

ob_start();
?>
<div class="subnav">
    <a href="clients_list.php" class="subnav-link active">Clients</a>
    <a href="clients_create.php" class="subnav-link">Create Client</a>
</div>

<div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <div>
            <h3 style="margin-bottom:4px;">Client View</h3>
            <p class="card-subtitle" style="margin-bottom:0;">Read-only view of client details.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
            <a class="btn" href="clients_list.php" style="text-decoration:none;">Back</a>
            <?php if ($clientId > 0): ?>
                <a class="btn" href="clients_create.php?client_id=<?php echo (int)$clientId; ?>" style="text-decoration:none;">Edit</a>
            <?php endif; ?>
        </div>
    </div>
</div>

<div class="card">
    <div id="clientViewMessage" style="display:none; margin-bottom:10px;"></div>
    <div id="clientViewContainer" data-client-id="<?php echo (int)$clientId; ?>" style="font-size:13px;">
        Loading...
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Client View', 'GSS Admin', $menu, $content);
