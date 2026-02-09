<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_login('gss_admin');

$menu = gss_admin_menu();

ob_start();
?>
<div class="card">
    <h3>Mail Template - Edit</h3>
    <p class="card-subtitle">Use placeholders like {candidate_name}, {customer_name}, {user_email}. These will be replaced automatically when sending.</p>

    <div id="mtEditMessage" class="alert" style="display:none; margin-top:14px;"></div>

    <form id="mtEditForm" style="margin-top: 6px;">
        <input type="hidden" name="template_id" id="mt_template_id" value="">

        <div class="form-grid">
            <div class="form-control">
                <label>Name *</label>
                <input type="text" name="template_name" id="mt_template_name" value="" required>
            </div>
            <div class="form-control">
                <label>Type *</label>
                <select name="template_type" id="mt_template_type" required>
                    <option value="email">Email</option>
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                </select>
            </div>
            <div class="form-control">
                <label>Active</label>
                <select name="is_active" id="mt_is_active">
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                </select>
            </div>
            <div class="form-control" style="grid-column:1/-1;">
                <label>Subject (email only)</label>
                <input type="text" name="subject" id="mt_subject" value="">
            </div>
            <div class="form-control" style="grid-column:1/-1;">
                <label>Body *</label>
                <textarea name="body" id="mt_body" rows="18" required style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;"></textarea>
            </div>
        </div>

        <div class="form-actions" style="justify-content:flex-end;">
            <a class="btn btn-secondary" href="mail_templates_list.php" style="text-decoration:none;">Back</a>
            <button type="button" class="btn" id="mtSaveBtn">Save</button>
        </div>
    </form>
</div>

<script src="<?php echo htmlspecialchars(app_url('/js/modules/gss_admin/mail_template_edit.js')); ?>"></script>
<?php
$content = ob_get_clean();
render_layout('Mail Template Edit', 'GSS Admin', $menu, $content);
