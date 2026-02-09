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
    <h3>Candidate Delegated List</h3>
    <p class="card-subtitle">See which verifier is handling which candidate per component (UI only).</p>

    <form class="form-grid" style="margin-top:14px; max-width:420px;">
        <div class="form-control">
            <label>Customer</label>
            <select>
                <option>Sample Client</option>
            </select>
        </div>
        <div class="form-control">
            <label>Control Number</label>
            <input type="text" placeholder="Enter Control No">
        </div>
    </form>
    <div class="form-actions">
        <button type="button" class="btn">Search (UI only)</button>
    </div>

    <table class="table" style="margin-top:18px;">
        <thead>
        <tr>
            <th>Control No</th>
            <th>Candidate</th>
            <th>Component</th>
            <th>Verifier</th>
            <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>CN-001</td>
            <td>Amit Sharma</td>
            <td>World Check</td>
            <td>Verifier 1</td>
            <td><span class="badge">Completed</span></td>
        </tr>
        <tr>
            <td>CN-001</td>
            <td>Amit Sharma</td>
            <td>Employment 1</td>
            <td>Verifier 2</td>
            <td><span class="badge">In Progress</span></td>
        </tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Candidate Delegated List', 'Work Allocator', $menu, $content);
