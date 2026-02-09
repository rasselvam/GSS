<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('gss_admin');

$menu = gss_admin_menu();

ob_start();
?>
<!-- <div class="subnav">
    <a href="clients_create.php" class="subnav-link">Customer Settings</a>
    <a href="verification_profiles_list.php" class="subnav-link active">Verification Profiles</a>
</div> -->

<div class="card">
    <h3>Verification Profile Master - Edit</h3>
    <p class="card-subtitle">Configure basic details, job roles and verification types for this profile.</p>

    <div id="vpEditMessage" class="alert" style="display:none; margin-top:14px;"></div>

    <div class="tabs">
        <button class="tab active" data-tab="basic">Basic Details</button>
        <button class="tab" data-tab="jobrole">Job Role</button>
        <button class="tab" data-tab="types">Verification Types</button>
    </div>

    <form id="vpEditForm" style="margin-top: 6px;">
        <input type="hidden" name="profile_id" id="vp_profile_id" value="">
        <div id="tab-basic" class="tab-panel active">
            <div class="form-grid">
                <div class="form-control">
                    <label>Client *</label>
                    <select name="client_id" id="vp_client_id" required></select>
                </div>
                <div class="form-control">
                    <label>Scope of Work *</label>
                    <input type="text" name="profile_name" id="vp_profile_name" value="" required>
                </div>
                <div class="form-control">
                    <label>Description</label>
                    <textarea name="description" id="vp_description" rows="2"></textarea>
                </div>
                <div class="form-control">
                    <label>Location *</label>
                    <select name="location" id="vp_location" required>
                        <option value="">Select Location</option>
                    </select>
                </div>
                <div class="form-control">
                    <label>Active</label>
                    <select name="is_active" id="vp_is_active">
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="tab-jobrole" class="tab-panel">
            <p class="card-subtitle">Map this verification profile to job roles.</p>
            <div style="display:flex; gap:10px; align-items:flex-end; margin-top:10px;">
                <div style="flex:1;">
                    <label style="font-size:12px; color:#64748b;">Add New Job Role</label>
                    <input type="text" id="vp_jobrole_new" placeholder="Enter job role" style="width:100%;">
                </div>
                <div>
                    <button type="button" class="btn" id="vp_jobrole_add_btn">Add to Available</button>
                </div>
            </div>
            <div style="display:flex; gap:16px; margin-top:10px;">
                <div style="flex:1;">
                    <label>Available</label>
                    <select multiple size="6" style="width:100%;" id="vp_jobrole_available">
                        <option>Sales Executive</option>
                        <option>Operations</option>
                        <option>Manager</option>
                    </select>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; justify-content:center;">
                    <button type="button" class="btn" id="vp_jobrole_move_one_to_selected">&gt;</button>
                    <button type="button" class="btn" id="vp_jobrole_move_all_to_selected">&gt;&gt;</button>
                    <button type="button" class="btn" id="vp_jobrole_move_one_to_available">&lt;</button>
                    <button type="button" class="btn" id="vp_jobrole_move_all_to_available">&lt;&lt;</button>
                </div>
                <div style="flex:1;">
                    <label>Selected</label>
                    <select multiple size="6" style="width:100%;" id="vp_jobrole_selected">
                        <option>Operations</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="tab-types" class="tab-panel">
            <p class="card-subtitle">Each row below represents one verification component in this profile.</p>
            <div id="vpTypesRows" style="margin-top:10px;"></div>
            <div class="form-actions" style="justify-content:flex-end; margin-top:10px;">
                <button type="button" class="btn" id="vpAddTypeRow">Add More</button>
            </div>
        </div>

        <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="vpPrevBtn">Previous</button>
            <button type="button" class="btn" id="vpNextBtn">Next</button>
            <button type="button" class="btn" id="vpFinalSubmitBtn">Final Submit</button>
        </div>
    </form>
</div>
<?php
$content = ob_get_clean();
render_layout('Verification Profile Edit', 'GSS Admin', $menu, $content);
