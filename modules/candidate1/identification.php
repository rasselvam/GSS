<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();
ensureApplicationExists($application_id);

$pdo = getDB();



$stmt = $pdo->prepare("
    SELECT country 
    FROM Vati_Payfiller_Candidate_Basic_details 
    WHERE application_id = ?
");
$stmt->execute([$application_id]);
$basicDetails = $stmt->fetch(PDO::FETCH_ASSOC);
$candidateCountry = $basicDetails['country'] ?? 'India';


$stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_identification_details(?)");
$stmt->execute([$application_id]);
$dbRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt->nextRowset();

$rows = [];
foreach ($dbRows as $row) {
    $idx = ((int)$row['document_index']) - 1;
    if ($idx >= 0) $rows[$idx] = $row;
}
$rows = array_values($rows);



$documentTypes = [
    'India' => [
        'Aadhaar Card' => 'Aadhaar',
        'PAN Card' => 'PAN',
        'Passport' => 'Passport',
        'Driving Licence' => 'Driving Licence',
        'Voter ID' => 'Voter ID',
        'Ration Card' => 'Ration Card',
        'Other' => 'Other'
    ],
    'USA' => [
        'Social Security Card (SSN)' => 'SSN',
        'Passport' => 'Passport',
        'Driver License' => 'Driver License',
        'State ID Card' => 'State ID',
        'Birth Certificate' => 'Birth Certificate',
        'Green Card' => 'Green Card',
        'Other' => 'Other'
    ],
    'UK' => [
        'Passport' => 'Passport',
        'Driving Licence' => 'Driving Licence',
        'National Insurance Number' => 'NIN',
        'Biometric Residence Permit' => 'BRP',
        'Birth Certificate' => 'Birth Certificate',
        'Other' => 'Other'
    ],
    'Other' => [
        'Passport' => 'Passport',
        'National ID Card' => 'National ID',
        'Driver License' => 'Driver License',
        'Other' => 'Other'
    ]
];

$countries = [
    'India','USA','UK','Canada','Australia','UAE',
    'Singapore','Germany','France','Japan','Other'
];
?>

<div class="candidate-form">

    <h2 class="section-title">
        <i class="fas fa-id-card me-2"></i>Identification Details
    </h2>

    <p class="text-muted mb-4">
        Add your government-issued identification documents.
    </p>

 
    <div id="identificationData"
         data-rows='<?= htmlspecialchars(json_encode($rows), ENT_QUOTES) ?>'
         data-country='<?= htmlspecialchars($candidateCountry, ENT_QUOTES) ?>'
         data-document-types='<?= htmlspecialchars(json_encode($documentTypes), ENT_QUOTES) ?>'
         data-countries='<?= htmlspecialchars(json_encode($countries), ENT_QUOTES) ?>'
         style="display:none"></div>

    <div class="form-field mb-4">
        <label class="form-label">Select Country *</label>
        <select id="identificationCountry" class="form-select">
            <?php foreach ($countries as $c): ?>
                <option value="<?= $c ?>" <?= $c === $candidateCountry ? 'selected' : '' ?>>
                    <?= $c ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="form-field mb-4">
        <label class="form-label">Number of Documents *</label>
        <select id="identificationCount" class="form-select">
            <?php
            $count = max(1, count($rows));
            for ($i = 1; $i <= max(3, $count); $i++):
            ?>
                <option value="<?= $i ?>" <?= $i === $count ? 'selected' : '' ?>>
                    <?= $i ?>
                </option>
            <?php endfor; ?>
        </select>
    </div>

    <div id="identificationTabs" class="identification-tabs mb-3"></div>
    <form id="identificationForm" enctype="multipart/form-data" novalidate>

        <input type="hidden"
               name="identification_country"
               id="identificationCountryField"
               value="<?= htmlspecialchars($candidateCountry) ?>">

        <div id="identificationContainer" class="identification-container"></div>

        <div class="text-end mt-4">
            <button type="button"
                    class="btn btn-outline-secondary save-draft-btn"
                    data-page="identification">
                <i class="fas fa-save me-2"></i>Save Draft
            </button>
        </div>

    </form>
    

</div>


<div class="d-flex justify-content-between mt-4">
    <button type="button"
            class="btn btn-outline-secondary prev-btn"
            data-form="identificationForm">
        <i class="fas fa-arrow-left me-2"></i>Previous
    </button>

    <button type="button"
            class="btn btn-primary external-submit-btn"
            data-form="identificationForm">
        Next<i class="fas fa-arrow-right ms-2"></i>
    </button>
</div>


<template id="identificationTemplate">
    <div class="identification-card">
        <input type="hidden" name="document_index[]">
        <input type="hidden" name="id[]">
        <input type="hidden" name="old_upload_document[]">
       <input type="hidden" name="old_insufficient_document[]" value="">
        <div class="form-grid">
            <div class="form-field">
                <label>Document Type *</label>
                <select name="documentId_type[]" class="form-select document-type-select"></select>
            </div>

            <div class="form-field">
                <label>ID Number *</label>
                <input type="text" name="id_number[]" class="form-control">
                <small class="id-number-hint text-muted"></small>
            </div>

            <div class="form-field">
                <label>Name *</label>
                <input type="text" name="name[]" class="form-control">
            </div>

            <div class="form-field">
                <label>Issue Date</label>
                <input type="date" name="issue_date[]" class="form-control">
            </div>

            <div class="form-field expiry-date-field">
                <label>Expiry Date</label>
                <input type="date" name="expiry_date[]" class="form-control expiry-date-input">
                <small class="expiry-date-hint text-muted"></small>
            </div>

            <div class="form-field col-span-full">
                <label>Upload Document *</label>
                <input type="file"
                       name="upload_document[]"
                       class="form-control"
                       accept=".pdf,.jpg,.jpeg,.png">
            </div>
            
            <div class="form-field col-span-full">
                <div class="identification-preview mt-2"></div>
            </div>

<!-- Add this after the document upload section -->
<div class="form-field col-span-full mt-3">
    <div class="form-check insufficient-doc-check">
        <input type="checkbox" 
               name="insufficient_documents[]" 
               class="form-check-input" 
               value="1"
               id="insufficient_doc_<?= $idx ?? '0' ?>">
        <label class="form-check-label" 
               for="insufficient_doc_<?= $idx ?? '0' ?>">
            Insufficient Documents
        </label>
    </div>
    <small class="text-muted d-block mt-1">Check if this document is unavailable for upload</small>
</div>
        </div>
    </div>
</template>
