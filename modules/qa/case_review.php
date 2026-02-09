<?php
require_once __DIR__ . '/../../includes/layout.php';
require_once __DIR__ . '/../../includes/menus.php';
require_once __DIR__ . '/../../includes/auth.php';

auth_require_any_access(['qa', 'team_lead']);

auth_session_start();
$access = strtolower(trim((string)($_SESSION['auth_moduleAccess'] ?? '')));
$isTeamLead = ($access === 'team_lead');

$menu = $isTeamLead ? team_lead_menu() : qa_menu();
$roleLabel = $isTeamLead ? 'Team Lead' : 'QA';

$applicationId = isset($_GET['application_id']) ? trim((string)$_GET['application_id']) : '';
$clientId = isset($_GET['client_id']) ? (int)$_GET['client_id'] : 0;

ob_start();
?>
<div class="card">
    <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:10px; flex-wrap:wrap;">
        <div>
            <h3 style="margin-bottom:2px;">QA Case Review</h3>
            <p class="card-subtitle" style="margin-bottom:0;">Review case status, add comments, and view full history timeline.</p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a class="btn btn-sm" href="review_list.php" style="border-radius:10px;">Back to List</a>
        </div>
    </div>
</div>

<div class="card" id="qaCaseReviewShell" data-application-id="<?php echo htmlspecialchars($applicationId); ?>" data-client-id="<?php echo (int)$clientId; ?>" style="padding:0; overflow:hidden; border-radius:16px;">
    <div class="qa-split" style="display:flex; gap:0; min-height:78vh;">
        <div style="flex:1 1 auto; border-right:1px solid rgba(148,163,184,0.25); background:#f8fafc;">
            <div id="qaReportEmpty" style="display:none; padding:18px;">
                <div style="background:#ffffff; border:1px dashed #cbd5e1; border-radius:16px; padding:18px;">
                    <div style="font-weight:900; color:#0f172a; font-size:14px;">No case selected</div>
                    <div style="margin-top:6px; color:#64748b; font-size:13px;">Open a case from <b>Review List</b> to start QA review.</div>
                    <div style="margin-top:12px;">
                        <a class="btn btn-sm" href="review_list.php" style="border-radius:10px;">Go to Review List</a>
                    </div>
                </div>
            </div>
            <iframe id="qaReportFrame" title="Candidate Report" style="width:100%; height:78vh; border:0; display:block; background:#fff;"></iframe>
        </div>
        <div class="qa-right" style="flex:0 0 420px; max-width:460px; background:#ffffff;">
            <div style="padding:14px; border-bottom:1px solid rgba(148,163,184,0.25);">
                <div id="qaCaseMessage" style="display:none; margin-bottom:10px;"></div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
                    <div style="font-weight:900; color:#0f172a; font-size:13px;">QA Actions</div>
                    <a class="btn btn-sm btn-light" id="qaOpenReport" href="#" target="_blank" rel="noopener" style="border-radius:10px;">Open report</a>
                </div>

                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn btn-sm" id="qaActionApprove" type="button" style="border-radius:10px; background:#16a34a; border:1px solid rgba(22,163,74,0.35); color:#fff; font-weight:700;">Approve</button>
                    <button class="btn btn-sm" id="qaActionHold" type="button" style="border-radius:10px; background:#f59e0b; border:1px solid rgba(245,158,11,0.35); color:#111827; font-weight:700;">Hold</button>
                    <button class="btn btn-sm" id="qaActionReject" type="button" style="border-radius:10px; background:#ef4444; border:1px solid rgba(239,68,68,0.35); color:#fff; font-weight:700;">Reject</button>
                    <button class="btn btn-sm btn-secondary" id="qaActionStop" type="button" style="border-radius:10px;">Stop BGV</button>
                </div>

                <div style="margin-top:12px; display:flex; gap:10px;">
                    <select id="qaCommentSection" style="font-size:13px; padding:6px 8px; border-radius:10px; border:1px solid #cbd5e1; flex:0 0 160px;">
                        <option value="general">General</option>
                        <option value="basic">Basic</option>
                        <option value="identification">Identification</option>
                        <option value="address">Address</option>
                        <option value="employment">Employment</option>
                        <option value="education">Education</option>
                        <option value="reference">Reference</option>
                        <option value="documents">Documents</option>
                    </select>
                    <input id="qaCommentText" type="text" placeholder="Add comment (will appear in timeline)" style="font-size:13px; padding:6px 8px; border-radius:10px; border:1px solid #cbd5e1; flex:1 1 auto;" />
                    <button class="btn btn-sm" id="qaCommentAddBtn" type="button" style="border-radius:10px;">Add</button>
                </div>
            </div>

            <div class="qa-right-body" style="padding:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                    <div>
                        <div style="font-weight:800; color:#0f172a;">Timeline</div>
                        <div style="font-size:11px; color:#64748b;">All actions, comments and updates with timestamp.</div>
                    </div>
                    <button class="btn btn-sm btn-light" id="qaTimelineRefresh" type="button" style="border-radius:10px;">Refresh</button>
                </div>

                <div id="qaTimeline" style="margin-top:12px; display:flex; flex-direction:column; gap:10px; max-height:calc(78vh - 210px); overflow:auto; padding-right:4px;"></div>
            </div>
        </div>
    </div>
</div>

<style>
    #qaCaseReviewShell .btn{font-weight:700;}
    #qaCaseReviewShell iframe{border-radius:0;}
    #qaCaseReviewShell .qa-split{height:calc(100vh - 210px); min-height:78vh;}
    #qaCaseReviewShell .qa-split > div{height:100%;}
    #qaCaseReviewShell #qaReportFrame{height:100% !important;}
    #qaCaseReviewShell .qa-right{position:sticky; top:12px; align-self:flex-start; height:calc(100vh - 234px); border-left:0;}
    #qaCaseReviewShell .qa-right-body{height:calc(100% - 168px); overflow:hidden;}
    #qaCaseReviewShell #qaTimeline{max-height:calc(100% - 54px) !important;}
    #qaCaseReviewShell .qa-tl-group{margin:12px 0 6px; display:flex; align-items:center; gap:10px;}
    #qaCaseReviewShell .qa-tl-group .qa-tl-date{font-size:11px; font-weight:900; color:#334155; text-transform:uppercase; letter-spacing:0.06em;}
    #qaCaseReviewShell .qa-tl-group .qa-tl-line{flex:1 1 auto; height:1px; background:rgba(148,163,184,0.45);}
    #qaCaseReviewShell .qa-tl-item{border:1px solid rgba(148,163,184,0.28); border-left-width:6px; border-radius:14px; padding:10px 10px 10px 12px; background:#fff; box-shadow:0 1px 0 rgba(15,23,42,0.03);}
    #qaCaseReviewShell .qa-tl-item[data-kind="comment"]{border-left-color:#3b82f6;}
    #qaCaseReviewShell .qa-tl-item[data-kind="action"]{border-left-color:#16a34a;}
    #qaCaseReviewShell .qa-tl-item[data-kind="update"]{border-left-color:#f59e0b;}
    #qaCaseReviewShell .qa-tl-item[data-kind="system"]{border-left-color:#64748b;}
    #qaCaseReviewShell .qa-tl-top{display:flex; justify-content:space-between; gap:10px; align-items:flex-start;}
    #qaCaseReviewShell .qa-tl-who{font-size:13px; font-weight:900; color:#0f172a; line-height:1.1;}
    #qaCaseReviewShell .qa-tl-when{font-size:11px; color:#64748b; white-space:nowrap;}
    #qaCaseReviewShell .qa-tl-badges{display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;}
    #qaCaseReviewShell .qa-tl-badge{font-size:11px; font-weight:800; padding:4px 8px; border-radius:999px; background:#f1f5f9; color:#0f172a; border:1px solid rgba(148,163,184,0.28);}
    #qaCaseReviewShell .qa-tl-badge.primary{background:rgba(59,130,246,0.10); border-color:rgba(59,130,246,0.25); color:#1d4ed8;}
    #qaCaseReviewShell .qa-tl-badge.success{background:rgba(22,163,74,0.10); border-color:rgba(22,163,74,0.25); color:#166534;}
    #qaCaseReviewShell .qa-tl-badge.warn{background:rgba(245,158,11,0.14); border-color:rgba(245,158,11,0.22); color:#92400e;}
    #qaCaseReviewShell .qa-tl-msg{margin-top:6px; font-size:13px; color:#0f172a; line-height:1.35; white-space:pre-wrap;}
    #qaTimeline::-webkit-scrollbar{width:10px;}
    #qaTimeline::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.55); border-radius:999px; border:2px solid rgba(255,255,255,0.8);}
    #qaTimeline::-webkit-scrollbar-track{background:transparent;}
    @media (max-width: 1100px){
        #qaCaseReviewShell .qa-split{flex-direction:column; height:auto;}
        #qaCaseReviewShell iframe{height:70vh !important;}
        #qaCaseReviewShell .qa-right{position:static; height:auto; max-width:none !important;}
        #qaCaseReviewShell .qa-right-body{height:auto; overflow:visible;}
        #qaCaseReviewShell #qaTimeline{max-height:none !important;}
    }
</style>
<?php
$content = ob_get_clean();
render_layout('QA Case Review', $roleLabel, $menu, $content);
