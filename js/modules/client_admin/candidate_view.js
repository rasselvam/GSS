(function () {
    function qs(name) {
        try {
            return new URLSearchParams(window.location.search || '').get(name);
        } catch (e) {
            return null;
        }
    }

    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function setVal(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        el.value = (value === null || typeof value === 'undefined') ? '' : String(value);
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = (value === null || typeof value === 'undefined') ? '' : String(value);
    }

    function renderTable(hostId, rows, columns) {
        var host = document.getElementById(hostId);
        if (!host) return;

        if (!Array.isArray(rows) || rows.length === 0) {
            host.innerHTML = '<div style="color:#6b7280; font-size:13px;">No data.</div>';
            return;
        }

        rows = rows.map(window.GSS_DATE.formatRowDates);

        var thead = '<tr>' + columns.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') + '</tr>';
        var tbody = rows.map(function (r) {
            return '<tr>' + columns.map(function (c) {
                var v = r ? r[c.key] : '';
                return '<td>' + esc(v) + '</td>';
            }).join('') + '</tr>';
        }).join('');

        host.innerHTML = '<div class="table-scroll"><table class="table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table></div>';
    }

    async function loadReport() {
        var applicationId = qs('application_id') || '';
        var clientId = qs('client_id') || '';

        if (!applicationId) {
            setText('cvTopMessage', 'application_id is required in URL');
            return;
        }

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/client_admin/candidate_report_get.php?application_id=' + encodeURIComponent(applicationId);
        if (clientId) url += '&client_id=' + encodeURIComponent(clientId);

        var res = await fetch(url, { credentials: 'same-origin' });
        var payload = await res.json().catch(function () { return null; });

        if (!res.ok || !payload || payload.status !== 1) {
            var msg = (payload && payload.message) ? payload.message : 'Failed to load report.';
            setText('cvTopMessage', msg);
            return;
        }

        setText('cvTopMessage', '');

        var d = payload.data || {};
        var basic = d.basic || {};
        var contact = d.contact || {};
        var ref = d.reference || {};
        var app = d.application || {};
        var cs = d.case || {};
        var auth = d.authorization || {};

        setText('cvHeaderCandidate', (cs.candidate_first_name || '') + ' ' + (cs.candidate_last_name || ''));
        setText('cvHeaderAppId', applicationId);
        setText('cvHeaderStatus', (app.status || cs.case_status || ''));

        setVal('cv_basic_first_name', basic.first_name || cs.candidate_first_name || '');
        setVal('cv_basic_last_name', basic.last_name || cs.candidate_last_name || '');
        setVal('cv_basic_dob', window.GSS_DATE.formatDbDateTime(basic.dob || ''));
        setVal('cv_basic_mobile', basic.mobile || cs.candidate_mobile || '');
        setVal('cv_basic_email', basic.email || cs.candidate_email || '');
        setVal('cv_basic_gender', basic.gender || '');
        setVal('cv_basic_father_name', basic.father_name || '');
        setVal('cv_basic_mother_name', basic.mother_name || '');
        setVal('cv_basic_country', basic.country || '');
        setVal('cv_basic_state', basic.state || '');
        setVal('cv_basic_nationality', basic.nationality || '');
        setVal('cv_basic_marital_status', basic.marital_status || '');

        setVal('cv_contact_current_address', [contact.address1, contact.address2, contact.city, contact.state, contact.country, contact.postal_code].filter(Boolean).join(', '));
        setVal('cv_contact_permanent_address', [contact.permanent_address1, contact.permanent_address2, contact.permanent_city, contact.permanent_state, contact.permanent_country, contact.permanent_postal_code].filter(Boolean).join(', '));
        setVal('cv_contact_proof_type', contact.proof_type || '');
        setVal('cv_contact_proof_file', contact.proof_file || '');

        setVal('cv_reference_name', ref.reference_name || '');
        setVal('cv_reference_designation', ref.reference_designation || '');
        setVal('cv_reference_company', ref.reference_company || '');
        setVal('cv_reference_mobile', ref.reference_mobile || '');
        setVal('cv_reference_email', ref.reference_email || '');
        setVal('cv_reference_relationship', ref.relationship || '');
        setVal('cv_reference_years_known', ref.years_known || '');

        setVal('cv_auth_signature', auth.digital_signature || '');
        setVal('cv_auth_file_name', auth.file_name || '');
        setVal('cv_auth_uploaded_at', window.GSS_DATE.formatDbDateTime(auth.uploaded_at || ''));
        setVal('cv_app_submitted_at', window.GSS_DATE.formatDbDateTime(app.submitted_at || ''));

        renderTable('cv_identification_table', d.identification || [], [
            { key: 'document_index', label: '#' },
            { key: 'documentId_type', label: 'Document Type' },
            { key: 'id_number', label: 'ID Number' },
            { key: 'name', label: 'Name on ID' },
            { key: 'upload_document', label: 'Uploaded File' }
        ]);

        renderTable('cv_education_table', d.education || [], [
            { key: 'education_index', label: '#' },
            { key: 'qualification', label: 'Qualification' },
            { key: 'college_name', label: 'College' },
            { key: 'university_board', label: 'University/Board' },
            { key: 'year_from', label: 'From' },
            { key: 'year_to', label: 'To' },
            { key: 'roll_number', label: 'Roll No' },
            { key: 'marksheet_file', label: 'Marksheet' },
            { key: 'degree_file', label: 'Degree' }
        ]);

        renderTable('cv_employment_table', d.employment || [], [
            { key: 'employment_index', label: '#' },
            { key: 'employer_name', label: 'Employer' },
            { key: 'job_title', label: 'Job Title' },
            { key: 'employee_id', label: 'Employee ID' },
            { key: 'joining_date', label: 'Joining' },
            { key: 'relieving_date', label: 'Relieving' },
            { key: 'currently_employed', label: 'Currently Employed' },
            { key: 'contact_employer', label: 'Contact Employer' },
            { key: 'employment_doc', label: 'Document' }
        ]);
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadReport().catch(function (e) {
            setText('cvTopMessage', (e && e.message) ? e.message : 'Failed to load report');
        });
    });
})();
