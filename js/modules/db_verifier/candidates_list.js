(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var clientSelect = document.getElementById('dbvCasesClientSelect');
        var modeSelect = document.getElementById('dbvCasesMode');
        var searchEl = document.getElementById('dbvCasesListSearch');
        var refreshBtn = document.getElementById('dbvCasesListRefreshBtn');
        var tableEl = document.getElementById('dbvCasesListTable');
        var exportButtonsHostEl = document.getElementById('dbvCasesListExportButtons');
        var messageEl = document.getElementById('dbvCasesListMessage');
        var dataTable = null;

        function setMessage(text, type) {
            if (!messageEl) return;
            messageEl.textContent = text || '';
            messageEl.className = type ? ('alert alert-' + type) : '';
            messageEl.style.display = text ? 'block' : 'none';
        }

        function escapeHtml(str) {
            return String(str || '')
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

        function getMode() {
            if (!modeSelect) return 'available';
            var v = String(modeSelect.value || '').toLowerCase();
            return (v === 'mine') ? 'mine' : 'available';
        }

        function getAuthUserId() {
            var v = window.AUTH_USER_ID;
            var n = parseInt(String(v || '0'), 10) || 0;
            return n;
        }

        function buildReportHref(applicationId) {
            var cid = getSelectedClientId();
            var href = 'candidate_view.php?application_id=' + encodeURIComponent(String(applicationId || ''));
            if (cid > 0) {
                href += '&client_id=' + encodeURIComponent(String(cid));
            }
            return href;
        }

        function loadCss(href) {
            return new Promise(function (resolve, reject) {
                var existing = document.querySelector('link[href="' + href + '"]');
                if (existing) return resolve();
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = function () { resolve(); };
                link.onerror = function () { reject(new Error('Failed to load CSS: ' + href)); };
                document.head.appendChild(link);
            });
        }

        function loadScript(src) {
            return new Promise(function (resolve, reject) {
                var existing = document.querySelector('script[src="' + src + '"]');
                if (existing) return resolve();
                var script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = function () { resolve(); };
                script.onerror = function () { reject(new Error('Failed to load script: ' + src)); };
                document.body.appendChild(script);
            });
        }

        function ensureButtonsStyles() {
            if (document.getElementById('vatiPayfillerCasesDtButtonsStylesDbv')) return;
            var style = document.createElement('style');
            style.id = 'vatiPayfillerCasesDtButtonsStylesDbv';
            style.textContent = [
                '#dbvCasesListExportButtons .dt-buttons{display:inline-flex; gap:6px; align-items:center;}',
                '#dbvCasesListExportButtons .dt-buttons .dt-button{margin:0;}',
                '#dbvCasesListExportButtons .dt-buttons .btn{border-radius:6px; padding:6px 10px; font-size:12px; line-height:1; border:1px solid transparent; cursor:pointer;}',
                '#dbvCasesListExportButtons .dt-buttons .btn-secondary{background:#64748b; border-color:#64748b; color:#fff;}',
                '#dbvCasesListExportButtons .dt-buttons .btn-success{background:#16a34a; border-color:#16a34a; color:#fff;}',
                '#dbvCasesListExportButtons .dt-buttons .btn-dark{background:#0f172a; border-color:#0f172a; color:#fff;}',
                '#dbvCasesListExportButtons .dt-buttons .btn-outline{background:#fff; border-color:#cbd5e1; color:#0f172a;}',
                '#dbvCasesListExportButtons .dt-buttons .btn:hover{filter:brightness(0.95);}'
            ].join('\n');
            document.head.appendChild(style);
        }

        function reloadTable() {
            if (dataTable) {
                dataTable.ajax.reload(null, false);
            }
        }

        function postJson(url, body) {
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(body || {})
            }).then(function (res) {
                return res.json().then(function (data) {
                    return { status: res.status, data: data };
                });
            });
        }

        function handleAction(action, caseId) {
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var uid = getAuthUserId();
            if (uid <= 0) {
                setMessage('Login user not detected. Please login (OTP) or pass user_id temporarily.', 'warning');
                return;
            }

            var endpoint = '';
            if (action === 'claim') endpoint = base + '/api/db_verifier/case_claim.php';
            if (action === 'release') endpoint = base + '/api/db_verifier/case_release.php';
            if (action === 'complete') endpoint = base + '/api/db_verifier/case_complete.php';

            if (!endpoint) return;

            setMessage('', '');
            postJson(endpoint, { case_id: caseId, user_id: uid })
                .then(function (res) {
                    var payload = res.data || {};
                    if (!payload || payload.status !== 1) {
                        setMessage((payload && payload.message) ? payload.message : 'Action failed.', 'danger');
                        return;
                    }
                    setMessage(payload.message || 'OK', 'success');
                    reloadTable();
                })
                .catch(function () {
                    setMessage('Network error. Please try again.', 'danger');
                });
        }

        function initDataTable() {
            if (!tableEl) return;

            if (!window.jQuery || !jQuery.fn || !jQuery.fn.DataTable) {
                setMessage('DataTables is not available. Please refresh.', 'danger');
                return;
            }

            ensureButtonsStyles();

            dataTable = jQuery(tableEl).DataTable({
                processing: true,
                pageLength: 10,
                searching: false,
                dom: 'Brtip',
                buttons: [
                    { extend: 'copy', className: 'btn btn-secondary' },
                    { extend: 'csv', className: 'btn btn-success' },
                    { extend: 'excel', className: 'btn btn-success' },
                    { extend: 'print', className: 'btn btn-dark' },
                    { extend: 'colvis', className: 'btn btn-outline' }
                ],
                ajax: function (_dtParams, callback) {
                    setMessage('', '');
                    var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
                    var search = searchEl ? (searchEl.value || '').trim() : '';
                    var clientId = getSelectedClientId();
                    var mode = getMode();
                    var uid = getAuthUserId();
                    var url = base + '/api/db_verifier/cases_list.php?mode=' + encodeURIComponent(mode) + '&client_id=' + encodeURIComponent(clientId || 0) + '&search=' + encodeURIComponent(search || '');
                    if (mode === 'mine' && uid > 0) {
                        url += '&user_id=' + encodeURIComponent(String(uid));
                    }

                    fetch(url, { credentials: 'same-origin' })
                        .then(function (res) { return res.json(); })
                        .then(function (data) {
                            if (!data || data.status !== 1) {
                                setMessage((data && data.message) ? data.message : 'Failed to load cases.', 'danger');
                                callback({ data: [] });
                                return;
                            }
                            callback({ data: data.data || [] });
                        })
                        .catch(function () {
                            setMessage('Network error. Please try again.', 'danger');
                            callback({ data: [] });
                        });
                },
                columns: [
                    { data: 'case_id' },
                    { data: 'application_id' },
                    {
                        data: null,
                        render: function (_d, _t, row) {
                            var name = ((row && row.candidate_first_name) ? row.candidate_first_name : '') + ' ' + ((row && row.candidate_last_name) ? row.candidate_last_name : '');
                            var appId = row && row.application_id ? row.application_id : '';
                            var href = buildReportHref(appId);
                            return '<a href="' + href + '" style="text-decoration:none; color:#2563eb;">' + escapeHtml(name.trim()) + '</a>';
                        }
                    },
                    { data: 'candidate_email' },
                    { data: 'candidate_mobile' },
                    { data: 'case_status' },
                    {
                        data: null,
                        orderable: false,
                        render: function (_d, _t, row) {
                            var mode = getMode();
                            var caseId = row && row.case_id ? row.case_id : 0;
                            if (!caseId) return '';

                            if (mode === 'mine') {
                                return '' +
                                    '<button type="button" class="btn btn-outline" data-dbv-action="release" data-case-id="' + escapeHtml(caseId) + '">Release</button>' +
                                    ' ' +
                                    '<button type="button" class="btn btn-success" data-dbv-action="complete" data-case-id="' + escapeHtml(caseId) + '">Complete</button>';
                            }

                            return '<button type="button" class="btn" data-dbv-action="claim" data-case-id="' + escapeHtml(caseId) + '">Claim</button>';
                        }
                    },
                    {
                        data: 'created_at',
                        render: function (d) {
                            return escapeHtml(window.GSS_DATE.formatDbDateTime(d));
                        }
                    }
                ]
            });

            if (exportButtonsHostEl && dataTable && dataTable.buttons) {
                try {
                    exportButtonsHostEl.innerHTML = '';
                    exportButtonsHostEl.appendChild(dataTable.buttons().container()[0]);
                } catch (_e) {
                }
            }
        }

        function loadClients() {
            if (!clientSelect) return Promise.resolve();

            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            return fetch(base + '/api/gssadmin/clients_dropdown.php', { credentials: 'same-origin' })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    clientSelect.innerHTML = '<option value="0">All Clients</option>';
                    if (!data || data.status !== 1 || !Array.isArray(data.data)) {
                        return;
                    }
                    data.data.forEach(function (c) {
                        var opt = document.createElement('option');
                        opt.value = String(c.client_id || '0');
                        opt.textContent = c.customer_name || ('Client #' + c.client_id);
                        clientSelect.appendChild(opt);
                    });
                })
                .catch(function () {
                });
        }

        if (clientSelect) {
            clientSelect.addEventListener('change', reloadTable);
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', function () {
                var mode = getMode();
                if (mode === 'mine' && getAuthUserId() <= 0) {
                    setMessage('Login user not detected. My Claimed requires login (OTP) or a temporary user_id.', 'warning');
                }
                reloadTable();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', reloadTable);
        }

        if (searchEl) {
            var t = null;
            searchEl.addEventListener('input', function () {
                clearTimeout(t);
                t = setTimeout(reloadTable, 250);
            });
        }

        if (tableEl) {
            tableEl.addEventListener('click', function (e) {
                var el = e.target;
                if (!el) return;
                var btn = el.closest ? el.closest('[data-dbv-action]') : null;
                if (!btn) return;
                var action = btn.getAttribute('data-dbv-action');
                var caseId = parseInt(btn.getAttribute('data-case-id') || '0', 10) || 0;
                if (!action || caseId <= 0) return;
                handleAction(action, caseId);
            });
        }

        var css1 = 'https://cdn.datatables.net/2.1.8/css/dataTables.dataTables.min.css';
        var css2 = 'https://cdn.datatables.net/buttons/3.1.2/css/buttons.dataTables.min.css';
        var js1 = 'https://cdn.datatables.net/2.1.8/js/dataTables.min.js';
        var js2 = 'https://cdn.datatables.net/buttons/3.1.2/js/dataTables.buttons.min.js';
        var js3 = 'https://cdn.datatables.net/buttons/3.1.2/js/buttons.html5.min.js';
        var js4 = 'https://cdn.datatables.net/buttons/3.1.2/js/buttons.print.min.js';
        var js5 = 'https://cdn.datatables.net/buttons/3.1.2/js/buttons.colVis.min.js';
        var jsZip = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

        Promise.all([
            loadClients(),
            loadCss(css1),
            loadCss(css2)
        ])
            .then(function () { return loadScript(js1); })
            .then(function () { return loadScript(jsZip); })
            .then(function () { return loadScript(js2); })
            .then(function () { return loadScript(js3); })
            .then(function () { return loadScript(js4); })
            .then(function () { return loadScript(js5); })
            .then(function () { initDataTable(); })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to load DataTables assets.', 'danger');
            });
    });
})();
