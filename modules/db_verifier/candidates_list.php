<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('db_verifier');

$menu = db_verifier_menu();

ob_start();
?>
<div class="card">
    <h3>Candidate List</h3>
    <p class="card-subtitle">Database checks queue. Claim a case to lock it to you (it will not show for other verifiers).</p>
</div>

<div class="card">
    <div id="dbvCasesListMessage" style="display:none; margin-bottom: 10px;"></div>

    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <label style="font-size:13px; margin-right:6px;">Queue</label>
                <select id="dbvCasesMode" style="font-size:13px; padding:4px 6px; min-width:180px;">
                    <option value="available" selected>Available</option>
                    <option value="mine">My Claimed</option>
                </select>
                <label style="font-size:13px; margin-right:6px;">Client</label>
                <select id="dbvCasesClientSelect" style="font-size:13px; padding:4px 6px; min-width:260px;"></select>
                <input id="dbvCasesListSearch" type="text" placeholder="Search name / email / app id / status" style="font-size:13px; padding:4px 6px;">
                <button class="btn" id="dbvCasesListRefreshBtn" type="button">Refresh</button>
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <div id="dbvCasesListExportButtons"></div>
            </div>
        </div>
    </div>

    <div class="table-scroll">
        <table class="table" id="dbvCasesListTable">
            <thead>
            <tr>
                <th>Case ID</th>
                <th>Application ID</th>
                <th>Candidate</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Created</th>
            </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Candidate List', 'DB Verifier', $menu, $content);
