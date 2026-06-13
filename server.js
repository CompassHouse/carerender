{
  "name": "carerender",
  "version": "3.0.0",
  "description": "CareRender v3 — Compass House. Real names with PII scrubbing.",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "engines": { "node": ">=18.0.0" }
}

const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));

// ── PARTICIPANT LIST ─────────────────────────────────────────────────────────
// Set the PARTICIPANTS environment variable in Render dashboard as a JSON array.
// Format: [{"code":"P01","firstName":"Belinda","lastName":"Hemmens"},...]
// Workers see full names. The AI only ever sees "the participant" — names are
// scrubbed in the browser before the API call and re-injected after.

const DEFAULT_PARTICIPANTS = [
  { code: 'P01', firstName: 'Participant', lastName: 'One' },
  { code: 'P02', firstName: 'Participant', lastName: 'Two' },
  { code: 'P03', firstName: 'Participant', lastName: 'Three' }
];

function getParticipants() {
  try {
    if (process.env.PARTICIPANTS) {
      return JSON.parse(process.env.PARTICIPANTS);
    }
  } catch (e) {
    console.error('PARTICIPANTS env var is not valid JSON:', e.message);
  }
  return DEFAULT_PARTICIPANTS;
}

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.get('/api/participants', (req, res) => {
  const participants = getParticipants().map(p => ({
    code: p.code,
    firstName: p.firstName,
    lastName: p.lastName,
    displayName: p.firstName + (p.lastName ? ' ' + p.lastName : '')
  }));
  res.json(participants);
});

app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: { message: 'ANTHROPIC_API_KEY not configured in Render environment.' } });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── HTML ─────────────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CareRender — Compass House</title>
<style>
  :root {
    --teal:#1A6B72; --teal-light:#E8F4F5; --teal-mid:#C2E0E3; --teal-dark:#124E54;
    --amber:#D97706; --amber-light:#FEF3C7;
    --red:#DC2626; --red-light:#FEE2E2;
    --green:#059669; --green-light:#D1FAE5;
    --grey:#6B7280; --grey-light:#F3F4F6; --border:#E5E7EB; --text:#111827;
    --purple:#7C3AED; --purple-light:#EDE9FE;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0F4F5;color:var(--text);min-height:100vh}
  .header{background:var(--teal-dark);color:white;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}
  .header-logo{font-size:22px;font-weight:700;letter-spacing:-.5px}
  .header-logo span{color:var(--teal-mid)}
  .header-sub{font-size:12px;color:var(--teal-mid);margin-top:2px}
  .header-right{display:flex;gap:8px;align-items:center}
  .btn-icon{background:rgba(255,255,255,.15);border:none;color:white;padding:7px 12px;border-radius:7px;font-size:12px;cursor:pointer;font-weight:600}
  .btn-icon:hover{background:rgba(255,255,255,.25)}
  .steps{background:white;border-bottom:1px solid var(--border);padding:12px 20px;display:flex;gap:8px;overflow-x:auto}
  .step{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--grey);white-space:nowrap}
  .step.active{color:var(--teal);font-weight:600}
  .step.done{color:var(--green)}
  .step-num{width:22px;height:22px;border-radius:50%;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
  .step.done .step-num{background:var(--green);border-color:var(--green);color:white}
  .step.active .step-num{background:var(--teal);border-color:var(--teal);color:white}
  .step-divider{color:var(--border);font-size:18px}
  .main{max-width:720px;margin:0 auto;padding:20px 16px 80px}
  .card{background:white;border-radius:12px;border:1px solid var(--border);margin-bottom:16px;overflow:hidden}
  .card-header{padding:14px 18px;background:var(--teal-light);border-bottom:1px solid var(--teal-mid);display:flex;align-items:center;gap:10px}
  .card-header h2{font-size:16px;font-weight:700;color:var(--teal-dark)}
  .step-badge{background:var(--teal);color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}
  .card-body{padding:18px}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
  .form-row.three{grid-template-columns:1fr 1fr 1fr}
  .form-row.single{grid-template-columns:1fr}
  @media(max-width:480px){.form-row,.form-row.three{grid-template-columns:1fr}}
  .field{display:flex;flex-direction:column;gap:4px}
  .field label{font-size:12px;font-weight:600;color:var(--grey);text-transform:uppercase;letter-spacing:.5px}
  .field input,.field select,.field textarea{border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:15px;color:var(--text);background:white;transition:border-color .15s;font-family:inherit}
  .field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--teal)}
  .field .auto-calc{font-size:12px;color:var(--teal);font-weight:600;margin-top:4px;min-height:18px}
  .toggle-section{border:1.5px solid var(--border);border-radius:8px;margin-bottom:10px;overflow:hidden}
  .toggle-header{padding:11px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;background:var(--grey-light)}
  .toggle-header:hover{background:var(--teal-light)}
  .toggle-header input[type=checkbox]{width:16px;height:16px;accent-color:var(--teal);cursor:pointer;flex-shrink:0}
  .toggle-header label{font-size:14px;font-weight:600;color:var(--text);cursor:pointer;flex:1}
  .toggle-header .toggle-hint{font-size:11px;color:var(--grey)}
  .toggle-body{padding:14px;border-top:1px solid var(--border);display:none}
  .toggle-body.open{display:block}
  .style-toggle{display:flex;gap:8px;margin-bottom:14px}
  .style-btn{flex:1;padding:9px;border:2px solid var(--border);border-radius:8px;background:white;cursor:pointer;text-align:center;font-size:13px;font-weight:600;color:var(--grey);transition:all .15s}
  .style-btn.active{border-color:var(--teal);background:var(--teal-light);color:var(--teal-dark)}
  .style-btn small{display:block;font-size:11px;font-weight:400;color:var(--grey);margin-top:2px}
  .narr-wrap{position:relative}
  .narr-wrap textarea{width:100%;min-height:160px;resize:vertical;line-height:1.5}
  .voice-btn{position:absolute;bottom:10px;right:10px;background:var(--teal);color:white;border:none;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px}
  .voice-btn.recording{background:var(--red);animation:pulse 1.2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
  .char-count{font-size:11px;color:var(--grey);text-align:right;margin-top:4px}
  .btn{padding:11px 24px;border-radius:9px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all .15s;display:inline-flex;align-items:center;gap:8px}
  .btn-primary{background:var(--teal);color:white}
  .btn-primary:hover{background:var(--teal-dark)}
  .btn-primary:disabled{background:#9CA3AF;cursor:not-allowed}
  .btn-secondary{background:white;color:var(--teal);border:2px solid var(--teal)}
  .btn-secondary:hover{background:var(--teal-light)}
  .btn-copy{background:var(--grey-light);color:var(--text);border:1px solid var(--border);padding:7px 14px;font-size:13px;border-radius:7px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
  .btn-copy:hover{background:var(--teal-light);border-color:var(--teal)}
  .btn-copy.copied{background:var(--green-light);border-color:var(--green);color:var(--green)}
  .btn-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px}
  .loading{text-align:center;padding:40px 20px}
  .spinner{width:40px;height:40px;border:3px solid var(--teal-mid);border-top-color:var(--teal);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading p{color:var(--grey);font-size:14px}
  .gap-questions{background:var(--amber-light);border:1.5px solid #FCD34D;border-radius:10px;padding:16px;margin-bottom:16px}
  .gap-questions h3{font-size:14px;font-weight:700;color:#92400E;margin-bottom:12px}
  .gap-q{margin-bottom:12px}
  .gap-q label{font-size:13px;font-weight:600;color:#78350F;display:block;margin-bottom:5px}
  .gap-q textarea{width:100%;border:1.5px solid #FCD34D;border-radius:7px;padding:8px 10px;font-size:14px;font-family:inherit;min-height:60px;resize:vertical;background:white}
  .output-card{border-radius:10px;border:1.5px solid var(--border);margin-bottom:14px;overflow:hidden}
  .output-card.shift-note{border-color:var(--teal)}
  .output-card.incident{border-color:var(--amber)}
  .output-card.reportable{border-color:var(--red)}
  .output-card.appointment{border-color:var(--teal)}
  .output-card-header{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .output-card.shift-note .output-card-header{background:var(--teal-light)}
  .output-card.incident .output-card-header{background:var(--amber-light)}
  .output-card.reportable .output-card-header{background:var(--red-light)}
  .output-card.appointment .output-card-header{background:var(--teal-light)}
  .output-card-title{font-size:15px;font-weight:700}
  .output-card.shift-note .output-card-title{color:var(--teal-dark)}
  .output-card.incident .output-card-title{color:#92400E}
  .output-card.reportable .output-card-title{color:var(--red)}
  .output-card.appointment .output-card-title{color:var(--teal-dark)}
  .output-card-body{padding:16px}
  .output-text{font-size:14px;line-height:1.7;white-space:pre-wrap;color:var(--text)}
  .reportable-alert{background:var(--red);color:white;padding:10px 16px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px}
  .notification-box{background:var(--red-light);border:1px solid #FCA5A5;border-radius:8px;padding:12px;margin-top:12px;font-size:13px}
  .notification-box h4{font-weight:700;color:var(--red);margin-bottom:6px}
  .found-items{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
  .found-tag{font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px}
  .found-tag.incident-tag{background:var(--amber-light);color:#92400E;border:1px solid #FCD34D}
  .found-tag.appointment-tag{background:var(--teal-light);color:var(--teal-dark);border:1px solid var(--teal-mid)}
  .found-tag.none-tag{background:var(--green-light);color:#065F46;border:1px solid #6EE7B7}
  .success-banner{background:var(--green-light);border:1.5px solid #6EE7B7;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:10px;margin-bottom:16px;font-size:14px;color:#065F46;font-weight:600}
  .divider{border:none;border-top:1px solid var(--border);margin:16px 0}
  .info-box{background:var(--purple-light);border:1.5px solid #C4B5FD;border-radius:10px;padding:12px 16px;font-size:13px;color:#4C1D95;margin-bottom:14px;display:flex;align-items:flex-start;gap:10px}
  .recovery-banner{background:#FFF8E6;border:1.5px solid #FCD34D;border-radius:10px;padding:12px 16px;font-size:13px;color:#78350F;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .privacy-strip{background:var(--teal-light);border:1px solid var(--teal-mid);border-radius:8px;padding:9px 14px;font-size:12px;color:var(--teal-dark);margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .scrub-indicator{font-size:11px;color:var(--grey);margin-top:4px;min-height:16px}
  .hidden{display:none!important}
  #screen-1,#screen-2,#screen-3,#screen-4,#screen-admin{display:none}
  #screen-1.active,#screen-2.active,#screen-3.active,#screen-4.active,#screen-admin.active{display:block}
  .admin-table{width:100%;border-collapse:collapse;font-size:14px}
  .admin-table th{background:var(--teal-light);padding:10px 14px;text-align:left;font-size:12px;font-weight:700;color:var(--teal-dark);text-transform:uppercase;letter-spacing:.5px}
  .admin-table td{padding:10px 14px;border-bottom:1px solid var(--border)}
  .admin-table tr:last-child td{border-bottom:none}
  .env-box{background:#1e1e2e;color:#cdd6f4;border-radius:10px;padding:16px;font-family:monospace;font-size:12px;overflow-x:auto;margin-top:12px;line-height:1.6}
  .env-label{font-size:12px;font-weight:700;color:var(--grey);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="header-logo">Care<span>Render</span></div>
    <div class="header-sub">Compass House · Capture Accurately, Record Everything</div>
  </div>
  <div class="header-right">
    <button class="btn-icon" onclick="showAdmin()">⚙ Manage Participants</button>
  </div>
</div>

<div class="steps" id="step-bar">
  <div class="step active" id="step-1"><div class="step-num">1</div> Shift Details</div>
  <div class="step-divider">›</div>
  <div class="step" id="step-2"><div class="step-num">2</div> What Happened</div>
  <div class="step-divider">›</div>
  <div class="step" id="step-3"><div class="step-num">3</div> Review & Confirm</div>
  <div class="step-divider">›</div>
  <div class="step" id="step-4"><div class="step-num">4</div> Documents</div>
</div>

<div class="main">

<!-- ═══════════════════════ SCREEN 1 ══ -->
<div id="screen-1" class="active">

  <div id="recovery-notice" class="recovery-banner hidden">
    <span>💾 A note from a previous session was saved. <strong id="recovery-time"></strong></span>
    <button class="btn-copy" onclick="recoverNote()">Recover note</button>
  </div>

  <div class="card">
    <div class="card-header"><span class="step-badge">STEP 1</span><h2>Shift Details</h2></div>
    <div class="card-body">

      <div class="field" style="margin-bottom:16px">
        <label>Note Type</label>
        <div class="style-toggle">
          <button class="style-btn active" id="style-standard" onclick="setStyle('standard')">
            Simple <small>Short shifts · concise prose · 150–200 words</small>
          </button>
          <button class="style-btn" id="style-detailed" onclick="setStyle('detailed')">
            Extensive <small>Complex participants · full clinical detail · timestamped</small>
          </button>
        </div>
      </div>

      <div class="privacy-strip">
        🔒 <span>Names are automatically removed before being sent to the AI — your worker can write naturally. Only codes are sent externally.</span>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Participant</label>
          <select id="participant-select" onchange="onParticipantChange()">
            <option value="">— Loading… —</option>
          </select>
        </div>
        <div class="field">
          <label>Support Ratio</label>
          <select id="ratio">
            <option value="">— Select —</option>
            <option>1:1</option><option>1:2</option><option>1:3</option>
          </select>
        </div>
      </div>

      <div class="form-row three">
        <div class="field">
          <label>Shift Date</label>
          <input type="date" id="shift-date">
        </div>
        <div class="field">
          <label>Start Time</label>
          <input type="time" id="start-time" oninput="calcDuration()">
        </div>
        <div class="field">
          <label>End Time</label>
          <input type="time" id="end-time" oninput="calcDuration()">
        </div>
      </div>
      <div class="auto-calc" id="duration-display"></div>

      <hr class="divider">

      <div class="form-row">
        <div class="field">
          <label>Your Name</label>
          <input type="text" id="worker1" placeholder="Support worker name">
        </div>
        <div class="field">
          <label>Your Role</label>
          <input type="text" id="worker1-role" placeholder="e.g. Support Worker">
        </div>
      </div>

      <div class="toggle-section">
        <div class="toggle-header" onclick="toggleSection('second-worker')">
          <input type="checkbox" id="cb-second-worker" onclick="event.stopPropagation();toggleSection('second-worker',this.checked)">
          <label for="cb-second-worker">Second worker on this shift</label>
          <span class="toggle-hint">Optional</span>
        </div>
        <div class="toggle-body" id="second-worker">
          <div class="form-row">
            <div class="field"><label>Second Worker Name</label><input type="text" id="worker2" placeholder="Name"></div>
            <div class="field"><label>Their Start Time</label><input type="time" id="worker2-start" oninput="calcWorker2()"></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Their End Time</label><input type="time" id="worker2-end" oninput="calcWorker2()"></div>
            <div class="field"><div class="auto-calc" id="worker2-duration" style="padding-top:20px"></div></div>
          </div>
        </div>
      </div>

      <div class="toggle-section">
        <div class="toggle-header" onclick="toggleSection('transport')">
          <input type="checkbox" id="cb-transport" onclick="event.stopPropagation();toggleSection('transport',this.checked)">
          <label for="cb-transport">Transport provided this shift</label>
          <span class="toggle-hint">Optional</span>
        </div>
        <div class="toggle-body" id="transport">
          <div class="form-row">
            <div class="field"><label>Odometer Start (km)</label><input type="number" id="odo-start" oninput="calcKm()"></div>
            <div class="field"><label>Odometer End (km)</label><input type="number" id="odo-end" oninput="calcKm()"></div>
          </div>
          <div class="auto-calc" id="km-display"></div>
          <div class="form-row single" style="margin-top:10px">
            <div class="field"><label>Destination(s)</label><input type="text" id="transport-dest" placeholder="e.g. Rockhampton Base Hospital, Stockland"></div>
          </div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" onclick="goTo2()">Next: What Happened →</button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ SCREEN 2 ══ -->
<div id="screen-2">
  <div class="card">
    <div class="card-header"><span class="step-badge">STEP 2</span><h2>What Happened This Shift</h2></div>
    <div class="card-body">
      <div class="info-box">
        🔒 <span>Write naturally using the participant's real name. CareRender will automatically remove names and addresses before sending to the AI.</span>
      </div>
      <div class="field">
        <label>Describe what happened — in your own words</label>
        <div class="narr-wrap">
          <textarea id="narrative" rows="8" oninput="updateCharCount()" placeholder="Write naturally. You can use the participant's name — CareRender handles the rest.

Include: what they were like when you arrived, what you did together, any incidents or concerns, how they were when you left. The more detail you give, the better the note."></textarea>
          <button class="voice-btn" id="voice-btn" onclick="toggleVoice()">🎤 Speak</button>
        </div>
        <div class="char-count" id="char-count">0 characters</div>
        <div class="scrub-indicator" id="scrub-indicator"></div>
      </div>
      <div class="btn-row">
        <button class="btn btn-secondary" onclick="goTo(1)">← Back</button>
        <button class="btn btn-primary" onclick="goTo3()">Analyse →</button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ SCREEN 3 ══ -->
<div id="screen-3">
  <div id="loading-analysis" class="card loading hidden">
    <div class="card-body"><div class="spinner"></div><p>Analysing your shift notes…</p></div>
  </div>
  <div id="gap-section" class="hidden">
    <div class="card">
      <div class="card-header"><span class="step-badge">STEP 3</span><h2>A Few Quick Questions</h2></div>
      <div class="card-body">
        <div class="gap-questions">
          <h3>⚠️ A bit more information will improve the note</h3>
          <div id="gap-questions-list"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary" onclick="goTo(2)">← Edit Notes</button>
          <button class="btn btn-primary" onclick="generateDocuments()">Generate Documents →</button>
        </div>
      </div>
    </div>
  </div>
  <div id="no-gap-section" class="hidden">
    <div class="card">
      <div class="card-header"><span class="step-badge">STEP 3</span><h2>Ready to Generate</h2></div>
      <div class="card-body">
        <div class="success-banner">✅ All information captured. Ready to generate your shift note.</div>
        <div class="found-items" id="found-tags"></div>
        <div class="btn-row">
          <button class="btn btn-secondary" onclick="goTo(2)">← Edit Notes</button>
          <button class="btn btn-primary" onclick="generateDocuments()">Generate Documents →</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ SCREEN 4 ══ -->
<div id="screen-4">
  <div id="loading-docs" class="card loading hidden">
    <div class="card-body"><div class="spinner"></div><p id="loading-msg">Generating your documents…</p></div>
  </div>
  <div id="docs-output" class="hidden"></div>
  <div id="docs-done" class="hidden">
    <div class="btn-row" style="margin-top:8px">
      <button class="btn btn-secondary" onclick="startNew()">↩ New Shift</button>
      <button class="btn btn-secondary" onclick="goTo(2)">← Edit Notes</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════ ADMIN SCREEN ══ -->
<div id="screen-admin">
  <div class="card">
    <div class="card-header">
      <h2>⚙ Participant Management</h2>
      <button class="btn btn-secondary" style="margin-left:auto;padding:6px 14px;font-size:13px" onclick="goTo(1)">← Back to CareRender</button>
    </div>
    <div class="card-body">
      <p style="font-size:14px;color:var(--grey);margin-bottom:16px">
        Workers select participants by name from the dropdown. Names are automatically stripped before reaching the AI — only codes are sent externally.
      </p>

      <h3 style="font-size:15px;font-weight:700;margin-bottom:12px">Current Participants</h3>
      <div id="admin-participant-table"></div>

      <hr class="divider">

      <h3 style="font-size:15px;font-weight:700;margin-bottom:8px">How to Add or Edit Participants</h3>
      <p style="font-size:13px;color:var(--grey);margin-bottom:12px">
        Participant names are managed through the Render.com dashboard. Ask Tiarne to update the <strong>PARTICIPANTS</strong> environment variable with the JSON below, then click <strong>Manual Deploy</strong>.
      </p>

      <div class="env-label">PARTICIPANTS environment variable — copy and edit in Render dashboard</div>
      <div class="env-box" id="env-json-display"></div>

      <div style="margin-top:16px;padding:14px;background:var(--teal-light);border-radius:8px;font-size:13px;color:var(--teal-dark)">
        <strong>Steps:</strong> Render dashboard → Your CareRender service → Environment → Edit PARTICIPANTS value → paste updated JSON → Save → Manual Deploy
      </div>
    </div>
  </div>
</div>

</div>

<script>
// ── STATE ────────────────────────────────────────────────────────────────────
let noteStyle = 'standard';
let analysisResult = null;
let recognition = null;
let isRecording = false;
let participants = [];
let selectedParticipant = null;

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('shift-date').value = new Date().toISOString().split('T')[0];
  await loadParticipants();
  checkRecovery();
  goTo(1);
});

async function loadParticipants() {
  try {
    const res = await fetch('/api/participants');
    participants = await res.json();
    const sel = document.getElementById('participant-select');
    sel.innerHTML = '<option value="">— Select participant —</option>';
    participants.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.code;
      opt.textContent = p.displayName;
      opt.dataset.firstName = p.firstName;
      opt.dataset.lastName = p.lastName || '';
      sel.appendChild(opt);
    });
    renderAdminTable();
  } catch (e) {
    console.error('Could not load participants', e);
  }
}

function onParticipantChange() {
  const sel = document.getElementById('participant-select');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.value) {
    selectedParticipant = {
      code: opt.value,
      firstName: opt.dataset.firstName,
      lastName: opt.dataset.lastName,
      displayName: opt.textContent
    };
  } else {
    selectedParticipant = null;
  }
  updateScrubIndicator();
}

// ── PII SCRUBBING ─────────────────────────────────────────────────────────────
// Names and addresses are replaced BEFORE the API call. The AI never sees them.
// The first name is re-injected into the output after generation.

function scrubPII(text) {
  if (!text) return text;
  let scrubbed = text;

  // Scrub participant names (full name, first name, last name)
  if (selectedParticipant) {
    const { firstName, lastName, displayName } = selectedParticipant;
    const escape = s => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    if (displayName) scrubbed = scrubbed.replace(new RegExp(escape(displayName), 'gi'), 'the participant');
    if (firstName && lastName) {
      scrubbed = scrubbed.replace(new RegExp('\\\\b' + escape(firstName) + '\\\\s+' + escape(lastName) + '\\\\b', 'gi'), 'the participant');
    }
    if (lastName && lastName.length > 2) {
      scrubbed = scrubbed.replace(new RegExp('\\\\b' + escape(lastName) + '\\\\b', 'gi'), 'the participant');
    }
    if (firstName && firstName.length > 1) {
      scrubbed = scrubbed.replace(new RegExp('\\\\b' + escape(firstName) + '\\\\b', 'gi'), 'the participant');
    }
  }

  // Scrub worker last name
  const workerName = document.getElementById('worker1').value.trim();
  if (workerName) {
    const parts = workerName.trim().split(/\\s+/);
    if (parts.length > 1) {
      const lastName = parts[parts.length - 1];
      if (lastName.length > 2) {
        scrubbed = scrubbed.replace(new RegExp('\\\\b' + lastName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '\\\\b', 'gi'), 'the worker');
      }
    }
  }

  // Scrub all other participant names from the list
  participants.forEach(p => {
    if (selectedParticipant && p.code === selectedParticipant.code) return;
    if (p.firstName && p.firstName.length > 1) {
      scrubbed = scrubbed.replace(new RegExp('\\\\b' + p.firstName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '\\\\b', 'gi'), 'another participant');
    }
  });

  // Scrub Australian address patterns
  scrubbed = scrubbed.replace(
    /\\b\\d+[A-Za-z]?\\s+[A-Za-z][A-Za-z\\s]{2,25}(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Crescent|Cres|Court|Ct|Place|Pl|Way|Lane|Ln|Boulevard|Blvd|Highway|Hwy|Close|Cl|Terrace|Tce|Circuit|Cct|Rise|Grove|Gve|Parade|Pde)\\b/gi,
    '[address]'
  );

  return scrubbed;
}

function reinjectName(text, firstName) {
  if (!firstName) return text;
  // Replace "the participant" with first name (capitalised)
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  return text.replace(/\bthe participant\b/gi, name)
             .replace(/\bThe participant\b/g, name);
}

function updateScrubIndicator() {
  const narr = document.getElementById('narrative').value;
  const indicator = document.getElementById('scrub-indicator');
  if (!narr || !selectedParticipant) { indicator.textContent = ''; return; }
  const scrubbed = scrubPII(narr);
  const diff = narr.length - scrubbed.length;
  if (diff > 0 || narr !== scrubbed) {
    indicator.textContent = '🔒 Names/addresses detected and will be removed before sending to AI';
    indicator.style.color = 'var(--teal)';
  } else {
    indicator.textContent = '';
  }
}

// ── NAVIGATION ───────────────────────────────────────────────────────────────
function goTo(n) {
  [1,2,3,4].forEach(i => {
    document.getElementById('screen-'+i).classList.toggle('active', i===n);
    const s = document.getElementById('step-'+i);
    s.classList.remove('active','done');
    if (i < n) s.classList.add('done');
    else if (i === n) s.classList.add('active');
  });
  document.getElementById('screen-admin').classList.remove('active');
  window.scrollTo(0,0);
}

function showAdmin() {
  [1,2,3,4].forEach(i => document.getElementById('screen-'+i).classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
  window.scrollTo(0,0);
}

function goTo2() {
  if (!validate1()) return;
  goTo(2);
}

function goTo3() {
  const narr = document.getElementById('narrative').value.trim();
  if (!narr) { alert('Please describe what happened during the shift.'); return; }
  runAnalysis();
}

function validate1() {
  if (!document.getElementById('participant-select').value) { alert('Please select a participant.'); return false; }
  if (!document.getElementById('ratio').value) { alert('Please select a support ratio.'); return false; }
  if (!document.getElementById('shift-date').value) { alert('Please enter the shift date.'); return false; }
  if (!document.getElementById('start-time').value || !document.getElementById('end-time').value) { alert('Please enter start and end times.'); return false; }
  if (!document.getElementById('worker1').value.trim()) { alert('Please enter your name.'); return false; }
  return true;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function calcDuration() {
  const s = document.getElementById('start-time').value;
  const e = document.getElementById('end-time').value;
  const el = document.getElementById('duration-display');
  if (!s || !e) { el.textContent = ''; return; }
  const [sh,sm] = s.split(':').map(Number);
  const [eh,em] = e.split(':').map(Number);
  let mins = (eh*60+em)-(sh*60+sm);
  if (mins < 0) mins += 1440;
  el.textContent = '⏱ Duration: ' + (Math.floor(mins/60)>0?Math.floor(mins/60)+'h ':'') + (mins%60>0?mins%60+'min':'');
}

function calcWorker2() {
  const s = document.getElementById('worker2-start').value;
  const e = document.getElementById('worker2-end').value;
  const el = document.getElementById('worker2-duration');
  if (!s || !e) { el.textContent = ''; return; }
  const [sh,sm] = s.split(':').map(Number);
  const [eh,em] = e.split(':').map(Number);
  let mins = (eh*60+em)-(sh*60+sm);
  if (mins < 0) mins += 1440;
  el.textContent = '⏱ ' + (Math.floor(mins/60)>0?Math.floor(mins/60)+'h ':'') + (mins%60>0?mins%60+'min':'');
}

function calcKm() {
  const s = parseFloat(document.getElementById('odo-start').value);
  const e = parseFloat(document.getElementById('odo-end').value);
  const el = document.getElementById('km-display');
  if (!isNaN(s) && !isNaN(e) && e > s) el.textContent = '🚗 Distance: '+(e-s).toFixed(1)+' km';
  else el.textContent = '';
}

function toggleSection(id, force) {
  const body = document.getElementById(id);
  const cb = document.getElementById('cb-'+id);
  const open = force !== undefined ? force : !body.classList.contains('open');
  body.classList.toggle('open', open);
  if (cb) cb.checked = open;
}

function setStyle(s) {
  noteStyle = s;
  document.getElementById('style-standard').classList.toggle('active', s==='standard');
  document.getElementById('style-detailed').classList.toggle('active', s==='detailed');
}

function updateCharCount() {
  const len = document.getElementById('narrative').value.length;
  document.getElementById('char-count').textContent = len.toLocaleString()+' characters';
  updateScrubIndicator();
}

function buildShiftHeader() {
  const p = selectedParticipant || { displayName: document.getElementById('participant-select').value, code: 'Unknown' };
  const ratio = document.getElementById('ratio').value;
  const date = document.getElementById('shift-date').value;
  const start = document.getElementById('start-time').value;
  const end = document.getElementById('end-time').value;
  const worker1 = document.getElementById('worker1').value.trim();
  const worker1role = document.getElementById('worker1-role').value.trim();
  const d = new Date(date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('en-AU', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
  let header = \`Participant: \${p.displayName} (\${p.code}) | Date: \${dateStr} | Shift: \${start}–\${end} | Ratio: \${ratio} | Worker: \${worker1}\${worker1role ? ' ('+worker1role+')' : ''}\`;
  const cb2 = document.getElementById('cb-second-worker');
  if (cb2 && cb2.checked) {
    const w2 = document.getElementById('worker2').value.trim();
    const w2s = document.getElementById('worker2-start').value;
    const w2e = document.getElementById('worker2-end').value;
    if (w2) header += \` | 2nd Worker: \${w2}\${w2s&&w2e?' ('+w2s+'–'+w2e+')':''}\`;
  }
  const cbt = document.getElementById('cb-transport');
  if (cbt && cbt.checked) {
    const odos = document.getElementById('odo-start').value;
    const odoe = document.getElementById('odo-end').value;
    const dest = document.getElementById('transport-dest').value.trim();
    const km = (!isNaN(parseFloat(odos))&&!isNaN(parseFloat(odoe))) ? (parseFloat(odoe)-parseFloat(odos)).toFixed(1)+' km' : '';
    header += \` | Transport: \${dest||'provided'}\${km?' · '+km:''}\`;
  }
  return header;
}

// Build a scrubbed header (codes only) for the AI prompt
function buildScrubbedHeader() {
  const p = selectedParticipant || { code: 'P??' };
  const ratio = document.getElementById('ratio').value;
  const date = document.getElementById('shift-date').value;
  const start = document.getElementById('start-time').value;
  const end = document.getElementById('end-time').value;
  const d = new Date(date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('en-AU', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
  let header = \`Participant: \${p.code} | Date: \${dateStr} | Shift: \${start}–\${end} | Ratio: \${ratio} | Worker: [Worker]\`;
  const cbt = document.getElementById('cb-transport');
  if (cbt && cbt.checked) {
    const odos = document.getElementById('odo-start').value;
    const odoe = document.getElementById('odo-end').value;
    const km = (!isNaN(parseFloat(odos))&&!isNaN(parseFloat(odoe))) ? (parseFloat(odoe)-parseFloat(odos)).toFixed(1)+' km' : '';
    const dest = document.getElementById('transport-dest').value.trim();
    header += \` | Transport: \${dest||'provided'}\${km?' · '+km:''}\`;
  }
  return header;
}

function chunkText(text, max = 6000) {
  if (text.length <= max) return [text];
  const chunks = [];
  let rem = text;
  while (rem.length > 0) {
    if (rem.length <= max) { chunks.push(rem); break; }
    let split = rem.lastIndexOf('. ', max);
    if (split < max * 0.5) split = rem.lastIndexOf(' ', max);
    if (split < 0) split = max;
    chunks.push(rem.slice(0, split+1).trim());
    rem = rem.slice(split+1).trim();
  }
  return chunks;
}

// ── ANALYSIS ──────────────────────────────────────────────────────────────────
async function runAnalysis() {
  goTo(3);
  document.getElementById('loading-analysis').classList.remove('hidden');
  document.getElementById('gap-section').classList.add('hidden');
  document.getElementById('no-gap-section').classList.add('hidden');

  const rawNarrative = document.getElementById('narrative').value.trim();
  const scrubbedNarrative = scrubPII(rawNarrative);
  const scrubbedHeader = buildScrubbedHeader();
  const chunks = chunkText(scrubbedNarrative, 6000);
  let fullNarrative = scrubbedNarrative;

  if (chunks.length > 1) {
    try {
      const summaries = [];
      for (let i = 0; i < chunks.length; i++) {
        const r = await callClaude([{role:'user',content:\`Summarise part \${i+1} of \${chunks.length} of a support worker's shift notes. Extract ALL key facts: activities, participant behaviour/state, incidents, appointments, concerns. Be thorough.\n\nPart \${i+1}:\n\${chunks[i]}\`}], 1200);
        summaries.push(r);
      }
      fullNarrative = summaries.join('\n\n');
    } catch(e) { console.error('Chunking error', e); }
  }

  const prompt = \`Analyse this support worker's shift notes for an NDIS psychosocial disability provider.

SHIFT HEADER (already captured):
\${scrubbedHeader}

SHIFT NOTES:
\${fullNarrative}

Return ONLY valid JSON:
{
  "found_incidents": ["incident types detected from: RP Used, New Alter, Near Miss, Escalation, Hospital Avoidance, Behaviour, Safety Concern, Disclosure, Medication Incident"],
  "found_appointments": ["appointments or future events mentioned"],
  "gap_questions": [{"id":"q1","question":"specific question about missing info"}]
}

Gap question rules: max 4 questions. Only ask about things genuinely missing that affect clinical quality. NEVER ask about supervisor notification or shift header details. Return empty array if sufficient.\`;

  try {
    const raw = await callClaude([{role:'user',content:prompt}], 800);
    const clean = raw.replace(/\`\`\`json|\`\`\`/g,'').trim();
    analysisResult = JSON.parse(clean);
    analysisResult.scrubbedNarrative = fullNarrative;
  } catch(e) {
    analysisResult = {found_incidents:[],found_appointments:[],gap_questions:[],scrubbedNarrative:fullNarrative};
  }

  document.getElementById('loading-analysis').classList.add('hidden');
  showAnalysisResult();
}

function showAnalysisResult() {
  const hasGaps = analysisResult.gap_questions && analysisResult.gap_questions.length > 0;
  if (hasGaps) {
    const list = document.getElementById('gap-questions-list');
    list.innerHTML = '';
    analysisResult.gap_questions.forEach(q => {
      const div = document.createElement('div');
      div.className = 'gap-q';
      div.innerHTML = \`<label>\${q.question}</label><textarea id="ans-\${q.id}" rows="2" placeholder="Your answer…"></textarea>\`;
      list.appendChild(div);
    });
    document.getElementById('gap-section').classList.remove('hidden');
  } else {
    const tags = document.getElementById('found-tags');
    tags.innerHTML = '';
    if (!analysisResult.found_incidents.length && !analysisResult.found_appointments.length) {
      tags.innerHTML = '<span class="found-tag none-tag">✓ No incidents or appointments detected</span>';
    }
    analysisResult.found_incidents.forEach(i => tags.innerHTML += \`<span class="found-tag incident-tag">⚠ \${i}</span>\`);
    analysisResult.found_appointments.forEach(a => tags.innerHTML += \`<span class="found-tag appointment-tag">📅 \${a}</span>\`);
    document.getElementById('no-gap-section').classList.remove('hidden');
  }
}

// ── GENERATE ──────────────────────────────────────────────────────────────────
async function generateDocuments() {
  goTo(4);
  document.getElementById('loading-docs').classList.remove('hidden');
  document.getElementById('docs-output').classList.add('hidden');
  document.getElementById('docs-done').classList.add('hidden');

  const scrubbedHeader = buildScrubbedHeader();
  const narrative = analysisResult.scrubbedNarrative || scrubPII(document.getElementById('narrative').value.trim());

  let gapAnswers = '';
  if (analysisResult.gap_questions) {
    analysisResult.gap_questions.forEach(q => {
      const ans = document.getElementById('ans-'+q.id);
      if (ans && ans.value.trim()) gapAnswers += \`\nQ: \${q.question}\nA: \${ans.value.trim()}\n\`;
    });
  }

  const styleInstructions = noteStyle === 'standard'
    ? 'SIMPLE NOTE: Concise professional prose. 150–200 words maximum. No bullet points. Single flowing narrative. Cover: arrival presentation, main support provided, any notable moments, departure state.'
    : 'EXTENSIVE NOTE: Timestamped dot points. 250–350 words. Each dot point starts with a time/time range. Include: arrival presentation with polyvagal/regulatory state and specific observed behaviours, each support intervention with technique named, escalation and de-escalation strategies used, functional capacity observations, departure state.';

  const prompt = \`You are an NDIS psychosocial disability support documentation specialist.

SHIFT HEADER (use participant CODE in the output header — names will be added separately):
\${scrubbedHeader}

WORKER'S ACCOUNT:
\${narrative}
\${gapAnswers?'ADDITIONAL INFO:\n'+gapAnswers:''}

DETECTED INCIDENTS: \${analysisResult.found_incidents.join(', ')||'None'}
DETECTED APPOINTMENTS: \${analysisResult.found_appointments.join(', ')||'None'}

Generate as a single JSON object:
{
  "shift_note": {
    "header": "Header line using the participant CODE not a name: Participant [code] | [Date] | [Start]–[End] | [Duration] | Ratio [ratio] | [transport if applicable]",
    "body": "The note body. \${styleInstructions} CRITICAL: Do NOT repeat header information in the body. Do NOT mention participant code, date, or worker name in the body — those are in the header. Refer to the participant as 'the participant' throughout (name will be added after). Use person-centred, strengths-based NDIS language. Reference polyvagal states and functional capacity where relevant. No repetition of any kind."
  },
  "incidents": [{"type":"","reportable":false,"ndis_category":"","notification_timeline":"","summary":"","actions_taken":""}],
  "appointments": [{"type":"","date_time":"","details":""}]
}

Return ONLY the JSON. No other text.\`;

  try {
    const raw = await callClaude([{role:'user',content:prompt}], 2500);
    const clean = raw.replace(/\`\`\`json|\`\`\`/g,'').trim();
    const docs = JSON.parse(clean);
    // Re-inject real name and worker name
    const firstName = selectedParticipant ? selectedParticipant.firstName : '';
    const workerName = document.getElementById('worker1').value.trim();
    const header = buildShiftHeader(); // Real name header for Shiftcare
    docs.shift_note.header = header;
    if (firstName) docs.shift_note.body = reinjectName(docs.shift_note.body, firstName);
    docs.incidents = (docs.incidents||[]).map(inc => ({
      ...inc,
      summary: firstName ? reinjectName(inc.summary||'', firstName) : inc.summary,
      actions_taken: firstName ? reinjectName(inc.actions_taken||'', firstName) : inc.actions_taken
    }));
    saveBackup(docs.shift_note.header + '\n\n' + docs.shift_note.body);
    renderDocuments(docs);
  } catch(e) {
    document.getElementById('loading-docs').classList.add('hidden');
    document.getElementById('docs-output').innerHTML = \`<div class="card"><div class="card-body"><p style="color:var(--red)">Error: \${e.message}. Please go back and try again.</p></div></div>\`;
    document.getElementById('docs-output').classList.remove('hidden');
    document.getElementById('docs-done').classList.remove('hidden');
  }
}

function renderDocuments(docs) {
  document.getElementById('loading-docs').classList.add('hidden');
  const out = document.getElementById('docs-output');
  out.innerHTML = '';

  const noteText = docs.shift_note.header + '\n\n' + docs.shift_note.body;
  const noteCard = document.createElement('div');
  noteCard.className = 'output-card shift-note';
  noteCard.innerHTML = \`
    <div class="output-card-header">
      <div class="output-card-title">📋 Shift Note — ready to copy into Shiftcare</div>
      \${copyBtn('note-text')}
    </div>
    <div class="output-card-body">
      <div class="output-text" id="note-text">\${escHtml(noteText)}</div>
    </div>\`;
  out.appendChild(noteCard);

  (docs.incidents||[]).forEach((inc, idx) => {
    const isRep = inc.reportable === true;
    const card = document.createElement('div');
    card.className = 'output-card ' + (isRep ? 'reportable' : 'incident');
    let t = \`INCIDENT REPORT — \${inc.type}\n\nSummary: \${inc.summary}\n\nActions taken: \${inc.actions_taken}\`;
    if (isRep) t += \`\n\nNDIS Category: \${inc.ndis_category||'See NDIS Commission'}\nNotification required: \${inc.notification_timeline||'Within 24 hours'}\`;
    card.innerHTML = \`
      \${isRep?'<div class="reportable-alert">🚨 CALL MANAGEMENT NOW — Reportable Incident</div>':''}
      <div class="output-card-header">
        <div class="output-card-title">\${isRep?'🚨':'⚠️'} \${inc.type}</div>
        \${copyBtn('inc-'+idx)}
      </div>
      <div class="output-card-body">
        <div class="output-text" id="inc-\${idx}">\${escHtml(t)}</div>
        \${isRep?'<div class="notification-box"><h4>Notification Timeline</h4><p>'+escHtml(inc.notification_timeline||'24 hours Priority 1')+'</p></div>':''}
      </div>\`;
    out.appendChild(card);
  });

  (docs.appointments||[]).forEach((apt, idx) => {
    const card = document.createElement('div');
    card.className = 'output-card appointment';
    const t = \`APPOINTMENT — \${apt.type}\n\${apt.date_time?'Date/Time: '+apt.date_time+'\n':''}Details: \${apt.details}\`;
    card.innerHTML = \`
      <div class="output-card-header">
        <div class="output-card-title">📅 \${apt.type} — For Tiarne to Roster</div>
        \${copyBtn('apt-'+idx)}
      </div>
      <div class="output-card-body"><div class="output-text" id="apt-\${idx}">\${escHtml(t)}</div></div>\`;
    out.appendChild(card);
  });

  out.classList.remove('hidden');
  document.getElementById('docs-done').classList.remove('hidden');
  window.scrollTo(0,0);
}

function copyBtn(id) {
  return \`<button class="btn-copy" onclick="copyText('\${id}',this)">📋 Copy for Shiftcare</button>\`;
}

function copyText(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2500);
  });
}

function escHtml(t) {
  return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── 24-HOUR BACKUP ────────────────────────────────────────────────────────────
function saveBackup(text) {
  const payload = { text, ts: Date.now(), participant: selectedParticipant?.displayName || '' };
  try { localStorage.setItem('cr_backup', JSON.stringify(payload)); } catch(e) {}
}

function checkRecovery() {
  try {
    const raw = localStorage.getItem('cr_backup');
    if (!raw) return;
    const data = JSON.parse(raw);
    const age = Date.now() - data.ts;
    if (age > 24 * 60 * 60 * 1000) { localStorage.removeItem('cr_backup'); return; }
    const mins = Math.round(age/60000);
    const timeStr = mins < 60 ? mins+' mins ago' : Math.round(mins/60)+'h ago';
    document.getElementById('recovery-time').textContent = 'Saved ' + timeStr + (data.participant ? ' · ' + data.participant : '');
    document.getElementById('recovery-notice').classList.remove('hidden');
  } catch(e) {}
}

function recoverNote() {
  try {
    const raw = localStorage.getItem('cr_backup');
    if (!raw) return;
    const data = JSON.parse(raw);
    goTo(4);
    const out = document.getElementById('docs-output');
    out.innerHTML = \`<div class="output-card shift-note">
      <div class="output-card-header">
        <div class="output-card-title">📋 Recovered Note</div>
        \${copyBtn('recovered-note')}
      </div>
      <div class="output-card-body">
        <div class="output-text" id="recovered-note">\${escHtml(data.text)}</div>
      </div>
    </div>\`;
    out.classList.remove('hidden');
    document.getElementById('docs-done').classList.remove('hidden');
    document.getElementById('loading-docs').classList.add('hidden');
  } catch(e) {}
}

// ── ADMIN TABLE ───────────────────────────────────────────────────────────────
function renderAdminTable() {
  const container = document.getElementById('admin-participant-table');
  if (!container) return;
  if (!participants.length) {
    container.innerHTML = '<p style="color:var(--grey);font-size:13px">No participants configured yet. Add them via the Render environment variable below.</p>';
  } else {
    let html = '<table class="admin-table"><thead><tr><th>Code</th><th>First Name</th><th>Last Name</th><th>Shows in Dropdown As</th></tr></thead><tbody>';
    participants.forEach(p => {
      html += \`<tr><td>\${escHtml(p.code)}</td><td>\${escHtml(p.firstName)}</td><td>\${escHtml(p.lastName||'')}</td><td>\${escHtml(p.displayName)}</td></tr>\`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }
  // Show copy-paste JSON
  const envJson = document.getElementById('env-json-display');
  if (envJson) {
    const sample = participants.length ? participants : [
      {code:'P01',firstName:'Belinda',lastName:'Hemmens'},
      {code:'P02',firstName:'CF',lastName:''},
      {code:'P03',firstName:'Jordan',lastName:'Smith'}
    ];
    envJson.textContent = JSON.stringify(sample.map(p => ({code:p.code,firstName:p.firstName,lastName:p.lastName||''})), null, 2);
  }
}

// ── VOICE INPUT ───────────────────────────────────────────────────────────────
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Voice input is not supported in this browser. Use Chrome on Android or desktop.');
    return;
  }
  if (isRecording) { recognition && recognition.stop(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-AU';
  let final = document.getElementById('narrative').value;
  recognition.onstart = () => {
    isRecording = true;
    const btn = document.getElementById('voice-btn');
    btn.textContent = '⏹ Stop';
    btn.classList.add('recording');
  };
  recognition.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }
    document.getElementById('narrative').value = final + interim;
    updateCharCount();
  };
  recognition.onend = () => {
    isRecording = false;
    document.getElementById('narrative').value = final.trim();
    const btn = document.getElementById('voice-btn');
    btn.textContent = '🎤 Speak';
    btn.classList.remove('recording');
    updateCharCount();
  };
  recognition.start();
}

// ── API ───────────────────────────────────────────────────────────────────────
async function callClaude(messages, maxTokens = 1500) {
  const res = await fetch('/api/claude', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:maxTokens,messages})
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || 'API error');
  return data.content[0].text;
}

// ── RESET ─────────────────────────────────────────────────────────────────────
function startNew() {
  document.getElementById('participant-select').value = '';
  document.getElementById('ratio').value = '';
  document.getElementById('start-time').value = '';
  document.getElementById('end-time').value = '';
  document.getElementById('worker1').value = '';
  document.getElementById('worker1-role').value = '';
  document.getElementById('worker2').value = '';
  document.getElementById('narrative').value = '';
  document.getElementById('duration-display').textContent = '';
  document.getElementById('char-count').textContent = '0 characters';
  document.getElementById('shift-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('second-worker').classList.remove('open');
  document.getElementById('transport').classList.remove('open');
  document.getElementById('cb-second-worker').checked = false;
  document.getElementById('cb-transport').checked = false;
  selectedParticipant = null;
  analysisResult = null;
  goTo(1);
}
</script>
</body>
</html>`;

app.get('/', (req, res) => { res.setHeader('Content-Type','text/html'); res.send(HTML); });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('CareRender v3 on port ' + PORT));
