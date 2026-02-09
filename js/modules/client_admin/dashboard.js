document.addEventListener('DOMContentLoaded', function () {
    // Page-specific JS for modules/client_admin/dashboard.php
    var clockEl = document.getElementById('client-admin-clock');
    var statusEl = document.getElementById('client-admin-status');

    var elTotal = document.getElementById('caKpiTotal');
    var elAwaiting = document.getElementById('caKpiAwaiting');
    var elWip = document.getElementById('caKpiWip');
    var elStop = document.getElementById('caKpiStop');
    var elCompleted = document.getElementById('caKpiCompleted');
    var elUtv = document.getElementById('caKpiUtv');
    var elDisc = document.getElementById('caKpiDiscrepancy');
    var elIns = document.getElementById('caKpiInsufficient');

    var age0_6 = document.getElementById('caAge0_6');
    var age7_12 = document.getElementById('caAge7_12');
    var age13_24 = document.getElementById('caAge13_24');
    var age25p = document.getElementById('caAge25p');

    var chartStatusEl = document.getElementById('caChartStatus');
    var chartTrendEl = document.getElementById('caChartTrend');
    var chartStatus = null;
    var chartTrend = null;

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
        danger2: cssVar('--crm-danger-2', '#750F0F')
    };

    if (clockEl) {
        setInterval(function () {
            var now = new Date();
            var time = now.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            clockEl.textContent = 'Time: ' + time;
        }, 1000);
    }

    if (statusEl) {
        var messages = [
            'Status: Monitoring BGV funnel (demo data)',
            'Status: Client queues stable in this mock view',
            'Status: Use APIs to connect real candidate counts',
            'Status: UI only &mdash; wire backend when ready'
        ];
        var idx = 0;
        setInterval(function () {
            statusEl.innerHTML = messages[idx % messages.length];
            idx++;
        }, 5000);
    }

    function setText(el, val) {
        if (!el) return;
        el.textContent = (val === null || typeof val === 'undefined') ? '--' : String(val);
    }

    function setBar(el, value, total) {
        if (!el) return;
        var pct = 0;
        if (total > 0) pct = Math.round((value / total) * 100);
        el.style.width = String(pct) + '%';
    }

    function renderCharts(byStatus, trend) {
        if (!window.Chart) return;

        var statusKeys = Object.keys(byStatus || {});
        statusKeys.sort(function (a, b) {
            return String(a).localeCompare(String(b));
        });
        var statusVals = statusKeys.map(function (k) { return Number(byStatus[k] || 0); });

        if (chartStatusEl) {
            if (chartStatus) {
                try { chartStatus.destroy(); } catch (_e) {}
            }
            chartStatus = new Chart(chartStatusEl, {
                type: 'doughnut',
                data: {
                    labels: statusKeys,
                    datasets: [
                        {
                            data: statusVals,
                            backgroundColor: (function () {
                                var palette = [
                                    THEME.primary,
                                    THEME.danger,
                                    THEME.primary2,
                                    THEME.danger2,
                                    '#64748b',
                                    '#94a3b8',
                                    '#cbd5e1'
                                ];
                                return statusKeys.map(function (_, i) { return palette[i % palette.length]; });
                            })()
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    responsiveAnimationDuration: 0,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        var t = Array.isArray(trend) ? trend : [];
        var labels = t.map(function (r) { return String((r && r.date) ? r.date : ''); });
        var values = t.map(function (r) { return Number((r && r.count) ? r.count : 0); });

        if (chartTrendEl) {
            if (chartTrend) {
                try { chartTrend.destroy(); } catch (_e2) {}
            }
            chartTrend = new Chart(chartTrendEl, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Cases created',
                            data: values,
                            borderColor: THEME.primary,
                            backgroundColor: 'rgba(5, 125, 219, 0.12)',
                            fill: true,
                            tension: 0.3,
                            pointRadius: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    responsiveAnimationDuration: 0,
                    scales: {
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }

    function loadDashboard() {
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/client_admin/dashboard_stats.php';

        fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (payload) {
                if (!payload || payload.status !== 1 || !payload.data) {
                    if (statusEl) statusEl.textContent = 'Status: Failed to load dashboard stats.';
                    return;
                }

                var kpi = payload.data.kpi || {};
                setText(elTotal, kpi.total);
                setText(elAwaiting, kpi.awaiting);
                setText(elWip, kpi.wip);
                setText(elStop, kpi.bgv_stop);
                setText(elCompleted, kpi.completed_clear);
                setText(elUtv, kpi.unable_to_verify);
                setText(elDisc, kpi.discrepancy);
                setText(elIns, kpi.insufficient);

                var ageing = payload.data.ageing || {};
                var totalAge = (ageing['0_6'] || 0) + (ageing['7_12'] || 0) + (ageing['13_24'] || 0) + (ageing['25_plus'] || 0);
                setBar(age0_6, (ageing['0_6'] || 0), totalAge);
                setBar(age7_12, (ageing['7_12'] || 0), totalAge);
                setBar(age13_24, (ageing['13_24'] || 0), totalAge);
                setBar(age25p, (ageing['25_plus'] || 0), totalAge);

                renderCharts(payload.data.by_status || {}, payload.data.trend || []);
                if (statusEl) statusEl.textContent = 'Status: Live dashboard loaded.';
            })
            .catch(function () {
                if (statusEl) statusEl.textContent = 'Status: Network error loading stats.';
            });
    }

    loadDashboard();
});
