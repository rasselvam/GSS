<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();
ensureApplicationExists($application_id);

$pdo = getDB();

/* Fetch education details */
$stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_education_details(?)");
$stmt->execute([$application_id]);
$dbRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt->closeCursor();

/* Normalize rows */
$rows = [];
foreach ($dbRows as $row) {
    $idx = ((int)$row['education_index']) - 1;
    if ($idx >= 0) $rows[$idx] = $row;
}
$rows = array_values($rows);

$defaultCount = max(1, count($rows));
$maxCount = 4;
?>

<div class="candidate-form compact-form">

    <!-- HEADER -->
    <div class="form-header">
        <i class="fas fa-graduation-cap"></i> Education Details
    </div>

    <p class="text-muted mb-3">
        List your academic qualifications (highest first).
    </p>

    <!-- COUNT -->
    <div class="compact-card mb-3">
        <div class="form-field">
            <div class="form-control double-border compact-control">
                <label class="compact-label">
                    Number of Qualifications <span class="required">*</span>
                </label>
                <select id="educationCount" class="compact-select">
                    <?php for ($i = 1; $i <= $maxCount; $i++): ?>
                        <option value="<?= $i ?>" <?= $i === $defaultCount ? 'selected' : '' ?>>
                            <?= $i ?>
                        </option>
                    <?php endfor; ?>
                </select>
            </div>
        </div>
    </div>

    <!-- TABS -->
    <div class="tabs-container compact-tabs mb-3">
        <div class="education-tabs" id="educationTabs"></div>
    </div>

    <!-- FORM -->
    <form id="educationForm" enctype="multipart/form-data">
        <div id="educationContainer"></div>

        <div class="form-footer compact-footer">
            <button type="button"
                    class="btn-outline prev-btn"
                    data-form="educationForm">
                <i class="fas fa-arrow-left me-2"></i> Previous
            </button>

            <div class="footer-actions-right">
                <button type="button"
                        class="btn-secondary save-draft-btn"
                        data-page="education">
                    Save Draft
                </button>

                <button type="button"
                        class="btn-primary external-submit-btn"
                        data-form="educationForm">
                    Next <i class="fas fa-arrow-right ms-2"></i>
                </button>
            </div>
        </div>
    </form>

    <!-- DATA -->
    <div id="educationData"
         data-rows='<?= htmlspecialchars(json_encode($rows), ENT_QUOTES) ?>'
         data-default-count="<?= $defaultCount ?>"
         style="display:none"></div>
</div>

<!-- ================= TEMPLATE ================= -->
<template id="educationTemplate">
    <div class="compact-card education-card mb-3">

        <input type="hidden" name="id[]">
        <input type="hidden" name="education_index[]">
        <input type="hidden" name="old_marksheet_file[]">
        <input type="hidden" name="old_degree_file[]">

        <div class="education-card-header compact-header">
            <h6>Education <span class="education-num">1</span></h6>
        </div>

        <div class="education-card-body compact-body">

            <!-- ROW 1 -->
            <div class="form-row-3 compact-row mb-2">
                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">Qualification *</label>
                        <input type="text" name="qualification[]" class="compact-input">
                    </div>
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">College / Institution *</label>
                        <input type="text" name="college_name[]" class="compact-input">
                    </div>
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">University / Board *</label>
                        <input type="text" name="university_board[]" class="compact-input">
                    </div>
                </div>
            </div>

            <!-- ROW 2 -->
            <div class="form-row-3 compact-row mb-2">
                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">Roll Number *</label>
                        <input type="text" name="roll_number[]" class="compact-input">
                    </div>
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">From Year *</label>
                        <input type="month" name="year_from[]" class="compact-input">
                    </div>
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">To Year *</label>
                        <input type="month" name="year_to[]" class="compact-input">
                    </div>
                </div>
            </div>

            <!-- ROW 3 -->
            <div class="form-row-2 compact-row mb-2">
                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">College Address *</label>
                        <textarea name="college_address[]" class="compact-textarea"></textarea>
                    </div>
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">College Website</label>
                        <input type="url" name="college_website[]" class="compact-input">
                    </div>
                </div>
            </div>

            <!-- DOCUMENTS -->
            <div class="form-row-2 compact-row mb-2">
                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">Marksheet</label>
                        <input type="file" name="marksheet_file[]" class="compact-file" accept=".pdf,.jpg,.jpeg">
                        <div class="marksheet-preview mt-1"></div>
                    </div>
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">Degree Certificate</label>
                        <input type="file" name="degree_file[]" class="compact-file" accept=".pdf,.jpg,.jpeg">
                        <div class="degree-preview mt-1"></div>
                    </div>
                </div>
            </div>

            <!-- CHECKBOX -->
            <div class="form-row-full compact-row">
                <div class="form-check compact-checkbox">
                    <input type="checkbox"
                           name="insufficient_education_docs[]"
                           value="1">
                    <label class="compact-checkbox-label">
                        Insufficient Education Documents
                    </label>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
    window.APP_BASE_URL = "<?= APP_BASE_URL ?>";
</script>
