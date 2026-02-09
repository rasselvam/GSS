<?php
$qs = $_SERVER['QUERY_STRING'] ?? '';
$target = '../shared/candidate_report.php?role=client_admin';
if ($qs !== '') {
    $target .= '&' . $qs;
}
header('Location: ' . $target);
exit;
