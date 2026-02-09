<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();
ensureApplicationExists($application_id);

$pdo = getDB();

// CHANGE THIS: Use stored procedure instead of direct SELECT
$stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_employment_details(?)");
$stmt->execute([$application_id]);
$dbRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Close the cursor to allow for other queries
$stmt->closeCursor();

/* Normalize rows by index */
$rows = [];
foreach ($dbRows as $row) {
    $idx = ((int)$row['employment_index']) - 1;
    if ($idx >= 0) {
        $rows[$idx] = $row;
    }
}
$rows = array_values($rows);

/* Fresher detection from database */
$isFresher = (!empty($rows[0]['is_fresher']) && $rows[0]['is_fresher'] === 'yes');
$defaultCount = $isFresher ? 1 : max(1, count($rows));
$maxCount = 5;
?>

<div class="candidate-form">

    <h2 class="section-title">
        <i class="fas fa-briefcase me-2"></i>Employment Details
    </h2>

    <p class="text-muted mb-4">
        Please list your recent employers starting with the most recent one.
    </p>

    <div class="alert alert-info mb-4">
        <i class="fas fa-info-circle me-2"></i>
        If you are a fresher, select <strong>Yes</strong> and fill only the first employer.
    </div>

  
    <div class="form-field mb-4">
        <label class="form-label">Select Number of Employments *</label>
        <select id="employmentCount"
                class="form-select"
                <?= $isFresher ? 'disabled' : '' ?>>
            <?php for ($i = 1; $i <= $maxCount; $i++): ?>
                <option value="<?= $i ?>" <?= $i === $defaultCount ? 'selected' : '' ?>>
                    <?= $i ?>
                </option>
            <?php endfor; ?>
        </select>
    </div>

  
    <div class="tabs-container mb-4">
        <div class="employment-tabs" id="employmentTabs"></div>
    </div>

   
    <form id="employmentForm" enctype="multipart/form-data">
        <div id="employmentContainer"></div>
    </form>

  
    <div id="employmentData"
         data-rows='<?= htmlspecialchars(json_encode($rows), ENT_QUOTES, "UTF-8") ?>'
         data-is-fresher="<?= $isFresher ? 'true' : 'false' ?>"
         data-default-count="<?= $defaultCount ?>"
         style="display:none"></div>
</div>


<div class="d-flex justify-content-between mt-4">
    <button type="button" class="btn prev-btn" data-form="employmentForm">
        Previous
    </button>
    <button type="button" class="btn btn-primary external-submit-btn" data-form="employmentForm">
        Next
    </button>
</div>


<template id="employmentTemplate">
    <div class="employment-card">
        <input type="hidden" name="id[]" value="">
        <input type="hidden" name="employment_index[]" value="">

        
        <div class="first-employer-fields" style="display: none;">
            <div class="form-grid">
                <div class="form-field">
                    <div class="radio-field">
                        <label class="radio-field-label">
                            Are you a fresher? <span class="required">*</span>
                        </label>
                        <div class="radio-options">
                            <label class="radio-option">
                                <input type="radio" name="is_fresher[0]" value="yes">
                                <span>Yes</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="is_fresher[0]" value="no" checked>
                                <span>No</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-field">
                    <div class="radio-field">
                        <label class="radio-field-label">
                            Are you currently employed? <span class="required">*</span>
                        </label>
                        <div class="radio-options">
                            <label class="radio-option">
                                <input type="radio" name="currently_employed[0]" value="yes">
                                <span>Yes</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="currently_employed[0]" value="no" checked>
                                <span>No</span>
                            </label>
                        </div>
                    </div>
                </div>

                
                <div class="form-field contact-employer-field" style="display:none;">
                    <div class="radio-field">
                        <label class="radio-field-label">
                            Can we contact your current employer? <span class="required">*</span>
                        </label>
                        <div class="radio-options">
                            <label class="radio-option">
                                <input type="radio" name="contact_employer[0]" value="yes">
                                <span>Yes</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="contact_employer[0]" value="no" checked>
                                <span>No</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="employment-card-header">
            <h5>Employment Information</h5>
            <span class="employment-badge">
                Employer <span class="employer-num"></span>
            </span>
        </div>

        <div class="employment-card-body">
            <div class="form-grid">
                <div class="form-field">
                    <label class="form-label">Employer Name *</label>
                    <input type="text" name="employer_name[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">Job Title *</label>
                    <input type="text" name="job_title[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">Employee ID *</label>
                    <input type="text" name="employee_id[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">Joining Date *</label>
                    <input type="date" name="joining_date[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">Relieving Date</label>
                    <input type="date" name="relieving_date[]">
                </div>

                <div class="form-field col-span-full">
                    <label class="form-label">Employer Address *</label>
                    <textarea name="employer_address[]" rows="3" required></textarea>
                </div>

                <div class="form-field col-span-full">
                    <label class="form-label">Reason for Leaving *</label>
                    <textarea name="reason_leaving[]" rows="3" required></textarea>
                </div>

                <div class="col-span-full section-divider">HR Details</div>
                <div class="form-field">
                    <label class="form-label">HR Manager Name</label>
                    <input type="text" name="hr_manager_name[]">
                </div>
                <div class="form-field">
                    <label class="form-label">HR Phone</label>
                    <input type="tel" name="hr_manager_phone[]">
                </div>
                <div class="form-field">
                    <label class="form-label">HR Email</label>
                    <input type="email" name="hr_manager_email[]">
                </div>

                <div class="col-span-full section-divider">Reporting Manager</div>
                <div class="form-field">
                    <label class="form-label">Manager Name</label>
                    <input type="text" name="manager_name[]">
                </div>
                <div class="form-field">
                    <label class="form-label">Manager Phone</label>
                    <input type="tel" name="manager_phone[]">
                </div>
                <div class="form-field">
                    <label class="form-label">Manager Email</label>
                    <input type="email" name="manager_email[]">
                </div>

                <div class="form-field col-span-full">
                    <label class="form-label">Employment Proof *</label>
                    <div class="upload-box">
                        <input type="file" name="employment_doc[]" accept=".pdf,.jpg,.jpeg,.png">
                        <p class="upload-hint">
                            Offer letter / Salary slip / Relieving letter (Max 5MB)
                        </p>
                    </div>

                    <input type="hidden" name="old_employment_doc[]" value="">
                    <div class="employment-doc-preview mt-2"></div>
                    <!-- Add this after the employment proof upload section -->
<!-- Add this after the employment proof upload section -->
<div class="form-field col-span-full mt-3">
    <div class="form-check insufficient-doc-check">
        <input type="checkbox" 
               name="insufficient_employment_docs[]" 
               class="form-check-input insufficient-emp-checkbox" 
               value="1">
        <label class="form-check-label">
            Insufficient Employment Proof
        </label>
    </div>
    <small class="text-muted">Check if employment document is unavailable</small>
</div>
                </div>

 
                <div class="form-field col-span-full text-end mt-4">
                    <button type="button"
                            class="btn btn-outline-secondary save-draft-btn"
                            data-page="employment">
                        Save Draft
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    window.APP_BASE_URL = "<?= APP_BASE_URL ?>";
</script>