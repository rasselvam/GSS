<?php
require_once __DIR__ . '/../../includes/layout.php';

$menu = [
    ['label' => 'Login', 'href' => 'login.php'],
    ['label' => 'Application Wizard', 'href' => 'portal.php'],
];

ob_start();
?>
<div class="subnav">
    <a href="step_basic.php" class="subnav-link">Basic</a>
    <a href="step_identification.php" class="subnav-link">ID</a>
    <a href="step_contact.php" class="subnav-link">Contact</a>
    <a href="step_education.php" class="subnav-link">Education</a>
    <a href="step_employment.php" class="subnav-link">Employment</a>
    <a href="step_reference.php" class="subnav-link">References</a>
    <a href="step_authorization.php" class="subnav-link">Authorization</a>
    <a href="step_submit.php" class="subnav-link active">Submit</a>
</div>

<div class="card">
    <h3>Step 8 - Submission</h3>
    <p class="card-subtitle">Final confirmation after you have provided all required details and authorization.</p>
    <p style="font-size:13px; margin-top:12px;">
        Thank you for providing your information and documents. Once you click the button below,
        your details will be treated as final and the background verification will proceed.
        In case of any insufficient information, the verification team or your recruiter may
        reach out to you.
    </p>
    <div class="form-actions" style="margin-top:16px;">
        <button class="btn" type="button">Submit Application (UI only)</button>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Candidate - Submission', 'Candidate', $menu, $content);
