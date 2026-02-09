document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('clientUserCreateForm');
    var messageEl = document.getElementById('clientUserCreateMessage');
    var clientSelect = document.getElementById('clientUserClientSelect');
    var locationSelect = document.getElementById('clientUserLocationSelect');
    var formActionField = document.getElementById('clientUserFormAction');
    var saveNextBtn = document.getElementById('clientUserSaveNextBtn');
    var finalSubmitBtn = document.getElementById('clientUserFinalSubmitBtn');
    var userIdField = document.getElementById('clientUserId');
    var tabButtons = document.querySelectorAll('.tab');

    function setMessage(text, type) {
        if (!messageEl) return;
        messageEl.textContent = text || '';
        messageEl.className = type ? ('alert alert-' + type) : '';
        messageEl.style.display = text ? 'block' : 'none';
    }

    function getSelectedClientId() {
        if (!clientSelect) return 0;
        return parseInt(clientSelect.value || '0', 10) || 0;
    }

    function loadClients(selectedClientId) {
        if (!clientSelect) return Promise.resolve();

        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        return fetch(base + '/api/gssadmin/clients_dropdown.php', { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !Array.isArray(data.data)) {
                    throw new Error((data && data.message) ? data.message : 'Failed to load clients');
                }

                clientSelect.innerHTML = '<option value="0">Select Client</option>';
                data.data.forEach(function (c) {
                    if (parseInt(c.client_id || '0', 10) === 1) return;
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

    function getQueryParam(name) {
        try {
            var params = new URLSearchParams(window.location.search || '');
            return params.get(name);
        } catch (e) {
            return null;
        }
    }

    function fillForm(data) {
        if (!form || !data) return;
        Object.keys(data).forEach(function (k) {
            if (k === 'locations') return;
            var el = form.querySelector('[name="' + CSS.escape(k) + '"]');
            if (!el) return;
            el.value = (data[k] === null || typeof data[k] === 'undefined') ? '' : String(data[k]);
        });
    }

    function showTab(tabKey) {
        tabButtons.forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === tabKey);
        });

        var panels = document.querySelectorAll('.tab-panel');
        panels.forEach(function (p) {
            p.classList.toggle('active', p.id === ('tab-' + tabKey));
        });

        if (saveNextBtn && finalSubmitBtn) {
            if (tabKey === 'usertype') {
                saveNextBtn.style.display = 'none';
                finalSubmitBtn.style.display = 'inline-block';
            } else {
                saveNextBtn.style.display = 'inline-block';
                finalSubmitBtn.style.display = 'none';
            }
        }
    }

    function loadLocations(selectedClientId, selectedLocationName) {
        if (!locationSelect) return Promise.resolve();

        locationSelect.innerHTML = '<option value="">Select Location</option>';

        var cid = parseInt(selectedClientId || '0', 10) || 0;
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');

        var url = base + '/api/client_admin/client_locations_list.php';
        if (cid > 0) {
            url += '?client_id=' + encodeURIComponent(String(cid));
        }

        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || data.status !== 1 || !Array.isArray(data.data)) {
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

                if (Array.isArray(selectedLocationName) && selectedLocationName.length) {
                    var set = {};
                    selectedLocationName.forEach(function (v) { set[String(v)] = true; });
                    Array.prototype.slice.call(locationSelect.options).forEach(function (opt) {
                        opt.selected = !!set[String(opt.value)];
                    });
                } else if (selectedLocationName) {
                    Array.prototype.slice.call(locationSelect.options).forEach(function (opt) {
                        opt.selected = String(opt.value) === String(selectedLocationName);
                    });
                }
            })
            .catch(function () {
            });
    }

    function setFormAction(val) {
        if (!formActionField) return;
        formActionField.value = val;
    }

    if (!form) return;

    var userId = parseInt(getQueryParam('user_id') || '0', 10) || 0;
    var qClientId = parseInt(getQueryParam('client_id') || '0', 10) || 0;

    var storedClientId = 0;
    try {
        storedClientId = parseInt(window.localStorage.getItem('client_admin_selected_client_id') || '0', 10) || 0;
    } catch (e) {
        storedClientId = 0;
    }

    var initialClientId = qClientId > 0 ? qClientId : storedClientId;

    if (userIdField && userId > 0) {
        userIdField.value = String(userId);
    }

    showTab('personal');

    if (tabButtons && tabButtons.length) {
        tabButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var key = btn.getAttribute('data-tab');
                if (key) showTab(key);
            });
        });
    }

    loadClients(initialClientId)
        .then(function () {
            if (clientSelect) {
                clientSelect.addEventListener('change', function () {
                    try {
                        window.localStorage.setItem('client_admin_selected_client_id', String(getSelectedClientId()));
                    } catch (e) {
                    }
                    loadLocations(getSelectedClientId(), null);
                });
                return loadLocations(getSelectedClientId(), null);
            }

            return loadLocations(0, null);
        })
        .then(function () {
            if (userId > 0) {
                var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
                var url = base + '/api/client_admin/get_user.php?user_id=' + encodeURIComponent(userId);

                return fetch(url, { credentials: 'same-origin' })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (!data || data.status !== 1 || !data.data) {
                            throw new Error((data && data.message) ? data.message : 'Failed to load user');
                        }

                        if (clientSelect && data.data.client_id) {
                            clientSelect.value = String(data.data.client_id);
                            try {
                                window.localStorage.setItem('client_admin_selected_client_id', String(data.data.client_id));
                            } catch (e) {
                            }
                        }

                        fillForm(data.data);
                        return loadLocations(getSelectedClientId(), (data.data.locations && Array.isArray(data.data.locations) ? data.data.locations : (data.data.location || '')));
                    })
                    .then(function () {
                        setMessage('Edit mode: loaded from database.', 'success');
                    });
            }
        })
        .catch(function (e) {
            setMessage(e && e.message ? e.message : 'Failed to load locations.', 'danger');
        });

    if (saveNextBtn) {
        saveNextBtn.addEventListener('click', function () {
            setMessage('', '');

            var requiredFields = ['username', 'first_name', 'last_name', 'phone', 'email'];
            for (var i = 0; i < requiredFields.length; i++) {
                var f = requiredFields[i];
                var el = form.querySelector('[name="' + f + '"]');
                if (el && !el.value) {
                    setMessage('Please fill all required fields before continuing.', 'danger');
                    try { el.focus(); } catch (e) {}
                    return;
                }
            }

            showTab('usertype');
        });
    }

    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', function () {
            setFormAction('final_submit');
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        setMessage('', '');

        var fd = new FormData(form);

        var isEdit = userId > 0;
        var base = (window.APP_BASE_URL || '').replace(/\/$/, '');
        var apiUrl = isEdit ? (base + '/api/client_admin/update_user.php') : (base + '/api/client_admin/create_user.php');

        fetch(apiUrl, {
            method: 'POST',
            body: fd,
            credentials: 'same-origin'
        })
            .then(function (res) {
                return res.json().catch(function () {
                    return { status: 0, message: 'Invalid server response.' };
                });
            })
            .then(function (data) {
                var ok = data && (data.status === 1 || data.status === '1');
                if (!ok) {
                    setMessage((data && data.message) ? data.message : 'Failed to save user.', 'danger');
                    return;
                }

                if (!isEdit && data && data.data && data.data.temp_password) {
                    var msg = 'User created successfully. Temporary Password: ' + String(data.data.temp_password);
                    if (String(data.data.email_sent || '0') === '1') {
                        msg += ' (Email sent)';
                    }
                    setMessage(msg, 'success');
                } else {
                    setMessage(isEdit ? 'User updated successfully.' : 'User saved successfully.', 'success');
                }

                var action = (fd.get('form_action') || 'save').toString();
                if (action === 'final_submit' || action === 'save_next') {
                    setTimeout(function () {
                        window.location.href = 'users_list.php';
                    }, 600);
                }
            })
            .catch(function () {
                setMessage('Network error. Please try again.', 'danger');
            });
    });
});
