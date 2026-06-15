const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));

function getParticipants() {
  try { if (process.env.PARTICIPANTS) return JSON.parse(process.env.PARTICIPANTS); } catch(e) {}
  return [{code:'P01',firstName:'Participant',lastName:'One',goals:[],bsp:false,approved_rp:[]}];
}

app.get('/api/participants', (req, res) => {
  res.json(getParticipants().map(function(p) {
    return {
      code: p.code,
      firstName: p.firstName,
      lastName: p.lastName || '',
      displayName: p.firstName + (p.lastName ? ' ' + p.lastName : ''),
      goals: p.goals || [],
      bsp: p.bsp === true,
      approved_rp: p.approved_rp || []
    };
  }));
});

app.post('/api/claude', async (req, res) => {
  var key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({error:{message:'ANTHROPIC_API_KEY not set in Render environment.'}});
  try {
    var r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
      body: JSON.stringify(req.body)
    });
    res.status(r.status).json(await r.json());
  } catch(e) { res.status(500).json({error:{message:e.message}}); }
});

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CareRender - Compass House</title>
<style>
:root{--t:#1A6B72;--tl:#E8F4F5;--tm:#C2E0E3;--td:#124E54;--a:#D97706;--al:#FEF3C7;--r:#DC2626;--rl:#FEE2E2;--g:#059669;--gl:#D1FAE5;--gr:#6B7280;--grl:#F3F4F6;--b:#E5E7EB;--tx:#111827;--p:#7C3AED;--pl:#EDE9FE}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0F4F5;color:var(--tx);min-height:100vh}
.hdr{background:var(--td);color:#fff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.logo{font-size:22px;font-weight:700}.logo span{color:var(--tm)}
.sub{font-size:11px;color:var(--tm);margin-top:2px}
.hbtn{background:rgba(255,255,255,.15);border:none;color:#fff;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer}
.hbtn:hover{background:rgba(255,255,255,.25)}
.steps{background:#fff;border-bottom:1px solid var(--b);padding:10px 20px;display:flex;gap:8px;overflow-x:auto}
.step{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--gr);white-space:nowrap}
.step.active{color:var(--t);font-weight:600}.step.done{color:var(--g)}
.sn{width:22px;height:22px;border-radius:50%;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.step.done .sn{background:var(--g);border-color:var(--g);color:#fff}
.step.active .sn{background:var(--t);border-color:var(--t);color:#fff}
.sd{color:var(--b);font-size:18px}
.main{max-width:720px;margin:0 auto;padding:20px 16px 80px}
.card{background:#fff;border-radius:12px;border:1px solid var(--b);margin-bottom:14px;overflow:hidden}
.ch{padding:14px 18px;background:var(--tl);border-bottom:1px solid var(--tm);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ch h2{font-size:16px;font-weight:700;color:var(--td)}
.badge{background:var(--t);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}
.badge.gr{background:var(--g)}.badge.pu{background:var(--p)}.badge.am{background:var(--a)}
.cb{padding:18px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.row3{grid-template-columns:1fr 1fr 1fr}.row1{grid-template-columns:1fr}
@media(max-width:480px){.row2,.row3{grid-template-columns:1fr}}
.f{display:flex;flex-direction:column;gap:4px}
.f label{font-size:12px;font-weight:600;color:var(--gr);text-transform:uppercase;letter-spacing:.5px}
.f input,.f select,.f textarea{border:1.5px solid var(--b);border-radius:8px;padding:9px 12px;font-size:15px;color:var(--tx);background:#fff;font-family:inherit;transition:border-color .15s}
.f input:focus,.f select:focus,.f textarea:focus{outline:none;border-color:var(--t)}
.calc{font-size:12px;color:var(--t);font-weight:600;margin-top:4px;min-height:18px}
.tog{border:1.5px solid var(--b);border-radius:8px;margin-bottom:10px;overflow:hidden}
.togh{padding:11px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;background:var(--grl)}
.togh:hover{background:var(--tl)}
.togh input[type=checkbox]{width:16px;height:16px;accent-color:var(--t);cursor:pointer;flex-shrink:0}
.togh label{font-size:14px;font-weight:600;cursor:pointer;flex:1}
.togh .hint{font-size:11px;color:var(--gr)}
.togb{padding:14px;border-top:1px solid var(--b);display:none}
.togb.open{display:block}
.styrow{display:flex;gap:8px;margin-bottom:14px}
.sbtn{flex:1;padding:9px;border:2px solid var(--b);border-radius:8px;background:#fff;cursor:pointer;text-align:center;font-size:13px;font-weight:600;color:var(--gr);transition:all .15s}
.sbtn.active{border-color:var(--t);background:var(--tl);color:var(--td)}
.sbtn small{display:block;font-size:11px;font-weight:400;color:var(--gr);margin-top:2px}
.nwrap{position:relative}
.nwrap textarea{width:100%;min-height:160px;resize:vertical;line-height:1.5}
.vbtn{position:absolute;bottom:10px;right:10px;background:var(--t);color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer}
.vbtn.rec{background:var(--r);animation:pulse 1.2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
.btn{padding:11px 24px;border-radius:9px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all .15s;display:inline-flex;align-items:center;gap:8px}
.bp{background:var(--t);color:#fff}.bp:hover{background:var(--td)}
.bs{background:#fff;color:var(--t);border:2px solid var(--t)}.bs:hover{background:var(--tl)}
.bcopy{background:var(--grl);color:var(--tx);border:1px solid var(--b);padding:7px 14px;font-size:13px;border-radius:7px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.bcopy:hover{background:var(--tl);border-color:var(--t)}
.bcopy.ok{background:var(--gl);border-color:var(--g);color:var(--g)}
.brow{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px}
.spw{text-align:center;padding:40px 20px}
.spin{width:40px;height:40px;border:3px solid var(--tm);border-top-color:var(--t);border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 16px}
@keyframes sp{to{transform:rotate(360deg)}}
.spw p{color:var(--gr);font-size:14px}
.gapbox{background:var(--al);border:1.5px solid #FCD34D;border-radius:10px;padding:16px;margin-bottom:16px}
.gapbox h3{font-size:14px;font-weight:700;color:#92400E;margin-bottom:12px}
.gapq{margin-bottom:12px}
.gapq label{font-size:13px;font-weight:600;color:#78350F;display:block;margin-bottom:5px}
.gapq textarea{width:100%;border:1.5px solid #FCD34D;border-radius:7px;padding:8px 10px;font-size:14px;font-family:inherit;min-height:60px;resize:vertical;background:#fff}
.ok-banner{background:var(--gl);border:1.5px solid #6EE7B7;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:10px;margin-bottom:16px;font-size:14px;color:#065F46;font-weight:600}
.pv{background:var(--tl);border:1px solid var(--tm);border-radius:8px;padding:9px 14px;font-size:12px;color:var(--td);margin-bottom:10px}
.pinfo{border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:10px;display:none}
.pinfo.goals{background:var(--pl);border:1px solid #C4B5FD;color:#4C1D95}
.pinfo.bsp{background:#FEF3C7;border:1px solid #FCD34D;color:#78350F}
.pinfo strong{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.rb{background:#FFF8E6;border:1.5px solid #FCD34D;border-radius:10px;padding:12px 16px;font-size:13px;color:#78350F;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.hr{border:none;border-top:1px solid var(--b);margin:16px 0}
.si{font-size:11px;color:var(--t);margin-top:3px;min-height:16px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.tag{font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px}
.tag.it{background:var(--al);color:#92400E;border:1px solid #FCD34D}
.tag.at{background:var(--tl);color:var(--td);border:1px solid var(--tm)}
.tag.nt{background:var(--gl);color:#065F46;border:1px solid #6EE7B7}
.repalert{background:var(--r);color:#fff;padding:10px 16px;font-weight:700;font-size:14px}
.nb{background:var(--rl);border:1px solid #FCA5A5;border-radius:8px;padding:12px;margin:10px 0;font-size:13px}
.nb h4{font-weight:700;color:var(--r);margin-bottom:6px}
.dom-card{border-radius:10px;border:1.5px solid var(--b);margin-bottom:12px;overflow:hidden}
.dom-hd{padding:11px 16px;background:var(--tl);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.dom-title{font-size:15px;font-weight:700;color:var(--td)}
.dom-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dom-count{font-size:12px;font-weight:700;background:var(--t);color:#fff;padding:2px 10px;border-radius:10px}
.dom-freq{font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;border:1px solid}
.freq-sometimes{background:#FEF9C3;color:#854D0E;border-color:#FDE047}
.freq-often{background:#FED7AA;color:#7C2D12;border-color:#FB923C}
.freq-always{background:var(--rl);color:var(--r);border-color:#FCA5A5}
.inst{border-top:1px solid var(--b);padding:14px 16px}
.inst-hd{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.inst-time{font-size:12px;font-weight:700;color:var(--gr);font-family:monospace}
.st-badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap}
.st-vp{background:#DBEAFE;color:#1E40AF}
.st-vg{background:var(--pl);color:#5B21B6}
.st-sv{background:var(--gl);color:#065F46}
.st-cr{background:var(--al);color:#92400E}
.st-pa{background:var(--rl);color:#991B1B}
.st-ta{background:var(--grl);color:var(--tx);border:1px solid var(--b)}
.ican-stmt{font-size:14px;font-weight:600;color:var(--td);margin-bottom:6px;line-height:1.5;font-style:italic}
.inst-desc{font-size:13px;line-height:1.6;color:var(--gr);margin-bottom:6px}
.goal-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.goal-tag{font-size:11px;background:var(--pl);color:var(--p);padding:1px 8px;border-radius:8px;border:1px solid #C4B5FD}
.sum-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
@media(max-width:480px){.sum-grid{grid-template-columns:1fr 1fr}}
.sum-cell{background:var(--grl);border-radius:8px;padding:10px;text-align:center;border:1px solid var(--b)}
.sum-num{font-size:22px;font-weight:700;color:var(--t)}
.sum-lbl{font-size:11px;color:var(--gr);margin-top:2px}
.ws-card{border-radius:12px;border:2px solid var(--a);margin-bottom:14px;overflow:hidden}
.ws-hd{background:var(--al);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.ws-title{font-size:16px;font-weight:700;color:#92400E}
.risk-badge{font-size:12px;font-weight:700;padding:4px 12px;border-radius:8px}
.risk-low{background:var(--gl);color:#065F46}
.risk-mod{background:var(--al);color:#92400E}
.risk-high{background:var(--rl);color:var(--r)}
.risk-crit{background:var(--r);color:#fff}
.ws-body{padding:16px}
.ws-narrative{font-size:14px;line-height:1.7;color:var(--tx);margin-bottom:14px;white-space:pre-wrap}
.ws-risks h4{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#92400E;margin-bottom:8px}
.ws-risk-item{display:flex;gap:8px;margin-bottom:6px;font-size:13px;line-height:1.5;color:var(--tx)}
.ws-risk-item::before{content:"!";background:var(--r);color:#fff;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;margin-top:1px}
.ws-regression{background:var(--rl);border-radius:8px;padding:10px 14px;font-size:13px;line-height:1.6;color:var(--r);border:1px solid #FCA5A5;margin-top:10px}
.master-copy{background:var(--t);color:#fff;padding:14px 18px;border-radius:10px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.master-copy-lbl{font-size:15px;font-weight:700}
.master-copy-sub{font-size:12px;color:var(--tm)}
.oc{border-radius:10px;border:1.5px solid var(--b);margin-bottom:12px;overflow:hidden}
.oc.inc{border-color:var(--a)}.oc.rep{border-color:var(--r)}.oc.apt{border-color:var(--t)}
.och{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.oc.inc .och{background:var(--al)}.oc.rep .och{background:var(--rl)}.oc.apt .och{background:var(--tl)}
.oct{font-size:15px;font-weight:700}
.oc.inc .oct{color:#92400E}.oc.rep .oct{color:var(--r)}.oc.apt .oct{color:var(--td)}
.ocb{padding:16px}
.sl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gr);margin-bottom:4px;margin-top:10px}
.sl:first-child{margin-top:0}
.st{font-size:14px;line-height:1.6;color:var(--tx);margin-bottom:6px}
.dguide{background:var(--grl);border:1.5px solid var(--b);border-radius:10px;margin-bottom:12px;overflow:hidden}
.dguide summary{padding:10px 14px;cursor:pointer;font-size:13px;font-weight:600;color:var(--gr);user-select:none;list-style:none;display:flex;align-items:center;gap:8px}
.dguide summary::-webkit-details-marker{display:none}
.dguide summary::before{content:"Domain guide";flex:1}
.dguide summary::after{content:"Tap to open"}
.dguide[open] summary::after{content:"Tap to close"}
.dguide-body{padding:0 14px 14px;display:grid;gap:10px}
.dguide-row{background:#fff;border-radius:8px;border:1px solid var(--b);padding:10px 12px}
.dguide-row strong{font-size:13px;color:var(--td);display:block;margin-bottom:3px}
.dguide-row span{font-size:12px;color:var(--gr);line-height:1.5}
.err{background:var(--rl);border:1.5px solid #FCA5A5;border-radius:8px;padding:14px;font-size:13px;color:var(--r)}
.admt{width:100%;border-collapse:collapse;font-size:13px}
.admt th{background:var(--tl);padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--td);text-transform:uppercase;letter-spacing:.5px}
.admt td{padding:8px 12px;border-bottom:1px solid var(--b);vertical-align:top}
.envbox{background:#1e1e2e;color:#cdd6f4;border-radius:10px;padding:16px;font-family:monospace;font-size:12px;overflow-x:auto;margin-top:10px;line-height:1.6;white-space:pre-wrap;word-break:break-all}
.hidden{display:none!important}
#s1,#s2,#s3,#s4,#sa{display:none}
#s1.on,#s2.on,#s3.on,#s4.on,#sa.on{display:block}
</style>
</head>
<body>
<div class="hdr">
  <div><div class="logo">Care<span>Render</span></div><div class="sub">Compass House &middot; I-CAN v6 Aligned Documentation</div></div>
  <button class="hbtn" onclick="showAdmin()">Participants</button>
</div>
<div class="steps">
  <div class="step active" id="st1"><div class="sn">1</div> Shift Details</div><div class="sd">&rsaquo;</div>
  <div class="step" id="st2"><div class="sn">2</div> What Happened</div><div class="sd">&rsaquo;</div>
  <div class="step" id="st3"><div class="sn">3</div> Review</div><div class="sd">&rsaquo;</div>
  <div class="step" id="st4"><div class="sn">4</div> Documents</div>
</div>
<div class="main">

<!-- STEP 1 -->
<div id="s1" class="on">
  <div id="rban" class="rb hidden">
    <span>Unsaved note found &mdash; <strong id="rtime"></strong></span>
    <button class="bcopy" onclick="doRecover()">Recover</button>
  </div>
  <div class="card">
    <div class="ch"><span class="badge">STEP 1</span><h2>Shift Details</h2></div>
    <div class="cb">
      <div class="f" style="margin-bottom:16px">
        <label>Documentation Style</label>
        <div class="styrow">
          <button class="sbtn active" id="sty-s" onclick="setStyle('s')">Simple <small>Domain summaries &middot; I-CAN statements &middot; 2-4 sentences each</small></button>
          <button class="sbtn" id="sty-e" onclick="setStyle('e')">Extensive <small>Full timestamped clinical entries per domain &middot; 2000+ words</small></button>
        </div>
      </div>
      <div class="pv">Names and addresses are removed automatically before the AI processes anything.</div>
      <div id="pi-goals" class="pinfo goals">
        <strong>NDIS Goals for this participant</strong>
        <div id="pi-goals-list"></div>
      </div>
      <div id="pi-bsp" class="pinfo bsp">
        <strong>Behaviour Support Plan</strong>
        <div id="pi-bsp-detail"></div>
      </div>
      <div class="row2">
        <div class="f"><label>Participant</label><select id="psel" onchange="onPC()"><option value="">Loading participants...</option></select></div>
        <div class="f"><label>Support Ratio</label><select id="ratio"><option value="">Select...</option><option>1:1</option><option>1:2</option><option>1:3</option></select></div>
      </div>
      <div class="row2 row3">
        <div class="f"><label>Shift Date</label><input type="date" id="sdate"></div>
        <div class="f"><label>Start Time</label><input type="time" id="stime" oninput="calcDur()"></div>
        <div class="f"><label>End Time</label><input type="time" id="etime" oninput="calcDur()"></div>
      </div>
      <div class="calc" id="dur"></div>
      <hr class="hr">
      <div class="row2">
        <div class="f"><label>Your Name</label><input type="text" id="w1" placeholder="Support worker name"></div>
        <div class="f"><label>Your Role</label><input type="text" id="w1r" placeholder="e.g. Support Worker"></div>
      </div>
      <div class="tog">
        <div class="togh" onclick="togS('sw')">
          <input type="checkbox" id="cb-sw" onclick="event.stopPropagation();togS('sw',this.checked)">
          <label for="cb-sw">Second worker on this shift</label><span class="hint">Optional</span>
        </div>
        <div class="togb" id="sw">
          <div class="row2">
            <div class="f"><label>Name</label><input type="text" id="w2"></div>
            <div class="f"><label>Start Time</label><input type="time" id="w2s" oninput="calcW2()"></div>
          </div>
          <div class="row2">
            <div class="f"><label>End Time</label><input type="time" id="w2e" oninput="calcW2()"></div>
            <div class="f"><div class="calc" id="w2d" style="padding-top:20px"></div></div>
          </div>
        </div>
      </div>
      <div class="tog">
        <div class="togh" onclick="togS('tr')">
          <input type="checkbox" id="cb-tr" onclick="event.stopPropagation();togS('tr',this.checked)">
          <label for="cb-tr">Transport provided</label><span class="hint">Optional</span>
        </div>
        <div class="togb" id="tr">
          <div class="row2">
            <div class="f"><label>Odometer Start (km)</label><input type="number" id="odo1" oninput="calcKm()"></div>
            <div class="f"><label>Odometer End (km)</label><input type="number" id="odo2" oninput="calcKm()"></div>
          </div>
          <div class="calc" id="km"></div>
          <div class="row1 row2" style="margin-top:10px">
            <div class="f"><label>Destination(s)</label><input type="text" id="trd" placeholder="e.g. Rockhampton Base Hospital, Stockland"></div>
          </div>
        </div>
      </div>
      <div class="brow"><button class="btn bp" onclick="go2()">Next: What Happened &rarr;</button></div>
    </div>
  </div>
</div>

<!-- STEP 2 -->
<div id="s2">
  <div class="card">
    <div class="ch"><span class="badge">STEP 2</span><h2>What Happened This Shift</h2></div>
    <div class="cb">
      <div class="pv">Write naturally using the participant's real name. Include all timestamps. Names and addresses are removed before the AI sees anything.</div>
      <details class="dguide">
        <summary></summary>
        <div class="dguide-body">
          <div class="dguide-row"><strong>Self-Care &mdash; what you do to your body</strong><span>Showering, dressing, grooming, eating, drinking, toileting, managing personal health needs</span></div>
          <div class="dguide-row"><strong>Daily Life Activities &mdash; what you do in your home</strong><span>Cooking, cleaning, shopping, managing finances, household management</span></div>
          <div class="dguide-row"><strong>Social and Community Participation &mdash; what you do in the world</strong><span>Community activities, recreation, social groups, outings, civic participation</span></div>
        </div>
      </details>
      <div class="f">
        <label>Describe what happened</label>
        <div class="nwrap">
          <textarea id="narr" rows="10" oninput="onNarr()" placeholder="Write naturally. Include how the participant was when you arrived, each activity with the time, any incidents, how they were when you left. For extensive notes include every timestamp you recorded."></textarea>
          <button class="vbtn" id="vbtn" onclick="doVoice()">Speak</button>
        </div>
        <div style="font-size:11px;color:var(--gr);text-align:right;margin-top:4px" id="cc">0 characters</div>
        <div class="si" id="si"></div>
      </div>
      <div class="brow">
        <button class="btn bs" onclick="goTo(1)">&larr; Back</button>
        <button class="btn bp" onclick="go3()">Analyse &rarr;</button>
      </div>
    </div>
  </div>
</div>

<!-- STEP 3 -->
<div id="s3">
  <div id="l3" class="card hidden"><div class="cb spw"><div class="spin"></div><p>Analysing shift notes...</p></div></div>
  <div id="gap-s" class="hidden">
    <div class="card">
      <div class="ch"><span class="badge">STEP 3</span><h2>A Few Quick Questions</h2></div>
      <div class="cb">
        <div class="gapbox"><h3>A bit more detail will improve the documentation</h3><div id="gap-list"></div></div>
        <div class="brow">
          <button class="btn bs" onclick="goTo(2)">&larr; Edit Notes</button>
          <button class="btn bp" onclick="genDocs()">Generate Documents &rarr;</button>
        </div>
      </div>
    </div>
  </div>
  <div id="ok-s" class="hidden">
    <div class="card">
      <div class="ch"><span class="badge">STEP 3</span><h2>Ready to Generate</h2></div>
      <div class="cb">
        <div class="ok-banner">All information captured. Ready to generate I-CAN aligned documentation.</div>
        <div class="tags" id="ftags"></div>
        <div class="brow">
          <button class="btn bs" onclick="goTo(2)">&larr; Edit Notes</button>
          <button class="btn bp" onclick="genDocs()">Generate Documents &rarr;</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- STEP 4 -->
<div id="s4">
  <div id="l4" class="card hidden"><div class="cb spw"><div class="spin"></div><p id="lmsg">Generating documents...</p></div></div>
  <div id="dout" class="hidden"></div>
  <div id="ddone" class="hidden">
    <div class="brow" style="margin-top:8px">
      <button class="btn bs" onclick="newShift()">New Shift</button>
      <button class="btn bs" onclick="goTo(2)">&larr; Edit Notes</button>
    </div>
  </div>
</div>

<!-- ADMIN -->
<div id="sa">
  <div class="card">
    <div class="ch"><h2>Participant Management</h2><button class="btn bs" style="margin-left:auto;padding:6px 14px;font-size:13px" onclick="goTo(1)">&larr; Back</button></div>
    <div class="cb">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:10px">Current Participants <span id="pcnt" style="font-size:13px;font-weight:400;color:var(--gr)"></span></h3>
      <div id="atbl"></div>
      <hr class="hr">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:6px">Updating Participants</h3>
      <p style="font-size:13px;color:var(--gr);margin-bottom:8px">Update the PARTICIPANTS environment variable in Render and redeploy. Goals and BSP/RP fields are optional but enable goal alignment and correct RP documentation.</p>
      <div class="envbox" id="ejson"></div>
      <div style="margin-top:12px;padding:12px 14px;background:var(--tl);border-radius:8px;font-size:13px;color:var(--td)">
        <strong>Steps:</strong> Render &rarr; Environment &rarr; Edit PARTICIPANTS &rarr; paste updated JSON &rarr; Save Changes &rarr; Manual Deploy &rarr; Deploy latest commit
      </div>
      <div style="margin-top:10px;padding:12px 14px;background:var(--grl);border-radius:8px;font-size:12px;color:var(--gr)">
        <strong>approved_rp options:</strong> Chemical, Environmental, Mechanical, Physical, Seclusion
      </div>
    </div>
  </div>
</div>

</div>
<script>
var nStyle = 's', participants = [], selP = null, analysis = null, recog = null, isRec = false;
var NL = String.fromCharCode(10);
var DOMAINS = [
  'Self-Care',
  'Daily Life Activities',
  'Communication',
  'Mobility',
  'Interpersonal Interactions and Relationships',
  'Learning and Education',
  'Employment',
  'Health and Wellbeing',
  'Mental and Emotional Health',
  'Social and Community Participation',
  'Home and Living',
  'Positive Behaviour Support',
  'Support Coordination'
];
var STYPES = ['Verbal Prompt','Verbal Guidance','Supervision','Co-regulation','Physical Assistance','Total Assistance'];

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('sdate').value = new Date().toISOString().split('T')[0];
  loadP();
  checkRec();
});

async function loadP() {
  try {
    var r = await fetch('/api/participants');
    participants = await r.json();
    var sel = document.getElementById('psel');
    sel.innerHTML = '<option value="">Select participant...</option>';
    participants.forEach(function(p) {
      var o = document.createElement('option');
      o.value = p.code; o.textContent = p.displayName;
      o.dataset.fn = p.firstName; o.dataset.ln = p.lastName;
      o.dataset.goals = JSON.stringify(p.goals || []);
      o.dataset.bsp = p.bsp ? '1' : '0';
      o.dataset.rp = JSON.stringify(p.approved_rp || []);
      sel.appendChild(o);
    });
    buildAdmin();
  } catch(e) { console.error('Load participants failed', e); }
}

function onPC() {
  var sel = document.getElementById('psel');
  var o = sel.options[sel.selectedIndex];
  if (o && o.value) {
    var goals = [], rp = [];
    try { goals = JSON.parse(o.dataset.goals || '[]'); } catch(e) {}
    try { rp = JSON.parse(o.dataset.rp || '[]'); } catch(e) {}
    selP = {code:o.value, firstName:o.dataset.fn, lastName:o.dataset.ln, displayName:o.textContent, goals:goals, bsp:o.dataset.bsp==='1', approved_rp:rp};
    var gi = document.getElementById('pi-goals'), gl = document.getElementById('pi-goals-list');
    if (goals.length) {
      gl.innerHTML = goals.map(function(g){return '<div style="margin-top:4px;font-size:13px">'+esc(g)+'</div>';}).join('');
      gi.style.display = 'block';
    } else { gi.style.display = 'none'; }
    var bi = document.getElementById('pi-bsp'), bd = document.getElementById('pi-bsp-detail');
    if (selP.bsp) {
      var rptxt = rp.length ? 'Approved RP: '+rp.join(', ') : 'No approved restrictive practices on record';
      bd.textContent = rptxt;
      bi.style.display = 'block';
    } else { bi.style.display = 'none'; }
  } else {
    selP = null;
    document.getElementById('pi-goals').style.display = 'none';
    document.getElementById('pi-bsp').style.display = 'none';
  }
  updateSI();
}

function goTo(n) {
  [1,2,3,4].forEach(function(i) {
    document.getElementById('s'+i).classList.toggle('on',i===n);
    var s = document.getElementById('st'+i);
    s.classList.remove('active','done');
    if (i<n) s.classList.add('done'); else if (i===n) s.classList.add('active');
  });
  document.getElementById('sa').classList.remove('on');
  window.scrollTo(0,0);
}
function showAdmin() {
  [1,2,3,4].forEach(function(i){document.getElementById('s'+i).classList.remove('on');});
  document.getElementById('sa').classList.add('on');
  window.scrollTo(0,0);
}
function go2() {
  if (!document.getElementById('psel').value){alert('Please select a participant.');return;}
  if (!document.getElementById('ratio').value){alert('Please select a support ratio.');return;}
  if (!document.getElementById('sdate').value){alert('Please enter the shift date.');return;}
  if (!document.getElementById('stime').value||!document.getElementById('etime').value){alert('Please enter start and end times.');return;}
  if (!document.getElementById('w1').value.trim()){alert('Please enter your name.');return;}
  goTo(2);
}
function go3() {
  if (!document.getElementById('narr').value.trim()){alert('Please describe what happened during the shift.');return;}
  doAnalysis();
}

function tm(t){var p=t.split(':').map(Number);return p[0]*60+p[1];}
function calcDur(){
  var s=document.getElementById('stime').value,e=document.getElementById('etime').value,el=document.getElementById('dur');
  if(!s||!e){el.textContent='';return;}
  var d=tm(e)-tm(s);if(d<0)d+=1440;
  el.textContent='Duration: '+(Math.floor(d/60)?Math.floor(d/60)+'h ':'')+(d%60?d%60+'min':'');
}
function calcW2(){
  var s=document.getElementById('w2s').value,e=document.getElementById('w2e').value,el=document.getElementById('w2d');
  if(!s||!e){el.textContent='';return;}
  var d=tm(e)-tm(s);if(d<0)d+=1440;
  el.textContent=(Math.floor(d/60)?Math.floor(d/60)+'h ':'')+(d%60?d%60+'min':'');
}
function calcKm(){
  var s=parseFloat(document.getElementById('odo1').value),e=parseFloat(document.getElementById('odo2').value);
  document.getElementById('km').textContent=(!isNaN(s)&&!isNaN(e)&&e>s)?'Distance: '+(e-s).toFixed(1)+' km':'';
}
function togS(id,force){
  var b=document.getElementById(id),cb=document.getElementById('cb-'+id);
  var o=force!==undefined?force:!b.classList.contains('open');
  b.classList.toggle('open',o);if(cb)cb.checked=o;
}
function setStyle(s){
  nStyle=s;
  document.getElementById('sty-s').classList.toggle('active',s==='s');
  document.getElementById('sty-e').classList.toggle('active',s==='e');
}
function onNarr(){
  document.getElementById('cc').textContent=document.getElementById('narr').value.length.toLocaleString()+' characters';
  updateSI();
}
function updateSI(){
  var narr=document.getElementById('narr').value,el=document.getElementById('si');
  if(!narr||!selP){el.textContent='';return;}
  el.textContent=narr!==scrub(narr)?'Names/addresses detected - will be removed before AI processing':'';
}

function escRx(s){var sp='.^$*+?()[]{}|\\\\',out='';for(var i=0;i<s.length;i++)out+=sp.indexOf(s[i])>=0?'\\\\'+s[i]:s[i];return out;}
function scrub(text){
  if(!text||!selP)return text;
  var out=text,fn=selP.firstName||'',ln=selP.lastName||'',dn=selP.displayName||'';
  if(dn.length>2)out=out.replace(new RegExp('\\\\b'+escRx(dn)+'\\\\b','gi'),'the participant');
  if(fn&&ln&&ln.length>1)out=out.replace(new RegExp('\\\\b'+escRx(fn)+'\\\\s+'+escRx(ln)+'\\\\b','gi'),'the participant');
  if(ln&&ln.length>2)out=out.replace(new RegExp('\\\\b'+escRx(ln)+'\\\\b','gi'),'the participant');
  if(fn&&fn.length>1)out=out.replace(new RegExp('\\\\b'+escRx(fn)+'\\\\b','gi'),'the participant');
  participants.forEach(function(p){
    if(p.code===selP.code)return;
    if(p.firstName&&p.firstName.length>1)out=out.replace(new RegExp('\\\\b'+escRx(p.firstName)+'\\\\b','gi'),'another participant');
  });
  var wn=document.getElementById('w1').value.trim().split(/\\s+/);
  if(wn.length>1&&wn[wn.length-1].length>2)out=out.replace(new RegExp('\\\\b'+escRx(wn[wn.length-1])+'\\\\b','gi'),'the worker');
  out=out.replace(/\\b\\d+[A-Za-z]?\\s+[A-Za-z][A-Za-z\\s]{1,20}(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Crescent|Cres|Court|Ct|Place|Pl|Way|Lane|Ln|Boulevard|Blvd|Highway|Hwy|Close|Cl|Terrace|Tce|Circuit|Cct|Rise|Grove|Gve|Parade|Pde)\\b/gi,'[address]');
  return out;
}
function reinject(text,fn){
  if(!fn||!text)return text;
  var n=fn.charAt(0).toUpperCase()+fn.slice(1);
  return text.replace(/\\bthe participant\\b/gi,n);
}

function buildHdr(){
  var p=selP||{displayName:'Unknown',code:'??'};
  var d=new Date(document.getElementById('sdate').value+'T12:00:00');
  var ds=d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var h='Participant: '+p.displayName+' ('+p.code+') | Date: '+ds+' | Shift: '+document.getElementById('stime').value+'-'+document.getElementById('etime').value+' | Ratio: '+document.getElementById('ratio').value+' | Worker: '+document.getElementById('w1').value.trim()+(document.getElementById('w1r').value.trim()?' ('+document.getElementById('w1r').value.trim()+')':'');
  if(document.getElementById('cb-sw').checked){var w2=document.getElementById('w2').value.trim();if(w2)h+=' | 2nd Worker: '+w2;}
  if(document.getElementById('cb-tr').checked){
    var o1=parseFloat(document.getElementById('odo1').value),o2=parseFloat(document.getElementById('odo2').value);
    var km=(!isNaN(o1)&&!isNaN(o2)&&o2>o1)?(o2-o1).toFixed(1)+' km':'';
    h+=' | Transport: '+(document.getElementById('trd').value.trim()||'provided')+(km?' - '+km:'');
  }
  return h;
}
function buildScrubbedHdr(){
  var code=selP?selP.code:'??';
  var d=new Date(document.getElementById('sdate').value+'T12:00:00');
  var ds=d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var h='Participant: '+code+' | Date: '+ds+' | Shift: '+document.getElementById('stime').value+'-'+document.getElementById('etime').value+' | Ratio: '+document.getElementById('ratio').value+' | Worker: [Worker]';
  if(document.getElementById('cb-tr').checked){
    var o1=parseFloat(document.getElementById('odo1').value),o2=parseFloat(document.getElementById('odo2').value);
    var km=(!isNaN(o1)&&!isNaN(o2)&&o2>o1)?(o2-o1).toFixed(1)+' km':'';
    h+=' | Transport: '+(document.getElementById('trd').value.trim()||'provided')+(km?' - '+km:'');
  }
  return h;
}

function chunk(txt,max){
  max=max||6000;if(txt.length<=max)return [txt];
  var chunks=[],rem=txt;
  while(rem.length>0){
    if(rem.length<=max){chunks.push(rem);break;}
    var sp=rem.lastIndexOf('. ',max);if(sp<max*0.5)sp=rem.lastIndexOf(' ',max);if(sp<0)sp=max;
    chunks.push(rem.slice(0,sp+1).trim());rem=rem.slice(sp+1).trim();
  }
  return chunks;
}

async function doAnalysis(){
  goTo(3);
  document.getElementById('l3').classList.remove('hidden');
  document.getElementById('gap-s').classList.add('hidden');
  document.getElementById('ok-s').classList.add('hidden');
  var raw=document.getElementById('narr').value.trim();
  var scrubbed=scrub(raw);
  var sHdr=buildScrubbedHdr();
  var chunks=chunk(scrubbed,6000);
  var fullNarr=scrubbed;
  if(chunks.length>1){
    try{
      var sums=[];
      for(var i=0;i<chunks.length;i++){
        var r=await callClaude([{role:'user',content:'Summarise part '+(i+1)+' of '+chunks.length+' of a support worker shift note. Extract ALL facts including every timestamp, activity, behaviour, incident and appointment.'+NL+'Part '+(i+1)+':'+NL+chunks[i]}],1500);
        sums.push(r);
      }
      fullNarr=sums.join(NL+NL);
    }catch(e){console.error('Chunk error',e);}
  }
  var incList='Escalation or Agitation, Behaviour of Concern, Disclosure, Safety Concern, Near Miss, Hospital Avoidance, Non-Routine Medication, New Alter Presentation, RP Used - Chemical, RP Used - Environmental, RP Used - Mechanical, RP Used - Physical, RP Used - Seclusion, Assault or Aggression';
  var prompt='Analyse this NDIS psychosocial disability support worker shift note.'+NL+NL+'SHIFT HEADER: '+sHdr+NL+NL+'SHIFT NOTES:'+NL+fullNarr+NL+NL+'Return ONLY valid JSON:'+NL+'{"found_incidents":["list from: '+incList+'"],"found_appointments":["appointments mentioned"],"gap_questions":[{"id":"q1","question":"specific gap"}]}'+NL+'Max 4 gap questions. Never ask about supervisor notification or shift header details.';
  try{
    var res=await callClaude([{role:'user',content:prompt}],800);
    analysis=safeParse(res);analysis.fullNarr=fullNarr;
  }catch(e){analysis={found_incidents:[],found_appointments:[],gap_questions:[],fullNarr:fullNarr};}
  document.getElementById('l3').classList.add('hidden');
  showAnalysis();
}

function showAnalysis(){
  if(analysis.gap_questions&&analysis.gap_questions.length>0){
    var list=document.getElementById('gap-list');list.innerHTML='';
    analysis.gap_questions.forEach(function(q){
      var d=document.createElement('div');d.className='gapq';
      d.innerHTML='<label>'+esc(q.question)+'</label><textarea id="ans-'+q.id+'" rows="2" placeholder="Your answer..."></textarea>';
      list.appendChild(d);
    });
    document.getElementById('gap-s').classList.remove('hidden');
  }else{
    var tags=document.getElementById('ftags');tags.innerHTML='';
    if(!analysis.found_incidents.length&&!analysis.found_appointments.length)tags.innerHTML='<span class="tag nt">No incidents or appointments detected</span>';
    analysis.found_incidents.forEach(function(i){tags.innerHTML+='<span class="tag it">'+esc(i)+'</span>';});
    analysis.found_appointments.forEach(function(a){tags.innerHTML+='<span class="tag at">'+esc(a)+'</span>';});
    document.getElementById('ok-s').classList.remove('hidden');
  }
}

async function genDocs(){
  goTo(4);
  document.getElementById('l4').classList.remove('hidden');
  document.getElementById('dout').classList.add('hidden');
  document.getElementById('ddone').classList.add('hidden');
  var sHdr=buildScrubbedHdr();
  var narr=analysis.fullNarr||scrub(document.getElementById('narr').value.trim());
  var gaps='';
  if(analysis.gap_questions)analysis.gap_questions.forEach(function(q){
    var el=document.getElementById('ans-'+q.id);
    if(el&&el.value.trim())gaps+='Q: '+q.question+NL+'A: '+el.value.trim()+NL;
  });

  var goalsText='';
  if(selP&&selP.goals&&selP.goals.length){
    goalsText='PARTICIPANT NDIS GOALS:'+NL+selP.goals.map(function(g,i){return (i+1)+'. '+g;}).join(NL)+NL+NL;
  }

  var bspText='';
  if(selP&&selP.bsp){
    bspText='BSP STATUS: Active Behaviour Support Plan in place.'+NL;
    if(selP.approved_rp&&selP.approved_rp.length){
      bspText+='APPROVED RESTRICTIVE PRACTICES: '+selP.approved_rp.join(', ')+'. If these RP types are used this shift, document under Positive Behaviour Support domain - they are AUTHORISED and NOT reportable.'+NL;
    }else{
      bspText+='No specific restrictive practices are approved - any RP used must be treated as unauthorised and reportable.'+NL;
    }
  }else{
    bspText='BSP STATUS: No behaviour support plan on record for this participant. Any restrictive practice used this shift is UNAUTHORISED and REPORTABLE.'+NL;
  }

  var domDesc='DOMAIN DEFINITIONS - use these exact names and descriptions to categorise each support instance:'+NL
    +'Self-Care: what you do TO YOUR BODY - showering, dressing, grooming, eating, drinking, toileting, personal health management'+NL
    +'Daily Life Activities: what you do IN YOUR HOME - cooking, cleaning, shopping, managing finances, household management'+NL
    +'Communication: understanding and being understood - verbal, written, augmentative communication, communication aids'+NL
    +'Mobility: moving around home and community - walking, transport, mobility aids, accessing the community'+NL
    +'Interpersonal Interactions and Relationships: social interactions, managing relationships, behaviour in social contexts'+NL
    +'Learning and Education: acquiring knowledge, formal or vocational learning, retaining information, skill development'+NL
    +'Employment: finding or maintaining work, barriers to employment, supported or voluntary employment'+NL
    +'Health and Wellbeing: managing PHYSICAL health conditions, physical health appointments, physical medications (not mental health)'+NL
    +'Mental and Emotional Health: psychosocial wellbeing, emotional regulation, co-regulation, crisis prevention, hospital avoidance, trauma responses, alter presentations in DID, managing mental health conditions day to day'+NL
    +'Social and Community Participation: what you do IN THE WORLD - community activities, recreation, social groups, outings, civic participation, reducing social isolation'+NL
    +'Home and Living: tenancy maintenance, keeping home neat and tidy, accommodation issues, public housing requirements, maintenance requests, risk of losing tenancy, supporting tenancy security'+NL
    +'Positive Behaviour Support: behaviours of concern, de-escalation, BSP implementation, authorised restrictive practices (see BSP status above)'+NL
    +'Support Coordination: INFORMAL UNPLANNED coordination activities provided because the funded support coordinator is unavailable - includes organising or attending functional capacity appointments, rescheduling allied health appointments, getting participant to sign service agreements with other providers, communicating with allied health and other health professionals to coordinate care needs. Note as informal/unplanned in documentation.';

  var styleRule=nStyle==='s'
    ?'SIMPLE style: For each support instance write 2-4 clear clinical sentences. Begin with an I-CAN statement: "With [support type], [participant name] can [capability]." Then briefly describe what happened and the participant response. Total note 400-600 words.'
    :'EXTENSIVE style: Full timestamped clinical entry for each support instance. Begin each entry with the exact timestamp. Include: I-CAN statement, polyvagal/regulatory state with specific observed behaviours, exact intervention technique used by the worker, participant response, functional capacity observations. Name alter presentations individually. Minimum 1800 words. NEVER bundle timestamps - each is a separate entry.';

  var freqRule='FREQUENCY scoring per domain - score based on how many instances occurred in this shift: Sometimes = 1 to 2 instances. Often = 3 or more instances. Always = continuous ongoing support needed throughout the entire shift. Use Not applicable only if the domain is genuinely not relevant to this participant.';

  var wsRule='WITHOUT SUPPORTS ASSESSMENT - mandatory, critical for NDIA funding evidence. Describe what would have happened if no support was present today. Always address: (1) Daily living activities that would not have been initiated or completed. (2) Social isolation - for psychosocial participants this is critical: without support they typically remain completely isolated at home, do not leave, ruminate on distressing thoughts, and experience rapid mental health deterioration. Document explicitly. (3) Mental health escalation and hospitalisation risk. (4) Physical health risks - not eating, not taking medication. (5) Any tenancy or home maintenance risks. (6) Specific regression risk. Use direct NDIA language. End with regression_statement: one direct sentence about risk within a specific timeframe.';

  var incRule='INCIDENTS: Non-routine medication only (not standard morning/evening Webster pack). New/undocumented alter = New Alter Presentation incident. Unauthorised RP = reportable. Do NOT suggest calling management - provider receives real-time Shiftcare notifications. For reportable incidents note NDIS Commission notification requirement.';

  var instSchema='{"time":"exact timestamp or empty string for simple","support_type":"one of: Verbal Prompt/Verbal Guidance/Supervision/Co-regulation/Physical Assistance/Total Assistance","ican_statement":"With [support type], [participant first name] can [strengths-based capability statement]","description":"clinical description per style rule","goals_supported":["matching goal text or empty array"]}';

  var prompt='You are an NDIS psychosocial disability documentation specialist. Generate I-CAN v6 aligned shift documentation.'+NL+NL+incRule+NL+NL+bspText+NL+domDesc+NL+NL+'SHIFT HEADER: '+sHdr+NL+goalsText+'WORKER ACCOUNT:'+NL+narr+(gaps?NL+NL+'ADDITIONAL INFO:'+NL+gaps:'')+NL+'DETECTED: '+(analysis.found_incidents.join(', ')||'None')+NL+NL+styleRule+NL+NL+freqRule+NL+NL+wsRule+NL+NL+'Generate ONE JSON object:'+NL
    +'{'
    +NL+'"shift_summary":"2-3 sentence clinical overview",'
    +NL+'"domains":['
    +NL+'{"domain":"exact domain name","frequency":"Sometimes or Often or Always","instances":['+instSchema+']}'
    +NL+'],'
    +NL+'"support_summary":{"verbal_prompt":0,"verbal_guidance":0,"supervision":0,"co_regulation":0,"physical_assistance":0,"total_assistance":0},'
    +NL+'"without_supports":{"narrative":"full clinical statement","key_risks":["risk 1","risk 2","risk 3"],"regression_statement":"Without daily support...","risk_level":"Low or Moderate or High or Critical"},'
    +NL+'"incidents":[{"type":"","reportable":false,"ndis_category":"","notification_timeline":"","before":"","during":"","after":"","actions_taken":""}],'
    +NL+'"appointments":[{"type":"","date_time":"","details":""}]'
    +NL+'}'
    +NL+'Only include domains where support was provided. Refer to participant by first name throughout. Strengths-based person-centred NDIS language. Return ONLY valid JSON.';

  try{
    var res=await callClaude([{role:'user',content:prompt}],8000);
    var docs=safeParse(res);
    var fn=selP?selP.firstName:'';
    if(fn){
      docs.shift_summary=reinject(docs.shift_summary||'',fn);
      if(docs.without_supports){
        docs.without_supports.narrative=reinject(docs.without_supports.narrative||'',fn);
        docs.without_supports.regression_statement=reinject(docs.without_supports.regression_statement||'',fn);
      }
      if(docs.domains)docs.domains=docs.domains.map(function(d){
        if(d.instances)d.instances=d.instances.map(function(inst){
          inst.ican_statement=reinject(inst.ican_statement||'',fn);
          inst.description=reinject(inst.description||'',fn);return inst;
        });return d;
      });
      if(docs.incidents)docs.incidents=docs.incidents.map(function(inc){
        inc.before=reinject(inc.before||'',fn);inc.during=reinject(inc.during||'',fn);
        inc.after=reinject(inc.after||'',fn);inc.actions_taken=reinject(inc.actions_taken||'',fn);return inc;
      });
    }
    var fullHdr=buildHdr();
    saveBackup(buildCopyText(docs,fullHdr));
    renderDocs(docs,fullHdr);
  }catch(e){
    document.getElementById('l4').classList.add('hidden');
    document.getElementById('dout').innerHTML='<div class="card"><div class="cb"><p style="color:var(--r)">Error: '+esc(e.message)+'. Please go back and try again.</p></div></div>';
    document.getElementById('dout').classList.remove('hidden');
    document.getElementById('ddone').classList.remove('hidden');
  }
}

function freqClass(f){
  if(!f)return '';
  var fl=f.toLowerCase();
  if(fl==='always')return 'freq-always';
  if(fl==='often')return 'freq-often';
  return 'freq-sometimes';
}
function stClass(t){var m={'Verbal Prompt':'st-vp','Verbal Guidance':'st-vg','Supervision':'st-sv','Co-regulation':'st-cr','Physical Assistance':'st-pa','Total Assistance':'st-ta'};return m[t]||'st-vp';}

function buildCopyText(docs,hdr){
  var NLC=String.fromCharCode(10);
  var out=hdr+NLC+NLC;
  if(docs.shift_summary)out+=docs.shift_summary+NLC+NLC;
  if(docs.domains)docs.domains.forEach(function(d){
    if(!d.instances||!d.instances.length)return;
    out+=d.domain.toUpperCase()+' ('+d.instances.length+' instance'+(d.instances.length!==1?'s':'')+') - Frequency: '+(d.frequency||'Sometimes')+NLC;
    d.instances.forEach(function(inst){
      if(inst.time)out+=inst.time+' | ';
      out+=(inst.support_type||'')+NLC;
      if(inst.ican_statement)out+=inst.ican_statement+NLC;
      if(inst.description)out+=inst.description+NLC;
      if(inst.goals_supported&&inst.goals_supported.length)out+='Goals: '+inst.goals_supported.join('; ')+NLC;
      out+=NLC;
    });
  });
  if(docs.support_summary){
    var ss=docs.support_summary;
    var total=(ss.verbal_prompt||0)+(ss.verbal_guidance||0)+(ss.supervision||0)+(ss.co_regulation||0)+(ss.physical_assistance||0)+(ss.total_assistance||0);
    out+='SUPPORT FREQUENCY SUMMARY - Total instances this shift: '+total+NLC;
    ['verbal_prompt','verbal_guidance','supervision','co_regulation','physical_assistance','total_assistance'].forEach(function(k){
      if(ss[k])out+=k.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase()})+': '+ss[k]+'  ';
    });
    out+=NLC+NLC;
  }
  var ws=docs.without_supports||{};
  var wsRisk=ws.risk_level||docs.risk_level||'Unknown';
  out+='WITHOUT SUPPORT ASSESSMENT (Risk Level: '+wsRisk+')'+NLC;
  if(ws.narrative)out+=ws.narrative+NLC+NLC;
  if(ws.key_risks&&ws.key_risks.length){out+='Key Risks:'+NLC;ws.key_risks.forEach(function(r){out+='- '+r+NLC;});out+=NLC;}
  if(ws.regression_statement)out+='Regression Risk: '+ws.regression_statement+NLC;
  return out;
}

function renderDocs(docs,hdr){
  document.getElementById('l4').classList.add('hidden');
  var out=document.getElementById('dout');out.innerHTML='';
  var copyText=buildCopyText(docs,hdr);
  var ws=docs.without_supports||{};
  var wsRisk=ws.risk_level||docs.risk_level||'Unknown';
  var rClass=wsRisk.toLowerCase()==='critical'?'risk-crit':wsRisk.toLowerCase()==='high'?'risk-high':wsRisk.toLowerCase()==='moderate'?'risk-mod':'risk-low';

  var master=document.createElement('div');master.className='master-copy';
  master.innerHTML='<div><div class="master-copy-lbl">Complete Shift Note - Ready for Shiftcare</div><div class="master-copy-sub">Copies all sections as one document</div></div><button class="bcopy" onclick="doCopy(\'master-txt\',this)" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);color:#fff">Copy Full Note</button><div id="master-txt" style="display:none">'+esc(copyText)+'</div>';
  out.appendChild(master);

  if(docs.shift_summary){
    var sc=document.createElement('div');sc.className='card';
    sc.innerHTML='<div class="ch"><h2>Shift Summary</h2><span class="badge pu">I-CAN v6</span></div><div class="cb" style="font-size:14px;line-height:1.7">'+esc(docs.shift_summary)+'</div>';
    out.appendChild(sc);
  }

  if(docs.domains&&docs.domains.length){
    var domWrap=document.createElement('div');domWrap.className='card';
    var dHdr=document.createElement('div');dHdr.className='ch';
    dHdr.innerHTML='<h2>Functional Domain Documentation</h2><span class="badge pu">I-CAN v6 Aligned</span>';
    domWrap.appendChild(dHdr);
    var dBody=document.createElement('div');dBody.style.padding='12px';
    docs.domains.forEach(function(d){
      if(!d.instances||!d.instances.length)return;
      var dc=document.createElement('div');dc.className='dom-card';
      var freq=d.frequency||'Sometimes';
      var dhd=document.createElement('div');dhd.className='dom-hd';
      dhd.innerHTML='<div class="dom-title">'+esc(d.domain)+'</div><div class="dom-meta"><span class="dom-count">'+d.instances.length+' instance'+(d.instances.length!==1?'s':'')+'</span><span class="dom-freq '+freqClass(freq)+'">'+esc(freq)+'</span></div>';
      dc.appendChild(dhd);
      var db=document.createElement('div');
      d.instances.forEach(function(inst){
        var iv=document.createElement('div');iv.className='inst';
        var hd='<div class="inst-hd">'+(inst.time?'<span class="inst-time">'+esc(inst.time)+'</span>':'')+'<span class="st-badge '+stClass(inst.support_type||'')+'">'+esc(inst.support_type||'Support')+'</span></div>';
        var ican=inst.ican_statement?'<div class="ican-stmt">'+esc(inst.ican_statement)+'</div>':'';
        var desc=inst.description?'<div class="inst-desc">'+esc(inst.description)+'</div>':'';
        var gtags='';
        if(inst.goals_supported&&inst.goals_supported.length){
          gtags='<div class="goal-tags">';
          inst.goals_supported.forEach(function(g){gtags+='<span class="goal-tag">'+esc(g)+'</span>';});
          gtags+='</div>';
        }
        iv.innerHTML=hd+ican+desc+gtags;db.appendChild(iv);
      });
      dc.appendChild(db);dBody.appendChild(dc);
    });
    domWrap.appendChild(dBody);out.appendChild(domWrap);
  }

  if(docs.support_summary){
    var ss=docs.support_summary;
    var total=(ss.verbal_prompt||0)+(ss.verbal_guidance||0)+(ss.supervision||0)+(ss.co_regulation||0)+(ss.physical_assistance||0)+(ss.total_assistance||0);
    var scard=document.createElement('div');scard.className='card';
    var scells='';
    var labels={verbal_prompt:'Verbal Prompt',verbal_guidance:'Verbal Guidance',supervision:'Supervision',co_regulation:'Co-regulation',physical_assistance:'Physical Assistance',total_assistance:'Total Assistance'};
    Object.keys(labels).forEach(function(k){if(ss[k])scells+='<div class="sum-cell"><div class="sum-num">'+ss[k]+'</div><div class="sum-lbl">'+labels[k]+'</div></div>';});
    scard.innerHTML='<div class="ch"><h2>Support Frequency Summary</h2><span class="badge">'+total+' total instances</span></div><div class="cb"><div class="sum-grid">'+scells+'</div></div>';
    out.appendChild(scard);
  }

  var wscard=document.createElement('div');wscard.className='ws-card';
  var wsHTML='<div class="ws-hd"><div class="ws-title">Without Support Assessment</div><span class="risk-badge '+rClass+'">Risk: '+esc(wsRisk)+'</span></div><div class="ws-body">';
  if(ws.narrative)wsHTML+='<div class="ws-narrative">'+esc(ws.narrative)+'</div>';
  if(ws.key_risks&&ws.key_risks.length){
    wsHTML+='<div class="ws-risks"><h4>Key Risks If Support Is Reduced or Removed</h4>';
    ws.key_risks.forEach(function(r){wsHTML+='<div class="ws-risk-item">'+esc(r)+'</div>';});
    wsHTML+='</div>';
  }
  if(ws.regression_statement)wsHTML+='<div class="ws-regression">'+esc(ws.regression_statement)+'</div>';
  wsHTML+='</div>';
  wscard.innerHTML=wsHTML;out.appendChild(wscard);

  (docs.incidents||[]).forEach(function(inc,i){
    if(!inc.type||inc.type==='')return;
    var isR=inc.reportable===true;
    var c=document.createElement('div');c.className='oc '+(isR?'rep':'inc');
    var NLC=String.fromCharCode(10);
    var incTxt='INCIDENT REPORT - '+inc.type;
    if(isR)incTxt+=NLC+NLC+'REPORTABLE INCIDENT'+NLC+'NDIS Category: '+(inc.ndis_category||'See NDIS Commission')+NLC+'Notification required: '+(inc.notification_timeline||'Within 24 hours');
    incTxt+=NLC+NLC+'BEFORE'+NLC+(inc.before||'Not documented')+NLC+NLC+'DURING'+NLC+(inc.during||'Not documented')+NLC+NLC+'AFTER'+NLC+(inc.after||'Not documented')+NLC+NLC+'ACTIONS TAKEN'+NLC+(inc.actions_taken||'Not documented');
    var body='<div class="ocb">';
    if(isR)body+='<div class="nb"><h4>NDIS Commission Notification Required</h4><p>Category: '+esc(inc.ndis_category||'See guidelines')+'</p><p style="margin-top:4px">Timeline: '+esc(inc.notification_timeline||'Within 24 hours')+'</p></div>';
    body+='<div class="sl">Before</div><div class="st">'+esc(inc.before||'Not documented')+'</div>';
    body+='<div class="sl">During</div><div class="st">'+esc(inc.during||'Not documented')+'</div>';
    body+='<div class="sl">After</div><div class="st">'+esc(inc.after||'Not documented')+'</div>';
    body+='<div class="sl">Actions Taken</div><div class="st">'+esc(inc.actions_taken||'Not documented')+'</div>';
    body+='<div id="inc'+i+'" style="display:none">'+esc(incTxt)+'</div></div>';
    c.innerHTML=(isR?'<div class="repalert">REPORTABLE INCIDENT - CALL MANAGEMENT NOW</div>':'')+'<div class="och"><div class="oct">'+(isR?'Reportable: ':'')+esc(inc.type)+'</div>'+cbtn('inc'+i)+'</div>'+body;
    out.appendChild(c);
  });

  (docs.appointments||[]).forEach(function(apt,i){
    if(!apt.type||apt.type==='')return;
    var NLC=String.fromCharCode(10);
    var c=document.createElement('div');c.className='oc apt';
    var t='APPOINTMENT - '+apt.type+(apt.date_time?NLC+'Date/Time: '+apt.date_time:'')+NLC+'Details: '+(apt.details||'');
    c.innerHTML='<div class="och"><div class="oct">'+esc(apt.type)+' - For Tiarne to Roster</div>'+cbtn('apt'+i)+'</div><div class="ocb"><div style="font-size:14px;line-height:1.6">'+esc(t)+'</div><div id="apt'+i+'" style="display:none">'+esc(t)+'</div></div>';
    out.appendChild(c);
  });

  out.classList.remove('hidden');
  document.getElementById('ddone').classList.remove('hidden');
  window.scrollTo(0,0);
}

function cbtn(id){return '<button class="bcopy" onclick="doCopy(\''+id+'\',this)">Copy for Shiftcare</button>';}
function doCopy(id,btn){
  var el=document.getElementById(id);if(!el)return;
  navigator.clipboard.writeText(el.textContent).then(function(){
    var orig=btn.innerHTML;btn.innerHTML='Copied!';btn.classList.add('ok');
    setTimeout(function(){btn.innerHTML=orig;btn.classList.remove('ok');},2500);
  });
}
function esc(t){return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function safeParse(str){
  str=(str||'').replace(/\`\`\`json|\`\`\`/g,'').trim();
  try{return JSON.parse(str);}catch(e1){}
  try{
    var f='',inStr=false;
    for(var i=0;i<str.length;i++){
      var c=str[i],cc=str.charCodeAt(i);
      if(c==='"'&&str[i-1]!=='\\\\')inStr=!inStr;
      if(inStr&&cc===10){f+=String.fromCharCode(92)+'n';continue;}
      if(inStr&&cc===13){f+=String.fromCharCode(92)+'r';continue;}
      if(inStr&&cc===9){f+=String.fromCharCode(92)+'t';continue;}
      f+=c;
    }
    return JSON.parse(f);
  }catch(e2){}
  try{return JSON.parse(str.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]/g,''));}catch(e3){
    throw new Error('Could not parse AI response. Please go back and try again.');
  }
}

function saveBackup(txt){try{localStorage.setItem('cr_bk',JSON.stringify({text:txt,ts:Date.now(),p:selP?selP.displayName:''}));}catch(e){}}
function checkRec(){
  try{
    var raw=localStorage.getItem('cr_bk');if(!raw)return;
    var d=JSON.parse(raw);
    if(Date.now()-d.ts>86400000){localStorage.removeItem('cr_bk');return;}
    var mins=Math.round((Date.now()-d.ts)/60000);
    document.getElementById('rtime').textContent='Saved '+(mins<60?mins+' mins ago':Math.round(mins/60)+'h ago')+(d.p?' - '+d.p:'');
    document.getElementById('rban').classList.remove('hidden');
  }catch(e){}
}
function doRecover(){
  try{
    var d=JSON.parse(localStorage.getItem('cr_bk'));if(!d)return;
    goTo(4);var out=document.getElementById('dout');
    out.innerHTML='<div class="master-copy"><div><div class="master-copy-lbl">Recovered Note</div></div>'+cbtn('rn')+'</div><div id="rn" style="display:none">'+esc(d.text)+'</div>';
    out.classList.remove('hidden');document.getElementById('ddone').classList.remove('hidden');
    document.getElementById('l4').classList.add('hidden');
  }catch(e){}
}

function buildAdmin(){
  var c=document.getElementById('atbl'),cnt=document.getElementById('pcnt');
  if(cnt)cnt.textContent='('+participants.length+' loaded)';
  if(!participants.length){
    c.innerHTML='<div class="err">No participants loaded. Check the PARTICIPANTS environment variable in Render and redeploy after saving.</div>';
  }else{
    var h='<table class="admt"><thead><tr><th>Code</th><th>Name</th><th>Goals</th><th>BSP</th><th>Approved RP</th></tr></thead><tbody>';
    participants.forEach(function(p){
      h+='<tr><td>'+esc(p.code)+'</td><td>'+esc(p.displayName)+'</td><td>'+(p.goals&&p.goals.length?p.goals.length+' set':'None')+'</td><td>'+(p.bsp?'Yes':'No')+'</td><td>'+(p.approved_rp&&p.approved_rp.length?esc(p.approved_rp.join(', ')):'None')+'</td></tr>';
    });
    c.innerHTML=h+'</tbody></table>';
  }
  var ev=document.getElementById('ejson');
  if(ev){
    var sample=participants.length?participants:[{code:'P01',firstName:'Belinda',lastName:'Hemmens',goals:['Maintain daily living skills with minimal support','Increase community participation and reduce social isolation'],bsp:true,approved_rp:['Environmental','Chemical']}];
    ev.textContent=JSON.stringify(sample.map(function(p){return{code:p.code,firstName:p.firstName,lastName:p.lastName||'',goals:p.goals||[],bsp:p.bsp||false,approved_rp:p.approved_rp||[]};}),null,2);
  }
}

function doVoice(){
  if(!('webkitSpeechRecognition'in window||'SpeechRecognition'in window)){alert('Voice input requires Chrome browser.');return;}
  if(isRec){recog&&recog.stop();return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recog=new SR();recog.continuous=true;recog.interimResults=true;recog.lang='en-AU';
  var fin=document.getElementById('narr').value;
  recog.onstart=function(){isRec=true;var b=document.getElementById('vbtn');b.textContent='Stop';b.classList.add('rec');};
  recog.onresult=function(e){
    var interim='';
    for(var i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)fin+=e.results[i][0].transcript+' ';else interim+=e.results[i][0].transcript;}
    document.getElementById('narr').value=fin+interim;onNarr();
  };
  recog.onend=function(){isRec=false;document.getElementById('narr').value=fin.trim();var b=document.getElementById('vbtn');b.textContent='Speak';b.classList.remove('rec');onNarr();};
  recog.start();
}

async function callClaude(messages,maxT){
  var r=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:maxT||1500,messages:messages})});
  var d=await r.json();if(!r.ok||d.error)throw new Error(d.error?d.error.message:'API error');
  return d.content[0].text;
}

function newShift(){
  ['psel','ratio','stime','etime','w1','w1r','w2','narr'].forEach(function(id){document.getElementById(id).value='';});
  ['dur','cc','si'].forEach(function(id){document.getElementById(id).textContent='';});
  document.getElementById('cc').textContent='0 characters';
  document.getElementById('sdate').value=new Date().toISOString().split('T')[0];
  document.getElementById('pi-goals').style.display='none';document.getElementById('pi-bsp').style.display='none';
  ['sw','tr'].forEach(function(id){document.getElementById(id).classList.remove('open');document.getElementById('cb-'+id).checked=false;});
  selP=null;analysis=null;goTo(1);
}
</script>
</body>
</html>`;

app.get('/', (req, res) => { res.setHeader('Content-Type','text/html'); res.send(HTML); });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('CareRender v8 running on port ' + PORT));
