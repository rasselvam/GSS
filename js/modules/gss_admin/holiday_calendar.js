document.addEventListener('DOMContentLoaded', function () {
    var msgEl = document.getElementById('holidayCalendarMessage');
    var dateEl = document.getElementById('holiday_date');
    var nameEl = document.getElementById('holiday_name');
    var addBtn = document.getElementById('holidayAddBtn');
    var tbody = document.getElementById('holidayTableBody');

    function setMessage(text, type) {
        if (!msgEl) return;
        msgEl.textContent = text || '';
        msgEl.className = type ? ('alert alert-' + type) : 'alert';
        msgEl.style.display = text ? 'block' : 'none';
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function baseUrl() {
        return (window.APP_BASE_URL || '').replace(/\/$/, '');
    }

    function fmtDate(v) {
        try {
            if (!v) return '';
            if (window.GSS_DATE && typeof window.GSS_DATE.formatDbDateTime === 'function') {
                return window.GSS_DATE.formatDbDateTime(v);
            }
            return String(v);
        } catch (e) {
            return '';
        }
    }

    function renderRows(rows) {
        if (!tbody) return;
        var html = '';
        (rows || []).slice().sort(function (a, b) {
            var ad = String(a && a.holiday_date ? a.holiday_date : '');
            var bd = String(b && b.holiday_date ? b.holiday_date : '');
            if (ad !== bd) return ad.localeCompare(bd);
            var aid = a && a.holiday_id ? (parseInt(a.holiday_id || '0', 10) || 0) : 0;
            var bid = b && b.holiday_id ? (parseInt(b.holiday_id || '0', 10) || 0) : 0;
            return aid - bid;
        }).forEach(function (r, idx) {
            var id = r && r.holiday_id ? parseInt(r.holiday_id || '0', 10) || 0 : 0;
            var d = fmtDate(r && r.holiday_date ? r.holiday_date : '');
            var n = r && r.holiday_name ? String(r.holiday_name) : '';
            var active = r && (r.is_active === 1 || r.is_active === '1' || r.is_active === true);

            html += '<tr>';
            html += '<td>' + (idx + 1) + '</td>';
            html += '<td>' + escapeHtml(d) + '</td>';
            html += '<td>' + escapeHtml(n) + '</td>';
            html += '<td>' + (active ? '<span class="badge text-bg-success">Active</span>' : '<span class="badge text-bg-secondary">Inactive</span>') + '</td>';
            html += '<td>';
            html += '<button type="button" class="btn btn-sm btn-light holidayToggleBtn" data-id="' + escapeHtml(String(id)) + '" data-active="' + (active ? '1' : '0') + '">' + (active ? 'Deactivate' : 'Activate') + '</button>';
            html += '</td>';
            html += '</tr>';
        });

        if (!html) {
            html = '<tr><td colspan="5" style="color:#64748b;">No holidays found.</td></tr>';
        }
        tbody.innerHTML = html;

        tbody.querySelectorAll('.holidayToggleBtn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = parseInt(btn.getAttribute('data-id') || '0', 10) || 0;
                if (id <= 0) return;
                var active = String(btn.getAttribute('data-active') || '0') === '1';
                if (active) {
                    deactivateHoliday(id);
                } else {
                    activateHoliday(id);
                }
            });
        });
    }

    function loadHolidays() {
        var url = baseUrl() + '/api/gssadmin/holidays_list.php';
        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !Array.isArray(data.data)) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load');
                }
                renderRows(data.data);
            })
            .catch(function (e) {
                renderRows([]);
                setMessage(e && e.message ? e.message : 'Failed to load holidays', 'danger');
            });
    }

    function addHoliday() {
        var d = dateEl ? String(dateEl.value || '').trim() : '';
        var n = nameEl ? String(nameEl.value || '').trim() : '';

        if (!d) {
            setMessage('Holiday Date is required.', 'danger');
            return;
        }
        if (!n) {
            setMessage('Holiday Name is required.', 'danger');
            return;
        }

        setMessage('Saving...', 'info');
        var url = baseUrl() + '/api/gssadmin/holiday_add.php';
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ holiday_date: d, holiday_name: n })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    throw new Error((data && data.message) ? data.message : 'Failed to save');
                }
                setMessage('Holiday added.', 'success');
                if (nameEl) nameEl.value = '';
                loadHolidays();
            })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to add holiday', 'danger');
            });
    }

    function deactivateHoliday(id) {
        setMessage('Updating...', 'info');
        var url = baseUrl() + '/api/gssadmin/holiday_deactivate.php';
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ holiday_id: id })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    throw new Error((data && data.message) ? data.message : 'Failed');
                }
                setMessage('Holiday deactivated.', 'success');
                loadHolidays();
            })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to update', 'danger');
            });
    }

    function activateHoliday(id) {
        setMessage('Updating...', 'info');
        var url = baseUrl() + '/api/gssadmin/holiday_activate.php';
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ holiday_id: id })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    throw new Error((data && data.message) ? data.message : 'Failed');
                }
                setMessage('Holiday activated.', 'success');
                loadHolidays();
            })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to update', 'danger');
            });
    }

    if (addBtn) {
        addBtn.addEventListener('click', function () {
            addHoliday();
        });
    }

    loadHolidays();
});
