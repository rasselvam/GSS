document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('clientViewContainer');
    var messageEl = document.getElementById('clientViewMessage');

    function ensureStyles() {
        if (document.getElementById('vatiClientViewStyles')) return;
        var style = document.createElement('style');
        style.id = 'vatiClientViewStyles';
        style.textContent = [
            '#clientViewContainer{font-size:13px;}',
            '.vati-cv-grid{display:grid; grid-template-columns: 1fr; gap:14px;}',
            '@media (min-width: 980px){.vati-cv-grid{grid-template-columns: 1.2fr 0.8fr;}}',
            '.vati-cv-card{background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:14px;}',
            '.vati-cv-title{font-size:13px; font-weight:700; color:#0f172a; margin:0 0 10px 0;}',
            '.vati-cv-fields{display:grid; grid-template-columns: 1fr; gap:8px;}',
            '@media (min-width: 720px){.vati-cv-fields{grid-template-columns: 1fr 1fr;}}',
            '.vati-cv-field{border:1px solid #eef2f7; background:#f8fafc; border-radius:10px; padding:10px;}',
            '.vati-cv-label{font-size:11px; color:#64748b; margin:0 0 4px 0;}',
            '.vati-cv-value{font-size:13px; color:#0f172a; font-weight:600; margin:0; word-break:break-word;}',
            '.vati-cv-badge{display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700;}',
            '.vati-cv-badge-yes{background:#dcfce7; color:#166534;}',
            '.vati-cv-badge-no{background:#fee2e2; color:#991b1b;}',
            '.vati-cv-logo{display:flex; align-items:center; justify-content:center; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; height:140px; overflow:hidden;}',
            '.vati-cv-logo img{max-height:120px; max-width:100%; display:block;}',
            '.vati-cv-muted{color:#64748b; font-size:12px;}'
        ].join('\n');
        document.head.appendChild(style);
    }

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

    function toText(v) {
        if (v === null || typeof v === 'undefined') return '';
        return String(v);
    }

    function boolBadge(v) {
        var yes = !!v && (v === 1 || v === '1' || v === true || v === 'true');
        return '<span class="vati-cv-badge ' + (yes ? 'vati-cv-badge-yes' : 'vati-cv-badge-no') + '">' + (yes ? 'YES' : 'NO') + '</span>';
    }

    function field(label, valueHtml) {
        return (
            '<div class="vati-cv-field">' +
            '<p class="vati-cv-label">' + escapeHtml(label) + '</p>' +
            '<p class="vati-cv-value">' + (valueHtml || '<span class="vati-cv-muted">-</span>') + '</p>' +
            '</div>'
        );
    }

    function isMeaningfulText(v) {
        var s = (v === null || typeof v === 'undefined') ? '' : String(v).trim();
        if (!s) return false;
        if (s.toLowerCase() === 'none') return false;
        return true;
    }

    function isTrue(v) {
        return !!v && (v === 1 || v === '1' || v === true || v === 'true');
    }

    function card(title, innerHtml) {
        return (
            '<div class="vati-cv-card">' +
            '<p class="vati-cv-title">' + escapeHtml(title) + '</p>' +
            innerHtml +
            '</div>'
        );
    }

    function renderClient(c, verificationSummary) {
        if (!container) return;
        ensureStyles();

        var logoPath = c && c.customer_logo_path ? toText(c.customer_logo_path) : '';
        var showLogo = !!(c && (c.show_customer_logo === 1 || c.show_customer_logo === '1' || c.show_customer_logo === true));

        var basicFields = '';
        basicFields += '<div class="vati-cv-fields">';
        basicFields += field('Client ID', escapeHtml(toText(c.client_id)));
        basicFields += field('Customer Name', escapeHtml(toText(c.customer_name)));
        if (isMeaningfulText(c.short_description)) basicFields += field('Short Description', escapeHtml(toText(c.short_description)));
        if (isMeaningfulText(c.detailed_description)) basicFields += field('Detailed Description', escapeHtml(toText(c.detailed_description)));
        if (isTrue(c.show_customer_logo)) basicFields += field('Show Customer Logo', boolBadge(c.show_customer_logo));
        if (isMeaningfulText(c.delegation_mechanism)) basicFields += field('Delegation Mechanism', escapeHtml(toText(c.delegation_mechanism)));
        if (isMeaningfulText(c.save_button_instruction)) basicFields += field('Save Button Instruction', escapeHtml(toText(c.save_button_instruction)));
        if (isMeaningfulText(c.authorization_submit_instruction)) basicFields += field('Authorization Submit Instruction', escapeHtml(toText(c.authorization_submit_instruction)));
        basicFields += '</div>';

        var tatFields = '';
        tatFields += '<div class="vati-cv-fields">';
        tatFields += field('Internal TAT (days)', escapeHtml(toText(c.internal_tat)));
        tatFields += field('External TAT (days)', escapeHtml(toText(c.external_tat)));
        tatFields += field('Escalation Days', escapeHtml(toText(c.escalation_days)));
        tatFields += field('Weekend Rules', escapeHtml(toText(c.weekend_rules)));
        tatFields += '</div>';

        var advancedFields = '';
        advancedFields += '<div class="vati-cv-fields">';
        if (isTrue(c.authorization_form_required)) advancedFields += field('Authorization Form Required', boolBadge(c.authorization_form_required));
        if (isMeaningfulText(c.authorization_type) && String(c.authorization_type).toLowerCase() !== 'none') advancedFields += field('Authorization Type', escapeHtml(toText(c.authorization_type)));
        if (isTrue(c.submit_auth_before_dataentry)) advancedFields += field('Submit Auth Before Data Entry', boolBadge(c.submit_auth_before_dataentry));
        if (isTrue(c.enable_delegation_after_auth)) advancedFields += field('Enable Delegation After Auth', boolBadge(c.enable_delegation_after_auth));
        if (isTrue(c.unique_reference_required)) advancedFields += field('Unique Reference Required', boolBadge(c.unique_reference_required));
        if (isTrue(c.extra_fields_required)) advancedFields += field('Extra Fields Required', boolBadge(c.extra_fields_required));
        if (isTrue(c.candidate_mail_required)) advancedFields += field('Candidate Mail Required', boolBadge(c.candidate_mail_required));
        if (isTrue(c.reminder_mail_required)) advancedFields += field('Reminder Mail Required', boolBadge(c.reminder_mail_required));
        if (isTrue(c.insuff_reminders_required)) advancedFields += field('Insuff Reminders Required', boolBadge(c.insuff_reminders_required));
        if (isTrue(c.show_candidate_verification_status)) advancedFields += field('Show Candidate Verification Status', boolBadge(c.show_candidate_verification_status));
        if (isTrue(c.contact_support_required)) advancedFields += field('Contact Support Required', boolBadge(c.contact_support_required));
        if (isTrue(c.additional_fields_required)) advancedFields += field('Additional Fields Required', boolBadge(c.additional_fields_required));
        if (isTrue(c.basic_details_masked_required)) advancedFields += field('Basic Details Masked Required', boolBadge(c.basic_details_masked_required));
        if (isMeaningfulText(c.auto_allocation) && String(c.auto_allocation).toLowerCase() !== 'off') advancedFields += field('Auto Allocation', escapeHtml(toText(c.auto_allocation)));
        if (isMeaningfulText(c.candidate_notification) && String(c.candidate_notification).toLowerCase() !== 'off') advancedFields += field('Candidate Notification', escapeHtml(toText(c.candidate_notification)));
        advancedFields += '</div>';

        var metaFields = '';
        metaFields += '<div class="vati-cv-fields">';
        metaFields += field('Created At', escapeHtml(window.GSS_DATE.formatDbDateTime(c.created_at)));
        metaFields += field('Updated At', escapeHtml(window.GSS_DATE.formatDbDateTime(c.updated_at)));
        metaFields += '</div>';

        var left = '';
        left += card('Basic Details', basicFields);
        left += card('TAT Settings', tatFields);
        if (advancedFields.indexOf('vati-cv-field') !== -1) {
            left += card('Advanced Settings', advancedFields);
        }
        left += card('Metadata', metaFields);

        // Verification summary
        var vs = Array.isArray(verificationSummary) ? verificationSummary : [];
        var vsHtml = '';
        if (!vs.length) {
            vsHtml = '<div class="vati-cv-muted">No verification configuration found for this client.</div>';
        } else {
            vsHtml += '<div style="display:flex; flex-direction:column; gap:10px;">';
            vs.forEach(function (r) {
                var roleName = r && r.role_name ? String(r.role_name) : '';
                var stageKey = r && r.stage_key ? String(r.stage_key) : '';
                var stageLabel = stageKey === 'pre_interview' ? 'Pre-Interview' : (stageKey === 'post_interview' ? 'Post-Interview' : (stageKey === 'employee_pool' ? 'Employee Pool' : '-'));
                var steps = Array.isArray(r.steps) ? r.steps : [];

                vsHtml += '<div class="vati-cv-field" style="background:#fff;">';
                vsHtml += '<p class="vati-cv-label">Job Role</p>';
                vsHtml += '<p class="vati-cv-value">' + escapeHtml(roleName || '-') + '</p>';
                vsHtml += '<div class="vati-cv-muted" style="margin-top:6px;">Stage: <b>' + escapeHtml(stageLabel) + '</b></div>';

                if (!steps.length) {
                    vsHtml += '<div class="vati-cv-muted" style="margin-top:6px;">No steps configured.</div>';
                } else {
                    vsHtml += '<div style="margin-top:8px; overflow:auto;">';
                    vsHtml += '<table class="table" style="min-width:520px;">';
                    vsHtml += '<thead><tr><th style="width:80px;">Group</th><th>Verification</th><th style="width:140px;">Assigned</th></tr></thead><tbody>';
                    steps.forEach(function (s) {
                        var g = s && s.execution_group ? String(s.execution_group) : '1';
                        var tn = s && s.type_name ? String(s.type_name) : '';
                        var ar = s && s.assigned_role ? String(s.assigned_role) : '';
                        var arLabel = ar === 'db_verifier' ? 'DB Verifier' : (ar === 'qa' ? 'QA' : 'Verifier');
                        vsHtml += '<tr><td>' + escapeHtml(g) + '</td><td>' + escapeHtml(tn) + '</td><td>' + escapeHtml(arLabel) + '</td></tr>';
                    });
                    vsHtml += '</tbody></table>';
                    vsHtml += '<div class="vati-cv-muted" style="margin-top:6px;">Same group = parallel. Next group starts after previous group completes.</div>';
                    vsHtml += '</div>';
                }
                vsHtml += '</div>';
            });
            vsHtml += '</div>';
        }
        left += card('Verification Configuration', vsHtml);

        var right = '';
        var logoInner = '';
        if (showLogo && logoPath) {
            logoInner += '<div class="vati-cv-logo"><img src="' + escapeHtml(logoPath) + '" alt="Customer Logo"></div>';
            logoInner += '<div class="vati-cv-muted" style="margin-top:8px;">Logo Path: ' + escapeHtml(logoPath) + '</div>';
        } else if (logoPath) {
            logoInner += '<div class="vati-cv-logo"><img src="' + escapeHtml(logoPath) + '" alt="Customer Logo"></div>';
            logoInner += '<div class="vati-cv-muted" style="margin-top:8px;">Logo Path: ' + escapeHtml(logoPath) + '</div>';
            logoInner += '<div class="vati-cv-muted" style="margin-top:6px;">Note: "Show Customer Logo" is OFF.</div>';
        } else {
            logoInner += '<div class="vati-cv-logo"><span class="vati-cv-muted">No logo uploaded</span></div>';
            logoInner += '<div class="vati-cv-muted" style="margin-top:8px;">Upload a logo in Edit.</div>';
        }
        right += card('Customer Logo', logoInner);

        var sowPath = c && c.sow_pdf_path ? toText(c.sow_pdf_path) : '';
        var sowInner = '';
        if (sowPath) {
            sowInner += '<div class="vati-cv-field" style="background:#fff; border:1px dashed #cbd5e1;">' +
                '<p class="vati-cv-label">SOW Document</p>' +
                '<p class="vati-cv-value"><a href="' + escapeHtml(sowPath) + '" target="_blank" style="text-decoration:none; color:#2563eb;">Download PDF</a></p>' +
                '</div>';
            sowInner += '<div class="vati-cv-muted" style="margin-top:8px;">Path: ' + escapeHtml(sowPath) + '</div>';
        } else {
            sowInner += '<div class="vati-cv-logo" style="height:90px;"><span class="vati-cv-muted">No SOW uploaded</span></div>';
            sowInner += '<div class="vati-cv-muted" style="margin-top:8px;">Upload a PDF in Edit.</div>';
        }
        right += card('SOW (PDF)', sowInner);

        container.innerHTML = '<div class="vati-cv-grid"><div>' + left + '</div><div>' + right + '</div></div>';
    }

    if (!container) return;

    var clientId = container.getAttribute('data-client-id');
    clientId = clientId ? parseInt(clientId, 10) : 0;

    if (!clientId) {
        setMessage('client_id is missing.', 'danger');
        container.textContent = '';
        return;
    }

    var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
    Promise.all([
        fetch(base + '/api/gssadmin/get_client.php?client_id=' + encodeURIComponent(clientId), { credentials: 'same-origin' }).then(function (res) { return res.json(); }),
        fetch(base + '/api/gssadmin/client_verification_summary.php?client_id=' + encodeURIComponent(clientId), { credentials: 'same-origin' }).then(function (res) { return res.json(); })
    ])
        .then(function (results) {
            var clientRes = results[0];
            var verRes = results[1];
            if (!clientRes || clientRes.status !== 1) {
                throw new Error((clientRes && clientRes.message) ? clientRes.message : 'Failed to load client.');
            }
            var verData = (verRes && verRes.status === 1 && Array.isArray(verRes.data)) ? verRes.data : [];
            renderClient(clientRes.data || {}, verData);
        })
        .catch(function (err) {
            setMessage(err.message, 'danger');
            container.textContent = '';
        });
});
