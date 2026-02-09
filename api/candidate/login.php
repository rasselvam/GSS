<?php
session_start();
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

$error = '';

if (!empty($_GET['token'])) {
    try {
        $token = trim((string)$_GET['token']);
        if ($token === '') {
            throw new Exception('Invalid invite link.');
        }

        $pdo = getDB();

        $stmt = $pdo->prepare('CALL SP_Vati_Payfiller_GetCaseByInviteToken(?)');
        $stmt->execute([$token]);
        $case = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        while ($stmt->nextRowset()) {
        }

        $caseId = isset($case['case_id']) ? (int)$case['case_id'] : 0;
        $applicationId = isset($case['application_id']) ? (string)$case['application_id'] : '';

        if ($caseId <= 0 || $applicationId === '') {
            throw new Exception('Invalid or expired invite link.');
        }

        $_SESSION['case_id'] = $caseId;
        $_SESSION['application_id'] = $applicationId;
        $_SESSION['logged_in'] = true;
        $_SESSION['user_name'] = trim((string)($case['candidate_first_name'] ?? '') . ' ' . (string)($case['candidate_last_name'] ?? ''));
        $_SESSION['user_email'] = (string)($case['candidate_email'] ?? '');

        $upd = $pdo->prepare('CALL SP_Vati_Payfiller_UpdateCaseStatus(?, ?)');
        $upd->execute([$caseId, 'IN_PROGRESS']);
        while ($upd->nextRowset()) {
        }

        header('Location: ' . app_url('/modules/candidate/index.php'));
        exit;
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $entered  = trim($_POST['captcha'] ?? '');
    $expected = $_SESSION['candidate_captcha'] ?? '';

    if ($entered === '' || $entered !== $expected) {
        $error = 'Invalid captcha. Please try again.';
    }

    // After handling POST, generate a new code for the next view
    $_SESSION['candidate_captcha'] = strval(rand(10000, 99999));
} else {
    // On initial load or simple refresh (GET), always generate a fresh code
    $_SESSION['candidate_captcha'] = strval(rand(10000, 99999));
}

$menu = [
    ['label' => 'Login', 'href' => 'login.php'],
    ['label' => 'Application Wizard', 'href' => 'portal.php'],
];

ob_start();
?>
<div style="margin-top:18px; margin-bottom:18px;">
    <div style="display:flex; gap:22px; align-items:stretch;">
        <!-- Left hero panel -->
        <div style="flex:1.05; border-radius:16px; padding:22px 22px 20px; background:radial-gradient(circle at top left, #22c55e 0%, #0ea5e9 28%, #0f172a 70%, #020617 100%); box-shadow:0 18px 40px rgba(15,23,42,0.65); color:#e5e7eb; position:relative; overflow:hidden;">
            <div style="position:absolute; inset:auto -60px -90px auto; width:220px; height:220px; border-radius:999px; background:radial-gradient(circle, rgba(34,197,94,0.12), transparent 70%);"></div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px; position:relative; z-index:1;">
                <div style="width:38px; height:38px; border-radius:999px; background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.5); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:15px;">
                    VATI
                </div>
                <div>
                    <div style="font-size:14px; letter-spacing:0.03em; text-transform:uppercase; color:#a5b4fc; font-weight:500;">VATI GSS</div>
                    <div style="font-size:12px; color:#e5e7eb; opacity:.85;">Candidate background verification workspace</div>
                </div>
            </div>
            <h2 style="font-size:22px; font-weight:600; margin:0 0 6px; position:relative; z-index:1;">Sign in to your candidate portal</h2>
            <p style="font-size:13px; color:#cbd5f5; margin:0 0 14px; max-width:360px; position:relative; z-index:1;">
                Track your checks, upload documents and complete your verification journey in a guided, step-by-step experience.
            </p>
            <ul style="list-style:none; padding:0; margin:0; font-size:12px; color:#e5e7eb; display:grid; gap:6px; position:relative; z-index:1;">
                <li style="display:flex; align-items:center; gap:6px;">
                    <span style="width:6px; height:6px; border-radius:999px; background:#22c55e;"></span>
                    <span>Secure one-time credentials from your employer</span>
                </li>
                <li style="display:flex; align-items:center; gap:6px;">
                    <span style="width:6px; height:6px; border-radius:999px; background:#38bdf8;"></span>
                    <span>Save drafts while you gather information</span>
                </li>
                <li style="display:flex; align-items:center; gap:6px;">
                    <span style="width:6px; height:6px; border-radius:999px; background:#f97316;"></span>
                    <span>Real-time status for every verification step</span>
                </li>
            </ul>
        </div>

        <!-- Right login card -->
        <div style="flex:0.9;">
            <div class="card" style="height:100%; max-width:420px; margin-left:auto;">
                <h3 style="margin-bottom:6px;">Candidate Login</h3>
                <p class="card-subtitle" style="margin-bottom:10px;">
                    Use the username and password sent to your registered email.
                </p>

                <?php if (!empty($error)): ?>
                    <div class="alert alert-danger" style="margin-bottom:10px; font-size:12px;">
                        <?php echo htmlspecialchars($error); ?>
                    </div>
                <?php endif; ?>

                <form style="margin-top: 4px;" method="post">
                    <div class="form-control">
                        <label>Username</label>
                        <input type="text" name="username" placeholder="Enter username">
                    </div>
                    <div class="form-control">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Enter password">
                    </div>
                    <div class="form-control">
                        <label>Captcha</label>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <div style="padding:6px 14px; border-radius:8px; background:#0f172a; color:#e5e7eb; letter-spacing:3px; font-weight:600; font-size:14px;">
                                <?php echo htmlspecialchars($_SESSION['candidate_captcha'] ?? '-----'); ?>
                            </div>
                            <input type="text" name="captcha" placeholder="Enter code shown" style="flex:1;">
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
                        <div style="font-size:11px; color:#9ca3af;">UI only &mdash; authentication to be wired later.</div>
                        <button class="btn" type="submit">Login</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Candidate Login', 'Candidate', $menu, $content);
