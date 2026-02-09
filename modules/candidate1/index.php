<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

session_start();

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

// Create or load application
$applicationId = getApplicationId();
ensureApplicationExists($applicationId);

// UI labels
$userName = $_SESSION['user_name'] ?? "Candidate";
$userEmail = $_SESSION['user_email'] ?? '';

$prefillFirstName = '';
$prefillLastName = '';
if (!empty($userName) && $userName !== 'Candidate') {
    $parts = preg_split('/\s+/', trim((string)$userName));
    if (is_array($parts) && count($parts) > 0) {
        $prefillFirstName = (string)($parts[0] ?? '');
        if (count($parts) > 1) {
            $prefillLastName = (string)end($parts);
        }
    }
}

if (($userEmail === '' || $userName === '' || $userName === 'Candidate') && function_exists('getDB')) {
    try {
        $pdo = getDB();

        $case = null;
        if (!empty($_SESSION['case_id'])) {
            $stmt = $pdo->prepare('SELECT candidate_first_name, candidate_last_name, candidate_email FROM Vati_Payfiller_Cases WHERE case_id = ? LIMIT 1');
            $stmt->execute([(int)$_SESSION['case_id']]);
            $case = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }

        if (!$case) {
            $stmt = $pdo->prepare('SELECT candidate_first_name, candidate_last_name, candidate_email FROM Vati_Payfiller_Cases WHERE application_id = ? LIMIT 1');
            $stmt->execute([$applicationId]);
            $case = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }

        if ($case) {
            $dbName = trim((string)($case['candidate_first_name'] ?? '') . ' ' . (string)($case['candidate_last_name'] ?? ''));
            $dbEmail = (string)($case['candidate_email'] ?? '');

            if ($dbName !== '') {
                $_SESSION['user_name'] = $dbName;
                $userName = $dbName;
            }
            if ($dbEmail !== '') {
                $_SESSION['user_email'] = $dbEmail;
                $userEmail = $dbEmail;
            }
        }
    } catch (Throwable $e) {
        error_log("Database error in index.php: " . $e->getMessage());
        // keep silent for UI
    }
}

// Use the app_url() function from your env.php or define it if missing
if (!function_exists('app_url')) {
    function app_url($path = '') {
        // Use APP_BASE_URL from .env file
        $base = defined('APP_BASE_URL') ? APP_BASE_URL : '';
        if (!$base) {
            $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
            $parts = explode('/', trim($scriptName, '/'));
            $base = !empty($parts[0]) ? '/' . $parts[0] : '';
        }
        return rtrim($base, '/') . '/' . ltrim($path, '/');
    }
}

if (!function_exists('app_base_url')) {
    function app_base_url() {
        $base = defined('APP_BASE_URL') ? APP_BASE_URL : '';
        if (!$base) {
            $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
            $parts = explode('/', trim($scriptName, '/'));
            $base = !empty($parts[0]) ? '/' . $parts[0] : '';
        }
        return $base;
    }
}

// Get APP_BASE_URL for JavaScript
$jsAppBaseUrl = defined('APP_BASE_URL') ? APP_BASE_URL : '';
if (!$jsAppBaseUrl) {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $parts = explode('/', trim($scriptName, '/'));
    $jsAppBaseUrl = !empty($parts[0]) ? '/' . $parts[0] : '';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATTEST360 - Background Verification</title>

    <!-- Bootstrap + Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Set APP_BASE_URL early -->
    <script>
        window.APP_BASE_URL = "<?php echo htmlspecialchars($jsAppBaseUrl); ?>";
        console.log("🌐 APP_BASE_URL set to:", window.APP_BASE_URL);
    </script>

    <!-- Candidate UI CSS -->
    <link rel="stylesheet" href="<?php echo htmlspecialchars(app_url('/assets/css/candidate.css')); ?>">
</head>

<body class="candidate-page">

<script>
    window.CANDIDATE_PREFILL = <?php echo json_encode([
        'name' => $userName,
        'email' => $userEmail,
        'first_name' => $prefillFirstName,
        'last_name' => $prefillLastName,
    ]); ?>;

    (function () {
        try {
            if (window.localStorage && window.CANDIDATE_PREFILL) {
                var existing = null;
                try {
                    existing = JSON.parse(window.localStorage.getItem('candidate_prefill') || 'null');
                } catch (e) {
                    existing = null;
                }

                var merged = Object.assign({}, existing || {}, window.CANDIDATE_PREFILL || {});
                window.localStorage.setItem('candidate_prefill', JSON.stringify(merged));
            }
        } catch (e) {
            // ignore storage errors
        }
    })();
</script>

<header class="top-header">
    <div class="top-header-left">
        <div class="brand-mark">VT</div>
        <div class="brand-text">
            <span class="brand-title">VATI GSS</span>
            <span class="brand-subtitle">Verification Platform</span>
        </div>
        <button type="button" class="btn-toggle-sidebar" id="sidebarToggle">
            <i class="fas fa-bars"></i>
        </button>
    </div>

    <div class="top-header-right d-flex align-items-center gap-3">
        <div class="text-end d-none d-md-block">
            <small class="text-muted">Control No:</small><br>
            <strong><?= htmlspecialchars($applicationId) ?></strong>
        </div>

        <div class="dropdown">
            <button class="btn user-btn d-flex align-items-center" data-bs-toggle="dropdown">
                <div class="user-icon"><i class="fas fa-user"></i></div>
                <span class="d-none d-md-inline" style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    <?= htmlspecialchars($userName) ?><?php if (!empty($userEmail)): ?> <span class="text-muted" style="font-size:12px;">(<?= htmlspecialchars($userEmail) ?>)</span><?php endif; ?>
                </span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
                <li class="px-3 py-2" style="min-width:240px;">
                    <div style="font-weight:600;"><?= htmlspecialchars($userName) ?></div>
                    <?php if (!empty($userEmail)): ?>
                        <div class="text-muted" style="font-size:12px; word-break:break-all;"><?= htmlspecialchars($userEmail) ?></div>
                    <?php endif; ?>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#">Settings</a></li>
                <li><a class="dropdown-item" href="#">Help</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="<?php echo app_url('logout.php'); ?>">Logout</a></li>
            </ul>
        </div>
    </div>
</header>

<div class="app-shell" style="display:flex;">
    <?php include __DIR__ . '/../../api/candidate/aside.php'; ?>

    <div class="main" id="mainContent">
        <main class="page-area">
            <div class="candidate-wrapper">
                <div id="page-content">
                    <div class="text-center py-5">
                        <div class="spinner-border"></div>
                        <p class="text-muted mt-3">Loading application form...</p>
                    </div>
                </div>
            </div>
        </main>

        <footer class="footer text-center py-2">
            2025 VATI GSS. All rights reserved. Environment: Staging
        </footer>
    </div>
</div>

<!-- Bootstrap Bundle (includes Popper) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- ============================================
     SPA APPLICATION SCRIPTS
============================================ -->

<!-- 1. CORE UTILITIES -->
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/forms.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/DraftManager.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/TabManager.js')); ?>"></script>

<!-- 2. PAGE MODULES -->
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/BasicDetails.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/Identification.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/Contact.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/Education.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/Employment.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/Reference.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/ReviewConfirmation.js')); ?>"></script>
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/pages/Success.js')); ?>"></script>

<!-- 3. ROUTER (must load last) -->
<script src="<?php echo htmlspecialchars(app_url('/js/modules/candidate/router.js')); ?>"></script>

<!-- ============================================
     GLOBAL DOCUMENT PREVIEW MODAL + FUNCTION
============================================ -->
<!-- IMPROVED Document Preview Modal -->
<div class="modal fade" id="documentPreviewModal" tabindex="-1" aria-labelledby="documentPreviewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header border-0 pb-2">
                <h5 class="modal-title" id="documentPreviewModalLabel">Document Preview</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
                <div id="previewContainer" style="width:100%; height:70vh; background:#f8f9fa; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <div class="text-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="text-muted">Loading document...</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0 justify-content-between">
                <a href="#" id="downloadLink" class="btn btn-outline-primary" download>
                    <i class="fas fa-download me-2"></i>Download
                </a>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
// Document Preview Function
function openDocumentPreview(fileUrl, fileName = 'Document') {
    const modal = document.getElementById('documentPreviewModal');
    const title = document.getElementById('documentPreviewModalLabel');
    const container = document.getElementById('previewContainer');
    const downloadLink = document.getElementById('downloadLink');

    if (!modal || !container) {
        window.open(fileUrl, '_blank');
        return;
    }

    title.textContent = fileName || 'Document';
    downloadLink.href = fileUrl;
    downloadLink.download = fileName || 'document';

    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">Loading document...</p>
        </div>
    `;

    const ext = (fileUrl.split('.').pop() || '').toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        const img = new Image();
        img.onload = () => {
            container.innerHTML = '';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '70vh';
            img.style.objectFit = 'contain';
            img.alt = fileName;
            container.appendChild(img);
        };
        img.onerror = () => {
            container.innerHTML = `
                <div class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <p>Failed to load image.<br><small>${fileName}</small></p>
                    <a href="${fileUrl}" target="_blank" class="btn btn-sm btn-primary">Open in New Tab</a>
                </div>
            `;
        };
        img.src = fileUrl;
    }
    else if (ext === 'pdf') {
        container.innerHTML = `
            <iframe src="${fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH" 
                    style="width:100%; height:70vh; border:none;"
                    frameborder="0">
            </iframe>
        `;
    }
    else {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-file fa-4x mb-4 opacity-50"></i>
                <p>Preview not available for this file type.</p>
                <p><strong>${fileName}</strong></p>
                <a href="${fileUrl}" download class="btn btn-primary">Download File</a>
            </div>
        `;
    }

    const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
}

// Global alias for preview
window.openDocPreview = function (url, name = 'Document') {
    if (typeof window.openDocumentPreview === 'function') {
        window.openDocumentPreview(url, name);
    } else {
        window.open(url, '_blank');
    }
};
</script>

<script>
/* =====================================================
   ✅ GLOBAL PREVIEW ALIAS
===================================================== */
window.openDocPreview = function (url, name = 'Document') {
    if (typeof window.openDocumentPreview === 'function') {
        window.openDocumentPreview(url, name);
    } else {
        console.error('openDocumentPreview() not found');
    }
};
</script>

<!-- SIMPLE ROUTER PATCH -->
<script>
(function() {
    // Wait a bit for router to load
    setTimeout(function() {
        if (window.Router && window.Router.loadPageContent) {
            const originalLoad = Router.loadPageContent;
            Router.loadPageContent = async function(pageId) {
                const container = document.getElementById("page-content");
                if (!container) return;

                const url = `${window.APP_BASE_URL}/modules/candidate/${pageId}.php?t=${Date.now()}`;
                
                try {
                    const response = await fetch(url, { credentials: "include" });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    const html = await response.text();
                    container.innerHTML = html;
                    
                    // Initialize the page
                    if (Router.initializePage) {
                        await Router.initializePage(pageId);
                    }
                } catch (error) {
                    console.error("Load error:", error);
                    container.innerHTML = `
                        <div class="container py-4">
                            <div class="alert alert-warning">
                                <h5>${pageId.replace('-', ' ').toUpperCase()} Form</h5>
                                <p>Loading content... (Error: ${error.message})</p>
                            </div>
                        </div>
                    `;
                }
            };
            console.log("✅ Router patched successfully");
        }
    }, 500);
})();
</script>

<script>
// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOM ready — Initializing SPA Application...");

    // Sidebar Toggle
    const sidebar = document.getElementById("mainSidebar");
    const toggleBtn = document.getElementById("sidebarToggle");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (window.innerWidth < 768) {
                sidebar.classList.toggle("sidebar-open");
            } else {
                sidebar.classList.toggle("collapsed");
            }
        });
    }

    // Sidebar Navigation
    document.addEventListener('click', (e) => {
        const sidebarItem = e.target.closest('.sidebar-item');
        if (!sidebarItem) return;

        e.preventDefault();
        const page = sidebarItem.dataset.page;
        if (page && window.Router?.navigateTo) {
            Router.navigateTo(page);
        }
        if (window.innerWidth < 768 && sidebar) {
            sidebar.classList.remove("sidebar-open");
        }
    });

    // Check loaded scripts
    console.log("📦 Loaded scripts check:", {
        'Router': !!window.Router,
        'APP_BASE_URL': window.APP_BASE_URL,
        'Preview Function': typeof window.openDocPreview
    });

    // Load initial page
    // setTimeout(() => {
    //     if (window.Router && window.Router.navigateTo && !window.location.hash) {
    //         Router.navigateTo('basic-details');
    //     }
    // }, 300);

    console.log("✅ SPA Application initialized");
});
</script>

</body>
</html>