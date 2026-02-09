<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('client_admin');

$menu = client_admin_menu();

ob_start();
?>
<div class="card">
    <h3>Create User</h3>
    <p class="card-subtitle">Create or edit users for your client.</p>

    <div id="clientUserCreateMessage" style="display:none; margin-top: 10px;"></div>

    <div class="tabs">
        <button class="tab active" data-tab="personal">Personal</button>
        <button class="tab" data-tab="usertype">User Type</button>
    </div>

    <form id="clientUserCreateForm" style="margin-top: 6px;">
        <input type="hidden" name="user_id" id="clientUserId" value="">
        <input type="hidden" name="form_action" id="clientUserFormAction" value="save">

        <input type="hidden" name="client_id" id="clientUserClientId" value="">

        <div id="tab-personal" class="tab-panel active">
            <div class="form-grid">
                <div class="form-control">
                    <label>Username *</label>
                    <input type="text" name="username" value="" required>
                </div>
                <div class="form-control">
                    <label>First Name *</label>
                    <input type="text" name="first_name" value="" required>
                </div>
                <div class="form-control">
                    <label>Middle Name</label>
                    <input type="text" name="middle_name" value="">
                </div>
                <div class="form-control">
                    <label>Last Name *</label>
                    <input type="text" name="last_name" value="" required>
                </div>
                <div class="form-control">
                    <label>Phone *</label>
                    <input type="text" name="phone" value="" required>
                </div>
                <div class="form-control">
                    <label>Email *</label>
                    <input type="email" name="email" value="" required>
                </div>
            </div>
        </div>

        <div id="tab-usertype" class="tab-panel">
            <div class="form-grid">
                <div class="form-control">
                    <label>Employee Type *</label>
                    <select name="role" required>
                        <option value="customer_admin">Customer Admin</option>
                        <option value="customer_location_admin">Customer Location Admin</option>
                        <option value="customer_candidate_data_entry">Customer Candidate Data Entry</option>
                        <option value="company_recruiter">HR Recruiter</option>
                        <option value="aadhar_validator">Aadhar Validator</option>
                        <option value="api_user">API User</option>
                        <option value="company_manager">Company Manager</option>
                    </select>
                </div>
                <div class="form-control">
                    <label>Location *</label>
                    <select name="locations[]" id="clientUserLocationSelect" multiple required style="min-height: 90px;">
                        <option value="">Select Location</option>
                    </select>
                </div>
                <div class="form-control">
                    <label>Send Login Email</label>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                        <input type="checkbox" id="clientUserSendEmail" name="send_email" value="1">
                        <label for="clientUserSendEmail" style="margin:0;">Send CRM login link + temporary password</label>
                    </div>
                </div>
                <div class="form-control">
                    <label>Status</label>
                    <select name="is_active" id="clientUserIsActive">
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-actions">
            <button type="button" class="btn" id="clientUserSaveNextBtn">Save &amp; Next</button>
            <button type="submit" class="btn" id="clientUserFinalSubmitBtn" style="margin-left:8px; display:none;">Final Submit</button>
        </div>
    </form>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var tabs = document.querySelectorAll('.tab');
            tabs.forEach(function (tab) {
                tab.addEventListener('click', function () {
                    var target = this.getAttribute('data-tab');
                    document.querySelectorAll('.tab').forEach(function (t) {
                        t.classList.remove('active');
                    });
                    document.querySelectorAll('.tab-panel').forEach(function (panel) {
                        panel.classList.remove('active');
                    });
                    this.classList.add('active');
                    var activePanel = document.getElementById('tab-' + target);
                    if (activePanel) {
                        activePanel.classList.add('active');
                    }
                });
            });
        });
    </script>
</div>
<?php
$content = ob_get_clean();
render_layout('Create User', 'Client Admin', $menu, $content);
