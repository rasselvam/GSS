(function () {
    function el(id) {
        return document.getElementById(id);
    }

    function setMessage(text, type) {
        var box = el('candidateBulkMessage');
        if (!box) return;
        box.style.display = text ? 'block' : 'none';
        box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-danger');
        box.textContent = text || '';
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderResults(items) {
        var card = el('bulkResultsCard');
        var table = el('bulkResultsTable');
        if (!card || !table) return;

        var tbody = table.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        (items || []).forEach(function (r, idx) {
            var tr = document.createElement('tr');

            var inviteCell = '';
            if (r.invite_url) {
                inviteCell = '<a href="' + escapeHtml(r.invite_url) + '" target="_blank">Open</a>';
            }

            tr.innerHTML =
                '<td>' + escapeHtml(String(idx + 1)) + '</td>' +
                '<td>' + escapeHtml(r.candidate) + '</td>' +
                '<td>' + escapeHtml(r.email) + '</td>' +
                '<td>' + escapeHtml(r.status) + '</td>' +
                '<td>' + inviteCell + '</td>' +
                '<td>' + escapeHtml(r.message) + '</td>';

            tbody.appendChild(tr);
        });

        card.style.display = 'block';
    }

    async function loadClients() {
        var select = el('bulk_client_id');
        if (!select) return;

        try {
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var url = base + '/api/gssadmin/clients_dropdown.php';
            var res = await fetch(url);
            var data = await res.json().catch(function () { return null; });

            if (!res.ok || !data || data.status !== 1) {
                throw new Error((data && data.message) ? data.message : 'Failed to load clients');
            }

            select.innerHTML = '<option value="">-- Select Client --</option>';
            (data.data || []).forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = String(c.client_id);
                opt.textContent = c.customer_name;
                select.appendChild(opt);
            });
        } catch (e) {
            select.innerHTML = '<option value="">Failed to load</option>';
        }
    }

    async function uploadBulk() {
        var form = el('candidateBulkForm');
        if (!form) return;

        setMessage('', '');

        var btn = el('btnBulkUpload');
        if (btn) {
            btn.disabled = true;
            btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
            btn.textContent = 'Uploading...';
        }

        try {
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var url = base + '/api/client_admin/bulk_upload_cases.php';

            var fd = new FormData(form);

            var res = await fetch(url, { method: 'POST', body: fd });
            var data = await res.json().catch(function () { return null; });
            if (!res.ok || !data || data.status !== 1) {
                throw new Error((data && data.message) ? data.message : 'Bulk upload failed');
            }

            setMessage(data.message || 'Bulk upload completed', 'success');
            renderResults((data.data && data.data.results) ? data.data.results : []);
        } catch (e) {
            setMessage(e && e.message ? e.message : 'Bulk upload failed', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = btn.dataset.originalText || 'Upload & Send Invites';
            }
        }
    }

    function init() {
        loadClients();
        var btn = el('btnBulkUpload');
        if (btn) btn.addEventListener('click', uploadBulk);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
