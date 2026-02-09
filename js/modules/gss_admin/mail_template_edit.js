document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('mtEditForm');
    var messageEl = document.getElementById('mtEditMessage');

    var idEl = document.getElementById('mt_template_id');
    var nameEl = document.getElementById('mt_template_name');
    var typeEl = document.getElementById('mt_template_type');
    var activeEl = document.getElementById('mt_is_active');
    var subjectEl = document.getElementById('mt_subject');
    var bodyEl = document.getElementById('mt_body');
    var saveBtn = document.getElementById('mtSaveBtn');

    function getQueryParam(name) {
        try {
            return new URL(window.location.href).searchParams.get(name);
        } catch (e) {
            return null;
        }
    }

    function setMessage(text, type) {
        if (!messageEl) return;
        messageEl.textContent = text || '';
        messageEl.className = type ? ('alert alert-' + type) : 'alert';
        messageEl.style.display = text ? 'block' : 'none';
    }

    function setDisabled(disabled) {
        if (saveBtn) saveBtn.disabled = !!disabled;
    }

    function loadTemplate(templateId) {
        var id = parseInt(templateId || '0', 10) || 0;
        if (id <= 0) return Promise.resolve();

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/mail_template_get.php?template_id=' + encodeURIComponent(id);

        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json().catch(function () { return null; }); })
            .then(function (data) {
                if (!data || data.status !== 1 || !data.data) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load template');
                }

                var t = data.data;
                if (idEl) idEl.value = String(t.template_id || id);
                if (nameEl) nameEl.value = t.template_name || '';
                if (typeEl) typeEl.value = t.template_type || 'email';
                if (activeEl) activeEl.value = String((t.is_active == null) ? 1 : t.is_active);
                if (subjectEl) subjectEl.value = t.subject || '';
                if (bodyEl) bodyEl.value = t.body || '';
            });
    }

    function collectPayload() {
        var payload = {};
        payload.template_id = idEl ? (parseInt(idEl.value || '0', 10) || 0) : 0;
        payload.template_name = nameEl ? String(nameEl.value || '').trim() : '';
        payload.template_type = typeEl ? String(typeEl.value || '').trim() : '';
        payload.is_active = activeEl ? (String(activeEl.value || '1') === '1' ? 1 : 0) : 1;
        payload.subject = subjectEl ? String(subjectEl.value || '') : '';
        payload.body = bodyEl ? String(bodyEl.value || '') : '';
        return payload;
    }

    function validate(payload) {
        if (!payload.template_name) {
            setMessage('Name is required.', 'danger');
            return false;
        }
        if (!payload.template_type) {
            setMessage('Type is required.', 'danger');
            return false;
        }
        if (!payload.body) {
            setMessage('Body is required.', 'danger');
            return false;
        }
        return true;
    }

    function save() {
        setMessage('', '');
        var payload = collectPayload();
        if (!validate(payload)) return;

        setDisabled(true);

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/mail_template_save.php';

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json().catch(function () { return null; }); })
            .then(function (data) {
                if (!data || data.status !== 1 || !data.data) {
                    setMessage((data && data.message) ? data.message : 'Save failed.', 'danger');
                    return;
                }

                if (idEl && (!idEl.value || idEl.value === '0')) {
                    idEl.value = String(data.data.template_id || '');
                }

                setMessage('Saved successfully.', 'success');
            })
            .catch(function () {
                setMessage('Network error. Please try again.', 'danger');
            })
            .finally(function () {
                setDisabled(false);
            });
    }

    var tid = getQueryParam('template_id');
    loadTemplate(tid)
        .catch(function (e) {
            setMessage(e && e.message ? e.message : 'Failed to load template.', 'danger');
        });

    if (saveBtn) saveBtn.addEventListener('click', save);

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            save();
        });
    }
});
