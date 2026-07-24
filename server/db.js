const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.join(__dirname, 'boogiboogie.db'));
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '여성',
    age INTEGER NOT NULL DEFAULT 70,
    avatar_set INTEGER NOT NULL DEFAULT 0,
    onboarded INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    font_scale TEXT NOT NULL DEFAULT '1.15',
    voice INTEGER NOT NULL DEFAULT 1,
    alerts INTEGER NOT NULL DEFAULT 1,
    lang_idx INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    org TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '대기중',
    applied_date TEXT NOT NULL
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
    eligibility TEXT NOT NULL
  );
`);

db.prepare('INSERT OR IGNORE INTO profile (id) VALUES (1)').run();
db.prepare('INSERT OR IGNORE INTO settings (id) VALUES (1)').run();

const CATEGORIES = [
  { id: 'publicgood', label: '공익활동형', tag: '공익활동형' },
  { id: 'social', label: '사회서비스형', tag: '사회서비스형' },
  { id: 'market', label: '시장형사업단', tag: '시장형사업단' },
  { id: 'job', label: '취업알선형', tag: '취업알선형' },
];

const JOBS = [
  { id: 'j1', cat: 'publicgood', org: '안산시니어클럽', title: '스쿨존 안전 지킴이',
    schedule: '주 3회 · 오전 9시~11시', headcountShort: '모집 3명', location: '원곡동 일대',
    time: '주 3회 (월, 수, 금)', timeSub: '오전 09:00 ~ 11:00 (일 2시간)',
    locationFull: '상록구 일동 초등학교 인근', locationSub: '거주지 우선 배정 가능',
    pay: '월 290,000원', paySub: '활동비 및 부대경비 포함',
    headcount: '총 15명 모집', headcountSub: '현재 8명 신청 완료',
    period: '2026.08.01 ~ 08.15', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '신체 건강하고 활동적인 분'] },
  { id: 'j2', cat: 'publicgood', org: '동산노인복지관', title: '경로당 행정 도우미',
    schedule: '주 5회 · 오전 10시~오후 2시', headcountShort: '모집 2명', location: '성포동 경로당',
    time: '주 5회 (월~금)', timeSub: '오전 10:00 ~ 오후 2:00 (일 4시간)',
    locationFull: '성포동 경로당', locationSub: '대중교통 이용 권장',
    pay: '월 350,000원', paySub: '활동비 및 부대경비 포함',
    headcount: '총 2명 모집', headcountSub: '현재 1명 신청 완료',
    period: '2026.08.01 ~ 08.20', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '기본적인 문서 작성이 가능한 분'] },
  { id: 'j3', cat: 'publicgood', org: '안산의료복지사회적협동조합', title: '공공도서관 봉사',
    schedule: '주 2회 · 오후 1시~4시', headcountShort: '모집 4명', location: '상록수도서관',
    time: '주 2회 (화, 목)', timeSub: '오후 01:00 ~ 04:00 (일 3시간)',
    locationFull: '상록수도서관', locationSub: '도서관 내 안내데스크 인근',
    pay: '월 220,000원', paySub: '활동비 포함',
    headcount: '총 4명 모집', headcountSub: '현재 2명 신청 완료',
    period: '2026.08.05 ~ 08.20', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '신체 건강하고 활동적인 분'] },
  { id: 'j4', cat: 'social', org: '안산장애인복지관', title: '장애인 이동 지원 도우미',
    schedule: '주 3회 · 오전 9시~12시', headcountShort: '모집 3명', location: '단원구 일대',
    time: '주 3회 (월, 수, 금)', timeSub: '오전 09:00 ~ 12:00 (일 3시간)',
    locationFull: '단원구 일대 자택-복지관 이동 구간', locationSub: '차량 탑승 보조 위주',
    pay: '월 310,000원', paySub: '활동비 및 교통비 포함',
    headcount: '총 3명 모집', headcountSub: '현재 1명 신청 완료',
    period: '2026.08.01 ~ 08.18', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '보행 및 부축 활동이 가능한 분'] },
  { id: 'j5', cat: 'social', org: '상록수노인복지센터', title: '재가 어르신 말벗 도우미',
    schedule: '주 2회 · 오후 2시~4시', headcountShort: '모집 5명', location: '상록구 일대',
    time: '주 2회 (화, 금)', timeSub: '오후 02:00 ~ 04:00 (일 2시간)',
    locationFull: '상록구 재가 어르신 가정 방문', locationSub: '2인 1조 방문 활동',
    pay: '월 250,000원', paySub: '활동비 포함',
    headcount: '총 5명 모집', headcountSub: '현재 3명 신청 완료',
    period: '2026.08.01 ~ 08.25', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '원활한 의사소통이 가능한 분'] },
  { id: 'j6', cat: 'market', org: '실버카페 다감', title: '카페 바리스타 보조',
    schedule: '주 4회 · 오전 9시~1시', headcountShort: '모집 4명', location: '단원구 고잔동',
    time: '주 4회 (월~목)', timeSub: '오전 09:00 ~ 오후 01:00 (일 4시간)',
    locationFull: '단원구 고잔동 실버카페 다감', locationSub: '매장 내 근무',
    pay: '월 480,000원', paySub: '매출 연동 수당 별도',
    headcount: '총 4명 모집', headcountSub: '현재 2명 신청 완료',
    period: '2026.08.01 ~ 08.15', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '서서 하는 근무가 가능한 분'] },
  { id: 'j7', cat: 'market', org: '손맛 반찬사업단', title: '반찬 제조·포장원',
    schedule: '주 5회 · 오전 8시~12시', headcountShort: '모집 6명', location: '초지동 공동작업장',
    time: '주 5회 (월~금)', timeSub: '오전 08:00 ~ 12:00 (일 4시간)',
    locationFull: '초지동 공동작업장', locationSub: '위생복 지급',
    pay: '월 500,000원', paySub: '매출 연동 수당 별도',
    headcount: '총 6명 모집', headcountSub: '현재 4명 신청 완료',
    period: '2026.08.01 ~ 08.10', periodSub: '정원 초과 시 조기 마감될 수 있음',
    eligibility: ['만 65세 이상 기초연금 수급자', '안산시 거주자 (주민등록상)', '장시간 서서 작업 가능한 분'] },
  { id: 'j8', cat: 'job', org: '안산시니어클럽 취업지원센터', title: '재취업 상담 연계',
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

const seedJobStmt = db.prepare(`
  INSERT OR IGNORE INTO jobs
    (id, cat, org, title, schedule, headcount_short, location, time, time_sub, location_full, location_sub, pay, pay_sub, headcount, headcount_sub, period, period_sub, eligibility)
  VALUES
    (@id, @cat, @org, @title, @schedule, @headcountShort, @location, @time, @timeSub, @locationFull, @locationSub, @pay, @paySub, @headcount, @headcountSub, @period, @periodSub, @eligibility)
`);
JOBS.forEach(j => seedJobStmt.run({ ...j, eligibility: JSON.stringify(j.eligibility) }));

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
    applyUrl: row.cat === 'job' ? SENIORRO_APPLY_URL : ANSAN_APPLY_URL,
  };
}

function getProfile() {
  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  return {
    name: row.name,
    gender: row.gender,
    age: row.age,
    avatarSet: !!row.avatar_set,
    onboarded: !!row.onboarded,
  };
}

function saveOnboard({ name, gender, age }) {
  db.prepare('UPDATE profile SET name = ?, gender = ?, age = ?, onboarded = 1 WHERE id = 1').run(name, gender, age);
  return getProfile();
}

function toggleAvatar() {
  const current = db.prepare('SELECT avatar_set FROM profile WHERE id = 1').get().avatar_set;
  db.prepare('UPDATE profile SET avatar_set = ? WHERE id = 1').run(current ? 0 : 1);
  return getProfile();
}

function getSettings() {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  return {
    fontScale: row.font_scale,
    voice: !!row.voice,
    alerts: !!row.alerts,
    langIdx: row.lang_idx,
  };
}

function updateSettings(partial) {
  const current = getSettings();
  const next = { ...current, ...partial };
  db.prepare('UPDATE settings SET font_scale = ?, voice = ?, alerts = ?, lang_idx = ? WHERE id = 1')
    .run(next.fontScale, next.voice ? 1 : 0, next.alerts ? 1 : 0, next.langIdx);
  return getSettings();
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

function getApplications() {
  return db.prepare('SELECT job_id as jobId, title, org, status, applied_date as date FROM applications ORDER BY id DESC').all();
}

function createApplication(jobId) {
  const job = getJob(jobId);
  if (!job) return { created: false, applications: getApplications() };
  const exists = db.prepare('SELECT 1 FROM applications WHERE job_id = ?').get(jobId);
  if (!exists) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
    db.prepare('INSERT INTO applications (job_id, title, org, status, applied_date) VALUES (?, ?, ?, ?, ?)')
      .run(jobId, job.title, job.org, '대기중', dateStr);
  }
  return { created: !exists, applications: getApplications() };
}

function resetAll() {
  db.prepare("UPDATE profile SET name = '', gender = '여성', age = 70, avatar_set = 0, onboarded = 0 WHERE id = 1").run();
  db.prepare("UPDATE settings SET font_scale = '1.15', voice = 1, alerts = 1, lang_idx = 0 WHERE id = 1").run();
  db.prepare('DELETE FROM applications').run();
  return { profile: getProfile(), settings: getSettings(), applications: getApplications() };
}

module.exports = {
  getProfile, saveOnboard, toggleAvatar,
  getSettings, updateSettings,
  getCategories, getJobsByCategory, getJob,
  getApplications, createApplication,
  resetAll,
};
