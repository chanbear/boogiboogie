const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  // 모바일 앱(Capacitor WebView)·PWA는 이 서버와 다른 origin에서 fetch하므로 CORS 허용 필요
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// full app state in one call — mirrors the old localStorage STATE shape
app.get('/api/state', (req, res) => {
  res.json({
    profile: db.getProfile(),
    settings: db.getSettings(),
    applications: db.getApplications(),
  });
});

app.post('/api/onboard', (req, res) => {
  const { name, gender, age } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const profile = db.saveOnboard({
    name: String(name).trim(),
    gender: gender === '남성' ? '남성' : '여성',
    age: Number.isFinite(Number(age)) ? Number(age) : 70,
  });
  res.json({ profile });
});

app.post('/api/avatar/toggle', (req, res) => {
  res.json({ profile: db.toggleAvatar() });
});

app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req, res) => {
  const { fontScale, voice, alerts, langIdx } = req.body || {};
  const partial = {};
  if (fontScale !== undefined) partial.fontScale = String(fontScale);
  if (voice !== undefined) partial.voice = !!voice;
  if (alerts !== undefined) partial.alerts = !!alerts;
  if (langIdx !== undefined) partial.langIdx = Number(langIdx) || 0;
  res.json(db.updateSettings(partial));
});

app.get('/api/categories', (req, res) => {
  res.json(db.getCategories());
});

app.get('/api/jobs', (req, res) => {
  const cat = req.query.category;
  if (!cat) return res.status(400).json({ error: 'category query param is required' });
  res.json(db.getJobsByCategory(cat));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json(job);
});

app.get('/api/applications', (req, res) => {
  res.json(db.getApplications());
});

app.post('/api/applications', (req, res) => {
  const { jobId } = req.body || {};
  if (!jobId) return res.status(400).json({ error: 'jobId is required' });
  const result = db.createApplication(jobId);
  res.status(result.created ? 201 : 200).json(result);
});

app.post('/api/logout', (req, res) => {
  res.json(db.resetAll());
});

app.listen(PORT, () => {
  console.log(`부기부기 서버 실행 중: http://localhost:${PORT}`);
});
