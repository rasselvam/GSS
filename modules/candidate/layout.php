<?php
// Simple shared layout function
function render_layout(string $title, string $roleLabel, array $menu, string $content): void {
    // Determine current module and script for sidebar active state
    $scriptPath    = $_SERVER['SCRIPT_NAME'] ?? '';
    $currentScript = basename($scriptPath);
    $parts         = explode('/', trim($scriptPath, '/'));
    $currentModule = $parts[count($parts) - 2] ?? '';
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title><?php echo htmlspecialchars($title); ?> - VATI GSS</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        <link rel="stylesheet" href="/GSS/assets/css/style.css">
    </head>
    <body>
    <script>
        (function () {
            try {
                var stored = window.localStorage ? window.localStorage.getItem('gss_sidebar_collapsed') : null;
                if (stored === '1') {
                    document.body.classList.add('sidebar-collapsed');
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
            <button type="button" class="btn-toggle-sidebar" id="sidebarToggle" aria-label="Toggle navigation"></button>
        </div>
        <div class="top-header-right">
            <span class="role-pill"><?php echo htmlspecialchars($roleLabel); ?></span>
            <a class="link" href="<?php echo htmlspecialchars(app_url('/index.php?switch=1')); ?>">Switch Role</a>
        </div>
    </header>

    <div class="app-shell">

        <aside class="sidebar" id="sidebar">
            <div class="sidebar-section sidebar-title">Navigation</div>
            <div class="sidebar-section" style="font-size:12px; color:#9ca3af; margin-bottom:6px;">
                <span style="display:inline-flex; align-items:center; gap:6px;">
                    <span style="width:8px; height:8px; border-radius:999px; background:#22c55e; display:inline-block;"></span>
                    <span><?php echo htmlspecialchars($roleLabel); ?> view</span>
                </span>
            </div>
            <nav class="sidebar-nav">
                <?php foreach ($menu as $item):
                    $itemHref = $item['href'] ?? '';

                    // Derive target module + script from href
                    if (strpos($itemHref, '../') === 0) {
                        $relative   = substr($itemHref, 3); // strip '../'
                        $hrefParts  = explode('/', trim($relative, '/'));
                        $targetModule = $hrefParts[0] ?? '';
                        $targetScript = $hrefParts[count($hrefParts) - 1] ?? '';
                    } else {
                        $targetModule = $currentModule;
                        $targetScript = basename($itemHref);
                    }

                    $isActive = ($targetModule === $currentModule && $targetScript === $currentScript);
                    ?>
                    <a href="<?php echo htmlspecialchars($itemHref); ?>"<?php echo $isActive ? ' class="active"' : ''; ?>>
                        <span class="sidebar-icon-pill" style="width:26px; height:26px; border-radius:999px; background:rgba(148,163,184,0.18); display:inline-flex; align-items:center; justify-content:center; font-size:11px; color:#6b7280; text-transform:uppercase;">
                            <?php echo strtoupper(substr($item['label'], 0, 2)); ?>
                        </span>
                        <span class="sidebar-label"><?php echo htmlspecialchars($item['label']); ?></span>
                    </a>
                <?php endforeach; ?>
            </nav>
            <div class="sidebar-section" style="margin-top:auto; font-size:11px; color:#9ca3af;">
                <div>Environment: Staging</div>
                <div style="opacity:.8;">Quick access only</div>
            </div>
            
        </aside>
        <main class="main">
            <div class="page-header">
                <div>
                    <div class="page-breadcrumb">Home / <?php echo htmlspecialchars($roleLabel); ?></div>
                    <h1><?php echo htmlspecialchars($title); ?></h1>
                </div>
            </div>
            <?php echo $content; ?>
        </main>
    </div>
    <footer class="app-footer">
        <span>  <?php echo date('Y'); ?> VATI GSS. All rights reserved.</span>
        <span>Environment: Staging</span>
    </footer>
    <script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <script src="/GSS/js/includes/dialog.js"></script>
    <script src="/GSS/js/includes/layout.js"></script>
    <?php if (!empty($currentModule) && !empty($currentScript)): 
        $scriptBase = pathinfo($currentScript, PATHINFO_FILENAME);
        $pageJsPath = "/GSS/js/modules/{$currentModule}/{$scriptBase}.js";
    ?>
        <script src="<?php echo htmlspecialchars($pageJsPath); ?>"></script>
    <?php endif; ?>
    </body>
    </html>
    <?php
}
