<?php
require_once __DIR__ . '/../../includes/layout.php';

$menu = [
    ['label' => 'Billing Dashboard', 'href' => 'dashboard.php'],
];

ob_start();
?>
<div class="card">
    <h3>Billing & Third-Party Payments (Module 9)</h3>
    <p>Preview invoices and monitor payment status.</p>
</div>
<div class="card">
    <h3>Invoices (sample)</h3>
    <table class="table">
        <thead>
        <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Period</th>
            <th>Amount</th>
            <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>INV-2025-001</td><td>Sample Client</td><td>Nov 2025</td><td>₹85,000</td><td><span class="badge">Draft</span></td></tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Billing Dashboard', 'Billing / Finance', $menu, $content);
