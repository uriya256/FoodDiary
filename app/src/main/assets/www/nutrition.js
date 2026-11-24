'use strict';
/* Calories and macros in the app: day card, per-meal split, food value editor, settings and stats.
   The numbers come from nutdata.js; everything here runs only when app.js calls it. */

const NU = window.Nutri;
const MACRO = {
  c: { he: 'פחמימות', en: 'Carbs', color: '#EFA43A' },
  p: { he: 'חלבון', en: 'Protein', color: '#E0567A' },
  f: { he: 'שומן', en: 'Fat', color: '#4C9BD8' },
};
const MACRO_PRESETS = [[50, 25, 25], [55, 30, 15], [40, 30, 30], [30, 40, 30]];
function mName(k) { return LANG === 'en' ? MACRO[k].en : MACRO[k].he; }

function nutSet() {
  const s = db.settings;
  if (!s.nut || typeof s.nut !== 'object') s.nut = {};
  const n = s.nut;
  if (n.show == null) n.show = true;
  if (!n.target || n.target.c + n.target.p + n.target.f !== 100) n.target = { c: 50, p: 25, f: 25 };
  if (n.mode !== 'fixed') n.mode = 'moh';
  return n;
}
/** 'moh': the Ministry of Health ranges (the default); 'fixed': one split chosen by the user. */
function isMoh() { return nutSet().mode === 'moh'; }
function bal(pct) { const n = nutSet(); return n.mode === 'moh' ? NU.balanceRange(pct, NU.MOH) : NU.balance(pct, n.target); }
function latestKg() { const L = typeof weights === 'function' ? weights() : []; return L.length ? L[L.length - 1].kg : null; }
function rangeTxt(k) { return `${NU.MOH[k][0]}%–${NU.MOH[k][1]}%`; }
function mohLine() { return ['c', 'p', 'f'].map(k => `<span class="nw">${mName(k)} ${rangeTxt(k)}</span>`).join(' · '); }
/** ✓ inside the range, ↓ under it, ↑ over it. */
function mark(st) {
  if (st === 'ok') return `<em class="mk ok" aria-label="${tr('בטווח', 'in range')}">✓</em>`;
  if (st === 'lo') return `<em class="mk lo" aria-label="${tr('מתחת לטווח', 'below range')}">↓</em>`;
  if (st === 'hi') return `<em class="mk hi" aria-label="${tr('מעל הטווח', 'above range')}">↑</em>`;
  return '';
}
function rangeState(k, v) { const [lo, hi] = NU.MOH[k]; return v < lo ? 'lo' : v > hi ? 'hi' : 'ok'; }
function legendHtml(pct) {
  if (!pct) return '';
  const moh = isMoh();
  return ['c', 'p', 'f'].map(k => `<span class="lg"><i style="background:${MACRO[k].color}"></i>${mName(k)} ${pct[k]}%${moh ? mark(rangeState(k, pct[k])) : ''}</span>`).join('');
}
function targetLineHtml() {
  const n = nutSet();
  if (n.mode === 'moh') return `<div class="small muted">${tr(`המלצת משרד הבריאות: ${mohLine()}`, `Ministry of Health ranges: ${mohLine()}`)}</div>`;
  return `<div class="small muted">${tr(`היעד: ${n.target.c}% פחמימות · ${n.target.p}% חלבון · ${n.target.f}% שומן (הקווים על הפס)`, `Target: ${n.target.c}% carbs · ${n.target.p}% protein · ${n.target.f}% fat (lines on the bar)`)}</div>`;
}
/**
 * The Ministry of Health check for a day (or a daily average): grams and share of each macro against the ranges,
 * the ranges in grams for the calorie goal (or for what was eaten), and the protein minimum by body weight.
 */
function mohHtml(t, avg) {
  const n = nutSet();
  const pct = NU.macroPct(t);
  if (!pct) return '';
  const base = n.goal || t.k;
  const G = NU.gramRange(base);
  const g = tr('ג׳', 'g');
  const rows = ['c', 'p', 'f'].map(k => `<tr><th scope="row"><i style="background:${MACRO[k].color}"></i>${mName(k)}</th>
      <td>${gr(t[k])} ${g} · ${pct[k]}%${mark(rangeState(k, pct[k]))}</td><td>${rangeTxt(k)}</td><td>${Math.round(G[k][0])}–${Math.round(G[k][1])} ${g}</td></tr>`).join('');
  const kg = latestKg();
  let prot;
  if (kg) {
    const min = Math.round(kg * NU.MOH.proteinPerKg);
    const st = t.p >= min ? 'ok' : 'lo';
    prot = tr(`חלבון: לפחות ${NU.MOH.proteinPerKg} ג׳ לכל ק״ג משקל, כלומר כ-${min} ג׳ ביום למשקל ${fmtKg(kg)} ק״ג. ${avg ? 'בממוצע' : 'היום'}: ${gr(t.p)} ג׳`, `Protein: at least ${NU.MOH.proteinPerKg} g per kg of body weight, about ${min} g a day at ${fmtKg(kg)} kg. ${avg ? 'Average' : 'Today'}: ${gr(t.p)} g`) + mark(st);
  } else prot = `${tr(`חלבון: מומלץ לפחות ${NU.MOH.proteinPerKg} ג׳ לכל ק״ג משקל גוף.`, `Protein: at least ${NU.MOH.proteinPerKg} g per kg of body weight.`)} <button class="linkbtn" data-act="openWeight">${tr('רישום משקל יחשב את זה בשבילך', 'Log your weight to work it out')}</button>`;
  return `<div class="mohbox">
    <div class="section-t" style="margin:0 0 4px">${tr('לפי המלצת משרד הבריאות', 'Ministry of Health recommendation')}</div>
    <table class="mohtbl"><thead><tr><th></th><th>${avg ? tr('ממוצע ליום', 'Daily average') : tr('היום', 'Today')}</th><th>${tr('מומלץ', 'Range')}</th><th>${n.goal ? tr(`ליעד ${kc(base)}`, `For ${kc(base)}`) : tr('בגרמים', 'In grams')}</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="small muted" style="margin-top:6px">${n.goal ? tr(`הגרמים מחושבים לפי היעד היומי שלך, ${kc(base)} קק״ל.`, `Grams are worked out for your daily goal of ${kc(base)} kcal.`) : tr(`הגרמים מחושבים לפי ${kc(base)} קק״ל, ${avg ? 'הממוצע ליום' : 'מה שנאכל היום'}. עם יעד קלורי הם יחושבו לפי היעד.`, `Grams are worked out for ${kc(base)} kcal, ${avg ? 'the daily average' : 'what was eaten today'}. With a calorie goal they follow the goal.`)}</div>
    <div class="small" style="margin-top:6px">${prot}</div>
    <div class="small muted" style="margin-top:6px">${tr('משרד הבריאות קובע את הכמויות של רכיבי התזונה לפי טבלאות ה-DRI. קשת המזון עצמה ממליצה על סוגי המזון ועל התדירות: הרבה ירקות, פירות, דגנים מלאים וקטניות, ומעט מזון מעובד.', 'The Ministry of Health sets nutrient amounts by the DRI tables. The food rainbow itself recommends which foods and how often: plenty of vegetables, fruit, whole grains and legumes, and little processed food.')}</div>
  </div>`;
}
function nutOn() { return nutSet().show !== false; }
function weekGoal() { const n = nutSet(); return n.weekGoal || (n.goal ? n.goal * 7 : null); }

/** Free text -> a known food: the whole name, else the longest known phrase inside it ("לימון סחוט" -> לימון). */
const RESOLVE = new Map();
function resolveFood(text) {
  const key = String(text || '').trim();
  if (!key) return null;
  if (RESOLVE.has(key)) return RESOLVE.get(key);
  const L = lex();
  let out = null;
  const nm = L.aliases[nk(key)];
  if (nm) out = { name: nm, cat: catOf(nm) };
  else if (db.nut && db.nut[key]) out = { name: key, cat: catOf(key) };
  else {
    const w = key.split(/\s+/);
    for (let len = w.length - 1; len >= 1 && !out; len--) {
      for (let i = 0; i + len <= w.length; i++) {
        const n2 = L.aliases[nk(w.slice(i, i + len).join(' '))];
        if (n2) { out = { name: n2, cat: catOf(n2) }; break; }
      }
    }
    if (!out) { const c = catOf(key); if (c !== 'other') out = { name: key, cat: c }; }
  }
  RESOLVE.set(key, out);
  return out;
}
function nutInvalidate() { RESOLVE.clear(); }
function itemN(it) { return NU.itemNut(it, resolveFood, db.nut || {}); }
function mealN(items) { return NU.sumNut((items || []).map(itemN)); }
function dayN(d) { return d ? NU.sumNut(MEALS.map(m => mealN(d.meals[m]))) : NU.sumNut([]); }
function hasFood(d) { return d && MEALS.some(m => d.meals[m] && d.meals[m].length); }
function kc(n) { return fmtNum(n); }
function gr(n) { return n >= 10 ? Math.round(n) : Math.round(n * 10) / 10; }

/* ---------- small pieces ---------- */
function macroBar(t, opts) {
  opts = opts || {};
  const pct = NU.macroPct(t);
  if (!pct) return '';
  const tg = nutSet().target;
  const seg = (k) => `<i style="width:${pct[k]}%;background:${MACRO[k].color}">${pct[k] >= (opts.big ? 13 : 18) ? `<b>${pct[k]}%</b>` : ''}</i>`;
  const ticks = opts.ticks && nutSet().mode !== 'moh' ? `<s style="inset-inline-start:${tg.c}%"></s><s style="inset-inline-start:${tg.c + tg.p}%"></s>` : '';
  return `<div class="mbar${opts.big ? ' big' : ''}" role="img" aria-label="${esc(macroText(pct))}">${seg('c')}${seg('p')}${seg('f')}${ticks}</div>`;
}
function macroText(pct) { return ['c', 'p', 'f'].map(k => `${mName(k)} ${pct[k]}%`).join(' · '); }
function balanceBadge(t) {
  const pct = NU.macroPct(t);
  const b = bal(pct);
  if (!b) return '';
  if (b.level === 'ok') return `<span class="bal ok">${icon('check', 13)}${tr('מאוזן', 'Balanced')}</span>`;
  const parts = [];
  if (b.high) parts.push(tr(`הרבה ${MACRO[b.high].he}`, `high ${MACRO[b.high].en.toLowerCase()}`));
  if (b.low) parts.push(tr(`מעט ${MACRO[b.low].he}`, `low ${MACRO[b.low].en.toLowerCase()}`));
  return `<span class="bal ${b.level}">${parts.join(tr(', ', ', ')) || tr('כמעט מאוזן', 'Almost balanced')}</span>`;
}
function ringSvg(frac, size) {
  const r = 42, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  const over = frac > 1.05;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--line)" stroke-width="9"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${over ? '#E07A3A' : 'var(--accent)'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/></svg>`;
}
/** Monday-to-Sunday? Israel's week starts on Sunday, so the week is Sunday..Saturday. */
function weekStart(iso) { const d = parseISO(iso); return addDays(iso, -d.getDay()); }
function weekKcal(iso) {
  const s = weekStart(iso);
  let k = 0;
  for (let i = 0; i < 7; i++) { const d = db.days[addDays(s, i)]; if (hasFood(d)) k += dayN(d).k; }
  return k;
}

/* ---------- today ---------- */
function nutDayCardHtml(iso) {
  const day = getDay(iso, false);
  if (!hasFood(day)) return '';
  const t = dayN(day);
  const n = nutSet();
  const pct = NU.macroPct(t);
  const goal = n.goal;
  const wg = weekGoal();
  const wk = wg ? weekKcal(iso) : 0;
  let h = `<section class="card nutcard" aria-label="${tr('קלוריות ואבות מזון', 'Calories and macros')}">
    <button class="nut-top" data-act="openNutDay">
      <span class="ring">${goal ? ringSvg(t.k / goal, 92) : ringSvg(0, 92)}<span class="rc"><b>${kc(t.k)}</b><span>${goal ? tr(`מתוך ${kc(goal)}`, `of ${kc(goal)}`) : tr('קק״ל', 'kcal')}</span></span></span>
      <span class="nut-macros">${['p', 'c', 'f'].map(k => `<span class="nm"><i style="background:${MACRO[k].color}"></i><span class="grow">${mName(k)}</span><b>${gr(t[k])}</b><span class="u">${tr('ג׳', 'g')}</span></span>`).join('')}
        ${goal ? `<span class="small ${t.k > goal * 1.05 ? 'warn-t' : 'muted'}">${t.k <= goal ? tr(`נשארו ${kc(goal - t.k)} קק״ל`, `${kc(goal - t.k)} kcal left`) : tr(`${kc(t.k - goal)} קק״ל מעל היעד`, `${kc(t.k - goal)} kcal over goal`)}</span>` : `<span class="small muted">${tr('קק״ל משוער היום', 'estimated kcal today')}</span>`}
      </span>
    </button>`;
  if (pct) h += `${macroBar(t, { big: true, ticks: true })}
    <div class="row between nut-leg"><span class="small">${legendHtml(pct)}</span>${balanceBadge(t)}</div>
    ${targetLineHtml()}`;
  const notes = [];
  if (wg) notes.push(`<span class="${wk > wg * 1.05 ? 'warn-t' : ''}">${tr(`השבוע: ${kc(wk)} מתוך ${kc(wg)} קק״ל`, `This week: ${kc(wk)} of ${kc(wg)} kcal`)}</span>`);
  if (t.guess || t.unknown) notes.push(`<button class="linkbtn" data-act="openNutDay">${t.unknown ? tr(`${t.unknown} בלי ערכים`, `${t.unknown} without values`) : tr(`${t.guess} לפי הערכה גסה`, `${t.guess} roughly guessed`)}</button>`);
  if (!goal) notes.push(`<button class="linkbtn" data-act="nutGoalSheet">${tr('הגדרת יעד קלורי', 'Set a calorie goal')}</button>`);
  if (notes.length) h += `<div class="small muted nut-notes">${notes.join(' · ')}</div>`;
  return h + `</section>`;
}
/** The line under a meal's chips: calories, the macro split bar and a balance badge. */
function mealNutHtml(items) {
  if (!nutOn() || !items || !items.length) return '';
  const t = mealN(items);
  if (t.k < 1) return '';
  return `<div class="mealnut">${macroBar(t)}${balanceBadge(t)}</div>`;
}

/* ---------- breakdown sheet ---------- */
function openNutDay() { openSheet('nutday', nutDayHtml(), { full: true, title: tr('פירוט תזונתי', 'Nutrition breakdown') }); }
function nutDayHtml() {
  const day = getDay(S.date, false);
  let h = sheetHead(tr('פירוט תזונתי', 'Nutrition breakdown') + ` · ${shortDate(S.date)}`) + `<div class="body">
    <p class="small muted" style="margin:0">${tr('הערכה לפי ערכים ממוצעים של מאכלים נפוצים. מאכל בלי כמות נספר כאחד (פרוסת לחם, משולש פיצה), ובלשון רבים ("שקדים") כמנה רגילה. לחיצה על מאכל מאפשרת לתקן את הערכים שלו, והתיקון חל על כל הימים.', 'Estimates from average values of common foods. A food without an amount counts as one (a slice of bread, a slice of pizza), and a plural ("almonds") as a usual portion. Tap a food to correct its values; the change applies to every day.')}</p>`;
  if (isMoh() && hasFood(day)) h += mohHtml(dayN(day));
  for (const m of MEALS) {
    const items = day ? day.meals[m] : [];
    if (!items.length) continue;
    const t = mealN(items);
    h += `<div class="section-t row between"><span>${MEAL[m].label}</span><span>≈ ${kc(t.k)} ${tr('קק״ל', 'kcal')}</span></div><div class="list">`;
    for (const it of items) {
      const x = itemN(it);
      const r = resolveFood(it.name);
      const flag = x.unknown ? `<span class="bal off">${tr('בלי ערכים', 'No values')}</span>` : x.guess ? `<span class="bal near">${tr('הערכה גסה', 'Rough guess')}</span>` : '';
      h += `<button class="li" data-act="openNutEdit" data-name="${esc(r ? r.name : it.name)}">
        <span class="grow"><span class="t">${esc(P.formatItem(it, { short: true }))}</span><br><span class="s">${x.unknown ? tr('הקש כדי להוסיף ערכים', 'Tap to add values') : `${tr('חלבון', 'Protein')} ${gr(x.p)} · ${tr('פחמימות', 'Carbs')} ${gr(x.c)} · ${tr('שומן', 'Fat')} ${gr(x.f)} ${tr('ג׳', 'g')} · ≈${Math.round(x.g)} ${tr('ג׳', 'g')}`}</span></span>
        ${flag}<b class="kcal">${x.unknown ? '–' : kc(x.k)}</b></button>`;
    }
    h += `</div>`;
  }
  return h + `</div><footer><button class="btn primary big block" data-act="closeSheet">${tr('סגירה', 'Close')}</button></footer>`;
}

/* ---------- food value editor ---------- */
const NUTED = { name: '', mode: '100' };
function openNutEdit(name) {
  NUTED.name = name; NUTED.mode = '100';
  openSheet('nutedit', nutEditHtml(), { title: tr('ערכים תזונתיים', 'Nutrition values') });
}
function nutEditHtml() {
  const name = NUTED.name;
  const r = resolveFood(name) || { name, cat: catOf(name) };
  const cur = NU.nutFor(r.name, r.cat, db.nut || {}) || { k: 0, p: 0, c: 0, f: 0, serving: 100, piece: 100 };
  const gk = NU.editWeightKey(cur);
  NUTED.gk = gk;
  const g = cur[gk] || 100;
  const per = NUTED.mode === 'serv' ? g / 100 : 1;
  const v = (x) => Math.round(x * per * 10) / 10;
  const srcTxt = cur.src === 'user' ? tr('ערכים שהזנת', 'Your values') : cur.src === 'db' ? tr('ערכים מובנים (ממוצע)', 'Built-in values (average)') : cur.src === 'cat' ? tr(`הערכה גסה לפי הקטגוריה "${catLabel(r.cat)}"`, `Rough guess from the category "${catLabel(r.cat)}"`) : tr('אין ערכים', 'No values');
  const field = (k, label) => `<label class="field grow"><span>${label}</span><input class="gnum" type="number" inputmode="decimal" min="0" step="any" data-nut="${k}" value="${cur.src ? v(cur[k]) : ''}"></label>`;
  return sheetHead(esc(r.name)) + `<div class="body">
    <div class="small muted">${srcTxt}</div>
    <div class="seg">${[['100', tr('ל-100 גרם', 'Per 100 g')], ['serv', gk === 'piece' ? tr('ליחידה אחת', 'Per piece') : tr('למנה', 'Per serving')]].map(([m, l]) => `<button data-act="nutMode" data-v="${m}" aria-pressed="${NUTED.mode === m}">${l}</button>`).join('')}</div>
    <label class="field"><span>${gk === 'piece' ? tr('משקל יחידה אחת (גרם)', 'Weight of one piece (g)') : tr('משקל מנה (גרם)', 'Serving weight (g)')}</span><input class="gnum" type="number" inputmode="decimal" min="1" step="any" data-nut="g" value="${Math.round(g * 10) / 10}"></label>
    ${field('k', tr('קלוריות', 'Calories'))}
    <div class="row" style="gap:8px">${field('p', tr('חלבון (ג׳)', 'Protein (g)'))}${field('c', tr('פחמימות (ג׳)', 'Carbs (g)'))}${field('f', tr('שומן (ג׳)', 'Fat (g)'))}</div>
    <p class="small muted" style="margin:0">${gk === 'piece' ? tr('על האריזה הערכים כתובים בדרך כלל ל-100 גרם. "יחידה" היא מה שנספר כשכותבים את המאכל בלי כמות, וכל אחת כשכותבים מספר ("2 פרוסות").', 'Labels usually list values per 100 g. A "piece" is what counts when you write the food without an amount, and each one when you write a number ("2 slices").') : tr('על האריזה הערכים כתובים בדרך כלל ל-100 גרם. "מנה" היא מה שנספר כשכותבים את המאכל בלי כמות, ויחידה אחת כשכותבים מספר ("2 חטיפים").', 'Labels usually list values per 100 g. A "serving" is what counts when you write the food without an amount, and one piece when you write a number ("2 bars").')}</p>
  </div>
  <footer>${db.nut && db.nut[r.name] ? `<button class="btn" data-act="nutReset">${icon('undo', 18)}${tr('ברירת מחדל', 'Default')}</button>` : ''}<button class="btn primary grow" data-act="nutSave">${tr('שמירה', 'Save')}</button></footer>`;
}
function readNutForm() {
  const val = (k) => { const el = $(`#sheets [data-nut="${k}"]`); const n = el ? parseFloat(String(el.value).replace(',', '.')) : NaN; return isNaN(n) || n < 0 ? null : n; };
  return { g: val('g'), k: val('k'), p: val('p'), c: val('c'), f: val('f') };
}

/* ---------- settings ---------- */
function nutSettingsHtml() {
  const n = nutSet();
  const moh = n.mode === 'moh';
  const custom = !moh && (S.nutCustom || !MACRO_PRESETS.some(([c, p, f]) => n.target.c === c && n.target.p === p && n.target.f === f));
  const G = n.goal ? NU.gramRange(n.goal) : null;
  return `<section class="card stack" id="nutSettings">
    <h2 class="row">${icon('flame', 20)}${tr('קלוריות ואבות מזון', 'Calories and macros')}</h2>
    <div class="row between"><span>${tr('הצג הערכת קלוריות, חלבון, פחמימות ושומן', 'Show calorie, protein, carb and fat estimates')}</span>${sw('nutShow', n.show !== false, tr('הצג הערכת קלוריות', 'Show calorie estimates'))}</div>
    <div class="stack ${n.show !== false ? '' : 'hidden'}">
      <div class="row" style="gap:10px">
        <label class="field grow"><span>${tr('יעד יומי (קק״ל)', 'Daily goal (kcal)')}</span><input class="gnum" type="number" inputmode="numeric" min="0" step="50" data-on="nutGoal" value="${n.goal || ''}" placeholder="${tr('ללא', 'None')}"></label>
        <label class="field grow"><span>${tr('יעד שבועי (קק״ל)', 'Weekly goal (kcal)')}</span><input class="gnum" type="number" inputmode="numeric" min="0" step="100" data-on="nutWeek" value="${n.weekGoal || ''}" placeholder="${n.goal ? tr(`אוטומטי: ${kc(n.goal * 7)}`, `Auto: ${kc(n.goal * 7)}`) : tr('7 × יומי', '7 × daily')}"></label>
      </div>
      ${n.goal && n.goal < 1200 ? `<div class="small warn-t">${tr('יעד מתחת ל-1,200 קק״ל ביום נמוך מאוד למבוגרים. כדאי להתייעץ עם דיאטנית.', 'A goal under 1,200 kcal a day is very low for adults. Worth checking with a dietitian.')}</div>` : ''}
      <div class="field"><span>${tr('חלוקה רצויה: פחמימות / חלבון / שומן', 'Target split: carbs / protein / fat')}</span>
        <div class="chips" style="margin-top:2px"><button class="chip${moh ? ' sel' : ''}" data-act="nutPreset" data-v="moh" aria-pressed="${moh}">${tr('משרד הבריאות', 'Ministry of Health')}</button>${MACRO_PRESETS.map(([c, p, f]) => { const on = !moh && !custom && n.target.c === c && n.target.p === p && n.target.f === f; return `<button class="chip${on ? ' sel' : ''}" data-act="nutPreset" data-v="${c},${p},${f}" aria-pressed="${on}"><span dir="ltr">${c}/${p}/${f}</span></button>`; }).join('')}<button class="chip${custom ? ' sel' : ''}" data-act="nutPreset" data-v="custom" aria-pressed="${custom}">${tr('אחר', 'Other')}</button></div>
      </div>
      ${moh ? `<div class="small muted">${tr(`טווחים מהקלוריות: ${mohLine()}`, `Share of calories: ${mohLine()}`)}<br>${tr(`חלבון: לפחות ${NU.MOH.proteinPerKg} ג׳ לכל ק״ג משקל גוף.`, `Protein: at least ${NU.MOH.proteinPerKg} g per kg of body weight.`)}${G ? `<br>${tr(`ליעד של ${kc(n.goal)} קק״ל:`, `For ${kc(n.goal)} kcal:`)} ${['c', 'p', 'f'].map(k => `<span class="nw">${mName(k)} ${Math.round(G[k][0])}–${Math.round(G[k][1])} ${tr('ג׳', 'g')}</span>`).join(' · ')}` : ''}</div>` : ''}
      <div class="row ${custom ? '' : 'hidden'}" style="gap:8px" id="nutCustom">
        ${['c', 'p', 'f'].map(k => `<label class="field grow"><span>${mName(k)} %</span><input class="gnum" type="number" inputmode="numeric" min="0" max="100" data-on="nutPct" data-k="${k}" value="${n.target[k]}"></label>`).join('')}
      </div>
      <div class="small muted" id="nutPctMsg"></div>
      ${!moh && n.target.f < 20 ? `<div class="small muted">${tr('לרוב ממליצים על 20%–35% מהקלוריות משומן.', 'Guidelines usually suggest 20–35% of calories from fat.')}</div>` : ''}
      <button class="btn" data-act="openFoods">${icon('list', 18)}${tr('תיקון ערכים של מאכלים', 'Correct food values')}</button>
      ${choicesHtml()}
      <p class="small muted" style="margin:0">${tr('המספרים הם הערכה לפי ערכים ממוצעים, לא שקילה. מאכל בלי כמות נספר כאחד, ומאכל שכתבת עם "גרם" נספר לפי המשקל שכתבת.', 'The numbers are estimates from average values, not weighing. A food without an amount counts as one, and foods written in grams count by the weight you wrote.')}</p>
    </div>
  </section>`;
}
function nutGoalSheet() {
  const n = nutSet();
  promptSheet(tr('יעד קלורי יומי', 'Daily calorie goal'), tr('קק״ל ביום (למשל 2000)', 'kcal a day (e.g. 2000)'), n.goal ? String(n.goal) : '', (v) => {
    const x = parseInt(String(v).replace(/[^\d]/g, ''), 10);
    n.goal = x > 0 ? x : null; save(); render({ keepScroll: true });
  }, tr('שמירה', 'Save'));
  setTimeout(() => { const i = $('[data-on="promptVal"]'); if (i) i.setAttribute('inputmode', 'numeric'); }, 50);
}

/* ---------- stats ---------- */
function nutStatsHtml(dates) {
  if (!nutOn()) return '';
  const fd = dates.filter(iso => hasFood(db.days[iso]));
  if (!fd.length) return '';
  const n = nutSet();
  const tot = NU.sumNut(fd.map(iso => dayN(db.days[iso])));
  const avg = { k: tot.k / fd.length, p: tot.p / fd.length, c: tot.c / fd.length, f: tot.f / fd.length };
  let inGoal = 0, balanced = 0;
  const byFood = {};
  for (const iso of fd) {
    const d = db.days[iso];
    const t = dayN(d);
    if (n.goal && t.k <= n.goal * 1.05) inGoal++;
    const b = bal(NU.macroPct(t));
    if (b && b.level === 'ok') balanced++;
    for (const m of MEALS) for (const it of d.meals[m]) { const x = itemN(it); byFood[it.name] = (byFood[it.name] || 0) + x.k; }
  }
  const topF = Object.keys(byFood).filter(k => byFood[k] > 0).sort((a, b) => byFood[b] - byFood[a]).slice(0, 6);
  const maxF = topF.length ? byFood[topF[0]] : 1;
  let h = `<section class="card"><h3 class="row">${icon('flame', 18)}${tr('קלוריות ואבות מזון', 'Calories and macros')}</h3>
    <div class="tiles" style="margin-bottom:8px">
      <div class="tile"><div class="big">${kc(avg.k)}</div><div class="lbl">${tr('קק״ל ביום בממוצע', 'kcal a day (avg)')}</div></div>
      <div class="tile"><div class="big" style="color:${MACRO.p.color}">${gr(avg.p)}<span class="small muted"> ${tr('ג׳', 'g')}</span></div><div class="lbl">${tr('חלבון ביום בממוצע', 'protein a day (avg)')}</div></div>
      ${n.goal ? `<div class="tile"><div class="big">${inGoal}<span class="small muted"> / ${fd.length}</span></div><div class="lbl">${tr(`ימים ביעד (${kc(n.goal)})`, `days on goal (${kc(n.goal)})`)}</div></div>` : ''}
      <div class="tile"><div class="big" style="color:#2F8F5A">${balanced}<span class="small muted"> / ${fd.length}</span></div><div class="lbl">${tr('ימים מאוזנים', 'balanced days')}</div></div>
    </div>
    <div class="section-t" style="margin:4px 0 6px">${n.mode === 'moh' ? tr('החלוקה הממוצעת מול המלצת משרד הבריאות', 'Average split vs the Ministry of Health ranges') : tr('החלוקה הממוצעת מול היעד', 'Average split vs target')}</div>
    ${macroBar(avg, { big: true, ticks: true })}
    <div class="row between nut-leg"><span class="small">${legendHtml(NU.macroPct(avg))}</span>${balanceBadge(avg)}</div>
    ${n.mode === 'moh' ? mohHtml(avg, true) : ''}`;
  const wg = weekGoal();
  if (wg) {
    const weeks = [];
    let ws = weekStart(fd[fd.length - 1]);
    for (let i = 0; i < 8; i++) { if (ws < weekStart(fd[0])) break; weeks.unshift(ws); ws = addDays(ws, -7); }
    const maxW = Math.max(wg, ...weeks.map(weekKcal));
    h += `<div class="section-t" style="margin:14px 0 8px">${tr('קלוריות בשבוע מול היעד', 'Weekly calories vs goal')}</div><div class="stack">${weeks.map(w => {
      const k = weekKcal(w);
      return `<div class="barrow"><div class="row between"><span dir="ltr">${P.displayDate(w).slice(0, 5)}–${P.displayDate(addDays(w, 6)).slice(0, 5)}</span><span class="small ${k > wg * 1.05 ? 'warn-t' : 'muted'}">${tr(`${kc(k)} מתוך ${kc(wg)}`, `${kc(k)} of ${kc(wg)}`)}</span></div><div class="bar wk"><i style="width:${Math.round(k / maxW * 100)}%;background:${k > wg * 1.05 ? '#E07A3A' : 'var(--accent)'}"></i><s style="inset-inline-start:${Math.round(wg / maxW * 100)}%"></s></div></div>`;
    }).join('')}</div>`;
  }
  if (topF.length) h += `<div class="section-t" style="margin:14px 0 8px">${tr('מה הביא הכי הרבה קלוריות', 'Where most calories came from')}</div><div class="stack">${topF.map(f => `<div class="barrow"><div class="row between"><span>${esc(f)}</span><span class="muted small">${kc(byFood[f])} ${tr('קק״ל', 'kcal')}</span></div><div class="bar"><i style="width:${Math.round(byFood[f] / maxF * 100)}%;background:#EFA43A"></i></div></div>`).join('')}</div>`;
  return h + `<p class="small muted" style="margin:10px 0 0">${tr('הערכה לפי ערכים ממוצעים.', 'Estimates from average values.')}</p></section>`;
}
/** The macro target in words, for the AI. */
function nutTargetAi() {
  const n = nutSet();
  if (n.mode !== 'moh') return `Target split carbs/protein/fat: ${n.target.c}/${n.target.p}/${n.target.f}%.`;
  const kg = latestKg();
  return `Macro target: the Israeli Ministry of Health ranges (DRI): carbs 45-65%, protein 10-35%, fat 20-35% of calories; protein at least 0.8 g per kg of body weight${kg ? ` (${fmtKg(kg)} kg -> about ${Math.round(kg * 0.8)} g a day)` : ''}.` + (n.goal ? (() => { const G = NU.gramRange(n.goal); return ` For the ${n.goal} kcal goal: carbs ${Math.round(G.c[0])}-${Math.round(G.c[1])} g, protein ${Math.round(G.p[0])}-${Math.round(G.p[1])} g, fat ${Math.round(G.f[0])}-${Math.round(G.f[1])} g.`; })() : '');
}
/** One line for the AI and for history. */
function nutLine(d) {
  if (!hasFood(d)) return '';
  const t = dayN(d), p = NU.macroPct(t);
  return tr(`≈ ${kc(t.k)} קק״ל, חלבון ${gr(t.p)} ג׳, פחמימות ${gr(t.c)} ג׳, שומן ${gr(t.f)} ג׳`, `≈ ${kc(t.k)} kcal, protein ${gr(t.p)} g, carbs ${gr(t.c)} g, fat ${gr(t.f)} g`) + (p ? ` (${p.c}/${p.p}/${p.f}%)` : '');
}

/* ---------- actions ---------- */
const NUT_ACT = {
  openNutDay() { openNutDay(); },
  openNutEdit(el) { openNutEdit(el.dataset.name); },
  nutMode(el) {
    const f = readNutForm();
    // keep what was typed: convert between per-100 g and per-serving
    const g = f.g || 100;
    const factor = el.dataset.v === 'serv' ? g / 100 : 100 / g;
    if (NUTED.mode === el.dataset.v) return;
    NUTED.mode = el.dataset.v;
    replaceSheetBody('nutedit', nutEditHtml());
    ['k', 'p', 'c', 'f'].forEach(k => { const inp = $(`#sheets [data-nut="${k}"]`); if (inp && f[k] != null) inp.value = Math.round(f[k] * factor * 10) / 10; });
    const gi = $('#sheets [data-nut="g"]'); if (gi && f.g) gi.value = f.g;
  },
  nutSave() {
    const f = readNutForm();
    if (f.k == null) { toast(tr('חסרות קלוריות', 'Calories are missing')); return; }
    const g = f.g || 100;
    const to100 = NUTED.mode === 'serv' ? 100 / g : 1;
    const r = resolveFood(NUTED.name) || { name: NUTED.name };
    db.nut = db.nut || {};
    db.nut[r.name] = { k: Math.round(f.k * to100 * 10) / 10, p: Math.round((f.p || 0) * to100 * 10) / 10, c: Math.round((f.c || 0) * to100 * 10) / 10, f: Math.round((f.f || 0) * to100 * 10) / 10, g, gk: NUTED.gk || 'serving' };
    nutInvalidate(); save(); closeSheet();
    if (sheetStack.find(s => s.id === 'nutday')) replaceSheetBody('nutday', nutDayHtml());
    if (sheetStack.find(s => s.id === 'foods')) replaceSheetBody('foods', foodsHtml());
    refreshEditNut();
    render({ keepScroll: true });
    toast(tr(`הערכים של "${r.name}" נשמרו`, `Values for "${r.name}" saved`));
  },
  nutReset() {
    const r = resolveFood(NUTED.name) || { name: NUTED.name };
    if (db.nut) delete db.nut[r.name];
    nutInvalidate(); save();
    replaceSheetBody('nutedit', nutEditHtml());
    if (sheetStack.find(s => s.id === 'nutday')) replaceSheetBody('nutday', nutDayHtml());
    refreshEditNut();
    render({ keepScroll: true });
  },
  nutShow() { const n = nutSet(); n.show = n.show === false; save(); render({ keepScroll: true }); },
  nutPreset(el) {
    const n = nutSet();
    if (el.dataset.v === 'moh') { S.nutCustom = false; n.mode = 'moh'; save(); render({ keepScroll: true }); return; }
    n.mode = 'fixed';
    if (el.dataset.v === 'custom') { S.nutCustom = true; save(); render({ keepScroll: true }); return; }
    const [c, p, f] = el.dataset.v.split(',').map(Number);
    S.nutCustom = false; n.target = { c, p, f }; save(); render({ keepScroll: true });
  },
  nutGoalSheet() { nutGoalSheet(); },
};
const NUT_ON = {
  nutGoal(el) { const x = parseInt(el.value, 10); nutSet().goal = x > 0 ? x : null; saveLater(); },
  nutWeek(el) { const x = parseInt(el.value, 10); nutSet().weekGoal = x > 0 ? x : null; saveLater(); },
  nutPct(el) {
    const vals = {};
    $$('#nutCustom [data-on="nutPct"]').forEach(i => { vals[i.dataset.k] = parseInt(i.value, 10) || 0; });
    const sum = vals.c + vals.p + vals.f;
    const msg = $('#nutPctMsg');
    if (sum === 100) { nutSet().target = { c: vals.c, p: vals.p, f: vals.f }; saveLater(); if (msg) msg.textContent = tr('נשמר', 'Saved'); }
    else if (msg) msg.textContent = tr(`הסכום ${sum}%, צריך להיות 100%`, `Total is ${sum}%, it needs to be 100%`);
  },
};
