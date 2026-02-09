(function () {
    function el(id) {
        return document.getElementById(id);
    }

    var saving = false;

    async function loadClientLocations() {
        var locationSelect = el('joining_location');
        if (!locationSelect) return;

        locationSelect.innerHTML = '<option value="">Loading...</option>';

        try {
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var url = base + '/api/client_admin/client_locations_list.php';

            var res = await fetch(url, { credentials: 'same-origin' });
            var data = await res.json().catch(function () { return null; });

            locationSelect.innerHTML = '<option value="">-- Select --</option>';

            if (!res.ok || !data || data.status !== 1 || !Array.isArray(data.data)) {
                return;
            }

            data.data.forEach(function (r) {
                var name = (r && r.location_name) ? String(r.location_name) : '';
                if (!name) return;
                var opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                locationSelect.appendChild(opt);
            });
        } catch (e) {
            locationSelect.innerHTML = '<option value="">-- Select --</option>';
        }
    }

    async function loadJobRoles() {
        var roleSelect = el('job_role');
        if (!roleSelect) return;

        roleSelect.innerHTML = '<option value="">Loading...</option>';

        try {
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var url = base + '/api/client_admin/job_roles_list.php';

            var res = await fetch(url, { credentials: 'same-origin' });
            var data = await res.json().catch(function () { return null; });

            roleSelect.innerHTML = '<option value="">-- Select --</option>';
            if (!res.ok || !data || data.status !== 1 || !Array.isArray(data.data)) {
                return;
            }

            data.data.forEach(function (r) {
                if (!r) return;
                if (r.is_active != null && String(r.is_active) === '0') return;

                var name = r.role_name ? String(r.role_name).trim() : '';
                var id = r.job_role_id != null ? String(r.job_role_id) : '';
                if (!name) return;

                var opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                if (id) opt.dataset.jobRoleId = id;
                roleSelect.appendChild(opt);
            });
        } catch (e) {
            roleSelect.innerHTML = '<option value="">-- Select --</option>';
        }
    }

    function setMappingPreviewHtml(html) {
        var box = el('jobRoleMappingPreview');
        if (!box) return;
        box.innerHTML = html;
    }

    async function refreshMappingPreview() {
        var roleSelect = el('job_role');
        if (!roleSelect) return;

        var opt = roleSelect.options[roleSelect.selectedIndex] || null;
        var jobRoleId = opt && opt.dataset ? (opt.dataset.jobRoleId || '') : '';

        if (!jobRoleId) {
            setMappingPreviewHtml('<div class="text-muted" style="font-size:12px;">Select a job role to view mapped verification checks.</div>');
            return;
        }

        setMappingPreviewHtml('<div class="text-muted" style="font-size:12px;">Loading mapping...</div>');

        try {
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var url = base + '/api/shared/job_role_verification_preview.php?job_role_id=' + encodeURIComponent(jobRoleId) + '&t=' + Date.now();
            var res = await fetch(url, { credentials: 'same-origin' });
            var data = await res.json().catch(function () { return null; });

            if (!res.ok || !data || data.status !== 1 || !data.data || !data.data.stages) {
                throw new Error((data && data.message) ? data.message : 'Failed to load mapping');
            }

            var stages = data.data.stages || {};
            var stageKeys = Object.keys(stages);
            if (!stageKeys.length) {
                setMappingPreviewHtml('<div class="text-muted" style="font-size:12px;">No mapping found for this job role.</div>');
                return;
            }

            var html = '';
            stageKeys.forEach(function (sk) {
                var arr = stages[sk] || [];
                if (!Array.isArray(arr) || !arr.length) return;
                html += '<div style="margin-bottom:10px;">';
                html += '<div style="font-weight:700; font-size:12px; color:#0f172a; text-transform:capitalize;">' + String(sk).replace(/_/g, ' ') + '</div>';
                html += '<div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">';
                arr.forEach(function (s) {
                    var name = s && s.type_name ? String(s.type_name) : '';
                    if (!name) return;
                    html += '<span style="font-size:12px; background:#e2e8f0; color:#0f172a; border-radius:999px; padding:4px 8px;">' + name + '</span>';
                });
                html += '</div>';
                html += '</div>';
            });

            setMappingPreviewHtml(html || '<div class="text-muted" style="font-size:12px;">No mapping found for this job role.</div>');
        } catch (e) {
            setMappingPreviewHtml('<div class="text-muted" style="font-size:12px;">Unable to load mapping.</div>');
        }
    }

    function setMessage(text, type) {
        var box = el('candidateCreateMessage');
        if (!box) return;

        box.style.display = text ? 'block' : 'none';
        box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-danger');
        box.textContent = text || '';
    }

    function formToFormData(form) {
        return new FormData(form);
    }

    async function saveCandidate() {
        if (saving) return;
        var form = document.getElementById('candidateCreateForm');
        if (!form) return;

        setMessage('', '');

        saving = true;

        var btn = el('btnCandidateSave');
        if (btn) {
            btn.disabled = true;
            btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
            btn.textContent = 'Saving...';
        }

        try {
            var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
            var createUrl = base + '/api/client_admin/create_case.php';

            var res = await fetch(createUrl, {
                method: 'POST',
                body: formToFormData(form)
            });

            var data = await res.json().catch(function () { return null; });
            if (!res.ok || !data || data.status !== 1) {
                var msg = (data && data.message) ? data.message : 'Failed to save candidate.';
                throw new Error(msg);
            }

            var caseId = data && data.data ? data.data.case_id : 0;
            if (!caseId) {
                throw new Error('Case created but case_id missing.');
            }

            var outMsg = data.message || 'Case created.';
            if (data.data && data.data.invite_url) {
                outMsg += ' Invite Link: ' + data.data.invite_url;
            }

            setMessage(outMsg, 'success');
            form.reset();
        } catch (e) {
            setMessage(e && e.message ? e.message : 'Failed to save candidate.', 'error');
        } finally {
            saving = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = btn.dataset.originalText || 'Save';
            }
        }
    }

    function init() {
        var btn = el('btnCandidateSave');
        if (btn) {
            btn.addEventListener('click', saveCandidate);
        }

        loadClientLocations();
        loadJobRoles().then(refreshMappingPreview);

        var roleSelect = el('job_role');
        if (roleSelect) {
            roleSelect.addEventListener('change', refreshMappingPreview);
        }

        var cancel = el('btnCandidateCancel');
        if (cancel) {
            cancel.addEventListener('click', function () {
                window.location.href = 'dashboard.php';
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
