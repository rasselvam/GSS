<?php
require_once __DIR__ . '/../../includes/layout.php';

$menu = [
    ['label' => 'Login', 'href' => 'login.php'],
    ['label' => 'Application Wizard', 'href' => 'portal.php'],
];

ob_start();
?>
<div class="subnav">
    <a href="basic-details.php" class="subnav-link">Basic</a>
    <a href="identification.php" class="subnav-link">ID</a>
    <a href="contact.php" class="subnav-link">Contact</a>
    <a href="education.php" class="subnav-link">Education</a>
    <a href="employment.php" class="subnav-link">Employment</a>
    <a href="reference.php" class="subnav-link">References</a>
    <a href="step_authorization.php" class="subnav-link active">Authorization</a>
    <a href="step_submit.php" class="subnav-link">Submit</a>
</div>

<div class="card">
    <h3>Step 7 - Authorization</h3>
    <p class="card-subtitle">Please review the Release & Authorization text, sign and upload the authorization form.</p>
    <p style="font-size:13px; line-height:1.4; margin-top:10px;">
        This is sample placeholder text for the authorization form. In the real system this
        will contain the full Release & Authorization content as per the client SOW.
    </p>
    <div class="form-actions" style="margin-top:12px;">
        <button class="btn-secondary btn" type="button">Print Authorization (UI)</button>
    </div>
    <form class="form-grid" style="margin-top:14px;">
        <div class="form-control">
            <label>Upload Signed Authorization *</label>
            <input type="file" disabled>
        </div>
        <div class="form-control">
            <label>Signature (typed name)</label>
            <input type="text">
        </div>
        <div class="form-control">
            <label>Date</label>
            <input type="date">
        </div>
    </form>
    <div class="form-actions">
        <button class="btn-secondary btn" type="button">Save Draft (UI)</button>
        <a class="btn" href="step_submit.php" style="text-decoration:none; margin-left:8px;">Next: Submit</a>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Candidate - Authorization', 'Candidate', $menu, $content);
