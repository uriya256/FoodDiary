'use strict';
/* Gym workouts: exercises with sets (reps × kg) or cardio (minutes, km), routines, rest timer, records.
   The pure parts (dictionary, parser, formatting) also run in node for tests. */

(function (root) {
  // he name | en name | kind (s = weights, r = body-weight reps, c = cardio/time) | group | aliases
  const EX_LINES = `
לחיצת חזה|Bench press|s|chest|לחיצת חזה במוט,בנץ׳,בנץ',בנץ,bench,bench press,chest press
לחיצת חזה בשיפוע|Incline bench press|s|chest|שיפוע חיובי,incline press,incline bench,incline bench press
לחיצת חזה עם משקולות|Dumbbell bench press|s|chest|לחיצת משקולות,dumbbell press,dumbbell bench press
פרפר|Chest fly|s|chest|פרפר במכונה,פלאי,fly,flyes,chest fly,pec deck
שכיבות סמיכה|Push-ups|r|chest|שכיבות שמיכה,push ups,pushups,push-ups,push-up
מקבילים|Dips|r|chest|דיפס,dips
מתח|Pull-ups|r|back|עליות מתח,pull ups,pullups,pull-ups,chin ups
פולי עליון|Lat pulldown|s|back|משיכת פולי עליון,פולי,lat pulldown,pulldown
חתירה במוט|Barbell row|s|back|חתירה,row,barbell row,bent over row
חתירה בכבל|Seated cable row|s|back|חתירה בישיבה,cable row,seated row
דדליפט|Deadlift|s|back|דד ליפט,הרמת מתים,deadlift
לחיצת כתפיים|Shoulder press|s|shoulders|לחיצת כתפיים עם משקולות,לחיצה צבאית,overhead press,military press,shoulder press,ohp
הרחקות צד|Lateral raises|s|shoulders|הרחקה לצדדים,הרחקות,lateral raise,lateral raises,side raises
פייס פול|Face pull|s|shoulders|face pull,face pulls
כפיפת מרפקים|Biceps curl|s|arms|כפיפות מרפקים,בייספס,curl,curls,biceps,bicep curl,biceps curl
פטישים|Hammer curl|s|arms|hammer curl,hammer curls
פשיטת מרפקים|Triceps extension|s|arms|פשיטות מרפקים,טרייספס,פשיטת מרפקים בכבל,triceps,tricep extension,triceps extension,pushdown
סקוואט|Squat|s|legs|סקווט,כפיפות ברכיים,squat,squats,back squat
לחיצת רגליים|Leg press|s|legs|לג פרס,leg press
לאנג׳ים|Lunges|s|legs|לאנגים,לאנג'ים,lunges,lunge
פשיטת ברכיים|Leg extension|s|legs|leg extension,leg extensions
כפיפת ברכיים|Leg curl|s|legs|המסטרינג,leg curl,leg curls
הרמות עקבים|Calf raises|s|legs|תאומים,calf raise,calf raises
היפ תראסט|Hip thrust|s|legs|גשר ישבן,hip thrust,glute bridge
כפיפות בטן|Crunches|r|core|בטן,קראנץ׳,קראנצ'ים,crunches,sit ups,situps,abs
פלאנק|Plank|c|core|plank
הרמות רגליים|Leg raises|r|core|leg raises,hanging leg raise
הליכון|Treadmill|c|cardio|ריצה על הליכון,treadmill
ריצה|Running|c|cardio|run,running,jog,jogging,ג׳וגינג
הליכה|Walking|c|cardio|walk,walking
אופניים|Cycling|c|cardio|אופני כושר,ספינינג,bike,cycling,spinning
אליפטיקל|Elliptical|c|cardio|אליפטי,elliptical
מכונת חתירה|Rowing machine|c|cardio|rower,rowing machine,ergometer
שחייה|Swimming|c|cardio|swim,swimming
קפיצה בחבל|Jump rope|c|cardio|חבל קפיצה,jump rope,skipping
מדרגות|Stair climber|c|cardio|stair climber,stairmaster
יוגה|Yoga|c|other|yoga
מתיחות|Stretching|c|other|stretching,stretch
`;
  const GROUPS = {
    chest: ['חזה', 'Chest'], back: ['גב', 'Back'], shoulders: ['כתפיים', 'Shoulders'], arms: ['ידיים', 'Arms'],
    legs: ['רגליים', 'Legs'], core: ['בטן', 'Core'], cardio: ['קרדיו', 'Cardio'], other: ['אחר', 'Other'],
  };
  const norm = (s) => String(s || '').toLowerCase().replace(/[׳'`]/g, '׳').replace(/[״"]/g, '״')
    .replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ').replace(/\s+/g, ' ').trim();

  const EX = {};      // he name -> {en, kind, group}
  const ALIAS = {};   // normalized -> he name
  for (const line of EX_LINES.split('\n')) {
    const t = line.trim(); if (!t) continue;
    const [he, en, kind, group, al] = t.split('|');
    EX[he] = { en, kind, group };
    ALIAS[norm(he)] = he; ALIAS[norm(en)] = he;
    (al || '').split(',').map(x => x.trim()).filter(Boolean).forEach(a => { if (!ALIAS[norm(a)]) ALIAS[norm(a)] = he; });
  }

  let LANG = 'he';
  function setLang(l) { LANG = l === 'en' ? 'en' : 'he'; }
  const T = (he, en) => (LANG === 'en' ? en : he);

  function canonical(name) { return ALIAS[norm(name)] || String(name || '').trim(); }
  function info(name) { return EX[name] || null; }
  function kindOf(name) { const i = EX[name]; return i ? i.kind : 's'; }
  function displayName(name) { const i = EX[name]; return i && LANG === 'en' ? i.en : name; }
  function groupOf(name) { const i = EX[name]; return i ? i.group : 'other'; }

  const num = (s) => parseFloat(String(s).replace(',', '.'));
  const R = {
    kg: '(?:ק"ג|ק״ג|קג|קילו|קילוגרם|kg|kgs|kilo)',
    min: '(?:דקות|דקה|דק׳|דק\'|דק|min|mins|minutes|minute|m)',
    sec: '(?:שניות|שניה|שנייה|שנ׳|שנ\'|sec|secs|seconds|s)',
    km: '(?:ק"מ|ק״מ|קמ|קילומטר|km|kms)',
    sets: '(?:סטים|סטים של|סט|sets|set)',
    reps: '(?:חזרות|חזרה|פעמים|reps|rep|times)',
  };

  /** "סקוואט 4x8 80 קג" -> {name, kind, sets:[{reps,kg}×4]}; "הליכון 20 דקות 2 קמ" -> {name, kind:'c', minutes, km} */
  function parseExercise(seg) {
    let s = ' ' + String(seg).replace(/[×X*]/g, 'x').replace(/‏|‎/g, '') + ' ';
    let sets = null, reps = null, kg = null, minutes = null, km = null, secs = null, list = null;
    const take = (re, fn) => { s = s.replace(re, (...m) => { fn(m); return ' '; }); };
    // 10/8/6 x 60/65/70  or  12-10-8
    take(new RegExp(`(\\d+(?:\\s*[\\/\\-]\\s*\\d+){1,9})\\s*x\\s*(\\d+(?:[.,]\\d+)?(?:\\s*[\\/\\-]\\s*\\d+(?:[.,]\\d+)?){1,9})\\s*${R.kg}?`, 'i'), m => {
      const r = m[1].split(/[\/\-]/).map(num), w = m[2].split(/[\/\-]/).map(num);
      list = r.map((x, i) => ({ reps: x, kg: w[Math.min(i, w.length - 1)] }));
    });
    // a clock time: "28:30", "ב-28:30", "1:05:20"
    take(/(?:^|\s)(?:ב-?|in\s)?(\d{1,3}):([0-5]\d)(?::([0-5]\d))?(?=\s|$)/i, m => {
      minutes = m[3] != null ? +m[1] * 60 + +m[2] + +m[3] / 60 : +m[1] + +m[2] / 60;
      minutes = Math.round(minutes * 1000) / 1000;
    });
    // 3x60 שניות / 3x2 דקות: timed sets (plank, intervals)
    take(new RegExp(`(\\d+)\\s*x\\s*(\\d+(?:[.,]\\d+)?)\\s*(${R.sec}|${R.min})(?![\\w\\u05d0-\\u05ea])`, 'i'), m => {
      const tot = +m[1] * num(m[2]);
      if (new RegExp(`^${R.sec}$`, 'i').test(m[3])) secs = tot; else minutes = tot;
    });
    take(new RegExp(`(\\d+)\\s*x\\s*(\\d+)(?:\\s*x\\s*(\\d+(?:[.,]\\d+)?)\\s*${R.kg}?)?`, 'i'), m => { sets = +m[1]; reps = +m[2]; if (m[3]) kg = num(m[3]); });
    take(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${R.kg}(?![\\w\\u05d0-\\u05ea])`, 'i'), m => { kg = num(m[1]); });
    take(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${R.km}(?![\\w\\u05d0-\\u05ea])`, 'i'), m => { km = num(m[1]); });
    take(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${R.min}(?![\\w\\u05d0-\\u05ea])`, 'i'), m => { if (minutes == null) minutes = num(m[1]); });
    take(new RegExp(`(?:ו-?\\s*)?(\\d+)\\s*${R.sec}(?![\\w\\u05d0-\\u05ea])`, 'i'), m => { secs = +m[1]; });
    take(new RegExp(`(\\d+)\\s*${R.sets}(?:\\s+(?:של|of))?`, 'i'), m => { sets = +m[1]; });
    take(new RegExp(`(\\d+)\\s*${R.reps}`, 'i'), m => { reps = +m[1]; });
    take(/(?:^|\s)(?:ב-?|at\s)\s*(\d+(?:[.,]\d+)?)(?=\s|$)/i, m => { if (kg == null) kg = num(m[1]); }); // "ב-60", "at 60"
    // a lone number left: reps for weights, minutes for cardio
    let lone = null;
    take(/(?:^|\s)(\d+(?:[.,]\d+)?)(?=\s|$)/, m => { lone = num(m[1]); });
    let name = s.replace(/\s+(של|עם|ב|of|with|at)\s*$/i, '').replace(/[:\-–,.]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name) return null;
    name = canonical(name);
    const kind = kindOf(name);
    if (kind === 'c') {
      if (secs != null) minutes = Math.round(((minutes || 0) + secs / 60) * 1000) / 1000;
      if (minutes == null && lone != null) minutes = lone;
      return { name, kind, minutes, km };
    }
    if (!list) {
      if (reps == null && lone != null) reps = lone;
      const n = sets || (reps != null || kg != null ? 1 : 0);
      list = Array.from({ length: n }, () => ({ reps, kg }));
    }
    return { name, kind, sets: list };
  }

  function splitSegments(text) {
    const out = [];
    for (const part of String(text || '').split(/[\n,;+•]|\s-\s/)) {
      // "סקוואט 4x8 ולחיצת רגליים 3x12": split before "ו" + a known exercise
      const words = part.trim().split(/\s+/);
      let cur = [];
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        let isNew = false;
        if (cur.length && /^ו/.test(w) && w.length > 2) {
          for (let L = 3; L >= 1 && !isNew; L--) {
            const cand = [w.slice(1)].concat(words.slice(i + 1, i + L)).join(' ');
            if (ALIAS[norm(cand)]) isNew = true;
          }
        }
        if (/^(and)$/i.test(w) && cur.length) { out.push(cur.join(' ')); cur = []; continue; }
        if (isNew) { out.push(cur.join(' ')); cur = [w.slice(1)]; } else cur.push(w);
      }
      if (cur.length) out.push(cur.join(' '));
    }
    return out.map(x => x.trim()).filter(Boolean);
  }
  function parseWorkout(text) {
    let minutes = null, note = '';
    const segs = [];
    text = String(text || '').replace(/(?:^|[,;\n])\s*(?:הערה|הערות|note|notes)\s*:\s*([\s\S]*)$/i, (m, n) => { note = n.trim(); return ''; });
    for (const seg of splitSegments(text)) {
      const m = seg.match(/^(?:סה"כ|סה״כ|total|אימון(?: של)?|workout(?: of)?|משך|duration)?\s*:?\s*(\d+)\s*(?:דקות|דק׳|דק|min|mins|minutes)\s*(?:אימון|workout|בסך הכל|total)?$/i);
      if (m && segs.length === 0 && /אימון|workout|סה|total|משך|duration|בסך/i.test(seg)) { minutes = +m[1]; continue; }
      const e = parseExercise(seg);
      if (e) segs.push(e);
    }
    return { minutes, exercises: segs, note };
  }

  const fmtN = (x) => (x == null ? '' : String(Math.round(x * 100) / 100));
  function setsText(sets) {
    if (!sets || !sets.length) return '';
    const kgU = T('ק״ג', 'kg');
    // runs of identical sets: "3×10 · 60, 1×10 · 62.5 ק״ג" (sets × reps · kg)
    const runs = [];
    for (const x of sets) {
      const r = runs[runs.length - 1];
      if (r && r.reps === x.reps && r.kg === x.kg) r.n++;
      else runs.push({ n: 1, reps: x.reps, kg: x.kg });
    }
    if (runs.length === 1) {
      const a = runs[0];
      let s = a.reps != null ? `${a.n}×${fmtN(a.reps)}` : `${a.n} ${T('סטים', 'sets')}`;
      if (a.n === 1 && a.reps != null) s = `${fmtN(a.reps)} ${T('חזרות', 'reps')}`;
      if (a.n === 1 && a.reps == null) s = T('סט אחד', '1 set');
      if (a.kg != null) s += ` · ${fmtN(a.kg)} ${kgU}`;
      return s;
    }
    const anyKg = runs.some(r => r.kg != null);
    return runs.map(r => `${r.n}×${r.reps != null ? fmtN(r.reps) : '?'}` + (r.kg != null ? ` · ${fmtN(r.kg)}` : '')).join(', ') + (anyKg ? ` ${kgU}` : '');
  }
  /** 28.5 -> "28:30", 65.25 -> "1:05:15" */
  function clock(min) {
    let t = Math.round(min * 60);
    const h = Math.floor(t / 3600); t -= h * 3600;
    const m = Math.floor(t / 60), sec = t - m * 60;
    const p2 = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${p2(m)}:${p2(sec)}` : `${m}:${p2(sec)}`;
  }
  function hasSeconds(min) { return Math.abs(min * 60 - Math.round(min) * 60) >= 1; }
  /** Minutes per km, or null. */
  function paceOf(e) { return e && e.kind === 'c' && e.km > 0 && e.minutes > 0 ? e.minutes / e.km : null; }
  function durText(e) {
    if (e.minutes == null) return '';
    if (e.minutes < 3 && e.km == null) return `${Math.round(e.minutes * 60)} ${T('שנ׳', 'sec')}`;
    if (e.minutes >= 60 || hasSeconds(e.minutes)) return clock(e.minutes);
    return `${fmtN(e.minutes)} ${T('דק׳', 'min')}`;
  }
  function exDetail(e) {
    let d = '';
    if (e.kind === 'c') {
      const p = [];
      if (e.km != null) p.push(`${fmtN(e.km)} ${T('ק״מ', 'km')}`);
      const dt = durText(e); if (dt) p.push(dt);
      const pc = paceOf(e); if (pc) p.push(T(`${clock(pc)} לק״מ`, `${clock(pc)}/km`));
      d = p.join(' · ');
    } else d = setsText(e.sets);
    return d;
  }
  function exText(e, opts) {
    opts = opts || {};
    const name = opts.raw ? e.name : displayName(e.name);
    const d = exDetail(e);
    return d ? `${name} ${d}` : name;
  }
  /** One line for the text export, readable back by parseWorkout. */
  function workoutText(g) {
    if (!g) return '';
    const parts = (g.ex || []).map(e => {
      const nm = displayName(e.name);
      if (e.kind === 'c') return [nm, e.km != null ? `${fmtN(e.km)} ${T('ק״מ', 'km')}` : '', e.minutes != null ? (e.minutes < 3 && e.km == null ? `${Math.round(e.minutes * 60)} ${T('שניות', 'sec')}` : e.minutes >= 60 || hasSeconds(e.minutes) ? clock(e.minutes) : `${fmtN(e.minutes)} ${T('דקות', 'min')}`) : ''].filter(Boolean).join(' ');
      const sets = e.sets || [];
      const same = sets.length && sets.every(x => x.reps === sets[0].reps && x.kg === sets[0].kg);
      if (!sets.length) return nm;
      if (same) return `${nm} ${sets.length}x${fmtN(sets[0].reps ?? 0)}` + (sets[0].kg != null ? ` ${fmtN(sets[0].kg)} ${T('ק״ג', 'kg')}` : '');
      return `${nm} ${sets.map(x => fmtN(x.reps ?? 0)).join('/')}x${sets.map(x => fmtN(x.kg ?? 0)).join('/')} ${T('ק״ג', 'kg')}`;
    });
    if (g.minutes) parts.unshift(T(`סה״כ ${g.minutes} דקות`, `total ${g.minutes} min`));
    if (g.note) parts.push(T('הערה: ', 'note: ') + String(g.note).replace(/\s*\n\s*/g, ' '));
    return parts.join(', ');
  }

  const api = { EX, ALIAS, GROUPS, setLang, canonical, info, kindOf, displayName, groupOf, parseExercise, parseWorkout, splitSegments, setsText, exDetail, exText, workoutText, norm, clock, paceOf };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Gym = api;
})(typeof window !== 'undefined' ? window : globalThis);
