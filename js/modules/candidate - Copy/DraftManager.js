// /js/modules/candidate/DraftManager.js
class DraftManager {
    static DRAFT_KEY_PREFIX = 'draft-';
    
    static init() {
        console.log('📝 Draft Manager initialized');
        
        // Only set up beforeunload handler
        window.addEventListener('beforeunload', this.emergencySave.bind(this));
    }
    
    static getFormData(pageId) {
        const form = document.getElementById(`${pageId}Form`);
        if (!form) return null;
        
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object (excluding files)
        for (const [key, value] of formData.entries()) {
            if (!(value instanceof File)) {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    static saveToLocalStorage(pageId, data) {
        try {
            localStorage.setItem(`${this.DRAFT_KEY_PREFIX}${pageId}`, JSON.stringify(data));
            localStorage.setItem(`${this.DRAFT_KEY_PREFIX}${pageId}-timestamp`, Date.now());
            
            console.log(`💾 Draft saved locally: ${pageId}`);
        } catch (e) {
            console.error('❌ Local storage save failed:', e);
        }
    }
    
    static async saveToDatabase(pageId, isManual = false) {
        try {
            const form = document.getElementById(`${pageId}Form`);
            if (!form) {
                console.warn(`No form found for ${pageId}`);
                return false;
            }
            
            const formData = new FormData(form);
            
            // Add draft metadata
            formData.append('save_draft', '1');
            if (!isManual) {
                formData.append('save_type', 'auto');
            }
            
            // Get API endpoint
            let endpoint;
            if (window.Router && Router.getApiEndpoint) {
                endpoint = Router.getApiEndpoint(pageId);
            }
            
            if (!endpoint) {
                endpoint = `/api/candidate/store_${pageId.replace('-', '')}.php`;
            }
            
            console.log(`📤 Saving draft to: ${endpoint}`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Draft saved to DB: ${pageId} (${isManual ? 'manual' : 'auto'})`);
                
                // Clear local draft after successful DB save if manual
                if (isManual) {
                    this.clearLocalDraft(pageId);
                }
                return true;
            } else {
                throw new Error(result.message || 'Save failed');
            }
            
        } catch (error) {
            console.error(`❌ DB draft save failed for ${pageId}:`, error);
            return false;
        }
    }
    
    // Manual save only - no auto-save
    static async manualSaveDraft(pageId) {
        console.log(`👆 Manual draft save requested for ${pageId}`);
        
        const success = await this.saveToDatabase(pageId, true);
        
        if (success) {
            localStorage.setItem(`${this.DRAFT_KEY_PREFIX}${pageId}-manual-timestamp`, Date.now());
            
            // Show success message
            if (window.App?.showToast) {
                App.showToast('Draft saved successfully!', 'success');
            } else {
                alert('Draft saved successfully!');
            }
        }
        
        return success;
    }
    
    static loadDraft(pageId) {
        // Try to load from local storage
        const localDraft = localStorage.getItem(`${this.DRAFT_KEY_PREFIX}${pageId}`);
        if (!localDraft) return;
        
        try {
            const data = JSON.parse(localDraft);
            const form = document.getElementById(`${pageId}Form`);
            if (!form) return;
            
            // Restore form values
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (!input) return;
                
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = data[key] === input.value;
                } else {
                    input.value = data[key];
                }
            });
            
            console.log(`🔄 Local draft restored for ${pageId}`);
            
        } catch (e) {
            console.error('❌ Draft load error:', e);
        }
    }
    
    static clearLocalDraft(pageId) {
        localStorage.removeItem(`${this.DRAFT_KEY_PREFIX}${pageId}`);
        localStorage.removeItem(`${this.DRAFT_KEY_PREFIX}${pageId}-timestamp`);
        localStorage.removeItem(`${this.DRAFT_KEY_PREFIX}${pageId}-manual-timestamp`);
        localStorage.removeItem(`${this.DRAFT_KEY_PREFIX}${pageId}-auto-timestamp`);
    }
    
    static clearAllDrafts() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.DRAFT_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    static emergencySave() {
        const pageId = Router?.currentPage;
        if (!pageId || pageId === 'success') return;
        
        const data = this.getFormData(pageId);
        if (data) {
            this.saveToLocalStorage(pageId, data);
        }
    }
}

// Initialize with delay to avoid conflicts
setTimeout(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            DraftManager.init();
        });
    } else {
        DraftManager.init();
    }
}, 1000);