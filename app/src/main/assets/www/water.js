'use strict';
/* Smart water tracking: millilitres, your own bottles, pace through the day, reminders.
   Loaded before app.js; everything here runs only when app.js calls it. */

const WATER_DEFAULTS = () => ({
  goalMl: 2500, cupMl: 250,
  bottles: [{ id: 'b1', name: '', ml: 750 }],
  mainBottle: 'b1',
  wake: '07:00', sleep: '23:00',
  remind: false, remindEvery: 120,
  countMeals: true,
});

function W() {
  const s = db.settings;
  if (!s.water) s.water = WATER_DEFAULTS();
  const w = s.water;
  if (!w.bottles || !w.bottles.length) w.bottles = WATER_DEFAULTS().bottles;
  if (!w.bottles.find(b => b.id === w.mainBottle)) w.mainBottle = w.bottles[0].id;
  return w;
}
function mainBottle() { const w = W(); return w.bottles.find(b => b.id === w.mainBottle) || w.bottles[0]; }
function bottleName(b) { return b.name || tr('הבקבוק שלי', 'My bottle'); }
function hhmmToMin(t) { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); }
function nowHHMM() { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

/** One-time upgrade from the old "cups" counter. */
function migrateWater() {
  const s = db.settings;
  if (!s.water) {
    s.water = WATER_DEFAULTS();
    if (s.waterGoal) s.water.goalMl = Math.max(1000, Math.min(5000, s.waterGoal * 250));
  } else {
    s.water = Object.assign(WATER_DEFAULTS(), s.water);
  }
  delete s.waterGoal;
  const cup = W().cupMl;
  for (const iso in db.days) {
    const d = db.days[iso];
    if (!d || typeof d !== 'object') { delete db.days[iso]; continue; }
    if (d.drinks && !Array.isArray(d.drinks)) d.drinks = [];
    if (Array.isArray(d.drinks)) d.drinks = d.drinks.filter(x => x && +x.ml > 0).map(x => ({ t: x.t || null, ml: +x.ml }));
    if (typeof d.water === 'string' && d.water.trim()) d.water = parseFloat(d.water) || 0;
    if (typeof d.water === 'number') {
      if (d.water > 0 && !(d.drinks && d.drinks.length)) d.drinks = [{ t: null, ml: d.water * cup }];
      delete d.water;
    }
  }
}

function drinksMl(d) { return d && d.drinks ? d.drinks.reduce((a, x) => a + (x.ml || 0), 0) : 0; }
function isWaterName(n) { return /^(מים|water|מים מינרליים|סודה)$/i.test(String(n || '').trim()); }
/** Water written inside meals ("2 כוסות מים", "בקבוק מים"). */
function mealWaterMl(d) {
  if (!d || !d.meals) return 0;
  const w = W();
  let ml = 0;
  for (const m of MEALS) for (const it of (d.meals[m] || [])) {
    if (!isWaterName(it.name)) continue;
    const q = it.qty == null ? 1 : it.qty;
    let per = w.cupMl;
    if (it.unit === 'בקבוקים') per = mainBottle().ml;
    else if (it.unit === 'גרם') per = 1;
    else if (it.unit === 'ספלים') per = 300;
    ml += q * per;
  }
  return Math.round(ml);
}
function dayWaterMl(d) { return drinksMl(d) + (W().countMeals ? mealWaterMl(d) : 0); }

function fmtL(ml) {
  const l = ml / 1000;
  const s = (Math.round(l * 100) / 100).toString();
  return s;
}
function fmtAmount(ml) {
  if (ml >= 1000) return tr(`${fmtL(ml)} ליטר`, `${fmtL(ml)} L`);
  return tr(`${Math.round(ml)} מ״ל`, `${Math.round(ml)} ml`);
}
function roundMl(x) { return Math.max(10, Math.round(x / 10) * 10); }

/** How you're doing compared with an even pace between waking up and bedtime. */
function waterPace(total, iso) {
  const w = W();
  const goal = w.goalMl;
  if (total >= goal) return { kind: 'done', text: tr('הגעת ליעד היומי. כל הכבוד!', 'Daily goal reached. Well done!') };
  const left = goal - total;
  const b = mainBottle();
  const bottles = left / b.ml;
  const leftTxt = tr(`נשארו ${fmtAmount(left)}`, `${fmtAmount(left)} to go`) + (bottles >= 0.4 ? ` (${bottlesPhrase(bottles)})` : '');
  if (iso !== todayISO()) return { kind: 'past', text: leftTxt };
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const wake = hhmmToMin(w.wake), sleep = hhmmToMin(w.sleep);
  if (now < wake) return { kind: 'early', text: tr('יום חדש מתחיל. כוס מים טובה לבוקר', 'A new day. A glass of water is a good start') };
  const frac = Math.min(1, (now - wake) / Math.max(60, sleep - wake));
  const expected = goal * frac;
  const behind = expected - total;
  if (behind > Math.max(150, w.cupMl * 0.6)) {
    return { kind: 'behind', text: tr(`לפי השעה כדאי להיות ב-${fmtAmount(roundMl(expected))}. חסרים כ-${fmtAmount(roundMl(behind))}`, `By now you'd be at about ${fmtAmount(roundMl(expected))}. About ${fmtAmount(roundMl(behind))} behind`) };
  }
  return { kind: 'ok', text: tr('בקצב טוב. ', 'Right on pace. ') + leftTxt };
}
function fmtBottles(x) {
  const r = Math.round(x * 2) / 2;
  if (r === 0.5) return tr('חצי', '½');
  return String(r);
}
/** "כחצי בקבוק", "כבקבוק אחד", "כבקבוק וחצי", "כ-2 בקבוקים" */
function bottlesPhrase(x) {
  const r = Math.max(0.5, Math.round(x * 2) / 2);
  if (r === 0.5) return tr('כחצי בקבוק', 'about half a bottle');
  if (r === 1) return tr('כבקבוק אחד', 'about 1 bottle');
  if (r === 1.5) return tr('כבקבוק וחצי', 'about 1.5 bottles');
  return tr(`כ-${r} בקבוקים`, `about ${r} bottles`);
}

/* ---------- the bottle drawing ---------- */
function bottleSvg(pct, fromPct) {
  const H = 132, top = 26; // water area inside the body
  const y = (p) => top + H * (1 - Math.min(1, p));
  return `<svg class="bottle" viewBox="0 0 90 170" aria-hidden="true">
    <defs>
      <clipPath id="bclip"><path d="M33 20h24v8c13 6 19 15 19 27v96c0 9-7 15-15 15H29c-8 0-15-6-15-15V55c0-12 6-21 19-27z"/></clipPath>
      <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD3F2"/><stop offset="1" stop-color="#2A86C9"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient>
    </defs>
    <path d="M33 20h24v8c13 6 19 15 19 27v96c0 9-7 15-15 15H29c-8 0-15-6-15-15V55c0-12 6-21 19-27z" fill="rgba(140,200,230,.16)"/>
    <g clip-path="url(#bclip)">
      <g class="blevel" data-y="${y(pct)}" style="transform: translateY(${y(fromPct == null ? pct : fromPct)}px)">
        <path class="bwave back" d="M-90 4 q11.25 -6 22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 V200 H-90z" fill="#7FD3F2" opacity=".55"/>
        <path class="bwave" d="M-90 6 q11.25 -6 22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 t22.5 0 V200 H-90z" fill="url(#wgrad)"/>
      </g>
      <g class="bubbles2" fill="#fff" opacity=".7"><circle cx="34" cy="150" r="2"/><circle cx="52" cy="158" r="1.5"/><circle cx="60" cy="146" r="2.4"/></g>
    </g>
    ${[0.25, 0.5, 0.75].map(p => `<path d="M66 ${y(p)}h7" stroke="currentColor" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>`).join('')}
    <path d="M33 20h24v8c13 6 19 15 19 27v96c0 9-7 15-15 15H29c-8 0-15-6-15-15V55c0-12 6-21 19-27z" fill="url(#glass)" stroke="currentColor" stroke-opacity=".45" stroke-width="2.2"/>
    <rect x="30" y="6" width="30" height="15" rx="4" fill="#2C8FB5"/>
    <rect x="30" y="6" width="30" height="5" rx="2.5" fill="#fff" opacity=".25"/>
    <path d="M22 62v70" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
    <text x="45" y="104" text-anchor="middle" direction="ltr" unicode-bidi="bidi-override" class="bpct">${Math.round(pct * 100)}%</text>
  </svg>`;
}

/* ---------- today's water card ---------- */
function waterCardHtml(iso) {
  const w = W();
  const day = getDay(iso, false);
  const total = dayWaterMl(day);
  const fromMeals = w.countMeals ? mealWaterMl(day) : 0;
  const pct = total / w.goalMl;
  const from = S.waterAnimFrom != null && S.waterAnimDate === iso ? S.waterAnimFrom : pct;
  S.waterAnimFrom = null;
  const pace = waterPace(total, iso);
  const b = mainBottle();
  const q = [[0.25, '¼'], [0.5, '½'], [1, tr('מלא', 'Full')]];
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(iso, i - 6));
  const maxDay = Math.max(w.goalMl, ...last7.map(d => dayWaterMl(db.days[d])));
  const bars = last7.map(d => {
    const v = dayWaterMl(db.days[d]);
    const h = Math.round(v / maxDay * 100);
    return `<div class="wbar ${d === iso ? 'cur' : ''} ${v >= w.goalMl ? 'hit' : ''}" title="${fmtAmount(v)}"><div class="wcol"><i style="height:${Math.max(v ? 6 : 0, h)}%"></i></div><span>${LANG === 'en' ? P.weekdayName(d).slice(0, 2) : 'אבגדהוש'[parseISO(d).getDay()]}</span></div>`;
  }).join('');
  const goalLine = Math.round(w.goalMl / maxDay * 100);
  const lastDrink = day && day.drinks && day.drinks.length ? day.drinks[day.drinks.length - 1] : null;
  return `<section class="card water-card">
    <div class="row between"><h2 class="row">${icon('drop', 20, 'style="color:#2C8FB5"')}${tr('מים', 'Water')}</h2>
      <button class="iconbtn flat" data-act="openDrinks" aria-label="${tr('עוד אפשרויות שתייה', 'More drink options')}">${icon('dots')}</button></div>
    <div class="water-main">
      <button class="bottle-btn" data-act="openDrinks" aria-label="${tr('הוספת שתייה', 'Add a drink')}">${bottleSvg(pct, from)}<span class="bcap">${tr('מהיעד היומי', 'of daily goal')}</span></button>
      <div class="water-info">
        <div class="wtotal"><b>${fmtL(total)}</b><span> ${tr('ליטר שתית היום', 'L drunk today')}</span></div>
        <button class="wgoal-btn" data-act="waterGoal">${tr(`היעד היומי: ${fmtL(w.goalMl)} ליטר`, `Daily goal: ${fmtL(w.goalMl)} L`)}${icon('edit', 13)}</button>
        <div class="wpace ${pace.kind}">${pace.text}</div>
        ${fromMeals ? `<div class="small muted">${tr(`כולל ${fmtAmount(fromMeals)} שנרשמו בארוחות`, `Includes ${fmtAmount(fromMeals)} logged in meals`)}</div>` : ''}
        <button class="wbottle" data-act="editBottle" data-id="${b.id}" aria-label="${tr('עריכת נפח הבקבוק', 'Edit bottle size')}">${icon('bottle', 15)}<span>${esc(bottleName(b))} · ${fmtAmount(b.ml)}</span>${icon('edit', 14)}</button>
        <div class="wquick">
          ${q.map(([f, l]) => `<button class="wq" data-act="drink" data-ml="${roundMl(b.ml * f)}"><b>${l}</b><span dir="ltr">+${roundMl(b.ml * f)}</span></button>`).join('')}
          <button class="wq cup" data-act="drink" data-ml="${w.cupMl}">${icon('glass', 18)}<span dir="ltr">+${w.cupMl}</span></button>
        </div>
        ${lastDrink ? `<button class="wundo" data-act="undoDrink">${icon('undo', 14)}${tr(`ביטול אחרון (${fmtAmount(lastDrink.ml)}${lastDrink.t ? ' ב-' + lastDrink.t : ''})`, `Undo last (${fmtAmount(lastDrink.ml)}${lastDrink.t ? ' at ' + lastDrink.t : ''})`)}</button>` : ''}
      </div>
    </div>
    <div class="wweek" aria-label="${tr('7 הימים האחרונים', 'Last 7 days')}"><div class="wgoal" style="bottom:calc(17px + (100% - 17px) * ${Math.min(100, goalLine) / 100})"></div>${bars}</div>
  </section>`;
}
/** After a render, slide the water level from its old height to the new one. */
function animateBottle() {
  const g = document.querySelector('.blevel');
  if (!g) return;
  requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transform = `translateY(${g.dataset.y}px)`; }));
}

function addDrink(iso, ml) {
  const before = dayWaterMl(getDay(iso, false)) / W().goalMl;
  const d = getDay(iso, true);
  d.drinks = d.drinks || [];
  d.drinks.push({ t: iso === todayISO() ? nowHHMM() : null, ml: Math.round(ml) });
  S.waterAnimFrom = before; S.waterAnimDate = iso;
  const after = dayWaterMl(d);
  save();
  if (before < 1 && after >= W().goalMl) toast(tr('הגעת ליעד המים היומי!', 'You reached your daily water goal!'));
  else toast(tr(`נוספו ${fmtAmount(ml)}`, `Added ${fmtAmount(ml)}`), { label: tr('ביטול', 'Undo'), fn: () => { const dd = getDay(iso, false); if (dd && dd.drinks) dd.drinks.pop(); cleanupDay(iso); save(); render({ keepScroll: true }); animateBottle(); } });
}

/* ---------- drink sheet ---------- */
const DRINK = { src: null, frac: 1, ml: 250 };
function openDrinks() {
  const b = mainBottle();
  DRINK.src = b.id; DRINK.frac = 1; DRINK.ml = b.ml;
  openSheet('drinks', drinksHtml(), { full: true, title: tr('שתייה', 'Drinks'), onClose: () => { render({ keepScroll: true }); animateBottle(); } });
}
function drinkSources() {
  const w = W();
  return w.bottles.map(b => ({ id: b.id, name: bottleName(b), ml: b.ml, bottle: true })).concat([{ id: 'cup', name: tr('כוס', 'Glass'), ml: w.cupMl, bottle: false }]);
}
function drinksHtml() {
  const w = W();
  const day = getDay(S.date, false);
  const src = drinkSources().find(x => x.id === DRINK.src) || drinkSources()[0];
  const fr = [[0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1, tr('מלא', 'Full')]];
  const list = (day && day.drinks) || [];
  return sheetHead(tr('שתייה', 'Drinks')) + `<div class="body">
    <div class="section-t">${tr('ממה שתית?', 'What did you drink from?')}</div>
    <div class="chips" style="margin-top:0">${drinkSources().map(x => `<button class="chip ${x.id === src.id ? 'sel' : ''}" data-act="drinkSrc" data-id="${x.id}">${icon(x.bottle ? 'bottle' : 'glass', 16)}${esc(x.name)} · ${x.ml}</button>`).join('')}
      <button class="chip ghost" data-act="addBottle">${icon('plus', 16)}${tr('בקבוק חדש', 'New bottle')}</button></div>
    <button class="linkbtn" style="align-self:flex-start" data-act="editBottle" data-id="${src.id}">${icon('edit', 14)} ${src.bottle ? tr(`עריכת "${esc(src.name)}" (${src.ml} מ״ל)`, `Edit "${esc(src.name)}" (${src.ml} ml)`) : tr(`שינוי גודל הכוס (${src.ml} מ״ל)`, `Change glass size (${src.ml} ml)`)}</button>
    ${src.bottle ? `<div class="section-t">${tr('כמה מהבקבוק?', 'How much of it?')}</div><div class="seg">${fr.map(([f, l]) => `<button data-act="drinkFrac" data-v="${f}" aria-pressed="${DRINK.frac === f}">${l}</button>`).join('')}</div>` : ''}
    <div class="field"><span>${tr('כמות מדויקת', 'Exact amount')}: <b id="drinkMlLbl">${DRINK.ml} ${tr('מ״ל', 'ml')}</b></span>
      <div class="row" style="gap:10px"><input class="grow" type="range" min="50" max="2000" step="10" value="${DRINK.ml}" data-on="drinkMl" aria-label="${tr('כמות', 'Amount')}">
      <input class="gnum" style="width:92px;flex:none" type="number" inputmode="numeric" min="10" max="5000" step="10" value="${DRINK.ml}" data-on="drinkMlNum" aria-label="${tr('כמות במ״ל', 'Amount in ml')}"></div></div>
    <button class="btn primary big block" data-act="drinkAdd">${icon('plus', 20)}<span id="drinkAddLbl">${tr(`הוסף ${DRINK.ml} מ״ל`, `Add ${DRINK.ml} ml`)}</span></button>
    <div class="section-t">${tr('שתייה היום', 'Today’s drinks')} · ${fmtAmount(drinksMl(day))}</div>
    ${list.length ? `<div class="list">${list.map((x, i) => `<div class="li"><span class="grow"><span class="t">${fmtAmount(x.ml)}</span>${x.t ? `<br><span class="s">${x.t}</span>` : ''}</span><button class="iconbtn plain" data-act="delDrink" data-i="${i}" aria-label="${tr('מחיקה', 'Delete')}">${icon('trash', 18)}</button></div>`).join('')}</div>` : `<div class="small muted">${tr('עוד לא נרשמה שתייה ביום הזה.', 'No drinks logged for this day yet.')}</div>`}
  </div>
  <footer><button class="btn big block" data-act="closeSheet">${tr('סיום', 'Done')}</button></footer>`;
}
function updateDrinkLabels() {
  const a = $('#drinkMlLbl'); if (a) a.textContent = `${DRINK.ml} ${tr('מ״ל', 'ml')}`;
  const b = $('#drinkAddLbl'); if (b) b.textContent = tr(`הוסף ${DRINK.ml} מ״ל`, `Add ${DRINK.ml} ml`);
  const r = $('[data-on="drinkMl"]'); if (r) r.value = DRINK.ml;
  const n = $('[data-on="drinkMlNum"]'); if (n && document.activeElement !== n) n.value = DRINK.ml;
}

/* ---------- settings ---------- */
function waterSettingsHtml() {
  const s = db.settings, w = W();
  return `<section class="card stack">
    <h2 class="row">${icon('drop', 20)}${tr('מים', 'Water')}</h2>
    <div class="row between"><span>${tr('הצג מעקב מים', 'Show water tracker')}</span>${sw('showWater', s.showWater, tr('הצג מעקב מים', 'Show water tracker'))}</div>
    <div class="stack ${s.showWater ? '' : 'hidden'}">
      <div class="row between"><span>${tr('יעד יומי', 'Daily goal')}</span>
        <div class="stepper"><button class="iconbtn plain" data-act="wGoal" data-d="-250" aria-label="${tr('פחות', 'Less')}">${icon('minus', 18)}</button><span class="val" style="min-width:64px">${fmtL(w.goalMl)} ${tr('ל׳', 'L')}</span><button class="iconbtn plain" data-act="wGoal" data-d="250" aria-label="${tr('יותר', 'More')}">${icon('plus', 18)}</button></div></div>
      <button class="btn soft" data-act="wSuggest">${icon('sparkle', 18)}${tr('הצע יעד לפי משקל', 'Suggest a goal from my weight')}</button>
      <div class="row between"><span>${tr('גודל כוס', 'Glass size')}</span>
        <div class="stepper"><button class="iconbtn plain" data-act="wCup" data-d="-50" aria-label="${tr('פחות', 'Less')}">${icon('minus', 18)}</button><span class="val" style="min-width:64px">${w.cupMl} ${tr('מ״ל', 'ml')}</span><button class="iconbtn plain" data-act="wCup" data-d="50" aria-label="${tr('יותר', 'More')}">${icon('plus', 18)}</button></div></div>
      <div class="field"><span>${tr('הבקבוקים שלי (הכוכב = הבקבוק הראשי)', 'My bottles (star = main bottle)')}</span>
        <div class="list">${w.bottles.map(b => `<div class="li">
          <button class="iconbtn plain ${b.id === w.mainBottle ? 'star-on' : ''}" data-act="wMain" data-id="${b.id}" aria-label="${tr('בקבוק ראשי', 'Main bottle')}" aria-pressed="${b.id === w.mainBottle}">${icon('star', 18)}</button>
          <span class="grow"><span class="t">${esc(bottleName(b))}</span><br><span class="s">${fmtAmount(b.ml)}</span></span>
          <button class="iconbtn plain" data-act="editBottle" data-id="${b.id}" aria-label="${tr('עריכה', 'Edit')}">${icon('edit', 18)}</button>
          ${w.bottles.length > 1 ? `<button class="iconbtn plain" data-act="delBottle" data-id="${b.id}" aria-label="${tr('מחיקה', 'Delete')}">${icon('trash', 18)}</button>` : ''}
        </div>`).join('')}</div>
        <button class="btn" data-act="addBottle">${icon('plus', 18)}${tr('הוסף בקבוק', 'Add a bottle')}</button></div>
      <div class="row" style="gap:10px">
        <label class="field grow"><span>${tr('קם בערך ב-', 'Usually up at')}</span><input type="time" value="${w.wake}" data-on="wWake"></label>
        <label class="field grow"><span>${tr('הולך לישון ב-', 'Bedtime')}</span><input type="time" value="${w.sleep}" data-on="wSleep"></label>
      </div>
      <div class="small muted">${tr('לפי השעות האלה האפליקציה יודעת אם אתה בקצב טוב או מאחור.', 'These hours let the app tell whether you are on pace or behind.')}</div>
      <div class="row between"><span>${tr('תזכיר לי לשתות כשאני מאחור', 'Remind me to drink when I’m behind')}</span>${sw('wRemind', w.remind, tr('תזכורת שתייה', 'Water reminder'))}</div>
      <div class="seg ${w.remind ? '' : 'hidden'}">${[[60, tr('כל שעה', 'Hourly')], [120, tr('כל שעתיים', 'Every 2h')], [180, tr('כל 3 שעות', 'Every 3h')]].map(([v, l]) => `<button data-act="wEvery" data-v="${v}" aria-pressed="${w.remindEvery === v}">${l}</button>`).join('')}</div>
      <div class="row between"><span>${tr('לספור מים שרשמתי בארוחות', 'Count water written in meals')}</span>${sw('wMeals', w.countMeals, tr('לספור מים מהארוחות', 'Count water from meals'))}</div>
    </div>
  </section>`;
}
function bottleSheet(id) {
  const w = W();
  const cup = id === 'cup';
  const b = cup ? { id: 'cup', name: '', ml: w.cupMl } : (w.bottles.find(x => x.id === id) || { id: null, name: '', ml: 750 });
  const presets = cup ? [150, 200, 250, 300, 350, 400] : [330, 500, 600, 700, 750, 800, 1000, 1500, 2000];
  openSheet('bottle', sheetHead(cup ? tr('גודל הכוס', 'Glass size') : b.id ? tr('עריכת בקבוק', 'Edit bottle') : tr('בקבוק חדש', 'New bottle')) + `<div class="body">
    ${cup ? '' : `<label class="field"><span>${tr('שם', 'Name')}</span><input type="text" data-on="bName" value="${esc(b.name)}" placeholder="${tr('למשל: הבקבוק הכחול', 'e.g. Blue bottle')}"></label>`}
    <div class="field"><span>${tr('נפח (מ״ל)', 'Size (ml)')}</span>
      <div class="stepper big-step"><button class="iconbtn plain" data-act="bStep" data-d="-50" aria-label="${tr('פחות 50', '50 less')}">${icon('minus', 20)}</button>
        <input class="gnum" type="number" inputmode="numeric" min="50" max="5000" step="10" data-on="bMl" value="${b.ml}" aria-label="${tr('נפח במ״ל', 'Size in ml')}">
        <button class="iconbtn plain" data-act="bStep" data-d="50" aria-label="${tr('עוד 50', '50 more')}">${icon('plus', 20)}</button></div></div>
    <div class="chips" style="margin-top:0">${presets.map(v => `<button class="chip ${v === b.ml ? 'sel' : ''}" data-act="bPreset" data-v="${v}">${v}</button>`).join('')}</div>
    ${!cup && b.id && b.id !== w.mainBottle ? `<button class="btn soft" data-act="bMain" data-id="${b.id}">${icon('star', 18)}${tr('להפוך לבקבוק הראשי', 'Make it the main bottle')}</button>` : ''}
    <p class="small muted" style="margin:0">${cup ? tr('הכוס משמשת לכפתור הכוס ולתזכורת "שתיתי כוס".', 'The glass is used for the glass button and the "I drank a glass" reminder.') : tr('הבקבוק הראשי מופיע בכרטיס המים, והכפתורים ¼, ½ ומלא מחושבים לפי הנפח שלו.', 'The main bottle shows on the water card, and the ¼, ½ and Full buttons use its size.')}</p>
  </div>
  <footer>${!cup && b.id && w.bottles.length > 1 ? `<button class="btn" data-act="bDel" data-id="${b.id}">${icon('trash', 18)}${tr('מחיקה', 'Delete')}</button>` : ''}<button class="btn primary big grow" data-act="bSave" data-id="${b.id || ''}">${tr('שמירה', 'Save')}</button></footer>`, { title: tr('בקבוק', 'Bottle') });
}

/** Daily goal, straight from the water card. */
function waterGoalHtml() {
  const w = W();
  const lw = typeof weights === 'function' ? weights().pop() : null;
  return sheetHead(tr('יעד מים יומי', 'Daily water goal')) + `<div class="body">
    <p class="small muted" style="margin:0">${tr('כמה ליטר אתה רוצה לשתות ביום. הבקבוק בכרטיס מתמלא לפי היעד הזה, ולא לפי גודל הבקבוק שלך.', 'How many litres you want to drink a day. The bottle on the card fills by this goal, not by the size of your own bottle.')}</p>
    <div class="stepper big-step"><button class="iconbtn plain" data-act="wGoalS" data-d="-250" aria-label="${tr('פחות', 'Less')}">${icon('minus', 20)}</button>
      <span class="val grow" style="font-size:24px" id="wGoalVal">${fmtL(w.goalMl)} ${tr('ליטר', 'L')}</span>
      <button class="iconbtn plain" data-act="wGoalS" data-d="250" aria-label="${tr('יותר', 'More')}">${icon('plus', 20)}</button></div>
    <div class="chips" style="margin-top:0">${[1500, 2000, 2500, 3000, 3500].map(v => `<button class="chip ${v === w.goalMl ? 'sel' : ''}" data-act="wGoalSet" data-v="${v}">${fmtL(v)} ${tr('ל׳', 'L')}</button>`).join('')}</div>
    <div class="small muted">${tr(`עם הבקבוק הראשי (${fmtAmount(mainBottle().ml)}) זה ${bottlesPhrase(w.goalMl / mainBottle().ml).replace(/^כ-?/, 'בערך ')} ביום.`, `With your main bottle (${fmtAmount(mainBottle().ml)}) that's ${bottlesPhrase(w.goalMl / mainBottle().ml)} a day.`)}</div>
    ${lw ? `<button class="btn soft" data-act="wGoalWeight">${icon('sparkle', 18)}${tr(`הצע יעד לפי המשקל האחרון (${fmtKg(lw.kg)} ק״ג)`, `Suggest from your last weight (${fmtKg(lw.kg)} kg)`)}</button>` : `<button class="btn soft" data-act="wSuggest">${icon('sparkle', 18)}${tr('הצע יעד לפי משקל', 'Suggest a goal from my weight')}</button>`}
  </div>
  <footer><button class="btn primary big block" data-act="closeSheet">${tr('סיום', 'Done')}</button></footer>`;
}

/* ---------- reminders and the notification's "I drank a glass" button ---------- */
function syncWaterNative() {
  if (!A) return;
  const w = W();
  try {
    const t = todayISO();
    A.setWaterStatus && A.setWaterStatus(t, dayWaterMl(db.days[t]), w.goalMl, w.cupMl);
    A.setWaterReminder && A.setWaterReminder(!!(w.remind && db.settings.showWater), hhmmToMin(w.wake), hhmmToMin(w.sleep), w.remindEvery);
  } catch (e) { }
}
/** Glasses added from the notification while the app was closed. */
function pullPendingWater() {
  if (!A || !A.takePendingWater) return false;
  let list = [];
  try { list = JSON.parse(A.takePendingWater() || '[]'); } catch (e) { }
  if (!list.length) return false;
  for (const x of list) {
    const d = getDay(x.d, true);
    d.drinks = d.drinks || [];
    d.drinks.push({ t: x.t || null, ml: x.ml });
  }
  save();
  return true;
}

/* ---------- import / export helpers ---------- */
function waterRawToMl(raw) {
  if (!raw) return 0;
  const u = String(raw.unit || '').toLowerCase();
  const n = raw.n;
  if (/^(ליטר|ל׳|ל'|ל|l|lt|liter|liters|litre|litres)$/.test(u)) return n * 1000;
  if (/^(מ"ל|מ״ל|מל|ml)$/.test(u)) return n;
  if (/בקבוק|bottle/.test(u)) return n * mainBottle().ml;
  return n * W().cupMl; // glasses (the old format) or no unit
}
