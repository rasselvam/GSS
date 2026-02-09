class Router {
    static currentPage = "review-confirmation";
    static pageCache = new Map();
    static isInitialized = false;
    
    static pageOrder = [
        "review-confirmation",
        "basic-details",
        "identification",
        "contact",
        "education",
        "employment",
        "reference",
        "success"
    ];

    static pageManagers = {
        "identification": null,
        "education": null,
        "employment": null,
        "reference": null
    };

    static selfHandledPages = ["identification", "basic-details", "contact", "education", "employment", "reference", "success"];
    
    // Track event listeners for cleanup
    static stepStripListeners = new Map();

    static init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        console.log("🚀 Router initialized - SEQUENTIAL NAVIGATION ENABLED");

        // Initial sidebar setup
        this.bindStepStrip();

        const params = new URLSearchParams(window.location.search);
        const urlPage = params.get("page");

        // Get the appropriate starting page based on progress
        const startPage = this.getCurrentAllowedPage(urlPage);
        
        this.navigateTo(startPage, !urlPage);
        
        window.onpopstate = (e) => {
            const page = e.state?.page || this.getCurrentAllowedPage();
            this.navigateTo(page, false);
        };
    }

    // Completely rebuild step strip with proper sequential access control
    static bindStepStrip() {
        const strip = document.getElementById("stepStrip");
        if (!strip) return;

        console.log("🔄 Binding step strip with sequential access control");

        // Remove all existing event listeners first
        this.cleanupStepStripListeners();

        const allowedPages = this.getAllowedPages();
        
        strip.querySelectorAll(".step-item").forEach((item, index) => {
            const pageId = item.dataset.page;
            if (!pageId) return;
            
            const isAllowed = allowedPages.includes(pageId);
            const isCompleted = localStorage.getItem(`completed-${pageId}`) === "1";
            const isCurrent = this.currentPage === pageId;
            
            // Clear any existing classes
            item.classList.remove("disabled-step", "current-step", "completed-step", "allowed-step");
            
            // Remove any existing click handlers
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Add appropriate classes
            if (isCurrent) {
                newItem.classList.add("current-step");
            }
            
            if (isCompleted) {
                newItem.classList.add("completed-step");
            }
            
            if (isAllowed) {
                newItem.classList.add("allowed-step");
                newItem.style.cursor = "pointer";
                newItem.style.pointerEvents = "auto";
                
                // Add click handler for allowed pages
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Step clicked: ${pageId} (allowed)`);
                    this.navigateTo(pageId);
                };
                
                newItem.addEventListener("click", clickHandler);
                this.stepStripListeners.set(newItem, clickHandler);
            } else {
                newItem.classList.add("disabled-step");
                newItem.style.cursor = "not-allowed";
                newItem.style.pointerEvents = "none";
                
                // Add tooltip for disabled steps
                if (!isCompleted) {
                    newItem.title = "Complete previous steps first";
                }
            }
            
            // Update visual indicators
            const stepNumber = newItem.querySelector('.step-number');
            if (stepNumber) {
                if (isCompleted) {
                    stepNumber.innerHTML = '<i class="fas fa-check"></i>';
                    stepNumber.classList.add("completed-icon");
                } else {
                    stepNumber.innerHTML = (index + 1).toString();
                    stepNumber.classList.remove("completed-icon");
                }
            }
        });
    }

    static cleanupStepStripListeners() {
        this.stepStripListeners.forEach((handler, element) => {
            if (element && element.removeEventListener) {
                element.removeEventListener("click", handler);
            }
        });
        this.stepStripListeners.clear();
    }

    // Get the page user should be on based on their progress
    static getCurrentAllowedPage(requestedPage = null) {
        const allowedPages = this.getAllowedPages();
        
        // If user requests a specific page, check if it's allowed
        if (requestedPage && allowedPages.includes(requestedPage)) {
            return requestedPage;
        }
        
        // Otherwise, return the most advanced page they can access
        return allowedPages[allowedPages.length - 1] || "review-confirmation";
    }

static getAllowedPages() {
    const allowed = [];
    const countablePages = this.pageOrder.filter(p => 
        p !== "review-confirmation" && p !== "success"
    );
    
    // Always allow review-confirmation
    allowed.push("review-confirmation");
    
    // Find the first incomplete page
    for (let i = 0; i < countablePages.length; i++) {
        const page = countablePages[i];
        const isCompleted = localStorage.getItem(`completed-${page}`) === "1";
        
        allowed.push(page); // Allow access to this page
        
        if (!isCompleted) {
            break; // Stop at the first incomplete page
        }
    }
    
    // If all pages are completed, allow success page
    const allCompleted = countablePages.every(page => 
        localStorage.getItem(`completed-${page}`) === "1"
    );
    
    if (allCompleted) {
        allowed.push("success");
    }
    
    console.log("✅ Allowed pages:", allowed);
    return allowed;
}

    static async navigateTo(pageId, pushState = true) {
        try {
            console.log("🔄 Attempting navigation to:", pageId);
            
            // STRICT CHECK: Verify this page is allowed
            const allowedPages = this.getAllowedPages();
            
            if (!allowedPages.includes(pageId)) {
                console.warn(`⛔ ACCESS DENIED to ${pageId}. Allowed pages:`, allowedPages);
                
                // Find what page they should be on
                const correctPage = this.getCurrentAllowedPage();
                
                // Only redirect if they're trying to access a disallowed page
                if (pageId !== correctPage) {
                    const attemptedIndex = this.pageOrder.indexOf(pageId);
                    const allowedIndex = this.pageOrder.indexOf(correctPage);
                    
                    if (attemptedIndex > allowedIndex) {
                        alert("⚠️ Please complete the current step before proceeding to later steps.");
                    }
                    
                    // Update URL without pushState to prevent back button issues
                    window.history.replaceState({ page: correctPage }, "", `?page=${correctPage}`);
                    
                    // Load the correct page
                    return await this.loadPageContent(correctPage);
                }
                
                return;
            }
            
            // Clean up previous page
            await this.cleanupPreviousPage();
            
            // Update current page
            this.currentPage = pageId;
            
            // Update URL
            if (pushState) {
                history.pushState({ page: pageId }, "", `?page=${pageId}`);
            }
            
            // Load the page content
            await this.loadPageContent(pageId);
            
            // Re-bind step strip with updated permissions
            this.bindStepStrip();
            
            console.log("✅ Navigation completed:", pageId);
            
        } catch (error) {
            console.error("❌ Navigation error:", error);
            alert("Page failed to load: " + error.message);
        }
    }

    static async cleanupPreviousPage() {
        const previousPage = this.currentPage;
        
        // Clean up tab managers
        if (previousPage && this.pageManagers[previousPage]) {
            const manager = this.pageManagers[previousPage];
            if (typeof manager.cleanup === 'function') {
                console.log(`🧹 Cleaning up ${previousPage} manager`);
                manager.cleanup();
                this.pageManagers[previousPage] = null;
            }
        }

        // Clean up legacy modules
        const legacyModules = {
            "identification": window.Identification,
            "education": window.Education,
            "employment": window.Employment,
            "reference": window.Reference,
            "basic-details": window.BasicDetails,
            "contact": window.Contact
        };

        const legacyModule = legacyModules[previousPage];
        if (legacyModule && typeof legacyModule.cleanup === 'function') {
            console.log(`🧹 Cleaning up legacy ${previousPage} module`);
            legacyModule.cleanup();
        }
    }

    static async loadPageContent(pageId) {
        const container = document.getElementById("page-content");
        if (!container) {
            console.error("#page-content not found in DOM");
            return;
        }

        let basePath = '';
        
        if (typeof window.APP_BASE_URL !== 'undefined' && window.APP_BASE_URL) {
            basePath = window.APP_BASE_URL;
        }
        
        basePath = basePath.replace(/\/$/, '');
        
        const url = `${basePath}/modules/candidate/${pageId}.php?t=${Date.now()}`;
        
        console.log(`📡 Fetching page from: ${url}`);

        try {
            const response = await fetch(url, { credentials: "include" });

            if (!response.ok) {
                console.error(`API Error ${response.status}: ${url}`);
                const fallbackUrl = `${basePath}/modules/candidate/${pageId}?t=${Date.now()}`;
                console.log(` Trying fallback 1: ${fallbackUrl}`);
                
                const fallbackResponse = await fetch(fallbackUrl, { credentials: "include" });
                if (fallbackResponse.ok) {
                    const html = await fallbackResponse.text();
                    container.innerHTML = html;
                    this.pageCache.set(pageId, html);
                    await this.initializePage(pageId);
                    return;
                }
            
                const apiUrl = `${basePath}/api/candidate/index.php?action=load_page&page=${pageId}&t=${Date.now()}`;
                console.log(`Trying fallback 2 (API): ${apiUrl}`);
                
                const apiResponse = await fetch(apiUrl, { credentials: "include" });
                if (apiResponse.ok) {
                    const html = await apiResponse.text();
                    container.innerHTML = html;
                    this.pageCache.set(pageId, html);
                    await this.initializePage(pageId);
                    return;
                }
                
                if (pageId === "success") {
                    container.innerHTML = `
                        <div class="text-center py-5">
                            <div class="mb-4">
                                <i class="fas fa-check-circle text-success fa-5x"></i>
                            </div>
                            <h3 class="mb-3">Application Submitted Successfully!</h3>
                            <p class="text-muted">Your background verification form has been submitted.</p>
                        </div>
                    `;
                    await this.initializePage(pageId);
                    return;
                }
                
                container.innerHTML = `
                    <div class="container py-5">
                        <div class="alert alert-danger">
                            <h4>Unable to load page: ${pageId}</h4>
                            <p>The system could not find: <code>${url}</code></p>
                            <p>Status: HTTP ${response.status}</p>
                            <button class="btn btn-primary mt-3" onclick="Router.navigateTo('${pageId}')">
                                <i class="fas fa-redo"></i> Try Again
                            </button>
                            <button class="btn btn-secondary mt-3 ms-2" onclick="Router.navigateTo('review-confirmation')">
                                <i class="fas fa-home"></i> Go to Home
                            </button>
                        </div>
                    </div>
                `;
                
                throw new Error(`HTTP ${response.status}: Could not load ${pageId} from any source`);
            }

            const html = await response.text();
            container.innerHTML = html;

            this.pageCache.set(pageId, html);

            await this.initializePage(pageId);
            
        } catch (error) {
            console.error(" Load error:", error);
            throw error; 
        }
    }

    static async initializePage(pageId) {
        console.log(`🛠 Initializing page: ${pageId}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.initializePageModule(pageId);
        if (!this.selfHandledPages.includes(pageId)) {
            console.log(`🔗 Router binding handlers for ${pageId}`);
            this.bindGenericFormHandlers(pageId);
        } else {
            console.log(` ${pageId} is self-handled - Router WILL NOT bind any handlers`);
        }
        this.updateSidebar(pageId);
        this.updateProgress();
        this.initAutoExpandingTextareas();

        return true;
    }

    static async initializePageModule(pageId) {
        console.log(` Initializing page module: ${pageId}`);
        const pageModules = {
            "basic-details": window.BasicDetails,
            "identification": window.Identification,
            "contact": window.Contact,
            "education": window.Education,
            "employment": window.Employment,
            "reference": window.Reference,
            "review-confirmation": window.ReviewConfirmation,
            "success": window.Success
        };

        const module = pageModules[pageId];
        
        if (!module) {
            console.warn(`⚠️ No module found for page: ${pageId}`);
            
            if (pageId === "success") {
                console.log("🔍 Checking for dynamically loaded Success module...");
                await new Promise(resolve => setTimeout(resolve, 500));
                if (window.Success) {
                    console.log("✅ Success module loaded dynamically, calling init()");
                    if (typeof window.Success.init === 'function') {
                        window.Success.init();
                    }
                    return true;
                }
            }
            
            return false;
        }

        console.log(`✅ Found module for ${pageId}`);

        try {
            if (["education", "employment", "identification", "reference"].includes(pageId)) {
                return await this.initializeTabManagerPage(pageId, module);
            }
            if (typeof module.onPageLoad === 'function') {
                console.log(`🎬 Calling ${pageId}.onPageLoad()`);
                module.onPageLoad();
                return true;
            }
            if (typeof module.init === 'function') {
                console.log(`🎬 Calling ${pageId}.init()`);
                module.init();
                return true;
            }
            
            console.log(`No initialization method found for ${pageId}`);
            return false;
            
        } catch (error) {
            console.error(` Error initializing ${pageId}:`, error);
            return false;
        }
    }

    static async initializeTabManagerPage(pageId, module) {
        try {
            console.log(`Initializing TabManager page: ${pageId}`);
            const managerClass = {
                "education": window.EducationManager,
                "employment": window.EmploymentManager,
                "identification": window.IdentificationManager,
                "reference": window.ReferenceManager
            }[pageId];
            
            if (managerClass) {
                console.log(` Using Manager class for ${pageId}`);
                if (this.pageManagers[pageId]) {
                    this.pageManagers[pageId].cleanup();
                }
                this.pageManagers[pageId] = new managerClass();
                if (typeof this.pageManagers[pageId].init === 'function') {
                    await this.pageManagers[pageId].init();
                    return true;
                }
            }
            console.log(` Falling back to legacy methods for ${pageId}`);
            
            if (typeof module.onPageLoad === 'function') {
                console.log(` Calling legacy ${pageId}.onPageLoad()`);
                module.onPageLoad();
                return true;
            }
            
            if (typeof module.init === 'function') {
                console.log(` Calling legacy ${pageId}.init()`);
                module.init();
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error(`Error initializing TabManager page ${pageId}:`, error);
            return false;
        }
    }

    static bindGenericFormHandlers(pageId) {
        console.log(`🔍 Router.bindGenericFormHandlers called for: ${pageId}`);
        
        const form = document.getElementById(`${pageId}Form`);
        if (!form) {
            console.warn(`Form not found: ${pageId}Form`);
            return;
        }

        if (form.dataset.routerBound === 'true') {
            console.log(` Form already bound by router`);
            return;
        }

        console.log(`Binding generic form handlers for ${pageId}`);
        form.addEventListener('submit', async (e) => {
            console.log(`📝 Router handling form submit for ${pageId}`);
            e.preventDefault();
            await this.handleGenericFormSubmission(form, pageId);
        });

        const nextBtn = document.querySelector(`.external-submit-btn[data-form="${pageId}Form"]`);
        console.log(` Next button search for ${pageId}:`, nextBtn);
        if (nextBtn) {
            console.log(` Found Next button for ${pageId}:`, nextBtn.outerHTML);
            if (!nextBtn.dataset.routerBound) {
                nextBtn.dataset.routerBound = "true";
                nextBtn.addEventListener("click", async (e) => {
                    console.log(` Router Next button clicked for ${pageId}`);
                    e.preventDefault();
                    await this.handleGenericFormSubmission(form, pageId);
                });
                console.log(` Router bound click handler to Next button`);
            } else {
                console.log(` Next button already router-bound`);
            }
        } else {
            console.warn(`Next button not found for ${pageId}`);
        }

        const prevBtn = document.querySelector(`.prev-btn[data-form="${pageId}Form"]`);
        console.log(`Previous button search for ${pageId}:`, prevBtn);
        if (prevBtn && !prevBtn.dataset.routerBound) {
            prevBtn.dataset.routerBound = "true";
            prevBtn.addEventListener("click", (e) => {
                console.log(`Router Previous button clicked for ${pageId}`);
                e.preventDefault();
                const prevPage = this.getPreviousPage(pageId);
                if (prevPage) {
                    this.navigateTo(prevPage);
                }
            });
        }

        form.dataset.routerBound = 'true';
        console.log(` Router handlers bound for ${pageId}`);
    }

    static async handleGenericFormSubmission(form, pageId) {
        try {
            const formData = new FormData(form);
            const endpoint = this.getApiEndpoint(pageId);
            console.log(`Submitting ${pageId} to ${endpoint}`);

            const res = await fetch(endpoint, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.message || "Save failed");
            }
            this.markCompleted(pageId);
            this.updateProgress();
            this.pageCache.delete(pageId);
            if (window.Forms && typeof Forms.clearDraft === 'function') {
                Forms.clearDraft(pageId);
            }
            const nextPage = this.getNextPage(pageId);
            if (nextPage) {
                console.log(`➡️ Navigating to next page: ${nextPage}`);
                setTimeout(() => this.navigateTo(nextPage), 400);
            }

        } catch (err) {
            console.error(" Submission error:", err);
            alert("Error: " + err.message);
        }
    }

    static getPreviousPage(pageId) {
        const index = this.pageOrder.indexOf(pageId);
        if (index > 0) {
            return this.pageOrder[index - 1];
        }
        return null;
    }

    static getNextPage(pageId) {
        const index = this.pageOrder.indexOf(pageId);
        if (index === -1 || index >= this.pageOrder.length - 2) {
            return "success";
        }
        return this.pageOrder[index + 1];
    }

    static getApiEndpoint(pageId) {
        const map = {
            "basic-details": "/api/candidate/store_basic-details.php",
            "identification": "/api/candidate/store_identification.php",
            "contact": "/api/candidate/store_contact.php",
            "education": "/api/candidate/store_education.php",
            "employment": "/api/candidate/store_employment.php",
            "reference": "/api/candidate/store_reference.php",
            "review-confirmation": "/api/candidate/store_authorization.php"
        };
        
        let endpoint = map[pageId] || `/api/candidate/store_${pageId.replace('-', '_')}.php`;
        
        console.log(`🔗 Raw API endpoint for ${pageId}: ${endpoint}`);
        
        if (typeof window.APP_BASE_URL !== 'undefined' && window.APP_BASE_URL && window.APP_BASE_URL !== '/') {
            endpoint = window.APP_BASE_URL + endpoint;
            console.log(`Final API endpoint for ${pageId}: ${endpoint}`);
        }
        
        return endpoint;
    }

    static initAutoExpandingTextareas() {
        document.querySelectorAll('textarea').forEach(textarea => {
            if (textarea.dataset.autoExpandBound) return;
            textarea.dataset.autoExpandBound = "1";

            const adjust = () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            };

            textarea.addEventListener('input', adjust);
            requestAnimationFrame(adjust);
        });
    }

static markCompleted(pageId) {
    if (pageId === "success" || pageId === "review-confirmation") return;
    
    console.log(`✅ Marking ${pageId} as completed`);
    localStorage.setItem(`completed-${pageId}`, "1");
    
    // Update allowed pages immediately
    console.log("🔄 Updating allowed pages after marking as completed");
    const allowedPages = this.getAllowedPages();
    console.log("✅ Now allowed pages:", allowedPages);
    
    // Immediately update step strip to reflect new permissions
    this.bindStepStrip();
}

    static updateProgress() {
        const countablePages = this.pageOrder.filter(p => p !== "review-confirmation" && p !== "success");
        const total = countablePages.length;
        let completed = 0;

        countablePages.forEach(page => {
            if (localStorage.getItem(`completed-${page}`) === "1") completed++;
        });

        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const bar = document.getElementById("globalProgressBar");
        if (bar) bar.style.width = `${percent}%`;

        console.log(`📊 Progress: ${percent}% (${completed}/${total})`);
    }

    static updateSidebar(pageId) {
        // Update sidebar active states
        document.querySelectorAll(".sidebar-item").forEach(item => {
            item.classList.toggle("active", item.dataset.page === pageId);
        });

        // Update step strip active states
        const strip = document.getElementById("stepStrip");
        if (strip) {
            strip.querySelectorAll(".step-item").forEach(item => {
                item.classList.toggle("active", item.dataset.page === pageId);
            });
        }
    }

    static clearCache() {
        this.pageCache.clear();
        console.log("🧹 Router cache cleared");
    }

    // Helper to check if a page is accessible
    static isPageAccessible(pageId) {
        return this.getAllowedPages().includes(pageId);
    }

    // Reset all progress (for testing/logout)
    static resetProgress() {
        const countablePages = this.pageOrder.filter(p => p !== "review-confirmation" && p !== "success");
        countablePages.forEach(page => {
            localStorage.removeItem(`completed-${page}`);
        });
        this.bindStepStrip();
        this.updateProgress();
        console.log("🔄 All progress reset");
    }

    static waitForElement(selector, maxAttempts = 50) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const check = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(check);
                    resolve(element);
                }
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(check);
                    reject(new Error(`Element ${selector} not found after ${maxAttempts} attempts`));
                }
            }, 100);
        });
    }
}

// Initialize Router
window.Router = Router;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("📄 DOM ready — Initializing Router...");
        Router.init();
    });
} else {
    console.log("📄 DOM already loaded — Initializing Router...");
    Router.init();
}