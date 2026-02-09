<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();
ensureApplicationExists($application_id);

$pdo = getDB();
$stmt = $pdo->prepare("SELECT * FROM `Vati_Payfiller_Candidate_Reference_details` WHERE `application_id` = ?");
$stmt->execute([$application_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
?>

<div class="candidate-flex">

    <div class="candidate-form" style="width: 100%;">

        <h2 class="section-title"><i class="fas fa-users me-2"></i>Reference Details</h2>
        <p class="text-muted mb-3">Provide a professional reference.</p>

        <form id="referenceForm">

            
            <div id="referenceData" 
                 data-reference='<?= htmlspecialchars(json_encode($row), ENT_QUOTES, 'UTF-8') ?>'
                 style="display: none;"></div>

           
            <div class="form-grid">

                <div class="form-field">
                    <label>Reference Name *</label>
                    <input type="text" name="reference_name"
                           value="<?= htmlspecialchars($row['reference_name'] ?? '') ?>" required>
                </div>

                <div class="form-field">
                    <label>Designation *</label>
                    <input type="text" name="reference_designation"
                           value="<?= htmlspecialchars($row['reference_designation'] ?? '') ?>" required>
                </div>

                <div class="form-field">
                    <label>Company *</label>
                    <input type="text" name="reference_company"
                           value="<?= htmlspecialchars($row['reference_company'] ?? '') ?>" required>
                </div>

                <div class="form-field">
                    <label>Mobile *</label>
                    <input type="text" name="reference_mobile"
                           value="<?= htmlspecialchars($row['reference_mobile'] ?? '') ?>" required>
                </div>

                <div class="form-field">
                    <label>Email *</label>
                    <input type="email" name="reference_email"
                           value="<?= htmlspecialchars($row['reference_email'] ?? '') ?>" required>
                </div>

                <div class="form-field">
                    <label>Relationship *</label>
                    <input type="text" name="relationship"
                           value="<?= htmlspecialchars($row['relationship'] ?? '') ?>" required>
                </div>

              
                <div class="form-field col-span-2">
                    <label>Years Known *</label>
                    <input type="number" name="years_known" min="1"
                           value="<?= htmlspecialchars($row['years_known'] ?? '') ?>" required>
                </div>

            </div>

            <div class="form-field col-span-2 text-end mt-3">
                <button type="button" 
                        class="btn btn-outline-secondary save-draft-btn" 
                        data-page="reference">
                    <i class="fas fa-save me-2"></i>Save Draft
                </button>
            </div>
        </form>
    </div>

</div>

<div class="d-flex justify-content-between align-items-center mt-4">
    <button type="button" class="btn prev-btn" data-form="referenceForm">Previous</button>

    <button type="button" class="btn btn-primary external-submit-btn"
        data-form="referenceForm">
        Next
    </button>
</div>

