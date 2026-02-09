<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();
ensureApplicationExists($application_id);

$pdo = getDB();

try {
    $stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_education_details(?)");
    $stmt->execute([$application_id]);
    $dbRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $rows = [];
    foreach ($dbRows as $row) {
        $idx = ((int)$row['education_index']) - 1;
        if ($idx >= 0) $rows[$idx] = $row;
    }
    $rows = array_values($rows);

} catch (PDOException $e) {
    error_log("Error fetching education details: " . $e->getMessage());
    $rows = [];
}
?>

<div class="candidate-form">

    <h2 class="section-title">Education Details</h2>
    <p class="text-muted mb-4">
        Add your academic qualifications starting from highest level.
    </p>

   
    <div class="form-field mb-4">
        <label class="form-label">Select Number of Qualifications *</label>
        <select id="educationCount" class="form-select">
            <?php
            $count = max(1, count($rows));
            for ($i = 1; $i <= max(4, $count); $i++):
            ?>
                <option value="<?= $i ?>" <?= $i === $count ? 'selected' : '' ?>>
                    <?= $i ?>
                </option>
            <?php endfor; ?>
        </select>
    </div>

   
    <div class="education-tabs" id="educationTabs"></div>

   
    <form id="educationForm" enctype="multipart/form-data">
        <div id="educationContainer"></div>
    </form>

    
    <div id="educationData"
         data-rows='<?= htmlspecialchars(json_encode($rows), ENT_QUOTES, "UTF-8") ?>'
         style="display:none"></div>
</div>


<div class="d-flex justify-content-between mt-4">
    <button type="button" class="btn prev-btn" data-form="educationForm">
        Previous
    </button>
    <button type="button" class="btn btn-primary external-submit-btn" data-form="educationForm">
        Next
    </button>
</div>



<template id="educationTemplate">
    <div class="education-card">
        <input type="hidden" name="id[]" value="">
        <input type="hidden" name="old_marksheet_file[]" value="">
        <input type="hidden" name="old_degree_file[]" value="">
        <input type="hidden" name="education_index[]" value="">

        <div class="education-card-header">
            <h5>Academic Information</h5>
            <span class="education-badge">Education</span>
        </div>

        <div class="education-card-body">
            <div class="form-grid">

                <div class="form-field">
                    <label class="form-label">Qualification *</label>
                    <input type="text" name="qualification[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">College / Institution *</label>
                    <input type="text" name="college_name[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">University / Board *</label>
                    <input type="text" name="university_board[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">Roll / Register Number *</label>
                    <input type="text" name="roll_number[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">From Year *</label>
                    <input type="month" name="year_from[]" required>
                </div>

                <div class="form-field">
                    <label class="form-label">To Year *</label>
                    <input type="month" name="year_to[]" required>
                </div>

                <div class="form-field col-span-full">
                    <label class="form-label">College Address *</label>
                    <textarea name="college_address[]" rows="3" required></textarea>
                </div>

                <div class="form-field col-span-full">
                    <label class="form-label">College Website</label>
                    <input type="url" name="college_website[]">
                </div>

                <div class="col-span-full section-divider">
                    Academic Documents
                </div>

                <!-- Marksheet -->
                <div class="form-field col-span-half">
                    <label class="form-label">Marksheet *</label>
                    <input type="file" name="marksheet_file[]" accept=".pdf,.jpg,.jpeg">
                    <div class="marksheet-preview mt-2"></div>
                </div>

                <!-- Degree -->
                <div class="form-field col-span-half">
                    <label class="form-label">Degree / Certificate *</label>
                    <input type="file" name="degree_file[]" accept=".pdf,.jpg,.jpeg">
                    <div class="degree-preview mt-2"></div>
                </div>

                <!-- Add this after the degree upload section -->
<!-- Add this after the degree upload section -->
<div class="form-field col-span-full mt-3">
    <div class="form-check insufficient-doc-check">
<input type="checkbox" 
       name="insufficient_education_docs[]" 
       class="form-check-input insufficient-edu-checkbox" 
       value="1">
        <label class="form-check-label" 
               for="insufficient_edu_<?= $idx ?? '0' ?>">
            Insufficient Education Documents
        </label>
    </div>
    <small class="text-muted">Check if marksheet or degree certificate is unavailable</small>
</div>

                <div class="form-field col-span-full text-end mt-4">
                    <button type="button"
                            class="btn btn-outline-secondary save-draft-btn"
                            data-page="education">
                        Save Draft
                    </button>
                </div>

            </div>
        </div>
    </div>
</template>



<div id="docPreviewModal" class="doc-modal hidden">
    <div class="doc-modal-content">
        <button class="doc-close-btn" onclick="closeDocPreview()">×</button>
        <iframe id="docPreviewFrame"></iframe>
    </div>
</div>


<style>
.form-label { font-size: .9rem; font-weight: 500; }
.file-preview-pill {
    background: #f0fdf4;
    padding: 8px 12px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.doc-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}
.doc-modal.hidden { display: none; }
.doc-modal-content {
    width: 35%;
    height: 45%;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
}
.doc-modal-content iframe {
    width: 100%;
    height: 100%;
}
.doc-close-btn {
    position: absolute;
    top: 6px;
    right: 10px;
    font-size: 22px;
    background: none;
    border: none;
    cursor: pointer;
}
</style>


<script>
    window.APP_BASE_URL = "<?= APP_BASE_URL ?>";
</script>
