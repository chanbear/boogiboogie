const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' })); // 프로필 사진 data URL 저장을 위해 기본 100kb보다 넉넉하게
app.use((req, res, next) => {
  // 모바일 앱(Capacitor WebView)·PWA는 이 서버와 다른 origin에서 fetch하므로 CORS 허용 필요
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// 해커톤 발표에서 여러 참가자가 동시에 접속할 예정이라, 프로필/설정/신청이력을
// 기기별로 분리함(2026.7.25). 기기 식별자는 클라이언트가 localStorage에 저장해 매 요청마다
// X-Device-Id 헤더로 보냄 — 로그인 없이 기기 단위로만 구분(계정 시스템 아님).
app.use('/api', (req, res, next) => {
  const deviceId = req.header('X-Device-Id');
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 100) {
    return res.status(400).json({ error: 'X-Device-Id header is required' });
  }
  req.deviceId = deviceId;
  next();
});

// full app state in one call — mirrors the old localStorage STATE shape
app.get('/api/state', (req, res) => {
  res.json({
    profile: db.getProfile(req.deviceId),
    settings: db.getSettings(req.deviceId),
    applications: db.getApplications(req.deviceId),
  });
});

app.post('/api/onboard', (req, res) => {
  const { name, gender, age } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const profile = db.saveOnboard(req.deviceId, {
    name: String(name).trim(),
    gender: gender === '남성' ? '남성' : '여성',
    age: Number.isFinite(Number(age)) ? Number(age) : 70,
  });
  res.json({ profile });
});

app.put('/api/avatar', (req, res) => {
  const { photo } = req.body || {};
  if (photo !== null && typeof photo !== 'string') {
    return res.status(400).json({ error: 'photo must be a data URL string or null' });
  }
  res.json({ profile: db.setAvatarPhoto(req.deviceId, photo) });
});

app.get('/api/settings', (req, res) => {
  res.json(db.getSettings(req.deviceId));
});

app.put('/api/settings', (req, res) => {
  const { fontScale, voice, alerts, langIdx } = req.body || {};
  const partial = {};
  if (fontScale !== undefined) partial.fontScale = String(fontScale);
  if (voice !== undefined) partial.voice = !!voice;
  if (alerts !== undefined) partial.alerts = !!alerts;
  if (langIdx !== undefined) partial.langIdx = Number(langIdx) || 0;
  res.json(db.updateSettings(req.deviceId, partial));
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
  res.json(db.getApplications(req.deviceId));
});

app.post('/api/applications', (req, res) => {
  const { jobId } = req.body || {};
  if (!jobId) return res.status(400).json({ error: 'jobId is required' });
  const result = db.createApplication(req.deviceId, jobId);
  res.status(result.created ? 201 : 200).json(result);
});

app.get('/api/data-meta', (req, res) => {
  res.json(db.getDataMeta());
});

app.post('/api/logout', (req, res) => {
  res.json(db.resetAll(req.deviceId));
});

// 팀이 실제 배포 DB에 뭐가 쌓이는지 확인할 용도의 임시 조회 화면.
// 무료 Render 플랜은 셸 접속이 안 돼서 이 방법으로 대체함(2026.7.25) — 발표 끝나면 지울 것.
const ADMIN_KEY = process.env.ADMIN_KEY || '292cbe32089444dfee704988';
app.get('/admin/profiles', (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).send('forbidden');
  const rows = db.getAllProfiles();
  const rowsHtml = rows.map(r => `
    <tr>
      <td>${r.name || '<i>(빈 값)</i>'}</td>
      <td>${r.gender}</td>
      <td>${r.age}</td>
      <td>${r.onboarded ? '✅' : '—'}</td>
      <td style="color:#888; font-size:12px;">${r.device_id}</td>
    </tr>`).join('');
  res.send(`
    <!doctype html><html><head><meta charset="utf-8">
    <title>노인 일자리 알리미 — 실제 접속자 데이터</title>
    <style>
      body { font-family: -apple-system, sans-serif; padding: 24px; background: #F5F5F7; }
      h1 { font-size: 18px; }
      table { border-collapse: collapse; width: 100%; background: #fff; border-radius: 12px; overflow: hidden; }
      th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px; }
      th { background: #F2F2F7; }
    </style></head><body>
    <h1>실제 배포 DB — 프로필 (${rows.length}건)</h1>
    <table><thead><tr><th>이름</th><th>성별</th><th>나이</th><th>온보딩 완료</th><th>기기 ID</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table>
    </body></html>
  `);
});

app.listen(PORT, () => {
  console.log(`노인 일자리 알리미 서버 실행 중: http://localhost:${PORT}`);
});
