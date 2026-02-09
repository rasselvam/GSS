<?php
header("Content-Type: application/json");
session_start();

require_once __DIR__ . "/../../config/env.php";
require_once __DIR__ . "/../../config/db.php";

class ValidationException extends Exception {}
class FileUploadException extends Exception {}


function validateAddress($address1, $city, $state, $country, $postal) {
    $required_fields = [$address1, $city, $state, $postal, $country];
}

/**
 * Handle file upload
 */
function handleFileUpload($file, $application_id) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds server max upload size',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form max size',
            UPLOAD_ERR_PARTIAL => 'File upload incomplete',
            UPLOAD_ERR_NO_FILE => 'No file uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'Upload stopped by extension'
        ];
        $msg = $errors[$file['error']] ?? 'File upload failed';
        throw new FileUploadException($msg);
    }

    $allowed = ['jpg', 'jpeg', 'png', 'pdf'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed)) {
        throw new ValidationException("Invalid file type. Allowed: JPG, JPEG, PNG, PDF");
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        throw new ValidationException("File size exceeds 5MB limit");
    }

    $dir = $_SERVER['DOCUMENT_ROOT'] . "/uploads/address/";
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $filename = "address_{$application_id}_" . time() . "_" . uniqid() . "." . $ext;
    $fullPath = $dir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
        throw new FileUploadException("Failed to save uploaded file");
    }

    return $filename;
}

/**
 * Get existing contact details
 */
function getExistingContact($pdo, $application_id) {
    $stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_contact_details(?)");
    $stmt->execute([$application_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor();
    return $row ?: [];
}


function cleanupUploadedFile($filename) {
    if ($filename && file_exists($_SERVER['DOCUMENT_ROOT'] . "/uploads/address/" . $filename)) {
        unlink($_SERVER['DOCUMENT_ROOT'] . "/uploads/address/" . $filename);
    }
}


try {
    if (!isset($_SESSION['application_id'])) {
        throw new ValidationException("Session expired. Please log in again.");
    }

    $pdo = getDB();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->beginTransaction();

    $application_id = $_SESSION['application_id'];
    $post = array_map('trim', $_POST);
    $same_as_current = !empty($post['same_as_current']);
   $insufficient_documents = isset($post['insufficient_address_proof']) && 
                         ($post['insufficient_address_proof'] === '1' || 
                          $post['insufficient_address_proof'] === 'on' || 
                          $post['insufficient_address_proof'] === 'true') ? 1 : 0;
                          
    $current_address1    = $post['current_address1'] ?? '';
    $current_address2    = $post['current_address2'] ?? '';
    $current_city        = $post['current_city'] ?? '';
    $current_state       = $post['current_state'] ?? '';
    $current_country     = $post['current_country'] ?? 'India';
    $current_postal_code = $post['current_postal_code'] ?? '';

    validateAddress($current_address1, $current_city, $current_state, $current_country, $current_postal_code);

    if ($same_as_current) {
        $permanent_address1    = $current_address1;
        $permanent_address2    = $current_address2;
        $permanent_city        = $current_city;
        $permanent_state       = $current_state;
        $permanent_country     = $current_country;
        $permanent_postal_code = $current_postal_code;
    } else {
        $permanent_address1    = $post['permanent_address1'] ?? '';
        $permanent_address2    = $post['permanent_address2'] ?? '';
        $permanent_city        = $post['permanent_city'] ?? '';
        $permanent_state       = $post['permanent_state'] ?? '';
        $permanent_country     = $post['permanent_country'] ?? 'India';
        $permanent_postal_code = $post['permanent_postal_code'] ?? '';
        validateAddress($permanent_address1, $permanent_city, $permanent_state, $permanent_country, $permanent_postal_code);
    }

    $allowed_proofs = ["Aadhaar", "Voter ID", "Passport", "Driving License", "Ration Card", "Utility Bill"];
    $proof_type = $post['proof_type'] ?? '';
    $proof_file = '';
    $uploaded_file = null;
    

if ($insufficient_documents) {
    $proof_file = ''; 
} else {
    $new_upload = isset($_FILES['address_proof_file']) && $_FILES['address_proof_file']['error'] === UPLOAD_ERR_OK;
    
    if ($new_upload) {
        $uploaded_file = handleFileUpload($_FILES['address_proof_file'], $application_id);
        $proof_file = $uploaded_file;
    } else {
        $existing = getExistingContact($pdo, $application_id);
        if (!empty($existing['proof_file']) && 
            $existing['proof_file'] !== 'INSUFFICIENT_DOCUMENTS') {
            $proof_file = $existing['proof_file'];
        } else {
            $proof_file = '';
        }
    }
}

$stmt = $pdo->prepare("CALL SP_Vati_Payfiller_save_contact_details(
    :current_address1,
    :current_address2,
    :current_city,
    :current_state,
    :current_country,
    :current_postal_code,
    :proof_type,
    :proof_file,
    :application_id,
    :same_as_current,
    :insufficient_documents,
    :permanent_address1,
    :permanent_address2,
    :permanent_city,
    :permanent_state,
    :permanent_country,
    :permanent_postal_code
)");

$stmt->execute([
    ':current_address1'     => $current_address1,
    ':current_address2'     => $current_address2,
    ':current_city'         => $current_city,
    ':current_state'        => $current_state,
    ':current_country'      => $current_country,
    ':current_postal_code'  => $current_postal_code,
    ':proof_type'           => $proof_type,
    ':proof_file'           => $proof_file,
    ':application_id'       => $application_id,
    ':same_as_current'      => $same_as_current ? 1 : 0,
     ':insufficient_documents' => $insufficient_documents ? 1 : 0, 
    ':permanent_address1'   => $permanent_address1,
    ':permanent_address2'   => $permanent_address2,
    ':permanent_city'       => $permanent_city,
    ':permanent_state'      => $permanent_state,
    ':permanent_country'    => $permanent_country,
    ':permanent_postal_code'=> $permanent_postal_code,
]);
    $stmt->closeCursor();
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Contact details saved successfully',
        'insufficient_documents' => $insufficient_documents ? 1 : 0

    ]);

} catch (ValidationException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    cleanupUploadedFile($uploaded_file ?? null);
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (FileUploadException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    cleanupUploadedFile($uploaded_file ?? null);
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    cleanupUploadedFile($uploaded_file ?? null);
    error_log("store_contact.php ERROR: " . $e->getMessage() . " on line " . $e->getLine());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}



