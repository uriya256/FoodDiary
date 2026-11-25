/* =============================================================================
 * Supermarket products: pick the product you actually ate (from Open Food Facts,
 * products sold in Israel), so the food's calories follow the product's label.
 * The list (products.js) is bundled with the app and works offline.
 * ========================================================================== */
'use strict';

const MKT = { rows: null, keys: null, v: '', q: '', q0: '', alts: [], food: '', from: 'edit', pick: null, g: null, always: true, failed: false };

/** Text for matching: no niqqud, quotes or final letters, so "קוטג׳" finds "קוטג'". */
function mktNorm(s) {
  return String(s || '').toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׳״'"`´]/g, '')
    .replace(/[ךםןףץ]/g, ch => ({ 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' })[ch])
    .replace(/יי/g, 'י').replace(/וו/g, 'ו')
    .replace(/[^0-9a-zא-ת%]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
/** "גבינה" also finds "גבינת", "עוגיות" also finds "עוגייה". */
function mktStem(t) {
  if (/[א-ת]/.test(t)) {
    if (t.length >= 5 && /(ימ|ות)$/.test(t)) return t.slice(0, -2);
    if (t.length >= 4 && /[הת]$/.test(t)) return t.slice(0, -1);
  }
  return t;
}

/** Loads the product list once (it is big, so only when it is first needed). */
function loadProducts(cb) {
  if (MKT.rows) { cb(true); return; }
  const done = () => {
    const d = window.PRODUCTS;
    if (!d || !Array.isArray(d.rows) || !d.rows.length) { MKT.failed = true; cb(false); return; }
    MKT.v = d.v || ''; MKT.rows = d.rows;
    MKT.keys = d.rows.map(r => ' ' + mktNorm(r[1] + ' ' + r[2]) + ' ');
    cb(true);
  };
  if (window.PRODUCTS) { done(); return; }
  const s = document.createElement('script');
  s.src = 'products.js';
  s.onload = done;
  s.onerror = () => { MKT.failed = true; cb(false); };
  document.head.appendChild(s);
}

/**
 * Row numbers of the products that match, best first (the list is already ordered by how often people scan them):
 * full = every word found, part = only some of them.
 */
function mktSearch(q) {
  const toks = mktNorm(q).split(' ').filter(Boolean).map(mktStem);
  if (!toks.length || !MKT.rows) return { full: [], part: [] };
  const n = MKT.rows.length, out = [];
  for (let i = 0; i < n; i++) {
    const key = MKT.keys[i];
    let hit = 0, word = 0;
    for (const t of toks) {
      const j = key.indexOf(t);
      if (j < 0) continue;
      hit++;
      if (key[j - 1] === ' ') word++;
    }
    if (!hit) continue;
    const score = (hit === toks.length ? 1000 : hit * 100) + word * 20 + (key.startsWith(' ' + toks[0]) ? 30 : 0) - (i / n) * 25;
    out.push([score, i]);
  }
  out.sort((a, b) => b[0] - a[0]);
  return { full: out.filter(x => x[0] >= 900).slice(0, 60).map(x => x[1]), part: out.filter(x => x[0] < 900).slice(0, 30).map(x => x[1]) };
}
/** Several names for the same food ("גבינה לבנה", "קוטג׳"): products matching any of them, in turn. */
function mktSearchMany(qs) {
  const seen = new Set(), full = [];
  for (const q of qs) for (const i of mktSearch(q).full) if (!seen.has(i)) { seen.add(i); full.push(i); }
  return { full: full.slice(0, 60), part: full.length ? [] : mktSearch(qs[0]).part };
}
/** What the user wrote, the food's name and its other names. */
function mktAlts(food, said) {
  const out = [said, LANG === 'en' && NU.NUT_EN[food] ? NU.NUT_EN[food] : null, food];
  try { const A = lex().aliases; for (const k in A) if (A[k] === food && k.length > 1) out.push(k); } catch (e) { }
  const seen = new Set();
  return out.filter(x => { if (!x) return false; const n = mktNorm(x); if (!n || seen.has(n)) return false; seen.add(n); return true; }).slice(0, 8);
}

/** The product chosen for an item: for this item only, or always for this food. */
function prodOf(it) {
  if (!it) return null;
  if (it.prod) return Object.assign({ only: true }, it.prod);
  const r = resolveFood(it.name);
  const x = r && db.nut && db.nut[r.name];
  return x && x.prod ? Object.assign({ k: x.k, p: x.p, c: x.c, f: x.f, g: x.g }, x.prod) : null;
}
function prodLabel(p) { return esc(p.n) + (p.b ? ` · ${esc(p.b)}` : ''); }

/* ---------- the picker ---------- */
/** from: 'edit' (the item being edited) or 'nut' (the food's values); said = the words the user wrote. */
function openMarket(food, from, said) {
  MKT.food = food; MKT.from = from; MKT.pick = null; MKT.g = null; MKT.always = true;
  // first show products for every name of the food (English names search by the Hebrew one, since products are named in Hebrew)
  MKT.alts = mktAlts(food, said);
  MKT.q = MKT.q0 = MKT.alts[0] || food;
  openSheet('market', mktLoadingHtml(), { title: tr('מוצר מהסופר', 'Supermarket product'), full: true });
  loadProducts(() => { replaceSheetBody('market', mktHtml()); });
}
function mktLoadingHtml() {
  return sheetHead(tr('מוצר מהסופר', 'Supermarket product')) + `<div class="body"><div class="muted" style="padding:24px 0;text-align:center">${tr('טוען את רשימת המוצרים…', 'Loading the product list…')}</div></div>`;
}
function mktHtml() {
  const head = sheetHead(tr('מוצר מהסופר', 'Supermarket product'));
  if (!MKT.rows) return head + `<div class="body"><p>${tr('רשימת המוצרים לא נמצאה בגרסה הזאת של האפליקציה. אפשר עדיין להזין ערכים ידנית מהתווית.', "The product list isn't in this version of the app. You can still type the values from the label.")}</p></div>`;
  if (MKT.pick != null) return head + mktPickHtml();
  return head + `<div class="body">
    <div class="small muted">${tr(`בשביל: ${esc(MKT.food)}`, `For: ${esc(MKT.food)}`)}</div>
    <label class="field"><span>${tr('חיפוש מוצר', 'Search for a product')}</span><input type="search" data-on="mktQ" value="${esc(MKT.q)}" placeholder="${tr('שם המוצר או החברה, למשל: קוטג׳ תנובה', 'Product or brand, e.g. cottage Tnuva')}" autocomplete="off" enterkeyhint="search"></label>
    <div id="mktList">${mktListHtml()}</div>
    <p class="small muted" style="margin:0">${tr(`הערכים ל-100 גרם, מהמאגר הפתוח Open Food Facts (משתמשים מעתיקים אותם מהתוויות, אז כדאי להציץ בתווית אם משהו נראה מוזר). ${MKT.rows.length.toLocaleString('he-IL')} מוצרים שנמכרים בישראל${MKT.v ? `, מעודכן ל-${shortDate(MKT.v)}` : ''}.`, `Values per 100 g, from the open Open Food Facts database (people copy them from labels, so check the label if something looks odd). ${MKT.rows.length.toLocaleString('en-US')} products sold in Israel${MKT.v ? `, as of ${shortDate(MKT.v)}` : ''}.`)}</p>
  </div>`;
}
function mktListHtml() {
  if (!mktNorm(MKT.q)) return `<div class="muted small" style="padding:10px 0">${tr('כתוב שם של מוצר.', 'Type a product name.')}</div>`;
  const res = MKT.q === MKT.q0 ? mktSearchMany(MKT.alts) : mktSearch(MKT.q);
  const hits = res.full.length ? res.full : res.part;
  if (!hits.length) return `<div class="muted small" style="padding:10px 0">${tr('לא מצאתי מוצר כזה. נסה מילה אחרת או את שם החברה. אם המוצר לא ברשימה, אפשר להזין את הערכים מהתווית.', "No product like that. Try another word or the brand. If it isn't in the list, you can type the values from the label.")}</div>`;
  const g = tr('ג׳', 'g');
  return `${res.full.length ? '' : `<div class="small muted" style="padding:4px 0 6px">${tr('לא מצאתי בדיוק את זה. אולי אחד מאלה:', "Nothing exactly like that. Maybe one of these:")}</div>`}<div class="list mktlist">${hits.map(i => {
    const r = MKT.rows[i];
    const sub = [r[2], r[3]].filter(Boolean).map(esc).join(' · ');
    return `<button class="li" data-act="mktPick" data-i="${i}">
      <span class="grow"><span class="t">${esc(r[1])}</span>${sub ? `<br><span class="s">${sub}</span>` : ''}<br><span class="s">${tr('חלבון', 'Protein')} ${r[6]} · ${tr('פחמימות', 'Carbs')} ${r[7]} · ${tr('שומן', 'Fat')} ${r[8]} ${g}</span></span>
      <span class="mkcal"><b>${r[5]}</b><span>${tr('קק״ל ל-100 ג׳', 'kcal/100 g')}</span></span></button>`;
  }).join('')}</div>`;
}
/** How many grams one unit weighs: the label's serving, else what the food already used. */
function mktDefaultG(r) {
  if (r[4]) return r[4];
  const f = resolveFood(MKT.food);
  const n = f && NU.nutFor(f.name, f.cat, db.nut || {});
  return n ? Math.round(n.piece || n.serving || 100) : 100;
}
function mktPickHtml() {
  const r = MKT.rows[MKT.pick];
  if (MKT.g == null) MKT.g = mktDefaultG(r);
  const g = tr('ג׳', 'g');
  const fromEdit = MKT.from === 'edit' && EDIT.it;
  return `<div class="body">
    <div class="mktsel"><b>${esc(r[1])}</b>${r[2] || r[3] ? `<div class="small muted">${[r[2], r[3]].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
      <div class="small" style="margin-top:6px">${tr('ל-100 גרם', 'Per 100 g')}: <b>${r[5]}</b> ${tr('קק״ל', 'kcal')} · ${tr('חלבון', 'Protein')} ${r[6]} · ${tr('פחמימות', 'Carbs')} ${r[7]} · ${tr('שומן', 'Fat')} ${r[8]} ${g}</div></div>
    <label class="field"><span>${tr('משקל של יחידה אחת (גרם)', 'Weight of one unit (g)')}</span><input class="gnum" type="number" inputmode="decimal" min="1" step="any" data-on="mktG" value="${MKT.g}"></label>
    <div class="small muted">${tr('גביע, פרוסה, חטיף או מנה אחת. זה מה שנספר כשכותבים את המאכל בלי כמות, וכל אחת כשכותבים מספר. מאכל שכתבת בגרמים נספר לפי הגרמים.', 'One cup, slice, bar or serving. It counts when you write the food without an amount, and each one when you write a number. Foods written in grams count by the grams.')}</div>
    ${fromEdit ? `<div class="enut" id="mktNow">${mktNowHtml()}</div>
    <label class="row chkrow"><input type="checkbox" data-on="mktAlways" ${MKT.always ? 'checked' : ''}><span>${tr(`להשתמש במוצר הזה תמיד ל"${esc(MKT.food)}", גם בימים קודמים`, `Always use this product for "${esc(MKT.food)}", past days included`)}</span></label>` : `<div class="small muted">${tr(`המוצר ישמש בכל פעם שכתוב "${esc(MKT.food)}", גם בימים קודמים.`, `The product will be used every time "${esc(MKT.food)}" is written, past days included.`)}</div>`}
  </div>
  <footer><button class="btn" data-act="mktBack">${tr('לרשימה', 'Back to list')}</button><button class="btn primary grow" data-act="mktUse">${tr('בחירה', 'Choose')}</button></footer>`;
}
function mktProd() {
  const r = MKT.rows[MKT.pick];
  return { code: r[0], n: r[1], b: r[2], k: r[5], p: r[6], c: r[7], f: r[8], g: MKT.g > 0 ? Math.round(MKT.g * 10) / 10 : 0 };
}
/** What the item being edited comes to with the chosen product. */
function mktNowHtml() {
  const it = Object.assign({}, EDIT.it, { prod: mktProd() });
  const x = itemN(it);
  return `<span class="grow">${tr('ברישום הזה', 'In this entry')}: ≈ <b>${kc(x.k)}</b> ${tr('קק״ל', 'kcal')} · ${tr('חלבון', 'Protein')} ${gr(x.p)} · ${tr('פחמימות', 'Carbs')} ${gr(x.c)} · ${tr('שומן', 'Fat')} ${gr(x.f)} ${tr('ג׳', 'g')} <span class="muted">(${Math.round(x.g)} ${tr('ג׳', 'g')})</span></span>`;
}
function mktAfterChange() {
  nutInvalidate(); save();
  if (sheetStack.find(s => s.id === 'nutedit')) replaceSheetBody('nutedit', nutEditHtml());
  if (sheetStack.find(s => s.id === 'nutday')) replaceSheetBody('nutday', nutDayHtml());
  if (sheetStack.find(s => s.id === 'foods')) replaceSheetBody('foods', foodsHtml());
  if (sheetStack.find(s => s.id === 'edit')) { const b = $('#eProd'); if (b) b.outerHTML = editProdHtml(); }
  refreshEditNut();
  render({ keepScroll: true });
}
/** The product line in the item editor. */
function editProdHtml() {
  const it = EDIT.it;
  if (!it || !it.name) return '<div id="eProd"></div>';
  const p = prodOf(it);
  const r = resolveFood(it.name);
  const food = r ? r.name : it.name;
  return `<div id="eProd" class="eprod">${p ? `<span class="grow small">${icon('cart', 16)} ${prodLabel(p)}${p.only ? '' : ` <span class="muted">(${tr('תמיד', 'always')})</span>`}</span>
      <button class="btn" data-act="openMarket" data-name="${esc(food)}" data-from="edit" data-said="${esc(it.said || '')}">${tr('החלפה', 'Change')}</button>
      ${p.only ? `<button class="iconbtn plain" data-act="eProdOff" aria-label="${tr('בלי המוצר', 'Without the product')}">${icon('x', 18)}</button>` : ''}`
    : `<button class="btn block" data-act="openMarket" data-name="${esc(food)}" data-from="edit" data-said="${esc(it.said || '')}">${icon('cart', 18)}${tr('בחירת מוצר מהסופר', 'Pick a supermarket product')}</button>`}</div>`;
}

const MKT_ACT = {
  openMarket(el) { openMarket(el.dataset.name, el.dataset.from || 'nut', el.dataset.said || ''); },
  mktPick(el) { MKT.pick = +el.dataset.i; MKT.g = null; replaceSheetBody('market', mktHtml()); },
  mktBack() { MKT.pick = null; replaceSheetBody('market', mktHtml()); const i = $('#sheets [data-on="mktQ"]'); if (i) i.focus(); },
  mktUse() {
    const prod = mktProd();
    if (MKT.from === 'nut' || MKT.always || !EDIT.it) {
      db.nut = db.nut || {};
      const e = { k: prod.k, p: prod.p, c: prod.c, f: prod.f, gk: 'piece', prod: { code: prod.code, n: prod.n, b: prod.b } };
      if (prod.g) e.g = prod.g;
      db.nut[MKT.food] = e;
      if (MKT.from === 'edit' && EDIT.it) delete EDIT.it.prod;
      toast(tr(`"${MKT.food}" נספר מעכשיו לפי ${prod.n}`, `"${MKT.food}" now counts as ${prod.n}`));
    } else {
      EDIT.it.prod = prod;
      toast(tr('המוצר נבחר. לא לשכוח לשמור את הפריט.', "Product chosen. Don't forget to save the item."));
    }
    closeSheet();
    mktAfterChange();
  },
  eProdOff() { if (EDIT.it) delete EDIT.it.prod; mktAfterChange(); },
  nutProdOff() {
    const r = resolveFood(NUTED.name) || { name: NUTED.name };
    const x = db.nut && db.nut[r.name];
    if (x && x.prod) delete db.nut[r.name];
    mktAfterChange();
  },
};
const MKT_ON = {
  mktQ(el) { MKT.q = el.value; clearTimeout(MKT.t); MKT.t = setTimeout(() => { const l = $('#mktList'); if (l) l.innerHTML = mktListHtml(); }, 180); },
  mktG(el) { const v = parseFloat(String(el.value).replace(',', '.')); MKT.g = v > 0 ? v : null; const b = $('#mktNow'); if (b && MKT.g) b.innerHTML = mktNowHtml(); },
  mktAlways(el) { MKT.always = el.checked; },
};
