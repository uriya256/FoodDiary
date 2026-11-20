// Turns free Hebrew text like the user's daily notes into structured meals and items.
'use strict';

(function (root) {
  const F = (typeof module !== 'undefined') ? require('./foods.js') : root.Foods;
  const { ATTACH_CATS, ATTACH_NAMES, PLURALS, CONSTRUCT, COMPOSITE, NUM_WORDS, UNITS_RAW, AFTER_UNITS, FILLER, normKey } = F;

  const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
  const MEAL_LABELS = { breakfast: 'בוקר', lunch: 'צהריים', dinner: 'ערב', snack: 'ביניים' };
  const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
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
      .replace(/(\d)([א-ת])/g, '$1 $2')
      .replace(/([א-ת])(\d)/g, '$1 $2')
      .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (m, a, b) => String(+a / +b))
      .replace(/½/g, ' 0.5 ')
      .replace(/[()[\]{}!?:•*]/g, ' ')
      .replace(/([,;+|\n–—])/g, ' , ')
      .replace(/(\S)\.(\s|$)/g, '$1 , ')
      .replace(/\s-\s/g, ' , ');
    return s.split(/\s+/).filter(Boolean).map(t => (t === '\n' ? ',' : t));
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
    const u = UNITS_RAW[t];
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
    let cur = null, mode = 'normal', pQty = null, pUnit = null, conj = false, adjacent = false;

    const start = (name, known) => {
      cur = { name, qty: pQty, unit: pUnit, with: [], note: '', known };
      items.push(cur);
      pQty = null; pUnit = null; mode = 'normal'; conj = false; adjacent = true;
    };

    for (let i = 0; i < tok.length; i++) {
      const t = tok[i];
      const next = tok[i + 1];
      if (SEP.has(t)) { cur = null; mode = 'normal'; conj = false; adjacent = false; continue; }
      if (t === 'ו') { conj = true; adjacent = false; continue; }
      if (t === 'עם' || t === 'ועם') { if (cur) mode = 'with'; adjacent = false; conj = false; continue; }
      if (t === 'ללא' || t === 'בלי' || t === 'וללא' || t === 'ובלי') {
        if (cur) { mode = 'without'; cur.note = (cur.note ? cur.note + ', ' : '') + 'ללא'; }
        adjacent = false; continue;
      }
      if (FILLER.has(t)) { adjacent = false; continue; }
      const sv = stripVav(t);
      if (sv && FILLER.has(sv)) { conj = true; adjacent = false; continue; }

      const num = parseNum(t);
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
        if (mode === 'with' && cur && pQty == null && (ATTACH_CATS.has(cat) || ATTACH_NAMES.has(m.name))) {
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
          const rest = dm[4].replace(/^[\s\-–—,]*(יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)?[\s\-–—,:]*/, '').trim();
          if (rest) lines.splice(li + 1, 0, rest);
          continue;
        }
      }
      const mm = line.match(MEAL_RE);
      if (mm) {
        if (!day) {
          if (opts.defaultDate) newDay(opts.defaultDate);
          else { warnings.push({ line, msg: 'ארוחה בלי תאריך לפניה' }); continue; }
        }
        meal = MEAL_MAP[mm[1]];
        const rest = (mm[2] || '').trim();
        if (rest) day.raw[meal] = day.raw[meal] ? day.raw[meal] + ' , ' + rest : rest;
        else if (!day.raw[meal]) day.raw[meal] = '';
        continue;
      }
      if (/^יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)\s*$/.test(line)) continue;
      if (!day) {
        if (opts.defaultDate) newDay(opts.defaultDate);
        else { warnings.push({ line, msg: 'שורה לפני התאריך הראשון' }); continue; }
      }
      if (!meal) {
        day.note = day.note ? day.note + '\n' + line : line;
        warnings.push({ line, date: day.date, msg: 'לא זוהתה ארוחה. נשמר כהערה' });
        continue;
      }
      const joiner = /^ו/.test(line) ? ' ' : ' , ';
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
    if (q === 0.5) return 'חצי';
    if (q === 0.25) return 'רבע';
    return String(Math.round(q * 100) / 100);
  }

  function unitLabel(unit, qty) {
    if (!unit) return '';
    return qty === 1 && SINGULAR[unit] ? SINGULAR[unit] : unit;
  }

  function formatItem(it, opts) {
    opts = opts || {};
    let s;
    const q = fmtQty(it.qty);
    if (it.unit && AFTER_UNITS.has(it.unit)) s = `${it.name} ${q} ${unitLabel(it.unit, it.qty)}`.trim();
    else if (it.qty != null && it.unit) {
      const ul = unitLabel(it.unit, it.qty);
      s = it.qty === 1 ? `${ul} ${it.name}` : `${q} ${CONSTRUCT[ul] || ul} ${it.name}`;
    }
    else if (it.qty != null && it.qty !== 1) s = `${q} ${(it.qty > 1 && PLURALS[it.name]) || it.name}`;
    else s = it.name;
    if (!opts.short) {
      if (it.with && it.with.length) s += ' עם ' + joinVav(it.with);
      if (it.note) s += ' ' + it.note;
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  function joinVav(list) {
    return list.join(' ו');
  }

  function weekdayName(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return WEEKDAYS[new Date(y, m - 1, d).getDay()];
  }
  function displayDate(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function dayToText(iso, day) {
    const out = [`${displayDate(iso)} - יום ${weekdayName(iso)}`];
    for (const k of MEALS) {
      const items = (day.meals && day.meals[k]) || [];
      if (!items.length && !(day.mealNotes && day.mealNotes[k])) continue;
      let line = `• ${MEAL_LABELS[k]}: ` + items.map(it => formatItem(it)).join(', ');
      if (day.mealNotes && day.mealNotes[k]) line += ` (${day.mealNotes[k]})`;
      out.push(line);
    }
    if (day.water) out.push(`• מים: ${day.water} כוסות`);
    if (day.note) out.push(`• הערות: ${day.note}`);
    return out.join('\n');
  }

  const api = { joinVav, MEALS, MEAL_LABELS, WEEKDAYS, tokenize, parseItems, parseDiary, formatItem, fmtQty, unitLabel, dayToText, weekdayName, displayDate, isoDate };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Parser = api;
})(typeof window !== 'undefined' ? window : globalThis);
