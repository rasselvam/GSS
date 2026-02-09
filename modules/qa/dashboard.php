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
    <h3>QA Dashboard</h3>
    <p>Live workload, users, and active case handling.</p>
</div>

<div class="card" id="qaDashMessage" style="display:none; margin-bottom:10px;"></div>

<div class="card" style="padding:14px;">
    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <div>
            <div style="font-weight:900; color:#0f172a;">Live Dashboard</div>
            <div style="font-size:12px; color:#64748b;">Auto-refresh shows current open workload and assignments.</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:#334155;">
                <input type="checkbox" id="qaDashAutoRefresh" checked>
                Auto refresh (15s)
            </label>
            <button class="btn btn-sm" id="qaDashRefreshBtn" type="button" style="border-radius:10px;">Refresh</button>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:10px; margin-top:14px;">
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-size:11px; color:#64748b; font-weight:800;">ACTIVE USERS</div>
            <div id="qaKpiUsersTotal" style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px;">-</div>
        </div>
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-size:11px; color:#64748b; font-weight:800;">QA USERS</div>
            <div id="qaKpiQaUsers" style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px;">-</div>
        </div>
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-size:11px; color:#64748b; font-weight:800;">VR OPEN ITEMS</div>
            <div id="qaKpiVrOpen" style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px;">-</div>
        </div>
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-size:11px; color:#64748b; font-weight:800;">DBV OPEN CASES</div>
            <div id="qaKpiDbvOpen" style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px;">-</div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:14px;">
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-weight:900; color:#0f172a; margin-bottom:8px;">Verifier workload (VR Group Queue)</div>
            <div class="table-scroll">
                <table class="table">
                    <thead><tr><th>User</th><th>Open</th><th>State</th></tr></thead>
                    <tbody id="qaWorkloadVrBody"></tbody>
                </table>
            </div>
        </div>
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-weight:900; color:#0f172a; margin-bottom:8px;">DB Verifier workload (DBV)</div>
            <div class="table-scroll">
                <table class="table">
                    <thead><tr><th>User</th><th>Open</th><th>State</th></tr></thead>
                    <tbody id="qaWorkloadDbvBody"></tbody>
                </table>
            </div>
        </div>
    </div>

    <div style="margin-top:14px; border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
            <div>
                <div style="font-weight:900; color:#0f172a;">Who is handling which case (live)</div>
                <div style="font-size:12px; color:#64748b;">Shows active claims (VR queue + DBV).</div>
            </div>
        </div>
        <div class="table-scroll" style="margin-top:8px;">
            <table class="table">
                <thead>
                <tr>
                    <th>Queue</th>
                    <th>Application</th>
                    <th>Group</th>
                    <th>Queue Status</th>
                    <th>Assigned To</th>
                    <th>Case Status</th>
                </tr>
                </thead>
                <tbody id="qaAssignmentsBody"></tbody>
            </table>
        </div>
    </div>
</div>

<style>
    @media (max-width: 1100px){
        #qaKpiUsersTotal,#qaKpiQaUsers,#qaKpiVrOpen,#qaKpiDbvOpen{font-size:18px !important;}
        .card [style*="grid-template-columns: repeat(4"]{grid-template-columns: repeat(2, minmax(0, 1fr)) !important;}
        .card [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns: 1fr !important;}
    }
</style>
<?php
$content = ob_get_clean();
render_layout('QA Dashboard', $roleLabel, $menu, $content);
