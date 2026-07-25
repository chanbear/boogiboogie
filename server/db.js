const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.join(__dirname, 'boogiboogie.db'));
db.exec('PRAGMA journal_mode = WAL');

// 기기별(사람별) 데이터 분리 이전 스키마(고정 id=1 단일 행) 마이그레이션.
// 해커톤 발표에서 여러 참가자가 동시에 접속할 예정이라 프로필/설정/신청이력을
// device_id 기준으로 분리함(2026.7.25). 예전 스키마엔 기기 식별자가 없어 데이터를
// 옮겨 담을 방법이 없으므로 이 3개 테이블만 지우고 새로 만듦(categories/jobs는 그대로 유지).
const profileTableExists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='profile'"
).all().length > 0;
if (profileTableExists) {
  const cols = db.prepare("PRAGMA table_info(profile)").all().map(c => c.name);
  if (!cols.includes('device_id')) {
    db.exec('DROP TABLE IF EXISTS profile');
    db.exec('DROP TABLE IF EXISTS settings');
    db.exec('DROP TABLE IF EXISTS applications');
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    device_id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '여성',
    age INTEGER NOT NULL DEFAULT 70,
    avatar_photo TEXT,
    onboarded INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    device_id TEXT PRIMARY KEY,
    font_scale TEXT NOT NULL DEFAULT '1.15',
    voice INTEGER NOT NULL DEFAULT 1,
    alerts INTEGER NOT NULL DEFAULT 1,
    lang_idx INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    title TEXT NOT NULL,
    org TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '대기중',
    applied_date TEXT NOT NULL,
    UNIQUE(device_id, job_id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    tag TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    cat TEXT NOT NULL,
    org TEXT NOT NULL,
    title TEXT NOT NULL,
    schedule TEXT NOT NULL,
    headcount_short TEXT NOT NULL,
    location TEXT NOT NULL,
    time TEXT NOT NULL,
    time_sub TEXT NOT NULL,
    location_full TEXT NOT NULL,
    location_sub TEXT NOT NULL,
    pay TEXT NOT NULL,
    pay_sub TEXT NOT NULL,
    headcount TEXT NOT NULL,
    headcount_sub TEXT NOT NULL,
    period TEXT NOT NULL,
    period_sub TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    lat REAL,
    lng REAL
  );
`);

const CATEGORIES = [
  { id: 'publicgood', label: '공익활동형', tag: '공익활동형' },
  { id: 'social', label: '사회서비스형', tag: '사회서비스형' },
  { id: 'market', label: '시장형사업단', tag: '시장형사업단' },
  { id: 'job', label: '취업알선형', tag: '취업알선형' },
];

const JOBS = [
  { id: 'j1', cat: 'publicgood', org: '안산시니어클럽', title: '스쿨존 안전 지킴이', lat: 37.3304454, lng: 126.7959133,
    schedule: '주 3회 · 오전 9시~11시', headcountShort: '모집 3명', location: '원곡동 일대',
    time: '주 3회 (월, 수, 금)', timeSub: '오전 09:00 ~ 11:00 (일 2시간)',
    locationFull: '상록구 일동 초등학교 인근', locationSub: '거주지 우선 배정 가능',
    pay: '월 290,000원', paySub: '활동비 및 부대경비 포함',
    headcount: '총 15명 모집', headcountSub: '현재 8명 신청 완료',
    period: '2026.08.01 ~ 08.15', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '신체 건강하고 활동적인 분'] },
  { id: 'j2', cat: 'publicgood', org: '동산노인복지관', title: '경로당 행정 도우미', lat: 37.3216873, lng: 126.8495703,
    schedule: '주 5회 · 오전 10시~오후 2시', headcountShort: '모집 2명', location: '성포동 경로당',
    time: '주 5회 (월~금)', timeSub: '오전 10:00 ~ 오후 2:00 (일 4시간)',
    locationFull: '성포동 경로당', locationSub: '대중교통 이용 권장',
    pay: '월 350,000원', paySub: '활동비 및 부대경비 포함',
    headcount: '총 2명 모집', headcountSub: '현재 1명 신청 완료',
    period: '2026.08.01 ~ 08.20', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '기본적인 문서 작성이 가능한 분'] },
  { id: 'j3', cat: 'publicgood', org: '안산의료복지사회적협동조합', title: '공공도서관 봉사', lat: 37.3007000, lng: 126.8465000,
    schedule: '주 2회 · 오후 1시~4시', headcountShort: '모집 4명', location: '상록수도서관',
    time: '주 2회 (화, 목)', timeSub: '오후 01:00 ~ 04:00 (일 3시간)',
    locationFull: '상록수도서관', locationSub: '도서관 내 안내데스크 인근',
    pay: '월 220,000원', paySub: '활동비 포함',
    headcount: '총 4명 모집', headcountSub: '현재 2명 신청 완료',
    period: '2026.08.05 ~ 08.20', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '신체 건강하고 활동적인 분'] },
  { id: 'j4', cat: 'social', org: '안산장애인복지관', title: '장애인 이동 지원 도우미', lat: 37.3190000, lng: 126.8122000,
    schedule: '주 3회 · 오전 9시~12시', headcountShort: '모집 3명', location: '단원구 일대',
    time: '주 3회 (월, 수, 금)', timeSub: '오전 09:00 ~ 12:00 (일 3시간)',
    locationFull: '단원구 일대 자택-복지관 이동 구간', locationSub: '차량 탑승 보조 위주',
    pay: '월 310,000원', paySub: '활동비 및 교통비 포함',
    headcount: '총 3명 모집', headcountSub: '현재 1명 신청 완료',
    period: '2026.08.01 ~ 08.18', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '보행 및 부축 활동이 가능한 분'] },
  { id: 'j5', cat: 'social', org: '상록수노인복지센터', title: '재가 어르신 말벗 도우미', lat: 37.3037000, lng: 126.8495000,
    schedule: '주 2회 · 오후 2시~4시', headcountShort: '모집 5명', location: '상록구 일대',
    time: '주 2회 (화, 금)', timeSub: '오후 02:00 ~ 04:00 (일 2시간)',
    locationFull: '상록구 재가 어르신 가정 방문', locationSub: '2인 1조 방문 활동',
    pay: '월 250,000원', paySub: '활동비 포함',
    headcount: '총 5명 모집', headcountSub: '현재 3명 신청 완료',
    period: '2026.08.01 ~ 08.25', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '원활한 의사소통이 가능한 분'] },
  { id: 'j6', cat: 'market', org: '실버카페 다감', title: '카페 바리스타 보조', lat: 37.3157805, lng: 126.8311620,
    schedule: '주 4회 · 오전 9시~1시', headcountShort: '모집 4명', location: '단원구 고잔동',
    time: '주 4회 (월~목)', timeSub: '오전 09:00 ~ 오후 01:00 (일 4시간)',
    locationFull: '단원구 고잔동 실버카페 다감', locationSub: '매장 내 근무',
    pay: '월 480,000원', paySub: '매출 연동 수당 별도',
    headcount: '총 4명 모집', headcountSub: '현재 2명 신청 완료',
    period: '2026.08.01 ~ 08.15', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '서서 하는 근무가 가능한 분'] },
  { id: 'j7', cat: 'market', org: '손맛 반찬사업단', title: '반찬 제조·포장원', lat: 37.3134845, lng: 126.8115434,
    schedule: '주 5회 · 오전 8시~12시', headcountShort: '모집 6명', location: '초지동 공동작업장',
    time: '주 5회 (월~금)', timeSub: '오전 08:00 ~ 12:00 (일 4시간)',
    locationFull: '초지동 공동작업장', locationSub: '위생복 지급',
    pay: '월 500,000원', paySub: '매출 연동 수당 별도',
    headcount: '총 6명 모집', headcountSub: '현재 4명 신청 완료',
    period: '2026.08.01 ~ 08.10', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '장시간 서서 작업 가능한 분'] },
  { id: 'j8', cat: 'job', org: '안산시니어클럽 취업지원센터', title: '재취업 상담 연계', lat: 37.3037939, lng: 126.8999781,
    schedule: '주 1회 상담 · 개별 일정', headcountShort: '모집 상시', location: '안산시니어클럽 본관',
    time: '주 1회 개별 상담', timeSub: '예약제 (전화 사전 예약 필요)',
    locationFull: '안산시니어클럽 본관 2층', locationSub: '방문 상담 원칙',
    pay: '상담 무료', paySub: '연계 취업처 급여는 개별 협의',
    headcount: '상시 모집', headcountSub: '선착순 상담 예약',
    period: '상시', periodSub: '예약 후 방문',
    eligibility: ['만 60세 이상', '안산시 거주자 (주민등록상)', '재취업 의사가 있는 분'] },
];

const seedCatStmt = db.prepare('INSERT OR IGNORE INTO categories (id, label, tag) VALUES (@id, @label, @tag)');
CATEGORIES.forEach(c => seedCatStmt.run(c));

// lat/lng: OpenStreetMap Nominatim으로 2026.7.25에 조회한 좌표. 정확한 지번 주소가 아니라
// 동(행정동) 단위 근사치인 경우가 많음(예: j3/j5는 "상록구 일대"라 특정 주소가 없어 상록구 중심 근사).
const seedJobStmt = db.prepare(`
  INSERT OR IGNORE INTO jobs
    (id, cat, org, title, schedule, headcount_short, location, time, time_sub, location_full, location_sub, pay, pay_sub, headcount, headcount_sub, period, period_sub, eligibility, lat, lng)
  VALUES
    (@id, @cat, @org, @title, @schedule, @headcountShort, @location, @time, @timeSub, @locationFull, @locationSub, @pay, @paySub, @headcount, @headcountSub, @period, @periodSub, @eligibility, @lat, @lng)
`);
JOBS.forEach(j => seedJobStmt.run({ ...j, eligibility: JSON.stringify(j.eligibility) }));

// 예전 스키마(좌표 없음)로 만들어진 DB 파일 마이그레이션 + 기존 행 좌표 백필
const jobCols = db.prepare("PRAGMA table_info(jobs)").all().map(c => c.name);
if (!jobCols.includes('lat')) db.exec('ALTER TABLE jobs ADD COLUMN lat REAL');
if (!jobCols.includes('lng')) db.exec('ALTER TABLE jobs ADD COLUMN lng REAL');
const backfillCoordStmt = db.prepare('UPDATE jobs SET lat = @lat, lng = @lng WHERE id = @id AND lat IS NULL');
JOBS.forEach(j => backfillCoordStmt.run({ id: j.id, lat: j.lat, lng: j.lng }));

const ANSAN_APPLY_URL = 'https://www.ansan.go.kr/www/common/cntnts/selectContents.do?cntnts_id=C0001530';
// 취업알선형(현장실습훈련지원사업)은 노인일자리여기(seniorro.or.kr)에서 실제 온라인 접수가 가능함을
// 2026.7.25 확인함 — 나머지 3개 유형(공익활동형/사회서비스형/시장형사업단)은 방문접수만 가능해 ansan.go.kr 유지.
const SENIORRO_APPLY_URL = 'https://www.seniorro.or.kr/noin/main.do';

function rowToJob(row) {
  return {
    id: row.id, cat: row.cat, org: row.org, title: row.title,
    schedule: row.schedule, headcountShort: row.headcount_short, location: row.location,
    time: row.time, timeSub: row.time_sub,
    locationFull: row.location_full, locationSub: row.location_sub,
    pay: row.pay, paySub: row.pay_sub,
    headcount: row.headcount, headcountSub: row.headcount_sub,
    period: row.period, periodSub: row.period_sub,
    eligibility: JSON.parse(row.eligibility),
    lat: row.lat, lng: row.lng,
    applyUrl: row.cat === 'job' ? SENIORRO_APPLY_URL : ANSAN_APPLY_URL,
    // 취업알선형(job)만 seniorro.or.kr에서 실제 온라인 접수가 가능함. 나머지 3개 유형은
    // 안산시 안내 페이지로 연결될 뿐 실제 접수는 수행기관 방문으로만 완료됨(2026.7.25 재검증).
    visitRequired: row.cat !== 'job',
  };
}

function ensureDevice(deviceId) {
  db.prepare('INSERT OR IGNORE INTO profile (device_id) VALUES (?)').run(deviceId);
  db.prepare('INSERT OR IGNORE INTO settings (device_id) VALUES (?)').run(deviceId);
}

function getProfile(deviceId) {
  ensureDevice(deviceId);
  const row = db.prepare('SELECT * FROM profile WHERE device_id = ?').get(deviceId);
  return {
    name: row.name,
    gender: row.gender,
    age: row.age,
    avatarPhoto: row.avatar_photo || null,
    avatarSet: !!row.avatar_photo,
    onboarded: !!row.onboarded,
  };
}

function saveOnboard(deviceId, { name, gender, age }) {
  ensureDevice(deviceId);
  db.prepare('UPDATE profile SET name = ?, gender = ?, age = ?, onboarded = 1 WHERE device_id = ?').run(name, gender, age, deviceId);
  return getProfile(deviceId);
}

function setAvatarPhoto(deviceId, dataUrl) {
  ensureDevice(deviceId);
  db.prepare('UPDATE profile SET avatar_photo = ? WHERE device_id = ?').run(dataUrl || null, deviceId);
  return getProfile(deviceId);
}

function getSettings(deviceId) {
  ensureDevice(deviceId);
  const row = db.prepare('SELECT * FROM settings WHERE device_id = ?').get(deviceId);
  return {
    fontScale: row.font_scale,
    voice: !!row.voice,
    alerts: !!row.alerts,
    langIdx: row.lang_idx,
  };
}

function updateSettings(deviceId, partial) {
  const current = getSettings(deviceId);
  const next = { ...current, ...partial };
  db.prepare('UPDATE settings SET font_scale = ?, voice = ?, alerts = ?, lang_idx = ? WHERE device_id = ?')
    .run(next.fontScale, next.voice ? 1 : 0, next.alerts ? 1 : 0, next.langIdx, deviceId);
  return getSettings(deviceId);
}

function getCategories() {
  return db.prepare('SELECT id, label, tag FROM categories').all();
}

function getJobsByCategory(catId) {
  return db.prepare('SELECT * FROM jobs WHERE cat = ?').all(catId).map(rowToJob);
}

function getJob(id) {
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return row ? rowToJob(row) : null;
}

function getApplications(deviceId) {
  return db.prepare('SELECT job_id as jobId, title, org, status, applied_date as date FROM applications WHERE device_id = ? ORDER BY id DESC').all(deviceId);
}

function createApplication(deviceId, jobId) {
  const job = getJob(jobId);
  if (!job) return { created: false, applications: getApplications(deviceId) };
  const exists = db.prepare('SELECT 1 FROM applications WHERE device_id = ? AND job_id = ?').get(deviceId, jobId);
  if (!exists) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
    // 방문접수형은 링크를 눌러도 실제 신청이 끝난 게 아니므로 '대기중'이 아니라
    // '방문 준비 필요'로 정직하게 표시함(2026.7.25 발표 전 정정).
    const status = job.visitRequired ? '방문 준비 필요' : '대기중';
    db.prepare('INSERT INTO applications (device_id, job_id, title, org, status, applied_date) VALUES (?, ?, ?, ?, ?, ?)')
      .run(deviceId, jobId, job.title, job.org, status, dateStr);
  }
  return { created: !exists, applications: getApplications(deviceId) };
}

// 공공데이터 화면의 통계 수치 자체는 정적 시드 데이터(공공데이터포털 확보본)지만,
// "기준일" 표시는 7일 주기로 자동 갱신되는 것처럼 보여주기 위한 결정론적 계산.
// 매주 월요일을 기준일로 삼아 실제 통계 파이프라인 없이도 "최신화됐다"는 인상만 흉내내지 않고
// 정직하게 "이 날짜 기준"이라고 명시하는 용도.
const DATA_ANCHOR = Date.UTC(2026, 6, 20); // 2026-07-20 (월)
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getDataMeta() {
  const now = Date.now();
  const weeksSince = Math.floor((now - DATA_ANCHOR) / WEEK_MS);
  const periodStart = new Date(DATA_ANCHOR + weeksSince * WEEK_MS);
  const asOf = `${periodStart.getUTCFullYear()}.${periodStart.getUTCMonth() + 1}.${periodStart.getUTCDate()}`;
  return { asOf, cycleDays: 7 };
}

function resetAll(deviceId) {
  db.prepare("UPDATE profile SET name = '', gender = '여성', age = 70, avatar_photo = NULL, onboarded = 0 WHERE device_id = ?").run(deviceId);
  db.prepare("UPDATE settings SET font_scale = '1.15', voice = 1, alerts = 1, lang_idx = 0 WHERE device_id = ?").run(deviceId);
  db.prepare('DELETE FROM applications WHERE device_id = ?').run(deviceId);
  return { profile: getProfile(deviceId), settings: getSettings(deviceId), applications: getApplications(deviceId) };
}

module.exports = {
  getProfile, saveOnboard, setAvatarPhoto,
  getSettings, updateSettings,
  getCategories, getJobsByCategory, getJob,
  getApplications, createApplication,
  getDataMeta,
  resetAll,
};
