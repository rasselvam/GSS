class ReviewConfirmation {
    
    // Simple notification helper
    static showNotification(message, type = "info") {
        if (typeof window.showAlert === "function") {
            window.showAlert({ type, message });
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    static init() {
        console.log("📝 ReviewConfirmation module initialized");
        this.setupValidation();
    }
    
    static setupValidation() {
        const agreeCheck = document.getElementById('agreeCheck');
        const signatureInput = document.getElementById('digitalSignature');
        const submitBtn = document.getElementById('submitFinalBtn');
        
        if (!agreeCheck || !signatureInput || !submitBtn) return;
        
        const validate = () => {
            const isValid = agreeCheck.checked && signatureInput.value.trim().length >= 3;
            submitBtn.disabled = !isValid;
            
            // Show hints
            if (!isValid) {
                if (!agreeCheck.checked && signatureInput.value.trim().length >= 3) {
                    this.showNotification("Check agreement checkbox", "info");
                } else if (agreeCheck.checked && signatureInput.value.trim().length < 3) {
                    this.showNotification("Enter your full name", "info");
                }
            }
        };
        
        // Event listeners
        agreeCheck.addEventListener('change', validate);
        signatureInput.addEventListener('input', validate);
        
        // Submit handler
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (submitBtn.disabled) {
                this.showNotification("Please complete all required fields", "warning");
                return;
            }
            
            this.showNotification("✅ Starting application...", "success");
            
            // Mark as completed
            if (window.Router && window.Router.markCompleted) {
                Router.markCompleted('review-confirmation');
            } else {
                localStorage.setItem('completed-review-confirmation', '1');
            }
            
            // Navigate
            setTimeout(() => {
                if (window.Router && window.Router.navigateTo) {
                    Router.navigateTo('basic-details');
                } else {
                    window.location.href = '?page=basic-details';
                }
            }, 800);
        });
        
        validate(); // Initial validation
    }
}

window.ReviewConfirmation = ReviewConfirmation;