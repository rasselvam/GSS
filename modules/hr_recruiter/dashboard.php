<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('company_recruiter');

$menu = hr_recruiter_menu();

ob_start();
?>
<div class="card">
    <h3>HR Recruiter Dashboard</h3>
    <p class="card-subtitle">Manage candidate cases created by you.</p>
    <div class="form-actions" style="margin-top:12px;">
        <a class="btn" href="candidates_list.php">My Candidate List</a>
        <a class="btn btn-secondary" href="candidate_create.php">Create Applicant</a>
        <a class="btn btn-secondary" href="candidate_bulk.php">Bulk Upload</a>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Dashboard', 'HR Recruiter', $menu, $content);
