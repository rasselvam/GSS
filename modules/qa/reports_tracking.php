<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_any_access(['qa', 'team_lead']);

auth_session_start();
$access = strtolower(trim((string)($_SESSION['auth_moduleAccess'] ?? '')));
$isTeamLead = ($access === 'team_lead');

$menu = $isTeamLead ? team_lead_menu() : qa_menu();
$roleLabel = $isTeamLead ? 'Team Lead' : 'QA';

ob_start();
?>
<div class="card">
    <h3>Reports Tracking</h3>
    <p class="card-subtitle">Filter and open candidate reports across all clients. All opens/prints are recorded in timeline (audit).</p>
</div>

<div class="card">
    <div id="qaReportsTrackMessage" style="display:none; margin-bottom: 10px;"></div>

    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <label style="font-size:13px; margin-right:6px;">Client</label>
                <select id="qaRptClient" style="font-size:13px; padding:4px 6px; min-width:260px;"></select>

                <label style="font-size:13px; margin-right:6px;">Status</label>
                <select id="qaRptStatus" style="font-size:13px; padding:4px 6px; min-width:180px;">
                    <option value="">All</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="HOLD">HOLD</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="STOPPED">STOPPED</option>
                    <option value="WIP">WIP</option>
                    <option value="PENDING">PENDING</option>
                </select>

                <label style="font-size:13px; margin-right:6px;">From</label>
                <input id="qaRptFrom" type="date" style="font-size:13px; padding:4px 6px;">

                <label style="font-size:13px; margin-right:6px;">To</label>
                <input id="qaRptTo" type="date" style="font-size:13px; padding:4px 6px;">

                <input id="qaRptSearch" type="text" placeholder="Search name / email / app id / mobile" style="font-size:13px; padding:4px 6px; min-width:240px;">
                <button class="btn" id="qaRptRefresh" type="button">Apply</button>
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <div id="qaRptExportButtons"></div>
            </div>
        </div>
    </div>

    <div class="table-scroll">
        <table class="table" id="qaRptTable">
            <thead>
            <tr>
                <th>Client</th>
                <th>Application</th>
                <th>Candidate</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Reports Tracking', $roleLabel, $menu, $content);
