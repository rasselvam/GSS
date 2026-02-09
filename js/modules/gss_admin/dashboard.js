document.addEventListener('DOMContentLoaded', function () {
    var clockEl = document.getElementById('gss-admin-clock');
    var statusEl = document.getElementById('gss-admin-status');
    var msgEl = document.getElementById('gssDashMessage');

    var kpiClients = document.getElementById('kpiClients');
    var kpiJobRoles = document.getElementById('kpiJobRoles');
    var kpiInProgress = document.getElementById('kpiInProgress');
    var kpiToday = document.getElementById('kpiToday');
    var recentBody = document.getElementById('recentCasesBody');
    var upcomingEl = document.getElementById('upcomingHolidays');

    function cssVar(name, fallback) {
        try {
            var v = getComputedStyle(document.documentElement).getPropertyValue(name);
            if (v != null) {
                v = String(v).trim();
                if (v) return v;
            }
        } catch (e) {
        }
        return fallback;
    }

    var THEME = {
        primary: cssVar('--crm-primary', '#057DDB'),
        primary2: cssVar('--crm-primary-2', '#0C436B'),
        danger: cssVar('--crm-danger', '#A82223'),
        danger2: cssVar('--crm-danger-2', '#750F0F'),
        text: cssVar('--crm-text', '#041418'),
        muted: cssVar('--crm-muted', 'rgba(4, 20, 24, 0.72)')
    };

    function setMessage(text, type) {
        if (!msgEl) return;
        msgEl.textContent = text || '';
        msgEl.className = type ? ('alert alert-' + type) : '';
        msgEl.style.display = text ? 'block' : 'none';
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function fmtDate(d) {
        if (!d) return '-';
        try {
            if (window.GSS_DATE && typeof window.GSS_DATE.formatDbDateTime === 'function') {
                return window.GSS_DATE.formatDbDateTime(d);
            }
        } catch (e) {
        }
        try {
            var dt = new Date(String(d).replace(' ', 'T'));
            return dt.toLocaleString();
        } catch (e2) {
            return String(d);
        }
    }

    function fmtHolidayDate(ymd) {
        // ymd expected: YYYY-MM-DD
        try {
            var parts = String(ymd || '').split('-');
            if (parts.length === 3) return parts[2] + '-' + parts[1] + '-' + parts[0];
        } catch (e) {
        }
        return String(ymd || '-');
    }

    function iconSvg(kind) {
        // lightweight inline icons
        if (kind === 'clients') return '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" stroke-width="1.6"/><path d="M4 20c1.2-3 4.2-5 8-5s6.8 2 8 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
        if (kind === 'roles') return '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 7h8M8 12h8M8 17h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M5 5h14v14H5V5Z" stroke="currentColor" stroke-width="1.6"/></svg>';
        if (kind === 'progress') return '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        if (kind === 'today') return '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3v3M17 3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 7h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M6 9h12v11H6V9Z" stroke="currentColor" stroke-width="1.6"/></svg>';
        return '';
    }

    function ensureIcons() {
        var els = document.querySelectorAll('.kpiIcon');
        if (!els || !els.length) return;
        els.forEach(function (el) {
            if (el.getAttribute('data-ready') === '1') return;
            var kind = el.getAttribute('data-icon');
            el.innerHTML = '<div class="dashboard-kpi-icon">' + iconSvg(kind) + '</div>';
            el.setAttribute('data-ready', '1');
        });
    }

    function bindCardClicks() {
        var cards = document.querySelectorAll('.gss-kpi-card');
        if (!cards || !cards.length) return;
        cards.forEach(function (card) {
            if (card.getAttribute('data-click-bound') === '1') return;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.addEventListener('click', function () {
                var href = card.getAttribute('data-href');
                if (href) window.location.href = href;
            });
            card.addEventListener('keydown', function (e) {
                if (e && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    var href = card.getAttribute('data-href');
                    if (href) window.location.href = href;
                }
            });
            card.setAttribute('data-click-bound', '1');
        });
    }

    function setClock() {
        if (!clockEl) return;
        var now = new Date();
        var time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clockEl.textContent = 'Time: ' + time;
    }

    setClock();
    setInterval(setClock, 1000);
    ensureIcons();
    bindCardClicks();

    function load() {
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        if (statusEl) statusEl.textContent = 'Loading live metrics …';

        fetch(base + '/api/gssadmin/dashboard_stats.php', { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (json) {
                if (!json || json.status !== 1) {
                    throw new Error((json && json.message) ? json.message : 'Failed to load dashboard.');
                }

                var data = json.data || {};
                var k = data.kpis || {};
                if (kpiClients) kpiClients.textContent = (k.clients_total != null ? k.clients_total : '--');
                if (kpiJobRoles) kpiJobRoles.textContent = (k.job_roles_total != null ? k.job_roles_total : '--');
                if (kpiInProgress) kpiInProgress.textContent = (k.cases_in_progress != null ? k.cases_in_progress : '--');
                if (kpiToday) kpiToday.textContent = (k.cases_created_today != null ? k.cases_created_today : '--');

                if (statusEl) statusEl.textContent = 'Updated: ' + new Date().toLocaleString();

                ensureChartJs(function () {
                    renderCharts(data);
                });
                renderRecentCases(data.recent_cases || []);
                renderUpcomingHolidays(data.upcoming_holidays || []);
            })
            .catch(function (err) {
                setMessage(err.message, 'danger');
                if (statusEl) statusEl.textContent = 'Failed to load live metrics.';
            });
    }

    function ensureChartJs(done) {
        if (window.Chart) {
            done();
            return;
        }

        var existing = document.querySelector('script[data-chartjs="1"]');
        if (existing) {
            existing.addEventListener('load', done);
            existing.addEventListener('error', function () {
                setMessage('Chart library failed to load. Please check internet access / CDN.', 'warning');
            });
            return;
        }

        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        s.async = true;
        s.setAttribute('data-chartjs', '1');
        s.onload = function () { done(); };
        s.onerror = function () {
            setMessage('Chart library failed to load. Please check internet access / CDN.', 'warning');
        };
        document.head.appendChild(s);
    }

    var trendChart = null;
    var statusChart = null;

    function renderCharts(data) {
        if (!window.Chart) {
            setMessage('Chart library not available. KPI data loaded but charts cannot render.', 'warning');
            return;
        }

        var trend = Array.isArray(data.cases_trend_14d) ? data.cases_trend_14d : [];
        var labels = trend.map(function (t) {
            var d = String(t.date || '');
            var p = d.split('-');
            return p.length === 3 ? (p[2] + '/' + p[1]) : d;
        });
        var values = trend.map(function (t) { return Number(t.count || 0); });

        var trendCanvas = document.getElementById('chartCasesTrend');
        if (trendCanvas) {
            if (trendChart) trendChart.destroy();
            trendChart = new Chart(trendCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Cases',
                        data: values,
                        borderColor: THEME.primary,
                        backgroundColor: 'rgba(5, 125, 219, 0.15)',
                        tension: 0.35,
                        fill: true,
                        pointRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, ticks: { precision: 0 } }
                    }
                }
            });
        }

        var mix = data.cases_by_status || {};
        var keys = Object.keys(mix || {});
        keys.sort();
        var mixLabels = keys;
        var mixValues = keys.map(function (k) { return Number(mix[k] || 0); });
        var palette = [THEME.primary, THEME.danger, THEME.primary2, THEME.danger2, '#64748b', '#94a3b8', '#cbd5e1'];
        var colors = mixLabels.map(function (_, i) { return palette[i % palette.length]; });

        var statusCanvas = document.getElementById('chartCaseStatus');
        if (statusCanvas) {
            if (statusChart) statusChart.destroy();
            statusChart = new Chart(statusCanvas, {
                type: 'doughnut',
                data: {
                    labels: mixLabels,
                    datasets: [{ data: mixValues, backgroundColor: colors, borderWidth: 0 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12 } }
                    }
                }
            });
        }
    }

    function renderRecentCases(rows) {
        if (!recentBody) return;
        if (!rows || !rows.length) {
            recentBody.innerHTML = '<tr><td colspan="5" class="dashboard-empty">No cases found.</td></tr>';
            return;
        }

        recentBody.innerHTML = rows
            .map(function (r) {
                var appId = escapeHtml(r.application_id || '-');
                var client = escapeHtml(r.customer_name || (r.client_id != null ? ('Client #' + r.client_id) : '-'));
                var cand = escapeHtml(((r.candidate_first_name || '') + ' ' + (r.candidate_last_name || '')).trim() || '-');
                var st = escapeHtml(r.case_status || '-');
                var created = escapeHtml(fmtDate(r.created_at));
                var rawApp = String(r.application_id || '');
                var rowHref = rawApp ? ('candidate_view.php?application_id=' + encodeURIComponent(rawApp)) : '';
                return '<tr>' +
                    '<td>' + appId + '</td>' +
                    '<td>' + client + '</td>' +
                    '<td>' + cand + '</td>' +
                    '<td><span class="badge dashboard-status-badge">' + st + '</span></td>' +
                    '<td>' + created + '</td>' +
                    '</tr>';
            })
            .join('');

        // Make rows clickable (open candidate report)
        Array.prototype.slice.call(recentBody.querySelectorAll('tr')).forEach(function (tr, idx) {
            var r = rows[idx] || {};
            var rawApp = String(r.application_id || '');
            if (!rawApp) return;
            var href = 'candidate_view.php?application_id=' + encodeURIComponent(rawApp);
            tr.addEventListener('click', function () {
                window.location.href = href;
            });
        });
    }

    function renderUpcomingHolidays(rows) {
        if (!upcomingEl) return;
        if (!rows || !rows.length) {
            upcomingEl.innerHTML = '<div class="dashboard-empty">No upcoming holidays in next 30 days.</div>';
            return;
        }

        upcomingEl.innerHTML = rows
            .map(function (h) {
                var name = escapeHtml(h.holiday_name || '-');
                var date = escapeHtml(fmtHolidayDate(h.holiday_date));
                return (
                    '<div class="dashboard-holiday-item">' +
                    '<div class="dashboard-holiday-row">' +
                    '<div><div class="dashboard-holiday-name">' + name + '</div>' +
                    '<div class="dashboard-holiday-date">' + date + '</div></div>' +
                    '<div class="dashboard-holiday-tag">Holiday</div>' +
                    '</div>' +
                    '</div>'
                );
            })
            .join('');
    }

    load();
});
