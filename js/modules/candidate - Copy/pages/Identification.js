class IdentificationManager extends TabManager {
    constructor() {
        super(
            'identification',
            'identificationContainer',
            'identificationTemplate',
            'identificationTabs',
            'identificationCount'
        );
        this.documentTypes = {};
        this.countries = [];
        this.country = 'India';
        this.savedRows = [];
        this.isSubmitting = false; 
    }


    async init() {
        await super.init();
        console.log("✅ Identification module initialized");

        this.loadPageData();
        this.setupCountryLogic();
        this.setupFormHandlers();
        this.setupDocumentTypeHandlers();
        this.setupInsufficientDocsHandlers();
        this.loadFromLocalStorage();

        return this;
    }

   
    normalizeCountry(country) {
        const map = {
            'United States': 'USA',
            'United Kingdom': 'UK'
        };
        return map[country] || country || 'India';
    }


    getApiEndpoint() {
        return `${window.APP_BASE_URL}/api/candidate/store_identification.php`;
    }


    validateForm(isFinalSubmit) {
        let isValid = true;
        const errors = [];
        
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (!card) continue;
            
            const typeSelect = card.querySelector('[name="documentId_type[]"]');
            const idInput = card.querySelector('[name="id_number[]"]');
            const nameInput = card.querySelector('[name="name[]"]');
            const fileInput = card.querySelector('[name="upload_document[]"]');
            const oldFile = card.querySelector('[name^="old_upload_document"]');
            const insufficientCheckbox = card.querySelector('input[name="insufficient_documents[]"]');
            const isInsufficient = insufficientCheckbox && insufficientCheckbox.checked;
            
            if (isFinalSubmit) {
                // if (!typeSelect || !typeSelect.value) {
                //     errors.push(`Document ${i + 1}: Document type is required`);
                //     isValid = false;
                // }
                // if (!idInput || !idInput.value.trim()) {
                //     errors.push(`Document ${i + 1}: ID number is required`);
                //     isValid = false;
                // }
                // if (!nameInput || !nameInput.value.trim()) {
                //     errors.push(`Document ${i + 1}: Name is required`);
                //     isValid = false;
                // }
                
                // Only validate file if insufficient checkbox is NOT checked
                if (!isInsufficient) {
                    const hasNewFile = fileInput && fileInput.files && fileInput.files.length > 0;
                    const hasOldFile = oldFile && oldFile.value && oldFile.value !== '';
                    const hasInsufficientOldFile = oldFile && oldFile.value === 'INSUFFICIENT_DOCUMENTS';
                    
                    // if (!hasNewFile && !hasOldFile && !hasInsufficientOldFile) {
                    //     errors.push(`Document ${i + 1}: Document file is required`);
                    //     isValid = false;
                    // }
                }
            }
        }
        
        if (errors.length > 0) {
            alert("Please fix the following errors:\n\n" + errors.join('\n\n'));
            return false;
        }
        
        return isValid;
    }

    getTabLabel(index) {
        return `Document ${index + 1}`;
    }


    loadPageData() {
        const dataEl = document.getElementById("identificationData");
        if (!dataEl) return;

        try {
            this.documentTypes = JSON.parse(dataEl.dataset.documentTypes || '{}');
            this.countries = JSON.parse(dataEl.dataset.countries || '[]');
            this.country = this.normalizeCountry(dataEl.dataset.country);
            this.savedRows = JSON.parse(dataEl.dataset.rows || '[]');
        } catch (e) {
            console.error("❌ Failed to parse identification data", e);
            this.documentTypes = {};
            this.countries = [];
            this.savedRows = [];
        }
    }


    populateCard(card, data, index) {
        const indexInput = this.findInput(card, 'document_index[]');
        if (indexInput) indexInput.value = index + 1;

        if (data.id) {
            this.findOrCreateInput(card, `id[${index}]`, 'hidden').value = data.id;
        }

        if (data.upload_document) {
            this.findOrCreateInput(
                card,
                `old_upload_document[${index}]`,
                'hidden'
            ).value = data.upload_document;
        }

        const idNum = card.querySelector('[name="id_number[]"]');
        if (idNum) idNum.value = data.id_number || '';

        const name = card.querySelector('[name="name[]"]');
        if (name) name.value = data.name || '';

        const issue = card.querySelector('[name="issue_date[]"]');
        if (issue && data.issue_date) issue.value = data.issue_date.split(' ')[0];

        const expiry = card.querySelector('[name="expiry_date[]"]');
        if (expiry && data.expiry_date) expiry.value = data.expiry_date.split(' ')[0];

        const docTypes = this.documentTypes[this.country] || this.documentTypes['Other'] || {};
        this.updateDocumentTypeOptions(card, docTypes);

        const typeSelect = card.querySelector('[name="documentId_type[]"]');
        if (typeSelect && data.documentId_type) {
            setTimeout(() => {
                if (typeSelect.querySelector(`option[value="${data.documentId_type}"]`)) {
                    typeSelect.value = data.documentId_type;
                }
                this.updateIdNumberHint(card);
                this.updateExpiryFieldForCard(card);
                typeSelect.dispatchEvent(new Event('change'));
            }, 0);
        }

        // Populate insufficient documents checkbox
        const insufficientCheckbox = card.querySelector('input[name="insufficient_documents[]"]');
        if (insufficientCheckbox) {
            const isInsufficient = data.upload_document === 'INSUFFICIENT_DOCUMENTS' || 
                                 data.insufficient_documents == 1 || 
                                 data.insufficient_documents === true;
            
            insufficientCheckbox.checked = isInsufficient;
            
            // Update file input based on checkbox
            const documentFile = card.querySelector('input[name="upload_document[]"]');
            if (documentFile) {
                documentFile.disabled = isInsufficient;
                documentFile.required = !isInsufficient;
                if (isInsufficient) {
                    documentFile.value = '';
                }
            }
            
            console.log(`   Set insufficient_documents for card ${index}: ${isInsufficient}`);
        }

        if (data.upload_document && data.upload_document !== 'INSUFFICIENT_DOCUMENTS') {
            const baseUrl = window.APP_BASE_URL;
            const fileUrl = `${baseUrl}/uploads/identification/${data.upload_document}`;
            
            console.log(`   📄 File URL: ${fileUrl}`);
            
            this.renderPreview(
                card,
                '.identification-preview', 
                data.upload_document,
                '📄 Identification Document',
                'identification'
            );
        }
    }

    setupInsufficientDocsHandlers() {
        console.log('🔧 Setting up insufficient documents handlers');
        
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="insufficient_documents[]"]')) {
                const checkbox = e.target;
                const card = checkbox.closest('.identification-card');
                if (card) {
                    const cardIndex = card.dataset.cardIndex || 'unknown';
                    console.log(`🔘 Insufficient documents checkbox changed in card ${cardIndex}: ${checkbox.checked}`);
                    
                    const documentFile = card.querySelector('input[name="upload_document[]"]');
                    
                    if (documentFile) {
                        documentFile.disabled = checkbox.checked;
                        documentFile.required = !checkbox.checked;
                        if (checkbox.checked) {
                            documentFile.value = '';
                            console.log('📄 Cleared document file input');
                        }
                    }
                }
            }
        });
    }

    setupCountryLogic() {
        const select = document.getElementById('identificationCountry');
        const hidden = document.getElementById('identificationCountryField');
        if (!select || !hidden) return;

        const exists = [...select.options].some(o => o.value === this.country);
        this.country = exists ? this.country : 'India';

        select.value = this.country;
        hidden.value = this.country;

        this.updateAllDocumentTypeOptions(this.country);

        this.addEventListener(select, 'change', () => {
            this.country = select.value;
            hidden.value = this.country;
            this.updateAllDocumentTypeOptions(this.country);
            this.updateAllIdNumberHints();
            this.updateAllExpiryFields();
        });
    }



    updateAllDocumentTypeOptions(country) {
        const docTypes = this.documentTypes[country] || this.documentTypes['Other'] || {};
        this.cards.forEach(card => {
            if (card) this.updateDocumentTypeOptions(card, docTypes);
        });
    }

    updateDocumentTypeOptions(card, docTypes) {
        const select = card.querySelector('.document-type-select');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Document Type</option>';

        Object.entries(docTypes).forEach(([label, value]) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            select.appendChild(opt);
        });

        if (currentValue && [...select.options].some(o => o.value === currentValue)) {
            select.value = currentValue;
        }

        this.updateIdNumberHint(card);
        this.updateExpiryFieldForCard(card);
    }

    updateAllIdNumberHints() {
        this.cards.forEach(card => card && this.updateIdNumberHint(card));
    }

    updateAllExpiryFields() {
        this.cards.forEach(card => card && this.updateExpiryFieldForCard(card));
    }

    updateIdNumberHint(card) {
        const select = card.querySelector('.document-type-select');
        const hint = card.querySelector('.id-number-hint');
        if (!select || !hint) return;

        const map = {
            Aadhaar: '12-digit Aadhaar number',
            PAN: '10-character PAN (ABCDE1234F)',
            SSN: '9-digit Social Security Number',
            SIN: '9-digit Social Insurance Number',
            NIN: 'National Insurance Number',
            NRIC: 'Singapore NRIC',
            'Emirates ID': 'Emirates ID number'
        };

        hint.textContent = map[select.value] || 'Enter the document number as shown';
    }

    updateExpiryFieldForCard(card) {
        const select = card.querySelector('.document-type-select');
        const field = card.querySelector('.expiry-date-field');
        const input = card.querySelector('.expiry-date-input');
        const hint = card.querySelector('.expiry-date-hint');

        if (!select || !field || !input || !hint) return;

        const noExpiry = ['Aadhaar', 'PAN'].includes(select.value);

        if (noExpiry) {
            field.style.display = 'none';
            input.value = '';
            input.disabled = true;
            hint.textContent = 'No expiry date for this document';
        } else {
            field.style.display = 'block';
            input.disabled = false;
            hint.textContent = 'Enter expiry date if applicable';
        }
    }


    setupDocumentTypeHandlers() {
        this.addEventListener(document, 'change', (e) => {
            if (!e.target.classList.contains('document-type-select')) return;
            const card = e.target.closest('.identification-card');
            if (!card) return;
            this.updateIdNumberHint(card);
            this.updateExpiryFieldForCard(card);
        });
    }


    setupFormHandlers() {
        const form = document.getElementById('identificationForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            };
        }

        const nextBtn = document.querySelector('.external-submit-btn[data-form="identificationForm"]');
        if (nextBtn) {
            nextBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                await this.submitForm(); // Changed to async
            };
        }

        const prevBtn = document.querySelector('.prev-btn[data-form="identificationForm"]');
        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (window.Router && window.Router.navigateTo) {
                    window.Router.navigateTo('basic-details');
                }
            };
        }

        document.addEventListener('click', (e) => {
            const draftBtn = e.target.closest('.save-draft-btn[data-page="identification"]');
            if (draftBtn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.saveDraft();
            }
        });
    }

    loadFromLocalStorage() {
        const raw = localStorage.getItem('identification_draft');
        if (!raw) return;

        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.warn('⚠️ Invalid identification_draft in localStorage');
            return;
        }

        const types = data['documentId_type[]'] || [];
        const ids = data['id_number[]'] || [];
        const names = data['name[]'] || [];
        const issues = data['issue_date[]'] || [];
        const expiries = data['expiry_date[]'] || [];

        const count = Math.max(
            types.length,
            ids.length,
            names.length
        );

        if (!count) return;

        while (this.cards.length < count) {
            this.addCard(this.cards.length, null);
        }

        for (let i = 0; i < count; i++) {
            const card = this.cards[i];
            if (!card) continue;

            const row = {
                documentId_type: types[i] || '',
                id_number: ids[i] || '',
                name: names[i] || '',
                issue_date: issues[i] || '',
                expiry_date: expiries[i] || '',
                insufficient_documents: data['insufficient_documents[]']?.[i] || false
            };

            this.populateCard(card, row, i);
        }

        console.log(`📦 Loaded ${count} identification drafts from localStorage`);
    }


    async saveDraft() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
            const form = document.getElementById('identificationForm');
            if (!form) return;

            const formData = new FormData(form);
            formData.set('draft', '1');

            const response = await fetch(this.getApiEndpoint(), {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('✅ Identification Draft saved successfully!');
                localStorage.removeItem('identification_draft');
            } else {
                this.showNotification((data.message || 'Save failed'), true);
            }

        } catch (err) {
            console.error('❌ Save draft error:', err);
            this.showNotification('❌ Network / Server error', true);
        } finally {
            this.isSubmitting = false;
        }
    }

    async submitForm() {
        console.log("🚀 Starting Identification.submitForm()");
        
        // Validate form
        if (!this.validateForm(true)) {
            console.log("❌ Validation failed");
            return;
        }

        const form = document.getElementById('identificationForm');
        if (!form) {
            console.error("❌ Identification form not found");
            return;
        }
        
        const formData = new FormData(form);
        formData.append('draft', '0');

        const endpoint = this.getApiEndpoint();
        console.log(`📤 Submitting form to: ${endpoint}`);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            console.log("📥 Response status:", response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned ${response.status} (not JSON)`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log("✅ Form submitted successfully!");
                // alert('✅ Identification details saved!');
                
                // MARK THE PAGE AS COMPLETED
                if (window.Router && window.Router.markCompleted) {
                    window.Router.markCompleted('identification');
                    window.Router.updateProgress();
                }
                
                // Clear drafts
                if (window.Forms && typeof window.Forms.clearDraft === 'function') {
                    window.Forms.clearDraft('identification');
                }
                
                // Navigate to next page
                if (window.Router && window.Router.navigateTo) {
                    const nextPage = 'contact'; // Explicitly set to contact
                    console.log(`➡️ Navigating to: ${nextPage}`);
                    setTimeout(() => window.Router.navigateTo(nextPage), 500);
                }
            } else {
                alert('❌ Save failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('❌ Submit error:', err);
            alert('❌ Error: ' + err.message);
        }
    }

    showNotification(message, isError = false) {
        // Remove existing notifications
        const existingNotif = document.querySelector('.identification-notification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `identification-notification alert ${isError ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
  

    cleanup() {
        super.cleanup();
        console.log('🧹 Cleaning up IdentificationManager');
    }
}


if (typeof window !== 'undefined') {
    window.IdentificationManager = IdentificationManager;

    window.Identification = {
        onPageLoad: async () => {
            console.log('🆔 Identification.onPageLoad() called');
            
            try {
                if (!window.identificationManager) {
                    console.log('🆕 Creating new IdentificationManager instance');
                    window.identificationManager = new IdentificationManager();
                }
                
                await window.identificationManager.init();
                console.log('✅ Identification page loaded successfully');
            } catch (error) {
                console.error('❌ Error in Identification.onPageLoad:', error);
            }
        },
        
        cleanup: () => {
            console.log('🧹 Cleaning up Identification module');
            if (window.identificationManager) {
                window.identificationManager.cleanup();
                window.identificationManager = null;
            }
        }
    };
}

console.log('✅ Identification.js module loaded');