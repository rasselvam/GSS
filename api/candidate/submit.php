<?php
//to prevent accidental html output
while (ob_get_level()) {
    ob_end_clean();
}

ini_set('display_errors', 0);     // Prevent warnings on output
ini_set('html_errors', 0);
error_reporting(E_ALL);

// Always return JSON only
header('Content-Type: application/json');


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([ 
        'success' => false,
        'message' => 'Invalid request method. POST required.'
    ]);
    exit;
}

session_start();

$response = ['success' => false, 'message' => ''];
require_once __DIR__ . '/../../config/db.php';

try {

    if (empty($_SESSION['application_id'])) {
        throw new Exception("Session expired. Please restart your application.");
    }

    $application_id = $_SESSION['application_id'];
    $pdo = getDB();

    if (!$pdo) {
        throw new Exception("Database connection failed.");
    }

    $pdo->query("SELECT 1");

   //check application exists
    $stmt = $pdo->prepare("
        SELECT application_id
        FROM applications
        WHERE application_id = ?
    ");
    $stmt->execute([$application_id]);

    if ($stmt->rowCount() === 0) {
        throw new Exception("No application found with ID: $application_id");
    }

    $update = $pdo->prepare("
        UPDATE applications
        SET status = 'submitted',
            submitted_at = NOW()
        WHERE application_id = ?
    ");
    $update->execute([$application_id]);

    // Best-effort: enqueue into validator queue (if this application maps to a Payfiller case)
    try {
        $caseStmt = $pdo->prepare('SELECT case_id, client_id FROM Vati_Payfiller_Cases WHERE application_id = ? LIMIT 1');
        $caseStmt->execute([$application_id]);
        $c = $caseStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($c && !empty($c['case_id'])) {
            $caseId = (int)$c['case_id'];
            $clientId = isset($c['client_id']) ? (int)$c['client_id'] : null;
            $ensure = $pdo->prepare('CALL SP_Vati_Payfiller_VAL_EnsureQueue(?)');
            $ensure->execute([$clientId]);
            while ($ensure->nextRowset()) {
            }
            $pdo->prepare('UPDATE Vati_Payfiller_Validator_Queue SET status = IF(completed_at IS NULL AND assigned_user_id IS NULL, "pending", status) WHERE case_id = ?')
                ->execute([$caseId]);
        }
    } catch (Throwable $e) {
        // ignore
    }

  // success
    $response['success'] = true;
    $response['message'] = "Application submitted successfully!";

} catch (Throwable $e) {

    http_response_code(400);
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
exit;
