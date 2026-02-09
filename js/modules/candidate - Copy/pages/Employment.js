class EmploymentManager extends TabManager {
    constructor() {
        super(
            'employment',
            'employmentContainer',
            'employmentTemplate',
            'employmentTabs',
            'employmentCount'
        );

        this.savedRows = [];
        this.isSubmitting = false;
        this.isFresher = false;
        this.currentlyEmployed = 'no';
        this.contactEmployer = 'no'; 
    }

    async init() {
        console.log('💼 EmploymentManager.init() called');
        this.loadPageData();
        await super.init();
        this.setupFormHandlers();
        this.setupFileHandlers();
        this.setupInsufficientDocsHandlers();
        this.loadFromLocalStorage();
        this.setupRadioHandlers();
        this.applyFresherUI(this.isFresher);

        console.log('✅ Employment module initialized successfully');
        console.log(`📊 Cards loaded: ${this.cards.length}, Data rows: ${this.savedRows.length}, Fresher: ${this.isFresher}, Currently Employed: ${this.currentlyEmployed}, Contact Employer: ${this.contactEmployer}`);

        return this;
    }

    getApiEndpoint() {
        return `${window.APP_BASE_URL}/api/candidate/store_employment.php`;
    }

    getTabLabel(index) {
        return `Employer ${index + 1}`;
    }

    loadPageData() {
        const el = document.getElementById('employmentData');
        if (!el) {
            console.warn('⚠️ Employment data element not found');
            this.savedRows = [];
            this.isFresher = false;
            this.currentlyEmployed = 'no';
            this.contactEmployer = 'no';
            return;
        }

        try {
            this.savedRows = JSON.parse(el.dataset.rows || '[]');
            this.isFresher = el.dataset.isFresher === 'true';
            if (this.savedRows.length > 0 && this.savedRows[0]) {
                this.currentlyEmployed = this.savedRows[0].currently_employed || 'no';
                this.contactEmployer = this.savedRows[0].contact_employer || 'no';
            }
            
            console.log(`📥 Loaded ${this.savedRows.length} employment records, Fresher: ${this.isFresher}, Currently Employed: ${this.currentlyEmployed}, Contact Employer: ${this.contactEmployer}`);
        } catch (e) {
            console.error('❌ Failed to parse employment data', e);
            this.savedRows = [];
            this.isFresher = false;
            this.currentlyEmployed = 'no';
            this.contactEmployer = 'no';
        }
    }
    
    populateCard(card, data = {}, index) {
        console.log(` EmploymentManager.populateCard() for card ${index}`, data);
        const idx = this.findInput(card, 'employment_index[]');
        if (idx) idx.value = index + 1;
        
        if (data.id) {
            this.findOrCreateInput(card, `id[${index}]`, 'hidden').value = data.id;
            console.log(`   Set record ID: ${data.id}`);
        }

        const employmentDoc = data.employment_doc || data.employment_doc_path;
        if (employmentDoc && employmentDoc !== 'INSUFFICIENT_DOCUMENTS') {
            let fileName = employmentDoc;
            if (fileName.includes('uploads/employment/')) {
                fileName = fileName.split('uploads/employment/').pop();
            } else if (fileName.includes('/')) {
                fileName = fileName.split('/').pop();
            }
            
            console.log(`   Extracted file name: ${fileName}`);
            
            this.findOrCreateInput(
                card,
                `old_employment_doc[${index}]`,
                'hidden'
            ).value = fileName;
            
            const previewContainer = card.querySelector('.employment-doc-preview');
            if (previewContainer) {
                this.renderPreview(
                    card,
                    '.employment-doc-preview',
                    fileName,
                    '📄 Employment Document',
                    'employment'
                );
                console.log(`   Added employment document: ${fileName}`);
            }
        }

        const fieldMap = {
            'employer_name[]': data.employer_name,
            'job_title[]': data.job_title,
            'employee_id[]': data.employee_id,
            'employer_address[]': data.employer_address,
            'reason_leaving[]': data.reason_leaving,
            'hr_manager_name[]': data.hr_manager_name,
            'hr_manager_phone[]': data.hr_manager_phone,
            'hr_manager_email[]': data.hr_manager_email,
            'manager_name[]': data.manager_name,
            'manager_phone[]': data.manager_phone,
            'manager_email[]': data.manager_email
        };

        Object.entries(fieldMap).forEach(([name, value]) => {
            const el = card.querySelector(`[name="${name}"]`);
            if (el && value !== null && value !== undefined) {
                el.value = value;
            }
        });
        
        if (data.joining_date) {
            const joiningInput = card.querySelector('[name="joining_date[]"]');
            if (joiningInput) {
                if (data.joining_date.match(/^\d{4}-\d{2}$/)) {
                    joiningInput.value = `${data.joining_date}-01`;
                } else {
                    joiningInput.value = data.joining_date.substring(0, 10);
                }
            }
        }

        if (data.relieving_date) {
            const relievingInput = card.querySelector('[name="relieving_date[]"]');
            if (relievingInput) {
                if (data.relieving_date.match(/^\d{4}-\d{2}$/)) {
                    relievingInput.value = `${data.relieving_date}-01`;
                } else {
                    relievingInput.value = data.relieving_date.substring(0, 10);
                }
            }
        }

        const insufficientCheckbox = card.querySelector('input[name="insufficient_employment_docs[]"]');
        if (insufficientCheckbox) {
            const isInsufficient = employmentDoc === 'INSUFFICIENT_DOCUMENTS' ||
                                 data.insufficient_documents == 1 || 
                                 data.insufficient_documents === true;
            
            insufficientCheckbox.checked = isInsufficient;
            const employmentFile = card.querySelector('input[name="employment_doc[]"]');
            if (employmentFile) {
                employmentFile.disabled = isInsufficient;
                employmentFile.required = !isInsufficient;
                if (isInsufficient) {
                    employmentFile.value = '';
                }
            }
            
            console.log(`   Set insufficient_employment_docs for card ${index}: ${isInsufficient}`);
        }

        const radioBlock = card.querySelector('.first-employer-fields');
        if (radioBlock) {
            if (index === 0) {
                radioBlock.style.display = 'block';
                console.log('   📻 Showing radio block for first card');        
                const fresherValue = data.is_fresher || (this.isFresher ? 'yes' : 'no');
                const currentlyEmployedValue = data.currently_employed || this.currentlyEmployed || 'no';
                const contactEmployerValue = data.contact_employer || this.contactEmployer || 'no';
                
                console.log(`   Radio values to set:`);
                console.log(`    - is_fresher: ${fresherValue} (from data: ${data.is_fresher}, from class: ${this.isFresher})`);
                console.log(`    - currently_employed: ${currentlyEmployedValue} (from data: ${data.currently_employed}, from class: ${this.currentlyEmployed})`);
                console.log(`    - contact_employer: ${contactEmployerValue} (from data: ${data.contact_employer}, from class: ${this.contactEmployer})`);
                console.log(`   Setting is_fresher: ${fresherValue}`);
                this.setRadio(card, 'is_fresher[0]', fresherValue);
                this.isFresher = fresherValue === 'yes';
                console.log(`   Setting currently_employed: ${currentlyEmployedValue}`);
                this.setRadio(card, 'currently_employed[0]', currentlyEmployedValue);
                this.currentlyEmployed = currentlyEmployedValue;
                console.log(`   Setting contact_employer: ${contactEmployerValue}`);
                this.setRadio(card, 'contact_employer[0]', contactEmployerValue);
                this.contactEmployer = contactEmployerValue;
                this.updateContactEmployer(card);
            } else {
                radioBlock.style.display = 'none';
                console.log('   Hiding radio block for card ' + index);
            }
        }

        console.log(`✅ Card ${index} populated successfully`);
    }

    setRadio(card, name, value) {
        console.log(`🎯 setRadio: ${name} = "${value}"`);
        
        setTimeout(() => {
            const radios = card.querySelectorAll(`input[name="${name}"]`);
            
            if (radios.length === 0) {
                console.error(`❌ No radio buttons found with name: ${name} in card`);
                const allRadios = card.querySelectorAll('input[type="radio"]');
                console.log('  All radios in card:', allRadios.length);
                allRadios.forEach(r => console.log(`    - ${r.name} = ${r.value}`));
                return;
            }
            
            radios.forEach(radio => {
                radio.checked = false;
                radio.removeAttribute('checked');
            });
            
            let found = false;
            radios.forEach(radio => {
                if (radio.value === value) {
                    radio.checked = true;
                    radio.setAttribute('checked', 'checked');
                    
                    const event = new Event('change', { bubbles: true });
                    radio.dispatchEvent(event);
                    
                    found = true;
                    console.log(`✅ Radio ${name}="${value}" checked`);
                }
            });
            
            if (!found) {
                console.error(`❌ Radio value "${value}" not found for name "${name}"`);
                console.log(`  Available values:`, Array.from(radios).map(r => r.value));
            }
        }, 50); 
    }

    renderPreview(card, selector, file, label) {
        const previewContainer = card.querySelector(selector);
        if (!previewContainer) {
            return null;
        }
        
        if (!file || file.trim() === '') {
            return null;
        }
        
        const base = window.APP_BASE_URL || '';
        const filePath = `${base}/uploads/employment/${file}`;
        
        previewContainer.innerHTML = `
            <div class="file-preview-pill">
                ${label}
                <button
                    type="button"
                    class="btn btn-link p-0 ms-2 preview-btn"
                    data-doc-url="${filePath}"
                    data-doc-name="${file}">
                    Preview
                </button>
            </div>
        `;
        
        return previewContainer;
    }

    setupInsufficientDocsHandlers() {
        console.log('🔧 Setting up insufficient documents handlers');
        
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="insufficient_employment_docs[]"]')) {
                const checkbox = e.target;
                const card = checkbox.closest('.employment-card');
                if (card) {
                    const cardIndex = card.dataset.cardIndex || 'unknown';
                    console.log(`🔘 Insufficient employment docs checkbox changed in card ${cardIndex}: ${checkbox.checked}`);
                    
                    const employmentFile = card.querySelector('input[name="employment_doc[]"]');
                    
                    if (employmentFile) {
                        employmentFile.disabled = checkbox.checked;
                        employmentFile.required = !checkbox.checked;
                        if (checkbox.checked) {
                            employmentFile.value = '';
                            console.log('📄 Cleared employment file input');
                        }
                    }
                }
            }
        });
    }

    setupFormHandlers() {
        console.log('🔧 Setting up employment form handlers');
        
        const form = document.getElementById('employmentForm');
        if (!form) {
            console.error('❌ Employment form not found');
            return;
        }

        form.onsubmit = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        };

        const nextBtn = document.querySelector('.external-submit-btn[data-form="employmentForm"]');
        if (nextBtn) {
            nextBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Next button clicked - submitting employment form');
                await this.submitForm(false); 
            });
        }

        const prevBtn = document.querySelector('.prev-btn[data-form="employmentForm"]');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('⬅️ Previous button clicked - navigating to education');
                if (window.Router && window.Router.navigateTo) {
                    window.Router.navigateTo('education');
                }
            });
        }

        document.addEventListener('click', (e) => {
            const draftBtn = e.target.closest('.save-draft-btn[data-page="employment"]');
            if (draftBtn) {
                e.preventDefault();
                console.log('💾 Save draft button clicked');
                this.saveDraft();
            }
        });
    }

    setupFileHandlers() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="employment_doc[]"]')) {
                const input = e.target;
                const card = input.closest('.employment-card');
                const index = card ? parseInt(card.dataset.cardIndex) : null;
                
                if (index !== null && input.files.length > 0) {
                    console.log(`📄 File selected for employment_doc in card ${index}:`, input.files[0].name);
                    this.clearPreview(card, '.employment-doc-preview');
                    this.updateTabStatus();
                }
            }
        });
    }

    setupRadioHandlers() {
        document.addEventListener('change', e => {
            if (e.target.name === 'is_fresher[0]') {
                this.isFresher = e.target.value === 'yes';
                console.log(`🔄 Fresher changed to: ${this.isFresher}`);
                this.applyFresherUI(this.isFresher);
            }

            if (e.target.name === 'currently_employed[0]') {
                this.currentlyEmployed = e.target.value;
                console.log(`🔄 Currently Employed changed to: ${this.currentlyEmployed}`);
                this.updateContactEmployer(this.cards[0]);
            }
            
            if (e.target.name === 'contact_employer[0]') {
                this.contactEmployer = e.target.value;
                console.log(`🔄 Contact Employer changed to: ${this.contactEmployer}`);
            }
        });
    }

    updateContactEmployer(card) {
        if (!card) return;

        const block = card.querySelector('.contact-employer-field');
        const relieving = card.querySelector('[name="relieving_date[]"]');

        if (!block) return;

        if (this.currentlyEmployed === 'yes') {
            block.style.display = 'block';
            if (relieving) {
                relieving.value = '';
                relieving.disabled = true;
            }
        } else {
            block.style.display = 'none';
            if (relieving) relieving.disabled = false;
        }
    }

    applyFresherUI(isFresher) {
        this.isFresher = isFresher;
        console.log(`🎯 Applying Fresher UI: ${isFresher}`);

        if (this.countSelect) {
            this.countSelect.value = 1;
            this.countSelect.disabled = isFresher;
        }

        if (this.tabsContainer) {
            const tabs = this.tabsContainer.querySelectorAll('.employment-tab');
            tabs.forEach((tab, i) => {
                if (isFresher && i > 0) {
                    tab.style.pointerEvents = 'none';
                    tab.style.opacity = '0.4';
                } else {
                    tab.style.pointerEvents = '';
                    tab.style.opacity = '';
                }
            });
        }

        if (isFresher) {
            this.showTab(0);
        }
    }

    validateForm(isFinalSubmit = false) {
        console.log(`Validating employment form (isFinalSubmit: ${isFinalSubmit}, isFresher: ${this.isFresher})`);
        
        let isValid = true;
        const errors = [];
        
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (!card) continue;
            if (this.isFresher && i > 0) {
                continue;
            }
            
            if (this.isFresher && i === 0) {
                continue;
            }

            if (!this.isFresher) {
                const requiredFields = [
                    { selector: '[name="employer_name[]"]', label: 'Employer Name' },
                    { selector: '[name="job_title[]"]', label: 'Job Title' },
                    { selector: '[name="employee_id[]"]', label: 'Employee ID' },
                    { selector: '[name="joining_date[]"]', label: 'Joining Date' },
                    { selector: '[name="employer_address[]"]', label: 'Employer Address' },
                    { selector: '[name="reason_leaving[]"]', label: 'Reason for Leaving' }
                ];

                if (i === 0 && this.currentlyEmployed === 'no') {
                    requiredFields.push({ 
                        selector: '[name="relieving_date[]"]', 
                        label: 'Relieving Date' 
                    });
                }

                requiredFields.forEach(field => {
                    const input = card.querySelector(field.selector);
                    if (input && !input.value.trim()) {
                        errors.push(`Employer ${i + 1}: ${field.label} is required`);
                        isValid = false;
                    }
                });

                if (isFinalSubmit && i === 0) {
                    const insufficientCheckbox = card.querySelector('input[name="insufficient_employment_docs[]"]');
                    const isInsufficient = insufficientCheckbox && insufficientCheckbox.checked;
                    
                    if (!isInsufficient) {
                        const employmentFile = card.querySelector('[name="employment_doc[]"]');
                        const oldEmploymentDoc = card.querySelector('[name^="old_employment_doc"]');

                        const hasEmploymentFile = (employmentFile && employmentFile.files.length > 0) || 
                                                 (oldEmploymentDoc && oldEmploymentDoc.value && 
                                                  oldEmploymentDoc.value !== 'INSUFFICIENT_DOCUMENTS');

                    }
                }

                const joiningInput = card.querySelector('[name="joining_date[]"]');
                const relievingInput = card.querySelector('[name="relieving_date[]"]');
                
                if (joiningInput && joiningInput.value && relievingInput && relievingInput.value) {
                    const joiningDate = new Date(joiningInput.value);
                    const relievingDate = new Date(relievingInput.value);
                    
                    if (relievingDate <= joiningDate) {
                        errors.push(`Employer ${i + 1}: Relieving date must be after joining date`);
                        isValid = false;
                    }
                }
            }
        }
        
        if (errors.length > 0) {
            alert("Please fix the following errors:\n\n" + errors.join('\n\n'));
        }

        console.log(`✅ Employment form validation ${isValid ? 'passed' : 'failed'}`);
        return isValid;
    }

    async saveDraft() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
            const form = document.getElementById('employmentForm');
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
                this.showNotification('✅ Employment Draft saved successfully!');
                localStorage.removeItem('employment_draft');
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

    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem('employment_draft');
            if (!raw) {
                console.log('📭 No employment draft found in localStorage');
                return;
            }

            const data = JSON.parse(raw);
            console.log('📥 Loading employment draft from localStorage');

            const count = Math.max(
                data['employer_name[]']?.length || 0,
                data['job_title[]']?.length || 0,
                this.savedRows.length
            );

            if (!count) return;

            console.log(`🔄 Ensuring ${count} cards for localStorage data`);

            while (this.cards.length < count) {
                this.addCard(this.cards.length, null);
            }

            for (let i = 0; i < count; i++) {
                const card = this.cards[i];
                if (card) {
                    const hasDbData = this.savedRows[i];
                    if (hasDbData) {
                        continue;
                    }

                    const localStorageData = {
                        employer_name: data['employer_name[]']?.[i],
                        job_title: data['job_title[]']?.[i],
                        employee_id: data['employee_id[]']?.[i],
                        employer_address: data['employer_address[]']?.[i],
                        reason_leaving: data['reason_leaving[]']?.[i],
                        hr_manager_name: data['hr_manager_name[]']?.[i],
                        hr_manager_phone: data['hr_manager_phone[]']?.[i],
                        hr_manager_email: data['hr_manager_email[]']?.[i],
                        manager_name: data['manager_name[]']?.[i],
                        manager_phone: data['manager_phone[]']?.[i],
                        manager_email: data['manager_email[]']?.[i],
                        joining_date: data['joining_date[]']?.[i],
                        relieving_date: data['relieving_date[]']?.[i],
                        is_fresher: data['is_fresher[0]']?.[0],
                        currently_employed: data['currently_employed[0]']?.[0],
                        contact_employer: data['contact_employer[0]']?.[0],
                        insufficient_documents: data['insufficient_employment_docs[]']?.[i] || false
                    };

                    this.populateCard(card, localStorageData, i);
                }
            }

            console.log('✅ Employment draft loaded from localStorage');
        } catch (error) {
            console.error('❌ Error loading employment draft from localStorage:', error);
        }
    }

    async submitForm(isDraft = false) {
        console.log(`🚀 Employment submit initiated (draft: ${isDraft}, fresher: ${this.isFresher})`);

        if (this.isSubmitting) {
            console.log('⏳ Employment submit already in progress');
            return;
        }

        if (!isDraft && !this.validateForm(true)) {
            console.log("❌ Validation failed");
            return;
        }

        this.isSubmitting = true;
        console.log('📤 Submitting employment form...');

        try {
            const form = document.getElementById('employmentForm');
            if (!form) {
                throw new Error('Employment form not found');
            }

            const formData = new FormData(form);
            formData.set('draft', isDraft ? '1' : '0');

            console.log('📦 Form data prepared:', {
                draft: isDraft,
                fresher: this.isFresher,
                currentlyEmployed: this.currentlyEmployed,
                contactEmployer: this.contactEmployer,
                cards: this.cards.length
            });

            const response = await fetch(this.getApiEndpoint(), {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (data.success) {
                if (!isDraft) {
                    if (window.Router && window.Router.markCompleted) {
                        window.Router.markCompleted('employment');
                        window.Router.updateProgress();
                    }
                    
                    if (window.Forms && typeof window.Forms.clearDraft === 'function') {
                        window.Forms.clearDraft('employment');
                    }
                    
                    console.log('Navigating to reference page');
                    setTimeout(() => {
                        if (window.Router && window.Router.navigateTo) {
                            window.Router.navigateTo('reference');
                        }
                    }, 500);
                }
            } else {
                const errorMessage = data.message || 'Save failed';
                console.error('Employment save failed:', errorMessage);
                alert(errorMessage);
            }
        } catch (err) {
            console.error('Employment submit error:', err);
            alert('Error: ' + err.message);
        } finally {
            this.isSubmitting = false;
            console.log('Employment submit completed');
        }
    }

    showNotification(message, isError = false) {
        const existingNotif = document.querySelector('.employment-notification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `employment-notification alert ${isError ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`;
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
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    cleanup() {
        console.log('🧹 Cleaning up EmploymentManager');
        super.cleanup();
        
        const form = document.getElementById('employmentForm');
        if (form && form.onsubmit) {
            form.onsubmit = null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.EmploymentManager = EmploymentManager;

    window.Employment = {
        onPageLoad: async () => {
            console.log('💼 Employment.onPageLoad() called');
            
            try {
                if (!window.employmentManager) {
                    console.log('🆕 Creating new EmploymentManager instance');
                    window.employmentManager = new EmploymentManager();
                }
                
                await window.employmentManager.init();
                console.log('✅ Employment page loaded successfully');
            } catch (error) {
                console.error('❌ Error in Employment.onPageLoad:', error);
            }
        },
        
        cleanup: () => {
            console.log('🧹 Cleaning up Employment module');
            if (window.employmentManager) {
                window.employmentManager.cleanup();
                window.employmentManager = null;
            }
        }
    };
}

console.log('✅ Employment.js module loaded');