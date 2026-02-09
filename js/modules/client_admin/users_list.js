(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var searchEl = document.getElementById('clientUsersListSearch');
        var refreshBtn = document.getElementById('clientUsersListRefreshBtn');
        var tableEl = document.getElementById('clientUsersListTable');
        var exportButtonsHostEl = document.getElementById('clientUsersListExportButtons');
        var createBtn = document.getElementById('clientUsersCreateBtn');
        var messageEl = document.getElementById('clientUsersListMessage');
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

        function updateCreateLink() {
            if (!createBtn) return;
            createBtn.href = 'user_create.php';
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

        function reloadTable() {
            if (dataTable) {
                dataTable.ajax.reload(null, false);
            }
        }

        function ensureButtonsStyles() {
            if (document.getElementById('vatiPayfillerClientUsersDtButtonsStyles')) return;
            var style = document.createElement('style');
            style.id = 'vatiPayfillerClientUsersDtButtonsStyles';
            style.textContent = [
                '#clientUsersListExportButtons .dt-buttons{display:inline-flex; gap:6px; align-items:center;}',
                '#clientUsersListExportButtons .dt-buttons .dt-button{margin:0;}',
                '#clientUsersListExportButtons .dt-buttons .btn{border-radius:6px; padding:6px 10px; font-size:12px; line-height:1; border:1px solid transparent; cursor:pointer;}',
                '#clientUsersListExportButtons .dt-buttons .btn-secondary{background:#64748b; border-color:#64748b; color:#fff;}',
                '#clientUsersListExportButtons .dt-buttons .btn-success{background:#16a34a; border-color:#16a34a; color:#fff;}',
                '#clientUsersListExportButtons .dt-buttons .btn-dark{background:#0f172a; border-color:#0f172a; color:#fff;}',
                '#clientUsersListExportButtons .dt-buttons .btn-outline{background:#fff; border-color:#cbd5e1; color:#0f172a;}',
                '#clientUsersListExportButtons .dt-buttons .btn:hover{filter:brightness(0.95);}'
            ].join('\n');
            document.head.appendChild(style);
        }

        function makeUsersTable(table, group, enableButtons) {
            if (!table) return null;

            if (!window.jQuery || !jQuery.fn || !jQuery.fn.DataTable) {
                setMessage('DataTables is not available. Please refresh.', 'danger');
                return null;
            }

            ensureButtonsStyles();

            var opts = {
                processing: true,
                pageLength: 10,
                searching: false,
                dom: enableButtons ? 'Brtip' : 'rtip',
                buttons: enableButtons ? [
                    { extend: 'copy', className: 'btn btn-secondary' },
                    { extend: 'csv', className: 'btn btn-success' },
                    { extend: 'excel', className: 'btn btn-success' },
                    { extend: 'print', className: 'btn btn-dark' },
                    { extend: 'colvis', className: 'btn btn-outline' }
                ] : [],
                ajax: function (_dtParams, callback) {
                    setMessage('', '');
                    var search = searchEl ? (searchEl.value || '').trim() : '';

                    var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
                    var url = base + '/api/client_admin/users_list.php';
                    var qs = [];
                    if (group) qs.push('group=' + encodeURIComponent(String(group)));
                    if (search) qs.push('search=' + encodeURIComponent(search));
                    if (qs.length) url += '?' + qs.join('&');

                    fetch(url, { credentials: 'same-origin' })
                        .then(function (res) { return res.json(); })
                        .then(function (data) {
                            if (!data || data.status !== 1) {
                                setMessage((data && data.message) ? data.message : 'Failed to load users.', 'danger');
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
                    {
                        data: 'username',
                        render: function (_d, _t, row) {
                            var uid = row && row.user_id ? row.user_id : '';
                            var href = 'user_create.php?user_id=' + encodeURIComponent(uid);
                            return '<a href="' + href + '" style="text-decoration:none; color:#2563eb;">' + escapeHtml(row.username || '') + '</a>';
                        }
                    },
                    { data: 'first_name' },
                    { data: 'last_name' },
                    { data: 'role' },
                    {
                        data: 'is_active',
                        render: function (d) {
                            var active = (d === 1 || d === '1' || d === true);
                            return '<span class="badge">' + (active ? 'Active' : 'Inactive') + '</span>';
                        }
                    },
                    { data: 'location' }
                ]
            };

            var dt = jQuery(table).DataTable(opts);

            if (enableButtons && exportButtonsHostEl && dt && dt.buttons) {
                try {
                    exportButtonsHostEl.innerHTML = '';
                    exportButtonsHostEl.appendChild(dt.buttons().container()[0]);
                } catch (_e) {
                }
            }

            return dt;
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', reloadTable);
        }

        updateCreateLink();

        if (searchEl) {
            searchEl.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    reloadTable();
                }
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
            loadCss(css1),
            loadCss(css2)
        ])
            .then(function () {
                return loadScript(js1);
            })
            .then(function () {
                return loadScript(jsZip);
            })
            .then(function () {
                return loadScript(js2);
            })
            .then(function () {
                return loadScript(js3);
            })
            .then(function () {
                return loadScript(js4);
            })
            .then(function () {
                return loadScript(js5);
            })
            .then(function () {
                dataTable = makeUsersTable(tableEl, 'client', true);
            })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to load DataTables assets.', 'danger');
            });
    });
})();
