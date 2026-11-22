'use strict';
/* יומן אוכל / Food Diary — main app */

const P = window.Parser;
const FD = window.Foods;
const A = window.Android || null;
const MEALS = P.MEALS;
let LANG = 'he';
function tr(he, en) { return LANG === 'en' ? en : he; }
const MEAL = {
  breakfast: { get label() { return tr('בוקר', 'Breakfast'); }, icon: 'sunrise', tint: '#E9862F', grad: 'linear-gradient(135deg,#FFC36B,#FF7A59)' },
  lunch: { get label() { return tr('צהריים', 'Lunch'); }, icon: 'sun', tint: '#D9A21B', grad: 'linear-gradient(135deg,#FFE07A,#F5A524)' },
  dinner: { get label() { return tr('ערב', 'Dinner'); }, icon: 'moon', tint: '#4F6FB0', grad: 'linear-gradient(135deg,#8E9BFF,#4E5BD0)' },
  snack: { get label() { return tr('ביניים', 'Snacks'); }, icon: 'cup', tint: '#2F8F6A', grad: 'linear-gradient(135deg,#5EE0B2,#22997A)' },
};
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function monthName(i) { return (LANG === 'en' ? MONTHS_EN : MONTHS_HE)[i]; }
function plural(n, heOne, heMany, enOne, enMany) { return LANG === 'en' ? (n === 1 ? enOne : enMany) : (n === 1 ? heOne : heMany); }
function chevPrev() { return LANG === 'en' ? 'chev-l' : 'chev-r'; }
function chevNext() { return LANG === 'en' ? 'chev-r' : 'chev-l'; }
function catLabel(c) { const x = FD.CATEGORIES[c] || FD.CATEGORIES.other; return LANG === 'en' ? x.en : x.label; }
function bgName(b) { return LANG === 'en' ? (b.en || b.name) : b.name; }
function setLang(l) {
  LANG = l === 'en' ? 'en' : 'he';
  P.setLang(LANG);
  window.Gym.setLang(LANG);
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'en' ? 'ltr' : 'rtl';
  document.title = tr('יומן אוכל', 'Food Diary');
  $('#datePicker').setAttribute('aria-label', tr('בחירת תאריך', 'Pick a date'));
  $('#tabs').setAttribute('aria-label', tr('ניווט ראשי', 'Main navigation'));
  try { A && A.setLang && A.setLang(LANG); } catch (e) { }
}
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
  chat: '<path class="d" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h-1A.5.5 0 0 1 4 15.5z"/><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h-1A.5.5 0 0 1 4 15.5z"/><path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01"/>',
  send: '<path class="d" d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
  stop: '<rect class="d" x="6" y="6" width="12" height="12" rx="2.5"/><rect x="6" y="6" width="12" height="12" rx="2.5"/>',
  brain: '<path class="d" d="M12 4.6c-1-1.4-3.4-1.7-4.7-.2-1.6-.1-2.9 1.3-2.7 2.9C3.1 8.2 2.8 10.4 4 11.6c-1 1.6-.3 3.6 1.4 4.3.3 1.8 2.2 2.9 3.9 2.3.8.9 1.8 1.3 2.7 1.3z"/><path d="M12 4.6c-1-1.4-3.4-1.7-4.7-.2-1.6-.1-2.9 1.3-2.7 2.9C3.1 8.2 2.8 10.4 4 11.6c-1 1.6-.3 3.6 1.4 4.3.3 1.8 2.2 2.9 3.9 2.3.8.9 1.8 1.3 2.7 1.3zM12 4.6c1-1.4 3.4-1.7 4.7-.2 1.6-.1 2.9 1.3 2.7 2.9 1.5.9 1.8 3.1.6 4.3 1 1.6.3 3.6-1.4 4.3-.3 1.8-2.2 2.9-3.9 2.3-.8.9-1.8 1.3-2.7 1.3zM12 4.6v14.9M8 8.6c1 .2 1.7.8 2 1.7M6.6 13.2c1.2 0 2.1.5 2.6 1.4M16 8.6c-1 .2-1.7.8-2 1.7M17.4 13.2c-1.2 0-2.1.5-2.6 1.4"/>',
  bottle: '<path class="d" d="M9 7h6v2c2 1 3 2.5 3 4.5V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6.5C6 11.5 7 10 9 9z"/><path d="M9 7h6v2c2 1 3 2.5 3 4.5V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6.5C6 11.5 7 10 9 9z"/><path d="M9.5 3h5v4h-5z"/><path d="M6 15h12"/>',
  star: '<path class="d" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/>',
  camera: '<path class="d" d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  globe: '<circle class="d" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  newpage: '<path class="d" d="M6 2.8h8.2L19 7.6V21.2H6z"/><path d="M6 2.8h8.2L19 7.6V21.2H6z"/><path d="M14 2.8v4.8h5M12.5 11v7M9 14.5h7"/>',
  scale: '<rect class="d" x="3.5" y="3.5" width="17" height="17" rx="4.5"/><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 10.5a4.6 4.6 0 0 1 8 0"/><path d="M12 10.8l1.6-2.6"/>',
  dumbbell: '<rect class="d" x="4.5" y="6.5" width="3.2" height="11" rx="1.3"/><rect class="d" x="16.3" y="6.5" width="3.2" height="11" rx="1.3"/><rect x="4.5" y="6.5" width="3.2" height="11" rx="1.3"/><rect x="16.3" y="6.5" width="3.2" height="11" rx="1.3"/><path d="M2.5 9.5v5M21.5 9.5v5M7.7 12h8.6"/>',
  timer: '<circle class="d" cx="12" cy="13.5" r="7.5"/><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M12 2.5v3.5M18.6 6.9l1.5-1.5"/>',
  trophy: '<path class="d" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5A2.5 2.5 0 0 0 7 10.5M17 6h2.5A2.5 2.5 0 0 1 17 10.5M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z"/>',
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
function longDate(iso) { const d = parseISO(iso); return tr(`${d.getDate()} ב${monthName(d.getMonth())} ${d.getFullYear()}`, `${monthName(d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`); }
function shortDate(iso) { const d = parseISO(iso); return tr(`${d.getDate()} ב${monthName(d.getMonth())}`, `${monthName(d.getMonth())} ${d.getDate()}`); }
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
    v: 1, days: {}, foods: {}, aliases: {}, templates: [], routines: [], nut: {}, weights: [],
    settings: {
      theme: 'auto', accent: '#2F7D4F', bg: 'sage', dim: 0, blur: 0, cardAlpha: 0.88, rotateBg: false, motion: true,
      showWater: true, water: WATER_DEFAULTS(), reminder: { on: false, h: 21, m: 0 },
      showGym: true, gym: { rest: 90 },
      lang: /^(he|iw)/i.test(navigator.language || 'he') ? 'he' : 'en',
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
      db = hydrateDb(JSON.parse(raw));
      if (!(JSON.parse(raw).settings || {}).lang) db.settings.lang = 'he';
    } catch (e) { db = freshDb(); }
  }
}
/** Turns saved or backed-up data into a full, current-format database. */
function hydrateDb(d) {
  const f = freshDb();
  const defaults = f.settings;
  const out = Object.assign(f, d);
  const ds = d.settings || {};
  out.settings = Object.assign({}, defaults, ds);
  out.settings.reminder = Object.assign({ on: false, h: 21, m: 0 }, ds.reminder || {});
  if (!ds.water) delete out.settings.water; // let the upgrade below build it from the old "glasses" goal
  delete out.exportedAt; delete out.app;
  out.days = out.days || {};
  out.foods = out.foods || {};
  out.aliases = out.aliases || {};
  out.templates = out.templates || [];
  out.routines = Array.isArray(out.routines) ? out.routines.filter(r => r && r.name && Array.isArray(r.ex)) : [];
  out.settings.gym = Object.assign({ rest: 90 }, ds.gym || {});
  out.nut = out.nut && typeof out.nut === 'object' ? out.nut : {};
  out.weights = Array.isArray(out.weights) ? out.weights.filter(x => x && x.date && x.kg > 0) : [];
  const prev = db;
  db = out;
  try { migrateWater(); } finally { db = prev; }
  return out;
}
const backupLater = debounce(() => { try { A && A.autoBackup && A.autoBackup(JSON.stringify(db)); } catch (e) { } }, 2500);
function save() {
  invalidate();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { toast(tr('האחסון מלא. כדאי לשמור גיבוי', 'Storage is full. Save a backup')); }
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
  syncWaterNative();
}

function getDay(iso, create) {
  let d = db.days[iso];
  if (!d && create) {
    d = db.days[iso] = { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, mealNotes: {}, drinks: [], note: '' };
  }
  if (d) {
    d.meals = d.meals || {};
    MEALS.forEach(m => { d.meals[m] = d.meals[m] || []; });
    d.mealNotes = d.mealNotes || {};
  }
  return d;
}
function dayHasData(d) { return d && (MEALS.some(m => d.meals[m] && d.meals[m].length) || (d.drinks && d.drinks.length) || d.note || !!dayGym(d)); }
/** A day as text, in the same format the user writes (water as litres). */
function dayText(iso, d) { d = d || db.days[iso] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, mealNotes: {}, drinks: [], note: '' }; return P.dayToText(iso, Object.assign({}, d, { waterMl: drinksMl(d), gymText: gymText(d), gymTitle: gymTitleOf(d), weightKg: weightOn(iso) })); }
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
function invalidate() { USAGE = null; LEX = null; if (typeof nutInvalidate === 'function') nutInvalidate(); }
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
  {
    const hex = (s.accent || '#2F7D4F').replace('#', '');
    const [R, G, B] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
    const mix = (t, k) => [R, G, B].map(c => Math.round(c + (t - c) * k));
    const rgb = (a) => `rgb(${a.join(',')})`;
    r.setProperty('--accent-light', rgb(mix(255, 0.3)));
    r.setProperty('--accent-text', rgb(dark ? mix(255, 0.45) : mix(0, 0.2)));
    for (const [name, a] of [['--accent-soft', .14], ['--a18', .18], ['--a38', .38], ['--a62', .62], ['--a22', .22], ['--a12', .12], ['--a08', .08]]) r.setProperty(name, `rgba(${R},${G},${B},${a})`);
  }
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
window.appSaved = (ok) => toast(ok ? tr('הקובץ נשמר', 'File saved') : tr('שמירה נכשלה', 'Saving failed'));

/* ---------------- render: shell ---------------- */
const TABS = [
  { id: 'today', get label() { return tr('היום', 'Today'); }, icon: 'book' },
  { id: 'history', get label() { return tr('היסטוריה', 'History'); }, icon: 'history' },
  { id: 'chat', get label() { return tr('צ׳אט', 'Chat'); }, icon: 'chat' },
  { id: 'stats', get label() { return tr('סיכום', 'Summary'); }, icon: 'chart' },
  { id: 'settings', get label() { return tr('הגדרות', 'Settings'); }, icon: 'gear' },
];
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(t => `<button class="tab" data-act="tab" data-id="${t.id}" ${S.tab === t.id ? 'aria-current="page"' : ''}><span class="pill">${icon(t.icon, 22)}</span>${t.label}</button>`).join('');
}
function render(opts = {}) {
  const sc = $('#screen');
  const keepScroll = opts.keepScroll ? sc.scrollTop : 0;
  const html = { today: viewToday, history: viewHistory, chat: viewChat, stats: viewStats, settings: viewSettings }[S.tab]();
  sc.innerHTML = html;
  renderTabs();
  if (opts.anim) { sc.classList.remove('swap'); void sc.offsetWidth; sc.classList.add('swap'); }
  sc.scrollTop = keepScroll;
  if (!opts.anim) $$('.card, .chip', sc).forEach(el => { el.style.animation = 'none'; });
  if (S.tab === 'today') animateBottle();
  sc.classList.toggle('chatmode', S.tab === 'chat');
  if (S.tab === 'chat' && !opts.keepScroll) sc.scrollTop = sc.scrollHeight;
}

/* ---------------- view: today ---------------- */
function itemChip(it, meal, idx) {
  const [q, name] = P.formatParts(it);
  const extra = [];
  if (it.with && it.with.length) extra.push(tr('עם ', 'with ') + P.joinVav(it.with));
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
  const wd = tr('יום ', '') + P.weekdayName(iso);
  let h = `<section class="topbar">
    <div class="daynav">
      <button class="iconbtn" data-act="prevDay" aria-label="${tr('היום הקודם', 'Previous day')}">${icon(chevPrev())}</button>
      <button class="datebtn" data-act="pickDate" aria-label="${tr('בחירת תאריך', 'Pick a date')}"><span class="wd">${isToday ? tr('היום · ', 'Today · ') : ''}${wd}</span><span class="dt">${longDate(iso)}</span></button>
      <button class="iconbtn" data-act="nextDay" aria-label="${tr('היום הבא', 'Next day')}">${icon(chevNext())}</button>
    </div>
    <div class="badges">
      ${st ? `<span class="badge hot">${icon('flame', 17)}${tr(`רצף ${st} ${st === 1 ? 'יום' : 'ימים'}`, `${st}-day streak`)}</span>` : ''}
      ${!isToday ? `<button class="badge" data-act="goToday">${icon('cal', 16)}${tr('חזרה להיום', 'Back to today')}</button>` : ''}
      <span class="badge">${icon('check', 16)}${tr(`${mealsCount(day)} מתוך 4 ארוחות`, `${mealsCount(day)} of 4 meals`)}</span>
    </div>
  </section>
  <div class="quick">
    <button class="btn" data-act="copyYesterday"><span class="qi" style="--q1:#7C9BFF;--q2:#5363D6">${icon('copy', 20)}</span>${tr('העתק מאתמול', 'Copy yesterday')}</button>
    <button class="btn" data-act="openImport" data-mode="day"><span class="qi" style="--q1:#FFB36B;--q2:#F06A4A">${icon('camera', 20)}</span>${tr('פתק או טקסט', 'Note or text')}</button>
    <button class="btn" data-act="shareDay"><span class="qi" style="--q1:#5EE0B2;--q2:#1E9C7A">${icon('share', 20)}</span>${tr('שתף את היום', 'Share day')}</button>
  </div>`;
  if (nutOn()) h += nutDayCardHtml(iso);

  for (const m of MEALS) {
    const items = day ? day.meals[m] : [];
    const note = day && day.mealNotes[m];
    const tpls = db.templates.filter(t => t.meal === m);
    h += `<section class="card" aria-label="${MEAL[m].label}">
      <div class="meal-head">
        <span class="meal-icon" style="background:${MEAL[m].grad};--glow:${MEAL[m].tint}">${icon(MEAL[m].icon, 24)}</span>
        <div class="meal-title"><h2>${MEAL[m].label}</h2>${items.length ? `<div class="sub">${items.length} ${plural(items.length, 'פריט', 'פריטים', 'item', 'items')}${nutOn() ? ` · ≈ ${kc(mealN(items).k)} ${tr('קק״ל', 'kcal')}` : ''}</div>` : ''}</div>
        <button class="iconbtn flat" data-act="mealMenu" data-meal="${m}" aria-label="${tr(`אפשרויות ל${MEAL[m].label}`, `${MEAL[m].label} options`)}">${icon('dots')}</button>
        <button class="iconbtn primary" data-act="openAdd" data-meal="${m}" aria-label="${tr(`הוספה ל${MEAL[m].label}`, `Add to ${MEAL[m].label}`)}">${icon('plus')}</button>
      </div>`;
    if (items.length) {
      h += `<div class="chips">${items.map((it, i) => itemChip(it, m, i)).join('')}</div>${mealNutHtml(items)}`;
    } else {
      h += `<div class="chips">${tpls.slice(0, 3).map(t => `<button class="chip tpl" data-act="applyTpl" data-id="${t.id}" data-meal="${m}">${icon('bookmark', 16)}${esc(t.name)}</button>`).join('')}<button class="chip ghost" data-act="openAdd" data-meal="${m}">${icon('plus', 16)}${tr('מה אכלת?', 'What did you eat?')}</button></div>`;
    }
    if (note) h += `<div class="meal-note">${icon('note', 16)}<span>${esc(note)}</span></div>`;
    h += `</section>`;
  }

  if (db.settings.showWater) h += waterCardHtml(iso);
  if (db.settings.showGym !== false || dayGym(day)) h += workoutCardHtml(iso);
  if (wtSet().show !== false) h += weightCardHtml();
  h += `<section class="card"><h3 class="row">${icon('note', 18)}${tr('הערות על היום', 'Notes for the day')}</h3>
    <textarea class="note" rows="2" data-on="dayNote" placeholder="${tr('איך הרגשת, אכלת בחוץ, משהו מיוחד…', 'How you felt, ate out, anything special…')}">${esc((day && day.note) || '')}</textarea></section>`;
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
  let cal = (LANG === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']).map(d => `<div class="h">${d}</div>`).join('');
  for (let i = 0; i < first.getDay(); i++) cal += '<div></div>';
  for (let d = 1; d <= daysIn; d++) {
    const iso = `${yy}-${pad(mm)}-${pad(d)}`;
    const n = mealsCount(db.days[iso]);
    const gy = !!dayGym(db.days[iso]);
    const cls = [n ? 'l' + n : '', iso === t ? 'today' : '', iso > t ? 'future' : '', gy ? 'gym' : ''].join(' ');
    cal += `<button class="${cls}" data-act="openDay" data-date="${iso}" aria-label="${tr(`${d} ב${monthName(mm - 1)}`, `${monthName(mm - 1)} ${d}`)}${n ? `, ${n} ${tr('ארוחות', 'meals')}` : ''}${gy ? `, ${tr('אימון', 'workout')}` : ''}">${d}</button>`;
  }
  const logged = Object.keys(db.days).filter(k => dayHasData(db.days[k])).sort().reverse();
  let list = logged;
  if (q) list = logged.filter(iso => dayText(iso).split('\n').slice(1).some(l => nk(l).includes(qk)));
  const total = list.length;
  list = list.slice(0, S.histLimit);
  const hl = (s) => {
    const e = esc(s);
    if (!q) return e;
    const i = s.indexOf(q);
    return i < 0 ? e : esc(s.slice(0, i)) + '<mark>' + esc(q) + '</mark>' + esc(s.slice(i + q.length));
  };
  let h = `<section class="topbar"><h1>${tr('היסטוריה', 'History')}</h1></section>
  <section class="card">
    <div class="row between" style="margin-bottom:8px">
      <button class="iconbtn plain" data-act="histMonth" data-d="-1" aria-label="${tr('החודש הקודם', 'Previous month')}">${icon(chevPrev())}</button>
      <h2>${monthName(mm - 1)} ${yy}</h2>
      <button class="iconbtn plain" data-act="histMonth" data-d="1" aria-label="${tr('החודש הבא', 'Next month')}">${icon(chevNext())}</button>
    </div>
    <div class="cal">${cal}</div>
    <div class="row small muted" style="margin-top:10px;justify-content:center;gap:12px"><span>${tr('כהה יותר = יותר ארוחות רשומות', 'Darker = more meals logged')}</span>${gymDates().length ? `<span class="row" style="gap:4px"><i class="gymdot"></i>${tr('אימון', 'Workout')}</span>` : ''}</div>
  </section>
  <div class="searchbox" style="margin-bottom:12px">${icon('search', 18)}<input class="search" type="search" data-on="histSearch" value="${esc(q)}" placeholder="${tr('חיפוש מאכל, למשל פיצה', 'Search a food, e.g. pizza')}" aria-label="${tr('חיפוש בהיסטוריה', 'Search history')}"></div>`;
  if (q) h += `<p class="small muted" style="margin:0 4px 10px">${total ? tr(`נמצא ב-${total} ימים`, `Found on ${total} ${total === 1 ? 'day' : 'days'}`) : tr('לא נמצאו ימים', 'No days found')}</p>`;
  if (!logged.length) {
    h += `<div class="card empty-state">${icon('history', 40)}<div>${tr('עוד אין ימים רשומים.', 'No days logged yet.')}</div><div class="small">${tr('אפשר לייבא את כל מה שכבר כתבת.', 'You can import everything you already wrote.')}</div><div style="margin-top:12px"><button class="btn primary" data-act="openImport" data-mode="history">${icon('upload')}${tr('ייבוא היסטוריה', 'Import history')}</button></div></div>`;
  }
  for (const iso of list) {
    const d = db.days[iso];
    const lines = MEALS.filter(m => d.meals[m].length).map(m => `<span><b>${MEAL[m].label}:</b> ${hl(d.meals[m].map(it => P.formatItem(it, { short: true })).join(', '))}</span>`);
    const wml = dayWaterMl(d);
    if (wml) lines.push(`<span><b>${tr('מים', 'Water')}:</b> ${fmtAmount(wml)}${wml >= W().goalMl ? ' ✓' : ''}</span>`);
    if (dayGym(d)) lines.push(`<span><b>${tr('אימון', 'Workout')}:</b> ${hl(gymHistoryLine(d))}</span>`);
    const wk = weightOn(iso);
    if (wk) lines.push(`<span><b>${tr('משקל', 'Weight')}:</b> ${fmtKg(wk)} ${tr('ק״ג', 'kg')}</span>`);
    if (nutOn() && hasFood(d)) { const t = dayN(d), pc = Nutri.macroPct(t); lines.push(`<span class="muted"><b>${tr('תזונה', 'Nutrition')}:</b> ≈ ${kc(t.k)} ${tr('קק״ל', 'kcal')}${pc ? ` · ${pc.c}/${pc.p}/${pc.f}%` : ''}</span>`); }
    h += `<button class="card dayitem" data-act="openDay" data-date="${iso}">
      <div class="row between"><span style="font-weight:700">${tr('יום ', '')}${P.weekdayName(iso)}, ${shortDate(iso)}</span><span class="small muted">${P.displayDate(iso)}</span></div>
      <div class="lines">${lines.join('')}</div></button>`;
  }
  if (total > list.length) h += `<button class="btn block" data-act="histMore">${tr('הצג עוד', 'Show more')}</button>`;
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
  let water = 0, waterDays = 0, waterHit = 0, mealsTotal = 0;
  for (const iso of logged) {
    const d = db.days[iso];
    const seenCats = new Set();
    const wml = dayWaterMl(d);
    if (wml) { water += wml; waterDays++; if (wml >= W().goalMl) waterHit++; }
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
  const rangeSeg = [[7, tr('7 ימים', '7 days')], [30, tr('30 ימים', '30 days')], [0, tr('הכל', 'All')]].map(([v, l]) => `<button data-act="statsRange" data-v="${v}" aria-pressed="${S.statsRange === v}">${l}</button>`).join('');
  const mealSeg = [['', tr('הכל', 'All')]].concat(MEALS.map(m => [m, MEAL[m].label])).map(([v, l]) => `<button data-act="statsMeal" data-v="${v}" aria-pressed="${meal === v}">${l}</button>`).join('');
  let h = `<section class="topbar"><h1>${tr('סיכום', 'Summary')}</h1></section>
  <div class="seg" style="margin-bottom:12px">${rangeSeg}</div>`;
  if (!logged.length) {
    return h + `<div class="card empty-state">${icon('chart', 40)}<div>${tr('אין עדיין נתונים בתקופה הזאת.', 'No data for this period yet.')}</div></div>`;
  }
  h += `<div class="tiles">
    <div class="card tile"><div class="big">${logged.length}<span class="small muted"> / ${dates.length}</span></div><div class="lbl">${tr('ימים רשומים', 'days logged')}</div></div>
    <div class="card tile"><div class="big" style="color:#B85C1E">${streak()}</div><div class="lbl">${tr('ימים ברצף', 'day streak')}</div></div>
    <div class="card tile"><div class="big">${(mealsTotal / logged.length).toFixed(1)}</div><div class="lbl">${tr('ארוחות ביום בממוצע', 'meals per day (avg)')}</div></div>
    <div class="card tile"><div class="big" style="color:#2C8FB5">${waterDays ? fmtL(water / waterDays) : '–'}<span class="small muted"> ${tr('ל׳', 'L')}</span></div><div class="lbl">${tr(`מים ביום · ${waterHit} ימים ביעד`, `water a day · ${waterHit} ${waterHit === 1 ? 'day' : 'days'} on goal`)}</div></div>
  </div>
  <section class="card"><h3>${tr('באילו ימים היה…', 'Days that included…')}</h3><div class="stack">`;
  const catOrder = Object.keys(FD.CATEGORIES).filter(c => catDays[c]).sort((a, b) => catDays[b] - catDays[a]);
  for (const c of catOrder) {
    const pct = Math.round(catDays[c] / logged.length * 100);
    h += `<div class="barrow"><div class="row between"><span>${catLabel(c)}</span><span class="muted small">${tr(`${catDays[c]} מתוך ${logged.length} ימים`, `${catDays[c]} of ${logged.length} ${logged.length === 1 ? 'day' : 'days'}`)}</span></div><div class="bar"><i style="width:${pct}%;background:${FD.CATEGORIES[c].color}"></i></div></div>`;
  }
  h += `</div></section>
  <section class="card"><h3>${tr('מה אכלת הכי הרבה', 'What you ate most')}</h3><div class="seg" style="margin-bottom:12px">${mealSeg}</div><div class="stack">`;
  if (!top.length) h += `<div class="muted small">${tr('אין פריטים בארוחה הזאת בתקופה.', 'Nothing logged for this meal in this period.')}</div>`;
  for (const n of top) {
    h += `<div class="barrow"><div class="row between"><span>${esc(n)}</span><span class="muted small">${counts[n]} ${plural(counts[n], 'פעם', 'פעמים', 'time', 'times')}</span></div><div class="bar"><i style="width:${Math.round(counts[n] / maxC * 100)}%"></i></div></div>`;
  }
  h += `</div></section>
  ${nutStatsHtml(dates)}
  ${weightStatsHtml()}
  ${gymStatsHtml(dates)}
  <div class="row" style="gap:8px">
    <button class="btn grow" data-act="sharePeriod">${icon('share', 18)}${tr('שתף כטקסט', 'Share as text')}</button>
    <button class="btn grow" data-act="exportCsv">${icon('download', 18)}${tr('שמור CSV', 'Save CSV')}</button>
  </div>`;
  return h;
}

/* ---------------- view: settings ---------------- */
function bgThumbs() {
  const s = db.settings;
  const cat = S.bgCat;
  let h = '';
  if (cat === 'all' || cat === 'mine') {
    h += `<label class="bgthumb add" role="button" aria-label="${tr('הוספת רקע מהגלריה', 'Add a background from gallery')}">${icon('image', 26)}<span>${tr('מהגלריה', 'From gallery')}</span><input type="file" accept="image/*" data-on="addBg" class="hidden"></label>`;
    customBgIds.forEach((id, i) => {
      const sel = s.bg === 'custom:' + id;
      h += `<button class="bgthumb" style="background-image:url('${bgCache[id]}')" data-act="setBg" data-id="custom:${id}" aria-pressed="${sel}" aria-label="${tr('תמונה', 'Photo')} ${i + 1}">${sel ? `<span class="ck">${icon('check', 16)}</span>` : ''}<span class="nm">${tr('תמונה', 'Photo')} ${i + 1}</span></button>`;
    });
  }
  for (const b of BUILTIN_BGS) {
    if (cat !== 'all' && b.cat !== cat) continue;
    const style = b.css ? `background:${b.css}` : 'background:var(--page)';
    const sel = s.bg === b.id;
    h += `<button class="bgthumb" style='${style.replace(/'/g, '&#39;')}' data-act="setBg" data-id="${b.id}" aria-pressed="${sel}" aria-label="${tr('רקע', 'Background')} ${bgName(b)}">${b.fx ? `<span class="fx" data-fx="${b.fx}">${window.Backgrounds.fxHtml(b.fx)}</span><span class="tag">${icon('sparkle', 12)}${tr('מונפש', 'Animated')}</span>` : ''}${sel ? `<span class="ck">${icon('check', 16)}</span>` : ''}<span class="nm">${bgName(b)}</span></button>`;
  }
  return h;
}
function sw(act, on, label) { return `<button class="switch" role="switch" aria-checked="${!!on}" data-act="${act}" aria-label="${label}"></button>`; }
function viewSettings() {
  const s = db.settings;
  const themeSeg = [['light', tr('בהיר', 'Light')], ['dark', tr('כהה', 'Dark')], ['auto', tr('אוטומטי', 'Auto')]].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${s.theme === v}">${l}</button>`).join('');
  const r = s.reminder;
  const foodsN = Object.keys(usage()).length;
  const isCustom = (s.bg || '').startsWith('custom:');
  const langSeg = [['he', 'עברית'], ['en', 'English']].map(([v, l]) => `<button data-act="lang" data-v="${v}" aria-pressed="${LANG === v}" lang="${v}">${l}</button>`).join('');
  return `<section class="topbar"><h1>${tr('הגדרות', 'Settings')}</h1></section>
  <section class="card stack">
    <h2 class="row">${icon('globe', 20)}${tr('שפה', 'Language')}</h2>
    <div class="seg">${langSeg}</div>
  </section>
  <section class="card stack">
    <h2 class="row">${icon('image', 20)}${tr('רקע', 'Background')}</h2>
    <div class="bgcats" role="group" aria-label="${tr('סוג רקע', 'Background type')}">${window.Backgrounds.CATS.map(([v, he, en]) => [v, tr(he, en)]).concat(customBgIds.length ? [['mine', tr('התמונות שלי', 'My photos')]] : []).map(([v, l]) => `<button data-act="bgCat" data-v="${v}" aria-pressed="${S.bgCat === v}">${l}</button>`).join('')}</div>
    <div class="bggrid">${bgThumbs()}</div>
    <button class="btn soft" data-act="surpriseBg">${icon('dice', 20)}${tr('הפתע אותי', 'Surprise me')}</button>
    ${isCustom ? `<button class="btn danger" data-act="delBg">${icon('trash', 18)}${tr('מחק את התמונה הנבחרת', 'Delete selected photo')}</button>` : ''}
    <label class="field"><span>${tr('הכהיית הרקע', 'Darken background')}</span><input type="range" min="0" max="0.7" step="0.05" value="${s.dim}" data-on="dim"></label>
    <label class="field"><span>${tr('טשטוש הרקע', 'Blur background')}</span><input type="range" min="0" max="20" step="1" value="${s.blur}" data-on="blur"></label>
    <label class="field"><span>${tr('שקיפות הכרטיסים', 'Card opacity')}</span><input type="range" min="0.5" max="1" step="0.02" value="${s.cardAlpha}" data-on="cardAlpha"></label>
    <div class="row between"><span>${tr('הנפשת רקעים', 'Animate backgrounds')}</span>${sw('motion', s.motion !== false, tr('הנפשת רקעים', 'Animate backgrounds'))}</div>
    <div class="row between"><span>${tr('רקע מתחלף כל יום', 'New background every day')}</span>${sw('rotateBg', s.rotateBg, tr('רקע מתחלף כל יום', 'New background every day'))}</div>
    <div class="small muted">${tr('כשיש תמונות שלך, מתחלפות רק הן. אחרת, הרקעים המובנים.', 'If you added photos, only they rotate. Otherwise the built-in backgrounds do.')}</div>
  </section>
  <section class="card stack">
    <h2 class="row">${icon('palette', 20)}${tr('מראה', 'Appearance')}</h2>
    <div class="seg">${themeSeg}</div>
    <div class="field"><span>${tr('צבע ראשי', 'Accent color')}</span><div class="swatches">${ACCENTS.map(c => `<button class="swatch" style="background:${c}" data-act="accent" data-v="${c}" aria-pressed="${s.accent === c}" aria-label="${tr('צבע', 'Color')} ${c}"></button>`).join('')}</div></div>
  </section>
  <section class="card stack">
    <h2 class="row">${icon('bell', 20)}${tr('תזכורת יומית', 'Daily reminder')}</h2>
    <div class="row between"><span>${tr('תזכיר לי אם לא רשמתי את כל הארוחות', "Remind me if I haven't logged all meals")}</span>${sw('reminder', r.on, tr('תזכורת יומית', 'Daily reminder'))}</div>
    <label class="field ${r.on ? '' : 'hidden'}"><span>${tr('שעה', 'Time')}</span><input type="time" value="${pad(r.h)}:${pad(r.m)}" data-on="remTime"></label>
    ${A ? '' : `<div class="small muted">${tr('תזכורות עובדות באפליקציה המותקנת בטלפון.', 'Reminders work in the app installed on your phone.')}</div>`}
  </section>
  ${aiSettingsHtml()}
  ${nutSettingsHtml()}
  ${weightSettingsHtml()}
  ${waterSettingsHtml()}
  ${gymSettingsHtml()}
  <section class="card">
    <h2 class="row" style="margin-bottom:4px">${icon('list', 20)}${tr('מאכלים וארוחות', 'Foods and meals')}</h2>
    <div class="list">
      <button class="li" data-act="openFoods"><span class="grow"><span class="t">${tr('המאכלים שלי', 'My foods')}</span><br><span class="s">${tr(`${foodsN} מאכלים · שינוי שם, איחוד וקטגוריה`, `${foodsN} foods · rename, merge, category`)}</span></span>${icon(chevNext(), 18)}</button>
      <button class="li" data-act="openTemplates"><span class="grow"><span class="t">${tr('ארוחות שמורות', 'Saved meals')}</span><br><span class="s">${db.templates.length ? db.templates.length + ' ' + tr('ארוחות', 'meals') : tr('עוד אין. שומרים מתוך תפריט הארוחה (⋯)', 'None yet. Save one from a meal’s menu (⋯)')}</span></span>${icon(chevNext(), 18)}</button>
    </div>
  </section>
  <section class="card">
    <h2 class="row" style="margin-bottom:4px">${icon('file', 20)}${tr('נתונים', 'Data')}</h2>
    <div class="list">
      <button class="li" data-act="openImport" data-mode="history"><span class="grow"><span class="t">${tr('ייבוא היסטוריה', 'Import history')}</span><br><span class="s">${tr('מדביקים את כל מה שכבר כתבת, או בוחרים קובץ טקסט', 'Paste everything you already wrote, or pick a text file')}</span></span>${icon('upload', 18)}</button>
      <button class="li" data-act="backup"><span class="grow"><span class="t">${tr('שמירת גיבוי', 'Save backup')}</span><br><span class="s">${tr('קובץ JSON עם כל הנתונים', 'A JSON file with all your data')}</span></span>${icon('download', 18)}</button>
      <label class="li" role="button"><span class="grow"><span class="t">${tr('שחזור מגיבוי', 'Restore from backup')}</span><br><span class="s">${tr('טעינת קובץ גיבוי (מחליף את הנתונים)', 'Load a backup file (replaces your data)')}</span></span>${icon('undo', 18)}<input type="file" class="hidden" data-on="restore"></label>
      <button class="li" data-act="exportText"><span class="grow"><span class="t">${tr('ייצוא הכל כטקסט', 'Export all as text')}</span><br><span class="s">${tr('באותו פורמט שאתה כותב', 'In the same format you write')}</span></span>${icon('file', 18)}</button>
      <button class="li" data-act="exportCsv"><span class="grow"><span class="t">${tr('ייצוא CSV', 'Export CSV')}</span><br><span class="s">${tr('לאקסל או לדיאטנית', 'For Excel or your dietitian')}</span></span>${icon('download', 18)}</button>
      <button class="li" data-act="wipe"><span class="grow"><span class="t" style="color:#B23A3A">${tr('מחיקת כל הנתונים', 'Delete all data')}</span></span>${icon('trash', 18)}</button>
    </div>
  </section>
  <p class="center small muted">${tr('יומן אוכל', 'Food Diary')} ${A && A.appVersion ? esc(A.appVersion()) : ''} · ${tr('עובד בלי אינטרנט · הנתונים נשמרים רק בטלפון', 'Works offline · your data stays on your phone')}</p>`;
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
  return `<header><h2>${title}</h2>${extra}<button class="iconbtn plain" data-act="closeSheet" aria-label="${tr('סגירה', 'Close')}">${icon('x', 20)}</button></header>`;
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
  openSheet('add', addSheetHtml(), { full: true, title: tr('הוספה', 'Add'), onClose: () => { flushAddText(); render({ keepScroll: true }); } });
  setTimeout(() => { const i = $('[data-on="addText"]'); i && i.focus(); }, 300);
}
// Whatever is still typed in the box when the sheet closes is added too, so nothing is lost.
function flushAddText() {
  const inp = $('#sheets [data-on="addText"]');
  const t = ((inp && inp.value) || ADD.text || '').trim();
  ADD.text = '';
  if (!t) return;
  const items = P.parseItems(t, lex());
  if (items.length) addItemsToMeal(S.date, ADD.meal, items);
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
  return sheetHead(tr(`הוספה ל${MEAL[m].label}`, `Add to ${MEAL[m].label}`)) + `<div class="body">
    <div class="seg">${seg}</div>
    <form class="row" data-form="add" autocomplete="off">
      <input class="search grow" type="text" data-on="addText" value="${esc(ADD.text)}" placeholder="${tr('למשל: 3 אגוזי מלך, קפה עם חלב', 'e.g. 3 walnuts, coffee with milk')}" aria-label="${tr('מה אכלת', 'What did you eat')}" enterkeyhint="send" autocomplete="off">
      <button type="submit" class="iconbtn primary" aria-label="${tr('הוספה', 'Add')}">${icon('plus')}</button>
    </form>
    <div id="addLive">${addLiveHtml()}</div>
    ${items.length ? `<div class="section-t">${tr(`ב${MEAL[m].label} עכשיו`, `In ${MEAL[m].label} now`)}</div>
    <div class="list">${items.map((it, i) => `<div class="li"><button class="grow" style="border:none;background:none;text-align:start;padding:0;min-height:44px" data-act="editItem" data-meal="${m}" data-idx="${i}"><span class="t">${esc(P.formatItem(it))}</span></button>
      <div class="stepper"><button class="iconbtn plain" data-act="qty" data-idx="${i}" data-d="-1" aria-label="${tr('פחות', 'Less')} ${esc(it.name)}">${icon('minus', 18)}</button><span class="val">${it.qty == null ? '–' : esc(P.fmtQty(it.qty))}</span><button class="iconbtn plain" data-act="qty" data-idx="${i}" data-d="1" aria-label="${tr('עוד', 'More')} ${esc(it.name)}">${icon('plus', 18)}</button></div></div>`).join('')}</div>` : ''}
    ${tpls.length ? `<div class="section-t">${tr('ארוחות שמורות', 'Saved meals')}</div><div class="chips" style="margin-top:0">${tpls.map(t => `<button class="chip tpl" data-act="applyTpl" data-id="${t.id}" data-meal="${m}">${icon('bookmark', 16)}${esc(t.name)}</button>`).join('')}</div>` : ''}
    ${freq.length ? `<div class="section-t">${tr('נפוצים אצלך', 'Your frequent foods')}</div><div class="chips" style="margin-top:0">${freq.map(n => {
      const last = u[n] && u[n].last;
      const label = last ? P.formatItem({ name: n, qty: last.qty, unit: last.unit, with: last.with, note: last.note }) : n;
      return `<button class="chip" data-act="quickAdd" data-name="${esc(n)}">${icon('plus', 14)}${esc(label)}</button>`;
    }).join('')}</div>` : `<div class="small muted">${tr('המאכלים שתרשום יופיעו כאן כדי להוסיף אותם בלחיצה.', 'Foods you log will show up here for one-tap adding.')}</div>`}
  </div>
  <footer><button class="btn primary big block" data-act="closeSheet">${tr('סיום', 'Done')}</button></footer>`;
}
function addLiveHtml() {
  const t = ADD.text.trim();
  if (!t) return '';
  const parsed = P.parseItems(t, lex());
  const k = nk(t);
  const sugg = allFoodNames().filter(n => nk(n).includes(k) && nk(n) !== k).sort((a, b) => ((usage()[b] || {}).n || 0) - ((usage()[a] || {}).n || 0)).slice(0, 8);
  let h = '';
  if (parsed.length) h += `<div class="preview"><span class="small muted">${tr('יתווסף בלחיצה על + או על "סיום":', 'Will be added when you tap + or "Done":')}</span><div class="chips">${parsed.map(it => `<span class="chip sel">${esc(P.formatItem(it))}</span>`).join('')}</div></div>`;
  if (sugg.length) h += `<div class="chips">${sugg.map(n => `<button class="chip" data-act="quickAdd" data-name="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
  return h;
}
function addItemsToMeal(iso, meal, items, quiet) {
  const day = getDay(iso, true);
  const added = items.map(newItem);
  day.meals[meal].push(...added);
  learnFoods(added);
  save();
  if (!quiet) toast(tr('נוסף: ', 'Added: ') + added.map(it => P.formatItem(it, { short: true })).join(', '));
  return added;
}

/* ----- edit item sheet ----- */
const EDIT = { meal: null, idx: -1, it: null };
function openEdit(meal, idx) {
  const day = getDay(S.date, false);
  if (!day || !day.meals[meal][idx]) return;
  EDIT.meal = meal; EDIT.idx = idx; EDIT.it = clone(day.meals[meal][idx]); EDIT.to = meal;
  openSheet('edit', editHtml(), { title: tr('עריכת פריט', 'Edit item') });
}
function editHtml() {
  const it = EDIT.it;
  const units = FD.UNIT_LIST.map(u => `<option value="${u}" ${it.unit === u ? 'selected' : ''}>${esc(P.unitName(u))}</option>`).join('');
  const seg = MEALS.map(x => `<button data-act="editTo" data-v="${x}" aria-pressed="${x === EDIT.to}">${MEAL[x].label}</button>`).join('');
  return sheetHead(tr('עריכת פריט', 'Edit item')) + `<div class="body">
    <label class="field"><span>${tr('מאכל', 'Food')}</span><input type="text" value="${esc(it.name)}" data-on="eName" list="foodNames" autocomplete="off"></label>
    <datalist id="foodNames">${allFoodNames().slice(0, 400).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <div class="row" style="gap:12px;align-items:flex-end">
      <div class="field"><span>${tr('כמות', 'Amount')}</span><div class="stepper"><button class="iconbtn plain" data-act="eQty" data-d="-1" aria-label="${tr('פחות', 'Less')}">${icon('minus', 18)}</button><span class="val" id="eQtyVal">${it.qty == null ? '–' : esc(P.fmtQty(it.qty))}</span><button class="iconbtn plain" data-act="eQty" data-d="1" aria-label="${tr('יותר', 'More')}">${icon('plus', 18)}</button><button class="btn" style="min-width:52px;padding:0 10px" data-act="eHalf" aria-label="${tr('הוסף חצי', 'Add a half')}"><span dir="ltr">+½</span></button></div></div>
      <label class="field grow"><span>${tr('יחידה', 'Unit')}</span><select data-on="eUnit"><option value="">${tr('ללא', 'None')}</option>${units}</select></label>
    </div>
    <label class="field"><span>${tr('עם (מופרד בפסיקים)', 'With (comma separated)')}</span><input type="text" value="${esc((it.with || []).join(', '))}" data-on="eWith" placeholder="${tr('למשל: גזר, מלפפון', 'e.g. carrot, cucumber')}"></label>
    <label class="field"><span>${tr('הערה', 'Note')}</span><input type="text" value="${esc(it.note || '')}" data-on="eNote" placeholder="${tr('למשל: ללא סוכר', 'e.g. no sugar')}"></label>
    <div class="field"><span>${tr('ארוחה', 'Meal')}</span><div class="seg">${seg}</div></div>
    ${nutOn() ? `<div id="eNut">${editNutHtml()}</div>` : ''}
  </div>
  <footer>
    <button class="btn danger" data-act="eDelete">${icon('trash', 18)}${tr('מחק', 'Delete')}</button>
    <button class="btn" data-act="eDup">${icon('copy', 18)}${tr('שכפל', 'Duplicate')}</button>
    <button class="btn primary grow" data-act="eSave">${tr('שמירה', 'Save')}</button>
  </footer>`;
}

function refreshEditNut() { const b = $('#eNut'); if (b) b.innerHTML = editNutHtml(); }
function editNutHtml() {
  const it = EDIT.it;
  if (!it || !it.name) return '';
  const x = itemN(it);
  const r = resolveFood(it.name);
  return `<div class="enut"><span class="grow">${x.unknown ? tr('אין ערכים תזונתיים למאכל הזה', 'No nutrition values for this food') : `≈ <b>${kc(x.k)}</b> ${tr('קק״ל', 'kcal')} · ${tr('חלבון', 'Protein')} ${gr(x.p)} · ${tr('פחמימות', 'Carbs')} ${gr(x.c)} · ${tr('שומן', 'Fat')} ${gr(x.f)} ${tr('ג׳', 'g')}${x.guess ? ` <span class="bal near">${tr('הערכה גסה', 'Rough guess')}</span>` : ''}`}</span>
    <button class="btn" data-act="openNutEdit" data-name="${esc(r ? r.name : it.name)}">${icon('edit', 16)}${tr('ערכים', 'Values')}</button></div>`;
}

/* ----- meal menu ----- */
function openMealMenu(meal) {
  const day = getDay(S.date, false);
  const has = day && day.meals[meal].length;
  const prev = getDay(addDays(S.date, -1), false);
  const prevHas = prev && prev.meals[meal].length;
  openSheet('menu', sheetHead(MEAL[meal].label) + `<div class="body"><div class="list">
    ${has ? `<button class="li" data-act="saveTpl" data-meal="${meal}">${icon('bookmark')}<span class="grow t">${tr('שמור כארוחה קבועה', 'Save as a regular meal')}</span></button>` : ''}
    <button class="li" data-act="copyMealPrev" data-meal="${meal}" ${prevHas ? '' : 'disabled'}>${icon('copy')}<span class="grow"><span class="t">${tr('העתק מאתמול', 'Copy from yesterday')}</span>${prevHas ? `<br><span class="s">${esc(prev.meals[meal].map(it => P.formatItem(it, { short: true })).join(', '))}</span>` : `<br><span class="s">${tr('אתמול לא נרשם', 'Nothing logged yesterday')}</span>`}</span></button>
    <button class="li" data-act="mealNote" data-meal="${meal}">${icon('note')}<span class="grow t">${day && day.mealNotes[meal] ? tr('עריכת הערה', 'Edit note') : tr('הוספת הערה (שעה, איפה, הרגשה)', 'Add a note (time, place, how you felt)')}</span></button>
    ${has ? `<button class="li" data-act="shareMeal" data-meal="${meal}">${icon('share')}<span class="grow t">${tr('שתף את הארוחה', 'Share meal')}</span></button>
    <button class="li" data-act="clearMeal" data-meal="${meal}">${icon('trash')}<span class="grow t" style="color:#B23A3A">${tr('נקה את הארוחה', 'Clear meal')}</span></button>` : ''}
  </div></div>`, { title: MEAL[meal].label });
}
function promptSheet(title, label, value, onOk, okLabel, multiline = false) {
  okLabel = okLabel || tr('שמירה', 'Save');
  openSheet('prompt', sheetHead(title) + `<div class="body"><label class="field"><span>${label}</span>${multiline ? `<textarea rows="3" data-on="promptVal">${esc(value)}</textarea>` : `<input type="text" value="${esc(value)}" data-on="promptVal">`}</label></div>
    <footer><button class="btn primary big block" data-act="promptOk">${okLabel}</button></footer>`, { title });
  PROMPT.fn = onOk;
  setTimeout(() => { const i = $('[data-on="promptVal"]'); if (i) { i.focus(); i.select && i.select(); } }, 300);
}
const PROMPT = { fn: null };
function confirmSheet(title, text, okLabel, onOk, danger = true) {
  openSheet('confirm', sheetHead(title) + `<div class="body"><p style="margin:0">${text}</p></div>
    <footer><button class="btn grow" data-act="closeSheet">${tr('ביטול', 'Cancel')}</button><button class="btn ${danger ? 'danger' : 'primary'} grow" data-act="confirmOk">${okLabel}</button></footer>`, { title });
  CONFIRM.fn = onOk;
}
const CONFIRM = { fn: null };

/* ----- import sheet ----- */
const IMP = { mode: 'history', text: '', result: null, conflict: 'merge', merges: {}, showDays: 20 };
function openImport(mode, text) {
  IMP.mode = mode; IMP.text = text || ''; IMP.result = null; IMP.merges = {}; IMP.showDays = 20;
  IMP.conflict = mode === 'day' ? 'merge' : 'merge';
  openSheet('import', importHtml(), { full: true, title: tr('ייבוא', 'Import') });
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
      const stem = (s) => s.replace(/(ימ|ות|ה|es|s)$/, '');
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
  let h = sheetHead(isDay ? tr('הדבקת טקסט ליום', 'Paste text for the day') : tr('ייבוא היסטוריה', 'Import history')) + `<div class="body">`;
  if (!r) {
    h += `<p class="small muted" style="margin:0">${isDay
      ? tr(`הדבק את מה שכתבת על ${longDate(S.date)}. כותרות כמו "בוקר:" ו"ערב:" מחלקות לארוחות.`, `Paste what you wrote for ${longDate(S.date)}. Headings like "Breakfast:" and "Dinner:" split it into meals.`)
      : tr('הדבק את כל הרשומות שכתבת. כל יום מתחיל בשורת תאריך (למשל 23/10/2026), וכל ארוחה בכותרת כמו "בוקר:".', 'Paste all your entries. Each day starts with a date line (e.g. 23/10/2026), and each meal with a heading like "Breakfast:".')}</p>
      ${scanBoxHtml()}
      <textarea class="note" rows="10" data-on="impText" placeholder="${tr('23/10/2026 - יום שישי&#10;• בוקר: שלוש פרוסות לחם מלא, חביתה…&#10;• צהריים: …', '23/10/2026 - Friday&#10;• Breakfast: 2 slices of whole wheat bread, omelette…&#10;• Lunch: …')}">${esc(IMP.text)}</textarea>
      <label class="btn" role="button">${icon('file', 18)}${tr('בחירת קובץ טקסט', 'Choose a text file')}<input type="file" accept="text/plain" class="hidden" data-on="impFile"></label>`;
    h += `</div><footer><button class="btn primary big block" data-act="impParse">${tr('ניתוח הטקסט', 'Read the text')}</button></footer>`;
    return h;
  }
  const items = r.days.reduce((s, d) => s + MEALS.reduce((a, m) => a + d.meals[m].length, 0), 0);
  const nGym = r.days.filter(d => d.gymRaw || d.gymTitle).length;
  const existing = r.days.filter(d => dayHasData(db.days[d.date])).length;
  h += `<div class="preview"><b>${tr(`נמצאו ${r.days.length} ${r.days.length === 1 ? 'יום' : 'ימים'} ו-${items} פריטים`, `Found ${r.days.length} ${r.days.length === 1 ? 'day' : 'days'} and ${items} items`)}</b>${nGym ? `<br><span class="small">${tr(`ו-${nGym} ${nGym === 1 ? 'אימון' : 'אימונים'}`, `and ${nGym} ${nGym === 1 ? 'workout' : 'workouts'}`)}</span>` : ''}${r.newNames.length ? `<br><span class="small">${tr(`${r.newNames.length} מאכלים חדשים יתווספו לרשימה`, `${r.newNames.length} new foods will be added to your list`)}</span>` : ''}</div>`;
  if (!r.days.length) h += `<div class="warn">${tr('לא נמצאו ימים. ודא שיש שורת תאריך כמו 23/10/2026', 'No days found. Make sure there is a date line like 23/10/2026')}${isDay ? tr(' או כותרת ארוחה כמו "בוקר:"', ' or a meal heading like "Breakfast:"') : ''}.</div>`;
  if (existing && !isDay) {
    h += `<div class="field"><span>${tr(`${existing} מהימים כבר קיימים ביומן. מה לעשות איתם?`, `${existing} of these days are already in your diary. What should happen to them?`)}</span><div class="seg">
      ${[['merge', tr('להוסיף', 'Add')], ['replace', tr('להחליף', 'Replace')], ['skip', tr('לדלג', 'Skip')]].map(([v, l]) => `<button data-act="impConflict" data-v="${v}" aria-pressed="${IMP.conflict === v}">${l}</button>`).join('')}</div></div>`;
  }
  if (r.sugg.length) {
    h += `<div class="section-t">${tr('שמות דומים: לאחד?', 'Similar names: merge?')}</div><div class="list">${r.sugg.map(([a, b]) => `<div class="li"><span class="grow"><span class="t">${esc(a)}</span> <span class="muted">${tr('←', '→')}</span> <span class="t">${esc(b)}</span></span>${sw('impMerge" data-name="' + esc(a), IMP.merges[a] != null, tr('לאחד ', 'Merge ') + esc(a))}</div>`).join('')}</div>`;
  }
  if (r.warnings.length) {
    h += `<details><summary class="warn">${tr(`${r.warnings.length} שורות שלא זוהו במלואן`, `${r.warnings.length} lines not fully recognized`)}</summary><div class="small muted stack" style="margin-top:8px">${r.warnings.slice(0, 30).map(w => `<span>${w.date ? esc(P.displayDate(w.date)) + ': ' : ''}${esc(w.line)} · ${esc(P.warnText(w.msg))}</span>`).join('')}</div></details>`;
  }
  h += `<div class="section-t">${tr('תצוגה מקדימה', 'Preview')}</div>`;
  r.days.slice(0, IMP.showDays).forEach(d => {
    const pd = applyMerges(d);
    const gr = d.gymRaw ? window.Gym.parseWorkout(d.gymRaw) : null;
    const gt = gr ? window.Gym.workoutText({ minutes: gr.minutes, note: gr.note, ex: gr.exercises }) : '';
    h += `<div class="importday">${esc(P.dayToText(d.date, Object.assign(pd, { waterMl: waterRawToMl(d.waterRaw), gymText: gt, gymTitle: d.gymTitle || '', weightKg: d.weightKg || null })))}</div>`;
  });
  if (r.days.length > IMP.showDays) h += `<button class="btn" data-act="impMore">${tr(`הצג עוד ${Math.min(20, r.days.length - IMP.showDays)} ימים`, `Show ${Math.min(20, r.days.length - IMP.showDays)} more days`)}</button>`;
  h += `</div><footer><button class="btn" data-act="impBack">${tr('עריכה', 'Edit')}</button><button class="btn primary big grow" data-act="impGo" ${r.days.length ? '' : 'disabled'}>${icon('check', 20)}${tr('ייבוא', 'Import')}</button></footer>`;
  return h;
}
function scanBoxHtml() {
  const app = !!(A && A.ocrCamera);
  return `<div class="scanbox">
    <div class="row" style="gap:10px"><span class="qi" style="--q1:#FFB36B;--q2:#F06A4A">${icon('camera', 20)}</span><b class="grow">${tr('מפתק שכתבת ביד', 'From a handwritten note')}</b></div>
    ${app ? `<div class="section-t" style="margin:0">${icon('sparkle', 16)} ${tr('Google Lens · הכי מדויק לכתב יד', 'Google Lens · best for handwriting')}</div>
    <div class="row" style="gap:8px">
      <button class="btn primary grow" data-act="lensCam">${icon('camera', 18)}${tr('צילום', 'Camera')}</button>
      <button class="btn primary grow" data-act="lensGal">${icon('image', 18)}${tr('מהגלריה', 'Gallery')}</button>
    </div>
    <div class="small muted">${tr('התמונה נפתחת ב-Lens. שם לוחצים "טקסט", "בחירת הכל" ו"העתקה", וחוזרים לכאן (כפתור "חזור"). הטקסט נכנס לבד; אם לא, לוחצים "הדבק מהלוח".', 'The photo opens in Lens. Tap "Text", "Select all" and "Copy", then come back here (Back button). The text is pasted for you; if not, tap "Paste from clipboard".')}</div>
    <div class="section-t" style="margin:6px 0 0">${tr('בלי אינטרנט · לאותיות דפוס ברורות', 'Offline · clear block letters only')}</div>
    <div class="row" style="gap:8px">
      <button class="btn grow" data-act="ocrCam">${icon('camera', 18)}${tr('צילום', 'Camera')}</button>
      <button class="btn grow" data-act="ocrGal">${icon('image', 18)}${tr('מהגלריה', 'Gallery')}</button>
    </div>` : ''}
    <button class="btn soft block" data-act="pasteClip">${icon('paste', 18)}${tr('הדבק מהלוח', 'Paste from clipboard')}</button>
  </div>
  <div class="small muted">${tr('בכל דרך, הטקסט מופיע כאן למטה. בדוק ותקן אותו לפני הניתוח, כדי שיישמר בדיוק מה שכתבת.', 'Either way, the text appears below. Check and fix it before reading it in, so exactly what you wrote is saved.')}</div>`;
}
function setImportText(text, append) {
  text = String(text || '').replace(/\r/g, '').trim();
  if (!text) return false;
  IMP.text = append && IMP.text.trim() ? IMP.text.trim() + '\n' + text : text;
  IMP.result = null;
  replaceSheetBody('import', importHtml());
  const ta = $('[data-on="impText"]');
  if (ta) { ta.focus(); ta.setSelectionRange(0, 0); ta.scrollTop = 0; }
  return true;
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
  let nDays = 0, nItems = 0, nGym = 0;
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
    const wml = waterRawToMl(d.waterRaw);
    if (wml && (!drinksMl(day) || IMP.conflict === 'replace')) day.drinks = [{ t: null, ml: Math.round(wml) }];
    if ((d.gymRaw || d.gymTitle) && importGym(day, d.gymRaw, d.gymTitle, exists && IMP.conflict === 'replace' && IMP.mode !== 'day')) nGym++;
    if (d.weightKg && (weightOn(d.date) == null || IMP.conflict === 'replace')) setWeight(d.date, d.weightKg);
    nDays++;
  }
  save();
  closeSheet();
  if (IMP.mode === 'history' && r.days.length) {
    const last = r.days.map(d => d.date).sort().pop();
    S.histMonth = last.slice(0, 7);
  }
  render({ keepScroll: true });
  toast(tr(`יובאו ${nDays} ${nDays === 1 ? 'יום' : 'ימים'} ו-${nItems} פריטים`, `Imported ${nDays} ${nDays === 1 ? 'day' : 'days'} and ${nItems} items`) + (nGym ? tr(`, ${nGym} אימונים`, `, ${nGym} workouts`) : ''));
}

/* ----- foods manager ----- */
const FOODS = { q: '' };
function openFoods() { FOODS.q = ''; openSheet('foods', foodsHtml(), { full: true, title: tr('המאכלים שלי', 'My foods') }); }
function foodsHtml() {
  const u = usage();
  const q = nk(FOODS.q);
  const names = Object.keys(u).filter(n => !q || nk(n).includes(q)).sort((a, b) => u[b].n - u[a].n);
  const catOpts = (sel) => Object.keys(FD.CATEGORIES).map(c => `<option value="${c}" ${sel === c ? 'selected' : ''}>${catLabel(c)}</option>`).join('');
  return sheetHead(tr('המאכלים שלי', 'My foods')) + `<div class="body">
    <div class="searchbox">${icon('search', 18)}<input class="search" type="search" data-on="foodsQ" value="${esc(FOODS.q)}" placeholder="${tr('חיפוש', 'Search')}" aria-label="${tr('חיפוש מאכל', 'Search food')}"></div>
    <p class="small muted" style="margin:0">${tr('לחיצה על שם מאפשרת לשנות אותו או לאחד אותו עם מאכל אחר. כל ההיסטוריה מתעדכנת.', 'Tap a name to rename it or merge it into another food. All your history updates.')}</p>
    <div class="list" id="foodsList">${names.length ? names.map(n => `<div class="li">
      <button class="grow" style="border:none;background:none;text-align:start;padding:0;min-height:44px" data-act="renameFood" data-name="${esc(n)}"><span class="t">${esc(n)}</span><br><span class="s">${u[n].n} ${plural(u[n].n, 'פעם', 'פעמים', 'time', 'times')}${nutOn() ? (() => { const r = resolveFood(n); const v = r && Nutri.nutFor(r.name, r.cat, db.nut || {}); return v ? ` · ≈ ${kc(v.k * v.serving / 100)} ${tr('קק״ל למנה', 'kcal a serving')}${v.src === 'user' ? ' ✎' : v.src === 'cat' ? ' ?' : ''}` : ` · ${tr('בלי ערכים', 'no values')}`; })() : ''}</span></button>
      ${nutOn() ? `<button class="iconbtn plain" data-act="openNutEdit" data-name="${esc(n)}" aria-label="${tr('ערכים תזונתיים של', 'Nutrition values of')} ${esc(n)}">${icon('flame', 18)}</button>` : ''}
      <select data-on="foodCat" data-name="${esc(n)}" aria-label="${tr('קטגוריה של', 'Category of')} ${esc(n)}" style="max-width:150px;border:1px solid var(--line);border-radius:12px;padding:8px;background:transparent;min-height:44px">${catOpts(catOf(n))}</select>
    </div>`).join('') : `<div class="muted small" style="padding:12px 0">${tr('אין מאכלים עדיין.', 'No foods yet.')}</div>`}</div>
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
  if (db.nut && db.nut[from]) { if (!db.nut[to]) db.nut[to] = db.nut[from]; delete db.nut[from]; }
  if (!BASE.dict[to] && !db.foods[to]) db.foods[to] = { cat: catOf(from) };
  db.aliases[nk(from)] = to;
  for (const k in db.aliases) if (db.aliases[k] === from) db.aliases[k] = to;
  save();
}

/* ----- templates ----- */
function openTemplates() { openSheet('tpls', tplsHtml(), { title: tr('ארוחות שמורות', 'Saved meals') }); }
function tplsHtml() {
  return sheetHead(tr('ארוחות שמורות', 'Saved meals')) + `<div class="body">${db.templates.length ? `<div class="list">${db.templates.map(t => `<div class="li">
    <span class="meal-icon" style="background:${MEAL[t.meal].grad};--glow:${MEAL[t.meal].tint}">${icon(MEAL[t.meal].icon, 20)}</span>
    <span class="grow"><span class="t">${esc(t.name)}</span><br><span class="s">${esc(t.items.map(it => P.formatItem(it, { short: true })).join(', '))}</span></span>
    <button class="iconbtn plain" data-act="renameTpl" data-id="${t.id}" aria-label="${tr('שינוי שם', 'Rename')}">${icon('edit', 18)}</button>
    <button class="iconbtn plain" data-act="delTpl" data-id="${t.id}" aria-label="${tr('מחיקה', 'Delete')}">${icon('trash', 18)}</button></div>`).join('')}</div>`
    : `<div class="empty-state">${icon('bookmark', 36)}<div>${tr('אין ארוחות שמורות.', 'No saved meals.')}</div><div class="small">${tr('במסך היום, בכפתור ⋯ של ארוחה, בוחרים "שמור כארוחה קבועה".', 'On the Today screen, open a meal’s ⋯ menu and choose "Save as a regular meal".')}</div></div>`}</div>`;
}

/* ----- restore from a backup file ----- */
const RESTORE = { data: null };
function openRestore(d) {
  RESTORE.data = d;
  pullPendingWater();
  const days = Object.keys(d.days || {}).sort();
  const t = todayISO();
  const bakDay = (d.days || {})[t];
  // water in the backup for today: drinks, or old-style glasses
  const bakWater = bakDay ? ((bakDay.drinks || []).reduce((a, x) => a + (+x.ml || 0), 0) || (typeof bakDay.water === 'number' ? bakDay.water * W().cupMl : 0)) : 0;
  const curWater = drinksMl(db.days[t]);
  const made = d.exportedAt ? new Date(d.exportedAt) : null;
  const madeTxt = made && !isNaN(made) ? `${P.displayDate(isoOf(made))} ${pad(made.getHours())}:${pad(made.getMinutes())}` : tr('לא ידוע', 'unknown');
  const last = days.length ? P.displayDate(days[days.length - 1]) : '–';
  openSheet('restore', sheetHead(tr('שחזור מגיבוי', 'Restore from backup')) + `<div class="body">
    <div class="preview stack" style="gap:6px">
      <div>${tr('הגיבוי נוצר ב-', 'Backup made on ')}<b>${madeTxt}</b></div>
      <div>${tr(`${days.length} ימים, האחרון ${last}`, `${days.length} days, latest ${last}`)}</div>
      <div>${tr('מים היום: בגיבוי', 'Water today: in the backup')} <b>${fmtAmount(bakWater)}</b> · ${tr('עכשיו באפליקציה', 'in the app now')} <b>${fmtAmount(curWater)}</b></div>
    </div>
    <p class="small muted" style="margin:0">${tr('"מיזוג" שומר את מה שיש עכשיו ומוסיף מהגיבוי כל מה שחסר: ימים, מאכלים ושתייה. "החלפה" מוחקת את מה שיש ושמה במקומו את הגיבוי.', '"Merge" keeps what is in the app now and adds anything missing from the backup: days, foods and drinks. "Replace" deletes what is here and puts the backup in its place.')}</p>
  </div>
  <footer><button class="btn danger" data-act="restoreReplace">${tr('החלפה', 'Replace')}</button><button class="btn primary big grow" data-act="restoreMerge">${icon('merge', 20)}${tr('מיזוג', 'Merge')}</button></footer>`, { title: tr('שחזור מגיבוי', 'Restore from backup') });
}
function mergeInto(cur, bak) {
  for (const iso in bak.days) {
    const b = bak.days[iso];
    if (!cur.days[iso] || !dayHasData(cur.days[iso])) { cur.days[iso] = clone(b); continue; }
    const c = getDay(iso, true);
    MEALS.forEach(m => {
      const have = new Set(c.meals[m].map(it => P.formatItem(it)));
      ((b.meals || {})[m] || []).forEach(it => { if (!have.has(P.formatItem(it))) c.meals[m].push(newItem(it)); });
    });
    const keys = new Set((c.drinks || []).map(x => `${x.t}|${x.ml}`));
    const bd = (b.drinks || []).slice();
    if (!bd.length && typeof b.water === 'number' && b.water > 0 && !(c.drinks || []).length) bd.push({ t: null, ml: b.water * W().cupMl });
    bd.forEach(x => { if (!keys.has(`${x.t}|${x.ml}`)) { c.drinks.push({ t: x.t || null, ml: +x.ml }); keys.add(`${x.t}|${x.ml}`); } });
    if (b.note && b.note !== c.note) c.note = c.note ? (c.note.includes(b.note) ? c.note : c.note + '\n' + b.note) : b.note;
    Object.keys(b.mealNotes || {}).forEach(m => { if (!c.mealNotes[m]) c.mealNotes[m] = b.mealNotes[m]; });
    mergeGym(c, b);
  }
  cur.nut = cur.nut || {};
  Object.keys(bak.nut || {}).forEach(k => { if (!cur.nut[k]) cur.nut[k] = bak.nut[k]; });
  cur.weights = cur.weights || [];
  (bak.weights || []).forEach(x => { if (x && x.date && !cur.weights.some(y => y.date === x.date)) cur.weights.push(x); });
  const rids = new Set((cur.routines = cur.routines || []).map(r => r.name));
  (bak.routines || []).forEach(r => { if (!rids.has(r.name)) cur.routines.push(r); });
  cur.foods = Object.assign({}, bak.foods || {}, cur.foods);
  cur.aliases = Object.assign({}, bak.aliases || {}, cur.aliases);
  const ids = new Set(cur.templates.map(t => t.id));
  (bak.templates || []).forEach(t => { if (!ids.has(t.id)) cur.templates.push(t); });
}
function finishRestore(mode) {
  const bak = hydrateDb(RESTORE.data);
  const keepAi = db.settings.ai ? Object.assign({}, db.settings.ai) : null;
  if (mode === 'replace') db = bak;
  else mergeInto(db, bak);
  if (keepAi && keepAi.key && !(db.settings.ai && db.settings.ai.key)) db.settings.ai = Object.assign({}, db.settings.ai || {}, { key: keepAi.key, model: keepAi.model, fallback: keepAi.fallback });
  RESTORE.data = null;
  closeSheet();
  setLang(db.settings.lang); save(); applyTheme();
  S.tab = 'today'; S.date = todayISO(); render({ anim: true });
  const wml = dayWaterMl(db.days[todayISO()]);
  toast(tr(`השחזור הושלם: ${Object.keys(db.days).length} ימים${wml ? `, היום ${fmtAmount(wml)} מים` : ''}`, `Restore complete: ${Object.keys(db.days).length} days${wml ? `, ${fmtAmount(wml)} of water today` : ''}`));
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
  navigator.clipboard && navigator.clipboard.writeText(text).then(() => toast(tr('הועתק', 'Copied')));
}
function csvOf(dates) {
  const rows = [LANG === 'en' ? ['Date', 'Day', 'Meal', 'Food', 'Amount', 'Unit', 'With', 'Note', 'Category', 'kcal (est.)', 'Protein g', 'Carbs g', 'Fat g'] : ['תאריך', 'יום', 'ארוחה', 'מאכל', 'כמות', 'יחידה', 'עם', 'הערה', 'קטגוריה', 'קק״ל (הערכה)', 'חלבון ג׳', 'פחמימות ג׳', 'שומן ג׳']];
  const nc = (it) => { const x = itemN(it); return x.unknown ? ['', '', '', ''] : [Math.round(x.k), gr(x.p), gr(x.c), gr(x.f)]; };
  dates.forEach(iso => {
    const d = db.days[iso]; if (!d) return;
    MEALS.forEach(m => d.meals[m].forEach(it => rows.push([P.displayDate(iso), P.weekdayName(iso), MEAL[m].label, it.name, it.qty == null ? '' : it.qty, it.unit ? P.unitName(it.unit) : '', (it.with || []).join(' + '), it.note || '', catLabel(catOf(it.name))].concat(nc(it)))));
    const wk = weightOn(iso);
    if (wk) rows.push([P.displayDate(iso), P.weekdayName(iso), tr('משקל', 'Weight'), tr('משקל', 'Weight'), wk, tr('ק״ג', 'kg'), '', '', '']);
    const wml = drinksMl(d);
    if (wml) rows.push([P.displayDate(iso), P.weekdayName(iso), tr('מים', 'Water'), tr('מים', 'Water'), wml, tr('מ״ל', 'ml'), '', '', catLabel('drink')]);
    const g = dayGym(d);
    if (g) g.ex.forEach(e => rows.push([P.displayDate(iso), P.weekdayName(iso), tr('אימון', 'Workout'), window.Gym.displayName(e.name), window.Gym.exDetail(e), '', '', g.title || '', groupLabel(window.Gym.groupOf(e.name))]));
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
    const inp = $('#sheets [data-on="addText"]');
    if (inp) ADD.text = inp.value;
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
      save(); toast(tr('הפריט הוסר', 'Item removed'), { label: tr('ביטול', 'Undo'), fn: () => restoreDay(S.date, snap) });
    } else { it.qty = q; save(); }
    replaceSheetBody('add', addSheetHtml());
  },
  applyTpl(el) {
    const t = db.templates.find(x => x.id === el.dataset.id);
    if (!t) return;
    const meal = el.dataset.meal || t.meal;
    addItemsToMeal(S.date, meal, clone(t.items), true);
    toast(tr(`נוספה "${t.name}"`, `Added "${t.name}"`));
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
    refreshEditNut();
  },
  eHalf() {
    EDIT.it.qty = (EDIT.it.qty == null ? 1 : EDIT.it.qty) + 0.5;
    $('#eQtyVal').textContent = P.fmtQty(EDIT.it.qty);
    refreshEditNut();
  },
  editTo(el) { EDIT.to = el.dataset.v; $$('[data-act="editTo"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === EDIT.to)); },
  eSave() {
    const day = getDay(S.date, true);
    const it = EDIT.it;
    it.name = canonical(it.name || '') || it.name;
    if (!it.name.trim()) { toast(tr('צריך שם למאכל', 'The food needs a name')); return; }
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
    toast(tr('הפריט נמחק', 'Item deleted'), { label: tr('ביטול', 'Undo'), fn: () => restoreDay(S.date, snap) });
  },
  eDup() {
    const day = getDay(S.date, true);
    const copy = newItem(EDIT.it);
    day.meals[EDIT.to].push(copy);
    save(); closeSheet(); render({ keepScroll: true }); refreshAdd(); toast(tr('שוכפל', 'Duplicated'));
  },
  mealMenu(el) { openMealMenu(el.dataset.meal); },
  saveTpl(el) {
    const meal = el.dataset.meal;
    const day = getDay(S.date, false);
    closeSheet();
    const def = meal === 'breakfast' ? tr('הבוקר הרגיל', 'My usual breakfast') : tr(`${MEAL[meal].label} קבוע`, `My usual ${MEAL[meal].label.toLowerCase()}`);
    promptSheet(tr('שמירת ארוחה קבועה', 'Save a regular meal'), tr('שם הארוחה', 'Meal name'), def, (name) => {
      db.templates.push({ id: uid(), name: name || def, meal, items: day.meals[meal].map(it => { const c = clone(it); delete c.id; return c; }) });
      save(); render({ keepScroll: true }); toast(tr('נשמר. מופיע בהוספה מהירה', 'Saved. It shows up in quick add'));
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
    toast(tr(`הועתק ${MEAL[m].label} מאתמול`, `Copied ${MEAL[m].label.toLowerCase()} from yesterday`), { label: tr('ביטול', 'Undo'), fn: () => restoreDay(S.date, snap) });
  },
  mealNote(el) {
    const m = el.dataset.meal;
    closeSheet();
    const day = getDay(S.date, false);
    promptSheet(tr(`הערה ל${MEAL[m].label}`, `${MEAL[m].label} note`), tr('הערה', 'Note'), (day && day.mealNotes[m]) || '', (v) => {
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
    toast(tr(`${MEAL[m].label} נוקה`, `${MEAL[m].label} cleared`), { label: tr('ביטול', 'Undo'), fn: () => restoreDay(S.date, snap) });
  },
  copyYesterday() {
    const prev = getDay(addDays(S.date, -1), false);
    if (!prev || !mealsCount(prev)) { toast(tr('אתמול לא נרשם', 'Nothing logged yesterday')); return; }
    const snap = snapshotDay(S.date);
    const day = getDay(S.date, true);
    let n = 0;
    MEALS.forEach(m => { if (!day.meals[m].length && prev.meals[m].length) { day.meals[m] = clone(prev.meals[m]).map(newItem); n++; } });
    if (!n) { toast(tr('כל הארוחות כבר מלאות. אפשר להעתיק ארוחה אחת מתפריט ⋯', 'All meals are already filled. You can copy a single meal from its ⋯ menu')); return; }
    save(); render({ keepScroll: true, anim: false });
    toast(tr(`הועתקו ${n} ארוחות מאתמול`, `Copied ${n} ${n === 1 ? 'meal' : 'meals'} from yesterday`), { label: tr('ביטול', 'Undo'), fn: () => restoreDay(S.date, snap) });
  },
  shareDay() {
    const d = getDay(S.date, false);
    if (!dayHasData(d)) { toast(tr('אין עדיין מה לשתף', 'Nothing to share yet')); return; }
    shareText(dayText(S.date, d));
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
  sharePeriod() { shareText(rangeDates().filter(i => dayHasData(db.days[i])).map(i => dayText(i)).join('\n\n')); },
  exportCsv() { const ds = S.tab === 'stats' ? rangeDates().filter(i => db.days[i]) : allDatesSorted(); exportFile(`food-diary-${todayISO()}.csv`, csvOf(ds), 'csv'); },
  exportText() { exportFile(`food-diary-${todayISO()}.txt`, allDatesSorted().map(i => dayText(i)).join('\n\n'), 'text'); },
  backup() {
    pullPendingWater();
    const now = new Date();
    const out = Object.assign({ app: 'fooddiary', exportedAt: now.toISOString() }, db);
    out.settings = Object.assign({}, db.settings);
    if (out.settings.ai) out.settings.ai = Object.assign({}, out.settings.ai, { key: '' }); // the personal AI key never goes into a file
    exportFile(`food-diary-backup-${todayISO()}-${pad(now.getHours())}${pad(now.getMinutes())}.json`, JSON.stringify(out, null, 1), 'json');
  },
  restoreMerge() { finishRestore('merge'); },
  restoreReplace() { finishRestore('replace'); },
  wipe() {
    confirmSheet(tr('מחיקת כל הנתונים', 'Delete all data'), tr('כל הימים, המאכלים והארוחות השמורות יימחקו. כדאי לשמור גיבוי קודם.', 'All days, foods and saved meals will be deleted. Consider saving a backup first.'), tr('מחק הכל', 'Delete all'), () => {
      const s = db.settings; db = freshDb(); db.settings = s; save(); render(); toast(tr('הנתונים נמחקו', 'Data deleted'));
    });
  },
  theme(el) { db.settings.theme = el.dataset.v; save(); applyTheme(); render({ keepScroll: true }); },
  accent(el) { db.settings.accent = el.dataset.v; save(); applyTheme(); render({ keepScroll: true }); },
  setBg(el) { db.settings.bg = el.dataset.id; db.settings.rotateBg = false; save(); applyTheme(); render({ keepScroll: true }); },
  delBg() {
    const id = (db.settings.bg || '').replace('custom:', '');
    confirmSheet(tr('מחיקת תמונה', 'Delete photo'), tr('למחוק את תמונת הרקע הזאת?', 'Delete this background photo?'), tr('מחק', 'Delete'), async () => {
      await idbDel(id); delete bgCache[id]; await loadCustomBgs();
      db.settings.bg = 'sage'; save(); applyTheme(); render({ keepScroll: true });
    });
  },
  bgCat(el) { S.bgCat = el.dataset.v; render({ keepScroll: true }); },
  lang(el) { db.settings.lang = el.dataset.v; setLang(db.settings.lang); save(); render({ keepScroll: true }); },
  surpriseBg() {
    const pool = BUILTIN_BGS.filter(b => b.id !== 'plain' && b.id !== db.settings.bg).map(b => b.id).concat(customBgIds.map(i => 'custom:' + i));
    db.settings.bg = pool[Math.floor(Math.random() * pool.length)]; db.settings.rotateBg = false;
    const b = BUILTIN_BGS.find(x => x.id === db.settings.bg);
    save(); applyTheme(); render({ keepScroll: true }); toast(b ? `${tr('רקע', 'Background')}: ${bgName(b)}` : tr('רקע: תמונה שלך', 'Background: your photo'));
  },
  motion() { db.settings.motion = db.settings.motion === false; save(); applyTheme(); render({ keepScroll: true }); },
  rotateBg() { db.settings.rotateBg = !db.settings.rotateBg; save(); applyTheme(); render({ keepScroll: true }); },
  showWater() { db.settings.showWater = !db.settings.showWater; save(); render({ keepScroll: true }); },
  drink(el) { addDrink(S.date, +el.dataset.ml); render({ keepScroll: true }); },
  undoDrink() {
    const d = getDay(S.date, false);
    if (!d || !d.drinks || !d.drinks.length) return;
    S.waterAnimFrom = dayWaterMl(d) / W().goalMl; S.waterAnimDate = S.date;
    const x = d.drinks.pop(); cleanupDay(S.date); save(); render({ keepScroll: true });
    toast(tr(`בוטל: ${fmtAmount(x.ml)}`, `Removed ${fmtAmount(x.ml)}`));
  },
  openDrinks() { openDrinks(); },
  drinkSrc(el) {
    DRINK.src = el.dataset.id;
    const x = drinkSources().find(y => y.id === DRINK.src);
    DRINK.frac = 1; DRINK.ml = x ? x.ml : 250;
    replaceSheetBody('drinks', drinksHtml());
  },
  drinkFrac(el) {
    DRINK.frac = +el.dataset.v;
    const x = drinkSources().find(y => y.id === DRINK.src);
    DRINK.ml = roundMl((x ? x.ml : 250) * DRINK.frac);
    $$('[data-act="drinkFrac"]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === DRINK.frac));
    updateDrinkLabels();
  },
  drinkAdd() { addDrink(S.date, DRINK.ml); replaceSheetBody('drinks', drinksHtml()); },
  delDrink(el) {
    const d = getDay(S.date, false); if (!d || !d.drinks) return;
    d.drinks.splice(+el.dataset.i, 1); cleanupDay(S.date); save(); replaceSheetBody('drinks', drinksHtml());
  },
  addBottle() { bottleSheet(null); },
  editBottle(el) { bottleSheet(el.dataset.id); },
  delBottle(el) {
    const w = W(); const b = w.bottles.find(x => x.id === el.dataset.id);
    confirmSheet(tr('מחיקת בקבוק', 'Delete bottle'), tr(`למחוק את "${esc(bottleName(b))}"?`, `Delete "${esc(bottleName(b))}"?`), tr('מחק', 'Delete'), () => {
      w.bottles = w.bottles.filter(x => x.id !== b.id); W(); save(); render({ keepScroll: true });
    });
  },
  wMain(el) { W().mainBottle = el.dataset.id; save(); render({ keepScroll: true }); },
  bPreset(el) {
    const i = $('[data-on="bMl"]'); if (i) i.value = el.dataset.v;
    $$('#sheets [data-act="bPreset"]').forEach(c => c.classList.toggle('sel', c === el));
  },
  bStep(el) {
    const i = $('[data-on="bMl"]'); if (!i) return;
    const v = Math.max(50, Math.min(5000, (Math.round((+i.value || 0) / 10) * 10) + (+el.dataset.d)));
    i.value = v;
    $$('#sheets [data-act="bPreset"]').forEach(c => c.classList.toggle('sel', +c.dataset.v === v));
  },
  bMain(el) { W().mainBottle = el.dataset.id; ACT.bSave(el); },
  bDel(el) {
    const w = W(); const b = w.bottles.find(x => x.id === el.dataset.id); if (!b || w.bottles.length < 2) return;
    const i = w.bottles.indexOf(b);
    const wasMain = w.mainBottle === b.id;
    w.bottles.splice(i, 1); W();
    if (DRINK.src === b.id) { const m = mainBottle(); DRINK.src = m.id; DRINK.frac = 1; DRINK.ml = m.ml; }
    save(); closeSheet();
    if (sheetStack.find(x => x.id === 'drinks')) replaceSheetBody('drinks', drinksHtml());
    render({ keepScroll: true });
    toast(tr(`נמחק: ${bottleName(b)}`, `Deleted: ${bottleName(b)}`), { label: tr('ביטול', 'Undo'), fn: () => { w.bottles.splice(i, 0, b); if (wasMain) w.mainBottle = b.id; save(); render({ keepScroll: true }); } });
  },
  bSave(el) {
    const w = W();
    const name = (($('[data-on="bName"]') || {}).value || '').trim();
    const ml = Math.max(50, Math.min(5000, Math.round(+(($('[data-on="bMl"]') || {}).value) || 0)));
    if (!ml) { toast(tr('צריך נפח', 'Size is needed')); return; }
    const id = el.dataset.id;
    if (id === 'cup') { w.cupMl = Math.max(50, Math.min(1000, ml)); if (DRINK.src === 'cup') { DRINK.frac = 1; DRINK.ml = w.cupMl; } }
    else if (id) { const b = w.bottles.find(x => x.id === id); if (b) { b.name = name; b.ml = ml; } if (DRINK.src === id) { DRINK.frac = 1; DRINK.ml = ml; } }
    else { const nb = { id: 'b' + uid(), name, ml }; w.bottles.push(nb); if (sheetStack.find(x => x.id === 'drinks')) { DRINK.src = nb.id; DRINK.frac = 1; DRINK.ml = ml; } }
    save(); syncWaterNative(); closeSheet();
    if (sheetStack.find(x => x.id === 'drinks')) replaceSheetBody('drinks', drinksHtml());
    render({ keepScroll: true });
    toast(id === 'cup' ? tr(`גודל הכוס: ${w.cupMl} מ״ל`, `Glass size: ${w.cupMl} ml`) : tr(`נשמר: ${name || bottleName({})} · ${ml} מ״ל`, `Saved: ${name || bottleName({})} · ${ml} ml`));
  },
  wGoal(el) { const w = W(); w.goalMl = Math.max(500, Math.min(6000, w.goalMl + (+el.dataset.d))); save(); render({ keepScroll: true }); },
  waterGoal() { openSheet('wgoal', waterGoalHtml(), { title: tr('יעד מים', 'Water goal'), onClose: () => render({ keepScroll: true }) }); },
  wGoalS(el) { const w = W(); w.goalMl = Math.max(500, Math.min(6000, w.goalMl + (+el.dataset.d))); save(); syncWaterNative(); replaceSheetBody('wgoal', waterGoalHtml()); },
  wGoalSet(el) { W().goalMl = +el.dataset.v; save(); syncWaterNative(); replaceSheetBody('wgoal', waterGoalHtml()); },
  wGoalWeight() {
    const lw = weights().pop(); if (!lw) return;
    const ml = Math.max(1500, Math.min(4000, Math.round(lw.kg * 33 / 250) * 250));
    W().goalMl = ml; save(); syncWaterNative(); replaceSheetBody('wgoal', waterGoalHtml());
    toast(tr(`היעד עודכן ל-${fmtL(ml)} ליטר. זו הערכה כללית; בחום או בפעילות צריך יותר`, `Goal set to ${fmtL(ml)} L. A rough guide; you need more in heat or when active`));
  },
  wCup(el) { const w = W(); w.cupMl = Math.max(100, Math.min(600, w.cupMl + (+el.dataset.d))); save(); render({ keepScroll: true }); },
  wSuggest() {
    promptSheet(tr('הצעת יעד מים', 'Suggest a water goal'), tr('המשקל שלך (ק״ג)', 'Your weight (kg)'), '', (v) => {
      const kg = parseFloat(String(v).replace(',', '.'));
      if (!(kg > 25 && kg < 250)) { toast(tr('לא הבנתי את המשקל', "I didn't get the weight")); return; }
      const ml = Math.max(1500, Math.min(4000, Math.round(kg * 33 / 250) * 250));
      W().goalMl = ml; save(); syncWaterNative(); render({ keepScroll: true });
      if (sheetStack.find(x => x.id === 'wgoal')) replaceSheetBody('wgoal', waterGoalHtml());
      toast(tr(`היעד עודכן ל-${fmtL(ml)} ליטר. זו הערכה כללית; בחום או בפעילות צריך יותר`, `Goal set to ${fmtL(ml)} L. A rough guide; you need more in heat or when active`));
    }, tr('חשב', 'Calculate'));
    setTimeout(() => { const i = $('[data-on="promptVal"]'); if (i) i.setAttribute('inputmode', 'decimal'); }, 50);
  },
  wRemind() {
    const w = W(); w.remind = !w.remind; save(); render({ keepScroll: true });
    if (w.remind && A && A.requestNotificationPermission) A.requestNotificationPermission();
    toast(w.remind ? tr('אזכיר לך לשתות רק כשתהיה מאחור', "I'll remind you only when you fall behind") : tr('תזכורת השתייה כובתה', 'Water reminder turned off'));
  },
  wEvery(el) { W().remindEvery = +el.dataset.v; save(); render({ keepScroll: true }); },
  wMeals() { const w = W(); w.countMeals = !w.countMeals; save(); render({ keepScroll: true }); },
  reminder() {
    const r = db.settings.reminder;
    r.on = !r.on; save(); render({ keepScroll: true });
    if (A) {
      if (r.on && A.requestNotificationPermission) A.requestNotificationPermission();
      A.setReminder(r.on, r.h, r.m);
    }
    toast(r.on ? tr(`תזכורת כל יום ב-${pad(r.h)}:${pad(r.m)}`, `Reminder every day at ${pad(r.h)}:${pad(r.m)}`) : tr('התזכורת כובתה', 'Reminder turned off'));
  },
  openFoods() { openFoods(); },
  renameFood(el) {
    const from = el.dataset.name;
    promptSheet(tr('שינוי שם או איחוד', 'Rename or merge'), tr(`שם חדש ל"${from}" (שם של מאכל קיים יאחד ביניהם)`, `New name for "${from}" (an existing food name merges them)`), from, (to) => {
      renameFood(from, to); replaceSheetBody('foods', foodsHtml()); render({ keepScroll: true }); toast(tr('עודכן בכל ההיסטוריה', 'Updated across your history'));
    });
  },
  openTemplates() { openTemplates(); },
  renameTpl(el) {
    const t = db.templates.find(x => x.id === el.dataset.id);
    promptSheet(tr('שינוי שם', 'Rename'), tr('שם הארוחה', 'Meal name'), t.name, (v) => { if (v) t.name = v; save(); replaceSheetBody('tpls', tplsHtml()); });
  },
  delTpl(el) {
    const i = db.templates.findIndex(x => x.id === el.dataset.id);
    const t = db.templates[i];
    db.templates.splice(i, 1); save(); replaceSheetBody('tpls', tplsHtml()); render({ keepScroll: true });
    toast(tr('נמחקה', 'Deleted'), { label: tr('ביטול', 'Undo'), fn: () => { db.templates.splice(i, 0, t); save(); replaceSheetBody('tpls', tplsHtml()); render({ keepScroll: true }); } });
  },
  openImport(el) { openImport(el.dataset.mode || 'history'); },
  lensCam() { startLens('camera'); },
  lensGal() { startLens('gallery'); },
  ocrCam() { if (A && A.photo) A.photo('ocr', 'camera'); else if (A && A.ocrCamera) A.ocrCamera(); },
  ocrGal() { if (A && A.photo) A.photo('ocr', 'gallery'); else if (A && A.ocrGallery) A.ocrGallery(); },
  async pasteClip() {
    let t = '';
    try { t = A && A.readClipboard ? A.readClipboard() : await navigator.clipboard.readText(); } catch (e) { }
    if (!setImportText(t, true)) toast(tr('הלוח ריק', 'The clipboard is empty'));
  },
  impParse() { if (!IMP.text.trim()) { toast(tr('אין טקסט', 'No text')); return; } runParse(); },
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
  eName(el) { EDIT.it.name = el.value; refreshEditNut(); },
  eUnit(el) { EDIT.it.unit = el.value || null; if (EDIT.it.unit && EDIT.it.qty == null) { EDIT.it.qty = 1; $('#eQtyVal').textContent = '1'; } refreshEditNut(); },
  eWith(el) { EDIT.it.with = el.value.split(/[,،]/).map(s => s.trim()).filter(Boolean).map(canonical); refreshEditNut(); },
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
    save(); toast(tr(`"${n}" עבר ל${catLabel(el.value)}`, `"${n}" moved to ${catLabel(el.value)}`));
  },
  promptVal() { },
  drinkMl(el) { DRINK.ml = +el.value; DRINK.frac = null; $$('[data-act="drinkFrac"]').forEach(b => b.setAttribute('aria-pressed', 'false')); updateDrinkLabels(); },
  drinkMlNum(el) { const v = Math.round(+el.value || 0); if (v >= 10 && v <= 5000) { DRINK.ml = v; DRINK.frac = null; $$('[data-act="drinkFrac"]').forEach(b => b.setAttribute('aria-pressed', 'false')); updateDrinkLabels(); } },
  wWake(el) { W().wake = el.value || '07:00'; save(); },
  wSleep(el) { W().sleep = el.value || '23:00'; save(); },
  bName() { },
  bMl() { },
};
const saveLater = debounce(() => save(), 400);
const FILE_ON = {
  async addBg(el) {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      toast(tr('טוען תמונה…', 'Loading photo…'));
      const { data, lum } = await readImageFile(f);
      const id = uid();
      const ok = await idbPut({ id, data, lum, created: Date.now() });
      if (!ok) { toast(tr('לא הצלחתי לשמור את התמונה', "Couldn't save the photo")); return; }
      bgCache[id] = data; await loadCustomBgs();
      db.settings.bg = 'custom:' + id; db.settings.rotateBg = false;
      if (!db.settings.dim) db.settings.dim = 0.15;
      save(); await applyTheme(); render({ keepScroll: true }); toast(tr('הרקע עודכן', 'Background updated'));
    } catch (e) { toast(tr('לא הצלחתי לקרוא את התמונה', "Couldn't read the photo")); }
    el.value = '';
  },
  restore(el) {
    const f = el.files && el.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(fr.result);
        if (!d || typeof d.days !== 'object') throw new Error('bad');
        openRestore(d);
      } catch (e) { toast(tr('הקובץ לא נראה כמו גיבוי של יומן אוכל', "This file doesn't look like a Food Diary backup")); }
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
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.on === 'promptVal' && e.target.tagName === 'INPUT') { e.preventDefault(); ACT.promptOk(); }
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target.dataset && e.target.dataset.on === 'chatText') { e.preventDefault(); aiSend(e.target.value); }
});
document.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.dataset.form === 'add') ACT.addTyped();
  if (e.target.dataset.form === 'gym') gymSubmit();
  if (e.target.dataset.form === 'weight') weightSubmit();
  if (e.target.dataset.form === 'chat') { const t = e.target.querySelector('textarea'); aiSend(t ? t.value : AI.draft); }
});
Object.assign(ACT, AI_ACT, GYM_ACT, NUT_ACT, WT_ACT);
Object.assign(ON, AI_ON, GYM_ON, NUT_ON, WT_ON);
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
window.onOcrStart = () => toast(tr('קורא את התמונה… זה יכול לקחת כמה שניות', 'Reading the photo… this can take a few seconds'));
function startLens(source) {
  if (!A || !A.photo) return;
  IMP.clipBefore = A.readClipboard ? A.readClipboard() : '';
  A.photo('lens', source);
}
window.onLensOpened = () => { IMP.awaitClip = true; IMP.awaitSince = Date.now(); };
/** Back from Lens: look at the clipboard a few times (Android only shares it once the app has focus). */
function checkLensClipboard() {
  if (!IMP.awaitClip || !A || !A.readClipboard || IMP.checking) return;
  IMP.checking = true;
  let tries = 0;
  const tick = () => {
    if (!IMP.awaitClip) { IMP.checking = false; return; }
    const c = A.readClipboard();
    if (c && c.trim() && c !== IMP.clipBefore) {
      IMP.awaitClip = false;
      if (!sheetStack.find(s => s.id === 'import')) openImport(IMP.mode || 'day');
      setImportText(c, true);
      toast(tr('הטקסט מ-Lens נכנס. בדוק ותקן לפני הניתוח', 'Text from Lens pasted. Check and fix it before reading it in'));
      IMP.checking = false;
    } else if (++tries < 6) setTimeout(tick, 600);
    else { IMP.checking = false; IMP.awaitClip = false; toast(tr('לא מצאתי טקסט מועתק. ב-Lens לחץ "העתקה" ואז "הדבק מהלוח"', 'No copied text found. In Lens tap "Copy", then "Paste from clipboard"')); }
  };
  setTimeout(tick, 500);
}
window.addEventListener('focus', checkLensClipboard);
window.onOcrText = (text, status, detail) => {
  if (status === 'cancel') return;
  if (status === 'nocamera') { toast(tr('לא הצלחתי לפתוח את המצלמה', "Couldn't open the camera") + (detail ? ` (${detail})` : '')); return; }
  if (status === 'nolens') { toast(tr('לא נמצאה אפליקציית Google עם Lens. אפשר להתקין "Google" מחנות Play', 'No Google app with Lens found. You can install "Google" from the Play Store')); return; }
  if (text == null) {
    const why = detail === 'image' ? tr('לא הצלחתי לפתוח את התמונה', "Couldn't open the photo")
      : detail === 'data' ? tr('קובצי הזיהוי חסרים באפליקציה', 'Recognition files are missing in the app')
      : tr('הזיהוי נכשל', 'Recognition failed') + (detail ? ` (${detail.slice(0, 80)})` : '');
    toast(why);
    return;
  }
  if (!sheetStack.find(s => s.id === 'import')) openImport(IMP.mode || 'day');
  if (setImportText(text, true)) toast(tr('זוהה טקסט. בדוק ותקן לפני הניתוח', 'Text found. Check and fix it before reading it in'));
  else toast(tr('לא זוהה טקסט בתמונה', 'No text found in the photo'));
};
window.onNotifPermission = (ok) => { if (!ok) toast(tr('בלי הרשאת התראות התזכורת לא תופיע', "Without notification permission the reminder won't show")); };
window.appPause = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); A && A.autoBackup && A.autoBackup(JSON.stringify(db)); } catch (e) { } };
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // new day while the app stayed open
    const t = todayISO();
    if (S.lastSeen && S.lastSeen !== t && S.date === S.lastSeen) { S.date = t; render(); applyTheme(); }
    S.lastSeen = t;
    if (pullPendingWater() && S.tab === 'today') render({ keepScroll: true });
    if (S.tab === 'today' && !sheetStack.length) render({ keepScroll: true });
    checkLensClipboard();
  }
});

/* ---------------- start ---------------- */
(async function start() {
  loadDb();
  setLang(db.settings.lang);
  S.lastSeen = todayISO();
  await loadCustomBgs();
  await applyTheme();
  pullPendingWater();
  render({ anim: true });
  reportToday();
  if (A && db.settings.reminder.on) { try { A.setReminder(true, db.settings.reminder.h, db.settings.reminder.m); } catch (e) { } }
})();
