document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('vpEditForm');
    var messageEl = document.getElementById('vpEditMessage');
    var clientSelect = document.getElementById('vp_client_id');
    var profileIdEl = document.getElementById('vp_profile_id');

    var nameEl = document.getElementById('vp_profile_name');
    var descEl = document.getElementById('vp_description');
    var locEl = document.getElementById('vp_location');
    var activeEl = document.getElementById('vp_is_active');

    var rowsHost = document.getElementById('vpTypesRows');
    var addRowBtn = document.getElementById('vpAddTypeRow');
    var prevBtn = document.getElementById('vpPrevBtn');
    var nextBtn = document.getElementById('vpNextBtn');
    var finalBtn = document.getElementById('vpFinalSubmitBtn');

    var jobRoleNewEl = document.getElementById('vp_jobrole_new');
    var jobRoleAddBtn = document.getElementById('vp_jobrole_add_btn');
    var jobRoleAvailableEl = document.getElementById('vp_jobrole_available');
    var jobRoleSelectedEl = document.getElementById('vp_jobrole_selected');
    var moveOneToSelectedBtn = document.getElementById('vp_jobrole_move_one_to_selected');
    var moveAllToSelectedBtn = document.getElementById('vp_jobrole_move_all_to_selected');
    var moveOneToAvailableBtn = document.getElementById('vp_jobrole_move_one_to_available');
    var moveAllToAvailableBtn = document.getElementById('vp_jobrole_move_all_to_available');

    var verificationTypes = [];

    function getQueryParam(name) {
        try {
            return new URL(window.location.href).searchParams.get(name);
        } catch (e) {
            return null;
        }
    }

    var isEmbed = String(getQueryParam('embed') || '') === '1';

    function setMessage(text, type) {
        if (!messageEl) return;
        messageEl.textContent = text || '';
        messageEl.className = type ? ('alert alert-' + type) : 'alert';
        messageEl.style.display = text ? 'block' : 'none';
    }

    var tabOrder = isEmbed ? ['jobrole', 'types'] : ['basic', 'jobrole', 'types'];
    var currentTab = isEmbed ? 'jobrole' : 'basic';

    function setActiveTab(tabKey) {
        currentTab = tabKey;
        document.querySelectorAll('.tab').forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === tabKey);
        });
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
            panel.classList.toggle('active', panel.id === ('tab-' + tabKey));
        });

        var idx = tabOrder.indexOf(tabKey);
        if (prevBtn) prevBtn.style.display = idx > 0 ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = (idx >= 0 && idx < tabOrder.length - 1) ? 'inline-block' : 'none';
        if (finalBtn) finalBtn.style.display = idx === tabOrder.length - 1 ? 'inline-block' : 'none';
    }

    function validateCurrentStep() {
        var clientId = clientSelect ? parseInt(clientSelect.value || '0', 10) || 0 : 0;

        if (currentTab === 'basic') {
            if (isEmbed) return true;
            if (clientId <= 0) {
                setMessage('Please select client.', 'danger');
                return false;
            }
            if (!nameEl || !(nameEl.value || '').trim()) {
                setMessage('Scope of Work is required.', 'danger');
                return false;
            }
            if (!locEl || !(locEl.value || '').trim()) {
                setMessage('Location is required.', 'danger');
                return false;
            }
            return true;
        }

        if (currentTab === 'types') {
            if (clientId <= 0) {
                setMessage('Please select client.', 'danger');
                return false;
            }
            var comps = collectComponents();
            if (!comps || comps.length === 0) {
                setMessage('Please select at least one Verification Type.', 'danger');
                return false;
            }
            return true;
        }

        // jobrole validations can be added later
        return true;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function uniqNames(arr) {
        var map = {};
        var out = [];
        (arr || []).forEach(function (v) {
            var s = (v == null) ? '' : String(v);
            s = s.trim();
            if (!s) return;
            var key = s.toLowerCase();
            if (map[key]) return;
            map[key] = true;
            out.push(s);
        });
        return out;
    }

    function setOptions(selectEl, names, selectedName) {
        if (!selectEl) return;
        var current = selectedName != null ? String(selectedName) : '';
        selectEl.innerHTML = '<option value="">Select Location</option>';
        (names || []).forEach(function (n) {
            var opt = document.createElement('option');
            opt.value = String(n);
            opt.textContent = String(n);
            selectEl.appendChild(opt);
        });
        if (current) {
            selectEl.value = current;
        }
    }

    function loadClientLocations(clientId, selectedLocation) {
        if (!locEl) return Promise.resolve();
        var cid = parseInt(clientId || '0', 10) || 0;
        if (cid <= 0) {
            setOptions(locEl, [], selectedLocation);
            return Promise.resolve();
        }

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/client_locations_list.php?client_id=' + encodeURIComponent(cid);
        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !Array.isArray(data.data)) {
                    setOptions(locEl, [], selectedLocation);
                    return;
                }
                var names = data.data.map(function (r) {
                    return (r && r.location_name) ? String(r.location_name) : '';
                });
                names = uniqNames(names);
                setOptions(locEl, names, selectedLocation);
            })
            .catch(function () {
                setOptions(locEl, [], selectedLocation);
            });
    }

    function optionText(opt) {
        return opt ? (opt.textContent || opt.innerText || opt.value || '') : '';
    }

    function addOptionIfMissing(selectEl, text, value) {
        if (!selectEl) return;
        var t = (text == null) ? '' : String(text).trim();
        if (!t) return;
        var val = (value == null || value === '') ? t : String(value);
        var exists = false;
        Array.prototype.slice.call(selectEl.options || []).forEach(function (o) {
            var ov = (o.value || '').toLowerCase();
            var ot = (optionText(o) || '').toLowerCase();
            if (ov === val.toLowerCase() || ot === t.toLowerCase()) exists = true;
        });
        if (exists) return;
        var opt = document.createElement('option');
        opt.value = val;
        opt.textContent = t;
        selectEl.appendChild(opt);
    }

    function moveSelected(fromSel, toSel) {
        if (!fromSel || !toSel) return;
        var selected = Array.prototype.slice.call(fromSel.selectedOptions || []);
        selected.forEach(function (opt) {
            var t = optionText(opt).trim();
            var v = (opt.value || '').trim() || t;
            addOptionIfMissing(toSel, t, v);
        });
        selected.forEach(function (opt) {
            try { fromSel.removeChild(opt); } catch (e) { }
        });
    }

    function moveAll(fromSel, toSel) {
        if (!fromSel || !toSel) return;
        var all = Array.prototype.slice.call(fromSel.options || []);
        all.forEach(function (opt) {
            var t = optionText(opt).trim();
            var v = (opt.value || '').trim() || t;
            addOptionIfMissing(toSel, t, v);
        });
        fromSel.innerHTML = '';
    }

    function collectSelectedJobRoles() {
        if (!jobRoleSelectedEl) return [];
        var out = [];
        Array.prototype.slice.call(jobRoleSelectedEl.options || []).forEach(function (opt) {
            var t = optionText(opt).trim();
            if (!t) return;
            out.push({
                job_role_id: opt.value ? (parseInt(opt.value || '0', 10) || 0) : 0,
                role_name: t
            });
        });
        return out;
    }

    function setJobRolesUI(available, selected) {
        if (jobRoleAvailableEl) jobRoleAvailableEl.innerHTML = '';
        if (jobRoleSelectedEl) jobRoleSelectedEl.innerHTML = '';

        var selectedIds = {};
        (selected || []).forEach(function (r) {
            var id = r && r.job_role_id ? parseInt(r.job_role_id || '0', 10) || 0 : 0;
            if (id > 0) selectedIds[String(id)] = true;
        });

        (available || []).forEach(function (r) {
            var id = r && r.job_role_id ? parseInt(r.job_role_id || '0', 10) || 0 : 0;
            var name = r && r.role_name ? String(r.role_name) : '';
            if (!name) return;
            if (id > 0 && selectedIds[String(id)]) return;
            addOptionIfMissing(jobRoleAvailableEl, name, id > 0 ? String(id) : name);
        });

        (selected || []).forEach(function (r) {
            var id2 = r && r.job_role_id ? parseInt(r.job_role_id || '0', 10) || 0 : 0;
            var name2 = r && r.role_name ? String(r.role_name) : '';
            if (!name2) return;
            addOptionIfMissing(jobRoleSelectedEl, name2, id2 > 0 ? String(id2) : name2);
        });
    }

    function getQueryInt(key) {
        var url = new URL(window.location.href);
        var v = parseInt(url.searchParams.get(key) || '0', 10) || 0;
        return v;
    }

    function ensureEmbeddedDefaults() {
        if (!isEmbed) return;
        if (nameEl && !(nameEl.value || '').trim()) {
            nameEl.value = 'Default Verification Profile';
        }
        if (activeEl && !(activeEl.value || '').trim()) {
            activeEl.value = '1';
        }
    }

    function loadClients(selectedClientId) {
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        return fetch(base + '/api/gssadmin/clients_dropdown.php', { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !Array.isArray(data.data)) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load clients');
                }

                if (!clientSelect) return;
                clientSelect.innerHTML = '<option value="">Select Client</option>';

                data.data.forEach(function (c) {
                    var opt = document.createElement('option');
                    opt.value = String(c.client_id || '');
                    opt.textContent = c.customer_name || ('Client #' + c.client_id);
                    clientSelect.appendChild(opt);
                });

                if (selectedClientId && selectedClientId > 0) {
                    clientSelect.value = String(selectedClientId);
                }
            });
    }

    function loadVerificationTypes(clientId) {
        verificationTypes = [];
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/verification_types_list.php?client_id=' + encodeURIComponent(clientId);
        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !Array.isArray(data.data)) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load verification types');
                }
                verificationTypes = data.data;

                if (!verificationTypes || verificationTypes.length === 0) {
                    setMessage('No verification types configured for this client. Please add types in DB and map them to the client.', 'warning');
                }
            });
    }

    function makeRow(index, value) {
        var row = document.createElement('div');
        row.className = 'card';
        row.style.marginTop = '10px';
        row.style.padding = '12px';

        var title = document.createElement('div');
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.justifyContent = 'space-between';
        title.style.marginBottom = '10px';
        title.innerHTML = '<strong>Verification Type ' + escapeHtml(index) + '</strong>';

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', function () {
            if (rowsHost) rowsHost.removeChild(row);
            renumberRows();
        });

        title.appendChild(removeBtn);
        row.appendChild(title);

        var grid = document.createElement('div');
        grid.className = 'form-grid';

        var typeOptions = ['<option value="">Select</option>'];
        verificationTypes.forEach(function (t) {
            typeOptions.push('<option value="' + escapeHtml(t.verification_type_id) + '">' + escapeHtml(t.type_name) + '</option>');
        });

        grid.innerHTML = [
            '<div class="form-control">',
            '<label>Verification Type *</label>',
            '<select class="vp_type" required>' + typeOptions.join('') + '</select>',
            '</div>',

            '<div class="form-control">',
            '<label>Cost (INR)</label>',
            '<input class="vp_cost" type="number" step="0.01" value="">',
            '</div>'
        ].join('');

        row.appendChild(grid);

        // Fill values
        if (value) {
            var typeEl = row.querySelector('.vp_type');
            if (typeEl && value.verification_type_id) typeEl.value = String(value.verification_type_id);
            var c4 = row.querySelector('.vp_cost');
            if (c4 && value.cost_inr != null) c4.value = String(value.cost_inr);
        }

        return row;
    }

    function renumberRows() {
        if (!rowsHost) return;
        var cards = rowsHost.querySelectorAll('.card');
        cards.forEach(function (c, idx) {
            var strong = c.querySelector('strong');
            if (strong) strong.textContent = 'Verification Type ' + String(idx + 1);
        });
    }

    function ensureDefaultRows() {
        if (!rowsHost) return;
        rowsHost.innerHTML = '';
        for (var i = 1; i <= 5; i++) {
            rowsHost.appendChild(makeRow(i));
        }
    }

    function collectComponents() {
        if (!rowsHost) return [];
        var cards = rowsHost.querySelectorAll('.card');
        var out = [];
        cards.forEach(function (c, idx) {
            var typeEl = c.querySelector('.vp_type');
            var vtId = typeEl ? parseInt(typeEl.value || '0', 10) || 0 : 0;
            if (vtId <= 0) return;

            out.push({
                sort_order: idx + 1,
                verification_type_id: vtId,
                cost_inr: (c.querySelector('.vp_cost') || {}).value || ''
            });
        });
        return out;
    }

    function findTypeMeta(typeId) {
        var id = parseInt(typeId || '0', 10) || 0;
        if (!verificationTypes || verificationTypes.length === 0) return null;
        for (var i = 0; i < verificationTypes.length; i++) {
            var t = verificationTypes[i];
            if ((t && parseInt(t.verification_type_id || '0', 10) || 0) === id) return t;
        }
        return null;
    }

    function saveProfile() {
        if (!form) return;

        var clientId = clientSelect ? parseInt(clientSelect.value || '0', 10) || 0 : 0;
        if (clientId <= 0) {
            setMessage('Please select client.', 'danger');
            return;
        }

        var payload = {
            profile_id: profileIdEl ? parseInt(profileIdEl.value || '0', 10) || 0 : 0,
            client_id: clientId,
            profile_name: nameEl ? (nameEl.value || '').trim() : '',
            description: descEl ? (descEl.value || '').trim() : '',
            location: locEl ? (locEl.value || '').trim() : '',
            is_active: activeEl ? (activeEl.value || '1') : '1',
            components: collectComponents(),
            job_roles: collectSelectedJobRoles()
        };

        if (!payload.profile_name) {
            setMessage('Scope of Work is required.', 'danger');
            return;
        }
        if (!payload.location) {
            setMessage('Location is required.', 'danger');
            return;
        }

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/verification_profile_save.php';

        setMessage('Saving...', 'info');
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'same-origin'
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1) {
                    throw new Error((data && data.message) ? data.message : 'Failed to save');
                }

                var pid = data.data && data.data.profile_id ? data.data.profile_id : 0;
                if (profileIdEl && pid) profileIdEl.value = String(pid);

                var url2 = new URL(window.location.href);
                if (pid) url2.searchParams.set('profile_id', String(pid));
                url2.searchParams.set('client_id', String(clientId));
                window.history.replaceState({}, '', url2.toString());

                setMessage('Saved successfully.', 'success');
            })
            .catch(function (e) {
                setMessage(e && e.message ? e.message : 'Failed to save.', 'danger');
            });
    }

    function loadProfile(profileId) {
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var url = base + '/api/gssadmin/verification_profile_get.php?profile_id=' + encodeURIComponent(profileId);
        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !data.data || !data.data.profile) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load profile');
                }

                var p = data.data.profile;
                if (profileIdEl) profileIdEl.value = String(p.profile_id || '');
                if (clientSelect) clientSelect.value = String(p.client_id || '');
                if (nameEl) nameEl.value = p.profile_name || '';
                if (descEl) descEl.value = p.description || '';
                if (locEl) {
                    // Ensure dropdown options are loaded before selecting saved value
                    loadClientLocations(p.client_id || 0, p.location || '');
                }
                if (activeEl) activeEl.value = String(p.is_active || '1');

                if (data.data && data.data.job_roles) {
                    setJobRolesUI(data.data.job_roles.available || [], data.data.job_roles.selected || []);
                }

                return Array.isArray(data.data.components) ? data.data.components : [];
            });
    }

    function initTabs() {
        var tabs = document.querySelectorAll('.tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = this.getAttribute('data-tab');
                if (!target) return;
                setActiveTab(target);
            });
        });
    }

    function applyEmbedUi() {
        if (!isEmbed) return;

        // Hide basic tab button + panel
        document.querySelectorAll('.tab').forEach(function (t) {
            if (t.getAttribute('data-tab') === 'basic') {
                t.style.display = 'none';
            }
        });
        var basicPanel = document.getElementById('tab-basic');
        if (basicPanel) basicPanel.style.display = 'none';

        // Hide client selector row (client comes from query param)
        if (clientSelect) {
            clientSelect.disabled = true;
            try {
                var fc = clientSelect.closest('.form-control');
                if (fc) fc.style.display = 'none';
            } catch (e) {
            }
        }
    }

    if (addRowBtn) {
        addRowBtn.addEventListener('click', function () {
            if (!rowsHost) return;
            rowsHost.appendChild(makeRow((rowsHost.querySelectorAll('.card').length || 0) + 1));
            renumberRows();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            var idx = tabOrder.indexOf(currentTab);
            if (idx <= 0) return;
            setMessage('', '');
            setActiveTab(tabOrder[idx - 1]);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            var idx = tabOrder.indexOf(currentTab);
            if (idx < 0 || idx >= tabOrder.length - 1) return;
            if (!validateCurrentStep()) return;
            setMessage('', '');
            setActiveTab(tabOrder[idx + 1]);
        });
    }

    if (finalBtn) {
        finalBtn.addEventListener('click', function () {
            // Validate all earlier required steps
            var prev = currentTab;
            currentTab = 'basic';
            if (!validateCurrentStep()) {
                setActiveTab('basic');
                return;
            }
            currentTab = 'types';
            if (!validateCurrentStep()) {
                setActiveTab('types');
                return;
            }
            currentTab = prev;
            saveProfile();
        });
    }

    if (clientSelect) {
        clientSelect.addEventListener('change', function () {
            var cid = parseInt(clientSelect.value || '0', 10) || 0;
            if (cid <= 0) return;

            loadClientLocations(cid, (locEl && locEl.value) ? locEl.value : '');

            loadVerificationTypes(cid)
                .then(function () {
                    ensureDefaultRows();
                })
                .catch(function (e) {
                    setMessage(e && e.message ? e.message : 'Failed to load verification types', 'danger');
                });
        });
    }

    if (jobRoleAddBtn) {
        jobRoleAddBtn.addEventListener('click', function () {
            var v = jobRoleNewEl ? (jobRoleNewEl.value || '').trim() : '';
            if (!v) return;
            addOptionIfMissing(jobRoleAvailableEl, v, v);
            if (jobRoleNewEl) jobRoleNewEl.value = '';
        });
    }

    if (moveOneToSelectedBtn) {
        moveOneToSelectedBtn.addEventListener('click', function () {
            moveSelected(jobRoleAvailableEl, jobRoleSelectedEl);
        });
    }
    if (moveAllToSelectedBtn) {
        moveAllToSelectedBtn.addEventListener('click', function () {
            moveAll(jobRoleAvailableEl, jobRoleSelectedEl);
        });
    }
    if (moveOneToAvailableBtn) {
        moveOneToAvailableBtn.addEventListener('click', function () {
            moveSelected(jobRoleSelectedEl, jobRoleAvailableEl);
        });
    }
    if (moveAllToAvailableBtn) {
        moveAllToAvailableBtn.addEventListener('click', function () {
            moveAll(jobRoleSelectedEl, jobRoleAvailableEl);
        });
    }

    if (!form) return;

    applyEmbedUi();
    initTabs();
    setActiveTab(isEmbed ? 'jobrole' : 'basic');

    var qClientId = getQueryInt('client_id');
    var qProfileId = getQueryInt('profile_id');

    loadClients(qClientId)
        .then(function () {
            var cid = parseInt(clientSelect && clientSelect.value ? clientSelect.value : '0', 10) || 0;
            if (cid <= 0) return;

            ensureEmbeddedDefaults();
            loadClientLocations(cid, (locEl && locEl.value) ? locEl.value : '');

            return loadVerificationTypes(cid)
                .then(function () {
                    // In embed mode, auto-pick first available location if none selected (required by API)
                    if (isEmbed && locEl && !(locEl.value || '').trim()) {
                        try {
                            var opt = locEl.querySelector('option[value]:not([value=""])');
                            if (opt) locEl.value = opt.value;
                        } catch (e) {
                        }
                    }

                    if (qProfileId > 0) {
                        return loadProfile(qProfileId)
                            .then(function (components) {
                                if (!rowsHost) return;
                                rowsHost.innerHTML = '';
                                if (!components || components.length === 0) {
                                    ensureDefaultRows();
                                    return;
                                }
                                components.forEach(function (c, idx) {
                                    rowsHost.appendChild(makeRow(idx + 1, c));
                                });
                                renumberRows();
                            });
                    }

                    ensureDefaultRows();
                });
        })
        .catch(function (e) {
            setMessage(e && e.message ? e.message : 'Failed to initialize.', 'danger');
        });
});
