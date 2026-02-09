class Reference {
    
    static _initialized = false;
    
    static init() {
        console.log("Reference.init() called - SPA compatibility");
        return this;
    }
    
    static onPageLoad() {
        console.log("Reference.onPageLoad() called");
        
        if (this._initialized) {
            console.log("Already initialized, skipping...");
            return;
        }
        
        this._initialized = true;
        
        console.log("Reference module initialized");
        this.hydrateFromDB();
        this.initFormHandling();
    }
    
    static hydrateFromDB() {
        const dataEl = document.getElementById("referenceData");
        if (!dataEl) {
            console.log("No reference data element found - using fresh form");
            return;
        }
        
        try {
            const referenceData = JSON.parse(dataEl.dataset.reference || "{}");
            if (referenceData && Object.keys(referenceData).length > 0) {
                this.populateForm(referenceData);
            }
        } catch (e) {
            console.error("Reference data parse failed", e);
        }
    }
    
    static populateForm(data) {
        const fields = [
            'reference_name',
            'reference_designation',
            'reference_company',
            'reference_mobile',
            'reference_email',
            'relationship',
            'years_known'
        ];
        
        fields.forEach(field => {
            const element = document.querySelector(`[name="${field}"]`);
            if (element && data[field] !== undefined) {
                element.value = data[field];
            }
        });
    }
    
    static initFormHandling() {
        const form = document.getElementById('referenceForm');
        if (!form) {
            console.error("Reference form not found");
            return;
        }

        console.log("Setting up Reference form handlers");
        form.onsubmit = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        };

        const saveDraftBtn = form.querySelector('.save-draft-btn[data-page="reference"]');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log("Reference Save Draft clicked");
                this.saveDraft();
            });
        } else {
            console.warn("Save draft button not found");
        }

        const nextBtn = document.querySelector('.external-submit-btn[data-form="referenceForm"]');
        if (nextBtn) {
            nextBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log("Reference Next button clicked");
                await this.submitForm();
            });
        } else {
            console.warn("Next button not found");
        }

        const prevBtn = document.querySelector('.prev-btn[data-form="referenceForm"]');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log("Reference Previous button clicked");
                if (window.Router && window.Router.navigateTo) {
                    window.Router.navigateTo('employment');
                } else {
                    window.location.href = '/candidate/employment.php';
                }
            });
        }
    }

    static validateForm(isFinalSubmit = false) {
        const form = document.getElementById('referenceForm');
        if (!form) {
            console.error("Reference form not found for validation");
            return false;
        }

        let isValid = true;
        const errors = [];

        const referenceName = form.querySelector('[name="reference_name"]')?.value.trim() || '';
        const referenceDesignation = form.querySelector('[name="reference_designation"]')?.value.trim() || '';
        const referenceCompany = form.querySelector('[name="reference_company"]')?.value.trim() || '';
        const referenceMobile = form.querySelector('[name="reference_mobile"]')?.value.trim() || '';
        const referenceEmail = form.querySelector('[name="reference_email"]')?.value.trim() || '';
        const relationship = form.querySelector('[name="relationship"]')?.value.trim() || '';
        const yearsKnown = form.querySelector('[name="years_known"]')?.value.trim() || '';

        if (!isFinalSubmit && !referenceName && !referenceDesignation && !referenceCompany && 
            !referenceMobile && !referenceEmail && !relationship && !yearsKnown) {
            console.log("All fields empty, draft save allowed");
            return true;
        }

        if (isFinalSubmit) {
            if (!referenceName) errors.push("Reference name is required");
            if (!referenceDesignation) errors.push("Designation is required");
            if (!referenceCompany) errors.push("Company is required");
            if (!referenceMobile) errors.push("Mobile number is required");
            if (!referenceEmail) errors.push("Email is required");
            if (!relationship) errors.push("Relationship is required");
            if (!yearsKnown) errors.push("Years known is required");
        } else {
            const filledFields = [
                referenceName, referenceDesignation, referenceCompany,
                referenceMobile, referenceEmail, relationship, yearsKnown
            ].filter(field => field !== '').length;
            
            if (filledFields > 0 && filledFields < 7) {
                errors.push("Please either fill all required fields or leave all empty for draft save");
            }
        }

        if (referenceEmail && !this.validateEmail(referenceEmail)) {
            errors.push("Invalid email format");
        }

        if (referenceMobile && !this.validateMobile(referenceMobile)) {
            errors.push("Mobile number must be exactly 10 digits");
        }

        if (yearsKnown && (!this.validateNumber(yearsKnown) || parseInt(yearsKnown) <= 0)) {
            errors.push("Years known must be a positive number");
        }

        if (errors.length > 0) {
            isValid = false;
            alert("Please fix the following errors:\n\n" + errors.join('\n'));
        }

        return isValid;
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateMobile(mobile) {
        const re = /^[0-9]{10}$/;
        return re.test(mobile);
    }

    static validateNumber(value) {
        const re = /^[0-9]+$/;
        return re.test(value);
    }

    static async saveDraft() {
        console.log("Starting Reference.saveDraft()");
        
        if (!this.validateForm(false)) {
            console.log("Validation failed for draft");
            return;
        }

        const form = document.getElementById('referenceForm');
        if (!form) {
            console.error("Reference form not found");
            return;
        }
        
        const formData = new FormData(form);
        formData.append('draft', '1');

        console.log("Making fetch request for draft save");

        try {
            const response = await fetch(`${window.APP_BASE_URL}/api/candidate/store_reference.php`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);
            
            if (data.success) {
                alert('✅ Reference draft saved successfully!');
            } else {
                alert('❌ Error: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Save draft error:', err);
            alert('❌ Network error: ' + err.message);
        }
    }

    static async submitForm() {
        console.log("Starting Reference.submitForm()");
        
        if (!this.validateForm(true)) {
            console.log("Validation failed for final submit");
            return;
        }

        const form = document.getElementById('referenceForm');
        if (!form) {
            console.error("Reference form not found");
            return;
        }
        
        const formData = new FormData(form);
        formData.append('draft', '0');

        console.log("Making fetch request for final submit");

        try {
            const response = await fetch(`${window.APP_BASE_URL}/api/candidate/store_reference.php`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);
            
            if (data.success) {
                alert('Reference details saved successfully!');
                if (window.Router && window.Router.markCompleted) {
                    window.Router.markCompleted('reference');
                    window.Router.updateProgress();
                }
        
                if (window.Forms && typeof window.Forms.clearDraft === 'function') {
                    window.Forms.clearDraft('reference');
                }
                
                if (window.Router && window.Router.navigateTo) {
                    console.log('Navigating to success page');
                    setTimeout(() => {
                        window.Router.navigateTo('success');
                    }, 500);
                } else {
                    window.location.href = '/candidate/success.php';
                }
            } else {
                alert('Save failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Network error: ' + err.message);
        }
    }

    static getFormData() {
        const form = document.getElementById('referenceForm');
        if (!form) return {};
        
        return {
            reference_name: form.querySelector('[name="reference_name"]')?.value || '',
            reference_designation: form.querySelector('[name="reference_designation"]')?.value || '',
            reference_company: form.querySelector('[name="reference_company"]')?.value || '',
            reference_mobile: form.querySelector('[name="reference_mobile"]')?.value || '',
            reference_email: form.querySelector('[name="reference_email"]')?.value || '',
            relationship: form.querySelector('[name="relationship"]')?.value || '',
            years_known: form.querySelector('[name="years_known"]')?.value || ''
        };
    }

    static resetForm() {
        const form = document.getElementById('referenceForm');
        if (form) {
            form.reset();
        }
    }
 
    static cleanup() {
        console.log(" Reference.cleanup() called");
        const form = document.getElementById('referenceForm');
        if (form) {
            form.onsubmit = null;
        }
        
        const saveDraftBtn = document.querySelector('.save-draft-btn[data-page="reference"]');
        if (saveDraftBtn) {
            const newSaveBtn = saveDraftBtn.cloneNode(true);
            saveDraftBtn.parentNode.replaceChild(newSaveBtn, saveDraftBtn);
        }
        
        const nextBtn = document.querySelector('.external-submit-btn[data-form="referenceForm"]');
        if (nextBtn) {
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        }
        
        this._initialized = false;
    }
}

if (typeof window !== 'undefined') {
    window.Reference = Reference;
}