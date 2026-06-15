const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── PARTICIPANTS ─────────────────────────────────────────────────────────────
// Set PARTICIPANTS in Render environment variables as a JSON array.
// Example: [{"code":"P01","firstName":"Belinda","lastName":"Hemmens"}]

function getParticipants() {
  try {
    if (process.env.PARTICIPANTS) return JSON.parse(process.env.PARTICIPANTS);
  } catch (e) {
    console.error('PARTICIPANTS env var invalid JSON:', e.message);
  }
  return [
    { code: 'P01', firstName: 'Participant', lastName: 'One' },
    { code: 'P02', firstName: 'Participant', lastName: 'Two' },
    { code: 'P03', firstName: 'Participant', lastName: 'Three' }
  ];
}

app.get('/api/participants', (req, res) => {
  const list = getParticipants().map(p => ({
    code: p.code,
    firstName: p.firstName,
    lastName: p.lastName || '',
    displayName: p.firstName + (p.lastName ? ' ' + p.lastName : '')
  }));
  res.json(list);
});

// ── CLAUDE PROXY ─────────────────────────────────────────────────────────────
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('CareRender v4 running on port ' + PORT));
