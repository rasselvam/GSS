document.addEventListener('DOMContentLoaded', function () {
    var shell = document.getElementById('qaCaseReviewShell');
    var frame = document.getElementById('qaReportFrame');
    var msgEl = document.getElementById('qaCaseMessage');

    var sectionEl = document.getElementById('qaCommentSection');
    var commentEl = document.getElementById('qaCommentText');
    var addBtn = document.getElementById('qaCommentAddBtn');

    var btnApprove = document.getElementById('qaActionApprove');
    var btnHold = document.getElementById('qaActionHold');
    var btnReject = document.getElementById('qaActionReject');
    var btnStop = document.getElementById('qaActionStop');

    var timelineEl = document.getElementById('qaTimeline');
    var refreshBtn = document.getElementById('qaTimelineRefresh');
    var emptyEl = document.getElementById('qaReportEmpty');
    var openReportLink = document.getElementById('qaOpenReport');

    function setMessage(text, type) {
        if (!msgEl) return;
        msgEl.textContent = text || '';
        msgEl.className = type ? ('alert alert-' + type) : '';
        msgEl.style.display = text ? 'block' : 'none';
    }

    function loadReportIntoFrame() {
        var appId = getAppId();
        if (!appId) {
            if (emptyEl) emptyEl.style.display = 'block';
            if (frame) frame.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (frame) {
            frame.style.display = 'block';
            frame.src = buildReportUrl();
        }

        if (openReportLink) {
            openReportLink.href = buildReportFullUrl();
            if (!openReportLink.dataset.auditBound) {
                openReportLink.dataset.auditBound = '1';
                openReportLink.addEventListener('click', function () {
                    audit('open', { source: 'qa_case_review' });
                });
            }
        }

        audit('view', { source: 'qa_case_review', embed: 1 });
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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

    function pad2(n) {
        n = parseInt(n, 10);
        if (!isFinite(n)) n = 0;
        return (n < 10 ? '0' : '') + n;
    }

    function dayKey(dt) {
        return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
    }

    function dayLabel(dt) {
        var now = new Date();
        var todayKey = dayKey(now);
        var dKey = dayKey(dt);
        var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        var yKey = dayKey(y);
        if (dKey === todayKey) return 'Today';
        if (dKey === yKey) return 'Yesterday';
        return pad2(dt.getDate()) + '-' + pad2(dt.getMonth() + 1) + '-' + dt.getFullYear();
    }

    function timeLabel(dt) {
        return pad2(dt.getHours()) + ':' + pad2(dt.getMinutes());
    }

    function kindOf(it) {
        var t = (it && it.event_type) ? String(it.event_type).toLowerCase() : '';
        if (t === 'comment') return 'comment';
        if (t === 'action') return 'action';
        if (t === 'update') return 'update';
        return 'system';
    }

    function fmtDate(d) {
        if (!d) return '-';
        try {
            if (window.GSS_DATE && typeof window.GSS_DATE.formatDbDateTime === 'function') {
                return window.GSS_DATE.formatDbDateTime(d);
            }
        } catch (e) {
        }
        return String(d);
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

    function pad2(n) {
        n = parseInt(n, 10);
        if (!isFinite(n)) n = 0;
        return (n < 10 ? '0' : '') + n;
    }

    function dayKey(dt) {
        return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
    }

    function dayLabel(dt) {
        var now = new Date();
        var todayKey = dayKey(now);
        var dKey = dayKey(dt);
        var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        var yKey = dayKey(y);
        if (dKey === todayKey) return 'Today';
        if (dKey === yKey) return 'Yesterday';
        return pad2(dt.getDate()) + '-' + pad2(dt.getMonth() + 1) + '-' + dt.getFullYear();
    }

    function timeLabel(dt) {
        return pad2(dt.getHours()) + ':' + pad2(dt.getMinutes());
    }

    function kindOf(it) {
        var t = (it && it.event_type) ? String(it.event_type).toLowerCase() : '';
        if (t === 'comment') return 'comment';
        if (t === 'action') return 'action';
        if (t === 'update') return 'update';
        return 'system';
    }

    function getVal(el, def) {
        if (!el) return def;
        return String(el.value || def);
    }

    function getAppId() {
        return shell ? (shell.getAttribute('data-application-id') || '') : '';
    }

    function setDisabled(disabled) {
        var els = [addBtn, sectionEl, commentEl, btnApprove, btnHold, btnReject, btnStop, refreshBtn];
        els.forEach(function (el) {
            if (!el) return;
            try {
                el.disabled = !!disabled;
            } catch (e) {
            }
        });
    }

    function getClientId() {
        var v = shell ? (shell.getAttribute('data-client-id') || '') : '';
        return parseInt(v, 10) || 0;
    }

    function buildReportUrl() {
        var appId = getAppId();
        var cid = getClientId();
        var href = '../shared/candidate_report.php?role=qa&embed=1&application_id=' + encodeURIComponent(appId);
        if (cid > 0) {
            href += '&client_id=' + encodeURIComponent(String(cid));
        }
        return href;
    }

    function buildReportFullUrl() {
        var appId = getAppId();
        var cid = getClientId();
        var href = '../shared/candidate_report.php?role=qa&application_id=' + encodeURIComponent(appId);
        if (cid > 0) href += '&client_id=' + encodeURIComponent(String(cid));
        return href;
    }

    function audit(event, meta) {
        var appId = getAppId();
        if (!appId) return;
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        fetch(base + '/api/qa/report_audit.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ application_id: appId, event: event, meta: meta || null })
        }).catch(function () {
        });
    }

    function renderTimeline(items) {
        if (!timelineEl) return;
        if (items === null) {
            timelineEl.innerHTML = '<div style="color:#64748b; font-size:13px;">Loading timeline...</div>';
            return;
        }
        if (!items || !items.length) {
            timelineEl.innerHTML = '<div style="color:#64748b; font-size:13px;">No timeline yet. Add a comment or take an action.</div>';
            return;
        }

        var groups = {};
        var order = [];

        items.forEach(function (it) {
            var dt = safeDate(it && it.created_at ? it.created_at : null);
            var k = dt ? dayKey(dt) : 'unknown';
            if (!groups[k]) {
                groups[k] = [];
                order.push(k);
            }
            groups[k].push({ it: it, dt: dt });
        });

        timelineEl.innerHTML = order.map(function (k) {
            var list = groups[k] || [];
            var label = 'Unknown date';
            if (k !== 'unknown' && list[0] && list[0].dt) label = dayLabel(list[0].dt);

            var header = '<div class="qa-tl-group"><div class="qa-tl-date">' + escapeHtml(label) + '</div><div class="qa-tl-line"></div></div>';

            var cards = list.map(function (row) {
                var it = row.it || {};
                var dt = row.dt;

                var name = '';
                if (it && (it.first_name || it.last_name)) {
                    name = (String(it.first_name || '') + ' ' + String(it.last_name || '')).trim();
                }
                if (!name && it && it.username) name = String(it.username);
                if (!name) name = it && it.actor_role ? String(it.actor_role) : 'System';

                var role = it && it.actor_role ? String(it.actor_role) : '';
                var section = it && it.section_key ? String(it.section_key) : '';
                var typeRaw = it && it.event_type ? String(it.event_type) : 'update';
                var type = typeRaw.toUpperCase();
                var msg = it && it.message ? String(it.message) : '';
                var kind = kindOf(it);

                var when = dt ? (timeLabel(dt)) : escapeHtml(fmtDate(it.created_at));

                var badges = [];
                var cls = (kind === 'comment') ? 'primary' : (kind === 'action') ? 'success' : (kind === 'update') ? 'warn' : '';
                badges.push('<span class="qa-tl-badge ' + cls + '">' + escapeHtml(type) + '</span>');
                if (section) badges.push('<span class="qa-tl-badge">' + escapeHtml(section) + '</span>');
                if (role) badges.push('<span class="qa-tl-badge">' + escapeHtml(role) + '</span>');

                return '<div class="qa-tl-item" data-kind="' + escapeHtml(kind) + '">' +
                    '<div class="qa-tl-top">' +
                        '<div class="qa-tl-who">' + escapeHtml(name) + '</div>' +
                        '<div class="qa-tl-when">' + escapeHtml(when) + '</div>' +
                    '</div>' +
                    '<div class="qa-tl-badges">' + badges.join('') + '</div>' +
                    (msg ? ('<div class="qa-tl-msg">' + escapeHtml(msg) + '</div>') : '') +
                '</div>';
            }).join('');

            return header + cards;
        }).join('');
    }

    function loadTimeline() {
        var appId = getAppId();
        if (!appId) {
            renderTimeline([]);
            return;
        }

        renderTimeline(null);

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        fetch(base + '/api/shared/case_timeline_list.php?application_id=' + encodeURIComponent(appId), { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load timeline');
                }
                renderTimeline(data.data || []);
            })
            .catch(function (e) {
                setMessage('Timeline error: ' + e.message, 'danger');
                renderTimeline([]);
            });
    }

    function addComment() {
        var appId = getAppId();
        if (!appId) {
            setMessage('application_id missing.', 'danger');
            return;
        }

        var text = commentEl ? String(commentEl.value || '').trim() : '';
        if (!text) {
            setMessage('Please enter comment.', 'warning');
            return;
        }

        var payload = {
            application_id: appId,
            event_type: 'comment',
            section_key: getVal(sectionEl, 'general'),
            message: text
        };

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        fetch(base + '/api/shared/case_timeline_add.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    throw new Error((data && data.message) ? data.message : 'Failed to add comment');
                }
                if (commentEl) commentEl.value = '';
                setMessage('Comment added.', 'success');
                loadTimeline();
            })
            .catch(function (e) {
                setMessage(e.message, 'danger');
            });
    }

    function takeAction(action) {
        var appId = getAppId();
        if (!appId) {
            setMessage('application_id missing.', 'danger');
            return;
        }

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        fetch(base + '/api/shared/case_action.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ application_id: appId, action: action })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    throw new Error((data && data.message) ? data.message : 'Action failed');
                }
                setMessage('Action updated: ' + (data.data && data.data.case_status ? data.data.case_status : 'OK'), 'success');
                loadTimeline();
            })
            .catch(function (e) {
                setMessage(e.message, 'danger');
            });
    }

    if (frame) {
        var appId = getAppId();
        if (!appId) {
            if (emptyEl) emptyEl.style.display = 'block';
            frame.style.display = 'none';
            setDisabled(true);
            setMessage('Please open a case from Review List.', 'warning');
        } else {
            if (emptyEl) emptyEl.style.display = 'none';
            frame.style.display = 'block';
            setDisabled(false);
            loadReportIntoFrame();
        }
    }

    if (addBtn) addBtn.addEventListener('click', addComment);
    if (commentEl) {
        commentEl.addEventListener('keydown', function (e) {
            if (e && e.key === 'Enter') {
                e.preventDefault();
                addComment();
            }
        });
    }

    if (refreshBtn) refreshBtn.addEventListener('click', loadTimeline);

    if (btnApprove) btnApprove.addEventListener('click', function () { takeAction('approve'); });
    if (btnHold) btnHold.addEventListener('click', function () { takeAction('hold'); });
    if (btnReject) btnReject.addEventListener('click', function () { takeAction('reject'); });
    if (btnStop) btnStop.addEventListener('click', function () { takeAction('stop_bgv'); });

    if (getAppId()) {
        loadTimeline();
    } else {
        renderTimeline([]);
    }
});
