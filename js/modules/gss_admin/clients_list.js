document.addEventListener('DOMContentLoaded', function () {
    var messageEl = document.getElementById('clientsListMessage');
    var searchEl = document.getElementById('clientsListSearch');
    var refreshBtn = document.getElementById('clientsListRefreshBtn');
    var tableEl = document.getElementById('clientsListTable');
    var exportButtonsHostEl = document.getElementById('clientsListExportButtons');
    var dataTable = null;

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
        if (document.getElementById('vatiPayfillerDtButtonsStyles')) return;
        var style = document.createElement('style');
        style.id = 'vatiPayfillerDtButtonsStyles';
        style.textContent = [
            '#clientsListExportButtons .dt-buttons{display:inline-flex; gap:6px; align-items:center;}',
            '#clientsListExportButtons .dt-buttons .dt-button{margin:0;}',
            '#clientsListExportButtons .dt-buttons .btn{border-radius:6px; padding:6px 10px; font-size:12px; line-height:1; border:1px solid transparent; cursor:pointer;}',
            '#clientsListExportButtons .dt-buttons .btn-secondary{background:#64748b; border-color:#64748b; color:#fff;}',
            '#clientsListExportButtons .dt-buttons .btn-success{background:#16a34a; border-color:#16a34a; color:#fff;}',
            '#clientsListExportButtons .dt-buttons .btn-dark{background:#0f172a; border-color:#0f172a; color:#fff;}',
            '#clientsListExportButtons .dt-buttons .btn-outline{background:#fff; border-color:#cbd5e1; color:#0f172a;}',
            '#clientsListExportButtons .dt-buttons .btn:hover{filter:brightness(0.95);}'
        ].join('\n');
        document.head.appendChild(style);
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
                var search = searchEl ? (searchEl.value || '').trim() : '';
                var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
                var url = base + '/api/gssadmin/clients_list.php';
                if (search) url += '?search=' + encodeURIComponent(search);

                fetch(url, { credentials: 'same-origin' })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (!data || data.status !== 1) {
                            setMessage((data && data.message) ? data.message : 'Failed to load clients.', 'danger');
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
                { data: 'client_id' },
                { data: 'customer_name' },
                { data: 'internal_tat' },
                { data: 'external_tat' },
                {
                    data: 'created_at',
                    render: function (d) {
                        return escapeHtml(window.GSS_DATE.formatDbDateTime(d));
                    }
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: function (_data, _type, row) {
                        var id = row && row.client_id ? row.client_id : '';
                        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
                        var viewHref = base + '/modules/gss_admin/client_view.php?client_id=' + encodeURIComponent(id);
                        var editHref = base + '/modules/gss_admin/clients_create.php?client_id=' + encodeURIComponent(id);
                        return (
                            '<a href="' + viewHref + '" style="text-decoration:none; color:#2563eb; font-size:12px;">VIEW</a>' +
                            '<span style="color:#cbd5e1; padding:0 8px;">|</span>' +
                            '<a href="' + editHref + '" style="text-decoration:none; color:#16a34a; font-size:12px;">EDIT</a>'
                        );
                    }
                }
            ],
            createdRow: function (row, data) {
                try {
                    if (!row) return;
                    row.style.cursor = 'pointer';
                    row.addEventListener('click', function (e) {
                        // Don't hijack action link clicks
                        var t = e && e.target ? e.target : null;
                        if (t && (t.closest && t.closest('a,button,input,select,textarea,label'))) {
                            return;
                        }

                        var id = data && data.client_id ? data.client_id : '';
                        if (!id) return;

                        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
                        var href = base + '/modules/gss_admin/users_list.php?client_id=' + encodeURIComponent(id);
                        window.location.href = href;
                    });
                } catch (_e) {
                    // no-op
                }
            }
        });

        if (exportButtonsHostEl && dataTable && dataTable.buttons) {
            try {
                exportButtonsHostEl.innerHTML = '';
                exportButtonsHostEl.appendChild(dataTable.buttons().container()[0]);
            } catch (_e) {
                // no-op
            }
        }
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', reloadTable);
    }

    if (searchEl) {
        searchEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                reloadTable();
            }
        });
    }

    // DataTables (with Buttons) via official CDN
    // Note: layout.php already includes jQuery.
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
            initDataTable();
        })
        .catch(function (e) {
            setMessage(e && e.message ? e.message : 'Failed to load DataTables assets.', 'danger');
        });
});
