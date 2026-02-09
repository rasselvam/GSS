(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var groupSelect = document.getElementById('vrCasesGroupSelect');
        var viewSelect = document.getElementById('vrCasesViewSelect');
        var searchEl = document.getElementById('vrCasesListSearch');
        var refreshBtn = document.getElementById('vrCasesListRefreshBtn');
        var tableEl = document.getElementById('vrCasesListTable');
        var exportButtonsHostEl = document.getElementById('vrCasesListExportButtons');
        var messageEl = document.getElementById('vrCasesListMessage');
        var assignedHost = document.getElementById('vrCasesAssignedModules');
        var dataTable = null;

        var HOLIDAY_SET = {};
        var HOLIDAYS_LOADED = false;

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

        function fmtGroup(g) {
            g = String(g || '').toUpperCase();
            if (g === 'BASIC') return 'Basic';
            if (g === 'EDUCATION') return 'Education';
            return g || '-';
        }

        function renderAssigned(groups) {
            if (!assignedHost) return;
            groups = Array.isArray(groups) ? groups : [];
            if (!groups.length) {
                assignedHost.innerHTML = '<div class="alert alert-warning" style="margin:0;">No modules assigned. Please contact Admin.</div>';
                return;
            }
            var pills = groups.map(function (g) {
                return '<span class="badge" style="background:#fff; border:1px solid rgba(148,163,184,0.30); color:#0f172a; padding:6px 10px; border-radius:999px; font-weight:800;">' + escapeHtml(fmtGroup(g)) + '</span>';
            }).join(' ');
            assignedHost.innerHTML = '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                '<div style="font-size:12px; color:#64748b; font-weight:800;">Assigned Modules</div>' +
                '<div style="display:flex; gap:8px; flex-wrap:wrap;">' + pills + '</div>' +
                '</div>';
        }

        function safeDate(d) {
            try {
                var dt = (d instanceof Date) ? d : new Date(d);
                if (!dt || isNaN(dt.getTime())) return null;
                return dt;
            } catch (e) {
                return null;
            }
        }

        function ymd(dt) {
            try {
                if (!(dt instanceof Date) || isNaN(dt.getTime())) return '';
                var y = dt.getFullYear();
                var m = String(dt.getMonth() + 1).padStart(2, '0');
                var d = String(dt.getDate()).padStart(2, '0');
                return y + '-' + m + '-' + d;
            } catch (e) {
                return '';
            }
        }

        function isWeekend(dt) {
            try {
                var day = dt.getDay();
                return day === 0 || day === 6;
            } catch (e) {
                return false;
            }
        }

        function businessDaysPassed(startDt, endDt, weekendRules) {
            if (!startDt || !endDt) return 0;
            var include = String(weekendRules || '').toLowerCase().trim() === 'include';
            if (include) {
                var ms = endDt.getTime() - startDt.getTime();
                var daysPassed = Math.floor(ms / 86400000);
                return isFinite(daysPassed) ? Math.max(0, daysPassed) : 0;
            }

            var s = new Date(startDt.getFullYear(), startDt.getMonth(), startDt.getDate());
            var e = new Date(endDt.getFullYear(), endDt.getMonth(), endDt.getDate());
            if (e.getTime() < s.getTime()) return 0;

            var count = 0;
            var cur = new Date(s.getTime());
            // Count full days between start date and end date (excluding the start day)
            cur.setDate(cur.getDate() + 1);
            while (cur.getTime() <= e.getTime()) {
                var key = ymd(cur);
                var isHol = !!(key && HOLIDAY_SET[key]);
                if (!isWeekend(cur) && !isHol) {
                    count++;
                }
                cur.setDate(cur.getDate() + 1);
            }
            return count;
        }

        function loadHolidaysOnce() {
            if (HOLIDAYS_LOADED) return Promise.resolve();
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var url = base + '/api/gssadmin/holidays_list.php';
            return fetch(url, { credentials: 'same-origin' })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    HOLIDAYS_LOADED = true;
                    HOLIDAY_SET = {};
                    if (!data || data.status !== 1 || !Array.isArray(data.data)) return;
                    data.data.forEach(function (h) {
                        var d = h && h.holiday_date ? String(h.holiday_date).slice(0, 10) : '';
                        var on = h && typeof h.is_active !== 'undefined' ? (parseInt(h.is_active || '1', 10) || 1) : 1;
                        if (d && on === 1) HOLIDAY_SET[d] = true;
                    });
                })
                .catch(function () {
                    HOLIDAYS_LOADED = true;
                    HOLIDAY_SET = {};
                });
        }

        function tatBadge(createdAt, tatDays) {
            var rules = 'exclude';
            if (tatDays && typeof tatDays === 'object') {
                rules = tatDays.weekend_rules || 'exclude';
                tatDays = parseInt(tatDays.internal_tat || '20', 10) || 20;
            } else {
                tatDays = parseInt(tatDays, 10);
                if (!isFinite(tatDays) || tatDays <= 0) tatDays = 20;
            }

            var dt = safeDate(createdAt);
            if (!dt) {
                return '<span class="badge" style="background:#f1f5f9; color:#0f172a; border:1px solid rgba(148,163,184,0.28);">-</span>';
            }

            var now = new Date();
            var daysPassed = businessDaysPassed(dt, now, rules);
            var remaining = tatDays - daysPassed;
            var label = remaining >= 0 ? (remaining + ' day(s)') : ('Overdue ' + Math.abs(remaining) + ' day(s)');

            var bg = 'rgba(34,197,94,0.14)';
            var br = 'rgba(34,197,94,0.26)';
            var fg = '#166534';
            if (remaining <= 7 && remaining >= 0) {
                bg = 'rgba(245,158,11,0.14)';
                br = 'rgba(245,158,11,0.22)';
                fg = '#92400e';
            }
            if (remaining < 0) {
                bg = 'rgba(239,68,68,0.12)';
                br = 'rgba(239,68,68,0.24)';
                fg = '#b91c1c';
            }

            return '<span class="badge" style="background:' + bg + '; border:1px solid ' + br + '; color:' + fg + '; font-weight:800; border-radius:999px; padding:6px 10px;">' + escapeHtml(label) + '</span>';
        }

        function getSelectedGroup() {
            if (!groupSelect) return '';
            return String(groupSelect.value || '').toUpperCase();
        }

        function getSelectedView() {
            if (!viewSelect) return 'mine';
            var v = String(viewSelect.value || 'mine').toLowerCase();
            if (v === 'available') return 'available';
            if (v === 'followup') return 'followup';
            if (v === 'completed') return 'completed';
            return 'mine';
        }

        function buildReportHref(applicationId) {
            var appId = String(applicationId || '').trim();
            var href;
            if (appId) {
                href = 'candidate_view.php?application_id=' + encodeURIComponent(appId);
            } else {
                href = 'candidate_view.php';
            }
            var g = getSelectedGroup();
            if (g) {
                href += (href.indexOf('?') === -1 ? '?' : '&') + 'group=' + encodeURIComponent(g);
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
            if (document.getElementById('vatiPayfillerCasesDtButtonsStylesVr')) return;
            var style = document.createElement('style');
            style.id = 'vatiPayfillerCasesDtButtonsStylesVr';
            style.textContent = [
                '#vrCasesListExportButtons .dt-buttons{display:inline-flex; gap:6px; align-items:center;}',
                '#vrCasesListExportButtons .dt-buttons .dt-button{margin:0;}',
                '#vrCasesListExportButtons .dt-buttons .btn{border-radius:6px; padding:6px 10px; font-size:12px; line-height:1; border:1px solid transparent; cursor:pointer;}',
                '#vrCasesListExportButtons .dt-buttons .btn-secondary{background:#64748b; border-color:#64748b; color:#fff;}',
                '#vrCasesListExportButtons .dt-buttons .btn-success{background:#16a34a; border-color:#16a34a; color:#fff;}',
                '#vrCasesListExportButtons .dt-buttons .btn-dark{background:#0f172a; border-color:#0f172a; color:#fff;}',
                '#vrCasesListExportButtons .dt-buttons .btn-outline{background:#fff; border-color:#cbd5e1; color:#0f172a;}',
                '#vrCasesListExportButtons .dt-buttons .btn:hover{filter:brightness(0.95);}'
            ].join('\n');
            document.head.appendChild(style);
        }

        function reloadTable() {
            if (dataTable) {
                dataTable.ajax.reload(null, false);
            }
        }

        function initDataTable() {
            if (!tableEl) return;

            var g0 = getSelectedGroup();
            if (!g0) {
                setMessage('No modules assigned. Please contact Admin.', 'warning');
                return;
            }

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
                    var group = getSelectedGroup();
                    var view = getSelectedView();
                    if (!group) {
                        setMessage('Please select a group.', 'warning');
                        callback({ data: [] });
                        return;
                    }
                    var url = base + '/api/verifier/cases_list.php?group=' + encodeURIComponent(group || '') + '&view=' + encodeURIComponent(view) + '&search=' + encodeURIComponent(search || '');

                    loadHolidaysOnce().then(function () {
                        return fetch(url, { credentials: 'same-origin' });
                    })
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
                    {
                        data: function (row) {
                            return (row && (row.case_id || row.caseId || row.caseID || row.id)) ? (row.case_id || row.caseId || row.caseID || row.id) : '';
                        },
                        defaultContent: ''
                    },
                    {
                        data: function (row) {
                            return (row && (row.application_id || row.applicationId || row.applicationID)) ? (row.application_id || row.applicationId || row.applicationID) : '';
                        },
                        defaultContent: ''
                    },
                    {
                        data: null,
                        render: function (_d, _t, row) {
                            var name = ((row && row.candidate_first_name) ? row.candidate_first_name : '') + ' ' + ((row && row.candidate_last_name) ? row.candidate_last_name : '');
                            var appId = row && (row.application_id || row.applicationId || row.applicationID) ? (row.application_id || row.applicationId || row.applicationID) : '';
                            var href = buildReportHref(appId);
                            var caseId = row && (row.case_id || row.caseId || row.caseID || row.id) ? (row.case_id || row.caseId || row.caseID || row.id) : '';
                            if (!appId && caseId) {
                                href += (href.indexOf('?') === -1 ? '?' : '&') + 'case_id=' + encodeURIComponent(String(caseId));
                            }
                            return '<a href="' + href + '" style="text-decoration:none; color:#2563eb;">' + escapeHtml(name.trim()) + '</a>';
                        }
                    },
                    { data: 'candidate_email', defaultContent: '' },
                    { data: 'candidate_mobile', defaultContent: '' },
                    {
                        data: 'created_at',
                        render: function (d, _t, row) {
                            var rules = row && row.weekend_rules ? row.weekend_rules : 'exclude';
                            var tat = row && typeof row.internal_tat !== 'undefined' ? (parseInt(row.internal_tat || '20', 10) || 20) : 20;
                            return tatBadge(d, { internal_tat: tat, weekend_rules: rules });
                        }
                    },
                    {
                        data: null,
                        render: function (_d, _t, row) {
                            var qs = row && row.status ? String(row.status) : '';
                            var cs = row && row.case_status ? String(row.case_status) : '';
                            return escapeHtml(qs || cs || '');
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

        function loadAllowedGroups() {
            if (!groupSelect) return Promise.resolve([]);
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            return fetch(base + '/api/verifier/allowed_config.php', { credentials: 'same-origin' })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    var groups = (data && data.status === 1 && data.data && Array.isArray(data.data.allowed_groups)) ? data.data.allowed_groups : [];
                    groupSelect.innerHTML = '';
                    if (!groups.length) {
                        groupSelect.innerHTML = '<option value="">No Modules</option>';
                        renderAssigned([]);
                        return [];
                    }
                    renderAssigned(groups);
                    groups.forEach(function (g) {
                        var opt = document.createElement('option');
                        opt.value = String(g);
                        opt.textContent = String(g).toUpperCase();
                        groupSelect.appendChild(opt);
                    });
                    if (!groupSelect.value) {
                        groupSelect.value = String(groups[0]);
                    }
                    return groups;
                })
                .catch(function () {
                    groupSelect.innerHTML = '<option value="">No Modules</option>';
                    renderAssigned([]);
                    return [];
                });
        }

        if (groupSelect) groupSelect.addEventListener('change', reloadTable);
        if (viewSelect) viewSelect.addEventListener('change', reloadTable);

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

        var css1 = 'https://cdn.datatables.net/2.1.8/css/dataTables.dataTables.min.css';
        var css2 = 'https://cdn.datatables.net/buttons/3.1.2/css/buttons.dataTables.min.css';
        var js1 = 'https://cdn.datatables.net/2.1.8/js/dataTables.min.js';
        var js2 = 'https://cdn.datatables.net/buttons/3.1.2/js/dataTables.buttons.min.js';
        var js3 = 'https://cdn.datatables.net/buttons/3.1.2/js/buttons.html5.min.js';
        var js4 = 'https://cdn.datatables.net/buttons/3.1.2/js/buttons.print.min.js';
        var js5 = 'https://cdn.datatables.net/buttons/3.1.2/js/buttons.colVis.min.js';
        var jsZip = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

        Promise.all([
            loadAllowedGroups(),
            loadCss(css1),
            loadCss(css2)
        ])
            .then(function () { return loadScript(js1); })
            .then(function () { return loadScript(jsZip); })
            .then(function () { return loadScript(js2); })
            .then(function () { return loadScript(js3); })
            .then(function () { return loadScript(js4); })
            .then(function () { return loadScript(js5); })
            .then(function () {
                initDataTable();
                if (dataTable) {
                    dataTable.ajax.reload(null, false);
                }
            })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to load DataTables assets.', 'danger');
            });
    });
})();
