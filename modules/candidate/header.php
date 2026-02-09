<!-- Main Header -->
<header class="bg-white border-bottom shadow-sm py-7">
    <div class="container-fluid">
        <div class="row align-items-center">
            <div class="col-md-10">
                <div class="d-flex align-items-center">
                    <!-- Logo Area -->
                    <div class="d-flex align-items-center">
                        <div class="d-flex align-items-center justify-content-center me-3">
                            <img src="<?php echo htmlspecialchars(app_url('/assets/img/gss-logo.svg')); ?>" alt="GSS" style="height:34px; width:auto; object-fit:contain;">
                        </div>
                        <div>
                            <h4 class="mb-0 fw-bold" style="color:#0f172a;">VATI GSS</h4>
                            <small class="text-muted">Verification Platform</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="d-flex align-items-center justify-content-end gap-3">
                    <!-- User Info -->
                    <div class="text-end d-none d-md-block">
                        <div class="text-muted small">Welcome,</div>
                        <strong class="text-dark"><?php echo htmlspecialchars($userName); ?></strong>
                    </div>
                    
                    <!-- Logout Button -->
                    <div class="dropdown">
                        <button class="btn btn-outline-danger btn-sm dropdown-toggle" type="button" 
                                data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-user me-1"></i> Account
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profile</a></li>
                            <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Settings</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="logout()">
                                    <i class="fas fa-sign-out-alt me-2"></i>Logout
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</header>

<script>
function logout() {
    if (window.GSSDialog && typeof window.GSSDialog.confirm === 'function') {
        window.GSSDialog.confirm('Are you sure you want to logout?', { title: 'Confirm logout', okText: 'Logout', cancelText: 'Cancel', okVariant: 'danger' })
            .then(function (ok) {
                if (!ok) return;
                window.location.href = 'logout.php';
            });
        return;
    }
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'logout.php';
    }
}
</script>