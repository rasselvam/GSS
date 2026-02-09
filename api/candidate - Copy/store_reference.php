<?php
session_start();
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

class ValidationException extends Exception {}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
        exit;
    }

    $application_id = $_SESSION['application_id'] ?? null;
    if (!$application_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Session expired. Please login again.']);
        exit;
    }

    $pdo = getDB();
    $pdo->beginTransaction();

    $isDraft = isset($_POST['draft']) && $_POST['draft'] === '1';

    $data = [
        'reference_name'        => trim($_POST['reference_name'] ?? ''),
        'reference_designation' => trim($_POST['reference_designation'] ?? ''),
        'reference_company'     => trim($_POST['reference_company'] ?? ''),
        'reference_mobile'      => trim($_POST['reference_mobile'] ?? ''),
        'reference_email'       => trim($_POST['reference_email'] ?? ''),
        'relationship'          => trim($_POST['relationship'] ?? ''),
        'years_known'           => trim($_POST['years_known'] ?? '')
    ];

    $required = array_keys($data);

    if ($isDraft) {
        $hasAnyData = false;
        foreach ($data as $value) {
            if ($value !== '') {
                $hasAnyData = true;
                break;
            }
        }
        if (!$hasAnyData) {
            $pdo->commit();
            echo json_encode([
                'success' => true,
                'message' => 'Draft saved (empty)',
                'is_draft' => true
            ]);
            exit;
        }
    }

    foreach ($required as $field) {
        if ($data[$field] === '') {
            throw new ValidationException(
                ucwords(str_replace('_', ' ', $field)) . " is required"
            );
        }
    }

    if (!filter_var($data['reference_email'], FILTER_VALIDATE_EMAIL)) {
        throw new ValidationException("Invalid email format");
    }

    if (!preg_match('/^[0-9]{10}$/', $data['reference_mobile'])) {
        throw new ValidationException("Mobile number must be exactly 10 digits");
    }

    if (!ctype_digit($data['years_known']) || (int)$data['years_known'] <= 0) {
        throw new ValidationException("Years known must be a positive number");
    }


    $stmt = $pdo->prepare("
        CALL SP_Vati_Payfiller_save_reference_details(
            :application_id,
            :reference_name,
            :reference_designation,
            :reference_company,
            :reference_mobile,
            :reference_email,
            :relationship,
            :years_known
        )
    ");

    $stmt->execute([
        ':application_id'        => $application_id,
        ':reference_name'        => $data['reference_name'],
        ':reference_designation' => $data['reference_designation'],
        ':reference_company'     => $data['reference_company'],
        ':reference_mobile'      => $data['reference_mobile'],
        ':reference_email'       => $data['reference_email'],
        ':relationship'          => $data['relationship'],
        ':years_known'           => $data['years_known']
    ]);

    
    do {
        if ($stmt->columnCount() > 0) {
            $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    } while ($stmt->nextRowset());

    $stmt->closeCursor();


    $fetchStmt = $pdo->prepare("
        SELECT *
        FROM Vati_Payfiller_Candidate_Reference_details
        WHERE application_id = ?
    ");
    $fetchStmt->execute([$application_id]);
    $savedData = $fetchStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $fetchStmt->closeCursor();

    $pdo->commit();


    echo json_encode([
        'success'  => true,
        'message'  => $isDraft ? 'Draft saved successfully' : 'Reference details saved successfully',
        'is_draft' => $isDraft,
        'data'     => $savedData
    ]);

} catch (ValidationException $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("store_reference.php ERROR: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}
