<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';

$menu = gss_admin_menu();

ob_start();
?>
<div class="card">
    <h3>Holiday Calendar</h3>
    <p class="card-subtitle">Add and manage holidays for TAT calculations.</p>

    <div id="holidayCalendarMessage" class="alert" style="display:none; margin-top:14px;"></div>

    <div class="card" style="margin-top:12px;">
        <h3 style="margin:0; font-size:14px;">Add Holiday</h3>
        <div class="form-grid" style="margin-top:10px;">
            <div class="form-control">
                <label>Holiday Date *</label>
                <input type="date" id="holiday_date" required>
            </div>
            <div class="form-control">
                <label>Holiday Name *</label>
                <input type="text" id="holiday_name" placeholder="e.g. Republic Day" required>
            </div>
        </div>
        <div class="form-actions" style="justify-content:flex-end; margin-top:10px;">
            <button type="button" class="btn" id="holidayAddBtn">Add</button>
        </div>
    </div>

    <div class="card" style="margin-top:12px;">
        <h3 style="margin:0; font-size:14px;">Holiday List</h3>
        <div style="overflow:auto; margin-top:10px;">
            <table class="table" style="min-width:680px;">
                <thead>
                    <tr>
                        <th style="width:80px;">#</th>
                        <th style="width:160px;">Date</th>
                        <th>Name</th>
                        <th style="width:120px;">Status</th>
                        <th style="width:140px;">Action</th>
                    </tr>
                </thead>
                <tbody id="holidayTableBody"></tbody>
            </table>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Holiday Calendar', 'GSS Admin', $menu, $content);
