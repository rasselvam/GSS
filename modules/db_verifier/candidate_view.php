<?php
$applicationId = isset($_GET['application_id']) ? trim((string)$_GET['application_id']) : '';
$clientId = isset($_GET['client_id']) ? (int)$_GET['client_id'] : 0;

$target = '../shared/candidate_report.php?role=db_verifier&application_id=' . urlencode($applicationId);
if ($clientId > 0) {
    $target .= '&client_id=' . urlencode((string)$clientId);
}

header('Location: ' . $target);
exit;
