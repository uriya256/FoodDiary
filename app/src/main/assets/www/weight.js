'use strict';
/* Weight log: Today card, the weight sheet (chart, average loss per month vs goal), stats, and a small line chart
   that the exercise progress screen uses too. Loaded before app.js. */

const WT_GRAD = 'linear-gradient(135deg,#B9A2FF,#6D4FD8)';
function wtSet() {
  const s = db.settings;
  if (!s.weight || typeof s.weight !== 'object') s.weight = {};
  if (s.weight.show == null) s.weight.show = true;
  return s.weight;
}
function weights() {
  return (db.weights || []).filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && x.kg > 0).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
function weightOn(iso) { const w = (db.weights || []).find(x => x.date === iso); return w ? w.kg : null; }
function setWeight(iso, kg) {
  db.weights = (db.weights || []).filter(x => x.date !== iso);
  if (kg > 0) db.weights.push({ date: iso, kg: Math.round(kg * 10) / 10 });
  db.weights.sort((a, b) => (a.date < b.date ? -1 : 1));
}
function fmtKg(kg) { return (Math.round(kg * 10) / 10).toLocaleString(LANG === 'en' ? 'en-US' : 'he-IL', { maximumFractionDigits: 1 }); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
function monthsBetween(a, b) { return daysBetween(a, b) / 30.44; }
function addMonthsISO(iso, m) {
  const d = parseISO(iso);
  const day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + m);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return isoOf(d);
}
/** Weight on a date, read off the line between the weigh-ins around it. */
function weightAt(iso, L) {
  if (!L.length || iso < L[0].date) return null;
  for (let i = L.length - 1; i >= 0; i--) {
    if (L[i].date <= iso) {
      const a = L[i], b = L[i + 1];
      if (!b || a.date === iso) return a.kg;
      return a.kg + (b.kg - a.kg) * daysBetween(a.date, iso) / daysBetween(a.date, b.date);
    }
  }
  return null;
}
function agoText(iso) {
  const n = daysBetween(iso, todayISO());
  if (n <= 0) return tr('היום', 'today');
  if (n === 1) return tr('אתמול', 'yesterday');
  if (n < 14) return tr(`לפני ${n} ימים`, `${n} days ago`);
  const w = Math.round(n / 7);
  if (n < 60) return tr(`לפני ${w} שבועות`, `${w} weeks ago`);
  return tr(`לפני ${Math.round(n / 30.44)} חודשים`, `${Math.round(n / 30.44)} months ago`);
}
function spanText(months) {
  const d = months * 30.44;
  if (d < 13) return tr(`${Math.round(d)} ימים`, `${Math.round(d)} days`);
  if (months < 1.5) return tr(`${Math.round(d / 7)} שבועות`, `${Math.round(d / 7)} weeks`);
  return tr(`${(Math.round(months * 10) / 10).toLocaleString('he-IL')} חודשים`, `${Math.round(months * 10) / 10} months`);
}
/** Average loss per month over the last 1, 2, 3, 6 and 12 months (or since the first weigh-in when that is shorter). */
function lossRows() {
  const L = weights();
  if (L.length < 2) return [];
  const first = L[0], last = L[L.length - 1];
  const total = monthsBetween(first.date, last.date);
  const rows = [];
  let usedAll = false;
  for (const m of [1, 2, 3, 6, 12]) {
    const from = addMonthsISO(last.date, -m);
    if (from < first.date) {
      if (usedAll || total < 0.2) continue;
      usedAll = true;
      rows.push({ m, all: true, months: total, from: first.date, start: first.kg, loss: first.kg - last.kg, rate: (first.kg - last.kg) / total });
    } else {
      const start = weightAt(from, L);
      rows.push({ m, months: m, from, start, loss: start - last.kg, rate: (start - last.kg) / m });
    }
  }
  return rows;
}
function periodLabel(r) {
  if (r.all) return tr(`מההתחלה (${spanText(r.months)})`, `Since the start (${spanText(r.months)})`);
  return { 1: tr('חודש אחרון', 'Last month'), 2: tr('חודשיים', '2 months'), 3: tr('3 חודשים', '3 months'), 6: tr('חצי שנה', '6 months'), 12: tr('שנה', '1 year') }[r.m];
}
function lossText(kg) {
  const v = fmtKg(Math.abs(kg));
  if (Math.abs(kg) < 0.05) return tr('ללא שינוי', 'no change');
  return kg > 0 ? tr(`ירדת ${v} ק״ג`, `lost ${v} kg`) : tr(`עלית ${v} ק״ג`, `gained ${v} kg`);
}
function rateBadge(rate) {
  const g = wtSet().goalRate;
  if (!g) return '';
  const ok = rate >= g * 0.95;
  return `<span class="bal ${ok ? 'ok' : rate > 0 ? 'near' : 'off'}">${ok ? icon('check', 13) + tr('ביעד', 'On goal') : tr(`יעד ${fmtKg(g)}`, `goal ${fmtKg(g)}`)}</span>`;
}

/* ---------- a small line chart (SVG) ---------- */
/** pts: [{d: iso, v}] by date. opts: fmt(v), color, invert (smaller is better: drawn higher), extra: [{pts, color, dash}], hline: {v, label} */
function lineChartSvg(pts, opts) {
  opts = opts || {};
  if (!pts.length) return '';
  const W = 340, H = opts.h || 170, L = 40, Rm = 12, T = 14, B = 24;
  const all = pts.slice();
  (opts.extra || []).forEach(x => all.push(...x.pts));
  const ts = all.map(p => parseISO(p.d).getTime());
  let x0 = Math.min(...ts), x1 = Math.max(...ts);
  if (x1 - x0 < 86400000) { x0 -= 86400000 * 3; x1 += 86400000 * 3; }
  const vs = all.map(p => p.v).concat(opts.hline ? [opts.hline.v] : []);
  let y0 = Math.min(...vs), y1 = Math.max(...vs);
  const padY = Math.max((y1 - y0) * 0.12, opts.minPad || 0.5);
  y0 -= padY; y1 += padY;
  const fmt = opts.fmt || (v => String(Math.round(v * 10) / 10));
  const X = (d) => L + (parseISO(d).getTime() - x0) / (x1 - x0) * (W - L - Rm);
  const Y = (v) => opts.invert ? T + (v - y0) / (y1 - y0) * (H - T - B) : H - B - (v - y0) / (y1 - y0) * (H - T - B);
  const color = opts.color || 'var(--accent)';
  const path = (p) => p.map((q, i) => `${i ? 'L' : 'M'}${X(q.d).toFixed(1)} ${Y(q.v).toFixed(1)}`).join(' ');
  const gid = 'g' + Math.random().toString(36).slice(2, 7);
  let s = `<svg class="lchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || '')}" preserveAspectRatio="none">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;
  for (let i = 0; i <= 2; i++) {
    const v = y0 + (y1 - y0) * (opts.invert ? 1 - i / 2 : i / 2);
    const y = H - B - (H - T - B) * i / 2;
    s += `<line x1="${L}" x2="${W - Rm}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" direction="ltr" class="ct">${esc(fmt(v))}</text>`;
  }
  if (opts.hline) {
    const y = Y(opts.hline.v);
    s += `<line x1="${L}" x2="${W - Rm}" y1="${y}" y2="${y}" stroke="var(--ok)" stroke-width="1.5" stroke-dasharray="2 4"/><text x="${W - Rm}" y="${y - 4}" text-anchor="end" class="ct" style="fill:var(--ok-text)">${esc(opts.hline.label || '')}</text>`;
  }
  (opts.extra || []).forEach(x => { s += `<path d="${path(x.pts)}" fill="none" stroke="${x.color || 'var(--muted)'}" stroke-width="1.6" ${x.dash ? 'stroke-dasharray="5 4"' : ''}/>`; });
  if (pts.length > 1) s += `<path d="${path(pts)} L${X(pts[pts.length - 1].d).toFixed(1)} ${H - B} L${X(pts[0].d).toFixed(1)} ${H - B} Z" fill="url(#${gid})"/>`;
  s += `<path d="${path(pts)}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (pts.length <= 40) pts.forEach(p => { s += `<circle cx="${X(p.d).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3.4" fill="rgb(var(--card-rgb))" stroke="${color}" stroke-width="2"/>`; });
  const dd = (iso) => P.displayDate(iso).slice(0, 5);
  s += `<text x="${L}" y="${H - 6}" class="ct" direction="ltr">${dd(isoOf(new Date(x0)))}</text><text x="${W - Rm}" y="${H - 6}" text-anchor="end" class="ct" direction="ltr">${dd(isoOf(new Date(x1)))}</text>`;
  return s + `</svg>`;
}

/* ---------- today card ---------- */
function weightCardHtml() {
  const L = weights();
  const last = L[L.length - 1];
  const w = wtSet();
  let h = `<section class="card wt-card" aria-label="${tr('משקל', 'Weight')}">
    <div class="meal-head">
      <span class="meal-icon tone-weight">${icon('scale', 22)}</span>
      <div class="meal-title"><h2>${tr('משקל', 'Weight')}</h2><div class="sub">${last ? `${fmtKg(last.kg)} ${tr('ק״ג', 'kg')} · ${agoText(last.date)}` : tr('שקילה פעם בשבוע מספיקה', 'Once a week is enough')}</div></div>
      <button class="iconbtn tonal" data-act="openWeight" aria-label="${tr('עדכון משקל', 'Update weight')}">${icon('plus')}</button>
    </div>`;
  if (!last) return h + `<div class="chips"><button class="chip ghost" data-act="openWeight">${icon('plus', 16)}${tr('הוספת משקל התחלתי', 'Add your starting weight')}</button></div></section>`;
  const first = L[0];
  const rows = lossRows();
  const r1 = rows[0];
  const lines = [];
  if (L.length > 1) lines.push(`<span>${lossText(first.kg - last.kg)} ${tr(`מ-${P.displayDate(first.date)}`, `since ${P.displayDate(first.date)}`)}</span>`);
  if (r1) lines.push(`<span class="row" style="gap:6px;flex-wrap:wrap">${tr('קצב', 'Pace')} (${periodLabel(r1)}): <b>${fmtKg(r1.rate)} ${tr('ק״ג לחודש', 'kg/month')}</b>${rateBadge(r1.rate)}</span>`);
  if (w.goalKg && last.kg > w.goalKg) lines.push(`<span>${tr(`עוד ${fmtKg(last.kg - w.goalKg)} ק״ג ליעד (${fmtKg(w.goalKg)})`, `${fmtKg(last.kg - w.goalKg)} kg to your goal (${fmtKg(w.goalKg)})`)}</span>`);
  if (lines.length) h += `<div class="wt-lines small">${lines.join('')}</div>`;
  if (daysBetween(last.date, todayISO()) >= 7) h += `<div class="chips"><button class="chip tpl" data-act="openWeight">${icon('scale', 16)}${tr('זמן לשקילה השבועית', 'Time for the weekly weigh-in')}</button></div>`;
  return h + `</section>`;
}

/* ---------- weight sheet ---------- */
const WTS = { date: null };
function openWeight() {
  WTS.date = todayISO();
  openSheet('weight', weightSheetHtml(), { full: true, title: tr('משקל', 'Weight') });
  setTimeout(() => { const i = $('#sheets [data-wt="kg"]'); if (i && !weights().length) i.focus(); }, 300);
}
function refreshWeight() { if (sheetStack.find(s => s.id === 'weight')) replaceSheetBody('weight', weightSheetHtml()); }
function weightSummaryHtml(withChart) {
  const L = weights();
  const w = wtSet();
  if (!L.length) return '';
  const last = L[L.length - 1];
  let h = '';
  if (withChart && L.length > 1) {
    const extra = [];
    if (w.goalRate) {
      const first = L[0];
      const end = last.date;
      extra.push({ pts: [{ d: first.date, v: first.kg }, { d: end, v: first.kg - w.goalRate * monthsBetween(first.date, end) }], color: 'var(--muted)', dash: true });
    }
    h += lineChartSvg(L.map(x => ({ d: x.date, v: x.kg })), { color: 'var(--weight)', extra, hline: w.goalKg ? { v: w.goalKg, label: tr(`יעד ${fmtKg(w.goalKg)}`, `goal ${fmtKg(w.goalKg)}`) } : null, fmt: v => fmtKg(v), label: tr('גרף משקל', 'Weight chart') });
    if (w.goalRate) h += `<div class="small muted chart-leg"><i class="dash"></i>${tr(`הקו המקווקו: ירידה של ${fmtKg(w.goalRate)} ק״ג בחודש מהשקילה הראשונה`, `Dashed line: losing ${fmtKg(w.goalRate)} kg a month from your first weigh-in`)}</div>`;
  }
  const rows = lossRows();
  if (rows.length) {
    h += `<div class="section-t">${tr('ממוצע ירידה בחודש', 'Average loss per month')}</div><div class="list">${rows.map(r => `<div class="li wt-row">
      <span class="grow"><span class="t">${periodLabel(r)}</span><br><span class="s">${lossText(r.loss)} · ${tr(`${fmtKg(r.start)} ← ${fmtKg(last.kg)}`, `${fmtKg(r.start)} → ${fmtKg(last.kg)}`)}</span></span>
      <span class="wt-rate"><b>${r.rate >= 0 ? '' : '+'}${fmtKg(Math.abs(r.rate))}</b><span class="s">${r.rate >= 0 ? tr('ק״ג ירידה לחודש', 'kg lost a month') : tr('ק״ג עלייה לחודש', 'kg gained a month')}</span></span>
      ${rateBadge(r.rate)}</div>`).join('')}</div>`;
    const ref = rows.find(r => r.m === 3) || rows[rows.length - 1];
    if (w.goalKg && last.kg > w.goalKg) {
      if (ref.rate > 0.05) {
        const months = (last.kg - w.goalKg) / ref.rate;
        h += `<p class="small" style="margin:8px 0 0">${tr(`בקצב של ${periodLabel(ref).replace(/ \(.*\)$/, '')} (${fmtKg(ref.rate)} ק״ג לחודש) תגיע ל-${fmtKg(w.goalKg)} ק״ג בערך ב-${monthYear(addMonthsISO(last.date, Math.round(months)))}.`, `At your ${periodLabel(ref).toLowerCase().replace(/ \(.*\)$/, '')} pace (${fmtKg(ref.rate)} kg a month) you would reach ${fmtKg(w.goalKg)} kg around ${monthYear(addMonthsISO(last.date, Math.round(months)))}.`)}</p>`;
      } else h += `<p class="small muted" style="margin:8px 0 0">${tr('כרגע אין ירידה, אז אי אפשר להעריך מתי תגיע ליעד.', 'No loss right now, so there is no estimate for reaching your goal.')}</p>`;
    } else if (w.goalKg && last.kg <= w.goalKg) h += `<p class="small" style="margin:8px 0 0;color:var(--ok-text)">${tr(`הגעת ליעד של ${fmtKg(w.goalKg)} ק״ג 🎉`, `You reached your ${fmtKg(w.goalKg)} kg goal 🎉`)}</p>`;
  } else if (L.length === 1) h += `<p class="small muted" style="margin:0">${tr('אחרי השקילה הבאה יופיעו כאן הגרף והממוצעים.', 'After your next weigh-in the chart and averages show here.')}</p>`;
  return h;
}
function monthYear(iso) { const d = parseISO(iso); return tr(`${monthName(d.getMonth())} ${d.getFullYear()}`, `${monthName(d.getMonth())} ${d.getFullYear()}`); }
function weightSheetHtml() {
  const L = weights();
  const w = wtSet();
  const last = L[L.length - 1];
  const onDate = weightOn(WTS.date);
  let h = sheetHead(tr('משקל', 'Weight')) + `<div class="body">
    <form class="wt-form" data-form="weight" autocomplete="off">
      <label class="field"><span>${tr('תאריך', 'Date')}</span><input type="date" data-wt="date" value="${WTS.date}" max="${todayISO()}"></label>
      <label class="field grow"><span>${tr('משקל (ק״ג)', 'Weight (kg)')}</span><input class="gnum" type="number" inputmode="decimal" step="0.1" min="20" max="400" data-wt="kg" value="${onDate != null ? onDate : ''}" placeholder="${last ? fmtKg(last.kg) : '80.0'}"></label>
      <button type="submit" class="btn primary" style="min-height:48px">${icon('check', 18)}${tr('שמירה', 'Save')}</button>
    </form>
    ${weightSummaryHtml(true)}
    <div class="section-t">${tr('יעדים', 'Goals')}</div>
    <div class="row" style="gap:10px">
      <label class="field grow"><span>${tr('ירידה רצויה בחודש (ק״ג)', 'Target loss a month (kg)')}</span><input class="gnum" type="number" inputmode="decimal" step="0.5" min="0" max="10" data-on="wtRate" value="${w.goalRate || ''}" placeholder="${tr('למשל 2', 'e.g. 2')}"></label>
      <label class="field grow"><span>${tr('משקל יעד (ק״ג)', 'Goal weight (kg)')}</span><input class="gnum" type="number" inputmode="decimal" step="0.5" min="20" max="400" data-on="wtGoal" value="${w.goalKg || ''}" placeholder="–"></label>
    </div>
    ${w.goalRate > 4 ? `<div class="small warn-t">${tr('בדרך כלל ממליצים על ירידה של חצי עד קילו בשבוע (בערך 2–4 ק״ג בחודש). ירידה מהירה יותר כדאי לעשות בליווי איש מקצוע.', 'Guidelines usually suggest losing 0.5–1 kg a week (about 2–4 kg a month). Faster loss is best done with a professional.')}</div>` : ''}`;
  if (L.length) {
    const rev = L.slice().reverse();
    h += `<div class="section-t">${tr('כל השקילות', 'All weigh-ins')}</div><div class="list">${rev.map((x, i) => {
      const prev = rev[i + 1];
      const d = prev ? Math.round((x.kg - prev.kg) * 10) / 10 : null;
      return `<div class="li"><button class="grow" style="border:none;background:none;text-align:start;padding:0;min-height:44px;color:inherit" data-act="wtPick" data-date="${x.date}"><span class="t">${fmtKg(x.kg)} ${tr('ק״ג', 'kg')}</span><br><span class="s">${P.weekdayName(x.date)}, ${P.displayDate(x.date)}</span></button>
        ${d != null && d !== 0 ? `<span class="gdelta ${d < 0 ? 'up' : 'down'}" dir="ltr">${d > 0 ? '+' : ''}${d}</span>` : ''}
        <button class="iconbtn plain" data-act="wtDel" data-date="${x.date}" aria-label="${tr('מחיקה', 'Delete')}">${icon('trash', 18)}</button></div>`;
    }).join('')}</div>`;
  }
  return h + `</div><footer><button class="btn primary big block" data-act="closeSheet">${tr('סיום', 'Done')}</button></footer>`;
}
function weightSettingsHtml() {
  const w = wtSet();
  return `<section class="card stack">
    <h2 class="row">${icon('scale', 20)}${tr('משקל', 'Weight')}</h2>
    <div class="row between"><span>${tr('הצג משקל במסך "היום"', 'Show weight on Today')}</span>${sw('wtShow', w.show !== false, tr('הצג משקל', 'Show weight'))}</div>
    <button class="btn" data-act="openWeight">${icon('chart', 18)}${tr('שקילות, גרף ויעדים', 'Weigh-ins, chart and goals')}</button>
  </section>`;
}
function weightStatsHtml() {
  const L = weights();
  if (!L.length) return '';
  return `<section class="card"><h3 class="row between"><span class="row">${icon('scale', 18)}${tr('משקל', 'Weight')}</span><button class="linkbtn" data-act="openWeight">${tr('עדכון', 'Update')}</button></h3>${weightSummaryHtml(true)}</section>`;
}
/** For the AI: the weigh-ins and goals. */
function weightContext() {
  const L = weights();
  const w = wtSet();
  if (!L.length) return '(no weigh-ins yet)';
  const rows = lossRows();
  return L.slice(-40).map(x => `${P.displayDate(x.date)}: ${x.kg} kg`).join('\n') +
    (rows.length ? '\nAverage loss per month: ' + rows.map(r => `${periodLabel(r)} ${Math.round(r.rate * 100) / 100}`).join('; ') : '') +
    (w.goalRate ? `\nGoal: lose ${w.goalRate} kg a month.` : '') + (w.goalKg ? ` Goal weight: ${w.goalKg} kg.` : '');
}

const WT_ACT = {
  openWeight() { openWeight(); },
  wtPick(el) { WTS.date = el.dataset.date; refreshWeight(); setTimeout(() => { const i = $('#sheets [data-wt="kg"]'); if (i) { i.focus(); i.select && i.select(); } }, 60); },
  wtDel(el) {
    const iso = el.dataset.date;
    const old = weightOn(iso);
    setWeight(iso, 0); save(); refreshWeight(); render({ keepScroll: true });
    toast(tr(`נמחקה השקילה מ-${P.displayDate(iso)}`, `Deleted the weigh-in from ${P.displayDate(iso)}`), { label: tr('ביטול', 'Undo'), fn: () => { setWeight(iso, old); save(); refreshWeight(); render({ keepScroll: true }); } });
  },
  wtShow() { const w = wtSet(); w.show = w.show === false; save(); render({ keepScroll: true }); },
};
const WT_ON = {
  wtRate(el) { const x = parseFloat(String(el.value).replace(',', '.')); wtSet().goalRate = x > 0 ? x : null; saveLater(); },
  wtGoal(el) { const x = parseFloat(String(el.value).replace(',', '.')); wtSet().goalKg = x > 0 ? x : null; saveLater(); },
};
function weightSubmit() {
  const di = $('#sheets [data-wt="date"]'), ki = $('#sheets [data-wt="kg"]');
  const iso = di && /^\d{4}-\d{2}-\d{2}$/.test(di.value) ? di.value : todayISO();
  const kg = ki ? parseFloat(String(ki.value).replace(',', '.')) : NaN;
  if (!(kg >= 20 && kg <= 400)) { toast(tr('נא להזין משקל בק״ג, למשל 82.4', 'Enter a weight in kg, e.g. 82.4')); return; }
  const prev = weights().filter(x => x.date < iso).pop();
  setWeight(iso, kg);
  WTS.date = iso;
  save(); refreshWeight(); render({ keepScroll: true });
  const d = prev ? Math.round((kg - prev.kg) * 10) / 10 : null;
  toast(d == null ? tr('המשקל נשמר', 'Weight saved') : d < 0 ? tr(`נשמר: ירדת ${fmtKg(-d)} ק״ג מהשקילה הקודמת`, `Saved: down ${fmtKg(-d)} kg since last time`) : d > 0 ? tr(`נשמר: ${fmtKg(d)} ק״ג יותר מהשקילה הקודמת`, `Saved: up ${fmtKg(d)} kg since last time`) : tr('נשמר: כמו בפעם הקודמת', 'Saved: same as last time'));
}
