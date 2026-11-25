/* =============================================================================
 * Products from the manufacturer's own website: search the company's site inside
 * the app, open the product's page, and the app reads the nutrition table from it
 * (extract.js). The values are checked here before they are used, and can be set for
 * one entry or for the food always.
 * ========================================================================== */
'use strict';

/** Manufacturers whose sites we search (Google, limited to the site). */
const MKT_SITES = [
  { id: 'tnuva', he: 'תנובה', en: 'Tnuva', site: 'tnuva.co.il' },
  { id: 'strauss', he: 'שטראוס / עלית', en: 'Strauss / Elite', site: 'strauss-group.co.il' },
  { id: 'osem', he: 'אסם / נסטלה', en: 'Osem / Nestlé', site: 'osem-nestle.co.il' },
  { id: 'tara', he: 'טרה', en: 'Tara', site: 'tara.co.il' },
  { id: 'angel', he: 'אנג׳ל', en: 'Angel', site: 'angel.co.il' },
];
const MKT = { food: '', from: 'edit', q: '', site: '', other: '', step: 'search', vals: null, always: true, open: false };

function mktSet() { const s = db.settings; if (!s.mkt) s.mkt = { site: 'tnuva.co.il', mine: [] }; if (!s.mkt.mine) s.mkt.mine = []; return s.mkt; }
/** "https://www.berman.co.il/products" -> "berman.co.il" */
function mktDomain(s) {
  const m = String(s || '').trim().toLowerCase().match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})(?:[/:?#]|$)/);
  return m ? m[1] : '';
}
function mktSites() {
  const mine = mktSet().mine.filter(d => !MKT_SITES.some(x => x.site === d)).map(d => ({ id: d, he: d, en: d, site: d, mine: true }));
  return MKT_SITES.concat(mine);
}
function mktSiteName(site) { const x = mktSites().find(s => s.site === site); return x ? tr(x.he, x.en) : site; }

/** The product chosen for an item: for this item only, or always for this food. */
function prodOf(it) {
  if (!it) return null;
  if (it.prod) return Object.assign({ only: true }, it.prod);
  const r = resolveFood(it.name);
  const x = r && db.nut && db.nut[r.name];
  return x && x.prod ? Object.assign({ k: x.k, p: x.p, c: x.c, f: x.f, g: x.g }, x.prod) : null;
}
function prodLabel(p) { return esc(p.n || '') + (p.b ? ` · ${esc(p.b)}` : ''); }

/* ---------- the sheet ---------- */
/** from: 'edit' (the item being edited) or 'nut' (the food's values); said = the words the user wrote. */
function openMarket(food, from, said) {
  MKT.food = food; MKT.from = from; MKT.step = 'search'; MKT.vals = null; MKT.always = true; MKT.other = '';
  MKT.q = said || (LANG === 'en' && NU.NUT_EN[food]) || food;
  MKT.site = mktSet().site || MKT_SITES[0].site;
  openSheet('market', mktHtml(), { title: tr('מוצר מאתר היצרן', "Product from the maker's site"), full: true, onClose: () => { if (MKT.open) mktCloseWeb(); } });
}
function mktHtml() {
  const head = sheetHead(tr('מוצר מאתר היצרן', "Product from the maker's site"));
  return head + (MKT.step === 'confirm' ? mktConfirmHtml() : mktSearchHtml());
}
function mktSearchHtml() {
  const sites = mktSites();
  const other = MKT.site === '*';
  return `<div class="body">
    <div class="small muted">${tr(`בשביל: ${esc(MKT.food)}`, `For: ${esc(MKT.food)}`)}</div>
    <label class="field"><span>${tr('שם המוצר', 'Product name')}</span><input type="search" data-on="mktQ" value="${esc(MKT.q)}" placeholder="${tr('למשל: קוטג׳ 5%', 'e.g. cottage cheese 5%')}" autocomplete="off" enterkeyhint="search"></label>
    <div class="field"><span>${tr('החברה', 'Company')}</span>
      <div class="chips" style="margin-top:2px">${sites.map(s => `<button class="chip${MKT.site === s.site ? ' sel' : ''}" data-act="mktSite" data-v="${esc(s.site)}" aria-pressed="${MKT.site === s.site}">${esc(tr(s.he, s.en))}</button>`).join('')}<button class="chip${other ? ' sel' : ''}" data-act="mktSite" data-v="*" aria-pressed="${other}">${tr('חברה אחרת', 'Another company')}</button></div>
    </div>
    ${other ? `<label class="field"><span>${tr('כתובת האתר של החברה', "The company's website")}</span><input type="url" dir="ltr" data-on="mktOther" value="${esc(MKT.other)}" placeholder="berman.co.il" autocomplete="off" inputmode="url"></label>` : ''}
    <button class="btn primary big block" data-act="mktGo">${icon('globe', 18)}${other ? tr('חיפוש באתר החברה', "Search the company's site") : tr(`חיפוש באתר של ${esc(mktSiteName(MKT.site))}`, `Search ${esc(mktSiteName(MKT.site))}'s site`)}</button>
    <p class="small muted" style="margin:0">${tr('האתר של החברה ייפתח בתוך האפליקציה, רק עם תוצאות מהאתר שלה. פותחים את דף המוצר ולוחצים למטה על "קח את הערכים מהדף". לפני השמירה תוכל לבדוק את המספרים.', "The company's site opens inside the app, with results from that site only. Open the product's page and tap \"Use the values on this page\" at the bottom. You can check the numbers before saving.")}</p>
    <button class="linkbtn" data-act="mktManual">${tr('או להקליד את הערכים מהתווית', 'Or type the values from the label')}</button>
  </div>`;
}
/** Google, limited to the company's site. */
function mktSearchUrl(site, q) {
  q = String(q).replace(/׳/g, "'").replace(/״/g, '"');
  return 'https://www.google.com/search?hl=' + (LANG === 'en' ? 'en' : 'iw') + '&q=' + encodeURIComponent(`site:${site} ${q}`.trim());
}
/** The Windows app (Tauri) opens the site in a second window with the same button. */
const DESK = window.__TAURI__ && window.__TAURI__.core;
function mktOpenWeb(url) {
  MKT.open = true;
  if (A && A.openWeb) A.openWeb(url, LANG, document.documentElement.classList.contains('dark'));
  else if (DESK) DESK.invoke('open_web', { url, lang: LANG }).catch(e => toast(String(e)));
  else window.open(url, '_blank'); // while developing in a browser
}
function mktCloseWeb() { MKT.open = false; if (A && A.closeWeb) A.closeWeb(); else if (DESK) DESK.invoke('close_web').catch(() => { }); }
function mktMsg(t) { if (A && A.webMessage) A.webMessage(t); else if (DESK) DESK.invoke('web_message', { text: t }).catch(() => toast(t)); else toast(t); }

/** The browser in the app sends what it read from the page. */
window.onWebValues = (s) => {
  let v = null;
  try { v = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { v = null; }
  const have = v ? ['k', 'p', 'c', 'f'].filter(k => v[k] != null).length : 0;
  if (!v || have < 3) {
    mktMsg(tr('לא מצאתי בדף הזה טבלת ערכים תזונתיים. פתח את הדף של המוצר עצמו (אם הטבלה בלשונית סגורה, פתח אותה) ונסה שוב.', "I couldn't find a nutrition table on this page. Open the product's own page (open the tab with the table if it's closed) and try again."));
    return;
  }
  mktCloseWeb();
  MKT.vals = { n: v.name || MKT.q, b: mktSiteName(v.host || MKT.site), site: v.host || MKT.site, url: v.url || '', k: v.k, p: v.p, c: v.c, f: v.f, g: v.g || null, missing: 4 - have };
  MKT.step = 'confirm';
  replaceSheetBody('market', mktHtml());
};
window.onWebClosed = () => { MKT.open = false; };

/** How many grams one unit weighs: the label's serving, else what the food already used. */
function mktDefaultG() {
  const f = resolveFood(MKT.food);
  const n = f && NU.nutFor(f.name, f.cat, db.nut || {});
  return n ? Math.round(n.piece || n.serving || 100) : 100;
}
function mktConfirmHtml() {
  const v = MKT.vals;
  if (v.g == null) v.g = mktDefaultG();
  const fromEdit = MKT.from === 'edit' && EDIT.it;
  const field = (k, label, grow = ' grow') => `<label class="field${grow}"><span>${label}</span><input class="gnum" type="number" inputmode="decimal" min="0" step="any" data-on="mktVal" data-k="${k}" value="${v[k] == null ? '' : v[k]}"></label>`;
  return `<div class="body">
    ${v.missing ? `<div class="small warn-t">${tr('לא מצאתי בדף את כל הערכים. השלם את החסר מהתווית.', "Not every value was on the page. Fill in what's missing from the label.")}</div>` : v.url ? `<div class="small muted">${tr(`הערכים נקראו מהאתר ${esc(v.site)}. כדאי לוודא שהם ל-100 גרם.`, `Values read from ${esc(v.site)}. Check that they are per 100 g.`)}</div>` : ''}
    <label class="field"><span>${tr('שם המוצר', 'Product name')}</span><input type="text" data-on="mktVal" data-k="n" value="${esc(v.n || '')}"></label>
    <div class="small muted" style="margin-bottom:-4px">${tr('ל-100 גרם', 'Per 100 g')}</div>
    ${field('k', tr('קלוריות', 'Calories'), '')}
    <div class="row" style="gap:8px">${field('p', tr('חלבון (ג׳)', 'Protein (g)'))}${field('c', tr('פחמימות (ג׳)', 'Carbs (g)'))}${field('f', tr('שומן (ג׳)', 'Fat (g)'))}</div>
    <label class="field"><span>${tr('משקל של יחידה אחת (גרם)', 'Weight of one unit (g)')}</span><input class="gnum" type="number" inputmode="decimal" min="1" step="any" data-on="mktVal" data-k="g" value="${v.g}"></label>
    <div class="small muted">${tr('גביע, פרוסה, חטיף או מנה אחת. זה מה שנספר כשכותבים את המאכל בלי כמות, וכל אחת כשכותבים מספר. מאכל שכתבת בגרמים נספר לפי הגרמים.', 'One cup, slice, bar or serving. It counts when you write the food without an amount, and each one when you write a number. Foods written in grams count by the grams.')}</div>
    ${fromEdit ? `<div class="enut" id="mktNow">${mktNowHtml()}</div>
    <label class="row chkrow"><input type="checkbox" data-on="mktAlways" ${MKT.always ? 'checked' : ''}><span>${tr(`להשתמש במוצר הזה תמיד ל"${esc(MKT.food)}", גם בימים קודמים`, `Always use this product for "${esc(MKT.food)}", past days included`)}</span></label>` : `<div class="small muted">${tr(`המוצר ישמש בכל פעם שכתוב "${esc(MKT.food)}", גם בימים קודמים.`, `The product will be used every time "${esc(MKT.food)}" is written, past days included.`)}</div>`}
  </div>
  <footer><button class="btn" data-act="mktAgain">${tr('חיפוש אחר', 'Search again')}</button><button class="btn primary grow" data-act="mktUse">${tr('בחירה', 'Choose')}</button></footer>`;
}
function mktProd() {
  const v = MKT.vals, r1 = (x) => Math.round((+x || 0) * 10) / 10;
  return { n: String(v.n || MKT.q || '').trim(), b: v.b || '', site: v.site || '', url: v.url || '', k: r1(v.k), p: r1(v.p), c: r1(v.c), f: r1(v.f), g: v.g > 0 ? r1(v.g) : 0 };
}
/** What the item being edited comes to with the product. */
function mktNowHtml() {
  const x = itemN(Object.assign({}, EDIT.it, { prod: mktProd() }));
  return `<span class="grow">${tr('ברישום הזה', 'In this entry')}: ≈ <b>${kc(x.k)}</b> ${tr('קק״ל', 'kcal')} · ${tr('חלבון', 'Protein')} ${gr(x.p)} · ${tr('פחמימות', 'Carbs')} ${gr(x.c)} · ${tr('שומן', 'Fat')} ${gr(x.f)} ${tr('ג׳', 'g')} <span class="muted">(${Math.round(x.g)} ${tr('ג׳', 'g')})</span></span>`;
}
function mktAfterChange() {
  nutInvalidate(); save();
  if (sheetStack.find(s => s.id === 'nutedit')) replaceSheetBody('nutedit', nutEditHtml());
  if (sheetStack.find(s => s.id === 'nutday')) replaceSheetBody('nutday', nutDayHtml());
  if (sheetStack.find(s => s.id === 'foods')) replaceSheetBody('foods', foodsHtml());
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
  const open = (label, cls) => `<button class="btn${cls}" data-act="openMarket" data-name="${esc(food)}" data-from="edit" data-said="${esc(it.said || '')}">${label}</button>`;
  return `<div id="eProd" class="eprod">${p ? `<span class="grow small">${icon('globe', 15)} ${prodLabel(p)}${p.only ? '' : ` <span class="muted">(${tr('תמיד', 'always')})</span>`}</span>
      ${open(tr('החלפה', 'Change'), '')}
      ${p.only ? `<button class="iconbtn plain" data-act="eProdOff" aria-label="${tr('בלי המוצר', 'Without the product')}">${icon('x', 18)}</button>` : ''}`
    : open(`${icon('globe', 18)}${tr('מוצר מאתר היצרן', "Product from the maker's site")}`, ' block')}</div>`;
}

const MKT_ACT = {
  openMarket(el) { openMarket(el.dataset.name, el.dataset.from || 'nut', el.dataset.said || ''); },
  mktSite(el) { MKT.site = el.dataset.v; replaceSheetBody('market', mktHtml()); if (MKT.site === '*') { const i = $('#sheets [data-on="mktOther"]'); if (i) i.focus(); } },
  mktGo() {
    const q = String(MKT.q || '').trim();
    if (!q) { toast(tr('כתוב את שם המוצר', 'Type the product name')); return; }
    let site = MKT.site;
    if (site === '*') {
      site = mktDomain(MKT.other);
      if (!site) { toast(tr('כתוב את כתובת האתר של החברה, למשל berman.co.il', "Type the company's website, e.g. berman.co.il")); return; }
      const m = mktSet();
      if (!MKT_SITES.some(x => x.site === site) && !m.mine.includes(site)) m.mine.push(site);
      MKT.site = site;
    }
    mktSet().site = site; save();
    mktOpenWeb(mktSearchUrl(site, q));
    replaceSheetBody('market', mktHtml());
  },
  mktManual() { MKT.vals = { n: MKT.q, b: '', site: '', url: '', k: null, p: null, c: null, f: null, g: null, missing: 0 }; MKT.step = 'confirm'; replaceSheetBody('market', mktHtml()); },
  mktAgain() { MKT.step = 'search'; replaceSheetBody('market', mktHtml()); },
  mktUse() {
    const prod = mktProd();
    if (!(prod.k > 0)) { toast(tr('חסרות קלוריות', 'Calories are missing')); return; }
    if (!prod.n) prod.n = MKT.food;
    if (MKT.from === 'nut' || MKT.always || !EDIT.it) {
      db.nut = db.nut || {};
      const e = { k: prod.k, p: prod.p, c: prod.c, f: prod.f, gk: 'piece', prod: { n: prod.n, b: prod.b, site: prod.site, url: prod.url } };
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
};
const MKT_ON = {
  mktQ(el) { MKT.q = el.value; },
  mktOther(el) { MKT.other = el.value; },
  mktVal(el) {
    const k = el.dataset.k;
    if (k === 'n') MKT.vals.n = el.value;
    else { const v = parseFloat(String(el.value).replace(',', '.')); MKT.vals[k] = isNaN(v) || v < 0 ? null : v; }
    const b = $('#mktNow'); if (b) b.innerHTML = mktNowHtml();
  },
  mktAlways(el) { MKT.always = el.checked; },
};
