'use strict';
/* יומן אוכל — main app */

const P = window.Parser;
const FD = window.Foods;
const A = window.Android || null;
const MEALS = P.MEALS;
const MEAL = {
  breakfast: { label: 'בוקר', icon: 'sunrise', tint: '#E9862F', grad: 'linear-gradient(135deg,#FFC36B,#FF7A59)' },
  lunch: { label: 'צהריים', icon: 'sun', tint: '#D9A21B', grad: 'linear-gradient(135deg,#FFE07A,#F5A524)' },
  dinner: { label: 'ערב', icon: 'moon', tint: '#4F6FB0', grad: 'linear-gradient(135deg,#8E9BFF,#4E5BD0)' },
  snack: { label: 'ביניים', icon: 'cup', tint: '#2F8F6A', grad: 'linear-gradient(135deg,#5EE0B2,#22997A)' },
};
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const ACCENTS = ['#2F7D4F', '#2C7F9A', '#4F5FC0', '#8A4FB0', '#C2456E', '#C0581F', '#8A6A1F', '#3F4B45'];
const STORE_KEY = 'fooddiary.v1';

/* ---------------- icons ---------------- */
const IC = {
  'chev-r': '<path d="M9 6l6 6-6 6"/>',
  'chev-l': '<path d="M15 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  copy: '<rect class="d" x="8" y="8" width="12" height="12" rx="3"/><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  paste: '<rect class="d" x="5" y="5" width="14" height="16" rx="3"/><path d="M9 4h6v3H9z"/><path d="M15 5h1.5A2.5 2.5 0 0 1 19 7.5v11a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5v-11A2.5 2.5 0 0 1 7.5 5H9"/><path d="M9 12h6M9 16h4"/>',
  share: '<circle class="d" cx="18" cy="5" r="2.8"/><circle class="d" cx="6" cy="12" r="2.8"/><circle class="d" cx="18" cy="19" r="2.8"/><circle cx="18" cy="5" r="2.8"/><circle cx="6" cy="12" r="2.8"/><circle cx="18" cy="19" r="2.8"/><path d="M8.4 10.7l7.2-4.2M8.4 13.3l7.2 4.2"/>',
  book: '<rect class="d" x="5" y="3" width="14" height="18" rx="3.5"/><rect x="5" y="3" width="14" height="18" rx="3.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  history: '<rect class="d" x="3.5" y="5" width="17" height="15.5" rx="3.5"/><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M12 14h4M8 17h4"/>',
  chart: '<rect class="d" x="4" y="11" width="4" height="9" rx="1.6"/><rect class="d" x="10" y="4" width="4" height="16" rx="1.6"/><rect class="d" x="16" y="8" width="4" height="12" rx="1.6"/><rect x="4" y="11" width="4" height="9" rx="1.6"/><rect x="10" y="4" width="4" height="16" rx="1.6"/><rect x="16" y="8" width="4" height="12" rx="1.6"/>',
  gear: '<path d="M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20"/><circle class="d" cx="15" cy="7" r="2.6"/><circle cx="15" cy="7" r="2.6"/><circle class="d" cx="9" cy="17" r="2.6"/><circle cx="9" cy="17" r="2.6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  sunrise: '<path class="d" d="M6 15a6 6 0 0 1 12 0z"/><path d="M6 15a6 6 0 0 1 12 0M3 15h18M7 19h10M12 4v3M4.9 8l1.6 1.4M19.1 8l-1.6 1.4"/>',
  sun: '<circle class="d" cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path class="d" d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/><path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/><path d="M17 3.5v3M15.5 5h3"/>',
  cup: '<path class="d" d="M5 9h12v4a6 6 0 0 1-12 0z"/><path d="M5 9h12v4a6 6 0 0 1-12 0z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5c0 1.2 1 1.2 1 2.5M12 2.5c0 1.2 1 1.2 1 2.5"/>',
  drop: '<path class="d" d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/><path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  glass: '<path d="M6 3h12l-1.6 17a1.5 1.5 0 0 1-1.5 1.3H9.1a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M6.6 9h10.8"/>',
  flame: '<path class="d" d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-10-2 2-2.5 4-2.5 5.5C11 9 10 7.5 10 6c-3 2.5-5 5.5-5 9 0 4.3 3 7 7 7z"/><path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-10-2 2-2.5 4-2.5 5.5C11 9 10 7.5 10 6c-3 2.5-5 5.5-5 9 0 4.3 3 7 7 7z"/>',
  image: '<rect class="d" x="3" y="4" width="18" height="16" rx="3.5"/><rect x="3" y="4" width="18" height="16" rx="3.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  bookmark: '<path class="d" d="M6 3h12v18l-6-4-6 4z"/><path d="M6 3h12v18l-6-4-6 4z"/>',
  bell: '<path class="d" d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  palette: '<path class="d" d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s2-.5 3-.5a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s2-.5 3-.5a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.2" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  list: '<rect class="d" x="3" y="4" width="18" height="16" rx="3.5"/><path d="M9 9h8M9 12h8M9 15h8M6.5 9h.01M6.5 12h.01M6.5 15h.01"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l8-8"/>',
  note: '<path class="d" d="M5 4h14v12l-4 4H5z"/><path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 13h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  merge: '<path d="M6 4v5a5 5 0 0 0 5 5h7"/><path d="M15 11l3 3-3 3"/><path d="M6 20v-3"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  sparkle: '<path class="d" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15.5v4M17 17.5h4"/>',
  dice: '<rect class="d" x="4" y="4" width="16" height="16" rx="4.5"/><rect x="4" y="4" width="16" height="16" rx="4.5"/><g fill="currentColor" stroke="none"><circle cx="9" cy="9" r="1.4"/><circle cx="15" cy="15" r="1.4"/><circle cx="15" cy="9" r="1.4"/><circle cx="9" cy="15" r="1.4"/><circle cx="12" cy="12" r="1.4"/></g>',
  file: '<path class="d" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
};
function icon(name, size = 22, extra = '') {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}>${IC[name] || ''}</svg>`;
}

/* ---------------- backgrounds (bgs.js) ---------------- */
const BUILTIN_BGS = window.Backgrounds.LIST;

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function pad(n) { return String(n).padStart(2, '0'); }
function isoOf(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayISO() { return isoOf(new Date()); }
function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); }
function longDate(iso) { const d = parseISO(iso); return `${d.getDate()} ב${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function shortDate(iso) { const d = parseISO(iso); return `${d.getDate()} ב${MONTHS[d.getMonth()]}`; }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function nk(s) { return FD.normKey(s); }
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/* ---------------- data ---------------- */
function freshDb() {
  return {
    v: 1, days: {}, foods: {}, aliases: {}, templates: [],
    settings: {
      theme: 'auto', accent: '#2F7D4F', bg: 'sage', dim: 0, blur: 0, cardAlpha: 0.88, rotateBg: false, motion: true,
      showWater: true, waterGoal: 8, reminder: { on: false, h: 21, m: 0 },
    },
  };
}
let db = freshDb();

function loadDb() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { }
  if (!raw && A && A.readAutoBackup) { try { raw = A.readAutoBackup() || null; } catch (e) { } }
  if (raw) {
    try {
      const d = JSON.parse(raw);
      const f = freshDb();
      db = Object.assign(f, d);
      db.settings = Object.assign(f.settings, d.settings || {});
      db.settings.reminder = Object.assign({ on: false, h: 21, m: 0 }, (d.settings || {}).reminder || {});
    } catch (e) { db = freshDb(); }
  }
}
const backupLater = debounce(() => { try { A && A.autoBackup && A.autoBackup(JSON.stringify(db)); } catch (e) { } }, 2500);
function save() {
  invalidate();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { toast('האחסון מלא. כדאי לשמור גיבוי'); }
  backupLater();
  reportToday();
}
function reportToday() {
  try {
    const t = todayISO();
    const d = db.days[t];
    const n = d ? MEALS.filter(m => (d.meals[m] || []).length).length : 0;
    A && A.setDayStatus && A.setDayStatus(t, n);
  } catch (e) { }
}

function getDay(iso, create) {
  let d = db.days[iso];
  if (!d && create) {
    d = db.days[iso] = { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, mealNotes: {}, water: 0, note: '' };
  }
  if (d) {
    d.meals = d.meals || {};
    MEALS.forEach(m => { d.meals[m] = d.meals[m] || []; });
    d.mealNotes = d.mealNotes || {};
  }
  return d;
}
function dayHasData(d) { return d && (MEALS.some(m => d.meals[m] && d.meals[m].length) || d.water || d.note); }
function mealsCount(d) { return d ? MEALS.filter(m => d.meals[m] && d.meals[m].length).length : 0; }
function cleanupDay(iso) { const d = db.days[iso]; if (d && !dayHasData(d) && !Object.values(d.mealNotes || {}).some(Boolean)) delete db.days[iso]; }

/* lexicon: built-in dictionary + user foods + user merges */
const BASE = FD.buildDictionary();
let LEX = null;
function lex() {
  if (LEX) return LEX;
  const aliases = Object.assign({}, BASE.aliases);
  const cats = {};
  for (const k in BASE.dict) cats[k] = BASE.dict[k].cat;
  for (const name in db.foods) {
    aliases[nk(name)] = name;
    if (db.foods[name].cat) cats[name] = db.foods[name].cat;
  }
  for (const a in db.aliases) aliases[a] = db.aliases[a];
  LEX = { aliases, cats };
  return LEX;
}
function catOf(name) { const L = lex(); return L.cats[name] || (db.foods[name] && db.foods[name].cat) || 'other'; }
function canonical(name) { return lex().aliases[nk(name)] || name.trim(); }

let USAGE = null;
function invalidate() { USAGE = null; LEX = null; }
function usage() {
  if (USAGE) return USAGE;
  const u = {};
  const dates = Object.keys(db.days).sort();
  for (const iso of dates) {
    const d = db.days[iso];
    for (const m of MEALS) for (const it of (d.meals[m] || [])) {
      const names = [it.name].concat(it.with || []);
      names.forEach((nm, idx) => {
        const r = u[nm] || (u[nm] = { n: 0, meals: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }, last: null, lastDate: '' });
        r.n++; r.meals[m]++; r.lastDate = iso;
        if (idx === 0) r.last = { qty: it.qty, unit: it.unit, with: it.with || [], note: it.note || '' };
      });
    }
  }
  USAGE = u;
  return u;
}
function topFoods(meal, limit) {
  const u = usage();
  return Object.keys(u).filter(n => !meal || u[n].meals[meal] > 0 && u[n].last)
    .sort((a, b) => (meal ? u[b].meals[meal] - u[a].meals[meal] : u[b].n - u[a].n) || (u[b].lastDate > u[a].lastDate ? 1 : -1))
    .slice(0, limit);
}
function allFoodNames() {
  const set = new Set(Object.keys(usage()));
  Object.keys(BASE.dict).forEach(n => set.add(n));
  Object.keys(db.foods).forEach(n => set.add(n));
  return Array.from(set);
}
function learnFoods(items) {
  for (const it of items) {
    [it.name].concat(it.with || []).forEach(n => {
      if (!BASE.dict[n] && !db.foods[n]) db.foods[n] = { cat: guessCat(n) };
    });
  }
}
function guessCat(name) {
  // A new name containing a known food word inherits its category: "סלט טונה" -> חלבונים? first match wins
  const words = name.split(' ');
  for (let L = words.length; L >= 1; L--) for (let i = 0; i + L <= words.length; i++) {
    const hit = BASE.aliases[nk(words.slice(i, i + L).join(' '))];
    if (hit) return BASE.dict[hit].cat;
  }
  return 'other';
}
function newItem(it) { return { id: uid(), name: it.name, qty: it.qty == null ? null : it.qty, unit: it.unit || null, with: it.with || [], note: it.note || '' }; }

/* ---------------- app state ---------------- */
const S = { bgCat: 'all', tab: 'today', date: todayISO(), statsRange: 7, statsMeal: '', histQuery: '', histMonth: todayISO().slice(0, 7), histLimit: 40 };

/* ---------------- theme & background ---------------- */
const bgCache = {};
const bgLum = {};
function isDarkTheme() {
  const t = db.settings.theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
async function applyTheme() {
  const s = db.settings;
  const dark = isDarkTheme();
  document.documentElement.classList.toggle('dark', dark);
  const r = document.documentElement.style;
  r.setProperty('--accent', s.accent);
  r.setProperty('--card-alpha', String(s.cardAlpha));
  r.setProperty('--blur', (s.blur || 0) + 'px');
  r.setProperty('--dim', String(s.dim || 0));
  const bgEl = $('#bg');
  let id = s.bg || 'plain';
  if (s.rotateBg) id = rotatingBg();
  let css = '';
  let darkTop = dark;
  if (id.startsWith('custom:')) {
    const url = await getCustomBg(id.slice(7));
    css = url ? `url("${url}") center/cover no-repeat` : '';
    if (url) { const l = (bgLum[id.slice(7)] ?? 0.5) * (1 - (s.dim || 0)); darkTop = l < 0.5; }
  } else {
    const b = BUILTIN_BGS.find(x => x.id === id);
    css = b ? b.css : '';
    if (b && b.dark) darkTop = true;
  }
  bgEl.style.background = css || 'var(--page)';
  if (!css) bgEl.style.backgroundColor = 'var(--page)';
  const bdef = BUILTIN_BGS.find(x => x.id === id);
  const fx = (bdef && bdef.fx) || '';
  const fxEl = $('#bgFx');
  if (fxEl.dataset.fx !== fx) { fxEl.dataset.fx = fx; fxEl.innerHTML = fx ? window.Backgrounds.fxHtml(fx) : ''; }
  document.documentElement.classList.toggle('still', s.motion === false);
  document.documentElement.classList.toggle('has-fx', !!fx && s.motion !== false);
  try { A && A.setBars && A.setBars(dark ? '#111613' : '#F3F4EF', darkTop); } catch (e) { }
}
function rotatingBg() {
  const pool = customBgIds.length ? customBgIds.map(i => 'custom:' + i) : BUILTIN_BGS.filter(b => b.id !== 'plain').map(b => b.id);
  pool.sort();
  const d = parseISO(todayISO());
  const dayNum = Math.floor(d.getTime() / 86400000);
  return pool[dayNum % pool.length];
}

/* IndexedDB for custom background images */
let idb = null;
let customBgIds = [];
function openIdb() {
  return new Promise((res) => {
    if (idb) return res(idb);
    try {
      const rq = indexedDB.open('fooddiary', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('bgs', { keyPath: 'id' });
      rq.onsuccess = () => { idb = rq.result; res(idb); };
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
async function idbAll() {
  const d = await openIdb(); if (!d) return [];
  return new Promise(res => {
    const out = [];
    const c = d.transaction('bgs').objectStore('bgs').openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { out.push(cur.value); cur.continue(); } else res(out); };
    c.onerror = () => res(out);
  });
}
async function idbPut(v) { const d = await openIdb(); if (!d) return false; return new Promise(res => { const t = d.transaction('bgs', 'readwrite'); t.objectStore('bgs').put(v); t.oncomplete = () => res(true); t.onerror = () => res(false); }); }
async function idbDel(id) { const d = await openIdb(); if (!d) return; return new Promise(res => { const t = d.transaction('bgs', 'readwrite'); t.objectStore('bgs').delete(id); t.oncomplete = () => res(); t.onerror = () => res(); }); }
async function loadCustomBgs() {
  const all = await idbAll();
  all.sort((a, b) => a.created - b.created);
  customBgIds = all.map(x => x.id);
  all.forEach(x => { bgCache[x.id] = x.data; bgLum[x.id] = x.lum == null ? 0.5 : x.lum; });
}
async function getCustomBg(id) {
  if (bgCache[id]) return bgCache[id];
  await loadCustomBgs();
  return bgCache[id] || null;
}
function readImageFile(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        let w = img.naturalWidth, h = img.naturalHeight;
        const sc = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * sc); h = Math.round(h * sc);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // is the top of the picture dark? (decides the status bar icon color)
        let lum = 0.5;
        try {
          const px = ctx.getImageData(0, 0, w, Math.max(1, Math.round(h * 0.08))).data;
          let sum = 0, n = 0;
          for (let i = 0; i < px.length; i += 16) { sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; n++; }
          lum = sum / n / 255;
        } catch (e) { }
        res({ data: c.toDataURL('image/jpeg', 0.85), lum });
      };
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

/* ---------------- toast ---------------- */
let toastTimer = null;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : '');
  if (action) t.querySelector('button').onclick = () => { t.classList.remove('show'); action.fn(); };
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 5000 : 2200);
}
window.appToast = (m) => toast(m);

/* ---------------- render: shell ---------------- */
const TABS = [
  { id: 'today', label: 'היום', icon: 'book' },
  { id: 'history', label: 'היסטוריה', icon: 'history' },
  { id: 'stats', label: 'סיכום', icon: 'chart' },
  { id: 'settings', label: 'הגדרות', icon: 'gear' },
];
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(t => `<button class="tab" data-act="tab" data-id="${t.id}" ${S.tab === t.id ? 'aria-current="page"' : ''}><span class="pill">${icon(t.icon, 22)}</span>${t.label}</button>`).join('');
}
function render(opts = {}) {
  const sc = $('#screen');
  const keepScroll = opts.keepScroll ? sc.scrollTop : 0;
  const html = { today: viewToday, history: viewHistory, stats: viewStats, settings: viewSettings }[S.tab]();
  sc.innerHTML = html;
  renderTabs();
  if (opts.anim) { sc.classList.remove('swap'); void sc.offsetWidth; sc.classList.add('swap'); }
  sc.scrollTop = keepScroll;
  if (!opts.anim) $$('.card, .chip', sc).forEach(el => { el.style.animation = 'none'; });
}

/* ---------------- view: today ---------------- */
function itemChip(it, meal, idx) {
  const main = P.formatItem(Object.assign({}, it, { with: [], note: '' }));
  let q = '';
  let name = main;
  const m = main.match(/^(\S+)\s(.+)$/);
  if (it.qty != null && m && !(it.unit && FD.AFTER_UNITS.has(it.unit))) { q = m[1]; name = m[2]; }
  const extra = [];
  if (it.with && it.with.length) extra.push('עם ' + P.joinVav(it.with));
  if (it.note) extra.push(it.note);
  return `<button class="chip" data-act="editItem" data-meal="${meal}" data-idx="${idx}">${q ? `<span class="q">${esc(q)}</span>` : ''}<span>${esc(name)}</span>${extra.length ? `<span class="w">${esc(extra.join(' · '))}</span>` : ''}</button>`;
}
function streak() {
  let n = 0;
  let d = todayISO();
  if (!dayHasData(db.days[d])) d = addDays(d, -1);
  while (dayHasData(db.days[d])) { n++; d = addDays(d, -1); }
  return n;
}
function viewToday() {
  const iso = S.date;
  const day = getDay(iso, false);
  const isToday = iso === todayISO();
  const st = streak();
  const wd = 'יום ' + P.weekdayName(iso);
  let h = `<section class="topbar">
    <div class="daynav">
      <button class="iconbtn" data-act="prevDay" aria-label="היום הקודם">${icon('chev-r')}</button>
      <button class="datebtn" data-act="pickDate" aria-label="בחירת תאריך"><span class="wd">${isToday ? 'היום · ' : ''}${wd}</span><span class="dt">${longDate(iso)}</span></button>
      <button class="iconbtn" data-act="nextDay" aria-label="היום הבא">${icon('chev-l')}</button>
    </div>
    <div class="badges">
      ${st ? `<span class="badge hot">${icon('flame', 17)}רצף ${st} ${st === 1 ? 'יום' : 'ימים'}</span>` : ''}
      ${!isToday ? `<button class="badge" data-act="goToday">${icon('cal', 16)}חזרה להיום</button>` : ''}
      <span class="badge">${icon('check', 16)}${mealsCount(day)} מתוך 4 ארוחות</span>
    </div>
  </section>
  <div class="quick">
    <button class="btn" data-act="copyYesterday"><span class="qi" style="--q1:#7C9BFF;--q2:#5363D6">${icon('copy', 20)}</span>העתק מאתמול</button>
    <button class="btn" data-act="openImport" data-mode="day"><span class="qi" style="--q1:#FFB36B;--q2:#F06A4A">${icon('paste', 20)}</span>הדבק טקסט</button>
    <button class="btn" data-act="shareDay"><span class="qi" style="--q1:#5EE0B2;--q2:#1E9C7A">${icon('share', 20)}</span>שתף את היום</button>
  </div>`;

  for (const m of MEALS) {
    const items = day ? day.meals[m] : [];
    const note = day && day.mealNotes[m];
    const tpls = db.templates.filter(t => t.meal === m);
    h += `<section class="card" aria-label="${MEAL[m].label}">
      <div class="meal-head">
        <span class="meal-icon" style="background:${MEAL[m].grad};--glow:${MEAL[m].tint}">${icon(MEAL[m].icon, 24)}</span>
        <div class="meal-title"><h2>${MEAL[m].label}</h2>${items.length ? `<div class="sub">${items.length} ${items.length === 1 ? 'פריט' : 'פריטים'}</div>` : ''}</div>
        <button class="iconbtn flat" data-act="mealMenu" data-meal="${m}" aria-label="אפשרויות ל${MEAL[m].label}">${icon('dots')}</button>
        <button class="iconbtn primary" data-act="openAdd" data-meal="${m}" aria-label="הוספה ל${MEAL[m].label}">${icon('plus')}</button>
      </div>`;
    if (items.length) {
      h += `<div class="chips">${items.map((it, i) => itemChip(it, m, i)).join('')}</div>`;
    } else {
      h += `<div class="chips">${tpls.slice(0, 3).map(t => `<button class="chip tpl" data-act="applyTpl" data-id="${t.id}" data-meal="${m}">${icon('bookmark', 16)}${esc(t.name)}</button>`).join('')}<button class="chip ghost" data-act="openAdd" data-meal="${m}">${icon('plus', 16)}מה אכלת?</button></div>`;
    }
    if (note) h += `<div class="meal-note">${icon('note', 16)}<span>${esc(note)}</span></div>`;
    h += `</section>`;
  }

  if (db.settings.showWater) {
    const w = (day && day.water) || 0;
    const goal = db.settings.waterGoal || 8;
    const n = Math.max(goal, w + (w >= goal ? 1 : 0));
    h += `<section class="card"><div class="row between"><h2 class="row">${icon('drop', 20, 'style="color:#2C8FB5"')}מים</h2><span class="muted small">${w} מתוך ${goal} כוסות</span></div>
      <div class="water">${Array.from({ length: n }, (_, i) => `<button class="cup ${i < w ? 'on' : ''}" data-act="water" data-n="${i + 1}" aria-label="${i + 1} כוסות">${icon('glass', 28, i < w ? 'fill="currentColor" fill-opacity=".25"' : '')}</button>`).join('')}</div></section>`;
  }
  h += `<section class="card"><h3 class="row">${icon('note', 18)}הערות על היום</h3>
    <textarea class="note" rows="2" data-on="dayNote" placeholder="איך הרגשת, אכלת בחוץ, משהו מיוחד…">${esc((day && day.note) || '')}</textarea></section>`;
  return h;
}

/* ---------------- view: history ---------------- */
function viewHistory() {
  const q = S.histQuery.trim();
  const qk = nk(q);
  const [yy, mm] = S.histMonth.split('-').map(Number);
  const first = new Date(yy, mm - 1, 1);
  const daysIn = new Date(yy, mm, 0).getDate();
  const t = todayISO();
  let cal = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => `<div class="h">${d}</div>`).join('');
  for (let i = 0; i < first.getDay(); i++) cal += '<div></div>';
  for (let d = 1; d <= daysIn; d++) {
    const iso = `${yy}-${pad(mm)}-${pad(d)}`;
    const n = mealsCount(db.days[iso]);
    const cls = [n ? 'l' + n : '', iso === t ? 'today' : '', iso > t ? 'future' : ''].join(' ');
    cal += `<button class="${cls}" data-act="openDay" data-date="${iso}" aria-label="${d} ב${MONTHS[mm - 1]}${n ? `, ${n} ארוחות` : ''}">${d}</button>`;
  }
  const logged = Object.keys(db.days).filter(k => dayHasData(db.days[k])).sort().reverse();
  let list = logged;
  if (q) list = logged.filter(iso => P.dayToText(iso, db.days[iso]).split('\n').slice(1).some(l => nk(l).includes(qk)));
  const total = list.length;
  list = list.slice(0, S.histLimit);
  const hl = (s) => {
    const e = esc(s);
    if (!q) return e;
    const i = s.indexOf(q);
    return i < 0 ? e : esc(s.slice(0, i)) + '<mark>' + esc(q) + '</mark>' + esc(s.slice(i + q.length));
  };
  let h = `<section class="topbar"><h1>היסטוריה</h1></section>
  <section class="card">
    <div class="row between" style="margin-bottom:8px">
      <button class="iconbtn plain" data-act="histMonth" data-d="-1" aria-label="החודש הקודם">${icon('chev-r')}</button>
      <h2>${MONTHS[mm - 1]} ${yy}</h2>
      <button class="iconbtn plain" data-act="histMonth" data-d="1" aria-label="החודש הבא">${icon('chev-l')}</button>
    </div>
    <div class="cal">${cal}</div>
    <div class="row small muted" style="margin-top:10px;justify-content:center;gap:12px"><span>כהה יותר = יותר ארוחות רשומות</span></div>
  </section>
  <div class="searchbox" style="margin-bottom:12px">${icon('search', 18)}<input class="search" type="search" data-on="histSearch" value="${esc(q)}" placeholder="חיפוש מאכל, למשל פיצה" aria-label="חיפוש בהיסטוריה"></div>`;
  if (q) h += `<p class="small muted" style="margin:0 4px 10px">${total ? `נמצא ב-${total} ימים` : 'לא נמצאו ימים'}</p>`;
  if (!logged.length) {
    h += `<div class="card empty-state">${icon('history', 40)}<div>עוד אין ימים רשומים.</div><div class="small">אפשר לייבא את כל מה שכבר כתבת.</div><div style="margin-top:12px"><button class="btn primary" data-act="openImport" data-mode="history">${icon('upload')}ייבוא היסטוריה</button></div></div>`;
  }
  for (const iso of list) {
    const d = db.days[iso];
    const lines = MEALS.filter(m => d.meals[m].length).map(m => `<span><b>${MEAL[m].label}:</b> ${hl(d.meals[m].map(it => P.formatItem(it, { short: true })).join(', '))}</span>`);
    if (d.water) lines.push(`<span><b>מים:</b> ${d.water} כוסות</span>`);
    h += `<button class="card dayitem" data-act="openDay" data-date="${iso}">
      <div class="row between"><span style="font-weight:700">יום ${P.weekdayName(iso)}, ${shortDate(iso)}</span><span class="small muted">${P.displayDate(iso)}</span></div>
      <div class="lines">${lines.join('')}</div></button>`;
  }
  if (total > list.length) h += `<button class="btn block" data-act="histMore">הצג עוד</button>`;
  return h;
}

/* ---------------- view: stats ---------------- */
function rangeDates() {
  const t = todayISO();
  if (S.statsRange === 0) {
    const all = Object.keys(db.days).filter(k => dayHasData(db.days[k])).sort();
    if (!all.length) return [];
    const out = []; let d = all[0];
    while (d <= t) { out.push(d); d = addDays(d, 1); }
    return out;
  }
  return Array.from({ length: S.statsRange }, (_, i) => addDays(t, -(S.statsRange - 1 - i)));
}
function viewStats() {
  const dates = rangeDates();
  const logged = dates.filter(iso => dayHasData(db.days[iso]));
  const meal = S.statsMeal;
  const counts = {};
  const catDays = {};
  let water = 0, waterDays = 0, mealsTotal = 0;
  for (const iso of logged) {
    const d = db.days[iso];
    const seenCats = new Set();
    if (d.water) { water += d.water; waterDays++; }
    mealsTotal += mealsCount(d);
    for (const m of MEALS) for (const it of d.meals[m]) {
      [it.name].concat(it.with || []).forEach(n => {
        seenCats.add(catOf(n));
        if (!meal || meal === m) counts[n] = (counts[n] || 0) + 1;
      });
    }
    seenCats.forEach(c => { catDays[c] = (catDays[c] || 0) + 1; });
  }
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 10);
  const maxC = top.length ? counts[top[0]] : 1;
  const rangeSeg = [[7, '7 ימים'], [30, '30 ימים'], [0, 'הכל']].map(([v, l]) => `<button data-act="statsRange" data-v="${v}" aria-pressed="${S.statsRange === v}">${l}</button>`).join('');
  const mealSeg = [['', 'הכל']].concat(MEALS.map(m => [m, MEAL[m].label])).map(([v, l]) => `<button data-act="statsMeal" data-v="${v}" aria-pressed="${meal === v}">${l}</button>`).join('');
  let h = `<section class="topbar"><h1>סיכום</h1></section>
  <div class="seg" style="margin-bottom:12px">${rangeSeg}</div>`;
  if (!logged.length) {
    return h + `<div class="card empty-state">${icon('chart', 40)}<div>אין עדיין נתונים בתקופה הזאת.</div></div>`;
  }
  h += `<div class="tiles">
    <div class="card tile"><div class="big">${logged.length}<span class="small muted"> / ${dates.length}</span></div><div class="lbl">ימים רשומים</div></div>
    <div class="card tile"><div class="big" style="color:#B85C1E">${streak()}</div><div class="lbl">ימים ברצף</div></div>
    <div class="card tile"><div class="big">${(mealsTotal / logged.length).toFixed(1)}</div><div class="lbl">ארוחות ביום בממוצע</div></div>
    <div class="card tile"><div class="big" style="color:#2C8FB5">${waterDays ? (water / waterDays).toFixed(1) : '–'}</div><div class="lbl">כוסות מים ביום</div></div>
  </div>
  <section class="card"><h3>באילו ימים היה…</h3><div class="stack">`;
  const catOrder = Object.keys(FD.CATEGORIES).filter(c => catDays[c]).sort((a, b) => catDays[b] - catDays[a]);
  for (const c of catOrder) {
    const pct = Math.round(catDays[c] / logged.length * 100);
    h += `<div class="barrow"><div class="row between"><span>${FD.CATEGORIES[c].label}</span><span class="muted small">${catDays[c]} מתוך ${logged.length} ימים</span></div><div class="bar"><i style="width:${pct}%;background:${FD.CATEGORIES[c].color}"></i></div></div>`;
  }
  h += `</div></section>
  <section class="card"><h3>מה אכלת הכי הרבה</h3><div class="seg" style="margin-bottom:12px">${mealSeg}</div><div class="stack">`;
  if (!top.length) h += `<div class="muted small">אין פריטים בארוחה הזאת בתקופה.</div>`;
  for (const n of top) {
    h += `<div class="barrow"><div class="row between"><span>${esc(n)}</span><span class="muted small">${counts[n]} ${counts[n] === 1 ? 'פעם' : 'פעמים'}</span></div><div class="bar"><i style="width:${Math.round(counts[n] / maxC * 100)}%"></i></div></div>`;
  }
  h += `</div></section>
  <div class="row" style="gap:8px">
    <button class="btn grow" data-act="sharePeriod">${icon('share', 18)}שתף כטקסט</button>
    <button class="btn grow" data-act="exportCsv">${icon('download', 18)}שמור CSV</button>
  </div>`;
  return h;
}

/* ---------------- view: settings ---------------- */
function bgThumbs() {
  const s = db.settings;
  const cat = S.bgCat;
  let h = '';
  if (cat === 'all' || cat === 'mine') {
    h += `<label class="bgthumb add" role="button" aria-label="הוספת רקע מהגלריה">${icon('image', 26)}<span>מהגלריה</span><input type="file" accept="image/*" data-on="addBg" class="hidden"></label>`;
    customBgIds.forEach((id, i) => {
      const sel = s.bg === 'custom:' + id;
      h += `<button class="bgthumb" style="background-image:url('${bgCache[id]}')" data-act="setBg" data-id="custom:${id}" aria-pressed="${sel}" aria-label="תמונה ${i + 1}">${sel ? `<span class="ck">${icon('check', 16)}</span>` : ''}<span class="nm">תמונה ${i + 1}</span></button>`;
    });
  }
  for (const b of BUILTIN_BGS) {
    if (cat !== 'all' && b.cat !== cat) continue;
    const style = b.css ? `background:${b.css}` : 'background:var(--page)';
    const sel = s.bg === b.id;
    h += `<button class="bgthumb" style='${style.replace(/'/g, '&#39;')}' data-act="setBg" data-id="${b.id}" aria-pressed="${sel}" aria-label="רקע ${b.name}">${b.fx ? `<span class="fx" data-fx="${b.fx}">${window.Backgrounds.fxHtml(b.fx)}</span><span class="tag">${icon('sparkle', 12)}מונפש</span>` : ''}${sel ? `<span class="ck">${icon('check', 16)}</span>` : ''}<span class="nm">${b.name}</span></button>`;
  }
  return h;
}
function sw(act, on, label) { return `<button class="switch" role="switch" aria-checked="${!!on}" data-act="${act}" aria-label="${label}"></button>`; }
function viewSettings() {
  const s = db.settings;
  const themeSeg = [['light', 'בהיר'], ['dark', 'כהה'], ['auto', 'אוטומטי']].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${s.theme === v}">${l}</button>`).join('');
  const r = s.reminder;
  const foodsN = Object.keys(usage()).length;
  const isCustom = (s.bg || '').startsWith('custom:');
  return `<section class="topbar"><h1>הגדרות</h1></section>
  <section class="card stack">
    <h2 class="row">${icon('image', 20)}רקע</h2>
    <div class="bgcats" role="group" aria-label="סוג רקע">${window.Backgrounds.CATS.concat(customBgIds.length ? [['mine', 'התמונות שלי']] : []).map(([v, l]) => `<button data-act="bgCat" data-v="${v}" aria-pressed="${S.bgCat === v}">${l}</button>`).join('')}</div>
    <div class="bggrid">${bgThumbs()}</div>
    <button class="btn soft" data-act="surpriseBg">${icon('dice', 20)}הפתע אותי</button>
    ${isCustom ? `<button class="btn danger" data-act="delBg">${icon('trash', 18)}מחק את התמונה הנבחרת</button>` : ''}
    <label class="field"><span>הכהיית הרקע</span><input type="range" min="0" max="0.7" step="0.05" value="${s.dim}" data-on="dim"></label>
    <label class="field"><span>טשטוש הרקע</span><input type="range" min="0" max="20" step="1" value="${s.blur}" data-on="blur"></label>
    <label class="field"><span>שקיפות הכרטיסים</span><input type="range" min="0.5" max="1" step="0.02" value="${s.cardAlpha}" data-on="cardAlpha"></label>
    <div class="row between"><span>הנפשת רקעים</span>${sw('motion', s.motion !== false, 'הנפשת רקעים')}</div>
    <div class="row between"><span>רקע מתחלף כל יום</span>${sw('rotateBg', s.rotateBg, 'רקע מתחלף כל יום')}</div>
    <div class="small muted">כשיש תמונות שלך, מתחלפות רק הן. אחרת, הרקעים המובנים.</div>
  </section>
  <section class="card stack">
    <h2 class="row">${icon('palette', 20)}מראה</h2>
    <div class="seg">${themeSeg}</div>
    <div class="field"><span>צבע ראשי</span><div class="swatches">${ACCENTS.map(c => `<button class="swatch" style="background:${c}" data-act="accent" data-v="${c}" aria-pressed="${s.accent === c}" aria-label="צבע ${c}"></button>`).join('')}</div></div>
  </section>
  <section class="card stack">
    <h2 class="row">${icon('bell', 20)}תזכורת יומית</h2>
    <div class="row between"><span>תזכיר לי אם לא רשמתי את כל הארוחות</span>${sw('reminder', r.on, 'תזכורת יומית')}</div>
    <label class="field ${r.on ? '' : 'hidden'}"><span>שעה</span><input type="time" value="${pad(r.h)}:${pad(r.m)}" data-on="remTime"></label>
    ${A ? '' : '<div class="small muted">תזכורות עובדות באפליקציה המותקנת בטלפון.</div>'}
  </section>
  <section class="card stack">
    <h2 class="row">${icon('drop', 20)}מים</h2>
    <div class="row between"><span>הצג מעקב מים</span>${sw('showWater', s.showWater, 'הצג מעקב מים')}</div>
    <div class="row between ${s.showWater ? '' : 'hidden'}"><span>יעד כוסות ביום</span>
      <div class="stepper"><button class="iconbtn plain" data-act="waterGoal" data-d="-1" aria-label="פחות">${icon('minus', 18)}</button><span class="val">${s.waterGoal}</span><button class="iconbtn plain" data-act="waterGoal" data-d="1" aria-label="יותר">${icon('plus', 18)}</button></div></div>
  </section>
  <section class="card">
    <h2 class="row" style="margin-bottom:4px">${icon('list', 20)}מאכלים וארוחות</h2>
    <div class="list">
      <button class="li" data-act="openFoods"><span class="grow"><span class="t">המאכלים שלי</span><br><span class="s">${foodsN} מאכלים · שינוי שם, איחוד וקטגוריה</span></span>${icon('chev-l', 18)}</button>
      <button class="li" data-act="openTemplates"><span class="grow"><span class="t">ארוחות שמורות</span><br><span class="s">${db.templates.length ? db.templates.length + ' ארוחות' : 'עוד אין. שומרים מתוך תפריט הארוחה (⋯)'}</span></span>${icon('chev-l', 18)}</button>
    </div>
  </section>
  <section class="card">
    <h2 class="row" style="margin-bottom:4px">${icon('file', 20)}נתונים</h2>
    <div class="list">
      <button class="li" data-act="openImport" data-mode="history"><span class="grow"><span class="t">ייבוא היסטוריה</span><br><span class="s">מדביקים את כל מה שכבר כתבת, או בוחרים קובץ טקסט</span></span>${icon('upload', 18)}</button>
      <button class="li" data-act="backup"><span class="grow"><span class="t">שמירת גיבוי</span><br><span class="s">קובץ JSON עם כל הנתונים</span></span>${icon('download', 18)}</button>
      <label class="li" role="button"><span class="grow"><span class="t">שחזור מגיבוי</span><br><span class="s">טעינת קובץ גיבוי (מחליף את הנתונים)</span></span>${icon('undo', 18)}<input type="file" class="hidden" data-on="restore"></label>
      <button class="li" data-act="exportText"><span class="grow"><span class="t">ייצוא הכל כטקסט</span><br><span class="s">באותו פורמט שאתה כותב</span></span>${icon('file', 18)}</button>
      <button class="li" data-act="exportCsv"><span class="grow"><span class="t">ייצוא CSV</span><br><span class="s">לאקסל או לדיאטנית</span></span>${icon('download', 18)}</button>
      <button class="li" data-act="wipe"><span class="grow"><span class="t" style="color:#B23A3A">מחיקת כל הנתונים</span></span>${icon('trash', 18)}</button>
    </div>
  </section>
  <p class="center small muted">יומן אוכל ${A && A.appVersion ? esc(A.appVersion()) : ''} · עובד בלי אינטרנט · הנתונים נשמרים רק בטלפון</p>`;
}

/* ---------------- sheets ---------------- */
const sheetStack = [];
function openSheet(id, html, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.dataset.sheet = id;
  wrap.innerHTML = `<div class="scrim" data-act="closeSheet"></div><div class="sheet ${opts.full ? 'full' : ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.title || '')}"><div class="grab"></div>${html}</div>`;
  $('#sheets').appendChild(wrap);
  sheetStack.push({ id, el: wrap, onClose: opts.onClose });
  return wrap;
}
function topSheet() { return sheetStack[sheetStack.length - 1]; }
function closeSheet() {
  const s = sheetStack.pop();
  if (!s) return false;
  s.el.classList.add('closing');
  setTimeout(() => s.el.remove(), 190);
  if (s.onClose) s.onClose();
  return true;
}
function sheetHead(title, extra = '') {
  return `<header><h2>${title}</h2>${extra}<button class="iconbtn plain" data-act="closeSheet" aria-label="סגירה">${icon('x', 20)}</button></header>`;
}
function replaceSheetBody(id, html) {
  const s = sheetStack.find(x => x.id === id);
  if (!s) return;
  const body = s.el.querySelector('.sheet');
  const scrollers = $$('.body', body).map(b => b.scrollTop);
  body.innerHTML = '<div class="grab"></div>' + html;
  $$('.body', body).forEach((b, i) => { b.scrollTop = scrollers[i] || 0; });
}

/* ----- add sheet ----- */
const ADD = { meal: 'breakfast', text: '' };
function openAdd(meal) {
  ADD.meal = meal; ADD.text = '';
  openSheet('add', addSheetHtml(), { full: true, title: 'הוספה', onClose: () => render({ keepScroll: true }) });
  setTimeout(() => { const i = $('[data-on="addText"]'); i && i.focus(); }, 300);
}
function addSheetHtml() {
  const m = ADD.meal;
  const day = getDay(S.date, false);
  const items = day ? day.meals[m] : [];
  const seg = MEALS.map(x => `<button data-act="addMeal" data-v="${x}" aria-pressed="${x === m}">${MEAL[x].label}</button>`).join('');
  const tpls = db.templates.filter(t => t.meal === m).concat(db.templates.filter(t => t.meal !== m));
  let freq = topFoods(m, 14);
  if (freq.length < 8) freq = freq.concat(topFoods('', 20).filter(n => !freq.includes(n))).slice(0, 14);
  const u = usage();
  return sheetHead(`הוספה ל${MEAL[m].label}`) + `<div class="body">
    <div class="seg">${seg}</div>
    <div class="field">
      <div class="row">
        <input class="search grow" type="text" data-on="addText" value="${esc(ADD.text)}" placeholder="למשל: 3 אגוזי מלך, קפה עם חלב" aria-label="מה אכלת" enterkeyhint="done" autocomplete="off">
        <button class="iconbtn primary" data-act="addTyped" aria-label="הוספה">${icon('plus')}</button>
      </div>
    </div>
    <div id="addLive">${addLiveHtml()}</div>
    ${items.length ? `<div class="section-t">ב${MEAL[m].label} עכשיו</div>
    <div class="list">${items.map((it, i) => `<div class="li"><button class="grow" style="border:none;background:none;text-align:right;padding:0;min-height:44px" data-act="editItem" data-meal="${m}" data-idx="${i}"><span class="t">${esc(P.formatItem(it))}</span></button>
      <div class="stepper"><button class="iconbtn plain" data-act="qty" data-idx="${i}" data-d="-1" aria-label="פחות ${esc(it.name)}">${icon('minus', 18)}</button><span class="val">${it.qty == null ? '–' : esc(P.fmtQty(it.qty))}</span><button class="iconbtn plain" data-act="qty" data-idx="${i}" data-d="1" aria-label="עוד ${esc(it.name)}">${icon('plus', 18)}</button></div></div>`).join('')}</div>` : ''}
    ${tpls.length ? `<div class="section-t">ארוחות שמורות</div><div class="chips" style="margin-top:0">${tpls.map(t => `<button class="chip tpl" data-act="applyTpl" data-id="${t.id}" data-meal="${m}">${icon('bookmark', 16)}${esc(t.name)}</button>`).join('')}</div>` : ''}
    ${freq.length ? `<div class="section-t">נפוצים אצלך</div><div class="chips" style="margin-top:0">${freq.map(n => {
      const last = u[n] && u[n].last;
      const label = last ? P.formatItem({ name: n, qty: last.qty, unit: last.unit, with: last.with, note: last.note }) : n;
      return `<button class="chip" data-act="quickAdd" data-name="${esc(n)}">${icon('plus', 14)}${esc(label)}</button>`;
    }).join('')}</div>` : `<div class="small muted">המאכלים שתרשום יופיעו כאן כדי להוסיף אותם בלחיצה.</div>`}
  </div>
  <footer><button class="btn primary big block" data-act="closeSheet">סיום</button></footer>`;
}
function addLiveHtml() {
  const t = ADD.text.trim();
  if (!t) return '';
  const parsed = P.parseItems(t, lex());
  const k = nk(t);
  const sugg = allFoodNames().filter(n => nk(n).includes(k) && nk(n) !== k).sort((a, b) => ((usage()[b] || {}).n || 0) - ((usage()[a] || {}).n || 0)).slice(0, 8);
  let h = '';
  if (parsed.length) h += `<div class="preview"><span class="small muted">יתווסף:</span><div class="chips">${parsed.map(it => `<span class="chip sel">${esc(P.formatItem(it))}</span>`).join('')}</div></div>`;
  if (sugg.length) h += `<div class="chips">${sugg.map(n => `<button class="chip" data-act="quickAdd" data-name="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
  return h;
}
function addItemsToMeal(iso, meal, items, quiet) {
  const day = getDay(iso, true);
  const added = items.map(newItem);
  day.meals[meal].push(...added);
  learnFoods(added);
  save();
  if (!quiet) toast('נוסף: ' + added.map(it => P.formatItem(it, { short: true })).join(', '));
  return added;
}

/* ----- edit item sheet ----- */
const EDIT = { meal: null, idx: -1, it: null };
function openEdit(meal, idx) {
  const day = getDay(S.date, false);
  if (!day || !day.meals[meal][idx]) return;
  EDIT.meal = meal; EDIT.idx = idx; EDIT.it = clone(day.meals[meal][idx]); EDIT.to = meal;
  openSheet('edit', editHtml(), { title: 'עריכת פריט' });
}
function editHtml() {
  const it = EDIT.it;
  const units = FD.UNIT_LIST.map(u => `<option value="${u}" ${it.unit === u ? 'selected' : ''}>${u}</option>`).join('');
  const seg = MEALS.map(x => `<button data-act="editTo" data-v="${x}" aria-pressed="${x === EDIT.to}">${MEAL[x].label}</button>`).join('');
  return sheetHead('עריכת פריט') + `<div class="body">
    <label class="field"><span>מאכל</span><input type="text" value="${esc(it.name)}" data-on="eName" list="foodNames" autocomplete="off"></label>
    <datalist id="foodNames">${allFoodNames().slice(0, 400).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <div class="row" style="gap:12px;align-items:flex-end">
      <div class="field"><span>כמות</span><div class="stepper"><button class="iconbtn plain" data-act="eQty" data-d="-1" aria-label="פחות">${icon('minus', 18)}</button><span class="val" id="eQtyVal">${it.qty == null ? '–' : esc(P.fmtQty(it.qty))}</span><button class="iconbtn plain" data-act="eQty" data-d="1" aria-label="יותר">${icon('plus', 18)}</button></div></div>
      <label class="field grow"><span>יחידה</span><select data-on="eUnit"><option value="">ללא</option>${units}</select></label>
    </div>
    <label class="field"><span>עם (מופרד בפסיקים)</span><input type="text" value="${esc((it.with || []).join(', '))}" data-on="eWith" placeholder="למשל: גזר, מלפפון"></label>
    <label class="field"><span>הערה</span><input type="text" value="${esc(it.note || '')}" data-on="eNote" placeholder="למשל: ללא סוכר"></label>
    <div class="field"><span>ארוחה</span><div class="seg">${seg}</div></div>
  </div>
  <footer>
    <button class="btn danger" data-act="eDelete">${icon('trash', 18)}מחק</button>
    <button class="btn" data-act="eDup">${icon('copy', 18)}שכפל</button>
    <button class="btn primary grow" data-act="eSave">שמירה</button>
  </footer>`;
}

/* ----- meal menu ----- */
function openMealMenu(meal) {
  const day = getDay(S.date, false);
  const has = day && day.meals[meal].length;
  const prev = getDay(addDays(S.date, -1), false);
  const prevHas = prev && prev.meals[meal].length;
  openSheet('menu', sheetHead(MEAL[meal].label) + `<div class="body"><div class="list">
    ${has ? `<button class="li" data-act="saveTpl" data-meal="${meal}">${icon('bookmark')}<span class="grow t">שמור כארוחה קבועה</span></button>` : ''}
    <button class="li" data-act="copyMealPrev" data-meal="${meal}" ${prevHas ? '' : 'disabled'}>${icon('copy')}<span class="grow"><span class="t">העתק מאתמול</span>${prevHas ? `<br><span class="s">${esc(prev.meals[meal].map(it => P.formatItem(it, { short: true })).join(', '))}</span>` : '<br><span class="s">אתמול לא נרשם</span>'}</span></button>
    <button class="li" data-act="mealNote" data-meal="${meal}">${icon('note')}<span class="grow t">${day && day.mealNotes[meal] ? 'עריכת הערה' : 'הוספת הערה (שעה, איפה, הרגשה)'}</span></button>
    ${has ? `<button class="li" data-act="shareMeal" data-meal="${meal}">${icon('share')}<span class="grow t">שתף את הארוחה</span></button>
    <button class="li" data-act="clearMeal" data-meal="${meal}">${icon('trash')}<span class="grow t" style="color:#B23A3A">נקה את הארוחה</span></button>` : ''}
  </div></div>`, { title: MEAL[meal].label });
}
function promptSheet(title, label, value, onOk, okLabel = 'שמירה', multiline = false) {
  openSheet('prompt', sheetHead(title) + `<div class="body"><label class="field"><span>${label}</span>${multiline ? `<textarea rows="3" data-on="promptVal">${esc(value)}</textarea>` : `<input type="text" value="${esc(value)}" data-on="promptVal">`}</label></div>
    <footer><button class="btn primary big block" data-act="promptOk">${okLabel}</button></footer>`, { title });
  PROMPT.fn = onOk;
  setTimeout(() => { const i = $('[data-on="promptVal"]'); if (i) { i.focus(); i.select && i.select(); } }, 300);
}
const PROMPT = { fn: null };
function confirmSheet(title, text, okLabel, onOk, danger = true) {
  openSheet('confirm', sheetHead(title) + `<div class="body"><p style="margin:0">${text}</p></div>
    <footer><button class="btn grow" data-act="closeSheet">ביטול</button><button class="btn ${danger ? 'danger' : 'primary'} grow" data-act="confirmOk">${okLabel}</button></footer>`, { title });
  CONFIRM.fn = onOk;
}
const CONFIRM = { fn: null };

/* ----- import sheet ----- */
const IMP = { mode: 'history', text: '', result: null, conflict: 'merge', merges: {}, showDays: 20 };
function openImport(mode, text) {
  IMP.mode = mode; IMP.text = text || ''; IMP.result = null; IMP.merges = {}; IMP.showDays = 20;
  IMP.conflict = mode === 'day' ? 'merge' : 'merge';
  openSheet('import', importHtml(), { full: true, title: 'ייבוא' });
  if (text) runParse();
}
function runParse() {
  const opts = { defaultYear: new Date().getFullYear() };
  if (IMP.mode === 'day') opts.defaultDate = S.date;
  const r = P.parseDiary(IMP.text, lex(), opts);
  // new names and suggested merges
  const L = lex();
  const known = new Set(Object.values(L.aliases));
  const newNames = new Set();
  r.days.forEach(d => MEALS.forEach(m => d.meals[m].forEach(it => [it.name].concat(it.with).forEach(n => { if (!known.has(n)) newNames.add(n); }))));
  const pool = Array.from(new Set(Array.from(known).concat(Array.from(newNames))));
  const sugg = [];
  newNames.forEach(n => {
    const nn = nk(n);
    if (nn.length < 3) return;
    let best = null;
    for (const o of pool) {
      if (o === n) continue;
      const on = nk(o);
      const stem = (s) => s.replace(/(ימ|ות|ה)$/, '');
      const close = stem(nn) === stem(on) || (nn.length >= 4 && lev(nn, on) === 1);
      if (close && (known.has(o) || (usage()[o] || {}).n || o < n)) { best = o; break; }
    }
    if (best) sugg.push([n, best]);
  });
  IMP.result = { days: r.days, warnings: r.warnings, newNames: Array.from(newNames), sugg };
  sugg.forEach(([a, b]) => { if (IMP.merges[a] == null) IMP.merges[a] = b; });
  replaceSheetBody('import', importHtml());
}
function importHtml() {
  const r = IMP.result;
  const isDay = IMP.mode === 'day';
  let h = sheetHead(isDay ? 'הדבקת טקסט ליום' : 'ייבוא היסטוריה') + `<div class="body">`;
  if (!r) {
    h += `<p class="small muted" style="margin:0">${isDay
      ? `הדבק את מה שכתבת על ${longDate(S.date)}. כותרות כמו "בוקר:" ו"ערב:" מחלקות לארוחות.`
      : 'הדבק את כל הרשומות שכתבת. כל יום מתחיל בשורת תאריך (למשל 23/10/2026), וכל ארוחה בכותרת כמו "בוקר:".'}</p>
      <textarea class="note" rows="10" data-on="impText" placeholder="23/10/2026 - יום שישי&#10;• בוקר: שלוש פרוסות לחם מלא, חביתה…&#10;• צהריים: …">${esc(IMP.text)}</textarea>
      <label class="btn" role="button">${icon('file', 18)}בחירת קובץ טקסט<input type="file" accept="text/plain" class="hidden" data-on="impFile"></label>`;
    h += `</div><footer><button class="btn primary big block" data-act="impParse">ניתוח הטקסט</button></footer>`;
    return h;
  }
  const items = r.days.reduce((s, d) => s + MEALS.reduce((a, m) => a + d.meals[m].length, 0), 0);
  const existing = r.days.filter(d => dayHasData(db.days[d.date])).length;
  h += `<div class="preview"><b>נמצאו ${r.days.length} ${r.days.length === 1 ? 'יום' : 'ימים'} ו-${items} פריטים</b>${r.newNames.length ? `<br><span class="small">${r.newNames.length} מאכלים חדשים יתווספו לרשימה</span>` : ''}</div>`;
  if (!r.days.length) h += `<div class="warn">לא נמצאו ימים. ודא שיש שורת תאריך כמו 23/10/2026${isDay ? ' או כותרת ארוחה כמו "בוקר:"' : ''}.</div>`;
  if (existing && !isDay) {
    h += `<div class="field"><span>${existing} מהימים כבר קיימים ביומן. מה לעשות איתם?</span><div class="seg">
      ${[['merge', 'להוסיף'], ['replace', 'להחליף'], ['skip', 'לדלג']].map(([v, l]) => `<button data-act="impConflict" data-v="${v}" aria-pressed="${IMP.conflict === v}">${l}</button>`).join('')}</div></div>`;
  }
  if (r.sugg.length) {
    h += `<div class="section-t">שמות דומים: לאחד?</div><div class="list">${r.sugg.map(([a, b]) => `<div class="li"><span class="grow"><span class="t">${esc(a)}</span> <span class="muted">←</span> <span class="t">${esc(b)}</span></span>${sw('impMerge" data-name="' + esc(a), IMP.merges[a] != null, 'לאחד ' + esc(a))}</div>`).join('')}</div>`;
  }
  if (r.warnings.length) {
    h += `<details><summary class="warn">${r.warnings.length} שורות שלא זוהו במלואן</summary><div class="small muted stack" style="margin-top:8px">${r.warnings.slice(0, 30).map(w => `<span>${w.date ? esc(P.displayDate(w.date)) + ': ' : ''}${esc(w.line)} · ${esc(w.msg)}</span>`).join('')}</div></details>`;
  }
  h += `<div class="section-t">תצוגה מקדימה</div>`;
  r.days.slice(0, IMP.showDays).forEach(d => {
    h += `<div class="importday">${esc(P.dayToText(d.date, applyMerges(d)))}${d.note ? '' : ''}</div>`;
  });
  if (r.days.length > IMP.showDays) h += `<button class="btn" data-act="impMore">הצג עוד ${Math.min(20, r.days.length - IMP.showDays)} ימים</button>`;
  h += `</div><footer><button class="btn" data-act="impBack">עריכה</button><button class="btn primary big grow" data-act="impGo" ${r.days.length ? '' : 'disabled'}>${icon('check', 20)}ייבוא</button></footer>`;
  return h;
}
function applyMerges(d) {
  const out = clone(d);
  const map = IMP.merges;
  MEALS.forEach(m => out.meals[m].forEach(it => {
    if (map[it.name]) it.name = map[it.name];
    it.with = (it.with || []).map(w => map[w] || w);
  }));
  return out;
}
function doImport() {
  const r = IMP.result;
  if (!r) return;
  Object.keys(IMP.merges).forEach(a => { if (IMP.merges[a]) db.aliases[nk(a)] = IMP.merges[a]; });
  let nDays = 0, nItems = 0;
  for (const raw of r.days) {
    const d = applyMerges(raw);
    const exists = dayHasData(db.days[d.date]);
    if (exists && IMP.conflict === 'skip' && IMP.mode !== 'day') continue;
    const day = getDay(d.date, true);
    if (exists && IMP.conflict === 'replace' && IMP.mode !== 'day') {
      MEALS.forEach(m => { day.meals[m] = []; });
    }
    MEALS.forEach(m => {
      const have = new Set(day.meals[m].map(it => P.formatItem(it)));
      d.meals[m].forEach(it => {
        if (have.has(P.formatItem(it))) return;
        const ni = newItem(it); day.meals[m].push(ni); learnFoods([ni]); nItems++;
      });
    });
    if (d.note) day.note = day.note ? day.note + '\n' + d.note : d.note;
    nDays++;
  }
  save();
  closeSheet();
  if (IMP.mode === 'history' && r.days.length) {
    const last = r.days.map(d => d.date).sort().pop();
    S.histMonth = last.slice(0, 7);
  }
  render({ keepScroll: true });
  toast(`יובאו ${nDays} ${nDays === 1 ? 'יום' : 'ימים'} ו-${nItems} פריטים`);
}

/* ----- foods manager ----- */
const FOODS = { q: '' };
function openFoods() { FOODS.q = ''; openSheet('foods', foodsHtml(), { full: true, title: 'המאכלים שלי' }); }
function foodsHtml() {
  const u = usage();
  const q = nk(FOODS.q);
  const names = Object.keys(u).filter(n => !q || nk(n).includes(q)).sort((a, b) => u[b].n - u[a].n);
  const catOpts = (sel) => Object.keys(FD.CATEGORIES).map(c => `<option value="${c}" ${sel === c ? 'selected' : ''}>${FD.CATEGORIES[c].label}</option>`).join('');
  return sheetHead('המאכלים שלי') + `<div class="body">
    <div class="searchbox">${icon('search', 18)}<input class="search" type="search" data-on="foodsQ" value="${esc(FOODS.q)}" placeholder="חיפוש" aria-label="חיפוש מאכל"></div>
    <p class="small muted" style="margin:0">לחיצה על שם מאפשרת לשנות אותו או לאחד אותו עם מאכל אחר. כל ההיסטוריה מתעדכנת.</p>
    <div class="list" id="foodsList">${names.length ? names.map(n => `<div class="li">
      <button class="grow" style="border:none;background:none;text-align:right;padding:0;min-height:44px" data-act="renameFood" data-name="${esc(n)}"><span class="t">${esc(n)}</span><br><span class="s">${u[n].n} ${u[n].n === 1 ? 'פעם' : 'פעמים'}</span></button>
      <select data-on="foodCat" data-name="${esc(n)}" aria-label="קטגוריה של ${esc(n)}" style="max-width:150px;border:1px solid var(--line);border-radius:12px;padding:8px;background:transparent;min-height:44px">${catOpts(catOf(n))}</select>
    </div>`).join('') : '<div class="muted small" style="padding:12px 0">אין מאכלים עדיין.</div>'}</div>
  </div>`;
}
function renameFood(from, to) {
  to = to.trim();
  if (!to || to === from) return;
  for (const iso in db.days) {
    const d = db.days[iso];
    MEALS.forEach(m => (d.meals[m] || []).forEach(it => {
      if (it.name === from) it.name = to;
      it.with = (it.with || []).map(w => w === from ? to : w);
    }));
  }
  db.templates.forEach(t => t.items.forEach(it => { if (it.name === from) it.name = to; }));
  if (db.foods[from]) { if (!db.foods[to]) db.foods[to] = db.foods[from]; delete db.foods[from]; }
  if (!BASE.dict[to] && !db.foods[to]) db.foods[to] = { cat: catOf(from) };
  db.aliases[nk(from)] = to;
  for (const k in db.aliases) if (db.aliases[k] === from) db.aliases[k] = to;
  save();
}

/* ----- templates ----- */
function openTemplates() { openSheet('tpls', tplsHtml(), { title: 'ארוחות שמורות' }); }
function tplsHtml() {
  return sheetHead('ארוחות שמורות') + `<div class="body">${db.templates.length ? `<div class="list">${db.templates.map(t => `<div class="li">
    <span class="meal-icon" style="background:${MEAL[t.meal].grad};--glow:${MEAL[t.meal].tint}">${icon(MEAL[t.meal].icon, 20)}</span>
    <span class="grow"><span class="t">${esc(t.name)}</span><br><span class="s">${esc(t.items.map(it => P.formatItem(it, { short: true })).join(', '))}</span></span>
    <button class="iconbtn plain" data-act="renameTpl" data-id="${t.id}" aria-label="שינוי שם">${icon('edit', 18)}</button>
    <button class="iconbtn plain" data-act="delTpl" data-id="${t.id}" aria-label="מחיקה">${icon('trash', 18)}</button></div>`).join('')}</div>`
    : `<div class="empty-state">${icon('bookmark', 36)}<div>אין ארוחות שמורות.</div><div class="small">במסך היום, בכפתור ⋯ של ארוחה, בוחרים "שמור כארוחה קבועה".</div></div>`}</div>`;
}

/* ---------------- actions ---------------- */
function setDate(iso) { S.date = iso; S.tab = 'today'; render({ anim: true }); }
function exportFile(name, content, kind) {
  if (A && A.saveFile) { A.saveFile(name, content, kind); return; }
  const blob = new Blob([content], { type: kind === 'json' ? 'application/json' : kind === 'csv' ? 'text/csv' : 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function shareText(text) {
  if (A && A.shareText) { A.shareText(text); return; }
  if (navigator.share) { navigator.share({ text }).catch(() => { }); return; }
  navigator.clipboard && navigator.clipboard.writeText(text).then(() => toast('הועתק'));
}
function csvOf(dates) {
  const rows = [['תאריך', 'יום', 'ארוחה', 'מאכל', 'כמות', 'יחידה', 'עם', 'הערה', 'קטגוריה']];
  dates.forEach(iso => {
    const d = db.days[iso]; if (!d) return;
    MEALS.forEach(m => d.meals[m].forEach(it => rows.push([P.displayDate(iso), P.weekdayName(iso), MEAL[m].label, it.name, it.qty == null ? '' : it.qty, it.unit || '', (it.with || []).join(' + '), it.note || '', FD.CATEGORIES[catOf(it.name)].label])));
    if (d.water) rows.push([P.displayDate(iso), P.weekdayName(iso), 'מים', 'מים', d.water, 'כוסות', '', '', 'שתייה']);
  });
  return '﻿' + rows.map(r => r.map(c => { const s = String(c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
}
function allDatesSorted() { return Object.keys(db.days).filter(k => dayHasData(db.days[k])).sort(); }
function snapshotDay(iso) { const d = db.days[iso]; return d ? clone(d) : null; }
function restoreDay(iso, snap) { if (snap) db.days[iso] = snap; else delete db.days[iso]; save(); render({ keepScroll: true }); refreshAdd(); }
function refreshAdd() { if (sheetStack.find(s => s.id === 'add')) replaceSheetBody('add', addSheetHtml()); }

const ACT = {
  tab(el) { S.tab = el.dataset.id; if (S.tab === 'today' && !sheetStack.length) { /* keep date */ } render({ anim: true }); $('#screen').scrollTop = 0; },
  prevDay() { setDate(addDays(S.date, -1)); },
  nextDay() { setDate(addDays(S.date, 1)); },
  goToday() { setDate(todayISO()); },
  pickDate() {
    const dp = $('#datePicker');
    dp.value = S.date;
    try { dp.showPicker(); } catch (e) { dp.focus(); dp.click(); }
  },
  openAdd(el) { openAdd(el.dataset.meal); },
  addMeal(el) { ADD.meal = el.dataset.v; replaceSheetBody('add', addSheetHtml()); },
  addTyped() {
    const t = ADD.text.trim();
    if (!t) return;
    const items = P.parseItems(t, lex());
    if (!items.length) return;
    addItemsToMeal(S.date, ADD.meal, items);
    ADD.text = '';
    replaceSheetBody('add', addSheetHtml());
    const i = $('[data-on="addText"]'); i && i.focus();
  },
  quickAdd(el) {
    const n = el.dataset.name;
    const last = (usage()[n] || {}).last;
    addItemsToMeal(S.date, ADD.meal, [{ name: n, qty: last ? last.qty : null, unit: last ? last.unit : null, with: last ? last.with : [], note: last ? last.note : '' }]);
    ADD.text = '';
    replaceSheetBody('add', addSheetHtml());
  },
  qty(el) {
    const day = getDay(S.date, true);
    const it = day.meals[ADD.meal][+el.dataset.idx];
    if (!it) return;
    const d = +el.dataset.d;
    let q = it.qty == null ? 1 : it.qty;
    if (d > 0) q = q < 1 ? q + 0.5 : q + 1;
    else q = q <= 1 ? q - 0.5 : q - 1;
    if (q <= 0) {
      const snap = snapshotDay(S.date);
      day.meals[ADD.meal].splice(+el.dataset.idx, 1);
      save(); toast('הפריט הוסר', { label: 'ביטול', fn: () => restoreDay(S.date, snap) });
    } else { it.qty = q; save(); }
    replaceSheetBody('add', addSheetHtml());
  },
  applyTpl(el) {
    const t = db.templates.find(x => x.id === el.dataset.id);
    if (!t) return;
    const meal = el.dataset.meal || t.meal;
    addItemsToMeal(S.date, meal, clone(t.items), true);
    toast(`נוספה "${t.name}"`);
    render({ keepScroll: true }); refreshAdd();
  },
  editItem(el) { openEdit(el.dataset.meal, +el.dataset.idx); },
  eQty(el) {
    const d = +el.dataset.d;
    let q = EDIT.it.qty;
    if (q == null) q = d > 0 ? 1 : null;
    else if (d > 0) q = q < 1 ? q + 0.5 : q + 1;
    else q = q <= 0.5 ? null : (q <= 1 ? q - 0.5 : q - 1);
    EDIT.it.qty = q;
    $('#eQtyVal').textContent = q == null ? '–' : P.fmtQty(q);
  },
  editTo(el) { EDIT.to = el.dataset.v; $$('[data-act="editTo"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === EDIT.to)); },
  eSave() {
    const day = getDay(S.date, true);
    const it = EDIT.it;
    it.name = canonical(it.name || '') || it.name;
    if (!it.name.trim()) { toast('צריך שם למאכל'); return; }
    day.meals[EDIT.meal].splice(EDIT.idx, 1);
    if (EDIT.to === EDIT.meal) day.meals[EDIT.meal].splice(EDIT.idx, 0, it);
    else day.meals[EDIT.to].push(it);
    learnFoods([it]);
    save(); closeSheet(); render({ keepScroll: true }); refreshAdd();
  },
  eDelete() {
    const snap = snapshotDay(S.date);
    const day = getDay(S.date, true);
    day.meals[EDIT.meal].splice(EDIT.idx, 1);
    cleanupDay(S.date);
    save(); closeSheet(); render({ keepScroll: true }); refreshAdd();
    toast('הפריט נמחק', { label: 'ביטול', fn: () => restoreDay(S.date, snap) });
  },
  eDup() {
    const day = getDay(S.date, true);
    const copy = newItem(EDIT.it);
    day.meals[EDIT.to].push(copy);
    save(); closeSheet(); render({ keepScroll: true }); refreshAdd(); toast('שוכפל');
  },
  mealMenu(el) { openMealMenu(el.dataset.meal); },
  saveTpl(el) {
    const meal = el.dataset.meal;
    const day = getDay(S.date, false);
    closeSheet();
    const def = meal === 'breakfast' ? 'הבוקר הרגיל' : `${MEAL[meal].label} קבוע`;
    promptSheet('שמירת ארוחה קבועה', 'שם הארוחה', def, (name) => {
      db.templates.push({ id: uid(), name: name || def, meal, items: day.meals[meal].map(it => { const c = clone(it); delete c.id; return c; }) });
      save(); render({ keepScroll: true }); toast('נשמר. מופיע בהוספה מהירה');
    });
  },
  copyMealPrev(el) {
    const m = el.dataset.meal;
    const prev = getDay(addDays(S.date, -1), false);
    if (!prev || !prev.meals[m].length) return;
    closeSheet();
    const snap = snapshotDay(S.date);
    addItemsToMeal(S.date, m, clone(prev.meals[m]), true);
    render({ keepScroll: true });
    toast(`הועתק ${MEAL[m].label} מאתמול`, { label: 'ביטול', fn: () => restoreDay(S.date, snap) });
  },
  mealNote(el) {
    const m = el.dataset.meal;
    closeSheet();
    const day = getDay(S.date, false);
    promptSheet(`הערה ל${MEAL[m].label}`, 'הערה', (day && day.mealNotes[m]) || '', (v) => {
      const d = getDay(S.date, true);
      if (v) d.mealNotes[m] = v; else delete d.mealNotes[m];
      cleanupDay(S.date); save(); render({ keepScroll: true });
    });
  },
  shareMeal(el) {
    const m = el.dataset.meal; const d = getDay(S.date, false);
    closeSheet();
    shareText(`${MEAL[m].label} (${P.displayDate(S.date)}): ` + d.meals[m].map(it => P.formatItem(it)).join(', '));
  },
  clearMeal(el) {
    const m = el.dataset.meal;
    const snap = snapshotDay(S.date);
    const d = getDay(S.date, true); d.meals[m] = [];
    cleanupDay(S.date); save(); closeSheet(); render({ keepScroll: true });
    toast(`${MEAL[m].label} נוקה`, { label: 'ביטול', fn: () => restoreDay(S.date, snap) });
  },
  copyYesterday() {
    const prev = getDay(addDays(S.date, -1), false);
    if (!prev || !mealsCount(prev)) { toast('אתמול לא נרשם'); return; }
    const snap = snapshotDay(S.date);
    const day = getDay(S.date, true);
    let n = 0;
    MEALS.forEach(m => { if (!day.meals[m].length && prev.meals[m].length) { day.meals[m] = clone(prev.meals[m]).map(newItem); n++; } });
    if (!n) { toast('כל הארוחות כבר מלאות. אפשר להעתיק ארוחה אחת מתפריט ⋯'); return; }
    save(); render({ keepScroll: true, anim: false });
    toast(`הועתקו ${n} ארוחות מאתמול`, { label: 'ביטול', fn: () => restoreDay(S.date, snap) });
  },
  shareDay() {
    const d = getDay(S.date, false);
    if (!dayHasData(d)) { toast('אין עדיין מה לשתף'); return; }
    shareText(P.dayToText(S.date, d));
  },
  water(el) {
    const day = getDay(S.date, true);
    const n = +el.dataset.n;
    day.water = day.water === n ? n - 1 : n;
    cleanupDay(S.date); save(); render({ keepScroll: true });
  },
  openDay(el) { setDate(el.dataset.date); },
  histMonth(el) {
    const [y, m] = S.histMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + (+el.dataset.d), 1);
    S.histMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    render({ keepScroll: true });
  },
  histMore() { S.histLimit += 40; render({ keepScroll: true }); },
  statsRange(el) { S.statsRange = +el.dataset.v; render({ keepScroll: true }); },
  statsMeal(el) { S.statsMeal = el.dataset.v; render({ keepScroll: true }); },
  sharePeriod() { shareText(rangeDates().filter(i => dayHasData(db.days[i])).map(i => P.dayToText(i, db.days[i])).join('\n\n')); },
  exportCsv() { const ds = S.tab === 'stats' ? rangeDates().filter(i => db.days[i]) : allDatesSorted(); exportFile(`food-diary-${todayISO()}.csv`, csvOf(ds), 'csv'); },
  exportText() { exportFile(`food-diary-${todayISO()}.txt`, allDatesSorted().map(i => P.dayToText(i, db.days[i])).join('\n\n'), 'text'); },
  backup() { exportFile(`food-diary-backup-${todayISO()}.json`, JSON.stringify(db, null, 1), 'json'); },
  wipe() {
    confirmSheet('מחיקת כל הנתונים', 'כל הימים, המאכלים והארוחות השמורות יימחקו. כדאי לשמור גיבוי קודם.', 'מחק הכל', () => {
      const s = db.settings; db = freshDb(); db.settings = s; save(); render(); toast('הנתונים נמחקו');
    });
  },
  theme(el) { db.settings.theme = el.dataset.v; save(); applyTheme(); render({ keepScroll: true }); },
  accent(el) { db.settings.accent = el.dataset.v; save(); applyTheme(); render({ keepScroll: true }); },
  setBg(el) { db.settings.bg = el.dataset.id; db.settings.rotateBg = false; save(); applyTheme(); render({ keepScroll: true }); },
  delBg() {
    const id = (db.settings.bg || '').replace('custom:', '');
    confirmSheet('מחיקת תמונה', 'למחוק את תמונת הרקע הזאת?', 'מחק', async () => {
      await idbDel(id); delete bgCache[id]; await loadCustomBgs();
      db.settings.bg = 'sage'; save(); applyTheme(); render({ keepScroll: true });
    });
  },
  bgCat(el) { S.bgCat = el.dataset.v; render({ keepScroll: true }); },
  surpriseBg() {
    const pool = BUILTIN_BGS.filter(b => b.id !== 'plain' && b.id !== db.settings.bg).map(b => b.id).concat(customBgIds.map(i => 'custom:' + i));
    db.settings.bg = pool[Math.floor(Math.random() * pool.length)]; db.settings.rotateBg = false;
    const b = BUILTIN_BGS.find(x => x.id === db.settings.bg);
    save(); applyTheme(); render({ keepScroll: true }); toast(b ? `רקע: ${b.name}` : 'רקע: תמונה שלך');
  },
  motion() { db.settings.motion = db.settings.motion === false; save(); applyTheme(); render({ keepScroll: true }); },
  rotateBg() { db.settings.rotateBg = !db.settings.rotateBg; save(); applyTheme(); render({ keepScroll: true }); },
  showWater() { db.settings.showWater = !db.settings.showWater; save(); render({ keepScroll: true }); },
  waterGoal(el) { db.settings.waterGoal = Math.max(1, Math.min(20, db.settings.waterGoal + (+el.dataset.d))); save(); render({ keepScroll: true }); },
  reminder() {
    const r = db.settings.reminder;
    r.on = !r.on; save(); render({ keepScroll: true });
    if (A) {
      if (r.on && A.requestNotificationPermission) A.requestNotificationPermission();
      A.setReminder(r.on, r.h, r.m);
    }
    toast(r.on ? `תזכורת כל יום ב-${pad(r.h)}:${pad(r.m)}` : 'התזכורת כובתה');
  },
  openFoods() { openFoods(); },
  renameFood(el) {
    const from = el.dataset.name;
    promptSheet('שינוי שם או איחוד', `שם חדש ל"${from}" (שם של מאכל קיים יאחד ביניהם)`, from, (to) => {
      renameFood(from, to); replaceSheetBody('foods', foodsHtml()); render({ keepScroll: true }); toast('עודכן בכל ההיסטוריה');
    });
  },
  openTemplates() { openTemplates(); },
  renameTpl(el) {
    const t = db.templates.find(x => x.id === el.dataset.id);
    promptSheet('שינוי שם', 'שם הארוחה', t.name, (v) => { if (v) t.name = v; save(); replaceSheetBody('tpls', tplsHtml()); });
  },
  delTpl(el) {
    const i = db.templates.findIndex(x => x.id === el.dataset.id);
    const t = db.templates[i];
    db.templates.splice(i, 1); save(); replaceSheetBody('tpls', tplsHtml()); render({ keepScroll: true });
    toast('נמחקה', { label: 'ביטול', fn: () => { db.templates.splice(i, 0, t); save(); replaceSheetBody('tpls', tplsHtml()); render({ keepScroll: true }); } });
  },
  openImport(el) { openImport(el.dataset.mode || 'history'); },
  impParse() { if (!IMP.text.trim()) { toast('אין טקסט'); return; } runParse(); },
  impBack() { IMP.result = null; replaceSheetBody('import', importHtml()); },
  impConflict(el) { IMP.conflict = el.dataset.v; replaceSheetBody('import', importHtml()); },
  impMerge(el) {
    const a = el.dataset.name;
    const pair = IMP.result.sugg.find(p => p[0] === a);
    IMP.merges[a] = IMP.merges[a] != null ? null : pair[1];
    if (IMP.merges[a] == null) delete IMP.merges[a];
    replaceSheetBody('import', importHtml());
  },
  impMore() { IMP.showDays += 20; replaceSheetBody('import', importHtml()); },
  impGo() { doImport(); },
  closeSheet() { closeSheet(); },
  promptOk() {
    const v = ($('[data-on="promptVal"]') || {}).value || '';
    const fn = PROMPT.fn; closeSheet(); fn && fn(v.trim());
  },
  confirmOk() { const fn = CONFIRM.fn; closeSheet(); fn && fn(); },
};

/* input handlers */
const ON = {
  dayNote: debounce((el) => { const d = getDay(S.date, true); d.note = el.value; cleanupDay(S.date); save(); }, 400),
  addText(el) { ADD.text = el.value; const live = $('#addLive'); if (live) live.innerHTML = addLiveHtml(); },
  histSearch: debounce((el) => { S.histQuery = el.value; S.histLimit = 40; render({ keepScroll: true }); const i = $('[data-on="histSearch"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250),
  eName(el) { EDIT.it.name = el.value; },
  eUnit(el) { EDIT.it.unit = el.value || null; if (EDIT.it.unit && EDIT.it.qty == null) { EDIT.it.qty = 1; $('#eQtyVal').textContent = '1'; } },
  eWith(el) { EDIT.it.with = el.value.split(/[,،]/).map(s => s.trim()).filter(Boolean).map(canonical); },
  eNote(el) { EDIT.it.note = el.value.trim(); },
  dim(el) { db.settings.dim = +el.value; applyTheme(); saveLater(); },
  blur(el) { db.settings.blur = +el.value; applyTheme(); saveLater(); },
  cardAlpha(el) { db.settings.cardAlpha = +el.value; applyTheme(); saveLater(); },
  remTime(el) {
    const [h, m] = (el.value || '21:00').split(':').map(Number);
    db.settings.reminder.h = h; db.settings.reminder.m = m; save();
    if (A) A.setReminder(db.settings.reminder.on, h, m);
  },
  impText(el) { IMP.text = el.value; },
  foodsQ: debounce((el) => { FOODS.q = el.value; const s = sheetStack.find(x => x.id === 'foods'); if (s) { $('#foodsList', s.el).outerHTML = $('#foodsList', new DOMParser().parseFromString('<div>' + foodsHtml() + '</div>', 'text/html')).outerHTML; } }, 200),
  foodCat(el) {
    const n = el.dataset.name;
    db.foods[n] = Object.assign(db.foods[n] || {}, { cat: el.value });
    save(); toast(`"${n}" עבר ל${FD.CATEGORIES[el.value].label}`);
  },
  promptVal() { },
};
const saveLater = debounce(() => save(), 400);
const FILE_ON = {
  async addBg(el) {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      toast('טוען תמונה…');
      const { data, lum } = await readImageFile(f);
      const id = uid();
      const ok = await idbPut({ id, data, lum, created: Date.now() });
      if (!ok) { toast('לא הצלחתי לשמור את התמונה'); return; }
      bgCache[id] = data; await loadCustomBgs();
      db.settings.bg = 'custom:' + id; db.settings.rotateBg = false;
      if (!db.settings.dim) db.settings.dim = 0.15;
      save(); await applyTheme(); render({ keepScroll: true }); toast('הרקע עודכן');
    } catch (e) { toast('לא הצלחתי לקרוא את התמונה'); }
    el.value = '';
  },
  restore(el) {
    const f = el.files && el.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(fr.result);
        if (!d || typeof d.days !== 'object') throw new Error('bad');
        confirmSheet('שחזור מגיבוי', `בגיבוי יש ${Object.keys(d.days).length} ימים. הנתונים הנוכחיים יוחלפו.`, 'שחזר', () => {
          const f2 = freshDb();
          db = Object.assign(f2, d); db.settings = Object.assign(f2.settings, d.settings || {});
          save(); applyTheme(); render(); toast('השחזור הושלם');
        }, false);
      } catch (e) { toast('הקובץ לא נראה כמו גיבוי של יומן אוכל'); }
    };
    fr.readAsText(f);
    el.value = '';
  },
  impFile(el) {
    const f = el.files && el.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => { IMP.text = String(fr.result || ''); runParse(); };
    fr.readAsText(f, 'utf-8');
    el.value = '';
  },
};

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-on]');
  if (!el || el.type === 'file') return;
  const fn = ON[el.dataset.on];
  if (fn) fn(el, e);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-on]');
  if (!el) return;
  if (el.type === 'file') { const fn = FILE_ON[el.dataset.on]; if (fn) fn(el); return; }
  if (el.tagName === 'SELECT' || el.type === 'time') { const fn = ON[el.dataset.on]; if (fn && el.dataset.on !== 'eUnit') fn(el, e); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.on === 'addText') { e.preventDefault(); ACT.addTyped(); }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.on === 'promptVal' && e.target.tagName === 'INPUT') { e.preventDefault(); ACT.promptOk(); }
});
$('#datePicker').addEventListener('change', (e) => { if (e.target.value) setDate(e.target.value); });
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (db.settings.theme === 'auto') applyTheme(); });

/* hooks called from Android */
window.appBack = () => {
  if (sheetStack.length) { closeSheet(); return true; }
  if (S.tab !== 'today') { S.tab = 'today'; render({ anim: true }); return true; }
  if (S.date !== todayISO()) { setDate(todayISO()); return true; }
  return false;
};
window.setInsets = (top, bottom) => {
  document.documentElement.style.setProperty('--sat', top + 'px');
  document.documentElement.style.setProperty('--sab', bottom + 'px');
};
window.onSharedText = (text) => { while (sheetStack.length) closeSheet(); setTimeout(() => openImport(/\d{1,2}[\/.]\d{1,2}/.test(text) ? 'history' : 'day', text), 250); };
window.onNotifPermission = (ok) => { if (!ok) toast('בלי הרשאת התראות התזכורת לא תופיע'); };
window.appPause = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); A && A.autoBackup && A.autoBackup(JSON.stringify(db)); } catch (e) { } };
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // new day while the app stayed open
    const t = todayISO();
    if (S.lastSeen && S.lastSeen !== t && S.date === S.lastSeen) { S.date = t; render(); applyTheme(); }
    S.lastSeen = t;
  }
});

/* ---------------- start ---------------- */
(async function start() {
  loadDb();
  S.lastSeen = todayISO();
  await loadCustomBgs();
  await applyTheme();
  render({ anim: true });
  reportToday();
  if (A && db.settings.reminder.on) { try { A.setReminder(true, db.settings.reminder.h, db.settings.reminder.m); } catch (e) { } }
})();
