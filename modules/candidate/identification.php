<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();
ensureApplicationExists($application_id);

$pdo = getDB();

/* ================= COUNTRY FROM BASIC DETAILS ================= */
$stmt = $pdo->prepare("
    SELECT country 
    FROM Vati_Payfiller_Candidate_Basic_details 
    WHERE application_id = ?
");
$stmt->execute([$application_id]);
$basicDetails = $stmt->fetch(PDO::FETCH_ASSOC);
$candidateCountry = $basicDetails['country'] ?? 'India';

/* ================= FETCH IDENTIFICATION ================= */
$stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_identification_details(?)");
$stmt->execute([$application_id]);
$dbRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt->closeCursor();

/* Normalize rows by document_index */
$rows = [];
foreach ($dbRows as $row) {
    $idx = ((int)$row['document_index']) - 1;
    if ($idx >= 0) {
        $rows[$idx] = $row;
    }
}
$rows = array_values($rows);

/* ================= STATIC DATA ================= */
$documentTypes = [
    'India' => ['Aadhaar','PAN','Passport','Driving Licence','Voter ID','Other'],
    'USA'   => ['SSN','Passport','Driver License','State ID','Other'],
    'UK'    => ['Passport','Driving Licence','NIN','Other'],
    'Other' => ['Passport','National ID','Other']
];

$countries = ['India','USA','UK','Canada','Australia','Other'];
$count = max(1, count($rows));
$maxCount = 3;
?>

<div class="candidate-form compact-form">

    <!-- HEADER -->
    <div class="form-header">
        <i class="fas fa-id-card"></i> Identification Details
    </div>

    <p class="text-muted mb-3">
        Add your government-issued identification documents.
    </p>

    <!-- COUNTRY & COUNT -->
    <div class="compact-card mb-3">
        <div class="form-row-2 compact-row">
            <div class="form-field">
                <div class="form-control double-border compact-control">
                    <label class="compact-label">Country <span class="required">*</span></label>
                    <select id="identificationCountry" class="compact-select">
                        <?php foreach ($countries as $c): ?>
                            <option value="<?= $c ?>" <?= $c === $candidateCountry ? 'selected' : '' ?>>
                                <?= $c ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="form-field">
                <div class="form-control double-border compact-control">
                    <label class="compact-label">Number of Documents</label>
                    <select id="identificationCount" class="compact-select">
                        <?php for ($i = 1; $i <= $maxCount; $i++): ?>
                            <option value="<?= $i ?>" <?= $i === $count ? 'selected' : '' ?>>
                                <?= $i ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- TABS -->
    <div class="tabs-container compact-tabs mb-3">
        <div class="identification-tabs" id="identificationTabs"></div>
    </div>

    <!-- FORM -->
    <form id="identificationForm" enctype="multipart/form-data" novalidate>
        <input type="hidden"
               name="identification_country"
               id="identificationCountryField"
               value="<?= htmlspecialchars($candidateCountry) ?>">

        <!-- ⚠️ THIS CONTAINER IS CLEARED BY TABMANAGER -->
        <div id="identificationContainer"></div>

        <!-- DATA FOR JS -->
        <div id="identificationData"
             data-rows='<?= htmlspecialchars(json_encode($rows), ENT_QUOTES) ?>'
             data-country='<?= htmlspecialchars($candidateCountry, ENT_QUOTES) ?>'
             data-document-types='<?= htmlspecialchars(json_encode($documentTypes), ENT_QUOTES) ?>'
             data-countries='<?= htmlspecialchars(json_encode($countries), ENT_QUOTES) ?>'
             data-count='<?= $count ?>'
             style="display:none"></div>
    </form>

    <!-- FOOTER -->
    <div class="form-footer compact-footer">
        <button type="button" class="btn-outline prev-btn">
            <i class="fas fa-arrow-left me-2"></i> Previous
        </button>

        <div class="footer-actions-right">
            <button type="button"
                    class="btn-secondary save-draft-btn"
                    data-page="identification">
                Save Draft
            </button>

            <button type="button"
                    class="btn-primary external-submit-btn"
                    data-form="identificationForm">
                Next <i class="fas fa-arrow-right ms-2"></i>
            </button>
        </div>
    </div>
</div>

<!-- =========================================================
     TEMPLATE (⚠️ MUST BE OUTSIDE identificationContainer)
========================================================= -->
<template id="identificationTemplate">
    <div class="compact-card identification-card mb-3">

        <input type="hidden" name="id[]" value="">
        <input type="hidden" name="document_index[]" value="">
        <input type="hidden" name="old_upload_document[]" value="">

        <div class="identification-card-header compact-header">
            <h6 class="mb-0">Document <span class="document-num">1</span></h6>
        </div>

        <div class="identification-card-body compact-body">

            <!-- TYPE + NUMBER -->
            <div class="form-row-3 compact-row mb-2">
                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">Document Type *</label>
                        <select name="documentId_type[]"
                                class="compact-select document-type-select"></select>
                    </div>
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">ID Number *</label>
                        <input type="text" name="id_number[]" class="compact-input">
                        <!-- <small class="text-muted compact-hint id-number-hint"></small> -->
                    </div>
                </div>
                
                <div class="form-control double-border compact-control">
                    <div class="form-field">
                      <label class="compact-label">Name on Document *</label>
                      <input type="text" name="name[]" class="compact-input">
                </div>
                </div>
            </div>


            <!-- DATES -->
            <div class="form-row-2 compact-row mb-2">
                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">Issue Date</label>
                        <input type="date" name="issue_date[]" class="compact-input">
                    </div>      
                </div>

                <div class="form-field">
                    <div class="form-control double-border compact-control">
                        <label class="compact-label">Expiry Date</label>
                        <input type="date"  name="expiry_date[]"   class="compact-input expiry-date-input">
                        <small class="text-muted compact-hint expiry-date-hint"></small>
                    </div>
                </div>
            </div>

            <!-- FILE -->
            <div class="form-row-full compact-row mb-2">
                <div class="form-control double-border compact-control">
                    <label class="compact-label">Upload Document *</label>
                    <input type="file"
                           name="upload_document[]"
                           accept=".pdf,.jpg,.jpeg,.png"
                           class="compact-file">
                    <div class="identification-preview mt-1"></div>
                </div>
            </div>

            <!-- INSUFFICIENT -->
            <div class="form-row-full compact-row">
                <div class="form-check compact-checkbox">
                    <input type="checkbox"
                           name="insufficient_documents[]"
                           value="1">
                    <label class="compact-checkbox-label">
                        Insufficient Documents
                    </label>
                </div>
            </div>

        </div>
    </div>
</template>

<!-- ================= SMALL PREVIEW MODAL ================= -->
<div class="modal fade" id="documentPreviewModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width:360px;">
        <div class="modal-content compact-preview-modal">
            <div class="modal-header py-2">
                <h6 class="modal-title">Document Preview</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body p-2 text-center" id="previewModalBody"></div>

            <div class="modal-footer py-2">
                <a id="previewDownloadBtn"
                   class="btn btn-sm btn-outline-primary"
                   target="_blank"
                   download>
                    Download
                </a>
                <button class="btn btn-sm btn-secondary" data-bs-dismiss="modal">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>

<!-- ================= STYLES ================= -->
<style>
.compact-preview-modal img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 6px;
}
</style>

<script>
    window.APP_BASE_URL = "<?= APP_BASE_URL ?>";
</script>
