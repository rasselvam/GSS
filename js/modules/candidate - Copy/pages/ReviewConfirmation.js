class ReviewConfirmation {
    
    static init() {
        console.log("📝 ReviewConfirmation module initialized");
        
        // Run validation setup
        this.setupValidation();
    }
    
    static setupValidation() {
        const agreeCheck = document.getElementById('agreeCheck');
        const signatureInput = document.getElementById('digitalSignature');
        const submitBtn = document.getElementById('submitFinalBtn');
        const form = document.getElementById('review-confirmationForm');
        
        // Safety check
        if (!agreeCheck || !signatureInput || !submitBtn || !form) {
            console.error("ReviewConfirmation: Missing required elements", {
                agreeCheck, signatureInput, submitBtn, form
            });
            return;
        }
        
        console.log("Validation elements found — setting up");

        const validate = () => {
            const isValid = agreeCheck.checked && signatureInput.value.trim().length >= 3;
            
            submitBtn.disabled = !isValid;
            
            // Visual feedback
            if (isValid) {
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
                console.log("Button ENABLED");
            } else {
                submitBtn.style.opacity = '0.6';
                submitBtn.style.cursor = 'not-allowed';
                console.log("Button disabled — waiting for checkbox & signature");
            }
        };
        
        // Listeners
        agreeCheck.addEventListener('change', validate);
        signatureInput.addEventListener('input', validate);
        signatureInput.addEventListener('paste', validate);
        
        // Initial check
        validate();

        // Critical: Click handler to trigger form submit
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!submitBtn.disabled) {
                console.log("Start Application clicked — submitting form");
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        });
    }
}

// Export
window.ReviewConfirmation = ReviewConfirmation;