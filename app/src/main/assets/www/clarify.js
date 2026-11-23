'use strict';
/* "What did you mean?" for general words like כריך, ביצה, גבינה: the app asks once, offers sensible options,
   and can remember the answer so it never asks about that word again. Loaded before app.js. */

// he / en: the food each option turns into; unit + per: e.g. a sandwich in bread = 2 slices per sandwich;
// add: something that goes with it ("coffee with milk").
const AMBIG = {
  sandwich: {
    words: ['כריך', 'כריכים', 'סנדוויץ׳', "סנדוויץ'", 'סנדוויץ', 'sandwich', 'sandwiches'],
    q: ['באיזה לחם היה הכריך?', 'What bread was the sandwich in?'], fill: true,
    opts: [
      { he: 'לחמנייה', en: 'roll', label: ['בלחמנייה', 'In a roll'] },
      { he: 'לחם', en: 'bread', unit: 'פרוסות', per: 2, label: ['2 פרוסות לחם', '2 slices of bread'] },
      { he: 'לחם מלא', en: 'whole wheat bread', unit: 'פרוסות', per: 2, label: ['2 פרוסות לחם מלא', '2 slices whole wheat'] },
      { he: 'פיתה', en: 'pita', label: ['בפיתה', 'In a pita'] },
      { he: 'באגט', en: 'baguette', unit: 'חתיכות', per: 1, label: ['בבאגט', 'In a baguette'] },
      { he: 'טוסט', en: 'toast', label: ['טוסט', 'Toasted sandwich'] },
    ],
  },
  egg: {
    words: ['ביצה', 'ביצים', 'egg', 'eggs'],
    q: ['איך הייתה הביצה?', 'How was the egg made?'],
    opts: [
      { he: 'ביצה קשה', en: 'hard-boiled egg', label: ['קשה', 'Hard-boiled'] },
      { he: 'ביצה רכה', en: 'soft-boiled egg', label: ['רכה', 'Soft-boiled'] },
      { he: 'ביצת עין', en: 'fried egg', label: ['ביצת עין', 'Fried'] },
      { he: 'חביתה', en: 'omelette', unit: 'ביצים', per: 1, label: ['חביתה', 'Omelette'] },
      { he: 'ביצה מקושקשת', en: 'scrambled eggs', label: ['מקושקשת', 'Scrambled'] },
    ],
  },
  cheese: {
    words: ['גבינה', 'גבינות', 'cheese'],
    q: ['איזו גבינה?', 'Which cheese?'],
    opts: [
      { he: 'גבינה צהובה', en: 'cheese', label: ['צהובה', 'Yellow'] },
      { he: 'גבינה לבנה', en: 'cottage cheese', label: ['לבנה / קוטג׳', 'White / cottage'] },
      { he: 'גבינה בולגרית', en: 'feta', label: ['בולגרית / פטה', 'Feta'] },
    ],
  },
  coffee: {
    words: ['קפה', 'coffee'],
    q: ['איזה קפה?', 'What kind of coffee?'],
    opts: [
      { he: 'קפה', en: 'coffee', label: ['שחור', 'Black'] },
      { he: 'קפה', en: 'coffee', add: ['חלב', 'milk'], label: ['עם קצת חלב', 'With a little milk'] },
      { he: 'הפוך', en: 'cappuccino', label: ['הפוך', 'Cappuccino / latte'] },
    ],
  },
  bread: {
    words: ['לחם', 'bread'],
    q: ['איזה לחם?', 'What bread?'],
    opts: [
      { he: 'לחם', en: 'bread', label: ['לבן', 'White'] },
      { he: 'לחם מלא', en: 'whole wheat bread', label: ['מלא / דגנים', 'Whole wheat'] },
      { he: 'לחם קל', en: 'light bread', label: ['לחם קל', 'Light bread'] },
    ],
  },
  chicken: {
    words: ['עוף', 'chicken'],
    q: ['איזה עוף?', 'What chicken?'],
    opts: [
      { he: 'חזה עוף', en: 'chicken breast', label: ['חזה', 'Breast'] },
      { he: 'פרגית', en: 'chicken thigh', label: ['פרגית', 'Thigh'] },
      { he: 'שניצל', en: 'schnitzel', label: ['שניצל', 'Schnitzel'] },
      { he: 'עוף', en: 'chicken', label: ['בתנור / מעורב', 'Roast / mixed'] },
    ],
  },
  tuna: {
    words: ['טונה', 'קופסת טונה', 'tuna'],
    q: ['איזו טונה?', 'What tuna?'],
    opts: [
      { he: 'טונה במים', en: 'tuna in water', label: ['במים', 'In water'] },
      { he: 'טונה בשמן', en: 'tuna in oil', label: ['בשמן', 'In oil'] },
    ],
  },
};
const AMB_WORD = {};
Object.keys(AMBIG).forEach(k => AMBIG[k].words.forEach(w => { AMB_WORD[ambNorm(w)] = k; }));

function ambNorm(s) { return String(s || '').trim().toLowerCase().replace(/[׳’]/g, "'").replace(/^ו-?(?=[א-ת])/, ''); }
/** The question that fits an item, or null. Only the word as written counts, so "חזה עוף" or "קוטג׳" never ask. */
function ambKeyOf(it) {
  if (!it || !it.name) return null;
  return AMB_WORD[ambNorm(it.said || it.name)] || null;
}
function ambIsEn(it) { return /[a-z]/i.test(it.name) && !/[א-ת]/.test(it.name); }
function ambWord(it) { return it.said || it.name; }
function choices() { if (!db.choices || typeof db.choices !== 'object') db.choices = {}; return db.choices; }

/** Turns the item into the chosen option (keeps amounts, units and what was inside). */
function applyAmb(it, key, oi) {
  const a = AMBIG[key], o = a && a.opts[oi];
  if (!o) return it;
  const en = ambIsEn(it);
  const q = it.qty == null ? null : it.qty;
  it.name = en ? o.en : o.he;
  if (o.unit && !(it.unit && it.unit !== 'ביצים' && o.unit === 'ביצים')) {
    if (it.unit !== o.unit) { it.qty = (q == null ? 1 : q) * (o.per || 1); it.unit = o.unit; }
  }
  if (o.add) {
    const w = en ? o.add[1] : o.add[0];
    it.with = [w].concat((it.with || []).filter(x => x !== w));
  }
  delete it.amb; delete it.said;
  return it;
}
/** For new items: use a remembered answer, or mark the item so the app asks. */
function autoClarify(items, flag) {
  const ch = choices();
  for (const it of items) {
    const key = ambKeyOf(it);
    if (!key) continue;
    if (ch[key] != null && AMBIG[key].opts[ch[key]]) applyAmb(it, key, ch[key]);
    else if (flag) it.amb = key;
  }
  return items;
}

/* ---------- the question sheet ---------- */
const CL = { iso: null, ids: [], picked: {}, remember: {}, fill: {} };
function findItem(iso, id) {
  const d = db.days[iso];
  if (!d) return null;
  for (const m of MEALS) { const i = d.meals[m].findIndex(x => x.id === id); if (i >= 0) return { meal: m, idx: i, it: d.meals[m][i] }; }
  return null;
}
function openClarify(iso, items) {
  const ids = items.filter(it => it.amb).map(it => it.id);
  if (!ids.length) return;
  CL.iso = iso; CL.ids = ids; CL.picked = {}; CL.remember = {}; CL.fill = {};
  openSheet('clarify', clarifyHtml(), {
    title: tr('למה התכוונת?', 'What did you mean?'),
    onClose: () => { save(); if (sheetStack.find(s => s.id === 'add')) replaceSheetBody('add', addSheetHtml()); render({ keepScroll: true }); },
  });
}
function clarifyHtml() {
  let h = sheetHead(tr('למה התכוונת?', 'What did you mean?')) + `<div class="body">
    <p class="small muted" style="margin:0">${tr('כדי שהקלוריות והחלבון יהיו נכונים. אפשר לדלג, ואפשר לבקש שאזכור את התשובה.', 'So the calories and protein are right. You can skip, or have the app remember the answer.')}</p>`;
  for (const id of CL.ids) {
    const f = findItem(CL.iso, id);
    if (!f) continue;
    const it = f.it;
    const picked = CL.picked[id];
    const key = picked ? picked.key : (it.amb || ambKeyOf(it));
    const a = AMBIG[key];
    if (!a) continue;
    const word = picked ? picked.word : ambWord(it);
    h += `<div class="clcard${picked ? ' done' : ''}" data-cl="${id}">
      <div class="row between"><b>${esc(tr(a.q[0], a.q[1]))}</b><span class="small muted">${esc(MEAL[f.meal].label)}</span></div>
      <div class="small muted">${tr('כתבת', 'You wrote')}: <b>${esc(word)}</b>${it.with && it.with.length && !picked ? ` ${tr('עם', 'with')} ${esc(P.joinVav(it.with))}` : ''}${picked ? ` → <b>${esc(P.formatItem(it, { short: true }))}</b>` : ''}</div>
      <div class="chips" style="margin-top:2px">${a.opts.map((o, i) => `<button class="chip${picked && picked.oi === i ? ' sel' : ''}" data-act="clPick" data-id="${id}" data-key="${key}" data-i="${i}">${esc(tr(o.label[0], o.label[1]))}</button>`).join('')}
        ${picked ? '' : `<button class="chip ghost" data-act="clSkip" data-id="${id}">${tr('לא משנה', "Doesn't matter")}</button>`}</div>
      ${a.fill ? `<input class="search" type="text" data-on="clFill" data-id="${id}" value="${esc(CL.fill[id] != null ? CL.fill[id] : (it.with || []).join(', '))}" placeholder="${tr('מה היה בפנים? למשל גבינה צהובה וירקות', 'What was inside? e.g. cheese and vegetables')}">` : ''}
      <label class="clrem"><input type="checkbox" data-on="clRem" data-id="${id}" ${CL.remember[id] ? 'checked' : ''}> ${tr(`לזכור, ולא לשאול שוב על "${esc(word)}"`, `Remember, don't ask about "${esc(word)}" again`)}</label>
    </div>`;
  }
  return h + `</div><footer><button class="btn primary big block" data-act="closeSheet">${tr('סיום', 'Done')}</button></footer>`;
}
function fillToWith(text) {
  return String(text || '').split(/\s*(?:,|،|\sו(?=[א-ת])|\sand\s|\+)\s*/).map(s => s.trim()).filter(Boolean).map(canonical);
}
const CL_ACT = {
  clPick(el) {
    const id = el.dataset.id, key = el.dataset.key, oi = +el.dataset.i;
    const f = findItem(CL.iso, id); if (!f) return;
    const prev = CL.picked[id];
    // picking again starts from what was written
    if (prev) { f.it.name = prev.orig.name; f.it.qty = prev.orig.qty; f.it.unit = prev.orig.unit; f.it.with = prev.orig.with.slice(); f.it.said = prev.orig.said; }
    const orig = prev ? prev.orig : { name: f.it.name, qty: f.it.qty, unit: f.it.unit, with: (f.it.with || []).slice(), said: f.it.said };
    const word = prev ? prev.word : ambWord(f.it);
    applyAmb(f.it, key, oi);
    if (AMBIG[key].fill && CL.fill[id] != null) f.it.with = fillToWith(CL.fill[id]);
    CL.picked[id] = { key, oi, word, orig };
    if (CL.remember[id]) choices()[key] = oi;
    learnFoods([f.it]);
    save();
    replaceSheetBody('clarify', clarifyHtml());
    if (CL.ids.every(x => CL.picked[x] || !findItem(CL.iso, x) || !findItem(CL.iso, x).it.amb)) setTimeout(() => { if (sheetStack.length && sheetStack[sheetStack.length - 1].id === 'clarify' && !AMBIG[key].fill) closeSheet(); }, 450);
  },
  clSkip(el) {
    const f = findItem(CL.iso, el.dataset.id); if (!f) return;
    delete f.it.amb;
    CL.ids = CL.ids.filter(x => x !== el.dataset.id);
    save();
    if (!CL.ids.length) closeSheet(); else replaceSheetBody('clarify', clarifyHtml());
  },
  forgetChoice(el) { delete choices()[el.dataset.key]; save(); render({ keepScroll: true }); },
};
const CL_ON = {
  clFill(el) {
    const id = el.dataset.id; CL.fill[id] = el.value;
    const f = findItem(CL.iso, id);
    if (f && CL.picked[id]) { f.it.with = fillToWith(el.value); saveLater(); }
  },
  clRem(el) {
    const id = el.dataset.id; CL.remember[id] = el.checked;
    const p = CL.picked[id];
    if (p) { if (el.checked) choices()[p.key] = p.oi; else if (choices()[p.key] === p.oi) delete choices()[p.key]; saveLater(); }
  },
};

/* ---------- inside the edit sheet ---------- */
function editAmbHtml(it) {
  const key = ambKeyOf(it);
  if (!key) return '';
  const a = AMBIG[key];
  return `<div class="clcard${it.amb ? '' : ' soft'}">
    <b>${esc(tr(a.q[0], a.q[1]))}</b>
    <div class="chips" style="margin-top:2px">${a.opts.map((o, i) => `<button class="chip" data-act="eAmb" data-key="${key}" data-i="${i}">${esc(tr(o.label[0], o.label[1]))}</button>`).join('')}
      ${it.amb ? `<button class="chip ghost" data-act="eAmbSkip">${tr('לא משנה', "Doesn't matter")}</button>` : ''}</div>
  </div>`;
}
/** The remembered answers, in settings. */
function choicesHtml() {
  const ch = choices();
  const keys = Object.keys(ch).filter(k => AMBIG[k] && AMBIG[k].opts[ch[k]]);
  if (!keys.length) return '';
  return `<div class="field"><span>${tr('פירושים שמורים (בלי לשאול)', 'Remembered answers (no question)')}</span><div class="chips" style="margin-top:2px">${keys.map(k => {
    const a = AMBIG[k], o = a.opts[ch[k]];
    return `<button class="chip" data-act="forgetChoice" data-key="${k}" aria-label="${tr('לשכוח', 'Forget')}">${esc(LANG === 'en' ? a.words.find(w => /[a-z]/.test(w)) : a.words[0])} → ${esc(tr(o.label[0], o.label[1]))} ${icon('x', 14)}</button>`;
  }).join('')}</div></div>`;
}
