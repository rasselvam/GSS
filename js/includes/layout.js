document.addEventListener('DOMContentLoaded', function () {
    var sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            document.body.classList.toggle('sidebar-collapsed');
            try {
                if (window.localStorage) {
                    window.localStorage.setItem(
                        'gss_sidebar_collapsed',
                        document.body.classList.contains('sidebar-collapsed') ? '1' : '0'
                    );
                }
            } catch (e) {
            }
        });
    }

    function getGroupEl(groupKey) {
        return document.querySelector('[data-group="' + groupKey + '"]');
    }

    function setGroupOpen(groupKey, open) {
        var groupEl = getGroupEl(groupKey);
        if (!groupEl) return;
        groupEl.classList.toggle('open', !!open);
    }

    document.querySelectorAll('[data-group]').forEach(function (groupEl) {
        var groupKey = groupEl.getAttribute('data-group') || '';
        if (!groupKey) return;

        var isActive = groupEl.getAttribute('data-active') === '1';
        setGroupOpen(groupKey, isActive);
    });

    document.querySelectorAll('[data-group-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var groupKey = btn.getAttribute('data-group-toggle') || '';
            if (!groupKey) return;
            var groupEl = getGroupEl(groupKey);
            if (!groupEl) return;
            var open = !groupEl.classList.contains('open');
            setGroupOpen(groupKey, open);
        });
    });

    var logoutBtn = document.getElementById('logoutBtn');
    var logoutConfirmBtn = document.getElementById('logoutConfirmBtn');
    var logoutModalEl = document.getElementById('logoutConfirmModal');
    var logoutModal = null;

    function resolveLogoutUrl() {
        var url = '';
        if (logoutConfirmBtn) {
            url = logoutConfirmBtn.getAttribute('data-logout-url') || logoutConfirmBtn.getAttribute('href') || '';
        }
        if (!url && logoutBtn) {
            url = logoutBtn.getAttribute('data-logout-url') || '';
        }
        if (!url) {
            url = (window.APP_BASE_URL || '') + '/logout.php';
        }
        return url;
    }

    if (logoutModalEl && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
        logoutModal = window.bootstrap.Modal.getOrCreateInstance(logoutModalEl);
    }

    function handleLogoutClick(e, isConfirm) {
        var url = resolveLogoutUrl();
        if (!url) return;
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

        if (!isConfirm && logoutModal) {
            logoutModal.show();
            return;
        }

        window.location.href = url;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            handleLogoutClick(e, false);
        });
    }

    if (logoutConfirmBtn) {
        logoutConfirmBtn.addEventListener('click', function (e) {
            handleLogoutClick(e, true);
        });
    }

    // Fallback: event delegation (covers pages where ids differ or markup is injected later)
    document.addEventListener('click', function (e) {
        var t = e && e.target ? e.target : null;
        if (!t) return;
        var btn = t.closest ? t.closest('#logoutBtn') : null;
        if (btn) {
            handleLogoutClick(e, false);
            return;
        }
        var confirmBtn = t.closest ? t.closest('#logoutConfirmBtn') : null;
        if (confirmBtn) {
            handleLogoutClick(e, true);
        }
    });
});
