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
  MKT.food = food; MKT.from = from; MKT.step = 'search'; MKT.vals = null; MKT.always = true; MKT.other = ''; MKT.reading = '';
  MKT.q = said || (LANG === 'en' && NU.NUT_EN[food]) || food;
  MKT.site = mktSet().site || MKT_SITES[0].site;
  openSheet('market', mktHtml(), { title: tr('ערכים של המוצר', 'Product values'), full: true, onClose: () => { if (MKT.open) mktCloseWeb(); } });
}
function mktHtml() {
  const head = sheetHead(tr('ערכים של המוצר', 'Product values'));
  return head + (MKT.step === 'confirm' ? mktConfirmHtml() : mktSearchHtml());
}
function mktSearchHtml() {
  const sites = mktSites();
  const other = MKT.site === '*';
  return `<div class="body">
    <div class="small muted">${tr(`בשביל: ${esc(MKT.food)}`, `For: ${esc(MKT.food)}`)}</div>
    <div class="section-t" style="margin:0">${icon('globe', 16)} ${tr('מאתר היצרן', "From the maker's site")}</div>
    <label class="field"><span>${tr('שם המוצר', 'Product name')}</span><input type="search" data-on="mktQ" value="${esc(MKT.q)}" placeholder="${tr('למשל: קוטג׳ 5%', 'e.g. cottage cheese 5%')}" autocomplete="off" enterkeyhint="search"></label>
    <div class="field"><span>${tr('החברה', 'Company')}</span>
      <div class="chips" style="margin-top:2px">${sites.map(s => `<button class="chip${MKT.site === s.site ? ' sel' : ''}" data-act="mktSite" data-v="${esc(s.site)}" aria-pressed="${MKT.site === s.site}">${esc(tr(s.he, s.en))}</button>`).join('')}<button class="chip${other ? ' sel' : ''}" data-act="mktSite" data-v="*" aria-pressed="${other}">${tr('חברה אחרת', 'Another company')}</button></div>
    </div>
    ${other ? `<label class="field"><span>${tr('כתובת האתר של החברה', "The company's website")}</span><input type="url" dir="ltr" data-on="mktOther" value="${esc(MKT.other)}" placeholder="berman.co.il" autocomplete="off" inputmode="url"></label>` : ''}
    <button class="btn primary big block" data-act="mktGo">${icon('globe', 18)}${other ? tr('חיפוש באתר החברה', "Search the company's site") : tr(`חיפוש באתר של ${esc(mktSiteName(MKT.site))}`, `Search ${esc(mktSiteName(MKT.site))}'s site`)}</button>
    <p class="small muted" style="margin:0">${tr('האתר של החברה ייפתח בתוך האפליקציה, רק עם תוצאות מהאתר שלה. פותחים את דף המוצר ולוחצים למטה על "קח את הערכים מהדף". לפני השמירה תוכל לבדוק את המספרים.', "The company's site opens inside the app, with results from that site only. Open the product's page and tap \"Use the values on this page\" at the bottom. You can check the numbers before saving.")}</p>
    ${mktPhotoHtml()}
    <button class="linkbtn" data-act="mktManual">${tr('או להקליד את הערכים מהתווית', 'Or type the values from the label')}</button>
  </div>`;
}
/** Photograph the label, or pick a photo of it you already have. */
function mktPhotoHtml() {
  const phone = !!(A && A.photo);
  const gem = !!aiSet().key;
  if (MKT.reading) return `<div class="mktphoto"><div class="row" style="gap:10px"><span class="spin"></span><span class="grow">${esc(MKT.reading)}</span></div></div>`;
  const two = (cam, gal, galLabel) => `<div class="row" style="gap:8px">
      ${phone ? `<button class="btn grow" data-act="${cam}">${icon('camera', 18)}${tr('צילום', 'Camera')}</button>` : ''}
      <button class="btn grow" data-act="${gal}">${icon('image', 18)}${galLabel || (phone ? tr('מתמונה קיימת', 'From a photo') : tr('בחירת תמונה', 'Choose a photo'))}</button>
    </div>`;
  let h = `<div class="mktphoto">
    <div class="section-t" style="margin:0">${icon('camera', 16)} ${tr('או מצילום של התווית', 'Or from a photo of the label')}</div>`;
  if (gem) h += `<div class="small" style="font-weight:600">${icon('sparkle', 14)} Gemini</div>${two('mktCam', 'mktGal')}
    <div class="small muted">${tr('Gemini קורא את טבלת הערכים מהתמונה (צריך אינטרנט).', 'Gemini reads the nutrition table from the photo (needs internet).')}</div>`;
  if (phone) h += `<div class="small" style="font-weight:600;margin-top:4px">${icon('sparkle', 14)} Google Lens · ${tr('חינם, בלי מפתח', 'free, no key')}</div>${two('mktLensCam', 'mktLensGal')}
    <div class="small muted">${tr('התמונה נפתחת ב-Lens. שם לוחצים "טקסט", "בחירת הכל" ו"העתקה", וחוזרים לכאן. האפליקציה מוצאת את הערכים בטקסט.', 'The photo opens in Lens. Tap "Text", "Select all" and "Copy", then come back here. The app finds the values in the text.')}
      ${A && A.readClipboard ? `<button class="linkbtn" data-act="mktPaste">${tr('הדבק טקסט מהלוח', 'Paste text from the clipboard')}</button>` : ''}</div>`;
  if (phone && !gem) h += `<div class="small" style="font-weight:600;margin-top:4px">${tr('בלי אינטרנט', 'Offline')}</div>${two('mktCam', 'mktGal')}
    <div class="small muted">${tr('הטלפון קורא לבד. מצליח רק בתווית שטוחה, ישרה ובאור טוב; על אריזה מבריקה או מעוגלת עדיף Lens.', 'The phone reads it alone. Works only on a flat, straight, well-lit label; on a glossy or curved package use Lens.')}</div>`;
  if (!phone && !gem) h += `<div class="small muted">${tr('במחשב, קריאה של תמונה צריכה מפתח Gemini (מגדירים בצ׳אט). בטלפון אפשר גם עם Google Lens.', 'On the computer, reading a photo needs a Gemini key (set it up in the chat). On the phone you can also use Google Lens.')}</div>`;
  return h + `<input type="file" accept="image/*" id="mktFile" data-on="mktFile" hidden></div>`;
}
const LABEL_PROMPT = 'Read the nutrition facts table in this photo of a food package. Israeli labels are in Hebrew: ' +
  'אנרגיה / קלוריות = energy, חלבונים = protein, פחמימות = carbohydrates, שומנים = fat ("מתוכם" rows are parts of the line above, skip them). ' +
  'Give the values per 100 g (or per 100 ml): use the 100 g column; if the label only has values per serving, convert them to 100 g with the serving size. ' +
  'k = energy in kcal (if only kJ is shown, divide by 4.184), p = protein g, c = total carbohydrates g, f = total fat g, ' +
  'g = the serving size in grams if it is written (else null), name = the product name if it is visible (else ""). ' +
  'Numbers only. Use null only for a value that is really not in the photo.';
const LABEL_SCHEMA = {
  type: 'OBJECT',
  properties: { name: { type: 'STRING' }, k: { type: 'NUMBER', nullable: true }, p: { type: 'NUMBER', nullable: true }, c: { type: 'NUMBER', nullable: true }, f: { type: 'NUMBER', nullable: true }, g: { type: 'NUMBER', nullable: true } },
  required: ['k', 'p', 'c', 'f'],
};
/** The values in Gemini's answer, whatever the keys came back as. */
function mktLabelFrom(v) {
  if (!v || typeof v !== 'object') return null;
  if (Array.isArray(v)) v = v[0] || {};
  const flat = {};
  const walk = (o) => { for (const k in o) { const x = o[k]; if (x && typeof x === 'object' && !Array.isArray(x)) walk(x); else if (!(k.toLowerCase() in flat)) flat[k.toLowerCase()] = x; } };
  walk(v);
  const pick = (...keys) => { for (const k of keys) if (flat[k] != null) { const n = mktNum(flat[k]); if (n != null) return n; } return null; };
  return {
    k: pick('k', 'kcal', 'calories', 'energy_kcal', 'energy', 'קלוריות', 'אנרגיה'),
    p: pick('p', 'protein', 'proteins', 'חלבון', 'חלבונים'),
    c: pick('c', 'carbs', 'carbohydrates', 'carbohydrate', 'פחמימות'),
    f: pick('f', 'fat', 'fats', 'total_fat', 'שומן', 'שומנים'),
    g: pick('g', 'serving', 'serving_size', 'serving_g'),
    name: typeof flat.name === 'string' ? flat.name : '',
  };
}
/** Why Gemini didn't read the photo, in words for the user. */
function mktGemWhy(code, body) {
  let msg = '';
  try { msg = (JSON.parse(body).error || {}).message || ''; } catch (e) { msg = String(body || ''); }
  msg = msg.replace(/\s+/g, ' ').slice(0, 140);
  if (code === 0) return tr('אין חיבור לאינטרנט', 'no internet connection');
  if (code === 429) return tr('הגעת למגבלת השימוש החינמית לרגע', 'the free usage limit was reached for now');
  if (code === 401 || code === 403 || /API_KEY|api key/i.test(msg)) return tr('המפתח לא תקין', 'the key is not valid');
  if (code === 'empty') return tr('לא מצא ערכים בתמונה', "it didn't find values in the photo");
  return `${tr('שגיאה', 'error')} ${code}${msg ? ': ' + msg : ''}`;
}
function mktReading(t) { MKT.reading = t; if (MKT.step === 'search') replaceSheetBody('market', mktHtml()); }
/** A photo of the label arrived (base64 JPEG): Gemini if there is a key, else (or if it fails) the phone's own reader. */
window.onLabelPhoto = (b64, status, detail) => {
  if (status === 'cancel') return;
  if (!b64) {
    toast(status === 'nocamera' ? tr('לא הצלחתי לפתוח את המצלמה', "Couldn't open the camera") : tr('לא הצלחתי לפתוח את התמונה', "Couldn't open the photo"));
    return;
  }
  MKT.gemErr = '';
  const offline = () => {
    if (A && A.labelOcr) { mktReading(tr('קורא את התמונה בטלפון…', 'Reading the photo on the phone…')); A.labelOcr('block'); return true; }
    return false;
  };
  if (!aiSet().key) {
    if (!offline()) toast(tr('כדי לקרוא תמונה במחשב צריך מפתח Gemini (מגדירים בצ׳אט)', 'Reading a photo on the computer needs a Gemini key (set it up in the chat)'));
    return;
  }
  mktReading(tr('Gemini קורא את הערכים מהתמונה…', 'Gemini is reading the values…'));
  const s = aiSet(), main = s.model || 'gemini-flash-latest';
  const tries = [{ model: main, schema: true }, { model: main, schema: false }];
  if (s.fallback && s.fallback !== main) tries.push({ model: s.fallback, schema: false });
  let why = '', best = null, bestRaw = '';
  const next = () => {
    const t = tries.shift();
    if (!t) {
      MKT.gemErr = why;
      if (best) { mktGotLabel(best, 'gemini', bestRaw); return; }
      if (!offline()) { mktReading(''); toast(tr('Gemini לא הצליח לקרוא את התמונה', "Gemini couldn't read the photo") + (why ? ` (${why})` : '')); }
      return;
    }
    const gc = Object.assign(aiGenCfg(t.model, (s.think || {})[t.model] ? 1 : 0), { responseMimeType: 'application/json' });
    if (t.schema) gc.responseSchema = LABEL_SCHEMA;
    const body = { contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: LABEL_PROMPT }] }], generationConfig: gc };
    let out = '';
    aiStream(t.model, body, {
      chunk(x) { out += x; },
      blocked(fr) { why = `${tr('נחסם', 'blocked')} (${fr})`; },
      truncated() { },
      done() {
        let v = null;
        try { v = JSON.parse(out.slice(out.search(/[[{]/), Math.max(out.lastIndexOf('}'), out.lastIndexOf(']')) + 1)); } catch (e) { v = null; }
        const vals = mktLabelFrom(v);
        const have = vals ? ['k', 'p', 'c', 'f'].filter(k => vals[k] != null).length : 0;
        if (have >= 3) { MKT.gemErr = ''; mktGotLabel(vals, 'gemini', ''); return; }
        if (have && (!best || have > ['k', 'p', 'c', 'f'].filter(k => best[k] != null).length)) { best = vals; bestRaw = out; }
        why = out.trim() ? mktGemWhy('empty') : tr('לא התקבלה תשובה', 'no answer came back');
        next();
      },
      error(code, body) { why = mktGemWhy(code, body); next(); },
    });
  };
  next();
};
function mktNum(x) { const v = parseFloat(String(x == null ? '' : x).replace(',', '.')); return isFinite(v) && v >= 0 ? v : null; }
/** The phone read the photo's text offline: first as one block of rows, then (if that missed values) letting it find columns. */
window.onLabelText = (text, status, detail) => {
  if (text == null) {
    mktReading('');
    toast(detail === 'data' ? tr('קובצי הזיהוי חסרים באפליקציה', 'Recognition files are missing in the app') : tr('לא הצלחתי לקרוא את התמונה', "Couldn't read the photo"));
    return;
  }
  const a = window.FDLabel ? window.FDLabel.fromText(text) : {};
  const have = (x) => ['k', 'p', 'c', 'f'].filter(k => x[k] != null).length;
  if (detail === 'lens') {
    if (!sheetStack.find(s => s.id === 'market')) { toast(tr('הטקסט מ-Lens הגיע, אבל חלון הערכים נסגר', 'The text from Lens arrived, but the values window was closed')); return; }
    MKT.gemErr = '';
    mktGotLabel(a, 'lens', text);
    return;
  }
  if (detail !== 'auto') {
    if (have(a) < 4 && A && A.labelOcr) { MKT.ocrFirst = { a, text }; mktReading(tr('קורא שוב, בדרך אחרת…', 'Reading it again another way…')); A.labelOcr('auto'); return; }
    mktGotLabel(a, 'ocr', text);
    return;
  }
  const first = MKT.ocrFirst; MKT.ocrFirst = null;
  if (first && have(first.a) >= have(a)) mktGotLabel(first.a, 'ocr', first.text);
  else mktGotLabel(a, 'ocr', first ? first.text + '\n\n— — —\n\n' + text : text);
};
function mktGotLabel(v, how, raw) {
  MKT.reading = '';
  const have = ['k', 'p', 'c', 'f'].filter(k => v[k] != null).length;
  MKT.vals = { n: v.name || MKT.q, b: '', site: '', url: '', k: v.k, p: v.p, c: v.c, f: v.f, g: v.g || null, missing: 4 - have, how, raw: raw || '' };
  MKT.step = 'confirm';
  replaceSheetBody('market', mktHtml());
}
/** A photo chosen in the browser / the Windows app: made smaller, then read like the phone's. */
function mktReadFile(file) {
  if (!file) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    window.onLabelPhoto(cv.toDataURL('image/jpeg', 0.85).split(',')[1], 'ok');
  };
  img.onerror = () => { URL.revokeObjectURL(url); window.onLabelPhoto(null, 'error'); };
  img.src = url;
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
    ${v.how ? `<div class="small ${v.missing ? 'warn-t' : 'muted'}">${v.missing === 4 ? (v.how === 'lens' ? tr('לא מצאתי ערכים בטקסט שהעתקת. ב-Lens בחר את כל הטבלה, או הקלד את הערכים.', "I couldn't find values in the copied text. In Lens select the whole table, or type the values.") : tr('לא מצאתי ערכים בתמונה. אפשר להקליד אותם, או לצלם שוב רק את הטבלה, ישר ובאור טוב.', "I couldn't find values in the photo. Type them, or photograph just the table again, straight and in good light.")) : (v.how === 'gemini' ? tr('הערכים נקראו מהתמונה עם Gemini.', 'Values read from the photo with Gemini.') : v.how === 'lens' ? tr('הערכים נמצאו בטקסט שהעתקת מ-Lens.', 'Values found in the text you copied from Lens.') : tr('הערכים נקראו מהתמונה בטלפון.', 'Values read from the photo on the phone.')) + ' ' + (v.missing ? tr('חלק חסרים, השלם אותם מהתווית.', 'Some are missing; fill them in from the label.') : tr('בדוק שהם כמו בתווית, בעמודה של 100 גרם.', 'Check they match the label, in the 100 g column.'))}</div>
    ${v.how === 'ocr' && MKT.gemErr ? `<div class="small warn-t">${tr(`Gemini לא הצליח (${esc(MKT.gemErr)}), אז הטלפון קרא את התמונה בעצמו.`, `Gemini didn't manage (${esc(MKT.gemErr)}), so the phone read the photo itself.`)}</div>` : ''}
    ${v.raw ? `<details class="small"><summary>${tr('הטקסט שזוהה בתמונה', 'Text found in the photo')}</summary><pre class="rawocr">${esc(v.raw)}</pre></details>` : ''}`
    : v.missing ? `<div class="small warn-t">${tr('לא מצאתי בדף את כל הערכים. השלם את החסר מהתווית.', "Not every value was on the page. Fill in what's missing from the label.")}</div>` : v.url ? `<div class="small muted">${tr(`הערכים נקראו מהאתר ${esc(v.site)}. כדאי לוודא שהם ל-100 גרם.`, `Values read from ${esc(v.site)}. Check that they are per 100 g.`)}</div>` : ''}
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
    : open(`${icon('globe', 18)}${tr('ערכים מאתר היצרן או מהתווית', 'Values from the maker or the label')}`, ' block')}</div>`;
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
  mktPaste() {
    const c = A && A.readClipboard ? A.readClipboard() : '';
    if (!c || !c.trim()) { toast(tr('הלוח ריק. ב-Lens לחץ "העתקה" קודם', 'The clipboard is empty. Tap "Copy" in Lens first')); return; }
    window.onLabelText(c, 'ok', 'lens');
  },
  mktLensCam() { startLens('camera', true); },
  mktLensGal() { startLens('gallery', true); },
  mktCam() { if (A && A.photo) A.photo('label', 'camera'); else { const f = $('#mktFile'); if (f) { f.setAttribute('capture', 'environment'); f.click(); } } },
  mktGal() { if (A && A.photo) A.photo('label', 'gallery'); else { const f = $('#mktFile'); if (f) { f.removeAttribute('capture'); f.click(); } } },
  mktManual() { MKT.vals = { n: MKT.q, b: '', site: '', url: '', k: null, p: null, c: null, f: null, g: null, missing: 0 }; MKT.step = 'confirm'; replaceSheetBody('market', mktHtml()); },
  mktAgain() { MKT.step = 'search'; MKT.reading = ''; replaceSheetBody('market', mktHtml()); },
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
const MKT_FILE_ON = {
  mktFile(el) { const f = el.files && el.files[0]; el.value = ''; mktReadFile(f); },
};
