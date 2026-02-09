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
    <h3>Verifier Delegated List</h3>
    <p class="card-subtitle">View all components delegated to verifiers (UI only).</p>

    <form class="form-grid" style="margin-top:14px;">
        <div class="form-control">
            <label>Customer</label>
            <select>
                <option>Sample Client</option>
            </select>
        </div>
        <div class="form-control">
            <label>Component</label>
            <select>
                <option>All Components</option>
                <option>World Check</option>
                <option>Employment 1</option>
            </select>
        </div>
        <div class="form-control">
            <label>Verifier</label>
            <select>
                <option>All Verifiers</option>
                <option>Verifier 1</option>
                <option>Verifier 2</option>
            </select>
        </div>
        <div class="form-control">
            <label>From Date</label>
            <input type="date">
        </div>
        <div class="form-control">
            <label>To Date</label>
            <input type="date">
        </div>
    </form>
    <div class="form-actions">
        <button type="button" class="btn">Search (UI only)</button>
    </div>

    <table class="table" style="margin-top:18px;">
        <thead>
        <tr>
            <th>Verifier</th>
            <th>Component</th>
            <th>Control No</th>
            <th>Candidate</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Delegated Date</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>Verifier 1</td>
            <td>World Check</td>
            <td>CN-001</td>
            <td>Amit Sharma</td>
            <td>Sample Client</td>
            <td><span class="badge">In Progress</span></td>
            <td>2025-11-22</td>
        </tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Verifier Delegated List', 'Work Allocator', $menu, $content);
