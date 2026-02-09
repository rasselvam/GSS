<?php
// aside.php — original layout preserved, mobile sidebar fixed
?>

<!-- ===============================
     SIDEBAR (UNCHANGED STRUCTURE)
================================ -->
<aside class="sidebar" id="mainSidebar">
    <nav class="sidebar-nav">

        <a href="#" data-page="basic-details" class="sidebar-item">
            <i class="fas fa-user"></i>
            <span class="sidebar-label">Basic Details</span>
        </a>

        <a href="#" data-page="identification" class="sidebar-item">
            <i class="fas fa-id-card"></i>
            <span class="sidebar-label">Identification</span>
        </a>

        <a href="#" data-page="contact" class="sidebar-item">
            <i class="fas fa-address-book"></i>
            <span class="sidebar-label">Contact Info</span>
        </a>

        <a href="#" data-page="education" class="sidebar-item">
            <i class="fas fa-graduation-cap"></i>
            <span class="sidebar-label">Education</span>
        </a>

        <a href="#" data-page="employment" class="sidebar-item">
            <i class="fas fa-briefcase"></i>
            <span class="sidebar-label">Employment</span>
        </a>

        <a href="#" data-page="reference" class="sidebar-item">
            <i class="fas fa-users"></i>
            <span class="sidebar-label">Reference</span>
        </a>

    </nav>
</aside>

<!-- ===============================
     MOBILE OVERLAY (NEW)
================================ -->
<div id="sidebarOverlay" class="sidebar-overlay"></div>

<!-- ===============================
     MOBILE-ONLY CSS (ADDED)
================================ -->
<!-- <style>
@media (max-width: 768px) {

    /* Sidebar drawer (mobile only) */
    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;

        width: 270px;              /* fixed width like Infosys */
        max-width: 85vw;

        background: #0f172a;
        z-index: 1001;

        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }

    .sidebar.open {
        transform: translateX(0);
    }

    /* Overlay */
    .sidebar-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 1000;

        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }

    .sidebar-overlay.show {
        opacity: 1;
        pointer-events: auto;
    }
}
</style> -->

<!-- ===============================
     SCRIPT (EXTENDED, NOT REPLACED)
================================ -->
<script>
document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("mainSidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    const overlay = document.getElementById("sidebarOverlay");

    /* ===============================
       SIDEBAR TOGGLE (MOBILE)
    =============================== */
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("show");
        });
    }

    /* Close sidebar when overlay is clicked */
    overlay?.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    });

    /* ===============================
       SIDEBAR NAVIGATION (LOCKED)
    =============================== */
    document.querySelectorAll(".sidebar-item").forEach(item => {

        item.addEventListener("click", (e) => {
            e.preventDefault();

            const pageId = item.dataset.page;
            if (!pageId || !window.Router) return;

            // 🔒 Block skipping steps
            if (!Router.isPageAccessible(pageId)) {
                alert("⚠️ Please complete the current step before proceeding.");
                return;
            }

            // ✅ Navigate safely
            Router.navigateTo(pageId);

            // 📱 Auto-close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove("open");
                overlay.classList.remove("show");
            }
        });

    });

});
</script>
