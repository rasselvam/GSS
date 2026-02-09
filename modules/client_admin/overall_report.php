<?php
require_once __DIR__ . '/../../includes/layout.php';

require_once __DIR__ . '/../../includes/menus.php';

$menu = client_admin_menu();

ob_start();
?>
<div class="card">
    <h3>Overall Candidate Report</h3>
    <p class="card-subtitle">Candidate-wise verification status across all components (sample layout).</p>
</div>

<div class="card">
    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:10px;">
        <div>
            <label style="font-size:13px; margin-right:6px;">Location</label>
            <select style="font-size:13px; padding:4px 6px;">
                <option>All Location</option>
                <option>Bangalore</option>
            </select>
        </div>
        <div>
            <input type="text" placeholder="search" style="font-size:13px; padding:4px 6px;">
            <button type="button" class="btn-secondary btn" style="margin-left:6px;">Search</button>
        </div>
    </div>

    <table class="table">
        <thead>
        <tr>
            <th>Control No</th>
            <th>Name</th>
            <th>Reference ID</th>
            <th>Requisition ID</th>
            <th>Recruiter Name</th>
            <th>Job Role</th>
            <th>Candidate Sent Date</th>
            <th>Agency Received Date</th>
            <th>Rejected Date</th>
            <th>Case Status</th>
            <th>IP</th>
            <th>CA</th>
            <th>PA</th>
            <th>HQ</th>
            <th>EXP1</th>
            <th>EXP2-1</th>
            <th>EXP2-2</th>
            <th>REF1</th>
            <th>REF2</th>
            <th>WC</th>
            <th>MC</th>
            <th>JC</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td><a href="candidate_view.php" style="text-decoration:none; color:#2563eb;">GSS1124142</a></td>
            <td>Jaidev Singh</td>
            <td>NA</td>
            <td>NA</td>
            <td>Magdalene Getsy</td>
            <td>Background Check</td>
            <td>01-Oct-2025</td>
            <td>03-Oct-2025</td>
            <td>-</td>
            <td>OPEN</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
            <td>✔</td>
        </tr>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
render_layout('Overall Report', 'Client Admin', $menu, $content);
