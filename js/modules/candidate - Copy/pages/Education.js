class EducationManager extends TabManager {
    constructor() {
        super(
            'education',
            'educationContainer',
            'educationTemplate',
            'educationTabs',
            'educationCount'
        );

        this.savedRows = [];
        this.isSubmitting = false;
    }


    async init() {
        console.log('📚 EducationManager.init() called');
        this.loadPageData();
        await super.init();
        await this.initCards();
        this.setupFormHandlers();
        this.loadFromLocalStorage();
        this.setupInsufficientDocsHandlers();
        console.log('✅ Education module initialized successfully');
        console.log(`📊 Cards loaded: ${this.cards.length}, Data rows: ${this.savedRows.length}`);

        return this;
    }

    getApiEndpoint() {
        return `${window.APP_BASE_URL}/api/candidate/store_education.php`;
    }

    getTabLabel(index) {
        return `Education ${index + 1}`;
    }

    loadPageData() {
        const dataEl = document.getElementById('educationData');
        if (!dataEl) {
            console.warn('⚠️ Education data element not found');
            this.savedRows = [];
            return;
        }

        try {
            this.savedRows = JSON.parse(dataEl.dataset.rows || '[]');
            console.log(`📥 Loaded ${this.savedRows.length} education records from DB`);
        } catch (e) {
            console.error('❌ Failed to parse education data', e);
            this.savedRows = [];
        }
    }

    async initCards() {
        if (!this.savedRows || this.savedRows.length === 0) {
            console.log('📭 No saved education data to populate');
            return;
        }

        console.log(`🔄 Initializing cards for ${this.savedRows.length} records`);

        while (this.cards.length < this.savedRows.length) {
            console.log(`➕ Adding card ${this.cards.length + 1} for data`);
            this.addCard(this.cards.length, null);
        }

        this.savedRows.forEach((row, i) => {
            if (this.cards[i]) {
                console.log(`📝 Populating card ${i} with data:`, row);
                this.populateCard(this.cards[i], row, i);
            } else {
                console.error(`❌ Card ${i} not found for data population`);
            }
        });
    }

    populateCard(card, data = {}, index) {
        console.log(` EducationManager.populateCard() for card ${index}`, data);
        

        const idx = this.findInput(card, 'education_index[]');
        if (idx) idx.value = index + 1;

       
        if (data.id) {
            this.findOrCreateInput(card, `id[${index}]`, 'hidden').value = data.id;
            console.log(`   Set record ID: ${data.id}`);
        }

        if (data.marksheet_file && data.marksheet_file !== 'INSUFFICIENT_DOCUMENTS') {
            this.findOrCreateInput(
                card,
                `old_marksheet_file[${index}]`,
                'hidden'
            ).value = data.marksheet_file;

            this.renderPreview(
                card,
                '.marksheet-preview',
                data.marksheet_file,
                ' Marksheet'
            );
            console.log(`   Added marksheet: ${data.marksheet_file}`);
        }

        if (data.degree_file && data.degree_file !== 'INSUFFICIENT_DOCUMENTS') {
            this.findOrCreateInput(
                card,
                `old_degree_file[${index}]`,
                'hidden'
            ).value = data.degree_file;

            this.renderPreview(
                card,
                '.degree-preview',
                data.degree_file,
                '🎓 Degree'
            );
            console.log(`   Added degree: ${data.degree_file}`);
        }

        
        const fieldMap = {
            'qualification[]': data.qualification,
            'college_name[]': data.college_name,
            'university_board[]': data.university_board,
            'roll_number[]': data.roll_number,
            'college_website[]': data.college_website,
            'college_address[]': data.college_address
        };

        Object.entries(fieldMap).forEach(([name, value]) => {
            const el = card.querySelector(`[name="${name}"]`);
            if (el && value !== null && value !== undefined) {
                el.value = value;
                console.log(`   Set ${name}: ${value}`);
            }
        });

        if (data.year_from) {
            const yf = card.querySelector('[name="year_from[]"]');
            if (yf) {
                const date = new Date(data.year_from);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                yf.value = `${year}-${month}`;
                console.log(`   Set year_from: ${yf.value}`);
            }
        }

        if (data.year_to) {
            const yt = card.querySelector('[name="year_to[]"]');
            if (yt) {
                const date = new Date(data.year_to);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                yt.value = `${year}-${month}`;
                console.log(`   Set year_to: ${yt.value}`);
            }
        }

        const insufficientCheckbox = card.querySelector('input[name="insufficient_education_docs[]"]');
        if (insufficientCheckbox) {
           const isInsufficient = data.insufficient_documents == 1 || 
                     data.insufficient_documents === true ||
                     data.marksheet_file === 'INSUFFICIENT_DOCUMENTS' || 
                     data.degree_file === 'INSUFFICIENT_DOCUMENTS';

            
            insufficientCheckbox.checked = isInsufficient;
            const marksheetFile = card.querySelector('input[name="marksheet_file[]"]');
            const degreeFile = card.querySelector('input[name="degree_file[]"]');
            
            if (marksheetFile) {
                marksheetFile.disabled = isInsufficient;
                marksheetFile.required = !isInsufficient;
                if (isInsufficient) {
                    marksheetFile.value = '';
                }
            }
            
            if (degreeFile) {
                degreeFile.disabled = isInsufficient;
                degreeFile.required = !isInsufficient;
                if (isInsufficient) {
                    degreeFile.value = '';
                }
            }
            
            console.log(`   Set insufficient_education_docs for card ${index}: ${isInsufficient}`);
        }

        console.log(`✅ Card ${index} populated successfully`);
    }

    setupInsufficientDocsHandlers() {
        console.log('🔧 Setting up insufficient documents handlers');
        
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="insufficient_education_docs[]"]')) {
                const checkbox = e.target;
                const card = checkbox.closest('.education-card');
                if (card) {
                    const cardIndex = card.dataset.cardIndex || 'unknown';
                    console.log(`🔘 Insufficient education docs checkbox changed in card ${cardIndex}: ${checkbox.checked}`);
                    
                    const marksheetFile = card.querySelector('input[name="marksheet_file[]"]');
                    const degreeFile = card.querySelector('input[name="degree_file[]"]');
                    
                    if (marksheetFile) {
                        marksheetFile.disabled = checkbox.checked;
                        marksheetFile.required = !checkbox.checked;
                        if (checkbox.checked) {
                            marksheetFile.value = '';
                            console.log('📄 Cleared marksheet file input');
                        }
                    }
                    
                    if (degreeFile) {
                        degreeFile.disabled = checkbox.checked;
                        degreeFile.required = !checkbox.checked;
                        if (checkbox.checked) {
                            degreeFile.value = '';
                            console.log('📄 Cleared degree file input');
                        }
                    }
                }
            }
        });
    }

    renderPreview(card, selector, file, label) {
        console.log(`🖼️ Rendering preview for ${label}: ${file}`);
        const previewElement = super.renderPreview(card, selector, file, label, 'education');
        
        if (previewElement) {
            console.log(`✅ Preview rendered for ${label} in card`);
        }
        
        return previewElement;
    }

    setupFormHandlers() {
        console.log('🔧 Setting up education form handlers');
        
        const form = document.getElementById('educationForm');
        if (!form) {
            console.error('❌ Education form not found');
            return;
        }

        form.onsubmit = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('❌ Form submission prevented (handled by EducationManager)');
            return false;
        };

        const nextBtn = document.querySelector('.external-submit-btn[data-form="educationForm"]');
        if (nextBtn) {
            nextBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Next button clicked - submitting education form');
                await this.submitForm(false); 
            });
        } else {
            console.warn('⚠️ Next button not found');
        }

        const prevBtn = document.querySelector('.prev-btn[data-form="educationForm"]');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('⬅️ Previous button clicked - navigating to contact');
                if (window.Router && window.Router.navigateTo) {
                    window.Router.navigateTo('contact');
                } else {
                    console.error('❌ Router not available');
                    window.location.href = `${window.APP_BASE_URL}/modules/candidate/contact.php`;
                }
            });
        }

        document.addEventListener('click', (e) => {
            const draftBtn = e.target.closest('.save-draft-btn[data-page="education"]');
            if (draftBtn) {
                e.preventDefault();
                console.log('💾 Save draft button clicked');
                this.saveDraft();
            }
        });

        this.setupFileHandlers();
        
        console.log('✅ Education form handlers setup complete');
    }

    setupFileHandlers() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="marksheet_file[]"], input[name="degree_file[]"]')) {
                const input = e.target;
                const card = input.closest('.education-card');
                const index = card ? parseInt(card.dataset.cardIndex) : null;
                
                if (index !== null && input.files.length > 0) {
                    console.log(`File selected for ${input.name} in card ${index}:`, input.files[0].name);
                    const previewSelector = input.name.includes('marksheet') 
                        ? '.marksheet-preview' 
                        : '.degree-preview';
                    this.clearPreview(card, previewSelector);
                    this.updateTabStatus();
                }
            }
        });
    }

    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem('education_draft');
            if (!raw) {
                console.log('No education draft found in localStorage');
                return;
            }

            const data = JSON.parse(raw);
            console.log('Loading education draft from localStorage:', data);

            const count = Math.max(
                data['qualification[]']?.length || 0,
                data['college_name[]']?.length || 0,
                this.savedRows.length 
            );

            if (!count) return;

            console.log(`Ensuring ${count} cards for localStorage data`);
            while (this.cards.length < count) {
                this.addCard(this.cards.length, null);
            }

            for (let i = 0; i < count; i++) {
                const card = this.cards[i];
                if (card) {
                    const hasDbData = this.savedRows[i];
                    if (hasDbData) {
                        console.log(`Card ${i} has DB data, skipping localStorage`);
                        continue;
                    }

                    console.log(`Loading localStorage data to card ${i}`);
                    
                    const localStorageData = {
                        qualification: data['qualification[]']?.[i],
                        college_name: data['college_name[]']?.[i],
                        university_board: data['university_board[]']?.[i],
                        roll_number: data['roll_number[]']?.[i],
                        college_website: data['college_website[]']?.[i],
                        college_address: data['college_address[]']?.[i],
                        year_from: data['year_from[]']?.[i],
                        year_to: data['year_to[]']?.[i],
                        insufficient_documents: data['insufficient_education_docs[]']?.[i] || false
                    };

                    this.populateCard(card, localStorageData, i);
                }
            }

            console.log('Education draft loaded from localStorage');
        } catch (error) {
            console.error('Error loading education draft from localStorage:', error);
        }
    }

    async saveDraft() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        try {
            const form = document.getElementById('educationForm');
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
                this.showNotification('✅ Education Draft saved successfully!');
                localStorage.removeItem('education_draft');
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

    validateForm(isFinalSubmit = false) {
        console.log(`📋 Validating education form (isFinalSubmit: ${isFinalSubmit})`);
        
        let isValid = true;
        const errors = [];
        
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (!card) continue;
            
            const requiredFields = [
                { selector: '[name="qualification[]"]', label: 'Qualification' },
                { selector: '[name="college_name[]"]', label: 'College/Institution' },
                { selector: '[name="university_board[]"]', label: 'University/Board' },
                { selector: '[name="roll_number[]"]', label: 'Roll Number' },
                { selector: '[name="year_from[]"]', label: 'From Year' },
                { selector: '[name="year_to[]"]', label: 'To Year' },
                { selector: '[name="college_address[]"]', label: 'College Address' }
            ];

            requiredFields.forEach(field => {
                const input = card.querySelector(field.selector);
                if (input && !input.value.trim()) {
                    errors.push(`Education ${i + 1}: ${field.label} is required`);
                    isValid = false;
                }
            });

            if (isFinalSubmit) {
                const insufficientCheckbox = card.querySelector('input[name="insufficient_education_docs[]"]');
                const isInsufficient = insufficientCheckbox && insufficientCheckbox.checked;
                
                if (!isInsufficient) {
                    const marksheetFile = card.querySelector('[name="marksheet_file[]"]');
                    const degreeFile = card.querySelector('[name="degree_file[]"]');
                    const oldMarksheet = card.querySelector('[name^="old_marksheet_file"]');
                    const oldDegree = card.querySelector('[name^="old_degree_file"]');

                    const hasMarksheet = (marksheetFile && marksheetFile.files.length > 0) || 
                                        (oldMarksheet && oldMarksheet.value && oldMarksheet.value !== 'INSUFFICIENT_DOCUMENTS');
                    
                    const hasDegree = (degreeFile && degreeFile.files.length > 0) || 
                                     (oldDegree && oldDegree.value && oldDegree.value !== 'INSUFFICIENT_DOCUMENTS');
                }
            }
        }

        if (errors.length > 0) {
            alert("Please fix the following errors:\n\n" + errors.join('\n\n'));
            return false;
        }

        console.log(` Education form validation ${isValid ? 'passed' : 'failed'}`);
        return isValid;
    }

    async submitForm(isDraft = false) {
        console.log(` Education submit initiated (draft: ${isDraft})`);

        if (this.isSubmitting) {
            console.log(' Education submit already in progress');
            return;
        }

        if (!isDraft && !this.validateForm(true)) {
            console.log(" Validation failed");
            return;
        }

        this.isSubmitting = true;
        console.log(' Submitting education form...');

        try {
            const form = document.getElementById('educationForm');
            if (!form) {
                throw new Error('Education form not found');
            }

            const formData = new FormData(form);
            formData.set('draft', isDraft ? '1' : '0');

            console.log(' Form data prepared:', {
                draft: isDraft,
                cards: this.cards.length,
                entries: Array.from(formData.entries()).map(([key, value]) => 
                    `${key}: ${value instanceof File ? value.name : value}`
                )
            });

            const response = await fetch(this.getApiEndpoint(), {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const data = await response.json();
            console.log(' Server response:', data);

            if (data.success) {        
                if (!isDraft) {
                    if (window.Router && window.Router.markCompleted) {
                        window.Router.markCompleted('education');
                        window.Router.updateProgress();
                    }
                    if (window.Forms && typeof window.Forms.clearDraft === 'function') {
                        window.Forms.clearDraft('education');
                    }
                    console.log(' Navigating to employment page');
                    setTimeout(() => {
                        if (window.Router && window.Router.navigateTo) {
                            window.Router.navigateTo('employment');
                        } else {
                            window.location.href = `${window.APP_BASE_URL}/modules/candidate/employment.php`;
                        }
                    }, 500);
                }
            } else {
                const errorMessage = data.message || 'Save failed';
                console.error(' Education save failed:', errorMessage);
                alert(' ' + errorMessage);
            }
        } catch (err) {
            console.error(' Education submit error:', err);
            alert(' Error: ' + err.message);
        } finally {
            this.isSubmitting = false;
            console.log(' Education submit completed');
        }
    }

    showNotification(message, isError = false) {
        const existingNotif = document.querySelector('.education-notification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `education-notification alert ${isError ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`;
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
        console.log('🧹 Cleaning up EducationManager');
        super.cleanup();
        
        const form = document.getElementById('educationForm');
        if (form && form.onsubmit) {
            form.onsubmit = null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.EducationManager = EducationManager;

    window.Education = {
        onPageLoad: async () => {
            console.log('📚 Education.onPageLoad() called');
            
            try {
                if (!window.educationManager) {
                    console.log('🆕 Creating new EducationManager instance');
                    window.educationManager = new EducationManager();
                }
                
                await window.educationManager.init();
                console.log('✅ Education page loaded successfully');
            } catch (error) {
                console.error('❌ Error in Education.onPageLoad:', error);
            }
        },
        
        cleanup: () => {
            console.log('🧹 Cleaning up Education module');
            if (window.educationManager) {
                window.educationManager.cleanup();
                window.educationManager = null;
            }
        }
    };
}

console.log('✅ Education.js module loaded');