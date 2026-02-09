<?php
require_once __DIR__ . '/../../includes/layout.php';

$menu = [
    ['label' => 'Profile Settings', 'href' => 'profile.php'],
];

ob_start();
?>
<div class="card">
    <h3>GSS Admin : Profile Settings & Masters (Modules 10/12)</h3>
    <p>Global settings shell: IP policy, password policy, holiday list, components master.</p>
</div>
<div class="card">
    <h3>Security Settings</h3>
    <div class="form-grid">
        <div class="form-control">
            <label>Allowed IP Range</label>
            <input type="text" placeholder="0.0.0.0/0 (sample)">
        </div>
        <div class="form-control">
            <label>Password Min Length</label>
            <input type="number" value="8">
        </div>
    </div>
</div>
<div class="card">
    <h3>Masters (Components)</h3>
    <p>Placeholder list: Address, Employment, Education, Criminal, Credit.</p>
</div>
<?php
$content = ob_get_clean();
render_layout('Profile Settings', 'GSS Admin', $menu, $content);
