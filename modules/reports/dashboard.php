<?php
require_once __DIR__ . '/../../includes/layout.php';

$menu = [
    ['label' => 'Reports Dashboard', 'href' => 'dashboard.php'],
];

ob_start();
?>
<div class="card">
    <h3>Reports & Data (Module 10)</h3>
    <p>High level SLA and performance view.</p>
</div>
<div class="card">
    <h3>SLA Snapshot (sample)</h3>
    <table class="table">
        <thead>
        <tr>
            <th>Metric</th>
            <th>Value</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>Avg TAT (days)</td><td>3.4</td></tr>
        <tr><td>SLA Breach %</td><td>2.1%</td></tr>
        <tr><td>Total Candidates (month)</td><td>120</td></tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Reports Dashboard', 'Reports', $menu, $content);
