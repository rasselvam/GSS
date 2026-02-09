<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('client_admin');

auth_session_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function post_str(string $key, string $default = ''): string {
    return trim((string)($_POST[$key] ?? $default));
}

function post_int(string $key, int $default = 0): int {
    return isset($_POST[$key]) && $_POST[$key] !== '' ? (int)$_POST[$key] : $default;
}

function resolve_client_id(): int {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $cid = isset($_SESSION['auth_client_id']) ? (int)$_SESSION['auth_client_id'] : 0;
    if ($cid > 0) return $cid;

    http_response_code(401);
    echo json_encode(['status' => 0, 'message' => 'Unauthorized']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $clientId = resolve_client_id();

    $firstName = post_str('candidate_first_name');
    $middleName = post_str('candidate_middle_name');
    $lastName = post_str('candidate_last_name');
    $dob = post_str('candidate_dob');
    $fatherName = post_str('candidate_father_name');

    $mobile = post_str('candidate_mobile');
    $email = post_str('candidate_email');
    $state = post_str('candidate_state');
    $city = post_str('candidate_city');

    $joiningLocation = post_str('joining_location');
    $jobRole = post_str('job_role');

    $recruiterName = post_str('recruiter_name');
    $recruiterEmail = post_str('recruiter_email');

    $candidateReferenceId = post_str('candidate_reference_id');
    $requisitionId = post_str('requisition_id');
    $customerCostCenter = post_str('customer_cost_center');
    $rehireCandidateStr = post_str('rehire_candidate', '0');
    $rehireCandidate = in_array(strtolower($rehireCandidateStr), ['1', 'yes', 'true'], true) ? 1 : 0;

    $required = [
        'candidate_first_name' => $firstName,
        'candidate_last_name' => $lastName,
        'candidate_dob' => $dob,
        'candidate_father_name' => $fatherName,
        'candidate_mobile' => $mobile,
        'candidate_email' => $email,
        'candidate_state' => $state,
        'candidate_city' => $city,
        'joining_location' => $joiningLocation,
        'job_role' => $jobRole,
        'recruiter_name' => $recruiterName,
        'recruiter_email' => $recruiterEmail,
    ];

    foreach ($required as $key => $val) {
        if ($val === '') {
            http_response_code(400);
            echo json_encode(['status' => 0, 'message' => "{$key} is required"]); 
            exit;
        }
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Invalid candidate_email']);
        exit;
    }

    if (!filter_var($recruiterEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Invalid recruiter_email']);
        exit;
    }

    $pdo = getDB();

    $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_CreateClientCandidateBasic(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $clientId,
        $firstName,
        $middleName,
        $lastName,
        $dob,
        $fatherName,
        $mobile,
        $email,
        $state,
        $city,
        $joiningLocation,
        $jobRole,
        $recruiterName,
        $recruiterEmail,
        $candidateReferenceId,
        $requisitionId,
        $customerCostCenter,
        $rehireCandidate
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    while ($stmt->nextRowset()) {
    }

    $candidateId = isset($row['candidate_id']) ? (int)$row['candidate_id'] : 0;

    echo json_encode([
        'status' => 1,
        'message' => 'Candidate created successfully.',
        'data' => ['candidate_id' => $candidateId]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
