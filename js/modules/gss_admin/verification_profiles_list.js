document.addEventListener('DOMContentLoaded', function () {
    var clientSelect = document.getElementById('vpClientSelect');
    var searchEl = document.getElementById('vpListSearch');
    var refreshBtn = document.getElementById('vpListRefreshBtn');
    var createBtn = document.getElementById('vpCreateBtn');
    var tbody = document.getElementById('vpListTbody');
    var messageEl = document.getElementById('vpListMessage');

    function setMessage(text, type) {
        if (!messageEl) return;
        messageEl.textContent = text || '';
        messageEl.className = type ? ('alert alert-' + type) : '';
        messageEl.style.display = text ? 'block' : 'none';
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getSelectedClientId() {
        if (!clientSelect) return 0;
        return parseInt(clientSelect.value || '0', 10) || 0;
    }

    function updateCreateLink() {
        if (!createBtn) return;
        var cid = getSelectedClientId();
        createBtn.href = cid > 0 ? ('verification_profile_edit.php?client_id=' + encodeURIComponent(cid)) : 'verification_profile_edit.php';
    }

    function loadClients() {
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        return fetch(base + '/api/gssadmin/clients_dropdown.php', { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !Array.isArray(data.data)) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load clients');
                }

                if (!clientSelect) return;

                clientSelect.innerHTML = '<option value="0">All Clients</option>';
                data.data.forEach(function (c) {
                    var opt = document.createElement('option');
                    opt.value = String(c.client_id || '');
                    opt.textContent = c.customer_name || ('Client #' + c.client_id);
                    clientSelect.appendChild(opt);
                });

                var url = new URL(window.location.href);
                var qClientId = parseInt(url.searchParams.get('client_id') || '0', 10) || 0;
                if (qClientId > 0) {
                    clientSelect.value = String(qClientId);
                }

                updateCreateLink();
            });
    }

    function renderRows(rows) {
        if (!tbody) return;
        if (!Array.isArray(rows) || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:#6b7280;">No profiles found.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(function (r) {
            var pid = r.profile_id || 0;
            var cid = r.client_id || 0;
            var href = 'verification_profile_edit.php?profile_id=' + encodeURIComponent(pid) + '&client_id=' + encodeURIComponent(cid);
            return [
                '<tr>',
                '<td>' + escapeHtml(r.customer_name || '') + '</td>',
                '<td><a href="' + href + '" style="text-decoration:none; color:#2563eb;">' + escapeHtml(r.profile_name || '') + '</a></td>',
                '<td>' + escapeHtml(r.description || '') + '</td>',
                '<td>' + escapeHtml(r.location || '') + '</td>',
                '<td><span class="badge">' + ((r.is_active === 1 || r.is_active === '1') ? 'Active' : 'Inactive') + '</span></td>',
                '</tr>'
            ].join('');
        }).join('');
    }

    function loadProfiles() {
        if (!tbody) return;
        setMessage('', '');
        tbody.innerHTML = '<tr><td colspan="5" style="color:#6b7280;">Loading...</td></tr>';

        var cid = getSelectedClientId();

        var search = searchEl ? (searchEl.value || '').trim().toLowerCase() : '';

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/verification_profiles_list.php';
        if (cid > 0) {
            url += '?client_id=' + encodeURIComponent(cid);
        }

        fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    setMessage((data && data.message) ? data.message : 'Failed to load profiles.', 'danger');
                    renderRows([]);
                    return;
                }

                var rows = Array.isArray(data.data) ? data.data : [];
                if (search) {
                    rows = rows.filter(function (r) {
                        return String(r.profile_name || '').toLowerCase().includes(search)
                            || String(r.customer_name || '').toLowerCase().includes(search);
                    });
                }

                renderRows(rows);
            })
            .catch(function () {
                setMessage('Network error. Please try again.', 'danger');
                renderRows([]);
            });
    }

    if (clientSelect) {
        clientSelect.addEventListener('change', function () {
            updateCreateLink();
            loadProfiles();
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadProfiles);
    }

    if (searchEl) {
        searchEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadProfiles();
            }
        });
    }

    loadClients()
        .then(function () {
            loadProfiles();
        })
        .catch(function (e) {
            setMessage(e && e.message ? e.message : 'Failed to load clients.', 'danger');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:#6b7280;">Loading...</td></tr>';
        });
});
