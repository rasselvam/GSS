<?php
require_once __DIR__ . '/../../includes/layout.php';

$menu = [
    ['label' => 'Dashboard', 'href' => 'dashboard.php'],
    ['label' => 'Submit Candidate', 'href' => 'submit_candidate.php'],
    ['label' => 'Submissions', 'href' => 'submissions.php'],
];

ob_start();
?>
<div class="card">
    <h3>Recruiter / Vendor Dashboard (Module 3)</h3>
    <p>Submit candidates and track their status.</p>
</div>
<div class="card">
    <h3>Recent Submissions (sample)</h3>
    <table class="table">
        <thead>
        <tr>
            <th>Candidate</th>
            <th>Job Role</th>
            <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>Amit Sharma</td><td>Sales Exec</td><td><span class="badge">In Progress</span></td></tr>
        <tr><td>Neha Rao</td><td>Ops Manager</td><td><span class="badge">Pending Docs</span></td></tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Recruiter Dashboard', 'Recruiter / Vendor', $menu, $content);
