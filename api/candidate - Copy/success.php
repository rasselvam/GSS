<?php
session_start();
$applicationId = $_SESSION['application_id'] ?? 'N/A';
?>

<style>
.success-wrapper {
    max-width: 600px;
    margin: 20px auto;
    padding: 0 15px;
    animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}

.success-card {
    background: #ffffff;
    border-radius: 18px;
    padding: 30px 25px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.07);
    text-align: center;
}

.success-icon-circle {
    height: 110px;
    width: 110px;
    border-radius: 50%;
    background: #e8f9f1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 25px;
}

.success-icon-circle i {
    font-size: 55px;
    color: #1aae6f;
}

.success-title {
    font-size: 32px;
    font-weight: 700;
    color: #1d1d1d;
}

.success-subtitle {
    font-size: 18px;
    color: #5f6c7b;
    margin-top: 12px;
}
.reference-box {
    margin-top: 35px;
    padding: 18px;
    border-left: 5px solid #1aae6f;
    background: #f5fffa;
    border-radius: 10px;
}

.reference-box i {
    color: #1aae6f;
}

.logout-btn {
    margin-top: 35px;
    padding: 12px 32px;
    font-size: 17px;
}

.action-buttons {
    margin: 30px 0;
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
}

.download-btn {
    background: #1aae6f;
    border-color: #1aae6f;
    padding: 12px 30px;
    font-size: 17px;
}

.print-btn {
    background: #6c757d;
    border-color: #6c757d;
    padding: 12px 30px;
    font-size: 17px;
}
/* Mobile-first responsive design for success page */
@media (max-width: 768px) {
    .success-wrapper {
        max-width: 100%;
        margin: 10px auto;
        padding: 0 10px;
    }
    
    .success-card {
        padding: 20px 15px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
}

@media (max-width: 480px) {
    .success-wrapper {
        margin: 5px auto;
        padding: 0 8px;
    }
    
    .success-card {
        padding: 18px 12px;
        border-radius: 8px;
    }
    
    .success-icon-circle {
        height: 70px !important;
        width: 70px !important;
        margin-bottom: 15px !important;
    }
    
    .success-icon-circle i {
        font-size: 35px !important;
    }
    
    .success-title {
        font-size: 20px !important;
        line-height: 1.2 !important;
        margin-bottom: 10px !important;
    }
    
    .success-subtitle {
        font-size: 14px !important;
        line-height: 1.4 !important;
        margin-bottom: 20px !important;
    }
    
    .reference-box {
        padding: 12px !important;
        margin: 20px 0 !important;
    }
    
    .reference-box h5 {
        font-size: 15px !important;
    }
    
    #applicationIdDisplay {
        font-size: 16px !important;
    }
    
    .action-buttons {
        flex-direction: column !important;
        gap: 10px !important;
        margin: 20px 0 !important;
    }
    
    .action-buttons .btn {
        width: 100% !important;
        padding: 12px !important;
        font-size: 14px !important;
        border-radius: 6px !important;
    }
    
    .logout-btn {
        width: 100% !important;
        margin-top: 15px !important;
        padding: 12px !important;
        font-size: 14px !important;
    }
    
    /* Modal adjustments for mobile */
    .modal-dialog {
        margin: 0 !important;
        max-width: 100% !important;
    }
    
    .modal-content {
        border-radius: 0 !important;
        height: 100vh !important;
    }
    
    .modal-body {
        padding: 0 !important;
    }
}
</style>

<div class="success-wrapper">

    <div class="success-card">

        <!-- Big Success Icon -->
        <div class="success-icon-circle">
            <i class="fas fa-check-circle"></i>
        </div>

        <h1 class="success-title">Application Submitted Successfully</h1>

        <p class="success-subtitle">
            Thank you for completing your background verification.  
            Our team will now begin the review and verification process.
        </p>

        <!-- Reference Number box -->
        <div class="reference-box">
            <h5 class="mb-1"><i class="fas fa-file-alt me-2"></i>Your Reference Number</h5>
            <p class="mb-0 fw-bold" style="font-size:20px;" id="applicationIdDisplay">
                <?= htmlspecialchars($applicationId) ?>
            </p>
        </div>
<div class="action-buttons">
    <button id="downloadApplicationBtn" class="btn download-btn">
        <i class="fas fa-eye me-2"></i> View Application
    </button>
    
    <!-- <button class="btn print-btn">
        <i class="fas fa-print me-2"></i> Print Application
    </button> -->
</div>

        <!-- Logout -->
        <a href="logout.php" class="btn btn-outline-danger logout-btn">
            <i class="fas fa-sign-out-alt me-2"></i> Logout
        </a>

    </div>
</div>


<!-- Update the action buttons section in success.php -->


<!-- Update the script section -->
<script>
// Set global base URL
window.APP_BASE_URL = '<?= dirname(dirname($_SERVER['PHP_SELF'])) ?>';

// Load dependencies first, then Success.js
(function() {
    // Load Bootstrap Modal if not already loaded
    if (typeof bootstrap === 'undefined') {
        const bsScript = document.createElement('script');
        bsScript.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
        document.head.appendChild(bsScript);
    }
    
    // Load Success and PdfViewer modules
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = callback;
        document.head.appendChild(script);
    }
    
    // Load modules in order
    loadScript(`${window.APP_BASE_URL}/js/modules/candidate/pages/PdfViewer.js?v=<?= time() ?>`, function() {
        loadScript(`${window.APP_BASE_URL}/js/modules/candidate/pages/Success.js?v=<?= time() ?>`, function() {
            // Initialize when both are loaded
            if (window.Success && typeof window.Success.init === 'function') {
                window.Success.init();
            }
        });
    });
})();

// Mobile-specific adjustments
if (window.innerWidth <= 768) {
    document.addEventListener('DOMContentLoaded', function() {
        const successCard = document.querySelector('.success-card');
        if (successCard) {
            successCard.style.margin = '10px';
        }
    });
}
</script>
