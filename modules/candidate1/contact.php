<?php 
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$application_id = getApplicationId();

$pdo = getDB();
$stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_contact_details(?)");
$stmt->execute([$application_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
$stmt->closeCursor(); // Important: close cursor after SP call


$commonCountries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'United Arab Emirates', 'Singapore', 'Other'];


$allCountries = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia',
    'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin',
    'Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
    'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia',
    'Comoros','Congo (Congo-Brazzaville)','Costa Rica','Croatia','Cuba','Cyprus','Czechia (Czech Republic)',
    'Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea',
    'Eritrea','Estonia','Eswatini (fmr. "Swaziland")','Ethiopia','Fiji','Finland','France','Gabon','Gambia',
    'Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti',
    'Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica',
    'Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho',
    'Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali',
    'Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia',
    'Montenegro','Morocco','Mozambique','Myanmar (formerly Burma)','Namibia','Nauru','Nepal','Netherlands',
    'New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan',
    'Palau','Palestine State','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
    'Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
    'Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone',
    'Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan',
    'Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Tajikistan','Tanzania','Thailand',
    'Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda',
    'Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
    'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
];

$allCountries = array_diff($allCountries, $commonCountries);
$allCountries = array_values($allCountries);


$indianStates = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
    'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
    'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
    'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
    'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];
?>

<div class="candidate-form">
    <h2 class="section-title">
        <i class="fas fa-address-book me-2"></i>Contact Information
    </h2>
    <p class="text-muted mb-4">
        Provide your current and permanent address details.
    </p>

    <form id="contactForm" enctype="multipart/form-data">
        <!-- CURRENT ADDRESS -->
        <h4 class="mb-3">Current Address</h4>
        <div class="form-grid">
            <div class="form-field col-span-full">
                <label class="form-label">Address Line 1 *</label>
                <input type="text" name="current_address1" class="form-control"
                       value="<?= htmlspecialchars($row['address1'] ?? '') ?>" required>
            </div>
            <div class="form-field col-span-full">
                <label class="form-label">Address Line 2</label>
                <input type="text" name="current_address2" class="form-control"
                       value="<?= htmlspecialchars($row['address2'] ?? '') ?>">
            </div>
            <div class="form-field">
                <label class="form-label">City *</label>
                <input type="text" name="current_city" class="form-control"
                       value="<?= htmlspecialchars($row['city'] ?? '') ?>" required>
            </div>
            <div class="form-field">
                <label class="form-label">State *</label>
                <select name="current_state" class="form-select" required>
                    <option value="">Select State</option>
                    <?php foreach ($indianStates as $state): ?>
                        <option value="<?= $state ?>" <?= ($row['state'] ?? '') === $state ? 'selected' : '' ?>>
                            <?= $state ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">Country *</label>
                <select name="current_country" class="form-select" required>
                    <?php foreach ($commonCountries as $country): ?>
                        <option value="<?= $country ?>" <?= ($row['country'] ?? 'India') === $country ? 'selected' : '' ?>>
                            <?= $country ?>
                        </option>
                    <?php endforeach; ?>
                    <option disabled>──────────</option>
                    <?php foreach ($allCountries as $country): ?>
                        <option value="<?= $country ?>" <?= ($row['country'] ?? '') === $country ? 'selected' : '' ?>>
                            <?= $country ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">Postal Code *</label>
                <input type="text" name="current_postal_code" class="form-control"
                       value="<?= htmlspecialchars($row['postal_code'] ?? '') ?>" required>
            </div>
        </div>

      
        <div class="mt-4 mb-4">
            <label style="display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem;">
                <input type="checkbox" id="sameAsCurrent" name="same_as_current" value="1"
                    <?= (!empty($row['same_as_current']) && $row['same_as_current'] == 1) ? 'checked' : '' ?>>
                <span>Permanent address same as current</span>
            </label>
        </div>

        <hr class="my-5">

       
        <h4 class="mb-3">Permanent Address</h4>
        <div class="form-grid" id="permanentAddressSection">
            <div class="form-field col-span-full">
                <label class="form-label">Address Line 1</label>
                <input type="text" name="permanent_address1" class="form-control"
                       value="<?= htmlspecialchars($row['permanent_address1'] ?? $row['address1'] ?? '') ?>">
            </div>
            <div class="form-field col-span-full">
                <label class="form-label">Address Line 2</label>
                <input type="text" name="permanent_address2" class="form-control"
                       value="<?= htmlspecialchars($row['permanent_address2'] ?? $row['address2'] ?? '') ?>">
            </div>
            <div class="form-field">
                <label class="form-label">City</label>
                <input type="text" name="permanent_city" class="form-control"
                       value="<?= htmlspecialchars($row['permanent_city'] ?? $row['city'] ?? '') ?>">
            </div>
            <div class="form-field">
                <label class="form-label">State</label>
                <select name="permanent_state" class="form-select">
                    <option value="">Select State</option>
                    <?php foreach ($indianStates as $state): ?>
                        <option value="<?= $state ?>" <?= ($row['permanent_state'] ?? $row['state'] ?? '') === $state ? 'selected' : '' ?>>
                            <?= $state ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">Country</label>
                <select name="permanent_country" class="form-select">
                    <?php foreach ($commonCountries as $country): ?>
                        <option value="<?= $country ?>" <?= ($row['permanent_country'] ?? $row['country'] ?? 'India') === $country ? 'selected' : '' ?>>
                            <?= $country ?>
                        </option>
                    <?php endforeach; ?>
                    <option disabled>──────────</option>
                    <?php foreach ($allCountries as $country): ?>
                        <option value="<?= $country ?>" <?= ($row['permanent_country'] ?? $row['country'] ?? '') === $country ? 'selected' : '' ?>>
                            <?= $country ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">Postal Code</label>
                <input type="text" name="permanent_postal_code" class="form-control"
                       value="<?= htmlspecialchars($row['permanent_postal_code'] ?? $row['postal_code'] ?? '') ?>">
            </div>
        </div>

        <hr class="my-5">

        
        <h4 class="mb-3">Address Proof</h4>
        <div class="form-grid">
            <div class="form-field">
                <label class="form-label">Proof Type *</label>
                <select name="proof_type" class="form-select" required>
                    <option value="">Select</option>
                    <?php
                    $opts = ["Aadhaar", "Voter ID", "Passport", "Driving License", "Ration Card", "Utility Bill"];
                    $current_proof_type = $row['proof_type'] ?? '';
                    foreach ($opts as $opt):
                    ?>
                        <option value="<?= $opt ?>"
                            <?= $current_proof_type === $opt ? 'selected' : '' ?>>
                            <?= $opt ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-field col-span-full" id="addressProofUpload">
                <label class="form-label">Upload Address Proof *</label>
                <div class="upload-box">
                    <input type="file" name="address_proof_file" accept=".pdf,.jpg,.jpeg,.png" class="form-control">
                    <p class="upload-hint">
                        Upload Aadhaar, Utility Bill, etc. (PDF, JPG, PNG - Max 5MB)
                    </p>
                </div>

                <div id="addressProofPreview" class="mt-3">
                    <?php if (!empty($row['proof_file'])): 
                        $file_path = "/uploads/address/" . htmlspecialchars($row['proof_file']);
                        $full_path = $_SERVER['DOCUMENT_ROOT'] . $file_path;
                        $file_exists = file_exists($full_path);
                    ?>
                        <div class="file-preview-pill">
                            <i class="fas <?= $file_exists ? 'fa-check-circle text-success' : 'fa-exclamation-triangle text-warning' ?> me-2"></i>
                            <?= $file_exists ? 'Current file:' : 'File missing:' ?>
                            <a href="javascript:void(0)" 
                               onclick="openDocumentPreview('<?= $file_path ?>', '<?= htmlspecialchars($row['proof_file']) ?>')"
                               class="text-primary ms-2 text-decoration-none">
                                Preview <?= htmlspecialchars($row['proof_file']) ?>
                            </a>
                        </div>
                    <?php endif; ?>
                </div>

                <div class="form-text mt-2">
                    <small>If you have already uploaded a file, you can keep it or upload a new one.</small>
                </div>
            </div>
        </div>

<!-- Add this after the address proof upload section -->
<div class="form-field col-span-full mt-3">
    <div class="form-check insufficient-doc-check">
<input type="checkbox" 
       name="insufficient_address_proof" 
       class="form-check-input" 
       value="1"
       id="insufficient_address"
       <?= (isset($row['insufficient_documents']) && $row['insufficient_documents'] == 1) ? 'checked' : '' ?>>
        <label class="form-check-label" 
               for="insufficient_address">
            Insufficient Address Proof
        </label>
    </div>
    <small class="text-muted">Check if address proof document is unavailable</small>
</div>

        <div class="form-field col-span-full text-end mt-5">
            <button type="button" class="btn btn-outline-secondary save-draft-btn" data-page="contact">
                <i class="fas fa-save me-2"></i>Save Draft
            </button>
        </div>
    </form>
</div>

<div class="d-flex justify-content-between mt-5">
    <button type="button" class="btn prev-btn" data-form="contactForm">Previous</button>
    <button type="button" class="btn btn-primary external-submit-btn" data-form="contactForm">Next</button>
</div>

<?php
$contactData = [
    'address1' => $row['address1'] ?? '',
    'address2' => $row['address2'] ?? '',
    'city' => $row['city'] ?? '',
    'state' => $row['state'] ?? '',
    'country' => $row['country'] ?? 'India',
    'postal_code' => $row['postal_code'] ?? '',
    'same_as_current' => $row['same_as_current'] ?? 0,
    'permanent_address1' => $row['permanent_address1'] ?? '',
    'permanent_address2' => $row['permanent_address2'] ?? '',
    'permanent_city' => $row['permanent_city'] ?? '',
    'permanent_state' => $row['permanent_state'] ?? '',
    'permanent_country' => $row['permanent_country'] ?? '',
    'permanent_postal_code' => $row['permanent_postal_code'] ?? '',
    'proof_file' => $row['proof_file'] ?? '',
    'insufficient_address_proof' => $row['insufficient_address_proof'] ?? 0,
    'proof_type' => $row['proof_type'] ?? ''
];
?>


<script>
// Pass the data to JavaScript
window.CONTACT_DATA = <?php echo json_encode($contactData); ?>;
</script>