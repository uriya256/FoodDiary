// Turns free Hebrew text like the user's daily notes into structured meals and items.
'use strict';

(function (root) {
  const F = (typeof module !== 'undefined') ? require('./foods.js') : root.Foods;
  const { ATTACH_CATS, ATTACH_NAMES, PLURALS, CONSTRUCT, COMPOSITE, NUM_WORDS, UNITS_RAW, AFTER_UNITS, FILLER, normKey } = F;

  const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
  let LANG = 'he';
  const MEAL_LABELS_HE = { breakfast: 'בוקר', lunch: 'צהריים', dinner: 'ערב', snack: 'ביניים' };
  const MEAL_LABELS_EN = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
  const WEEKDAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MEAL_LABELS = new Proxy({}, { get: (_, k) => (LANG === 'en' ? MEAL_LABELS_EN : MEAL_LABELS_HE)[k] });
  function setLang(l) { LANG = l === 'en' ? 'en' : 'he'; }

  // English words are mapped onto the same grammar the Hebrew parser uses.
  const EN_KEY = { and: 'ו', '&': 'ו', with: 'עם', without: '~without', no: '~no', plus: ',' };
  const EN_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, half: 0.5, quarter: 0.25, couple: 2, few: 3 };
  const EN_FILLER = new Set(['a', 'an', 'of', 'some', 'the', 'i', 'had', 'ate', 'drank', 'little', 'bit', 'about', 'around', 'approx', 'x']);
  const EN_UNIT_NAMES = {
    'פרוסות': ['slices', 'slice'], 'כפות': ['tbsp', 'tbsp'], 'כפיות': ['tsp', 'tsp'], 'חתיכות': ['pieces', 'piece'],
    'משולשים': ['triangles', 'triangle'], 'כוסות': ['cups', 'cup'], 'ספלים': ['mugs', 'mug'], 'קערות': ['bowls', 'bowl'],
    'צלחות': ['plates', 'plate'], 'מנות': ['servings', 'serving'], 'יחידות': ['units', 'unit'], 'חופנים': ['handfuls', 'handful'],
    'קופסאות': ['cans', 'can'], 'בקבוקים': ['bottles', 'bottle'], 'פחיות': ['cans', 'can'], 'גרם': ['g', 'g'], 'ביצים': ['eggs', 'egg'],
  };
  const SEP = new Set([',', ';', '+', '.', '|', '-', '–', '—', '/']);

  const SINGULAR = {};
  for (const k in UNITS_RAW) SINGULAR[UNITS_RAW[k][0]] = UNITS_RAW[k][1];

  function cleanText(s) {
    return String(s || '')
      .replace(/[​-‏‪-‮⁦-⁩﻿ ]/g, ' ')
      .replace(/\r/g, '');
  }

  function tokenize(text) {
    let s = cleanText(text)
      .replace(/(\d)([א-תa-zA-Z])/g, '$1 $2')
      .replace(/([א-תa-zA-Z])(\d)/g, '$1 $2')
      .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (m, a, b) => String(+a / +b))
      .replace(/½/g, ' 0.5 ').replace(/¼/g, ' 0.25 ').replace(/¾/g, ' 0.75 ')
      .replace(/שלושת\s+רבעי/g, ' 0.75 ')
      .replace(/(\d)\s*0\.(25|5|75)\b/g, (m, a, b) => String(+a + +('0.' + b)))
      .replace(/[()[\]{}!?:•*]/g, ' ')
      .replace(/([,;+|\n–—])/g, ' , ')
      .replace(/(\S)\.(\s|$)/g, '$1 , ')
      .replace(/\s-\s/g, ' , ');
    const out = [];
    for (const t of s.split(/\s+/).filter(Boolean)) {
      const l = t.toLowerCase();
      if (EN_KEY[l]) out.push(EN_KEY[l]);
      else if (EN_NUM[l] != null) out.push(String(EN_NUM[l]));
      else if (EN_FILLER.has(l)) continue;
      else out.push(t);
    }
    return out;
  }

  function stripVav(t) {
    return (t.length > 1 && t[0] === 'ו') ? t.slice(1) : null;
  }

  function parseNum(t) {
    const tryOne = (x) => {
      if (/^\d+(\.\d+)?$/.test(x)) return parseFloat(x);
      const k = normKey(x).replace(/[מנ]$/, m => m);
      if (NUM_WORDS[x] != null) return NUM_WORDS[x];
      if (NUM_WORDS[k] != null) return NUM_WORDS[k];
      return null;
    };
    let n = tryOne(t);
    if (n != null) return { n, conj: false };
    const s = stripVav(t);
    if (s) { n = tryOne(s); if (n != null) return { n, conj: true }; }
    return null;
  }

  function unitOf(t) {
    const u = UNITS_RAW[t] || UNITS_RAW[t.toLowerCase()];
    if (u && !AFTER_UNITS.has(u[0])) return { unit: u[0], conj: false };
    const s = stripVav(t);
    if (s && UNITS_RAW[s] && !AFTER_UNITS.has(UNITS_RAW[s][0])) return { unit: UNITS_RAW[s][0], conj: true };
    return null;
  }

  function matchFood(tok, i, lex) {
    for (let L = Math.min(4, tok.length - i); L >= 1; L--) {
      const parts = tok.slice(i, i + L);
      if (parts.some(p => SEP.has(p) || p === 'ו' || p === 'עם')) continue;
      const phrase = parts.join(' ');
      const hit = lex.aliases[normKey(phrase)];
      if (hit) return { name: hit, L, conj: false, raw: phrase };
      const s = stripVav(parts[0]);
      if (s) {
        const p2 = [s].concat(parts.slice(1)).join(' ');
        const hit2 = lex.aliases[normKey(p2)];
        if (hit2) return { name: hit2, L, conj: true, raw: p2 };
      }
    }
    return null;
  }

  function isBoundary(t) {
    return t == null || SEP.has(t) || t === 'ו' || t === 'עם' || (t.length > 1 && t[0] === 'ו');
  }

  /** Parse one meal's text into items. */
  function parseItems(text, lex) {
    const tok = tokenize(text);
    const items = [];
    let cur = null, mode = 'normal', pQty = null, pUnit = null, conj = false, adjacent = false, vavAdj = false, justWith = false;
    // "טוסט עם גבינה", "פיתה עם חומוס": the first food right after "עם" belongs to a bread or dish
    const HOLDERS = new Set(['grain', 'whole', 'dish']);
    const FILLINGS = new Set(['dairy', 'legume', 'protein', 'nuts', 'sauce', 'veg', 'sweet']);

    const start = (name, known) => {
      cur = { name, qty: pQty, unit: pUnit, with: [], note: '', known };
      items.push(cur);
      pQty = null; pUnit = null; mode = 'normal'; conj = false; adjacent = true;
    };

    for (let i = 0; i < tok.length; i++) {
      const t = tok[i];
      const next = tok[i + 1];
      const wasJustWith = justWith;
      if (t !== 'עם' && t !== 'ועם') justWith = false;
      if (SEP.has(t)) { cur = null; mode = 'normal'; conj = false; adjacent = false; continue; }
      if (t === 'ו') { vavAdj = adjacent === true; conj = true; adjacent = false; continue; }
      if (t === 'עם' || t === 'ועם') { if (cur) { mode = 'with'; justWith = true; } adjacent = false; conj = false; continue; }
      if (t === 'ללא' || t === 'בלי' || t === 'וללא' || t === 'ובלי' || t === '~without' || t === '~no') {
        if (cur) { mode = 'without'; cur.note = (cur.note ? cur.note + ', ' : '') + (t[0] === '~' ? t.slice(1) : 'ללא'); }
        adjacent = false; continue;
      }
      if (FILLER.has(t)) { adjacent = false; continue; }
      const sv = stripVav(t);
      if (sv && FILLER.has(sv)) { conj = true; adjacent = false; continue; }

      const num = parseNum(t);
      // "כוס וחצי", "2 כוסות וחצי", "אבוקדו וחצי", "and a half": add to the amount before it
      if (num && (num.n === 0.5 || num.n === 0.25) && (num.conj || tok[i - 1] === 'ו')) {
        if (pQty != null) { pQty += num.n; conj = false; continue; }
        if (cur && (adjacent === true || (tok[i - 1] === 'ו' && vavAdj)) && isBoundary(next) && mode !== 'with') {
          cur.qty = (cur.qty == null ? 1 : cur.qty) + num.n; adjacent = false; conj = false; continue;
        }
      }
      if (num) {
        if (cur && cur.qty == null && COMPOSITE[cur.name] && next && COMPOSITE[cur.name].includes(next)) {
          cur.qty = num.n; cur.unit = 'ביצים'; i++; adjacent = false; mode = 'normal'; continue;
        }
        if (cur && cur.qty == null && adjacent === true && !num.conj && pQty == null && isBoundary(next)) {
          cur.qty = num.n; adjacent = false; continue;
        }
        pQty = num.n; pUnit = null; mode = 'normal'; adjacent = false; conj = conj || num.conj;
        continue;
      }

      const u = unitOf(t);
      if (u && next != null && !SEP.has(next)) {
        pUnit = u.unit; if (pQty == null) pQty = 1;
        mode = 'normal'; adjacent = false; if (u.conj) conj = true;
        continue;
      }

      const m = matchFood(tok, i, lex);
      if (m) {
        const cat = lex.cats[m.name] || 'other';
        if (m.conj) conj = true;
        i += m.L - 1;
        if (mode === 'with' && cur && pQty == null && (ATTACH_CATS.has(cat) || ATTACH_NAMES.has(m.name) ||
            (wasJustWith && HOLDERS.has(lex.cats[cur.name] || '') && FILLINGS.has(cat)))) {
          cur.with.push(m.name); adjacent = 'with'; conj = false; continue;
        }
        if (mode === 'without' && cur && pQty == null) { cur.note += ' ' + m.raw; continue; }
        if (cur && !cur.known && adjacent === true && !conj && pQty == null) { cur.name += ' ' + m.raw; continue; }
        start(m.name, true);
        continue;
      }

      // unknown word
      let w = t.replace(/^[״"׳']+|[״"׳']+$/g, '');
      if (!w) continue;
      if (sv && w.length >= 3) { w = w.slice(1); conj = true; }
      if (mode === 'without' && cur) { cur.note += ' ' + w; continue; }
      if (mode === 'with' && cur && pQty == null) {
        if (adjacent === 'with' && !conj && cur.with.length) cur.with[cur.with.length - 1] += ' ' + w;
        else cur.with.push(w);
        adjacent = 'with'; conj = false; continue;
      }
      if (cur && adjacent === true && !conj && pQty == null) { cur.name += ' ' + w; cur.known = false; continue; }
      start(w, false);
    }
    for (const it of items) {
      it.name = it.name.trim();
      it.note = it.note.trim();
      it.with = it.with.map(x => x.trim()).filter(Boolean);
      delete it.known;
    }
    return items.filter(it => it.name);
  }

  const MEAL_RE = /^(?:ארוחת\s+)?(בוקר|צהריים|צהרים|צוהריים|צוהרים|ערב|ביניים|בינים|נשנוש|נשנושים|קינוח|לילה)(?:\s*[:：\-–]\s*|\s+|$)(.*)$/;
  const MEAL_MAP = {
    'בוקר': 'breakfast', 'צהריים': 'lunch', 'צהרים': 'lunch', 'צוהריים': 'lunch', 'צוהרים': 'lunch',
    'ערב': 'dinner', 'ביניים': 'snack', 'בינים': 'snack', 'נשנוש': 'snack', 'נשנושים': 'snack', 'קינוח': 'snack', 'לילה': 'snack',
  };
  const MEAL_RE_EN = /^(breakfast|brunch|lunch|dinner|supper|snacks?|dessert)(?:\s*[:\-–]\s*|\s+|$)(.*)$/i;
  const MEAL_MAP_EN = { breakfast: 'breakfast', brunch: 'breakfast', lunch: 'lunch', dinner: 'dinner', supper: 'dinner', snack: 'snack', snacks: 'snack', dessert: 'snack' };
  const WATER_RE = /^(?:מים|water)\s*[:\-–]\s*(\d+(?:[.,]\d+)?)\s*([^\s\d]*)/i;
  const NOTES_RE = /^(?:הערות|notes?)\s*[:\-–]\s*(.*)$/i;
  // "אימון: …", "אימון (חזה וכתפיים): …", "אימון רגליים: …", "Workout: …" — gym lines, read by gym.js
  // "משקל: 82.4", "שקילה 82.4 ק״ג", "Weight: 82.4kg"
  const WEIGHT_RE = /^(?:משקל|שקילה|נשקלתי|weight|weigh-in)\s*[:\-–]?\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:ק"ג|ק״ג|קג|קילו|kg)?\.?$/i;
  const GYM_HEAD = /^(?:אימון|אימונים|כושר|חדר כושר|ספורט|workout|gym|training|exercise)(?=$|[\s:：\-–(])/i;
  const DATE_RE = /^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?(?!\d)(.*)$/;

  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDate(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
  function validDate(y, m, d) {
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  /**
   * Parse a whole diary text (one or many days).
   * opts.defaultDate: ISO date used when the text has no date line.
   * opts.defaultYear: year for dates written without one.
   */
  function parseDiary(text, lex, opts) {
    opts = opts || {};
    const defYear = opts.defaultYear || new Date().getFullYear();
    const lines = cleanText(text).replace(/•/g, '\n').split('\n')
      .map(l => l.replace(/^[\s\-*·▪●◦>]+/, '').trim());
    const days = [];
    const warnings = [];
    let day = null, meal = null, raw = null;

    const newDay = (date) => {
      day = { date, meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, raw: {}, note: '' };
      days.push(day); meal = null;
    };
    const flushRaw = () => {
      if (!day) return;
      for (const k of MEALS) {
        if (day.raw[k]) day.meals[k] = parseItems(day.raw[k], lex);
      }
    };

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (!line) continue;
      const dm = line.match(DATE_RE);
      if (dm) {
        const d = +dm[1], m = +dm[2];
        let y = dm[3] ? +dm[3] : defYear;
        if (y < 100) y += 2000;
        if (validDate(y, m, d)) {
          newDay(isoDate(y, m, d));
          const rest = dm[4].replace(/^[\s\-–—,]*(יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)?[\s\-–—,:]*/i, '').trim();
          if (rest) lines.splice(li + 1, 0, rest);
          continue;
        }
      }
      const wm = line.match(WATER_RE);
      if (wm && day) { day.waterRaw = { n: parseFloat(wm[1].replace(',', '.')), unit: (wm[2] || '').replace(/[.,;]+$/, '') }; continue; }
      const nm = line.match(NOTES_RE);
      if (nm && day) { day.note = day.note ? day.note + '\n' + nm[1] : nm[1]; continue; }
      const wtm = line.match(WEIGHT_RE);
      if (wtm) {
        if (!day) {
          if (opts.defaultDate) newDay(opts.defaultDate);
          else { warnings.push({ line, msg: 'meal_no_date' }); continue; }
        }
        day.weightKg = parseFloat(wtm[1].replace(',', '.'));
        continue;
      }
      const gh = line.match(GYM_HEAD);
      if (gh) {
        if (!day) {
          if (opts.defaultDate) newDay(opts.defaultDate);
          else { warnings.push({ line, msg: 'meal_no_date' }); continue; }
        }
        let rest = line.slice(gh[0].length), title = '';
        const pm = rest.match(/^\s*\(([^)]*)\)/);
        if (pm) { title = pm[1].trim(); rest = rest.slice(pm[0].length); }
        const cm = rest.match(/^\s*([^:：\d]{0,30}?)\s*[:：\-–]\s*([\s\S]*)$/);
        if (cm) { if (cm[1].trim()) title = title || cm[1].trim(); rest = cm[2]; }
        else if (!/\d/.test(rest)) { if (rest.trim()) title = title || rest.trim(); rest = ''; }
        else rest = line; // "אימון 45 דקות"
        if (title) day.gymTitle = title;
        rest = rest.trim();
        if (rest) day.gymRaw = day.gymRaw ? day.gymRaw + '\n' + rest : rest;
        meal = 'gym';
        continue;
      }
      let mm = line.match(MEAL_RE);
      if (!mm) { const me = line.match(MEAL_RE_EN); if (me) mm = [me[0], 'EN:' + MEAL_MAP_EN[me[1].toLowerCase()], me[2]]; }
      if (mm) {
        if (!day) {
          if (opts.defaultDate) newDay(opts.defaultDate);
          else { warnings.push({ line, msg: 'meal_no_date' }); continue; }
        }
        meal = mm[1].startsWith('EN:') ? mm[1].slice(3) : MEAL_MAP[mm[1]];
        const rest = (mm[2] || '').trim();
        if (rest) day.raw[meal] = day.raw[meal] ? day.raw[meal] + ' , ' + rest : rest;
        else if (!day.raw[meal]) day.raw[meal] = '';
        continue;
      }
      if (/^(יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*$/i.test(line)) continue;
      if (!day) {
        if (opts.defaultDate) newDay(opts.defaultDate);
        else { warnings.push({ line, msg: 'before_date' }); continue; }
      }
      if (meal === 'gym') { day.gymRaw = day.gymRaw ? day.gymRaw + '\n' + line : line; continue; }
      if (!meal) {
        day.note = day.note ? day.note + '\n' + line : line;
        warnings.push({ line, date: day.date, msg: 'no_meal' });
        continue;
      }
      const joiner = /^(ו|and\b)/i.test(line) ? ' ' : ' , ';
      day.raw[meal] = day.raw[meal] ? day.raw[meal] + joiner + line : line;
    }
    // parse each day's meals
    const keep = days;
    for (const d of keep) {
      day = d; flushRaw();
    }
    return { days: keep, warnings };
  }

  function fmtQty(q) {
    if (q == null) return '';
    if (q === 0.5) return LANG === 'en' ? '½' : 'חצי';
    if (q === 0.25) return LANG === 'en' ? '¼' : 'רבע';
    return String(Math.round(q * 100) / 100);
  }

  function unitLabel(unit, qty) {
    if (!unit) return '';
    if (LANG === 'en') { const e = EN_UNIT_NAMES[unit]; if (e) return qty === 1 ? e[1] : e[0]; }
    return qty === 1 && SINGULAR[unit] ? SINGULAR[unit] : unit;
  }
  function unitName(unit) { return unitLabel(unit, 2); }
  const isLatin = (x) => /^[A-Za-z]/.test(x || '');
  function enPlural(name) {
    if (!isLatin(name) || /s$/i.test(name)) return name;
    if (/(x|ch|sh|tomato|potato)$/i.test(name)) return name + 'es';
    if (/[^aeiou]y$/i.test(name)) return name.slice(0, -1) + 'ies';
    return name + 's';
  }
  function warnText(code) {
    const T = {
      meal_no_date: ['ארוחה בלי תאריך לפניה', 'Meal with no date before it'],
      before_date: ['שורה לפני התאריך הראשון', 'Line before the first date'],
      no_meal: ['לא זוהתה ארוחה. נשמר כהערה', 'No meal heading. Saved as a note'],
    }[code];
    return T ? T[LANG === 'en' ? 1 : 0] : code;
  }

  // Hebrew amounts: "חצי כוס", "כוס וחצי", "שלושת רבעי כוס", "2 כוסות וחצי", "3 משולשי עוף"
  function heAmount(q, unit) {
    const S = SINGULAR[unit] || unit;
    const C = CONSTRUCT[unit] || unit;
    const SC = { 'פרוסה': 'פרוסת', 'חתיכה': 'חתיכת', 'קערה': 'קערת', 'מנה': 'מנת', 'קופסה': 'קופסת', 'יחידה': 'יחידת' }[S] || S; // "פרוסת לחם"
    const whole = Math.floor(q + 1e-9), frac = Math.round((q - whole) * 100) / 100;
    const fracWord = { 0.5: 'וחצי', 0.25: 'ורבע', 0.75: 'ושלושה רבעים' }[frac];
    if (q === 1) return SC;
    if (q === 0.5) return `חצי ${SC}`;
    if (q === 0.25) return `רבע ${SC}`;
    if (q === 0.75) return `שלושת רבעי ${SC}`;
    if (whole === 1 && fracWord) return `${S} ${fracWord}`;
    if (whole >= 2 && fracWord) return `${whole} ${unit} ${fracWord}`;
    return `${fmtQty(q)} ${C}`;
  }
  function enNum(q) {
    const whole = Math.floor(q + 1e-9), frac = Math.round((q - whole) * 100) / 100;
    const f = { 0.5: '½', 0.25: '¼', 0.75: '¾' }[frac];
    if (f) return (whole ? whole : '') + f;
    return String(Math.round(q * 100) / 100);
  }
  /** The amount part and the food part, e.g. ["חצי כוס", "חלב"]. */
  function formatParts(it) {
    const en = LANG === 'en';
    const q = it.qty;
    const plural = (n) => (PLURALS[n] || (isLatin(n) ? enPlural(n) : null)) || n;
    if (it.unit && AFTER_UNITS.has(it.unit)) {
      return ['', q == null ? it.name : `${it.name} ${en ? enNum(q) : fmtQty(q)} ${unitLabel(it.unit, q <= 1 ? 1 : 2)}`];
    }
    if (q != null && it.unit) {
      if (en) { const ul = unitLabel(it.unit, q <= 1 ? 1 : 2); return [`${enNum(q)} ${ul}${ul === 'g' ? '' : ' of'}`, it.name]; }
      return [heAmount(q, it.unit), it.name];
    }
    if (q == null || q === 1) return ['', it.name];
    if (en) return [enNum(q), q > 1 ? plural(it.name) : it.name];
    if (q === 0.5) return ['חצי', it.name];
    if (q === 0.25) return ['רבע', it.name];
    if (q === 0.75) return ['שלושת רבעי', it.name];
    if (q === 1.5) return ['', `${it.name} וחצי`];
    return [fmtQty(q), plural(it.name)];
  }
  function formatItem(it, opts) {
    opts = opts || {};
    const en = LANG === 'en';
    const [a, b] = formatParts(it);
    let s = a ? `${a} ${b}` : b;
    if (!opts.short) {
      if (it.with && it.with.length) s += (en ? ' with ' : ' עם ') + joinVav(it.with);
      if (it.note) s += ' ' + it.note;
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  function joinVav(list) {
    return list.join(LANG === 'en' ? ' and ' : ' ו');
  }

  function weekdayName(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return (LANG === 'en' ? WEEKDAYS_EN : WEEKDAYS_HE)[new Date(y, m - 1, d).getDay()];
  }
  function displayDate(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function dayToText(iso, day) {
    const en = LANG === 'en';
    const out = [`${displayDate(iso)} - ${en ? '' : 'יום '}${weekdayName(iso)}`];
    for (const k of MEALS) {
      const items = (day.meals && day.meals[k]) || [];
      if (!items.length && !(day.mealNotes && day.mealNotes[k])) continue;
      let line = `• ${MEAL_LABELS[k]}: ` + items.map(it => formatItem(it)).join(', ');
      if (day.mealNotes && day.mealNotes[k]) line += ` (${day.mealNotes[k]})`;
      out.push(line);
    }
    if (day.waterMl) {
      const l = Math.round(day.waterMl / 10) / 100;
      out.push(en ? `• Water: ${l} L` : `• מים: ${l} ליטר`);
    } else if (day.water) out.push(en ? `• Water: ${day.water} glasses` : `• מים: ${day.water} כוסות`);
    if (day.weightKg) out.push(en ? `• Weight: ${day.weightKg} kg` : `• משקל: ${day.weightKg} ק״ג`);
    if (day.gymText || day.gymTitle) {
      const t = day.gymTitle ? ` (${day.gymTitle})` : '';
      out.push((en ? `• Workout${t}: ` : `• אימון${t}: `) + (day.gymText || ''));
    }
    if (day.note) out.push(en ? `• Notes: ${day.note}` : `• הערות: ${day.note}`);
    return out.join('\n');
  }

  const api = { formatParts, setLang, unitName, warnText, joinVav, MEALS, MEAL_LABELS, tokenize, parseItems, parseDiary, formatItem, fmtQty, unitLabel, dayToText, weekdayName, displayDate, isoDate };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Parser = api;
})(typeof window !== 'undefined' ? window : globalThis);
