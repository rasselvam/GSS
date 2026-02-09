<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('validator');

$menu = validator_menu();

ob_start();
?>
<div class="card">
    <h3>Validator Dashboard</h3>
    <p class="card-subtitle">FIFO case validation queue. Start next case or open your candidate list.</p>
</div>

<div class="card" id="valDashMessage" style="display:none; margin-bottom:10px;"></div>

<div class="card" style="padding:14px;">
    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <div>
            <div style="font-weight:900; color:#0f172a;">Live Queue</div>
            <div style="font-size:12px; color:#64748b;">Shows your workload and what's available.</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-sm" id="valDashStartNextBtn" type="button" style="border-radius:10px;">Start Next</button>
            <a class="btn btn-sm" href="candidates_list.php" style="border-radius:10px;">Candidate List</a>
            <button class="btn btn-sm" id="valDashRefreshBtn" type="button" style="border-radius:10px;">Refresh</button>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px; margin-top:14px;">
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-size:11px; color:#64748b; font-weight:800;">PENDING</div>
            <div id="valKpiPending" style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px;">-</div>
        </div>
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-size:11px; color:#64748b; font-weight:800;">IN PROGRESS</div>
            <div id="valKpiInProgress" style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px;">-</div>
        </div>
        <div style="border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
            <div style="font-size:11px; color:#64748b; font-weight:800;">COMPLETED TODAY</div>
            <div id="valKpiCompletedToday" style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px;">-</div>
        </div>
    </div>

    <div style="margin-top:14px; border:1px solid rgba(148,163,184,0.25); border-radius:14px; padding:12px; background:#fff;">
        <div style="font-weight:900; color:#0f172a; margin-bottom:8px;">My open cases</div>
        <div class="table-scroll">
            <table class="table">
                <thead>
                <tr>
                    <th>Application</th>
                    <th>Candidate</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody id="valMyTasksBody"></tbody>
            </table>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Validator Dashboard', 'Validator', $menu, $content);

echo '<script>window.APP_BASE_URL = ' . json_encode(app_base_url()) . ';</script>';
echo '<script src="' . htmlspecialchars(app_url('/js/includes/date_utils.js')) . '"></script>';
echo '<script src="' . htmlspecialchars(app_url('/js/modules/validator/dashboard.js')) . '"></script>';
