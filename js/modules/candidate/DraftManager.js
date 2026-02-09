// /js/modules/candidate/DraftManager.js

class DraftManager {
    static DRAFT_KEY_PREFIX = 'draft-';

    static storagePrefix() {
        const appId = (window.CANDIDATE_APP_ID || '').toString().trim();
        return appId ? (`candidate:${appId}:`) : 'candidate:';
    }

    /**
     * Pages where drafts are allowed
     * IMPORTANT: Do NOT add basic-details or contact here
     */
    static DRAFT_ENABLED_PAGES = [
        'identification',
        'education',
        'employment',
        'reference',
        'ecourt'
    ];

    /* ================= INIT ================= */

    static init() {
        console.log('📝 DraftManager initialized');

        // Emergency local save ONLY
        window.addEventListener('beforeunload', this.emergencySave.bind(this));
    }

    /* ================= HELPERS ================= */

    static isDraftAllowed(pageId) {
        return this.DRAFT_ENABLED_PAGES.includes(pageId);
    }

    static getCurrentPage() {
        return window.Router?.currentPage || null;
    }

    static getForm(pageId) {
        return document.getElementById(`${pageId}Form`);
    }

    /* ================= LOCAL STORAGE ================= */

    static getFormData(pageId) {
        const form = this.getForm(pageId);
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            if (!(value instanceof File)) {
                data[key] = value;
            }
        }

        return data;
    }

    static saveToLocalStorage(pageId, data) {
        try {
            localStorage.setItem(
                `${this.storagePrefix()}${this.DRAFT_KEY_PREFIX}${pageId}`,
                JSON.stringify(data)
            );
            localStorage.setItem(
                `${this.storagePrefix()}${this.DRAFT_KEY_PREFIX}${pageId}-timestamp`,
                Date.now()
            );

            console.log(`💾 Local draft saved: ${pageId}`);
        } catch (e) {
            console.error('❌ Local draft save failed:', e);
        }
    }

    static loadDraft(pageId) {
        if (!this.isDraftAllowed(pageId)) return;

        const raw = localStorage.getItem(`${this.storagePrefix()}${this.DRAFT_KEY_PREFIX}${pageId}`);
        if (!raw) return;

        try {
            const data = JSON.parse(raw);
            const form = this.getForm(pageId);
            if (!form) return;

            Object.entries(data).forEach(([key, value]) => {
                const input = form.querySelector(`[name="${key}"]`);
                if (!input) return;

                if (input.type === 'checkbox') {
                    input.checked = value === '1' || value === true;
                } else if (input.type === 'radio') {
                    input.checked = input.value === value;
                } else {
                    input.value = value;
                }
            });

            console.log(`🔄 Draft restored for ${pageId}`);
        } catch (e) {
            console.error('❌ Draft restore failed:', e);
        }
    }

    static clearLocalDraft(pageId) {
        localStorage.removeItem(`${this.storagePrefix()}${this.DRAFT_KEY_PREFIX}${pageId}`);
        localStorage.removeItem(`${this.storagePrefix()}${this.DRAFT_KEY_PREFIX}${pageId}-timestamp`);
    }

    /* ================= DATABASE SAVE ================= */

    static async manualSaveDraft(pageId) {
        if (!this.isDraftAllowed(pageId)) {
            console.warn(`🚫 Draft not allowed for ${pageId}`);
            return false;
        }

        const form = this.getForm(pageId);
        if (!form) return false;

        try {
            const formData = new FormData(form);
            formData.append('save_draft', '1');

            let endpoint = null;

            if (window.Router?.getApiEndpoint) {
                endpoint = Router.getApiEndpoint(pageId);
            }

            if (!endpoint) {
                endpoint = `/api/candidate/store_${pageId.replace('-', '')}.php`;
            }

            console.log(`📤 Saving draft to DB: ${endpoint}`);

            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || 'Draft save failed');
            }

            this.clearLocalDraft(pageId);

            if (typeof window.showAlert === 'function') {
                window.showAlert({ type: 'success', message: 'Draft saved successfully' });
            }
            return true;

        } catch (err) {
            console.error('❌ Draft DB save failed:', err);
            if (typeof window.showAlert === 'function') {
                window.showAlert({ type: 'error', message: 'Failed to save draft' });
            }
            return false;
        }
    }

    /* ================= EMERGENCY SAVE ================= */

    static emergencySave() {
        const pageId = this.getCurrentPage();

        if (!pageId) return;
        if (!this.isDraftAllowed(pageId)) return;
        if (pageId === 'success') return;

        const data = this.getFormData(pageId);
        if (data) {
            this.saveToLocalStorage(pageId, data);
        }
    }
}

/* ================= AUTO INIT ================= */

setTimeout(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DraftManager.init());
    } else {
        DraftManager.init();
    }
}, 500);

window.DraftManager = DraftManager;
