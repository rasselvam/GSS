<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('gss_admin');

$menu = gss_admin_menu();

ob_start();
?>
<div class="card">
    <h3>Mail Templates</h3>
    <p class="card-subtitle">Create and manage mail/letter/digital templates used by verifier flows.</p>
</div>

<div class="card">
    <div id="mtListMessage" style="display:none; margin-bottom: 10px;"></div>

    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <label style="font-size:13px; margin-right:6px;">Type</label>
                <select id="mtTypeSelect" style="font-size:13px; padding:4px 6px; min-width:180px;">
                    <option value="">All</option>
                    <option value="email">Email</option>
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                </select>

                <label style="font-size:13px; margin-right:6px;">Active</label>
                <select id="mtActiveSelect" style="font-size:13px; padding:4px 6px; min-width:140px;">
                    <option value="">All</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                </select>

                <input id="mtListSearch" type="text" placeholder="Search name / subject" style="font-size:13px; padding:4px 6px; min-width:240px;">
                <button class="btn" id="mtListRefreshBtn" type="button">Refresh</button>
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <a href="mail_template_edit.php" id="mtCreateBtn" class="btn" style="text-decoration:none;">Create New</a>
            </div>
        </div>
    </div>

    <table class="table" id="mtListTable">
        <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Subject</th>
            <th>Active</th>
            <th>Updated</th>
        </tr>
        </thead>
        <tbody id="mtListTbody">
        <tr>
            <td colspan="5" style="color:#6b7280;">Loading...</td>
        </tr>
        </tbody>
    </table>

    <div id="mtListPager" style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-top:10px;"></div>
</div>

<script src="<?php echo htmlspecialchars(app_url('/js/modules/gss_admin/mail_templates_list.js')); ?>"></script>
<?php
$content = ob_get_clean();
render_layout('Mail Templates', 'GSS Admin', $menu, $content);
