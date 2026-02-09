class BasicDetails {

    static _initialized = false;
    static _eventListeners = [];

    static init() {
        console.log("BasicDetails.init() called");
        return this;
    }

    static onPageLoad() {
        console.log(" BasicDetails.onPageLoad() called");

        this.cleanupEventListeners();
        this._initialized = true;

        this.initFormEvents();
        this.initPhotoUpload();
        this.initAliasToggle(true);

        const form = document.getElementById('basic-detailsForm');
        if (form) {
            const maritalStatus = form.querySelector('[name="marital_status"]');
            const spouseField = document.getElementById('spouseField');
            if (maritalStatus && spouseField) {
                spouseField.style.display =
                    maritalStatus.value === 'married' ? 'block' : 'none';
            }
        }

        console.log("BasicDetails initialized");
    }

    static cleanup() {
        console.log("BasicDetails.cleanup()");
        this.cleanupEventListeners();
        this._initialized = false;
    }

    static cleanupEventListeners() {
        this._eventListeners.forEach(l => {
            if (l.element && l.type && l.handler) {
                l.element.removeEventListener(l.type, l.handler);
            }
        });
        this._eventListeners = [];
    }

    static addEventListener(el, type, handler) {
        el.addEventListener(type, handler);
        this._eventListeners.push({ element: el, type, handler });
    }


    static getApiEndpoint() {
        return `${window.APP_BASE_URL}/api/candidate/store_basic-details.php`;
    }


    static initFormEvents() {
        const form = document.getElementById('basic-detailsForm');
        if (!form) {
            console.error("basic-detailsForm not found");
            return;
        }

        this.addEventListener(form, 'submit', e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });

       
        const saveDraftBtn = form.querySelector('.save-draft-btn[data-page="basic-details"]');
        if (saveDraftBtn) {
            this.addEventListener(saveDraftBtn, 'click', e => {
                e.preventDefault();
                this.saveDraft();
            });
        }

        const nextBtn = document.querySelector('.external-submit-btn[data-form="basic-detailsForm"]');
        if (nextBtn) {
            this.addEventListener(nextBtn, 'click', e => {
                e.preventDefault();
                this.submitForm();
            });
            nextBtn.type = 'button';
        }

        const maritalStatus = form.querySelector('[name="marital_status"]');
        const spouseField = document.getElementById('spouseField');

        if (maritalStatus && spouseField) {
            const toggle = () => {
                const married = maritalStatus.value === 'married';
                spouseField.style.display = married ? 'block' : 'none';
                if (!married) {
                    const input = spouseField.querySelector('[name="spouse_name"]');
                    if (input) input.value = '';
                }
            };
            toggle();
            this.addEventListener(maritalStatus, 'change', toggle);
        }

        const aliasCheckbox = document.getElementById('hasOtherName');
        if (aliasCheckbox) {
            this.initAliasToggle(true);
            this.addEventListener(aliasCheckbox, 'change', () => {
                this.initAliasToggle(false);
            });
        }
    }


    static initAliasToggle(fromRestore = false) {
        const checkbox = document.getElementById('hasOtherName');
        const field = document.getElementById('otherNameField');
        if (!checkbox || !field) return;

        const input = field.querySelector('input[name="other_name"]');
        if (!input) return;

        if (input.value.trim()) {
            checkbox.checked = true;
            field.style.display = 'block';
            return;
        }

        if (checkbox.checked) {
            field.style.display = 'block';
            if (!fromRestore) setTimeout(() => input.focus(), 100);
        } else {
            field.style.display = 'none';
            input.value = '';
        }
    }


    static validateForm(isFinal = true) {
        const form = document.getElementById('basic-detailsForm');
        if (!form) return false;

        if (!isFinal) return true;

        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        return true;
    }


    static async saveDraft() {
        if (!this.validateForm(false)) return;

        const form = document.getElementById('basic-detailsForm');
        const fd = new FormData(form);
        fd.append('save_draft', '1');

        const endpoint = this.getApiEndpoint();
        console.log("Saving draft:", endpoint);

        await this.sendRequest(endpoint, fd);
    }

   

    static async submitForm() {
        if (!this.validateForm(true)) return;

        const form = document.getElementById('basic-detailsForm');
        
        // Use router's proper form submission handling
        if (window.Router && typeof Router.handleGenericFormSubmission === 'function') {
            await Router.handleGenericFormSubmission(form, 'basic-details');
        } else {
            // Fallback to original method if router not available
            const fd = new FormData(form);
            fd.append('save_draft', '0');

            const endpoint = this.getApiEndpoint();
            console.log(" Submitting:", endpoint);

            const ok = await this.sendRequest(endpoint, fd);
            if (ok && window.Router) {
                Router.markCompleted('basic-details');
                Router.navigateTo('identification');
            }
        }
    }


    static initPhotoUpload() {
        const uploadBox = document.getElementById('photoUploadBox');
        const input = document.getElementById('photoInput');
        const preview = document.getElementById('photoPreview');
        const wrapper = document.getElementById('photoPreviewWrapper');
        const removeBtn = document.getElementById('removePhotoBtn');
        const form = document.getElementById('basic-detailsForm');

        if (!uploadBox || !input || !preview || !wrapper || !form) return;

        this.addEventListener(uploadBox, 'click', () => input.click());

        this.addEventListener(input, 'change', async e => {
            const file = e.target.files[0];
            if (!file) return;

            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                alert('Only JPG/PNG allowed');
                return;
            }

            const reader = new FileReader();
            reader.onload = ev => {
                preview.src = ev.target.result;
                uploadBox.classList.add('d-none');
                wrapper.classList.remove('d-none');
            };
            reader.readAsDataURL(file);

            const fd = new FormData();
            fd.append('photo', file);

            const endpoint = this.getApiEndpoint();
            await this.sendRequest(endpoint, fd);
        });

        if (removeBtn) {
            this.addEventListener(removeBtn, 'click', async e => {
                e.stopPropagation();
                if (!confirm('Remove photo?')) return;

                const fd = new FormData();
                fd.append('remove_photo', '1');

                const endpoint = this.getApiEndpoint();
                await this.sendRequest(endpoint, fd);

                wrapper.classList.add('d-none');
                uploadBox.classList.remove('d-none');
                preview.src = '';
                input.value = '';
            });
        }
    }


    static async sendRequest(endpoint, formData, successMsg = null) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                const text = await res.text();
                throw new Error(text.substring(0, 200));
            }

            const data = await res.json();
            console.log(" API response:", data);

            if (!data.success) {
                throw new Error(data.message || 'Server error');
            }

            if (successMsg) alert(`${successMsg}`);
            return true;

        } catch (err) {
            console.error(" API error:", err);
            alert( err.message);
            return false;
        }
    }
}


if (typeof window !== 'undefined') {
    window.BasicDetails = BasicDetails;
}
