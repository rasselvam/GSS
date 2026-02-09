<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function resolve_user_id_from_session(): int {
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }

    if (!empty($_SESSION['auth_user_id'])) {
        return (int)$_SESSION['auth_user_id'];
    }

    return 0;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $caseId = isset($input['case_id']) ? (int)$input['case_id'] : 0;
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;

    if ($caseId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'case_id is required']);
        exit;
    }

    if ($userId <= 0) {
        $userId = resolve_user_id_from_session();
    }

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'user_id missing (login not detected)']);
        exit;
    }

    $pdo = getDB();
    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_DBV_ReleaseCase(?, ?)');
    $stmt->execute([$caseId, $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $stmt->closeCursor();

    $affected = (int)($row['affected'] ?? 0);
    if ($affected <= 0) {
        http_response_code(409);
        echo json_encode(['status' => 0, 'message' => 'Case not claimed by you or already completed.']);
        exit;
    }

    echo json_encode([
        'status' => 1,
        'message' => 'Released',
        'data' => [
            'case_id' => $caseId,
            'user_id' => $userId
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
