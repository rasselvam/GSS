(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var msgEl = document.getElementById('qaReportsTrackMessage');
        var clientEl = document.getElementById('qaRptClient');
        var statusEl = document.getElementById('qaRptStatus');
        var fromEl = document.getElementById('qaRptFrom');
        var toEl = document.getElementById('qaRptTo');
        var searchEl = document.getElementById('qaRptSearch');
        var refreshBtn = document.getElementById('qaRptRefresh');
        var tableEl = document.getElementById('qaRptTable');
        var exportButtonsHostEl = document.getElementById('qaRptExportButtons');
        var dataTable = null;

        function setMessage(text, type) {
            if (!msgEl) return;
            msgEl.textContent = text || '';
            msgEl.className = type ? ('alert alert-' + type) : '';
            msgEl.style.display = text ? 'block' : 'none';
        }

        function esc(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function getInt(el) {
            if (!el) return 0;
            return parseInt(el.value || '0', 10) || 0;
        }

        function getStr(el) {
            if (!el) return '';
            return String(el.value || '').trim();
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
            if (document.getElementById('vatiPayfillerQaRptDtButtonsStyles')) return;
            var style = document.createElement('style');
            style.id = 'vatiPayfillerQaRptDtButtonsStyles';
            style.textContent = [
                '#qaRptExportButtons .dt-buttons{display:inline-flex; gap:6px; align-items:center;}',
                '#qaRptExportButtons .dt-buttons .dt-button{margin:0;}',
                '#qaRptExportButtons .dt-buttons .btn{border-radius:6px; padding:6px 10px; font-size:12px; line-height:1; border:1px solid transparent; cursor:pointer;}',
                '#qaRptExportButtons .dt-buttons .btn-secondary{background:#64748b; border-color:#64748b; color:#fff;}',
                '#qaRptExportButtons .dt-buttons .btn-success{background:#16a34a; border-color:#16a34a; color:#fff;}',
                '#qaRptExportButtons .dt-buttons .btn-dark{background:#0f172a; border-color:#0f172a; color:#fff;}',
                '#qaRptExportButtons .dt-buttons .btn-outline{background:#fff; border-color:#cbd5e1; color:#0f172a;}',
                '#qaRptExportButtons .dt-buttons .btn:hover{filter:brightness(0.95);}'
            ].join('\n');
            document.head.appendChild(style);
        }

        function audit(applicationId, event, meta) {
            if (!applicationId) return;
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            fetch(base + '/api/qa/report_audit.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ application_id: applicationId, event: event, meta: meta || null })
            }).catch(function () {
            });
        }

        function reload() {
            if (dataTable) dataTable.ajax.reload(null, false);
        }

        function initTable() {
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

                    var qs = [];
                    var cid = getInt(clientEl);
                    if (cid > 0) qs.push('client_id=' + encodeURIComponent(String(cid)));
                    var st = getStr(statusEl);
                    if (st) qs.push('status=' + encodeURIComponent(st));
                    var from = getStr(fromEl);
                    if (from) qs.push('from=' + encodeURIComponent(from));
                    var to = getStr(toEl);
                    if (to) qs.push('to=' + encodeURIComponent(to));
                    var q = getStr(searchEl);
                    if (q) qs.push('search=' + encodeURIComponent(q));

                    var url = base + '/api/qa/cases_list.php' + (qs.length ? ('?' + qs.join('&')) : '');

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
                    { data: 'customer_name' },
                    { data: 'application_id' },
                    {
                        data: null,
                        render: function (_d, _t, row) {
                            var name = (String(row.candidate_first_name || '') + ' ' + String(row.candidate_last_name || '')).trim();
                            return esc(name);
                        }
                    },
                    { data: 'candidate_email' },
                    { data: 'candidate_mobile' },
                    { data: 'case_status' },
                    {
                        data: 'created_at',
                        render: function (d) {
                            try {
                                if (window.GSS_DATE && typeof window.GSS_DATE.formatDbDateTime === 'function') {
                                    return esc(window.GSS_DATE.formatDbDateTime(d));
                                }
                            } catch (e) {
                            }
                            return esc(d);
                        }
                    },
                    {
                        data: null,
                        orderable: false,
                        render: function (_d, _t, row) {
                            var appId = row && row.application_id ? String(row.application_id) : '';
                            var caseReview = 'case_review.php?application_id=' + encodeURIComponent(appId);
                            var openReport = '../shared/candidate_report.php?role=qa&application_id=' + encodeURIComponent(appId);
                            var printReport = '../shared/candidate_report.php?role=qa&application_id=' + encodeURIComponent(appId) + '&print=1';

                            return '' +
                                '<a class="btn btn-sm btn-light" href="' + esc(caseReview) + '" style="border-radius:10px; margin-right:6px;">Review</a>' +
                                '<a class="btn btn-sm btn-light" href="' + esc(openReport) + '" target="_blank" rel="noopener" data-audit="open" data-app="' + esc(appId) + '" style="border-radius:10px; margin-right:6px;">Open</a>' +
                                '<a class="btn btn-sm btn-light" href="' + esc(printReport) + '" target="_blank" rel="noopener" data-audit="print" data-app="' + esc(appId) + '" style="border-radius:10px;">Print</a>';
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

            tableEl.addEventListener('click', function (e) {
                var t = e && e.target ? e.target : null;
                if (!t) return;
                var a = t.closest ? t.closest('[data-audit]') : null;
                if (!a) return;
                var ev = String(a.getAttribute('data-audit') || '').toLowerCase();
                var app = String(a.getAttribute('data-app') || '');
                if (ev === 'open') audit(app, 'open', { source: 'qa_reports_tracking' });
                if (ev === 'print') audit(app, 'print', { source: 'qa_reports_tracking', print: 1 });
            });
        }

        function loadClients() {
            if (!clientEl) return Promise.resolve();
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            return fetch(base + '/api/qa/clients_dropdown.php', { credentials: 'same-origin' })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    clientEl.innerHTML = '<option value="0">All Clients</option>';
                    if (!data || data.status !== 1 || !Array.isArray(data.data)) return;
                    data.data.forEach(function (c) {
                        var opt = document.createElement('option');
                        opt.value = String(c.client_id || '0');
                        opt.textContent = c.customer_name || ('Client #' + c.client_id);
                        clientEl.appendChild(opt);
                    });
                })
                .catch(function () {
                });
        }

        if (refreshBtn) refreshBtn.addEventListener('click', reload);
        if (clientEl) clientEl.addEventListener('change', reload);
        if (statusEl) statusEl.addEventListener('change', reload);

        if (searchEl) {
            var t = null;
            searchEl.addEventListener('input', function () {
                clearTimeout(t);
                t = setTimeout(reload, 250);
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
            .then(function () { initTable(); })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to load DataTables assets.', 'danger');
            });
    });
})();
