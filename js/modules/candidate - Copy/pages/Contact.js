class Contact {

    static _initialized = false;
    static _eventListeners = [];
    static _savedData = null;

    static init() {
        console.log("📍 Contact.init() called - SPA compatibility");
        return this;
    }
    
    static onPageLoad() {
        console.log("📍 Contact.onPageLoad() called");
        
        this.cleanupEventListeners();
        this._savedData = window.CONTACT_DATA || null;
        console.log("📊 Loaded contact data from PHP:", this._savedData);
        
        this._initialized = true;
        console.log(" Contact module initialized");
        
        this.populateForm();
        
        this.initSameAddressToggle();
        this.initFormHandling();
    }

    static cleanupEventListeners() {
        this._eventListeners.forEach(listener => {
            if (listener.element && listener.type && listener.handler) {
                listener.element.removeEventListener(listener.type, listener.handler);
            }
        });
        this._eventListeners = [];
    }

    static addEventListener(element, type, handler) {
        element.addEventListener(type, handler);
        this._eventListeners.push({ element, type, handler });
        return handler;
    }

    static populateForm() {
        const data = this._savedData;
        if (!data) {
            console.log("⚠️ No saved contact data to populate");
            return;
        }
        
        console.log("📝 Populating form with saved data");
        const form = document.getElementById('contactForm');
        if (!form) return;
        this.setFormValue('current_address1', data.address1 || '');
        this.setFormValue('current_address2', data.address2 || '');
        this.setFormValue('current_city', data.city || '');
        this.setFormValue('current_state', data.state || '');
        this.setFormValue('current_country', data.country || 'India');
        this.setFormValue('current_postal_code', data.postal_code || '');

        const isSameAddress = data.same_as_current === 1 || data.same_as_current === true;
        this.setFormValue('same_as_current', isSameAddress ? 'on' : '');
        
        if (isSameAddress) {
            this.setFormValue('permanent_address1', data.address1 || '');
            this.setFormValue('permanent_address2', data.address2 || '');
            this.setFormValue('permanent_city', data.city || '');
            this.setFormValue('permanent_state', data.state || '');
            this.setFormValue('permanent_country', data.country || 'India');
            this.setFormValue('permanent_postal_code', data.postal_code || '');
        } else {
            this.setFormValue('permanent_address1', data.permanent_address1 || '');
            this.setFormValue('permanent_address2', data.permanent_address2 || '');
            this.setFormValue('permanent_city', data.permanent_city || '');
            this.setFormValue('permanent_state', data.permanent_state || '');
            this.setFormValue('permanent_country', data.permanent_country || 'India');
            this.setFormValue('permanent_postal_code', data.permanent_postal_code || '');
        }
        this.setFormValue('proof_type', data.proof_type || '');

const isInsufficientProof = data.insufficient_address_proof === 1 || 
                           data.insufficient_address_proof === true ||
                           (data.proof_file === null && data.insufficient_address_proof === 1);

console.log(`📄 Insufficient proof state: ${isInsufficientProof}, 
            insufficient_address_proof: ${data.insufficient_address_proof},
            proof_file: ${data.proof_file}`);
        
        if (isInsufficientProof) {
            this.setFormValue('insufficient_address_proof', 'on');
        } else if (data.proof_file) {
            console.log(`📄 Existing proof file: ${data.proof_file}`);
            const fileInfo = document.createElement('div');
            fileInfo.className = 'text-success small mt-2';
            fileInfo.textContent = `✓ File already uploaded: ${data.proof_file}`;
            
            const fileGroup = form.querySelector('.form-group:has([name="address_proof_file"])');
            if (fileGroup) {
                fileGroup.appendChild(fileInfo);
            }
        }
    }

    static setFormValue(name, value) {
        const element = document.querySelector(`[name="${name}"]`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value === 'on' || value === true || value === 1;
            } else {
                element.value = value;
            }
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    static initSameAddressToggle() {
        const sameCheckbox = document.getElementById("sameAsCurrent");
        if (!sameCheckbox) {
            console.error("❌ sameAsCurrent checkbox not found");
            return;
        }

        console.log("🔄 Initializing same address toggle");

        const fieldMap = [
            { current: "current_address1",   permanent: "permanent_address1" },
            { current: "current_address2",   permanent: "permanent_address2" },
            { current: "current_city",       permanent: "permanent_city" },
            { current: "current_state",      permanent: "permanent_state" },
            { current: "current_country",    permanent: "permanent_country" },
            { current: "current_postal_code", permanent: "permanent_postal_code" }
        ];

        const currentFields = {};
        const permanentFields = {};

        fieldMap.forEach(pair => {
            currentFields[pair.current] = document.querySelector(`[name="${pair.current}"]`);
            permanentFields[pair.permanent] = document.querySelector(`[name="${pair.permanent}"]`);
        });

        const copyValues = () => {
            console.log("📋 Copying current address to permanent address");
            fieldMap.forEach(pair => {
                const src = currentFields[pair.current];
                const dest = permanentFields[pair.permanent];
                if (src && dest) {
                    const value = src.value || '';
                    dest.value = value;
                    dest.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        };

        const togglePermanentFields = (readOnly) => {
            console.log(readOnly ? "🔒 Making permanent address fields read-only" : "✏️ Making permanent address fields editable");
            fieldMap.forEach(pair => {
                const dest = permanentFields[pair.permanent];
                if (dest) {
                    dest.readOnly = readOnly;
                    dest.disabled = readOnly;
                    if (readOnly) {
                        dest.classList.add("bg-light", "opacity-75");
                        dest.style.cursor = "not-allowed";
                    } else {
                        dest.classList.remove("bg-light", "opacity-75");
                        dest.style.cursor = "";
                    }
                }
            });
        };

        const toggleRequired = (enable) => {
            console.log(`${enable ? 'Adding' : 'Removing'} required attribute from permanent address fields`);
            fieldMap.forEach(pair => {
                const dest = permanentFields[pair.permanent];
                if (dest) {
                    if (enable) {
                        dest.setAttribute('required', '');
                    } else {
                        dest.removeAttribute('required');
                    }
                }
            });
        };

        fieldMap.forEach(pair => {
            const src = currentFields[pair.current];
            if (src) {
                this.addEventListener(src, "input", () => {
                    if (sameCheckbox.checked) {
                        const dest = permanentFields[pair.permanent];
                        if (dest) dest.value = src.value || '';
                    }
                });
                
                this.addEventListener(src, "change", () => {
                    if (sameCheckbox.checked) {
                        const dest = permanentFields[pair.permanent];
                        if (dest) dest.value = src.value || '';
                    }
                });
            }
        });

        const handleCheckboxChange = (e) => {
            e.stopImmediatePropagation();
            console.log("🔘 Same address checkbox changed:", sameCheckbox.checked);
            
            if (sameCheckbox.checked) {
                copyValues();
                togglePermanentFields(true);
                toggleRequired(false);
            } else {
                togglePermanentFields(false);
                toggleRequired(true);
            }
        };
        
        this.addEventListener(sameCheckbox, "change", handleCheckboxChange);

        console.log("📊 Initial checkbox state:", sameCheckbox.checked);
        if (sameCheckbox.checked) {
            copyValues();
            togglePermanentFields(true);
            toggleRequired(false);
        } else {
            toggleRequired(true);
        }
    }

static initFormHandling() {
    const form = document.getElementById('contactForm');
    if (!form) {
        console.error(" Contact form not found");
        return;
    }

    console.log("Contact form found, initializing handlers");

    this.addEventListener(form, 'submit', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log(' Form submission prevented');
        return false;
    });

    console.log("🔍 DEBUG: All form elements in contactForm:");
    const allElements = form.querySelectorAll('*');
    allElements.forEach((el, index) => {
        if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
            console.log(`  [${index}] ${el.tagName} name="${el.name}" type="${el.type}" id="${el.id}"`);
        }
    });

    let insufficientCheckbox = form.querySelector('input[name="insufficient_address_proof"]');
    
    if (!insufficientCheckbox) {
        console.log("Checkbox not found by name, trying other selectors...");
        insufficientCheckbox = form.querySelector('input[type="checkbox"][id*="insufficient"]');
        if (!insufficientCheckbox) {
            insufficientCheckbox = form.querySelector('input[type="checkbox"]');
        }
    }

    if (insufficientCheckbox) {
        console.log(" Found insufficient address proof checkbox");
        console.log(`  Checkbox details: name="${insufficientCheckbox.name}", id="${insufficientCheckbox.id}", checked=${insufficientCheckbox.checked}, value="${insufficientCheckbox.value}"`);
        
        const fileInput = form.querySelector('input[name="address_proof_file"]');
        if (fileInput) {
            fileInput.disabled = insufficientCheckbox.checked;
            fileInput.required = !insufficientCheckbox.checked;
            console.log(`Initial file input state - disabled: ${fileInput.disabled}, required: ${fileInput.required}`);
        } else {
            console.error(" File input not found!");
            const allFileInputs = form.querySelectorAll('input[type="file"]');
            console.log("All file inputs found:", allFileInputs.length);
            allFileInputs.forEach((input, i) => {
                console.log(`  File input [${i}]: name="${input.name}"`);
            });
        }
        
        const checkboxHandler = (e) => {
            console.log("🔘 Insufficient address proof checkbox changed:", e.target.checked);
            const fileInput = form.querySelector('input[name="address_proof_file"]');
            if (fileInput) {
                fileInput.disabled = e.target.checked;
                fileInput.required = !e.target.checked;
                if (e.target.checked) {
                    fileInput.value = '';
                    console.log("📄 Cleared address proof file input");
                }
                console.log(`📄 Address proof file input - disabled: ${fileInput.disabled}, required: ${fileInput.required}`);
            }
        };
        
        insufficientCheckbox.removeEventListener('change', checkboxHandler);
        insufficientCheckbox.addEventListener('change', checkboxHandler);
        insufficientCheckbox.addEventListener('click', function(e) {
            setTimeout(() => {
                const changeEvent = new Event('change', { bubbles: true });
                this.dispatchEvent(changeEvent);
            }, 0);
        });
        
    } else {
        console.error(" EMERGENCY: Insufficient address proof checkbox NOT FOUND!");
        console.log(" Creating checkbox dynamically...");
        const addressProofSection = form.querySelector('#addressProofUpload');
        if (addressProofSection) {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'form-field col-span-full mt-3';
            checkboxContainer.innerHTML = `
                <div class="form-check insufficient-doc-check">
                    <input type="checkbox" 
                           name="insufficient_address_proof" 
                           class="form-check-input" 
                           value="1"
                           id="insufficient_address">
                    <label class="form-check-label" for="insufficient_address">
                        Insufficient Address Proof
                    </label>
                </div>
                <small class="text-muted">Check if address proof document is unavailable</small>
            `;
            addressProofSection.parentNode.insertBefore(checkboxContainer, addressProofSection.nextSibling);
            
            insufficientCheckbox = form.querySelector('input[name="insufficient_address_proof"]');
            if (insufficientCheckbox) {
                console.log("✅ Dynamically created checkbox");
                
                const fileInput = form.querySelector('input[name="address_proof_file"]');
                if (fileInput) {
                    const checkboxHandler = (e) => {
                        console.log("🔘 Dynamically created checkbox changed:", e.target.checked);
                        fileInput.disabled = e.target.checked;
                        fileInput.required = !e.target.checked;
                        if (e.target.checked) {
                            fileInput.value = '';
                        }
                    };
                    insufficientCheckbox.addEventListener('change', checkboxHandler);
                }
            }
        }
    }

    const saveDraftBtn = form.querySelector('.save-draft-btn[data-page="contact"]');
    if (saveDraftBtn) {
        console.log("💾 Save draft button found");
        this.addEventListener(saveDraftBtn, 'click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("💾 Save draft clicked");
            this.saveDraft();
        });
    } else {
        console.warn("⚠️ Save draft button not found");
    }

    const nextBtn = document.querySelector('.external-submit-btn[data-form="contactForm"]');
    if (nextBtn) {
        console.log("➡️ Next button found");
        this.addEventListener(nextBtn, 'click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("➡️ Next button clicked");
            this.submitForm();
        });
    } else {
        console.warn(" Next button not found");
    }

    const prevBtn = document.querySelector('.prev-btn[data-form="contactForm"]');
    if (prevBtn) {
        console.log("Previous button found");
        this.addEventListener(prevBtn, 'click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("Previous button clicked");
            if (window.Router) {
                Router.navigateTo('identification');
            } else {
                window.location.href = '/candidate/identification.php';
            }
        });
    }

    window.testContactCheckbox = () => {
        const checkbox = form.querySelector('input[name="insufficient_address_proof"]');
        const fileInput = form.querySelector('input[name="address_proof_file"]');
        
        if (!checkbox) {
            console.error(" Checkbox not found in test!");
            return false;
        }
        
        console.log(" TEST: Toggling checkbox...");
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
        
        console.log("Checkbox checked:", checkbox.checked);
        if (fileInput) {
            console.log("File input disabled:", fileInput.disabled);
            console.log("File input required:", fileInput.required);
        }
        
        return true;
    };
    
    console.log("✅ Contact form handlers initialized. Run testContactCheckbox() to test.");
}

    static validateForm(isFinalSubmit = false) {
        console.log(`📋 Validating contact form (isFinalSubmit: ${isFinalSubmit})`);
        
        const form = document.getElementById('contactForm');
        if (!form) {
            console.error("❌ Contact form not found for validation");
            return false;
        }

        let isValid = true;
        const errors = [];
        const insufficientCheckbox = form.querySelector('input[name="insufficient_address_proof"]');
        const isInsufficient = insufficientCheckbox && insufficientCheckbox.checked;
        
        console.log(`Insufficient documents: ${isInsufficient}`);
        
        if (isFinalSubmit) {
            const addressProofFile = form.querySelector('input[name="address_proof_file"]');
        }

        const currentRequiredFields = [
            { name: 'current_address1', label: 'Current Address Line 1' },
            { name: 'current_city', label: 'Current City' },
            { name: 'current_state', label: 'Current State' },
            { name: 'current_country', label: 'Current Country' },
            { name: 'current_postal_code', label: 'Current Postal Code' }
        ];

        currentRequiredFields.forEach(field => {
            const input = form.querySelector(`[name="${field.name}"]`);
            if (input && !input.disabled && !input.value.trim()) {
                errors.push(`${field.label} is required`);
            }
        });

        const sameCheckbox = document.getElementById('sameAsCurrent');
        const isSameAddress = sameCheckbox && sameCheckbox.checked;
        
        console.log("📍 Is same address:", isSameAddress);
        
        if (!isSameAddress) {
            const permanentRequiredFields = [
                { name: 'permanent_address1', label: 'Permanent Address Line 1' },
                { name: 'permanent_city', label: 'Permanent City' },
                { name: 'permanent_state', label: 'Permanent State' },
                { name: 'permanent_country', label: 'Permanent Country' },
                { name: 'permanent_postal_code', label: 'Permanent Postal Code' }
            ];

            permanentRequiredFields.forEach(field => {
                const input = form.querySelector(`[name="${field.name}"]`);
                if (input && !input.disabled && !input.value.trim()) {
                    errors.push(`${field.label} is required`);
                }
            });
        }

        if (errors.length > 0) {
            isValid = false;
            console.error("❌ Validation errors:", errors);
            alert("Please fix the following errors:\n\n" + errors.join('\n'));
        } else {
            console.log("✅ Contact form validation passed");
        }

        return isValid;
    }

    static getApiEndpoint() {
        return `${window.APP_BASE_URL}/api/candidate/store_contact.php`;
    }

    static async saveDraft() {
        console.log("💾 Starting Contact.saveDraft()");
        
        const form = document.getElementById('contactForm');
        if (!form) {
            console.error("❌ Contact form not found");
            return;
        }
        
        const formData = new FormData(form);
        formData.append('draft', '1');

        const endpoint = this.getApiEndpoint();
        console.log(`📤 Saving draft to: ${endpoint}`);

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
                alert('✅ Draft saved successfully!');
            } else {
                alert('❌ Error: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('❌ Save draft error:', err);
            alert('❌ Error: ' + err.message);
        }
    }

    static async submitForm() {
        console.log("🚀 Starting Contact.submitForm()");
        
        if (!this.validateForm(true)) {
            console.log("❌ Validation failed");
            return;
        }

        const form = document.getElementById('contactForm');
        if (!form) {
            console.error("❌ Contact form not found");
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

            console.log("Response status:", response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned ${response.status} (not JSON)`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log("Form submitted successfully!");            
                if (window.Router && Router.markCompleted) {
                    Router.markCompleted('contact');
                    Router.updateProgress();
                }
                
                if (window.Router && Router.navigateTo) {
                    const nextPage = Router.getNextPage ? Router.getNextPage('contact') : 'education';
                    console.log(`Navigating to: ${nextPage}`);
                    setTimeout(() => Router.navigateTo(nextPage), 500);
                }
            } else {
                alert('Save failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Error: ' + err.message);
        }
    }
    
    static cleanup() {
        console.log("🧹 Contact.cleanup() called");
        this.cleanupEventListeners();
        this._initialized = false;
        this._savedData = null;
    }
}


if (typeof window !== 'undefined') {
    window.Contact = Contact;
}