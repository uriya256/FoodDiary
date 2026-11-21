'use strict';
/* Gym workouts in the app: the Today card, the workout sheet, routines, rest timer, records and stats.
   Loaded before app.js; everything here runs only when app.js calls it. Parsing lives in gym.js. */

const GY = window.Gym;
const GYM_GRAD = 'linear-gradient(135deg,#FF8FA3,#D9467A)';
const GROUP_COLOR = { chest: '#E0457B', back: '#4F6FD0', shoulders: '#9A5BD0', arms: '#E9862F', legs: '#2F9F6A', core: '#D9A21B', cardio: '#2C8FB5', other: '#7A8580' };

function gymSet() {
  const s = db.settings;
  if (!s.gym || typeof s.gym !== 'object') s.gym = { rest: 90 };
  if (!s.gym.rest) s.gym.rest = 90;
  return s.gym;
}
function dayGym(d) {
  const g = d && d.gym;
  if (!g || typeof g !== 'object') return null;
  if (!Array.isArray(g.ex)) g.ex = [];
  return g.ex.length || g.minutes || g.title || g.note ? g : null;
}
function groupLabel(gr) { const x = GY.GROUPS[gr] || GY.GROUPS.other; return LANG === 'en' ? x[1] : x[0]; }
function exColor(name) { return GROUP_COLOR[GY.groupOf(name)] || GROUP_COLOR.other; }
/** Text with "3×10" kept left-to-right inside Hebrew lines. */
function gymHtml(text) { return esc(text).replace(/(\d+(?:\.\d+)?×\d+(?:\.\d+)?)/g, '<bdi dir="ltr">$1</bdi>'); }
function exMaxKg(e) { return e && e.kind === 's' ? Math.max(0, ...(e.sets || []).map(x => +x.kg || 0)) : 0; }
function exMaxReps(e) { return e && e.kind === 'r' ? Math.max(0, ...(e.sets || []).map(x => +x.reps || 0)) : 0; }
function gymSetsCount(g) { return (g.ex || []).reduce((a, e) => a + (e.kind === 'c' ? 0 : (e.sets || []).length), 0); }
function gymVolume(g) { return (g.ex || []).reduce((a, e) => a + (e.kind === 's' ? (e.sets || []).reduce((b, x) => b + (+x.reps || 0) * (+x.kg || 0), 0) : 0), 0); }
function fmtNum(n) { return Math.round(n).toLocaleString(LANG === 'en' ? 'en-US' : 'he-IL'); }
function gymSummary(g) {
  const p = [];
  const n = g.ex.length, sets = gymSetsCount(g), vol = gymVolume(g);
  if (n) p.push(`${n} ${plural(n, 'תרגיל', 'תרגילים', 'exercise', 'exercises')}`);
  if (sets) p.push(`${sets} ${plural(sets, 'סט', 'סטים', 'set', 'sets')}`);
  if (g.minutes) p.push(`${g.minutes} ${tr('דק׳', 'min')}`);
  if (vol) p.push(tr(`נפח ${fmtNum(vol)} ק״ג`, `${fmtNum(vol)} kg volume`));
  return p.join(' · ');
}
function gymDates() { return Object.keys(db.days).filter(k => dayGym(db.days[k])).sort(); }
/** The last time an exercise was done before a date: {date, ex}. */
function lastTimeOf(name, beforeIso) {
  const dates = gymDates();
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] >= beforeIso) continue;
    const e = db.days[dates[i]].gym.ex.find(x => x.name === name && (x.kind === 'c' ? x.minutes != null || x.km != null : (x.sets || []).some(s => s.reps != null || s.kg != null)));
    if (e) return { date: dates[i], ex: e };
  }
  return null;
}
/** Exercises that beat everything done before this date (heaviest weight, or most reps for body-weight). */
function prsOf(iso) {
  const g = dayGym(db.days[iso]);
  const out = new Set();
  if (!g) return out;
  const best = {};
  for (const d of gymDates()) {
    if (d >= iso) break;
    for (const e of db.days[d].gym.ex) {
      const v = e.kind === 's' ? exMaxKg(e) : exMaxReps(e);
      if (v) best[e.name] = Math.max(best[e.name] || 0, v);
    }
  }
  for (const e of g.ex) {
    const v = e.kind === 's' ? exMaxKg(e) : exMaxReps(e);
    if (v && best[e.name] && v > best[e.name]) out.add(e.name);
  }
  return out;
}
function newEx(e) {
  const o = { id: uid(), name: e.name, kind: e.kind || 's' };
  if (o.kind === 'c') { o.minutes = e.minutes == null ? null : e.minutes; o.km = e.km == null ? null : e.km; }
  else o.sets = (e.sets || []).map(x => ({ reps: x.reps == null ? null : x.reps, kg: x.kg == null ? null : x.kg }));
  return o;
}
function gymOf(iso, create) {
  const d = getDay(iso, create);
  if (!d) return null;
  if (create && (!d.gym || typeof d.gym !== 'object')) d.gym = { title: '', minutes: null, note: '', ex: [] };
  if (d.gym && !Array.isArray(d.gym.ex)) d.gym.ex = [];
  return d.gym || null;
}
/** Empty sets and empty workouts are dropped when the sheet closes. */
function pruneGym(iso) {
  const d = db.days[iso];
  if (!d || !d.gym) return;
  const g = d.gym;
  g.ex = (g.ex || []).filter(e => e && e.name);
  g.ex.forEach(e => { if (e.kind !== 'c') e.sets = (e.sets || []).filter(x => x.reps != null || x.kg != null); });
  if (!dayGym(d)) delete d.gym;
  cleanupDay(iso);
}
/** Adds parsed exercises (from text, a routine or the AI); returns the new ones. */
function addExercises(iso, list, opts) {
  opts = opts || {};
  const g = gymOf(iso, true);
  const added = list.map(e => {
    let src = e;
    if (opts.fromLast) { const last = lastTimeOf(e.name, iso); if (last) src = Object.assign({}, last.ex, { name: e.name }); }
    return newEx(src);
  });
  g.ex.push(...added);
  return added;
}
/** Everything the user has done before, most used first. */
function usedExercises() {
  const n = {};
  for (const d of gymDates()) for (const e of db.days[d].gym.ex) n[e.name] = (n[e.name] || 0) + 1;
  return Object.keys(n).sort((a, b) => n[b] - n[a]);
}
function knownKind(name) {
  if (GY.info(name)) return GY.kindOf(name);
  const last = lastTimeOf(name, '9999-12-31');
  return last ? last.ex.kind : 's';
}
function gymText(d) { const g = dayGym(d); return g ? GY.workoutText(g) : ''; }
function gymTitleOf(d) { const g = dayGym(d); return g && g.title ? g.title : ''; }

/* ---------- today card ---------- */
function workoutCardHtml(iso) {
  const day = getDay(iso, false);
  const g = dayGym(day);
  const routines = db.routines || [];
  let h = `<section class="card gym-card" aria-label="${tr('אימון', 'Workout')}">
    <div class="meal-head">
      <span class="meal-icon" style="background:${GYM_GRAD};--glow:#D9467A">${icon('dumbbell', 24)}</span>
      <div class="meal-title"><h2>${g && g.title ? esc(g.title) : tr('אימון', 'Workout')}</h2>${g ? `<div class="sub">${esc(gymSummary(g))}</div>` : ''}</div>
      <button class="iconbtn primary" data-act="openGym" aria-label="${g ? tr('עריכת האימון', 'Edit workout') : tr('הוספת אימון', 'Add a workout')}">${icon(g ? 'edit' : 'plus')}</button>
    </div>`;
  if (g && g.ex.length) {
    const prs = prsOf(iso);
    h += `<div class="gym-list">${g.ex.map((e, i) => {
      const det = GY.exDetail(e);
      return `<button class="gym-row" data-act="openGym" data-i="${i}"><span class="gdot" style="background:${exColor(e.name)}"></span><span class="grow"><span class="gn" dir="auto">${esc(GY.displayName(e.name))}</span>${det ? `<span class="gd">${gymHtml(det)}</span>` : ''}</span>${prs.has(e.name) ? `<span class="pr">${icon('trophy', 14)}${tr('שיא!', 'PR!')}</span>` : ''}</button>`;
    }).join('')}</div>`;
  } else if (!g) {
    const last = gymDates().filter(d => d < iso).pop();
    h += `<div class="chips">${routines.slice(0, 3).map(r => `<button class="chip tpl" data-act="gymRoutine" data-id="${r.id}">${icon('dumbbell', 16)}${esc(r.name)}</button>`).join('')}
      ${!routines.length && last ? `<button class="chip tpl" data-act="gymRepeat">${icon('undo', 16)}${tr('כמו באימון הקודם', 'Same as last workout')}</button>` : ''}
      <button class="chip ghost" data-act="openGym">${icon('plus', 16)}${tr('התאמנת היום?', 'Did you work out?')}</button></div>`;
  }
  if (g && g.note) h += `<div class="meal-note">${icon('note', 16)}<span>${esc(g.note)}</span></div>`;
  if (REST.end && iso === todayISO()) h += `<button class="btn soft block" style="margin-top:10px" data-act="openGym">${icon('timer', 18)}${tr('מנוחה', 'Rest')} <span dir="ltr" class="restmini">${fmtSec(restLeft())}</span></button>`;
  return h + `</section>`;
}

/* ---------- workout sheet ---------- */
const WK = { iso: null, find: '', text: '', grp: '' };
function openGym(iso, focus) {
  WK.iso = iso; WK.find = ''; WK.text = ''; WK.grp = '';
  openSheet('gym', gymSheetHtml(), {
    full: true, title: tr('אימון', 'Workout'),
    onClose: () => { flushGymText(); pruneGym(WK.iso); save(); render({ keepScroll: true }); },
  });
  if (focus != null) setTimeout(() => { const el = $(`#sheets .gx[data-i="${focus}"]`); if (el) el.scrollIntoView({ block: 'center' }); }, 260);
}
function refreshGym() { if (sheetStack.find(s => s.id === 'gym')) replaceSheetBody('gym', gymSheetHtml()); }
function gymSheetHtml() {
  const iso = WK.iso;
  const g = gymOf(iso, false) || { title: '', minutes: null, note: '', ex: [] };
  const routines = db.routines || [];
  const prs = prsOf(iso);
  const lastDay = gymDates().filter(d => d < iso).pop();
  let h = sheetHead(tr('אימון', 'Workout') + ` · ${shortDate(iso)}`) + `<div class="body">
    <input class="search" type="text" data-on="gTitle" value="${esc(g.title || '')}" placeholder="${tr('שם האימון (לא חובה), למשל: חזה וכתפיים', 'Workout name (optional), e.g. Chest and shoulders')}" aria-label="${tr('שם האימון', 'Workout name')}">`;
  if (!g.ex.length && (routines.length || lastDay)) {
    h += `<div class="section-t">${tr('להתחיל מ…', 'Start from…')}</div><div class="chips" style="margin-top:0">
      ${routines.map(r => `<button class="chip tpl" data-act="gRoutine" data-id="${r.id}">${icon('dumbbell', 16)}${esc(r.name)}</button>`).join('')}
      ${lastDay ? `<button class="chip" data-act="gymRepeat">${icon('undo', 16)}${tr('האימון הקודם', 'Last workout')} (${esc(gymTitleOf(db.days[lastDay]) || P.displayDate(lastDay))})</button>` : ''}</div>`;
  }
  h += `<form class="row" data-form="gym" autocomplete="off">
      <input class="search grow" type="text" data-on="gText" value="${esc(WK.text)}" placeholder="${tr('כתוב בקצרה: סקוואט 4x8 80 קג, הליכון 20 דקות', 'Type it: squat 4x8 80kg, treadmill 20 min')}" aria-label="${tr('כתיבת תרגילים', 'Type exercises')}" enterkeyhint="send" autocomplete="off">
      <button type="submit" class="iconbtn primary" aria-label="${tr('הוספה', 'Add')}">${icon('plus')}</button>
    </form>
    <div id="gymLive">${gymLiveHtml()}</div>`;
  h += g.ex.map((e, i) => exBlockHtml(e, i, prs.has(e.name))).join('');
  h += `<div class="section-t">${g.ex.length ? tr('עוד תרגיל', 'Another exercise') : tr('בחירת תרגיל', 'Pick an exercise')}</div>
    <div class="searchbox">${icon('search', 18)}<input class="search" type="search" data-on="gFind" value="${esc(WK.find)}" placeholder="${tr('חיפוש או שם חדש', 'Search or a new name')}" aria-label="${tr('חיפוש תרגיל', 'Find an exercise')}"></div>
    <div id="gymFind">${findHtml()}</div>
    <div class="row" style="gap:10px;align-items:flex-end">
      <label class="field grow"><span>${tr('משך האימון (דקות)', 'Workout length (min)')}</span><input type="number" inputmode="numeric" min="0" max="600" data-on="gMin" value="${g.minutes == null ? '' : g.minutes}" placeholder="–"></label>
      ${g.ex.length ? `<button class="btn soft" style="min-height:48px" data-act="gSaveRoutine">${icon('bookmark', 18)}${tr('שמור כשגרה', 'Save as routine')}</button>` : ''}
    </div>
    <label class="field"><span>${tr('הערה', 'Note')}</span><textarea class="note" rows="2" data-on="gNote" placeholder="${tr('איך הרגשת, כאב, שיא חדש…', 'How it felt, any pain, a new best…')}">${esc(g.note || '')}</textarea></label>
  </div>
  <footer><div id="restBox" class="restbox">${restBoxHtml()}</div><button class="btn primary big grow" data-act="closeSheet">${tr('סיום', 'Done')}</button></footer>`;
  return h;
}
function exBlockHtml(e, i, isPr) {
  const last = lastTimeOf(e.name, WK.iso);
  let h = `<div class="gx" data-i="${i}">
    <div class="gx-head"><span class="gdot" style="background:${exColor(e.name)}"></span><b class="grow" dir="auto">${esc(GY.displayName(e.name))}</b>${isPr ? `<span class="pr">${icon('trophy', 14)}${tr('שיא!', 'PR!')}</span>` : ''}
      ${last ? `<button class="iconbtn flat" data-act="exProg" data-name="${esc(e.name)}" aria-label="${tr('התקדמות ב', 'Progress in ')}${esc(GY.displayName(e.name))}">${icon('chart', 18)}</button>` : ''}
      <button class="iconbtn flat" data-act="gDelEx" data-i="${i}" aria-label="${tr('מחיקת התרגיל', 'Delete exercise')} ${esc(GY.displayName(e.name))}">${icon('trash', 18)}</button></div>`;
  if (last) h += `<div class="gprev">${icon('history', 14)}<span>${tr('בפעם הקודמת', 'Last time')} (${esc(P.displayDate(last.date))}): ${gymHtml(GY.exDetail(last.ex) || '–')}</span></div>`;
  if (e.kind === 'c') {
    const mm = e.minutes == null ? '' : Math.floor(e.minutes + 1e-6);
    const ss = e.minutes == null ? '' : Math.round((e.minutes - Math.floor(e.minutes + 1e-6)) * 60);
    h += `<div class="row" style="gap:8px">
      <label class="field grow"><span>${tr('ק״מ', 'km')}</span><input class="gnum" type="number" inputmode="decimal" min="0" step="any" data-on="gC" data-i="${i}" data-f="km" value="${e.km == null ? '' : e.km}" placeholder="–"></label>
      <label class="field grow"><span>${tr('דקות', 'Minutes')}</span><input class="gnum" type="number" inputmode="numeric" min="0" data-on="gT" data-i="${i}" data-f="m" value="${mm}"></label>
      <label class="field grow"><span>${tr('שניות', 'Seconds')}</span><input class="gnum" type="number" inputmode="numeric" min="0" max="59" data-on="gT" data-i="${i}" data-f="s" value="${ss || ''}" placeholder="0"></label></div>
      <div class="small muted gpace" data-pace="${i}">${paceHtml(e)}</div>`;
  } else {
    const sets = e.sets || [];
    h += `<div class="gsets"><span class="gh">${tr('סט', 'Set')}</span><span class="gh">${tr('חזרות', 'Reps')}</span><span class="gh">${e.kind === 'r' ? tr('תוספת ק״ג', 'Added kg') : tr('ק״ג', 'kg')}</span><span></span>
      ${sets.map((x, j) => `<span class="n">${j + 1}</span>
        <input class="gnum" type="number" inputmode="numeric" min="0" data-on="gS" data-i="${i}" data-j="${j}" data-f="reps" value="${x.reps == null ? '' : x.reps}" aria-label="${tr(`חזרות בסט ${j + 1}`, `Reps in set ${j + 1}`)}">
        <input class="gnum" type="number" inputmode="decimal" min="0" step="any" data-on="gS" data-i="${i}" data-j="${j}" data-f="kg" value="${x.kg == null ? '' : x.kg}" placeholder="${e.kind === 'r' ? '–' : ''}" aria-label="${tr(`משקל בסט ${j + 1}`, `Weight in set ${j + 1}`)}">
        <button class="iconbtn flat" data-act="gDelSet" data-i="${i}" data-j="${j}" aria-label="${tr(`מחיקת סט ${j + 1}`, `Delete set ${j + 1}`)}">${icon('x', 16)}</button>`).join('')}
    </div>
    <button class="btn" data-act="gAddSet" data-i="${i}">${icon('plus', 16)}${tr('סט', 'Set')}${sets.length ? ` <span class="small muted">${tr('(מעתיק את האחרון)', '(copies the last one)')}</span>` : ''}</button>`;
  }
  return h + `</div>`;
}
function gymLiveHtml() {
  const t = WK.text.trim();
  if (!t) return '';
  const r = GY.parseWorkout(t);
  if (!r.exercises.length) return '';
  return `<div class="preview"><span class="small muted">${tr('יתווסף בלחיצה על + או על "סיום":', 'Will be added when you tap + or "Done":')}</span><div class="chips">${r.exercises.map(e => `<span class="chip sel">${gymHtml(GY.exText(e))}</span>`).join('')}</div></div>`;
}
function findHtml() {
  const q = GY.norm(WK.find);
  const used = usedExercises();
  const chip = (n) => `<button class="chip" data-act="gAdd" data-name="${esc(n)}"><span class="gdot" style="background:${exColor(n)}"></span><bdi>${esc(GY.displayName(n))}</bdi></button>`;
  if (q) {
    const all = Array.from(new Set(used.concat(Object.keys(GY.EX))));
    const hit = all.filter(n => GY.norm(n).includes(q) || GY.norm(GY.displayName(n)).includes(q) || GY.norm((GY.info(n) || {}).en).includes(q));
    // aliases ("בנץ", "ohp") point to the real name
    const al = GY.ALIAS[q]; if (al && !hit.includes(al)) hit.unshift(al);
    const exact = hit.some(n => GY.norm(n) === q || GY.norm(GY.displayName(n)) === q);
    return `<div class="chips" style="margin-top:0">${hit.slice(0, 14).map(chip).join('')}${exact ? '' : `<button class="chip tpl" data-act="gAdd" data-name="${esc(WK.find.trim())}">${icon('plus', 14)}${tr('תרגיל חדש: ', 'New exercise: ')}${esc(WK.find.trim())}</button>`}</div>`;
  }
  const mine = used.slice(0, 12);
  const grp = WK.grp || (mine.length ? 'mine' : 'chest');
  const tabs = (mine.length ? [['mine', tr('שלי', 'Mine')]] : []).concat(Object.keys(GY.GROUPS).map(g => [g, groupLabel(g)]));
  const names = grp === 'mine' ? mine : Object.keys(GY.EX).filter(n => GY.groupOf(n) === grp).concat(used.filter(n => !GY.info(n) && grp === 'other'));
  return `<div class="bgcats" role="group" aria-label="${tr('אזור בגוף', 'Body area')}">${tabs.map(([v, l]) => `<button data-act="gGrp" data-v="${v}" aria-pressed="${grp === v}">${l}</button>`).join('')}</div>
    <div class="chips" style="margin-top:8px">${names.map(chip).join('')}</div>`;
}
function flushGymText() {
  const inp = $('#sheets [data-on="gText"]');
  const t = ((inp && inp.value) || WK.text || '').trim();
  WK.text = '';
  if (!t) return 0;
  const r = GY.parseWorkout(t);
  if (!r.exercises.length && !r.minutes) return 0;
  const g = gymOf(WK.iso, true);
  addExercises(WK.iso, r.exercises);
  if (r.minutes && !g.minutes) g.minutes = r.minutes;
  if (r.note) g.note = g.note ? g.note + '\n' + r.note : r.note;
  return r.exercises.length;
}
function gymBuzz() { try { if (A && A.vibrate) A.vibrate(false); else if (navigator.vibrate) navigator.vibrate(20); } catch (e) { } }
function applyRoutine(iso, r) {
  const g = gymOf(iso, true);
  addExercises(iso, r.ex, { fromLast: true });
  if (!g.title) g.title = r.name;
  save();
}

function paceHtml(e) {
  const p = GY.paceOf(e);
  return p ? tr(`קצב: <b dir="ltr">${GY.clock(p)}</b> דקות לק״מ · ${fmtKmh(e)} קמ״ש`, `Pace: <b>${GY.clock(p)}</b> min/km · ${fmtKmh(e)} km/h`) : (e.km == null ? tr('אם תכתוב ק״מ וזמן, נחשב את הקצב', 'Add km and time to see your pace') : '');
}
function fmtKmh(e) { return (Math.round(e.km / (e.minutes / 60) * 10) / 10).toLocaleString(LANG === 'en' ? 'en-US' : 'he-IL'); }

/* ---------- progress of one exercise ---------- */
function exHistory(name) {
  const out = [];
  for (const d of gymDates()) {
    for (const e of db.days[d].gym.ex) {
      if (e.name !== name) continue;
      const ok = e.kind === 'c' ? e.minutes != null || e.km != null : (e.sets || []).some(x => x.reps != null || x.kg != null);
      if (ok) out.push({ date: d, ex: e });
    }
  }
  return out;
}
function epley(e) { return Math.max(0, ...(e.sets || []).map(x => (+x.kg || 0) * (1 + Math.min(+x.reps || 0, 12) / 30))); }
function openExProg(name) {
  openSheet('exprog', exProgHtml(name), { full: true, title: GY.displayName(name) });
}
function weeksText(days) {
  if (days < 14) return tr(`${days} ימים`, `${days} days`);
  const w = Math.round(days / 7 * 10) / 10;
  return tr(`${w.toLocaleString('he-IL')} שבועות`, `${w} weeks`);
}
function exProgHtml(name) {
  const H = exHistory(name);
  const nm = GY.displayName(name);
  let h = sheetHead(tr(`התקדמות: ${nm}`, `Progress: ${nm}`)) + `<div class="body">`;
  if (!H.length) return h + `<p class="muted">${tr('עוד אין נתונים לתרגיל הזה.', 'No data for this exercise yet.')}</p></div>`;
  const kind = H[H.length - 1].ex.kind;
  const tile = (big, lbl, color) => `<div class="tile"><div class="big"${color ? ` style="color:${color}"` : ''}>${big}</div><div class="lbl">${lbl}</div></div>`;
  const first = H[0], last = H[H.length - 1];
  const span = daysBetween(first.date, last.date);
  if (kind === 's' || kind === 'r') {
    const val = (e) => kind === 's' ? exMaxKg(e) : exMaxReps(e);
    const pts = H.map(x => ({ d: x.date, v: val(x.ex) })).filter(p => p.v > 0);
    const unit = kind === 's' ? tr('ק״ג', 'kg') : tr('חזרות', 'reps');
    if (pts.length) {
      const a = pts[0], b = pts[pts.length - 1], best = Math.max(...pts.map(p => p.v));
      // each time the top weight went above everything before = one step up
      let top = a.v; const ups = [];
      pts.slice(1).forEach(p => { if (p.v > top) { ups.push(p.d); top = p.v; } });
      const gaps = ups.map((d, i) => daysBetween(i ? ups[i - 1] : a.d, d));
      const avgGap = gaps.length ? gaps.reduce((x, y) => x + y, 0) / gaps.length : null;
      const diff = Math.round((b.v - a.v) * 10) / 10;
      h += `<div class="prog-sum">
        ${tile(tr(`${fmtN1(a.v)} ← ${fmtN1(b.v)}`, `${fmtN1(a.v)} → ${fmtN1(b.v)}`), tr(`${unit}: מ-${P.displayDate(a.d)} עד היום`, `${unit}: ${P.displayDate(a.d)} to now`))}
        ${tile(`${diff > 0 ? '+' : ''}${fmtN1(diff)}`, tr(`${unit} ב-${weeksText(span)}`, `${unit} in ${weeksText(span)}`), diff > 0 ? '#2F8F5A' : '')}
        ${tile(fmtN1(best), tr(`הכי ${kind === 's' ? 'כבד' : 'הרבה'} (${unit})`, `best (${unit})`), '#D9467A')}
        ${tile(avgGap != null ? weeksText(Math.round(avgGap)) : '–', avgGap != null ? tr(`בממוצע בין העלאות (${ups.length} ${ups.length === 1 ? 'העלאה' : 'העלאות'})`, `on average between increases (${ups.length})`) : tr('עוד לא העלית', 'No increase yet'))}
      </div>`;
      if (span >= 14 && diff) h += `<p class="small" style="margin:0">${tr(`בממוצע ${diff > 0 ? '+' : ''}${fmtN1(diff / (span / 30.44))} ${unit} בחודש.`, `On average ${diff > 0 ? '+' : ''}${fmtN1(diff / (span / 30.44))} ${unit} a month.`)}${kind === 's' && epley(last.ex) ? ' ' + tr(`חזרה אחת מקסימלית משוערת: ${fmtN1(Math.round(epley(last.ex) * 2) / 2)} ק״ג.`, `Estimated one-rep max: ${fmtN1(Math.round(epley(last.ex) * 2) / 2)} kg.`) : ''}</p>`;
      if (pts.length > 1) h += lineChartSvg(pts, { color: '#D9467A', fmt: v => fmtN1(Math.round(v * 2) / 2), label: tr(`גרף ${unit}`, `${unit} chart`) });
    }
  } else {
    const runs = H.filter(x => GY.paceOf(x.ex));
    if (runs.length) {
      const paces = runs.map(x => ({ d: x.date, v: GY.paceOf(x.ex) }));
      const totKm = runs.reduce((a, x) => a + x.ex.km, 0), totMin = runs.reduce((a, x) => a + x.ex.minutes, 0);
      const avg = totMin / totKm;
      const best = Math.min(...paces.map(p => p.v));
      const lp = paces[paces.length - 1].v, fp = paces[0].v;
      const imp = fp - lp;
      h += `<div class="prog-sum">
        ${tile(`<span dir="ltr">${GY.clock(avg)}</span>`, tr(`קצב ממוצע לק״מ (${runs.length} פעמים)`, `average pace per km (${runs.length} times)`))}
        ${tile(`<span dir="ltr">${GY.clock(lp)}</span>`, tr('קצב בפעם האחרונה', 'pace last time'))}
        ${tile(`<span dir="ltr">${GY.clock(best)}</span>`, tr('הקצב הכי מהיר', 'fastest pace'), '#D9467A')}
        ${tile(runs.length > 1 ? `<span dir="ltr">${imp >= 0 ? '−' : '+'}${GY.clock(Math.abs(imp))}</span>` : '–', runs.length > 1 ? tr(imp >= 0 ? 'מהר יותר לק״מ מהפעם הראשונה' : 'איטי יותר לק״מ מהפעם הראשונה', imp >= 0 ? 'faster per km than the first time' : 'slower per km than the first time') : tr('אחרי עוד פעם נראה שיפור', 'Do it again to see a change'), runs.length > 1 && imp > 0 ? '#2F8F5A' : '')}
      </div>`;
      // the distance done most often (e.g. always 5 km): time for that distance
      const byKm = {};
      runs.forEach(x => { const k = Math.round(x.ex.km * 2) / 2; (byKm[k] = byKm[k] || []).push(x); });
      const common = Object.keys(byKm).sort((a, b) => byKm[b].length - byKm[a].length)[0];
      const same = byKm[common];
      if (same && same.length >= 2) {
        const times = same.map(x => x.ex.minutes);
        const avgT = times.reduce((a, b) => a + b, 0) / times.length;
        const recent = times.slice(-3), early = times.slice(0, Math.min(3, times.length - recent.length || 1));
        const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length, eAvg = early.reduce((a, b) => a + b, 0) / early.length;
        h += `<div class="section-t">${tr(`${fmtN1(+common)} ק״מ (${same.length} פעמים)`, `${fmtN1(+common)} km (${same.length} times)`)}</div>
          <div class="prog-sum">
            ${tile(`<span dir="ltr">${GY.clock(avgT)}</span>`, tr('זמן ממוצע', 'average time'))}
            ${tile(`<span dir="ltr">${GY.clock(Math.min(...times))}</span>`, tr('הכי מהר', 'fastest'), '#D9467A')}
            ${tile(`<span dir="ltr">${GY.clock(times[times.length - 1])}</span>`, tr('בפעם האחרונה', 'last time'))}
            ${times.length >= 4 ? tile(`<span dir="ltr">${eAvg - rAvg >= 0 ? '−' : '+'}${GY.clock(Math.abs(eAvg - rAvg))}</span>`, tr('ממוצע 3 האחרונות מול הראשונות', 'last 3 average vs the first ones'), eAvg > rAvg ? '#2F8F5A' : '') : tile(`<span dir="ltr">${GY.clock(times[0])}</span>`, tr('בפעם הראשונה', 'first time'))}
          </div>`;
      }
      if (paces.length > 1) h += `<div class="section-t">${tr('קצב לק״מ (למעלה = מהר יותר)', 'Pace per km (higher = faster)')}</div>` + lineChartSvg(paces, { color: '#2C8FB5', invert: true, minPad: 0.1, fmt: v => GY.clock(v), label: tr('גרף קצב', 'Pace chart') });
    } else {
      const pts = H.filter(x => x.ex.minutes).map(x => ({ d: x.date, v: x.ex.minutes }));
      if (pts.length) {
        const avg = pts.reduce((a, p) => a + p.v, 0) / pts.length;
        h += `<div class="prog-sum">${tile(fmtN1(Math.round(avg)), tr('דקות בממוצע', 'minutes on average'))}${tile(fmtN1(Math.round(Math.max(...pts.map(p => p.v)))), tr('הכי ארוך (דקות)', 'longest (min)'), '#D9467A')}</div>
          <p class="small muted" style="margin:0">${tr('כדי לראות קצב, כתוב גם מרחק, למשל: ריצה 5 קמ 28:30', 'To see your pace, add the distance too, e.g. run 5 km 28:30')}</p>`;
        if (pts.length > 1) h += lineChartSvg(pts, { color: '#2C8FB5', fmt: v => fmtN1(Math.round(v)), label: tr('גרף דקות', 'Minutes chart') });
      }
    }
  }
  h += `<div class="section-t">${tr('כל הפעמים', 'Every time')}</div><div class="list">${H.slice().reverse().map(x => `<div class="li"><span class="grow"><span class="t">${gymHtml(GY.exDetail(x.ex) || '–')}</span><br><span class="s">${P.weekdayName(x.date)}, ${P.displayDate(x.date)}</span></span></div>`).join('')}</div>`;
  return h + `</div><footer><button class="btn primary big block" data-act="closeSheet">${tr('סגירה', 'Close')}</button></footer>`;
}
function fmtN1(n) { return (Math.round(n * 10) / 10).toLocaleString(LANG === 'en' ? 'en-US' : 'he-IL', { maximumFractionDigits: 1 }); }

/* ---------- rest timer ---------- */
const REST = { end: 0, total: 0, timer: null };
function restLeft() { return Math.max(0, Math.ceil((REST.end - Date.now()) / 1000)); }
function fmtSec(s) { return `${Math.floor(s / 60)}:${pad(s % 60)}`; }
function restBoxHtml() {
  if (REST.end && restLeft() > 0) {
    const pct = Math.round((1 - restLeft() / REST.total) * 100);
    return `<button class="btn rest on" data-act="gRestStop" style="--pp:${pct}%" aria-label="${tr('עצירת הטיימר', 'Stop the timer')}">${icon('timer', 18)}<span id="restLbl" dir="ltr">${fmtSec(restLeft())}</span></button><button class="btn" data-act="gRestAdd" aria-label="${tr('עוד 30 שניות', '30 more seconds')}"><span dir="ltr">+30</span></button>`;
  }
  return `<button class="btn rest" data-act="gRest">${icon('timer', 18)}${tr('מנוחה', 'Rest')} <span dir="ltr">${fmtSec(gymSet().rest)}</span></button>`;
}
function restStart(sec, total) {
  REST.total = total || sec; REST.end = Date.now() + sec * 1000;
  try { if (A && A.restStart) A.restStart(sec, tr('המנוחה נגמרה', 'Rest is over'), tr('זמן לסט הבא 💪', 'Time for the next set 💪')); } catch (e) { }
  clearInterval(REST.timer);
  REST.timer = setInterval(restTick, 250);
  restTick(true);
}
function restStop(quiet) {
  clearInterval(REST.timer); REST.timer = null; REST.end = 0;
  try { if (A && A.restCancel) A.restCancel(); } catch (e) { }
  const box = $('#restBox'); if (box) box.innerHTML = restBoxHtml();
  if (!quiet && S.tab === 'today' && !sheetStack.length) render({ keepScroll: true });
}
function restTick(force) {
  const box = $('#restBox');
  const left = restLeft();
  if (left <= 0) {
    clearInterval(REST.timer); REST.timer = null; REST.end = 0;
    if (box) box.innerHTML = restBoxHtml();
    toast(tr('המנוחה נגמרה, זמן לסט הבא 💪', 'Rest is over, time for the next set 💪'));
    if (!(A && A.restStart)) { try { navigator.vibrate && navigator.vibrate([350, 150, 350, 150, 500]); } catch (e) { } }
    if (S.tab === 'today' && !sheetStack.length) render({ keepScroll: true });
    return;
  }
  if (box) {
    const lbl = $('#restLbl', box);
    if (force || !lbl) box.innerHTML = restBoxHtml();
    else { lbl.textContent = fmtSec(left); box.firstElementChild.style.setProperty('--pp', Math.round((1 - left / REST.total) * 100) + '%'); }
  }
  const mini = $('#screen .restmini'); if (mini) mini.textContent = fmtSec(left);
}

/* ---------- history, stats, settings ---------- */
function gymHistoryLine(d) {
  const g = dayGym(d);
  if (!g) return '';
  const names = g.ex.map(e => GY.displayName(e.name));
  const txt = (g.title ? g.title + (names.length ? ': ' : '') : '') + names.join(', ') + (g.minutes ? ` (${g.minutes} ${tr('דק׳', 'min')})` : '');
  return txt || tr('אימון', 'Workout');
}
function gymStatsHtml(dates) {
  const gd = dates.filter(iso => dayGym(db.days[iso]));
  if (!gd.length) return '';
  let minutes = 0, sets = 0, vol = 0;
  const count = {}, groupDays = {}, first = {}, lastV = {};
  for (const iso of gd) {
    const g = db.days[iso].gym;
    minutes += +g.minutes || 0; sets += gymSetsCount(g); vol += gymVolume(g);
    const seen = new Set();
    for (const e of g.ex) {
      count[e.name] = (count[e.name] || 0) + 1;
      seen.add(GY.groupOf(e.name));
      const v = e.kind === 's' ? exMaxKg(e) : 0;
      if (v) { if (first[e.name] == null) first[e.name] = v; lastV[e.name] = v; }
    }
    seen.forEach(gr => { groupDays[gr] = (groupDays[gr] || 0) + 1; });
  }
  const weeks = Math.max(1, dates.length / 7);
  const top = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 8);
  const maxC = top.length ? count[top[0]] : 1;
  const prog = Object.keys(first).filter(n => count[n] >= 2).map(n => [n, first[n], lastV[n]]).sort((a, b) => (b[2] - b[1]) - (a[2] - a[1])).slice(0, 8);
  let h = `<section class="card"><h3 class="row">${icon('dumbbell', 18)}${tr('אימונים', 'Workouts')}</h3>
    <div class="tiles" style="margin-bottom:6px">
      <div class="tile"><div class="big" style="color:#D9467A">${gd.length}</div><div class="lbl">${tr(`אימונים · ${(gd.length / weeks).toFixed(1)} בשבוע`, `workouts · ${(gd.length / weeks).toFixed(1)} a week`)}</div></div>
      <div class="tile"><div class="big">${minutes ? fmtNum(minutes) : '–'}</div><div class="lbl">${tr('דקות אימון', 'minutes trained')}</div></div>
      <div class="tile"><div class="big">${sets || '–'}</div><div class="lbl">${tr('סטים', 'sets')}</div></div>
      <div class="tile"><div class="big">${vol ? fmtNum(vol) : '–'}</div><div class="lbl">${tr('ק״ג נפח (חזרות × משקל)', 'kg volume (reps × weight)')}</div></div>
    </div>`;
  if (prog.length) {
    h += `<div class="section-t" style="margin:8px 0 6px">${tr('התקדמות במשקל (המשקל הכי כבד, בפעם הראשונה בתקופה ובאחרונה)', 'Weight progress (heaviest weight, first time in the period vs latest)')}</div><div class="list">${prog.map(([n, a, b]) => {
      const d = Math.round((b - a) * 100) / 100;
      return `<button class="li" data-act="exProg" data-name="${esc(n)}"><span class="gdot" style="background:${exColor(n)}"></span><span class="grow t" dir="auto">${esc(GY.displayName(n))}</span><span class="small">${tr(`${a} ← ${b} ק״ג`, `${a} → ${b} kg`)}</span><span class="gdelta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}" dir="ltr">${d > 0 ? '+' : ''}${d}</span></button>`;
    }).join('')}</div>`;
  }
  h += `<div class="section-t" style="margin:12px 0 8px">${tr('התרגילים הכי נפוצים', 'Most done exercises')}</div><div class="stack">${top.map(n => `<button class="barrow plain-btn" data-act="exProg" data-name="${esc(n)}"><div class="row between"><span dir="auto">${esc(GY.displayName(n))}</span><span class="muted small">${count[n]} ${plural(count[n], 'פעם', 'פעמים', 'time', 'times')}</span></div><div class="bar"><i style="width:${Math.round(count[n] / maxC * 100)}%;background:${exColor(n)}"></i></div></button>`).join('')}</div>`;
  const grs = Object.keys(GY.GROUPS).filter(gr => groupDays[gr]);
  if (grs.length > 1) {
    h += `<div class="section-t" style="margin:12px 0 8px">${tr('כמה אימונים כל אזור קיבל', 'Workouts per body area')}</div><div class="stack">${grs.map(gr => `<div class="barrow"><div class="row between"><span>${groupLabel(gr)}</span><span class="muted small">${groupDays[gr]}</span></div><div class="bar"><i style="width:${Math.round(groupDays[gr] / gd.length * 100)}%;background:${GROUP_COLOR[gr]}"></i></div></div>`).join('')}</div>`;
  }
  return h + `</section>`;
}
function gymSettingsHtml() {
  const s = db.settings, gs = gymSet();
  const on = s.showGym !== false;
  const routines = db.routines || [];
  return `<section class="card stack">
    <h2 class="row">${icon('dumbbell', 20)}${tr('אימונים', 'Workouts')}</h2>
    <div class="row between"><span>${tr('הצג אימון במסך "היום"', 'Show workouts on Today')}</span>${sw('showGym', on, tr('הצג אימונים', 'Show workouts'))}</div>
    <div class="stack ${on ? '' : 'hidden'}">
      <div class="field"><span>${tr('זמן מנוחה בין סטים', 'Rest between sets')}</span><div class="seg">${[60, 90, 120, 180].map(v => `<button data-act="gRestDef" data-v="${v}" aria-pressed="${gs.rest === v}"><span dir="ltr">${fmtSec(v)}</span></button>`).join('')}</div></div>
      <div class="field"><span>${tr('השגרות שלי', 'My routines')}</span>
        ${routines.length ? `<div class="list">${routines.map(r => `<div class="li"><span class="grow"><span class="t" dir="auto">${esc(r.name)}</span><br><span class="s">${r.ex.map(e => `<bdi>${esc(GY.displayName(e.name))}</bdi>`).join(', ')}</span></span>
          <button class="iconbtn plain" data-act="gRenRoutine" data-id="${r.id}" aria-label="${tr('שינוי שם', 'Rename')}">${icon('edit', 18)}</button>
          <button class="iconbtn plain" data-act="gDelRoutine" data-id="${r.id}" aria-label="${tr('מחיקה', 'Delete')}">${icon('trash', 18)}</button></div>`).join('')}</div>`
        : `<div class="small muted">${tr('עוד אין. במסך האימון לוחצים "שמור כשגרה", ואז מתחילים אותה בלחיצה אחת עם המשקלים של הפעם הקודמת.', 'None yet. In the workout screen tap "Save as routine", then start it with one tap using last time’s weights.')}</div>`}
      </div>
    </div>
  </section>`;
}

/* ---------- actions and inputs ---------- */
const GYM_ACT = {
  openGym(el) { openGym(S.date, el.dataset.i != null ? +el.dataset.i : null); },
  gymRoutine(el) {
    const r = (db.routines || []).find(x => x.id === el.dataset.id); if (!r) return;
    applyRoutine(S.date, r);
    if (sheetStack.find(s => s.id === 'gym')) refreshGym(); else openGym(S.date);
  },
  gRoutine(el) { GYM_ACT.gymRoutine(el); },
  gymRepeat() {
    const iso = sheetStack.find(s => s.id === 'gym') ? WK.iso : S.date;
    const last = gymDates().filter(d => d < iso).pop();
    if (!last) return;
    const src = db.days[last].gym;
    const g = gymOf(iso, true);
    addExercises(iso, src.ex);
    if (!g.title && src.title) g.title = src.title;
    save();
    if (sheetStack.find(s => s.id === 'gym')) refreshGym(); else openGym(iso);
    toast(tr(`הועתק האימון מ-${P.displayDate(last)}. עדכן את המשקלים`, `Copied the workout from ${P.displayDate(last)}. Update the weights`));
  },
  gAdd(el) {
    const raw = el.dataset.name.trim(); if (!raw) return;
    const name = GY.canonical(raw);
    const kind = knownKind(name);
    const last = lastTimeOf(name, WK.iso);
    const base = last ? Object.assign({}, last.ex, { name }) : kind === 'c' ? { name, kind, minutes: null, km: null } : { name, kind, sets: [{ reps: null, kg: null }, { reps: null, kg: null }, { reps: null, kg: null }] };
    const g = gymOf(WK.iso, true);
    g.ex.push(newEx(base));
    WK.find = '';
    save(); gymBuzz(); refreshGym();
    const i = g.ex.length - 1;
    setTimeout(() => {
      const box = $(`#sheets .gx[data-i="${i}"]`);
      if (box) { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); box.classList.add('flash'); }
      if (!last) { const inp = box && box.querySelector('input'); if (inp) inp.focus(); }
    }, 60);
  },
  gAddSet(el) {
    const g = gymOf(WK.iso, true); const e = g.ex[+el.dataset.i]; if (!e) return;
    e.sets = e.sets || [];
    const lastSet = e.sets[e.sets.length - 1];
    e.sets.push(lastSet ? { reps: lastSet.reps, kg: lastSet.kg } : { reps: null, kg: null });
    save(); gymBuzz(); refreshGym();
    if (!lastSet) setTimeout(() => { const inp = $(`#sheets [data-on="gS"][data-i="${el.dataset.i}"][data-f="reps"]`); inp && inp.focus(); }, 60);
  },
  gDelSet(el) {
    const g = gymOf(WK.iso, false); const e = g && g.ex[+el.dataset.i]; if (!e) return;
    e.sets.splice(+el.dataset.j, 1);
    save(); refreshGym();
  },
  gDelEx(el) {
    const g = gymOf(WK.iso, false); if (!g) return;
    const i = +el.dataset.i;
    const [e] = g.ex.splice(i, 1); if (!e) return;
    save(); refreshGym();
    toast(tr(`נמחק: ${GY.displayName(e.name)}`, `Deleted: ${GY.displayName(e.name)}`), { label: tr('ביטול', 'Undo'), fn: () => { const gg = gymOf(WK.iso, true); gg.ex.splice(Math.min(i, gg.ex.length), 0, e); save(); refreshGym(); render({ keepScroll: true }); } });
  },
  gSaveRoutine() {
    const g = gymOf(WK.iso, false); if (!g || !g.ex.length) return;
    promptSheet(tr('שמירה כשגרה', 'Save as routine'), tr('שם השגרה', 'Routine name'), g.title || '', (name) => {
      if (!name) return;
      db.routines = db.routines || [];
      const ex = g.ex.map(e => { const o = newEx(e); delete o.id; return o; });
      const same = db.routines.find(r => r.name === name);
      if (same) same.ex = ex; else db.routines.push({ id: uid(), name, ex });
      if (!g.title) g.title = name;
      save(); refreshGym();
      toast(tr(`השגרה "${name}" נשמרה`, `Routine "${name}" saved`));
    }, tr('שמירה', 'Save'));
  },
  gRest() { restStart(gymSet().rest); gymBuzz(); },
  gRestStop() { restStop(); },
  exProg(el) { openExProg(el.dataset.name); },
  gGrp(el) { WK.grp = el.dataset.v; const f = $('#gymFind'); if (f) f.innerHTML = findHtml(); },
  gRestAdd() { if (REST.end && restLeft() > 0) restStart(restLeft() + 30, REST.total + 30); },
  gRestDef(el) { gymSet().rest = +el.dataset.v; save(); render({ keepScroll: true }); },
  showGym() { db.settings.showGym = db.settings.showGym === false; save(); render({ keepScroll: true }); },
  gRenRoutine(el) {
    const r = (db.routines || []).find(x => x.id === el.dataset.id); if (!r) return;
    promptSheet(tr('שינוי שם', 'Rename'), tr('שם השגרה', 'Routine name'), r.name, (v) => { if (v) { r.name = v; save(); render({ keepScroll: true }); } }, tr('שמירה', 'Save'));
  },
  gDelRoutine(el) {
    const i = (db.routines || []).findIndex(x => x.id === el.dataset.id); if (i < 0) return;
    const r = db.routines[i];
    confirmSheet(tr('מחיקת שגרה', 'Delete routine'), tr(`למחוק את "${r.name}"? אימונים שכבר נרשמו לא יימחקו.`, `Delete "${r.name}"? Workouts you already logged stay.`), tr('מחיקה', 'Delete'), () => { db.routines.splice(i, 1); save(); render({ keepScroll: true }); });
  },
};
const numOrNull = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) || n < 0 ? null : n; };
const GYM_ON = {
  gTitle(el) { const g = gymOf(WK.iso, true); g.title = el.value.trim(); saveLater(); },
  gNote(el) { const g = gymOf(WK.iso, true); g.note = el.value.trim(); saveLater(); },
  gMin(el) { const g = gymOf(WK.iso, true); const n = numOrNull(el.value); g.minutes = n == null ? null : Math.round(n); saveLater(); },
  gS(el) {
    const g = gymOf(WK.iso, true); const e = g.ex[+el.dataset.i]; if (!e || !e.sets) return;
    const x = e.sets[+el.dataset.j]; if (!x) return;
    x[el.dataset.f] = numOrNull(el.value);
    saveLater();
  },
  gC(el) { const g = gymOf(WK.iso, true); const e = g.ex[+el.dataset.i]; if (!e) return; e[el.dataset.f] = numOrNull(el.value); saveLater(); updPace(el.dataset.i, e); },
  gT(el) {
    const g = gymOf(WK.iso, true); const e = g.ex[+el.dataset.i]; if (!e) return;
    const m = numOrNull(($(`#sheets [data-on="gT"][data-i="${el.dataset.i}"][data-f="m"]`) || {}).value);
    const sc = numOrNull(($(`#sheets [data-on="gT"][data-i="${el.dataset.i}"][data-f="s"]`) || {}).value);
    e.minutes = m == null && sc == null ? null : Math.round(((m || 0) + Math.min(sc || 0, 59) / 60) * 1000) / 1000;
    saveLater(); updPace(el.dataset.i, e);
  },
  gText(el) { WK.text = el.value; const live = $('#gymLive'); if (live) live.innerHTML = gymLiveHtml(); },
  gFind(el) { WK.find = el.value; const f = $('#gymFind'); if (f) f.innerHTML = findHtml(); },
};
function updPace(i, e) { const el = $(`#sheets [data-pace="${i}"]`); if (el) el.innerHTML = paceHtml(e); }
function gymSubmit() {
  const inp = $('#sheets [data-on="gText"]');
  if (inp) WK.text = inp.value;
  const n = flushGymText();
  if (!n) { if (WK.text.trim()) toast(tr('לא הצלחתי לקרוא תרגיל. נסה למשל: סקוואט 4x8 80 קג', "Couldn't read an exercise. Try e.g.: squat 4x8 80kg")); return; }
  save(); gymBuzz(); refreshGym();
  const i = $('#sheets [data-on="gText"]'); if (i) i.focus();
}

/* ---------- import, restore, AI ---------- */
/** Text from an import ("• אימון: …") into the day: merge adds missing exercises, replace overwrites. */
function importGym(day, raw, title, replace) {
  const r = GY.parseWorkout(raw || '');
  if (!r.exercises.length && !r.minutes && !title) return 0;
  if (replace || !dayGym(day)) day.gym = { title: '', minutes: null, note: '', ex: [] };
  const g = day.gym;
  const have = new Set(g.ex.map(e => GY.exText(e)));
  let n = 0;
  r.exercises.forEach(e => { if (!have.has(GY.exText(e))) { g.ex.push(newEx(e)); n++; } });
  if (r.minutes && !g.minutes) g.minutes = r.minutes;
  if (title && !g.title) g.title = title;
  if (r.note && !(g.note || '').includes(r.note)) g.note = g.note ? g.note + '\n' + r.note : r.note;
  return n || 1;
}
function mergeGym(c, b) {
  if (!b || !b.gym || !dayGym(b)) return;
  if (!dayGym(c)) { c.gym = clone(b.gym); return; }
  const have = new Set(c.gym.ex.map(e => GY.exText(e)));
  b.gym.ex.forEach(e => { if (!have.has(GY.exText(e))) c.gym.ex.push(clone(e)); });
  ['title', 'minutes', 'note'].forEach(k => { if (!c.gym[k] && b.gym[k]) c.gym[k] = b.gym[k]; });
}
