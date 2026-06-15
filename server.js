const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));

function getParticipants() {
  try { if (process.env.PARTICIPANTS) return JSON.parse(process.env.PARTICIPANTS); } catch(e) {}
  return [{code:'P01',firstName:'Participant',lastName:'One'},{code:'P02',firstName:'Participant',lastName:'Two'}];
}

app.get('/api/participants', (req, res) => {
  res.json(getParticipants().map(p => ({
    code: p.code, firstName: p.firstName, lastName: p.lastName||'',
    displayName: p.firstName + (p.lastName ? ' ' + p.lastName : '')
  })));
});

app.post('/api/claude', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({error:{message:'ANTHROPIC_API_KEY not set in Render environment.'}});
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
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
:root{--t:#1A6B72;--tl:#E8F4F5;--tm:#C2E0E3;--td:#124E54;--a:#D97706;--al:#FEF3C7;--r:#DC2626;--rl:#FEE2E2;--g:#059669;--gl:#D1FAE5;--gr:#6B7280;--grl:#F3F4F6;--b:#E5E7EB;--tx:#111827}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0F4F5;color:var(--tx);min-height:100vh}
.hdr{background:var(--td);color:#fff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:22px;font-weight:700}.logo span{color:var(--tm)}
.sub{font-size:12px;color:var(--tm);margin-top:2px}
.hbtn{background:rgba(255,255,255,.15);border:none;color:#fff;padding:7px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer}
.hbtn:hover{background:rgba(255,255,255,.25)}
.steps{background:#fff;border-bottom:1px solid var(--b);padding:12px 20px;display:flex;gap:8px;overflow-x:auto}
.step{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--gr);white-space:nowrap}
.step.active{color:var(--t);font-weight:600}.step.done{color:var(--g)}
.sn{width:22px;height:22px;border-radius:50%;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.step.done .sn{background:var(--g);border-color:var(--g);color:#fff}
.step.active .sn{background:var(--t);border-color:var(--t);color:#fff}
.sd{color:var(--b);font-size:18px}
.main{max-width:720px;margin:0 auto;padding:20px 16px 80px}
.card{background:#fff;border-radius:12px;border:1px solid var(--b);margin-bottom:16px;overflow:hidden}
.ch{padding:14px 18px;background:var(--tl);border-bottom:1px solid var(--tm);display:flex;align-items:center;gap:10px}
.ch h2{font-size:16px;font-weight:700;color:var(--td)}
.badge{background:var(--t);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}
.cb{padding:18px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.row3{grid-template-columns:1fr 1fr 1fr}
.row1{grid-template-columns:1fr}
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
.vbtn{position:absolute;bottom:10px;right:10px;background:var(--t);color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px}
.vbtn.rec{background:var(--r);animation:pulse 1.2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
.btn{padding:11px 24px;border-radius:9px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all .15s;display:inline-flex;align-items:center;gap:8px}
.bp{background:var(--t);color:#fff}.bp:hover{background:var(--td)}
.bs{background:#fff;color:var(--t);border:2px solid var(--t)}.bs:hover{background:var(--tl)}
.bcopy{background:var(--grl);color:var(--tx);border:1px solid var(--b);padding:7px 14px;font-size:13px;border-radius:7px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.bcopy:hover{background:var(--tl);border-color:var(--t)}
.bcopy.ok{background:var(--gl);border-color:var(--g);color:var(--g)}
.brow{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px}
.spin-w{text-align:center;padding:40px 20px}
.spin{width:40px;height:40px;border:3px solid var(--tm);border-top-color:var(--t);border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 16px}
@keyframes sp{to{transform:rotate(360deg)}}
.spin-w p{color:var(--gr);font-size:14px}
.gapbox{background:var(--al);border:1.5px solid #FCD34D;border-radius:10px;padding:16px;margin-bottom:16px}
.gapbox h3{font-size:14px;font-weight:700;color:#92400E;margin-bottom:12px}
.gapq{margin-bottom:12px}
.gapq label{font-size:13px;font-weight:600;color:#78350F;display:block;margin-bottom:5px}
.gapq textarea{width:100%;border:1.5px solid #FCD34D;border-radius:7px;padding:8px 10px;font-size:14px;font-family:inherit;min-height:60px;resize:vertical;background:#fff}
.oc{border-radius:10px;border:1.5px solid var(--b);margin-bottom:14px;overflow:hidden}
.oc.note{border-color:var(--t)}.oc.inc{border-color:var(--a)}.oc.rep{border-color:var(--r)}.oc.apt{border-color:var(--t)}
.och{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.oc.note .och{background:var(--tl)}.oc.inc .och{background:var(--al)}.oc.rep .och{background:var(--rl)}.oc.apt .och{background:var(--tl)}
.oct{font-size:15px;font-weight:700}
.oc.note .oct,.oc.apt .oct{color:var(--td)}.oc.inc .oct{color:#92400E}.oc.rep .oct{color:var(--r)}
.ocb{padding:16px}
.otxt{font-size:14px;line-height:1.7;white-space:pre-wrap;color:var(--tx)}
.repalert{background:var(--r);color:#fff;padding:10px 16px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px}
.nbox{background:var(--rl);border:1px solid #FCA5A5;border-radius:8px;padding:12px;margin-top:12px;font-size:13px}
.nbox h4{font-weight:700;color:var(--r);margin-bottom:6px}
.sec-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gr);margin-bottom:4px;margin-top:10px}
.sec-lbl:first-child{margin-top:0}
.sec-txt{font-size:14px;line-height:1.6;color:var(--tx);margin-bottom:8px}
.sfbox{background:#FFF8E6;border:1px solid #FCD34D;border-radius:8px;padding:10px 14px;margin-top:8px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.tag{font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px}
.tag.it{background:var(--al);color:#92400E;border:1px solid #FCD34D}
.tag.at{background:var(--tl);color:var(--td);border:1px solid var(--tm)}
.tag.nt{background:var(--gl);color:#065F46;border:1px solid #6EE7B7}
.ok-banner{background:var(--gl);border:1.5px solid #6EE7B7;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:10px;margin-bottom:16px;font-size:14px;color:#065F46;font-weight:600}
.pv{background:var(--tl);border:1px solid var(--tm);border-radius:8px;padding:9px 14px;font-size:12px;color:var(--td);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.infobox{background:#EDE9FE;border:1.5px solid #C4B5FD;border-radius:10px;padding:12px 16px;font-size:13px;color:#4C1D95;margin-bottom:14px;display:flex;gap:10px}
.recban{background:#FFF8E6;border:1.5px solid #FCD34D;border-radius:10px;padding:12px 16px;font-size:13px;color:#78350F;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.hr{border:none;border-top:1px solid var(--b);margin:16px 0}
.si{font-size:11px;color:var(--t);margin-top:3px;min-height:16px}
.err{background:var(--rl);border:1.5px solid #FCA5A5;border-radius:8px;padding:14px;font-size:13px;color:var(--r)}
.admt{width:100%;border-collapse:collapse;font-size:14px}
.admt th{background:var(--tl);padding:10px 14px;text-align:left;font-size:12px;font-weight:700;color:var(--td);text-transform:uppercase;letter-spacing:.5px}
.admt td{padding:10px 14px;border-bottom:1px solid var(--b)}
.envbox{background:#1e1e2e;color:#cdd6f4;border-radius:10px;padding:16px;font-family:monospace;font-size:12px;overflow-x:auto;margin-top:10px;line-height:1.6;white-space:pre-wrap;word-break:break-all}
.hidden{display:none!important}
#s1,#s2,#s3,#s4,#sa{display:none}
#s1.on,#s2.on,#s3.on,#s4.on,#sa.on{display:block}
</style>
</head>
<body>
<div class="hdr">
  <div><div class="logo">Care<span>Render</span></div><div class="sub">Compass House &middot; Capture Accurately, Record Everything</div></div>
  <button class="hbtn" onclick="showAdmin()">&#9881; Participants</button>
</div>
<div class="steps">
  <div class="step active" id="st1"><div class="sn">1</div> Shift Details</div><div class="sd">&rsaquo;</div>
  <div class="step" id="st2"><div class="sn">2</div> What Happened</div><div class="sd">&rsaquo;</div>
  <div class="step" id="st3"><div class="sn">3</div> Review</div><div class="sd">&rsaquo;</div>
  <div class="step" id="st4"><div class="sn">4</div> Documents</div>
</div>
<div class="main">

<!-- SCREEN 1 -->
<div id="s1" class="on">
  <div id="rban" class="recban hidden">
    <span>&#128190; Unsaved note found &mdash; <strong id="rtime"></strong></span>
    <button class="bcopy" onclick="doRecover()">Recover note</button>
  </div>
  <div class="card">
    <div class="ch"><span class="badge">STEP 1</span><h2>Shift Details</h2></div>
    <div class="cb">
      <div class="f" style="margin-bottom:16px">
        <label>Note Type</label>
        <div class="styrow">
          <button class="sbtn active" id="sty-s" onclick="setStyle('s')">Simple <small>Short shifts &middot; prose &middot; 150-200 words</small></button>
          <button class="sbtn" id="sty-e" onclick="setStyle('e')">Extensive <small>Complex participants &middot; all timestamps preserved &middot; 2000+ words</small></button>
        </div>
      </div>
      <div class="pv">&#128274; Workers write real names freely &mdash; CareRender removes all names and addresses before the AI sees anything.</div>
      <div class="row2">
        <div class="f"><label>Participant</label><select id="psel" onchange="onPC()"><option value="">- Loading... -</option></select></div>
        <div class="f"><label>Support Ratio</label><select id="ratio"><option value="">- Select -</option><option>1:1</option><option>1:2</option><option>1:3</option></select></div>
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
          <div class="row2"><div class="f"><label>Name</label><input type="text" id="w2" placeholder="Second worker name"></div><div class="f"><label>Start Time</label><input type="time" id="w2s" oninput="calcW2()"></div></div>
          <div class="row2"><div class="f"><label>End Time</label><input type="time" id="w2e" oninput="calcW2()"></div><div class="f"><div class="calc" id="w2d" style="padding-top:20px"></div></div></div>
        </div>
      </div>
      <div class="tog">
        <div class="togh" onclick="togS('tr')">
          <input type="checkbox" id="cb-tr" onclick="event.stopPropagation();togS('tr',this.checked)">
          <label for="cb-tr">Transport provided this shift</label><span class="hint">Optional</span>
        </div>
        <div class="togb" id="tr">
          <div class="row2"><div class="f"><label>Odometer Start (km)</label><input type="number" id="odo1" oninput="calcKm()"></div><div class="f"><label>Odometer End (km)</label><input type="number" id="odo2" oninput="calcKm()"></div></div>
          <div class="calc" id="km"></div>
          <div class="row2 row1" style="margin-top:10px"><div class="f"><label>Destination(s)</label><input type="text" id="trd" placeholder="e.g. Rockhampton Base Hospital, Stockland"></div></div>
        </div>
      </div>
      <div class="brow"><button class="btn bp" onclick="go2()">Next: What Happened &rarr;</button></div>
    </div>
  </div>
</div>

<!-- SCREEN 2 -->
<div id="s2">
  <div class="card">
    <div class="ch"><span class="badge">STEP 2</span><h2>What Happened This Shift</h2></div>
    <div class="cb">
      <div class="infobox">&#128274; <span>Write naturally using the participant's real name. CareRender automatically removes all names and addresses before the AI processes anything.</span></div>
      <div class="f">
        <label>Describe what happened &mdash; in your own words</label>
        <div class="nwrap">
          <textarea id="narr" rows="9" oninput="onNarr()" placeholder="Write naturally using the participant's real name. Include all timestamps exactly as you recorded them.

Include: how they were when you arrived, each activity with the time, any behaviour or incidents, how they were when you left. For extensive notes, include every timestamp you recorded during the shift."></textarea>
          <button class="vbtn" id="vbtn" onclick="doVoice()">&#127908; Speak</button>
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

<!-- SCREEN 3 -->
<div id="s3">
  <div id="l3" class="card hidden"><div class="cb spin-w"><div class="spin"></div><p>Analysing shift notes...</p></div></div>
  <div id="gap-s" class="hidden">
    <div class="card">
      <div class="ch"><span class="badge">STEP 3</span><h2>A Few Quick Questions</h2></div>
      <div class="cb">
        <div class="gapbox"><h3>&#9888;&#65039; A bit more detail will improve the note</h3><div id="gap-list"></div></div>
        <div class="brow"><button class="btn bs" onclick="goTo(2)">&larr; Edit Notes</button><button class="btn bp" onclick="genDocs()">Generate Documents &rarr;</button></div>
      </div>
    </div>
  </div>
  <div id="ok-s" class="hidden">
    <div class="card">
      <div class="ch"><span class="badge">STEP 3</span><h2>Ready to Generate</h2></div>
      <div class="cb">
        <div class="ok-banner">&#10003; All information captured. Ready to generate documents.</div>
        <div class="tags" id="ftags"></div>
        <div class="brow"><button class="btn bs" onclick="goTo(2)">&larr; Edit Notes</button><button class="btn bp" onclick="genDocs()">Generate Documents &rarr;</button></div>
      </div>
    </div>
  </div>
</div>

<!-- SCREEN 4 -->
<div id="s4">
  <div id="l4" class="card hidden"><div class="cb spin-w"><div class="spin"></div><p id="lmsg">Generating documents...</p></div></div>
  <div id="dout" class="hidden"></div>
  <div id="ddone" class="hidden">
    <div class="brow" style="margin-top:8px">
      <button class="btn bs" onclick="newShift()">&#8617; New Shift</button>
      <button class="btn bs" onclick="goTo(2)">&larr; Edit Notes</button>
    </div>
  </div>
</div>

<!-- ADMIN -->
<div id="sa">
  <div class="card">
    <div class="ch"><h2>&#9881; Participant Management</h2><button class="btn bs" style="margin-left:auto;padding:6px 14px;font-size:13px" onclick="goTo(1)">&larr; Back</button></div>
    <div class="cb">
      <p style="font-size:14px;color:var(--gr);margin-bottom:16px">Workers select participants by real name. Names are stripped before reaching the AI.</p>
      <h3 style="font-size:15px;font-weight:700;margin-bottom:10px">Current Participants <span id="pcnt" style="font-size:13px;font-weight:400;color:var(--gr)"></span></h3>
      <div id="atbl"></div>
      <hr class="hr">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:8px">How to Add or Edit Participants</h3>
      <p style="font-size:13px;color:var(--gr);margin-bottom:8px">Update the PARTICIPANTS environment variable in Render, then redeploy.</p>
      <p style="font-size:12px;font-weight:700;color:var(--gr);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Copy this JSON into Render's PARTICIPANTS variable:</p>
      <div class="envbox" id="ejson"></div>
      <div style="margin-top:12px;padding:12px 14px;background:var(--tl);border-radius:8px;font-size:13px;color:var(--td)">
        <strong>Steps:</strong> Render &rarr; Environment &rarr; Edit PARTICIPANTS &rarr; paste JSON &rarr; Save &rarr; Manual Deploy &rarr; Deploy latest commit
      </div>
    </div>
  </div>
</div>

</div>

<script>
var nStyle = 's';
var participants = [];
var selP = null;
var analysis = null;
var recog = null;
var isRec = false;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('sdate').value = new Date().toISOString().split('T')[0];
  loadP();
  checkRec();
});

// ── PARTICIPANTS ──────────────────────────────────────────────────────────────
async function loadP() {
  try {
    var r = await fetch('/api/participants');
    participants = await r.json();
    var sel = document.getElementById('psel');
    sel.innerHTML = '<option value="">- Select participant -</option>';
    participants.forEach(function(p) {
      var o = document.createElement('option');
      o.value = p.code; o.textContent = p.displayName;
      o.dataset.fn = p.firstName; o.dataset.ln = p.lastName;
      sel.appendChild(o);
    });
    buildAdminTable();
  } catch(e) { console.error('Load participants failed', e); }
}

function onPC() {
  var sel = document.getElementById('psel');
  var o = sel.options[sel.selectedIndex];
  selP = o && o.value ? {code:o.value, firstName:o.dataset.fn, lastName:o.dataset.ln, displayName:o.textContent} : null;
  updateSI();
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function goTo(n) {
  [1,2,3,4].forEach(function(i) {
    document.getElementById('s'+i).classList.toggle('on', i===n);
    var s = document.getElementById('st'+i);
    s.classList.remove('active','done');
    if (i<n) s.classList.add('done');
    else if (i===n) s.classList.add('active');
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

// ── HELPERS ───────────────────────────────────────────────────────────────────
function tm(t){var p=t.split(':').map(Number);return p[0]*60+p[1];}
function calcDur(){
  var s=document.getElementById('stime').value,e=document.getElementById('etime').value,el=document.getElementById('dur');
  if(!s||!e){el.textContent='';return;}
  var d=tm(e)-tm(s);if(d<0)d+=1440;
  el.textContent='Duration: '+(Math.floor(d/60)>0?Math.floor(d/60)+'h ':'')+( d%60?d%60+'min':'');
}
function calcW2(){
  var s=document.getElementById('w2s').value,e=document.getElementById('w2e').value,el=document.getElementById('w2d');
  if(!s||!e){el.textContent='';return;}
  var d=tm(e)-tm(s);if(d<0)d+=1440;
  el.textContent=(Math.floor(d/60)>0?Math.floor(d/60)+'h ':'')+( d%60?d%60+'min':'');
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

// ── PII SCRUBBING ─────────────────────────────────────────────────────────────
// escRx uses a loop to avoid any regex special character issues
function escRx(s) {
  var specials = '.^$*+?()[]{}|\\\\';
  var out = '';
  for (var i = 0; i < s.length; i++) {
    out += specials.indexOf(s[i]) >= 0 ? '\\\\' + s[i] : s[i];
  }
  return out;
}

function scrub(text) {
  if (!text || !selP) return text;
  var out = text;
  var fn = selP.firstName || '', ln = selP.lastName || '', dn = selP.displayName || '';
  if (dn.length > 2) out = out.replace(new RegExp('\\\\b' + escRx(dn) + '\\\\b','gi'),'the participant');
  if (fn && ln && ln.length > 1) out = out.replace(new RegExp('\\\\b' + escRx(fn) + '\\\\s+' + escRx(ln) + '\\\\b','gi'),'the participant');
  if (ln && ln.length > 2) out = out.replace(new RegExp('\\\\b' + escRx(ln) + '\\\\b','gi'),'the participant');
  if (fn && fn.length > 1) out = out.replace(new RegExp('\\\\b' + escRx(fn) + '\\\\b','gi'),'the participant');
  participants.forEach(function(p) {
    if (p.code === selP.code) return;
    if (p.firstName && p.firstName.length > 1) out = out.replace(new RegExp('\\\\b' + escRx(p.firstName) + '\\\\b','gi'),'another participant');
  });
  var wn = document.getElementById('w1').value.trim().split(/\\s+/);
  if (wn.length > 1 && wn[wn.length-1].length > 2) out = out.replace(new RegExp('\\\\b' + escRx(wn[wn.length-1]) + '\\\\b','gi'),'the worker');
  out = out.replace(/\\b\\d+[A-Za-z]?\\s+[A-Za-z][A-Za-z\\s]{1,20}(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Crescent|Cres|Court|Ct|Place|Pl|Way|Lane|Ln|Boulevard|Blvd|Highway|Hwy|Close|Cl|Terrace|Tce|Circuit|Cct|Rise|Grove|Gve|Parade|Pde)\\b/gi,'[address]');
  return out;
}

function reinject(text, fn) {
  if (!fn || !text) return text;
  var n = fn.charAt(0).toUpperCase() + fn.slice(1);
  return text.replace(/\\bthe participant\\b/gi, n);
}

// ── HEADERS ───────────────────────────────────────────────────────────────────
function buildHdr() {
  var p = selP || {displayName:'Unknown',code:'??'};
  var d = new Date(document.getElementById('sdate').value + 'T12:00:00');
  var ds = d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var h = 'Participant: ' + p.displayName + ' (' + p.code + ') | Date: ' + ds +
    ' | Shift: ' + document.getElementById('stime').value + '-' + document.getElementById('etime').value +
    ' | Ratio: ' + document.getElementById('ratio').value +
    ' | Worker: ' + document.getElementById('w1').value.trim() +
    (document.getElementById('w1r').value.trim() ? ' (' + document.getElementById('w1r').value.trim() + ')' : '');
  if (document.getElementById('cb-sw').checked) {
    var w2 = document.getElementById('w2').value.trim();
    if (w2) h += ' | 2nd Worker: ' + w2 + (document.getElementById('w2s').value&&document.getElementById('w2e').value?' ('+document.getElementById('w2s').value+'-'+document.getElementById('w2e').value+')':'');
  }
  if (document.getElementById('cb-tr').checked) {
    var o1=parseFloat(document.getElementById('odo1').value),o2=parseFloat(document.getElementById('odo2').value);
    var km=(!isNaN(o1)&&!isNaN(o2)&&o2>o1)?(o2-o1).toFixed(1)+' km':'';
    h += ' | Transport: '+(document.getElementById('trd').value.trim()||'provided')+(km?' - '+km:'');
  }
  return h;
}

function buildScrubbedHdr() {
  var code = selP ? selP.code : '??';
  var d = new Date(document.getElementById('sdate').value + 'T12:00:00');
  var ds = d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var h = 'Participant: ' + code + ' | Date: ' + ds +
    ' | Shift: ' + document.getElementById('stime').value + '-' + document.getElementById('etime').value +
    ' | Ratio: ' + document.getElementById('ratio').value + ' | Worker: [Worker]';
  if (document.getElementById('cb-tr').checked) {
    var o1=parseFloat(document.getElementById('odo1').value),o2=parseFloat(document.getElementById('odo2').value);
    var km=(!isNaN(o1)&&!isNaN(o2)&&o2>o1)?(o2-o1).toFixed(1)+' km':'';
    h += ' | Transport: '+(document.getElementById('trd').value.trim()||'provided')+(km?' - '+km:'');
  }
  return h;
}

// ── CHUNKING ──────────────────────────────────────────────────────────────────
function chunk(txt, max) {
  max = max || 6000;
  if (txt.length <= max) return [txt];
  var chunks = [], rem = txt;
  while (rem.length > 0) {
    if (rem.length <= max) {chunks.push(rem);break;}
    var sp = rem.lastIndexOf('. ', max);
    if (sp < max*0.5) sp = rem.lastIndexOf(' ', max);
    if (sp < 0) sp = max;
    chunks.push(rem.slice(0,sp+1).trim());
    rem = rem.slice(sp+1).trim();
  }
  return chunks;
}

// ── ANALYSIS ──────────────────────────────────────────────────────────────────
async function doAnalysis() {
  goTo(3);
  document.getElementById('l3').classList.remove('hidden');
  document.getElementById('gap-s').classList.add('hidden');
  document.getElementById('ok-s').classList.add('hidden');

  var raw = document.getElementById('narr').value.trim();
  var scrubbed = scrub(raw);
  var sHdr = buildScrubbedHdr();
  var chunks = chunk(scrubbed, 6000);
  var fullNarr = scrubbed;

  if (chunks.length > 1) {
    try {
      var sums = [];
      for (var i = 0; i < chunks.length; i++) {
        var r = await callClaude([{role:'user',content:'Summarise part '+(i+1)+' of '+chunks.length+' of a support worker shift note. Extract ALL key facts including every timestamp, activity, behaviour, incident, and appointment. Preserve all timestamps exactly.\n\nPart '+(i+1)+':\n'+chunks[i]}], 1500);
        sums.push(r);
      }
      fullNarr = sums.join('\n\n');
    } catch(e) {console.error('Chunk error',e);}
  }

  var prompt = 'Analyse this NDIS support worker shift note. Identify what happened and what gaps exist.\n\nSHIFT HEADER (already captured):\n' + sHdr + '\n\nSHIFT NOTES:\n' + fullNarr + '\n\nReturn ONLY valid JSON:\n{\n  "found_incidents": ["list of detected incidents from: Escalation/Agitation, Behaviour of Concern, Disclosure, Safety Concern, Near Miss, Hospital Avoidance, Injury, Medication Incident, RP Used - Chemical Restraint, RP Used - Environmental Restraint, RP Used - Mechanical Restraint, RP Used - Physical Restraint, RP Used - Seclusion, Assault/Aggression Toward Others"],\n  "found_appointments": ["appointments or future events mentioned"],\n  "gap_questions": [{"id":"q1","question":"specific missing info question"}]\n}\n\nGap rules: max 4 questions. Never ask about supervisor notification, shift header details, or management contact. Return empty gap_questions if notes are sufficient.';

  try {
    var res = await callClaude([{role:'user',content:prompt}], 800);
    analysis = safeParse(res);
    analysis.fullNarr = fullNarr;
  } catch(e) {
    analysis = {found_incidents:[],found_appointments:[],gap_questions:[],fullNarr:fullNarr};
  }

  document.getElementById('l3').classList.add('hidden');
  showAnalysis();
}

function showAnalysis() {
  if (analysis.gap_questions && analysis.gap_questions.length > 0) {
    var list = document.getElementById('gap-list');
    list.innerHTML = '';
    analysis.gap_questions.forEach(function(q) {
      var d = document.createElement('div');
      d.className = 'gapq';
      d.innerHTML = '<label>' + esc(q.question) + '</label><textarea id="ans-' + q.id + '" rows="2" placeholder="Your answer..."></textarea>';
      list.appendChild(d);
    });
    document.getElementById('gap-s').classList.remove('hidden');
  } else {
    var tags = document.getElementById('ftags');
    tags.innerHTML = '';
    if (!analysis.found_incidents.length && !analysis.found_appointments.length)
      tags.innerHTML = '<span class="tag nt">No incidents or appointments detected</span>';
    analysis.found_incidents.forEach(function(i){tags.innerHTML+='<span class="tag it">&#9888; '+esc(i)+'</span>';});
    analysis.found_appointments.forEach(function(a){tags.innerHTML+='<span class="tag at">&#128197; '+esc(a)+'</span>';});
    document.getElementById('ok-s').classList.remove('hidden');
  }
}

// ── GENERATE ──────────────────────────────────────────────────────────────────
async function genDocs() {
  goTo(4);
  document.getElementById('l4').classList.remove('hidden');
  document.getElementById('dout').classList.add('hidden');
  document.getElementById('ddone').classList.add('hidden');

  var sHdr = buildScrubbedHdr();
  var narr = analysis.fullNarr || scrub(document.getElementById('narr').value.trim());
  var gaps = '';
  if (analysis.gap_questions) analysis.gap_questions.forEach(function(q) {
    var el = document.getElementById('ans-'+q.id);
    if (el && el.value.trim()) gaps += 'Q: ' + q.question + '\nA: ' + el.value.trim() + '\n';
  });

  var noteInst = nStyle === 's'
    ? 'SIMPLE NOTE: Concise prose. 150-200 words maximum. No bullet points. Cover: arrival presentation, main support provided, any notable moments, departure state.'
    : 'EXTENSIVE NOTE - MANDATORY REQUIREMENTS:\n(1) PRESERVE ALL TIMESTAMPS: Every timestamp the worker wrote MUST appear as its own separate dot point. If the worker gave 10 timestamps, produce at minimum 10 separate timestamped entries. NEVER combine or bundle timestamps together.\n(2) FORMAT: Each entry begins with the exact time (e.g. 09:00 or 09:00-09:30) followed by a colon, then the clinical detail.\n(3) LENGTH: Minimum 1800 words. Do not truncate or abbreviate. This is a clinical document for a complex psychosocial participant.\n(4) CONTENT PER ENTRY: For each timestamped entry include: the participant polyvagal/regulatory state with specific observed behaviours, the support worker intervention technique named explicitly, the participant response to that intervention, and any clinically relevant observations.\n(5) Include alter presentations by name if applicable, functional capacity changes, de-escalation sequences step by step, and handover notes at the end.';

  var rpGuidance = 'REGULATED RESTRICTIVE PRACTICES: If a restrictive practice is detected, classify it as: Chemical Restraint (medication for behaviour), Environmental Restraint (restricting access to environment/items/areas), Mechanical Restraint (device to restrict movement for behaviour), Physical Restraint (physical force to restrict movement for behaviour), or Seclusion (sole confinement preventing voluntary exit). An RP is a reportable incident ONLY if it was UNAUTHORISED (not in accordance with an authorised BSP or state/territory authorisation). Authorised RP used in accordance with the BSP is NOT a reportable incident but must be documented.';

  var incFmt = '"incidents": [\n  {\n    "type": "descriptive incident title",\n    "reportable": true or false (true ONLY for: death, serious injury, abuse/neglect, unlawful physical contact, unlawful sexual contact/misconduct, UNAUTHORISED restrictive practice),\n    "ndis_category": "which NDIS reportable category or N/A",\n    "notification_timeline": "24 hours (death/serious injury/abuse/sexual) or 5 business days (unauthorised RP unless harm then 24hr) or N/A",\n    "before": "Context before the incident: environment, participant state, activities, build-up, potential triggers identified",\n    "during": "What happened: exact behaviours, disclosures, events, worker actions in the moment, any RP used and how",\n    "after": "Resolution: participant state after, stabilisation strategies, environment at end, ongoing concerns",\n    "actions_taken": "Actions taken and follow-up required. Do NOT include any instruction to call management - provider receives real-time Shiftcare notifications. For reportable incidents only: note NDIS Commission notification requirement."\n  }\n]';

  var prompt = 'You are an NDIS psychosocial disability support documentation specialist.\n\n' + rpGuidance + '\n\nSHIFT HEADER (use participant CODE only - real name added after):\n' + sHdr + '\n\nWORKER ACCOUNT:\n' + narr + (gaps ? '\nADDITIONAL INFO:\n' + gaps : '') + '\n\nDETECTED INCIDENTS: ' + (analysis.found_incidents.join(', ')||'None') + '\nDETECTED APPOINTMENTS: ' + (analysis.found_appointments.join(', ')||'None') + '\n\nGenerate as one JSON object:\n{\n  "shift_note": {\n    "header": "Participant [code] | [Date] | [Time range] | [Duration] | Ratio [ratio] | [transport if applicable]",\n    "body": "' + noteInst + ' CRITICAL: Do not repeat header info in body. Refer to participant as the participant throughout (name added after). Use person-centred strengths-based NDIS language."\n  },\n  ' + incFmt + ',\n  "appointments": [{"type":"","date_time":"","details":""}]\n}\n\nReturn ONLY valid JSON. No other text.';

  try {
    var res = await callClaude([{role:'user',content:prompt}], 6000);
    var docs = safeParse(res);
    var fn = selP ? selP.firstName : '';
    docs.shift_note.header = buildHdr();
    if (fn) docs.shift_note.body = reinject(docs.shift_note.body, fn);
    if (docs.incidents) docs.incidents = docs.incidents.map(function(inc) {
      if (fn) {
        inc.before = reinject(inc.before||'', fn);
        inc.during = reinject(inc.during||'', fn);
        inc.after = reinject(inc.after||'', fn);
        inc.actions_taken = reinject(inc.actions_taken||'', fn);
      }
      return inc;
    });
    saveBackup(docs.shift_note.header + '\n\n' + docs.shift_note.body);
    renderDocs(docs);
  } catch(e) {
    document.getElementById('l4').classList.add('hidden');
    document.getElementById('dout').innerHTML = '<div class="card"><div class="cb"><p style="color:var(--r)">Error generating documents: ' + esc(e.message) + '. Please go back and try again.</p></div></div>';
    document.getElementById('dout').classList.remove('hidden');
    document.getElementById('ddone').classList.remove('hidden');
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderDocs(docs) {
  document.getElementById('l4').classList.add('hidden');
  var out = document.getElementById('dout');
  out.innerHTML = '';

  // Shift note
  var nt = docs.shift_note.header + '\n\n' + docs.shift_note.body;
  var nc = document.createElement('div');
  nc.className = 'oc note';
  nc.innerHTML = '<div class="och"><div class="oct">Shift Note - ready to copy into Shiftcare</div>' + cbtn('nt') + '</div><div class="ocb"><div class="otxt" id="nt">' + esc(nt) + '</div></div>';
  out.appendChild(nc);

  // Incidents
  (docs.incidents||[]).forEach(function(inc, i) {
    if (!inc.type || inc.type === '') return;
    var isR = inc.reportable === true;
    var c = document.createElement('div');
    c.className = 'oc ' + (isR ? 'rep' : 'inc');

    var copyText = 'INCIDENT REPORT - ' + inc.type;
    if (isR) copyText += '\n\nREPORTABLE INCIDENT\nNDIS Category: ' + (inc.ndis_category||'See NDIS Commission') + '\nNotification required: ' + (inc.notification_timeline||'Within 24 hours');
    copyText += '\n\nBEFORE\n' + (inc.before||'Not documented');
    copyText += '\n\nDURING\n' + (inc.during||'Not documented');
    copyText += '\n\nAFTER\n' + (inc.after||'Not documented');
    copyText += '\n\nACTIONS TAKEN\n' + (inc.actions_taken||'Not documented');

    var body = '<div class="ocb">';
    if (isR) {
      body += '<div class="nbox" style="margin-bottom:12px"><h4>NDIS Commission Notification Required</h4>';
      body += '<p><strong>Category:</strong> ' + esc(inc.ndis_category||'See Commission guidelines') + '</p>';
      body += '<p style="margin-top:4px"><strong>Timeline:</strong> ' + esc(inc.notification_timeline||'Within 24 hours') + '</p>';
      body += '<p style="margin-top:6px;font-size:12px;color:var(--gr)">Submit via NDIS Commission Portal. Clock starts when key personnel become aware, not when the worker first knew.</p></div>';
    }
    body += '<div class="sec-lbl">Before</div><div class="sec-txt">' + esc(inc.before||'Not documented') + '</div>';
    body += '<div class="sec-lbl">During</div><div class="sec-txt">' + esc(inc.during||'Not documented') + '</div>';
    body += '<div class="sec-lbl">After</div><div class="sec-txt">' + esc(inc.after||'Not documented') + '</div>';
    body += '<div class="sec-lbl">Actions Taken</div><div class="sec-txt">' + esc(inc.actions_taken||'Not documented') + '</div>';
    body += '<div id="inc' + i + '" style="display:none">' + esc(copyText) + '</div></div>';

    c.innerHTML = (isR ? '<div class="repalert">REPORTABLE INCIDENT - CALL MANAGEMENT NOW</div>' : '') +
      '<div class="och"><div class="oct">' + (isR ? 'Reportable: ' : 'Incident: ') + esc(inc.type) + '</div>' + cbtn('inc'+i) + '</div>' + body;
    out.appendChild(c);
  });

  // Appointments
  (docs.appointments||[]).forEach(function(apt, i) {
    if (!apt.type || apt.type === '') return;
    var c = document.createElement('div');
    c.className = 'oc apt';
    var t = 'APPOINTMENT - ' + apt.type + (apt.date_time ? '\nDate/Time: ' + apt.date_time : '') + '\nDetails: ' + (apt.details||'');
    c.innerHTML = '<div class="och"><div class="oct">Appointment: ' + esc(apt.type) + ' - For Tiarne to Roster</div>' + cbtn('apt'+i) + '</div><div class="ocb"><div class="otxt" id="apt' + i + '">' + esc(t) + '</div></div>';
    out.appendChild(c);
  });

  out.classList.remove('hidden');
  document.getElementById('ddone').classList.remove('hidden');
  window.scrollTo(0,0);
}

function cbtn(id) { return '<button class="bcopy" onclick="doCopy(\'' + id + '\',this)">Copy for Shiftcare</button>'; }

function doCopy(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(function() {
    var orig = btn.innerHTML;
    btn.innerHTML = 'Copied!';
    btn.classList.add('ok');
    setTimeout(function(){btn.innerHTML=orig;btn.classList.remove('ok');},2500);
  });
}

function esc(t) { return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── BACKUP ────────────────────────────────────────────────────────────────────
function saveBackup(txt) {
  try {localStorage.setItem('cr_bk',JSON.stringify({text:txt,ts:Date.now(),p:selP?selP.displayName:''}));} catch(e){}
}
function checkRec() {
  try {
    var raw = localStorage.getItem('cr_bk');
    if (!raw) return;
    var d = JSON.parse(raw);
    if (Date.now()-d.ts > 86400000){localStorage.removeItem('cr_bk');return;}
    var mins = Math.round((Date.now()-d.ts)/60000);
    document.getElementById('rtime').textContent='Saved '+(mins<60?mins+' mins ago':Math.round(mins/60)+'h ago')+(d.p?' - '+d.p:'');
    document.getElementById('rban').classList.remove('hidden');
  } catch(e){}
}
function doRecover() {
  try {
    var d = JSON.parse(localStorage.getItem('cr_bk'));
    if (!d) return;
    goTo(4);
    var out = document.getElementById('dout');
    out.innerHTML = '<div class="oc note"><div class="och"><div class="oct">Recovered Note</div>' + cbtn('rn') + '</div><div class="ocb"><div class="otxt" id="rn">' + esc(d.text) + '</div></div></div>';
    out.classList.remove('hidden');
    document.getElementById('ddone').classList.remove('hidden');
    document.getElementById('l4').classList.add('hidden');
  } catch(e){}
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function buildAdminTable() {
  var c = document.getElementById('atbl');
  var cnt = document.getElementById('pcnt');
  if (cnt) cnt.textContent = '(' + participants.length + ' loaded)';
  if (!participants.length) {
    c.innerHTML = '<div class="err"><strong>No participants loaded.</strong> Check that the PARTICIPANTS environment variable is set correctly in Render and you have redeployed after saving it.<br><br>Correct format example:<br><code>[{"code":"P01","firstName":"Belinda","lastName":"Hemmens"}]</code><br><br>Common errors: using single quotes instead of double quotes, missing commas between entries, or not redeploying after saving.</div>';
  } else {
    var h = '<table class="admt"><thead><tr><th>Code</th><th>First Name</th><th>Last Name</th><th>Dropdown Shows As</th></tr></thead><tbody>';
    participants.forEach(function(p){h+='<tr><td>'+esc(p.code)+'</td><td>'+esc(p.firstName)+'</td><td>'+esc(p.lastName||'')+'</td><td>'+esc(p.displayName)+'</td></tr>';});
    c.innerHTML = h+'</tbody></table>';
  }
  var ev = document.getElementById('ejson');
  if (ev) {
    var src = participants.length ? participants : [{code:'P01',firstName:'Belinda',lastName:'Hemmens'},{code:'P02',firstName:'CF',lastName:''}];
    ev.textContent = JSON.stringify(src.map(function(p){return{code:p.code,firstName:p.firstName,lastName:p.lastName||''};}), null, 2);
  }
}

// ── VOICE ─────────────────────────────────────────────────────────────────────
function doVoice() {
  if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){alert('Voice input requires Chrome browser.');return;}
  if (isRec){recog&&recog.stop();return;}
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

// ── SAFE JSON PARSE ───────────────────────────────────────────────────────────
// Handles cases where AI generates literal newlines inside JSON string values
function safeParse(str) {
  str = str.replace(/\`\`\`json|\`\`\`/g,'').trim();
  // Direct parse first
  try { return JSON.parse(str); } catch(e1) {}
  // Fix 1: replace unescaped newlines and tabs inside the JSON
  try {
    var f = '';
    var inStr = false;
    var prev = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === '"' && prev !== '\\\\') inStr = !inStr;
      if (inStr && ch === '\n') { f += '\\n'; prev = 'n'; continue; }
      if (inStr && ch === '\r') { f += '\\r'; prev = 'r'; continue; }
      if (inStr && ch === '\t') { f += '\\t'; prev = 't'; continue; }
      f += ch; prev = ch;
    }
    return JSON.parse(f);
  } catch(e2) {}
  // Fix 2: more aggressive - strip all control chars in string values
  try {
    var cleaned = str.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]/g,'');
    return JSON.parse(cleaned);
  } catch(e3) {
    throw new Error('Could not parse AI response. The AI may have returned an unusually long note. Please go back and try generating again.');
  }
}

// ── API ───────────────────────────────────────────────────────────────────────
async function callClaude(messages, maxT) {
  var r = await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:maxT||1500,messages:messages})});
  var d = await r.json();
  if (!r.ok||d.error) throw new Error(d.error?d.error.message:'API error');
  return d.content[0].text;
}

// ── RESET ─────────────────────────────────────────────────────────────────────
function newShift(){
  ['psel','ratio','stime','etime','w1','w1r','w2','narr'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('dur').textContent='';
  document.getElementById('cc').textContent='0 characters';
  document.getElementById('si').textContent='';
  document.getElementById('sdate').value=new Date().toISOString().split('T')[0];
  ['sw','tr'].forEach(function(id){document.getElementById(id).classList.remove('open');document.getElementById('cb-'+id).checked=false;});
  selP=null;analysis=null;
  goTo(1);
}
</script>
</body>
</html>`;

app.get('/', (req, res) => { res.setHeader('Content-Type','text/html'); res.send(HTML); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('CareRender running on port ' + PORT));
