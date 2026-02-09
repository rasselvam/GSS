<?php
require_once __DIR__ . '/../../includes/layout.php';

$menu = [
    ['label' => 'Delegation Reports', 'href' => 'delegation_reports.php'],
    ['label' => 'Auto Delegation', 'href' => 'delegation_auto.php'],
    ['label' => 'Manual Delegation', 'href' => 'delegation_manual.php'],
    ['label' => 'Verifier Delegated List', 'href' => 'delegation_verifier_list.php'],
    ['label' => 'Candidate Delegated List', 'href' => 'delegation_candidate_list.php'],
];

ob_start();
?>
<div class="card">
    <h3>Run Candidate Auto Delegation</h3>
    <p class="card-subtitle">Automatically allocate components to eligible verifiers based on customer configuration (UI only).</p>
    <form class="form-grid" style="margin-top:14px; max-width:420px;">
        <div class="form-control">
            <label>Customer *</label>
            <select>
                <option>Select Customer</option>
                <option>Sample Client</option>
            </select>
        </div>
        <div class="form-control">
            <label>Delegation Mode</label>
            <select>
                <option>Component Level</option>
                <option>Case Level</option>
            </select>
        </div>
        <div class="form-control">
            <label>Include Re-run Cases</label>
            <select>
                <option>No</option>
                <option>Yes</option>
            </select>
        </div>
    </form>
    <div class="form-actions">
        <button type="button" class="btn">Run Auto Delegation (UI only)</button>
    </div>
    <p class="card-subtitle" style="margin-top:12px;">Note: Works only if component level delegation is enabled for the selected customer.</p>
</div>
<?php
$content = ob_get_clean();
render_layout('Auto Delegation', 'Work Allocator', $menu, $content);
