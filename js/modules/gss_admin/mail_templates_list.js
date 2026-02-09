document.addEventListener('DOMContentLoaded', function () {
    var typeSelect = document.getElementById('mtTypeSelect');
    var activeSelect = document.getElementById('mtActiveSelect');
    var searchEl = document.getElementById('mtListSearch');
    var refreshBtn = document.getElementById('mtListRefreshBtn');
    var tbody = document.getElementById('mtListTbody');
    var messageEl = document.getElementById('mtListMessage');
    var pagerEl = document.getElementById('mtListPager');

    var allRows = [];
    var filteredRows = [];
    var currentPage = 1;
    var pageSize = 10;

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

    function getSelectedType() {
        return typeSelect ? String(typeSelect.value || '') : '';
    }

    function getSelectedActive() {
        return activeSelect ? String(activeSelect.value || '') : '';
    }

    function clampPage(p, totalPages) {
        var tp = totalPages || 1;
        var x = parseInt(String(p || '1'), 10) || 1;
        if (x < 1) x = 1;
        if (x > tp) x = tp;
        return x;
    }

    function getTotalPages(total, size) {
        var s = parseInt(String(size || '0'), 10) || 0;
        if (s <= 0) return 1;
        return Math.max(1, Math.ceil((total || 0) / s));
    }

    function getPagedRows(rows) {
        var r = Array.isArray(rows) ? rows : [];
        var tp = getTotalPages(r.length, pageSize);
        currentPage = clampPage(currentPage, tp);
        var start = (currentPage - 1) * pageSize;
        return r.slice(start, start + pageSize);
    }

    function renderPager() {
        if (!pagerEl) return;

        var total = Array.isArray(filteredRows) ? filteredRows.length : 0;
        var totalPages = getTotalPages(total, pageSize);
        currentPage = clampPage(currentPage, totalPages);

        if (total <= pageSize) {
            pagerEl.innerHTML = '';
            return;
        }

        var start = total === 0 ? 0 : ((currentPage - 1) * pageSize + 1);
        var end = Math.min(total, currentPage * pageSize);

        var opts = [10, 25, 50, 100];
        var sizeOptionsHtml = opts.map(function (n) {
            return '<option value="' + n + '"' + (n === pageSize ? ' selected' : '') + '>' + n + '</option>';
        }).join('');

        var maxButtons = 5;
        var half = Math.floor(maxButtons / 2);
        var btnStart = Math.max(1, currentPage - half);
        var btnEnd = Math.min(totalPages, btnStart + maxButtons - 1);
        btnStart = Math.max(1, btnEnd - maxButtons + 1);

        var pageButtons = [];
        for (var p = btnStart; p <= btnEnd; p++) {
            pageButtons.push(
                '<button type="button" class="btn" data-page="' + p + '"' + (p === currentPage ? ' disabled' : '') + '>' + p + '</button>'
            );
        }

        pagerEl.innerHTML = [
            '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">',
            '<span style="font-size:12px; color:#6b7280;">Showing ' + start + ' - ' + end + ' of ' + total + '</span>',
            '<label style="font-size:12px; color:#6b7280;">Per page</label>',
            '<select id="mtPageSize" style="font-size:12px; padding:4px 6px;">' + sizeOptionsHtml + '</select>',
            '</div>',
            '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">',
            '<button type="button" class="btn" data-page="prev"' + (currentPage <= 1 ? ' disabled' : '') + '>Prev</button>',
            pageButtons.join(''),
            '<button type="button" class="btn" data-page="next"' + (currentPage >= totalPages ? ' disabled' : '') + '>Next</button>',
            '</div>'
        ].join('');

        var sizeEl = document.getElementById('mtPageSize');
        if (sizeEl) {
            sizeEl.addEventListener('change', function () {
                pageSize = parseInt(String(sizeEl.value || '10'), 10) || 10;
                currentPage = 1;
                renderRows(getPagedRows(filteredRows));
                renderPager();
            });
        }

        pagerEl.querySelectorAll('button[data-page]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var v = btn.getAttribute('data-page');
                var tp = getTotalPages((filteredRows || []).length, pageSize);
                if (v === 'prev') currentPage = clampPage(currentPage - 1, tp);
                else if (v === 'next') currentPage = clampPage(currentPage + 1, tp);
                else currentPage = clampPage(parseInt(String(v || '1'), 10) || 1, tp);
                renderRows(getPagedRows(filteredRows));
                renderPager();
            });
        });
    }

    function renderRows(rows) {
        if (!tbody) return;
        if (!Array.isArray(rows) || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:#6b7280;">No templates found.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(function (r) {
            var id = r.template_id || 0;
            var href = 'mail_template_edit.php?template_id=' + encodeURIComponent(id);
            var type = r.template_type || '';
            var subject = r.subject || '';
            var updated = r.updated_at || r.created_at || '';
            return [
                '<tr>',
                '<td><a href="' + href + '" style="text-decoration:none; color:#2563eb;">' + escapeHtml(r.template_name || '') + '</a></td>',
                '<td>' + escapeHtml(type) + '</td>',
                '<td>' + escapeHtml(subject) + '</td>',
                '<td><span class="badge">' + ((r.is_active === 1 || r.is_active === '1') ? 'Active' : 'Inactive') + '</span></td>',
                '<td>' + escapeHtml(updated) + '</td>',
                '</tr>'
            ].join('');
        }).join('');
    }

    function loadTemplates() {
        if (!tbody) return;
        setMessage('', '');
        tbody.innerHTML = '<tr><td colspan="5" style="color:#6b7280;">Loading...</td></tr>';
        if (pagerEl) pagerEl.innerHTML = '';

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/mail_templates_list.php';
        var q = [];
        var t = getSelectedType();
        var a = getSelectedActive();
        if (t) q.push('type=' + encodeURIComponent(t));
        if (a !== '') q.push('is_active=' + encodeURIComponent(a));
        if (q.length) url += '?' + q.join('&');

        fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json().catch(function () { return null; }); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    setMessage((data && data.message) ? data.message : 'Failed to load templates.', 'danger');
                    renderRows([]);
                    return;
                }

                allRows = Array.isArray(data.data) ? data.data : [];
                var rows = allRows.slice();
                var search = searchEl ? (searchEl.value || '').trim().toLowerCase() : '';
                if (search) {
                    rows = rows.filter(function (r) {
                        return String(r.template_name || '').toLowerCase().includes(search)
                            || String(r.subject || '').toLowerCase().includes(search);
                    });
                }

                filteredRows = rows;
                currentPage = 1;
                renderRows(getPagedRows(filteredRows));
                renderPager();
            })
            .catch(function () {
                setMessage('Network error. Please try again.', 'danger');
                renderRows([]);
                if (pagerEl) pagerEl.innerHTML = '';
            });
    }

    if (typeSelect) typeSelect.addEventListener('change', loadTemplates);
    if (activeSelect) activeSelect.addEventListener('change', loadTemplates);
    if (refreshBtn) refreshBtn.addEventListener('click', loadTemplates);

    if (searchEl) {
        searchEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadTemplates();
            }
        });
    }

    loadTemplates();
});
