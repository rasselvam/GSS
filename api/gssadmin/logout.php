<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
session_start();

$input  = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = isset($input['userId']) ? (int)$input['userId'] : 0;

if ($userId <= 0 && !empty($_SESSION['auth_user_id'])) {
    $userId = (int)$_SESSION['auth_user_id'];
}

if ($userId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'User ID required for logout.'
    ]);
    exit;
}

$stmt = $mysqli->prepare('CALL SP_Vati_Payfiller_LogoutUser(?)');
if ($stmt) {
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stmt->close();
}

// Clear PHP session
$_SESSION = [];
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully.'
]);
