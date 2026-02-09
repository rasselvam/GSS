<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_any_access(['client_admin', 'gss_admin']);
auth_session_start();

function get_int_qs(string $key, int $default = 0): int {
    return isset($_GET[$key]) && $_GET[$key] !== '' ? (int)$_GET[$key] : $default;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
    }

    $jobRoleId = get_int_qs('job_role_id', 0);
    if ($jobRoleId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'job_role_id is required']);
        exit;
    }

    $access = strtolower(auth_module_access());

    $clientId = 0;
    if (strpos($access, 'client_admin') !== false) {
        $clientId = !empty($_SESSION['auth_client_id']) ? (int)$_SESSION['auth_client_id'] : 0;
    } else {
        $clientId = get_int_qs('client_id', 0);
    }

    if ($clientId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'client_id is required']);
        exit;
    }

    $pdo = getDB();

    // Ensure role belongs to client
    $roleStmt = $pdo->prepare('SELECT job_role_id, role_name FROM Vati_Payfiller_Job_Roles WHERE job_role_id = ? AND client_id = ? LIMIT 1');
    $roleStmt->execute([$jobRoleId, $clientId]);
    $role = $roleStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    if (!$role) {
        http_response_code(404);
        echo json_encode(['status' => 0, 'message' => 'Job role not found for client']);
        exit;
    }

    $steps = [];

    // Prefer SP if available
    try {
        $sp = $pdo->prepare('CALL SP_Vati_Payfiller_GetClientVerificationSummary(?)');
        $sp->execute([$clientId]);
        $rolesRs = $sp->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $stepsRs = [];
        if ($sp->nextRowset()) {
            $stepsRs = $sp->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }
        while ($sp->nextRowset()) {
        }
        $sp->closeCursor();

        foreach ($stepsRs as $s) {
            if ((int)($s['job_role_id'] ?? 0) !== $jobRoleId) continue;
            $steps[] = $s;
        }
    } catch (Throwable $e) {
        $steps = [];
    }

    // Fallback query
    if (empty($steps)) {
        $stmt = $pdo->prepare(
            'SELECT s.job_role_id, s.stage_key, s.verification_type_id, s.execution_group, s.assigned_role, s.is_active,\n'
            . '       t.type_name, t.type_category\n'
            . '  FROM Vati_Payfiller_Job_Role_Stage_Steps s\n'
            . '  LEFT JOIN Vati_Payfiller_Verification_Types t ON t.verification_type_id = s.verification_type_id\n'
            . ' WHERE s.job_role_id = ?\n'
            . ' ORDER BY s.stage_key ASC, s.execution_group ASC, COALESCE(t.type_name, "") ASC'
        );
        $stmt->execute([$jobRoleId]);
        $steps = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    // Group by stage_key
    $byStage = [];
    foreach ($steps as $s) {
        $active = isset($s['is_active']) ? (int)$s['is_active'] : 1;
        if ($active !== 1) continue;

        $stage = (string)($s['stage_key'] ?? '');
        if ($stage === '') $stage = 'unknown';

        if (!isset($byStage[$stage])) {
            $byStage[$stage] = [];
        }

        $byStage[$stage][] = [
            'verification_type_id' => isset($s['verification_type_id']) ? (int)$s['verification_type_id'] : 0,
            'type_name' => (string)($s['type_name'] ?? ''),
            'type_category' => (string)($s['type_category'] ?? ''),
            'execution_group' => isset($s['execution_group']) ? (int)$s['execution_group'] : 1,
            'assigned_role' => (string)($s['assigned_role'] ?? ''),
        ];
    }

    echo json_encode([
        'status' => 1,
        'message' => 'ok',
        'data' => [
            'client_id' => $clientId,
            'job_role_id' => $jobRoleId,
            'job_role' => (string)($role['role_name'] ?? ''),
            'stages' => $byStage
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 0, 'message' => 'Database error. Please try again.']);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
}
