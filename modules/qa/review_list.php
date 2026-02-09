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
    <h3>QA Review List</h3>
    <p class="card-subtitle">Simple QA queue (UI first). Uses existing cases list for now.</p>
</div>

<div class="card">
    <div id="qaCasesListMessage" style="display:none; margin-bottom: 10px;"></div>

    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <label style="font-size:13px; margin-right:6px;">View</label>
                <select id="qaCasesViewSelect" style="font-size:13px; padding:4px 6px; min-width:200px;">
                    <option value="ready">Ready for QA</option>
                    <option value="all">All Cases</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                </select>
                <label style="font-size:13px; margin-right:6px;">Client</label>
                <select id="qaCasesClientSelect" style="font-size:13px; padding:4px 6px; min-width:260px;"></select>
                <label style="font-size:13px; margin-right:6px;">Validator</label>
                <select id="qaCasesValidatorSelect" style="font-size:13px; padding:4px 6px; min-width:200px;"></select>
                <label style="font-size:13px; margin-right:6px;">Verifier</label>
                <select id="qaCasesVerifierSelect" style="font-size:13px; padding:4px 6px; min-width:200px;"></select>
                <label style="font-size:13px; margin-right:6px;">VR Group</label>
                <select id="qaCasesVerifierGroupSelect" style="font-size:13px; padding:4px 6px; min-width:150px;">
                    <option value="">All</option>
                    <option value="BASIC">BASIC</option>
                    <option value="EDUCATION">EDUCATION</option>
                </select>
                <input id="qaCasesListSearch" type="text" placeholder="Search name / email / app id / status" style="font-size:13px; padding:4px 6px;">
                <button class="btn" id="qaCasesListRefreshBtn" type="button">Refresh</button>
                <label style="font-size:13px; display:flex; align-items:center; gap:6px; margin-left:6px;">
                    <input type="checkbox" id="qaCasesAutoRefresh" checked>
                    Auto refresh
                </label>
                <span id="qaCasesLastUpdated" style="font-size:12px; color:#64748b;"></span>
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <div id="qaCasesListExportButtons"></div>
            </div>
        </div>
    </div>

    <div class="table-scroll">
        <table class="table" id="qaCasesListTable">
            <thead>
            <tr>
                <th>Case ID</th>
                <th>Application ID</th>
                <th>Candidate</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Stage</th>
                <th>Validator Assigned</th>
                <th>Verifier Assigned</th>
                <th>Status</th>
                <th>Created</th>
            </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('QA Review List', $roleLabel, $menu, $content);
