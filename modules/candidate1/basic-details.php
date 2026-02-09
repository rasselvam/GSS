<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();
ensureApplicationExists($application_id);

$pdo = getDB();
$stmt = $pdo->prepare(
    "SELECT * FROM Vati_Payfiller_Candidate_Basic_details WHERE application_id=?"
);
$stmt->execute([$application_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

// Prefill immutable fields from case (created by client/bulk upload)
$casePrefill = [];
try {
    $prefillStmt = $pdo->prepare('CALL SP_Vati_Payfiller_GetCaseCandidatePrefill(?)');
    $prefillStmt->execute([$application_id]);
    $casePrefill = $prefillStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    while ($prefillStmt->nextRowset()) {
    }
} catch (Throwable $e) {
    $casePrefill = [];
}

$prefillFirstName = trim((string)($casePrefill['candidate_first_name'] ?? ''));
$prefillMiddleName = trim((string)($casePrefill['candidate_middle_name'] ?? ''));
$prefillLastName = trim((string)($casePrefill['candidate_last_name'] ?? ''));
$prefillEmail = trim((string)($casePrefill['candidate_email'] ?? ''));
$prefillMobileRaw = trim((string)($casePrefill['candidate_mobile'] ?? ''));

if (($row['first_name'] ?? '') === '' && $prefillFirstName !== '') $row['first_name'] = $prefillFirstName;
if (($row['middle_name'] ?? '') === '' && $prefillMiddleName !== '') $row['middle_name'] = $prefillMiddleName;
if (($row['last_name'] ?? '') === '' && $prefillLastName !== '') $row['last_name'] = $prefillLastName;
if (($row['email'] ?? '') === '' && $prefillEmail !== '') $row['email'] = $prefillEmail;
if (($row['mobile'] ?? '') === '' && $prefillMobileRaw !== '') $row['mobile'] = $prefillMobileRaw;


$mobileCode = '+91';
$mobileNumber = '';
if (!empty($row['mobile'])) {
    $p = preg_split('/\s+/', trim($row['mobile']), 2);
    $mobileCode = $p[0] ?? '+91';
    $mobileNumber = $p[1] ?? '';
}

$lockIdentity = ($prefillFirstName !== '' || $prefillLastName !== '' || $prefillEmail !== '' || $prefillMobileRaw !== '');

$citizenshipOptions = ['Indian','American','British','Australian','Canadian','German','French','Chinese','Japanese','Other'];
$countryOptions = ['India','United States','United Kingdom','Australia','Canada','Germany','France','China','Japan','Other'];
$stateOptions = [
    'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh',
    'Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
    'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
    'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
];
?>



<div class="candidate-form">

    <div class="section-title">
        <i class="fas fa-user me-2"></i>Basic Details
    </div>

    <p class="text-muted mb-4">
        Please provide your personal information accurately.
    </p>

    <!-- FORM -->
    <form id="basic-detailsForm">
        <div class="profile-section">
            <div class="profile-left">
                
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">First Name <span class="required">*</span></label>
                            <input type="text" name="first_name" class="form-control" required 
                                   <?php echo $lockIdentity ? 'readonly' : ''; ?>
                                   value="<?= htmlspecialchars($row['first_name'] ?? '') ?>">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Middle Name</label>
                            <input type="text" name="middle_name" class="form-control" 
                                   <?php echo $lockIdentity ? 'readonly' : ''; ?>
                                   value="<?= htmlspecialchars($row['middle_name'] ?? '') ?>">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Last Name <span class="required">*</span></label>
                            <input type="text" name="last_name" class="form-control" required 
                                   <?php echo $lockIdentity ? 'readonly' : ''; ?>
                                   value="<?= htmlspecialchars($row['last_name'] ?? '') ?>">
                        </div>
                    </div>
                </div>

                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Gender <span class="required">*</span></label>
                            <select name="gender" class="form-select" required>
                                <option value="">Select</option>
                                <?php foreach (['male','female','other'] as $g): ?>
                                    <option value="<?= $g ?>" <?= ($row['gender'] ?? '') === $g ? 'selected' : '' ?>>
                                        <?= ucfirst($g) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Date of Birth <span class="required">*</span></label>
                            <input type="date" name="dob" class="form-control" required 
                                   value="<?= htmlspecialchars($row['dob'] ?? '') ?>">
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Blood Group <span class="required">*</span></label>
                            <select name = "blood_group" class ="form-select" required>
                                <option value = "">Select</option>
                                <?php foreach(['O+','O-','A+','A-','B+','B-','AB+','AB-'] as $g): ?>
                                   <option value="<?= $g ?>" <?= ($row['blood_group'] ?? '') === $g ? 'selected' : '' ?>>
                                    <?= ucfirst($g) ?>
                                   </option>
                                  <?php endforeach; ?>
                                </select>
                        </div>
                    </div>

                </div>
            </div>

          
            <div class="profile-photo-section">
                <div class="photo-container">
                    <div class="photo-header">
                        <span class="photo-label">Profile Photo</span>
                        <span class="photo-info">(Max 5MB)</span>
                    </div>
                    
                    <div class="photo-wrapper" id="photoUploadTrigger">
                        
                        <div id="photoPreviewWrapper" class="photo-preview <?= empty($row['photo_path']) ? 'd-none' : '' ?>">
                            <img id="photoPreview" src="<?= !empty($row['photo_path']) ? htmlspecialchars($row['photo_path']) : '' ?>" 
                                 alt="Profile Photo">
                            <button type="button" id="removePhotoBtn" class="photo-remove-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        
                        <div id="photoUploadBox" class="photo-upload-box <?= !empty($row['photo_path']) ? 'd-none' : '' ?>">
                            <div class="upload-icon">
                                <i class="fas fa-camera"></i>
                            </div>
                            <div class="upload-text">Upload Photo</div>
                            <div class="upload-hint">JPG or PNG</div>
                        </div>
                    </div>

                    
                    <input type="file" id="photoInput" accept="image/jpeg,image/png" class="d-none">
                    
                   
                    <div id="photoMessage" class="photo-message"></div>
                </div>
            </div>
        </div>

        
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Father's Name <span class="required">*</span></label>
                    <input type="text" name="father_name" class="form-control" required 
                           value="<?= htmlspecialchars($row['father_name'] ?? '') ?>">
                </div>
            </div>
            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Mother's Name</label>
                    <input type="text" name="mother_name" class="form-control" 
                           value="<?= htmlspecialchars($row['mother_name'] ?? '') ?>">
                </div>
            </div>
            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Marital Status <span class="required">*</span></label>
                    <select name="marital_status" id="maritalStatus" class="form-select" required>
                        <option value="">Select</option>
                        <?php foreach (['single','married','divorced','widowed'] as $m): ?>
                            <option value="<?= $m ?>" <?= ($row['marital_status'] ?? '') === $m ? 'selected' : '' ?>>
                                <?= ucfirst($m) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
        </div>

        
        <div class="row g-3 mb-4" id="spouseField" style="display:<?= ($row['marital_status'] ?? '') === 'married' ? 'block' : 'none' ?>;">
            <div class="col-12">
                <div class="form-group">
                    <label class="form-label">Spouse Name</label>
                    <input type="text" name="spouse_name" class="form-control" 
                           value="<?= htmlspecialchars($row['spouse_name'] ?? '') ?>">
                </div>
            </div>
        </div>

        
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Mobile Number <span class="required">*</span></label>
                    <div class="input-group">
                        <select name="mobile_country_code" class="form-select" style="max-width: 100px;"<?php echo $lockIdentity ? ' disabled' : ''; ?>>
                            <?php foreach (['+91','+1','+44','+61','+81','+86'] as $c): ?>
                                <option value="<?= $c ?>" <?= $mobileCode === $c ? 'selected' : '' ?>><?= $c ?></option>
                            <?php endforeach; ?>
                        </select>
                        <input type="tel" name="mobile" class="form-control" required<?php echo $lockIdentity ? ' readonly' : ''; ?> 
                               value="<?= htmlspecialchars($mobileNumber) ?>">
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Email Address <span class="required">*</span></label>
                    <input type="email" name="email" class="form-control" required<?php echo $lockIdentity ? ' readonly' : ''; ?> 
                           value="<?= htmlspecialchars($row['email'] ?? '') ?>">
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Landline</label>
                    <input type="tel" name="landline" class="form-control" 
                           value="<?= htmlspecialchars($row['landline'] ?? '') ?>">
                </div>
            </div>
        </div>

    
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Country <span class="required">*</span></label>
                    <select name="country" class="form-select" required>
                        <option value="">Select</option>
                        <?php foreach ($countryOptions as $c): ?>
                            <option value="<?= $c ?>" <?= ($row['country'] ?? '') === $c ? 'selected' : '' ?>><?= $c ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">State <span class="required">*</span></label>
                    <select name="state" class="form-select" required>
                        <option value="">Select</option>
                        <?php foreach ($stateOptions as $s): ?>
                            <option value="<?= $s ?>" <?= ($row['state'] ?? '') === $s ? 'selected' : '' ?>><?= $s ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Citizenship <span class="required">*</span></label>
                    <select name="nationality" class="form-select" required>
                        <option value="">Select</option>
                        <?php foreach ($citizenshipOptions as $c): ?>
                            <option value="<?= $c ?>" <?= ($row['nationality'] ?? '') === $c ? 'selected' : '' ?>><?= $c ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
        </div>


        <div class="row g-3 mb-4">
            <div class="col-12">
                <div class="form-check normal-checkbox">
                    <input type="checkbox" class="form-check-input" id="hasOtherName" 
                           <?= !empty($row['other_name']) ? 'checked' : '' ?>>
                    <label class="form-check-label" for="hasOtherName">
                        Have you ever been known by another name?
                    </label>
                </div>
            </div>
        </div>

        <div class="row g-3 mb-4" id="otherNameField" style="display:<?= !empty($row['other_name']) ? 'block' : 'none' ?>;">
            <div class="col-md-4">
                <div class="form-group">
                    <label class="form-label">Other Name (Alias)</label>
                    <input type="text" name="other_name" class="form-control" 
                           value="<?= htmlspecialchars($row['other_name'] ?? '') ?>">
                </div>
            </div>
        </div>

        <input type="hidden" name="application_id" value="<?= $application_id ?>">
        <?php if (!empty($row['photo_path'])): ?>
            <input type="hidden" name="existing_photo" value="<?= htmlspecialchars($row['photo_path']) ?>">
        <?php endif; ?>


        <div class="form-actions">
            <button type="button" class="btn btn-outline-secondary save-draft-btn" data-page="basic-details">
                <i class="fas fa-save me-2"></i>Save Draft
            </button>
        </div>
    </form>
</div>


<div class="navigation-buttons">
    <button type="button" class="btn btn-primary external-submit-btn" data-form="basic-detailsForm">
        Next <i class="fas fa-arrow-right ms-2"></i>
    </button>
</div>

