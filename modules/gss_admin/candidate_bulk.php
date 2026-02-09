<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';

$menu = gss_admin_menu();

ob_start();
?>
<div class="card">
    <h3>Bulk Candidate Upload (GSS Admin)</h3>
    <p class="card-subtitle">Select a client, upload CSV/XLSX, and create cases + invite links for all candidates.</p>
</div>

<div class="card">
    <h3>Candidate File Upload</h3>
    <div id="candidateBulkMessage" class="alert" style="display:none; margin-top:14px;"></div>

    <form id="candidateBulkForm" class="form-grid" style="margin-top:14px;" enctype="multipart/form-data">
        <div class="form-control">
            <label>Select Client *</label>
            <select name="client_id" id="bulk_client_id" required>
                <option value="">Loading...</option>
            </select>
        </div>
        <input type="hidden" name="created_by_user_id" id="bulk_created_by_user_id" value="0">

        <div class="form-control">
            <label>Upload File *</label>
            <input type="file" name="file" id="bulk_file" accept=".csv,.xlsx" required>
            <small>File must include: candidate_first_name, candidate_last_name, candidate_dob (YYYY-MM-DD / DD/MM/YYYY / DD-MM-YYYY), candidate_father_name, candidate_mobile, candidate_email, candidate_state, candidate_city, joining_location, job_role, recruiter_name, recruiter_email.</small>
        </div>
    </form>

    <div class="form-actions">
        <button type="button" class="btn" id="btnBulkUpload">Upload & Send Invites</button>
    </div>
</div>

<div class="card" id="bulkResultsCard" style="display:none;">
    <h3>Bulk Upload Results</h3>
    <div class="table-scroll" style="margin-top:10px;">
        <table class="table" id="bulkResultsTable">
            <thead>
            <tr>
                <th>#</th>
                <th>Candidate</th>
                <th>Email</th>
                <th>Status</th>
                <th>Invite Link</th>
                <th>Message</th>
            </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

<div class="card">
    <h3>Candidate Sample File Download</h3>
    <div class="form-actions" style="margin-top:14px;">
        <a class="btn-secondary btn" href="<?php echo htmlspecialchars(app_url('/assets/samples/candidate_bulk_sample.csv')); ?>" download>Download Sample CSV</a>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Bulk Candidate Upload', 'GSS Admin', $menu, $content);
