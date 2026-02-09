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
    <h3>Candidate Manual Delegation</h3>
    <p class="card-subtitle">Manually assign candidates and components to specific verifiers (UI only).</p>

    <form class="form-grid" style="margin-top:14px;">
        <div class="form-control">
            <label>Customer</label>
            <select>
                <option>Sample Client</option>
            </select>
        </div>
        <div class="form-control">
            <label>Job Role</label>
            <select>
                <option>All Job Roles</option>
                <option>Operations</option>
            </select>
        </div>
        <div class="form-control">
            <label>Component</label>
            <select>
                <option>All Components</option>
                <option>World Check</option>
                <option>Employer 1</option>
            </select>
        </div>
        <div class="form-control">
            <label>Date Range (From)</label>
            <input type="date">
        </div>
        <div class="form-control">
            <label>Date Range (To)</label>
            <input type="date">
        </div>
    </form>
    <div class="form-actions">
        <button type="button" class="btn">Get Candidate List (UI)</button>
        <button type="button" class="btn-secondary btn" style="margin-left:8px;">Download List</button>
    </div>

    <table class="table" style="margin-top:18px;">
        <thead>
        <tr>
            <th>Select</th>
            <th>Control No</th>
            <th>Candidate Name</th>
            <th>Mobile</th>
            <th>Job Role</th>
            <th>Customer</th>
            <th>Location</th>
            <th>Highest Qualification</th>
            <th>Employer 1</th>
            <th>Employer 2</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td><input type="checkbox"></td>
            <td>CN-001</td>
            <td>Amit Sharma</td>
            <td>98xxxxxx01</td>
            <td>Operations</td>
            <td>Sample Client</td>
            <td>Bangalore</td>
            <td>MBA</td>
            <td>ABC Corp</td>
            <td>XYZ Ltd</td>
        </tr>
        </tbody>
    </table>

    <div class="card" style="margin-top:16px;">
        <h3>Assign to Verifier</h3>
        <div class="form-grid" style="margin-top:10px;">
            <div class="form-control">
                <label>Verifier</label>
                <select>
                    <option>Select Verifier</option>
                    <option>Verifier 1</option>
                    <option>Verifier 2</option>
                </select>
            </div>
            <div class="form-control">
                <label>Comments</label>
                <input type="text" placeholder="Optional comments">
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn">Assign (UI only)</button>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Manual Delegation', 'Work Allocator', $menu, $content);
