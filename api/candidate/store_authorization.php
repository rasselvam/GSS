<?php
header("Content-Type: application/json");
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_start();
require_once __DIR__ . '/../../config/db.php';

try {
    $application_id =
        $_SESSION['application_id']
        ?? $_POST['application_id']
        ?? null;

    if (!$application_id) {
        throw new Exception("Application session expired.");
    }

    if (empty($_POST['agree_check'])) {
        throw new Exception("You must agree to the authorization terms.");
    }

    $signature = trim($_POST['digital_signature'] ?? '');
    if (strlen($signature) < 3) {
        throw new Exception("Digital signature must be at least 3 characters.");
    }

    $pdo = getDB();
    if (!$pdo) {
        throw new Exception("Database connection failed.");
    }

  
    $check = $pdo->prepare("
        SELECT id
        FROM Vati_Payfiller_Candidate_Authorization_documents
        WHERE application_id = ?
    ");
    $check->execute([$application_id]);

    if ($check->fetch()) {
        $stmt = $pdo->prepare("
            UPDATE Vati_Payfiller_Candidate_Authorization_documents
               SET digital_signature = ?,
                   uploaded_at = NOW()
             WHERE application_id = ?
        ");
        $stmt->execute([$signature, $application_id]);
    } else {
        $fileName = "authorization_" . $application_id . "_" . date('Ymd_His');

        $stmt = $pdo->prepare("
            INSERT INTO Vati_Payfiller_Candidate_Authorization_documents
                (application_id, file_name, digital_signature, uploaded_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$application_id, $fileName, $signature]);
    }

    /* ---------- MARK APPLICATION SUBMITTED ---------- */
    $upd = $pdo->prepare("
        UPDATE Vati_Payfiller_Candidate_Applications
           SET status = 'submitted',
               submitted_at = NOW()
         WHERE application_id = ?
    ");
    $upd->execute([$application_id]);

    // Best-effort: enqueue into validator queue
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

            // Keep status pending if not claimed yet
            $pdo->prepare('UPDATE Vati_Payfiller_Validator_Queue SET status = IF(completed_at IS NULL AND assigned_user_id IS NULL, \"pending\", status) WHERE case_id = ?')
                ->execute([$caseId]);
        }
    } catch (Throwable $e) {
        // ignore
    }

    echo json_encode([
        "success" => true,
        "message" => "Application submitted successfully."
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error occurred."
    ]);
    exit;
}
