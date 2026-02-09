<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('client_admin');

$menu = client_admin_menu();

ob_start();
?>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<div class="card">
    <!-- <h3>Client Admin Snapshot</h3> -->
    <!-- <p class="card-subtitle">Creative snapshot of your BGV funnel. Click any tile to jump into detailed lists (UI only).</p> -->
    <div class="client-dashboard-meta">
        <span id="client-admin-clock">Time: --:--:--</span>
        <span id="client-admin-status">Status: Sample metrics view (UI only)</span>
    </div>

    <div class="row g-3 client-dashboard-kpis">
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-total">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div id="caKpiTotal" class="client-kpi-value">--</div>
                        <div class="client-kpi-label">Total Candidates</div>
                    </div>
                </div>
                <div class="client-kpi-link"><a href="overall_report.php">View all &raquo;</a></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-awaiting">
                <div id="caKpiAwaiting" class="client-kpi-value">--</div>
                <div class="client-kpi-label">Awaiting</div>
                <div class="client-kpi-link"><a href="overall_report.php">More info</a></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-wip">
                <div id="caKpiWip" class="client-kpi-value">--</div>
                <div class="client-kpi-label">WIP (In Progress)</div>
                <div class="client-kpi-link"><a href="overall_report.php">See WIP list</a></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-stop">
                <div id="caKpiStop" class="client-kpi-value">--</div>
                <div class="client-kpi-label">BGV Stop</div>
                <div class="client-kpi-link"><a href="overall_report.php">Stop cases</a></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-completed">
                <div id="caKpiCompleted" class="client-kpi-value">--</div>
                <div class="client-kpi-label">Completed & Clear</div>
                <div class="client-kpi-link"><a href="overall_report.php">Download clears</a></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-utv">
                <div id="caKpiUtv" class="client-kpi-value">--</div>
                <div class="client-kpi-label">Unable to Verify</div>
                <div class="client-kpi-link"><a href="overall_report.php">Review</a></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-discrepancy">
                <div id="caKpiDiscrepancy" class="client-kpi-value">--</div>
                <div class="client-kpi-label">Discrepancy</div>
                <div class="client-kpi-link"><a href="overall_report.php">Critical cases</a></div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 client-kpi-tile client-kpi-tile-insufficient">
                <div id="caKpiInsufficient" class="client-kpi-value">--</div>
                <div class="client-kpi-label">Insufficient</div>
                <div class="client-kpi-link"><a href="overall_report.php">Need documents</a></div>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <h3>Case Overview</h3>
    <p class="card-subtitle">Live stats for your client: status distribution and daily created trend.</p>
    <div class="row g-3 client-dashboard-overview">
        <div class="col-12 col-lg-5">
            <div class="client-dashboard-chart-card">
                <div class="client-dashboard-chart-title">Cases by Status</div>
                <div class="client-dashboard-chart">
                    <canvas id="caChartStatus"></canvas>
                </div>
            </div>
        </div>
        <div class="col-12 col-lg-7">
            <div class="client-dashboard-chart-card">
                <div class="client-dashboard-chart-title">Cases created (Last 14 days)</div>
                <div class="client-dashboard-chart">
                    <canvas id="caChartTrend"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <h3>Ageing Report</h3>
    <p class="card-subtitle">How long cases have been in the pipeline (based on case created date).</p>
    <div class="client-ageing" style="margin-top:16px;">
        <div class="client-ageing-label" style="font-size:12px; margin-bottom:4px;">0 - 6 days</div>
        <div class="progress mb-2 client-ageing-progress" style="height:8px;">
            <div class="progress-bar client-ageing-bar client-ageing-bar-0" id="caAge0_6" role="progressbar" style="width: 0%;"></div>
        </div>
        <div class="client-ageing-label" style="font-size:12px; margin-bottom:4px;">6 - 12 days</div>
        <div class="progress mb-2 client-ageing-progress" style="height:8px;">
            <div class="progress-bar client-ageing-bar client-ageing-bar-1" id="caAge7_12" role="progressbar" style="width: 0%;"></div>
        </div>
        <div class="client-ageing-label" style="font-size:12px; margin-bottom:4px;">12 - 24 days</div>
        <div class="progress mb-2 client-ageing-progress" style="height:8px;">
            <div class="progress-bar client-ageing-bar client-ageing-bar-2" id="caAge13_24" role="progressbar" style="width: 0%;"></div>
        </div>
        <div class="client-ageing-label" style="font-size:12px; margin-bottom:4px;">24+ days</div>
        <div class="progress client-ageing-progress" style="height:8px;">
            <div class="progress-bar client-ageing-bar client-ageing-bar-3" id="caAge25p" role="progressbar" style="width: 0%;"></div>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Client Admin Dashboard', 'Client Admin', $menu, $content);
