<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_start();
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

class ValidationException extends Exception {}
class FileUploadException extends Exception {}

function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}


function deletePhotoFile($photoPath) {
    if (!$photoPath) return;
    
    $fullPath = $_SERVER['DOCUMENT_ROOT'] . $photoPath;
    if (file_exists($fullPath) && is_writable($fullPath)) {
        if (!@unlink($fullPath)) {
            error_log("Failed to delete photo file: $fullPath");
            return false;
        }
    } else {
        error_log("Photo file not found or not writable: $fullPath");
        return false;
    }
    return true;
}


function prepareBasicDetailsParams($data, $application_id, $photoPath = null) {
    return [
        $data['first_name'] ?? '',
        $data['middle_name'] ?? '',
        $data['last_name'] ?? '',
        $data['gender'] ?? null,
        $data['dob'] ?? null,
        $data['blood_group'] ?? '',
        
        $data['father_name'] ?? '',
        $data['mother_name'] ?? '',
        $data['mobile'] ?? null,
        $data['landline'] ?? '',
        $data['email'] ?? '',
        $data['marital_status'] ?? null,
        
        $data['spouse_name'] ?? '',
        $data['other_name'] ?? '',
        $data['country'] ?? null,
        $data['state'] ?? null,
        $data['nationality'] ?? null,
        $application_id,
        $photoPath
    ];
}


function saveBasicDetails($pdo, $params) {
    $placeholders = rtrim(str_repeat('?,', count($params)), ',');
    $stmt = $pdo->prepare("CALL SP_Vati_Payfiller_save_basic_details($placeholders)");
    $success = $stmt->execute($params);
    $stmt->closeCursor();
    return $success;
}

function getBasicDetails($pdo, $application_id) {
    $stmt = $pdo->prepare("CALL SP_Vati_Payfiller_get_basic_details(?)");
    $stmt->execute([$application_id]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor();
    return $data;
}

try {
    $pdo = getDB();
    $pdo->beginTransaction();

    $application_id = $_SESSION['application_id'] ?? null;
    if (!$application_id) {
        throw new Exception("Session expired. Application ID missing.");
    }


    if (isset($_POST['remove_photo'])) {
        try {
            $currentData = getBasicDetails($pdo, $application_id);
            if (!$currentData) {
                throw new Exception("No record found for the given application ID");
            }
            
            $oldPhoto = $currentData['photo_path'] ?? null;
            $params = prepareBasicDetailsParams($currentData, $application_id, null);
            $success = saveBasicDetails($pdo, $params);
            
            if (!$success) {
                throw new Exception("Failed to update record");
            }

            if ($oldPhoto) {
                deletePhotoFile($oldPhoto);
            }

            $pdo->commit();
            echo json_encode([
                "success" => true,
                "message" => "Photo removed successfully"
            ]);
            exit;
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Photo removal error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to remove photo: " . $e->getMessage(),
                "type" => "database"
            ]);
            exit;
        }
    }

  
    $photoPath = null;
    $isPhotoOnly = !empty($_FILES['photo']['tmp_name']) && empty($_POST['first_name']);

    if (!empty($_FILES['photo']['tmp_name'])) {
        $file = $_FILES['photo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new FileUploadException("Photo upload failed");
        }

     
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg','jpeg','png'])) {
            throw new ValidationException("Only JPG, JPEG, or PNG files are allowed");
        }

  
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new ValidationException("Photo must be under 5MB");
        }

        
        $dir = $_SERVER['DOCUMENT_ROOT'] . "/uploads/photos/";
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

       
        $name = "photo_{$application_id}_" . time() . ".$ext";
        $photoPath = "/uploads/photos/" . $name;
        
        if (!move_uploaded_file($file['tmp_name'], $_SERVER['DOCUMENT_ROOT'] . $photoPath)) {
            throw new FileUploadException("Failed to save photo");
        }
        
      
        if ($isPhotoOnly) {
            $existing = getBasicDetails($pdo, $application_id) ?: [];
            
           
            if (!empty($existing['photo_path'])) {
                deletePhotoFile($existing['photo_path']);
            }
            
            
            $_POST = array_merge($existing, $_POST);
        }
    }
    $_POST = sanitizeInput($_POST);


    if (empty($photoPath) && !empty($_POST['existing_photo'])) {
        $photoPath = $_POST['existing_photo'];
    }

   
    if (!$isPhotoOnly && !isset($_POST['save_draft'])) {
        $required = [
            'first_name', 'last_name', 'gender', 'dob',
            'father_name', 'mobile', 'email', 'marital_status',
            'country', 'state', 'nationality'
        ];

        foreach ($required as $field) {
            if (empty(trim($_POST[$field] ?? ''))) {
                throw new ValidationException(ucwords(str_replace('_', ' ', $field)) . " is required");
            }
        }

        if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException("Invalid email address");
        }
    }


    $mobile = null;
    if (!empty($_POST['mobile'])) {
        $code = trim($_POST['mobile_country_code'] ?? '');
        $num = trim($_POST['mobile']);
        $mobile = ($code && $num) ? "$code $num" : $num;
    }

    $params = prepareBasicDetailsParams(
        array_merge($_POST, ['mobile' => $mobile]),
        $application_id,
        $photoPath
    );
    
    $success = saveBasicDetails($pdo, $params);
    
    if (!$success) {
        throw new Exception("Failed to save basic details");
    }
    
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "data" => $photoPath ? ["photo_url" => $photoPath] : []
    ]);

} catch (ValidationException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (!empty($photoPath)) {
        $newPhotoFullPath = $_SERVER['DOCUMENT_ROOT'] . $photoPath;
        if (file_exists($newPhotoFullPath)) {
            @unlink($newPhotoFullPath);
        }
    }
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Validation Error: " . $e->getMessage(),
        "type" => "validation"
    ]);
} catch (FileUploadException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (!empty($photoPath)) {
        $newPhotoFullPath = $_SERVER['DOCUMENT_ROOT'] . $photoPath;
        if (file_exists($newPhotoFullPath)) {
            @unlink($newPhotoFullPath);
        }
    }
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "File Upload Error: " . $e->getMessage(),
        "type" => "file_upload"
    ]);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (!empty($photoPath)) {
        $newPhotoFullPath = $_SERVER['DOCUMENT_ROOT'] . $photoPath;
        if (file_exists($newPhotoFullPath)) {
            @unlink($newPhotoFullPath);
        }
    }
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "A database error occurred. Please try again.",
        "type" => "database"
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (!empty($photoPath)) {
        $newPhotoFullPath = $_SERVER['DOCUMENT_ROOT'] . $photoPath;
        if (file_exists($newPhotoFullPath)) {
            @unlink($newPhotoFullPath);
        }
    }
    error_log("Unexpected Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "An unexpected error occurred. Please try again.",
        "type" => "unexpected"
    ]);
}