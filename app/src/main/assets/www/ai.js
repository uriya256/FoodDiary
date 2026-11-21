'use strict';
/* AI chat about your food diary (Google Gemini, free tier).
   Everything — the chat, what the assistant remembers, your key — is stored only on the phone.
   Loaded before app.js; runs only when app.js calls it. */

const AI_BASE = 'https://generativelanguage.googleapis.com/v1beta/';
const AI = { busy: false, reqId: null, streamText: '', model: null, triedFallback: false, onDone: null };

function aiDb() {
  if (!db.ai) db.ai = { messages: [], memory: [] };
  db.ai.messages = db.ai.messages || [];
  db.ai.memory = db.ai.memory || [];
  return db.ai;
}
function aiSet() {
  const s = db.settings;
  if (!s.ai) s.ai = { key: '', model: '', fallback: '', autoMemory: true, allowLog: true };
  return s.ai;
}

/* ---------- transport: native (no CORS, works in the app) or fetch (browser) ---------- */
const aiPending = {};
function aiHttpGet(path) {
  const key = aiSet().key;
  return new Promise((resolve) => {
    const id = 'g' + uid();
    if (A && A.aiGet) { aiPending[id] = resolve; A.aiGet(id, path, key); return; }
    fetch(AI_BASE + path, { headers: { 'x-goog-api-key': key } })
      .then(async r => resolve({ code: r.status, body: await r.text() }))
      .catch(e => resolve({ code: 0, body: String(e) }));
  });
}
window.onAiHttp = (id, code, body) => { const f = aiPending[id]; delete aiPending[id]; if (f) f({ code, body }); };

function aiStream(model, body, handlers) {
  const id = 's' + uid();
  AI.reqId = id;
  aiPending[id] = handlers;
  const key = aiSet().key;
  if (A && A.aiStream) { A.aiStream(id, model, key, JSON.stringify(body)); return id; }
  // browser fallback (used while developing)
  fetch(`${AI_BASE}models/${model}:streamGenerateContent?alt=sse`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) })
    .then(async (r) => {
      if (!r.ok) { window.onAiError(id, r.status, await r.text()); return; }
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line.startsWith('data:')) window.onAiChunk(id, line.slice(5).trim()); }
      }
      window.onAiDone(id);
    }).catch(e => window.onAiError(id, 0, String(e)));
  return id;
}
window.onAiChunk = (id, json) => {
  const h = aiPending[id]; if (!h) return;
  try {
    const d = JSON.parse(json);
    const parts = (((d.candidates || [])[0] || {}).content || {}).parts || [];
    const text = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
    if (text) h.chunk(text);
    const fr = ((d.candidates || [])[0] || {}).finishReason;
    if (fr && fr !== 'STOP' && fr !== 'MAX_TOKENS' && !text) h.blocked && h.blocked(fr);
  } catch (e) { }
};
window.onAiDone = (id) => { const h = aiPending[id]; delete aiPending[id]; if (h) h.done(); };
window.onAiError = (id, code, body) => { const h = aiPending[id]; delete aiPending[id]; if (h) h.error(code, body); };

/* ---------- choosing a free model ---------- */
function verNum(name) { const m = name.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; }
async function aiPickModels() {
  const r = await aiHttpGet('models?pageSize=200');
  if (r.code === 400 || r.code === 401 || r.code === 403) return { error: 'key', detail: r.body };
  if (r.code !== 200) return { error: 'net', detail: r.body };
  let list = [];
  try { list = JSON.parse(r.body).models || []; } catch (e) { }
  const ok = list.filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(n => /^gemini/.test(n) && /flash/.test(n) && !/(image|tts|audio|live|embedding|vision|thinking-exp|native|computer)/.test(n));
  const score = (n) => verNum(n) * 10 + (/latest/.test(n) ? 5 : 0) - (/preview|exp/.test(n) ? 3 : 0) - (/lite/.test(n) ? 20 : 0);
  ok.sort((a, b) => score(b) - score(a));
  const main = ok.includes('gemini-flash-latest') ? 'gemini-flash-latest' : ok[0];
  const lite = ok.includes('gemini-flash-lite-latest') ? 'gemini-flash-lite-latest' : ok.find(n => /lite/.test(n) && n !== main);
  return { main: main || 'gemini-flash-latest', lite: lite || '', all: ok };
}

/* ---------- what the assistant knows ---------- */
function aiDiaryContext() {
  const dates = allDatesSorted();
  const recent = dates.slice().reverse();
  let txt = '', n = 0;
  for (const iso of recent) {
    const d = db.days[iso];
    const t = dayText(iso) + (nutOn() && hasFood(d) ? '\n• ' + tr('הערכת תזונה: ', 'Nutrition estimate: ') + nutLine(d) : '');
    if (txt.length + t.length > 45000) break;
    txt = t + '\n\n' + txt; n++;
  }
  const older = dates.length - n;
  return (older > 0 ? `(${older} older days not shown)\n\n` : '') + (txt || '(the diary is empty so far)');
}
function aiSystemPrompt() {
  const now = new Date();
  const iso = todayISO();
  const w = W();
  const mem = aiDb().memory;
  const lang = LANG === 'en' ? 'English' : 'Hebrew';
  return `You are a warm, practical companion inside the user's food-diary app ("${tr('יומן אוכל', 'Food Diary')}"). You talk with the user about what they ate, their habits, water, their gym workouts, and ideas for meals, using their real diary below. Diary lines that start with "אימון"/"Workout" are gym sessions: "3x10 60 ק״ג" means 3 sets of 10 reps with 60 kg; "12/10/8x40/45/50" lists each set's reps and kg.

Today is ${P.weekdayName(iso)} ${P.displayDate(iso)}, time ${pad(now.getHours())}:${pad(now.getMinutes())}. Reply in ${lang} unless the user writes in another language. Keep answers short and friendly (usually 2–6 sentences or a short list). Use the diary to give concrete, personal answers (dates, foods, amounts). Do not invent diary entries.

You are not a doctor or dietitian. For medical conditions, medications, pregnancy, allergies or strong symptoms, give general information only and suggest talking to a doctor or registered dietitian. Never encourage extreme restriction, skipping meals, or very low calorie intake. If the user seems distressed about food or body, be gentle and suggest professional support.

MEMORY — things the user told you before (id: fact):
${mem.length ? mem.map(m => `${m.id}: ${m.text}`).join('\n') : '(nothing yet)'}

To save something worth remembering for future chats (preferences, dislikes, allergies, goals, routines, important life context, or anything the user asks you to remember), add a tag: <remember>short fact in ${lang}</remember>. Don't save trivial things or things already in memory. To delete an outdated or wrong fact, or when asked to forget: <forget id="m..."/>.
${aiSet().allowLog ? `
LOGGING — when the user tells you they ate or drank something and it is not already in the diary for that day, add it with a tag (one tag per meal):
<log date="YYYY-MM-DD" meal="breakfast|lunch|dinner|snack">items in the user's words, e.g. 2 פרוסות לחם, חביתה</log>
For water: <water date="YYYY-MM-DD" ml="250"/>
For a gym workout they did (exercises, sets x reps, kg, minutes), one tag per day: <workout date="YYYY-MM-DD">exercises in the user's words, e.g. סקוואט 4x8 80 קג, ריצה 5 קמ 28:30</workout>
When they tell you their body weight: <weight date="YYYY-MM-DD" kg="82.4"/>
If the meal isn't clear, choose by time (before 11:00 breakfast, 11–16 lunch, 16–21 dinner, otherwise snack). Don't log things they only plan or consider eating.` : ''}
Tags are hidden from the user and handled by the app; mention briefly in words what you saved or logged.

NUTRITION: the "Nutrition estimate" lines are the app's rough estimates from average food values and usual portions, not measurements; say so when it matters. ${nutSet().goal ? `Daily calorie goal: ${nutSet().goal} kcal (weekly ${weekGoal()}).` : 'No calorie goal set.'} Target split carbs/protein/fat: ${nutSet().target.c}/${nutSet().target.p}/${nutSet().target.f}%. Today so far: ${hasFood(db.days[iso]) ? nutLine(db.days[iso]) : 'nothing logged'}.

WEIGHT LOG (kg):
${weightContext()}

WATER: daily goal ${w.goalMl} ml; today so far ${dayWaterMl(db.days[iso])} ml; main bottle ${mainBottle().ml} ml; glass ${w.cupMl} ml.

THE DIARY (newest last):
${aiDiaryContext()}`;
}
function aiContents() {
  const msgs = aiDb().messages.filter(m => m.text && !m.error).slice(-80);
  const out = [];
  for (const m of msgs) {
    const role = m.role === 'user' ? 'user' : 'model';
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].parts[0].text += '\n\n' + (m.raw || m.text);
    else out.push({ role, parts: [{ text: m.raw || m.text }] });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

/* ---------- tags the model writes ---------- */
const TAG_RE = /<(remember)>([\s\S]*?)<\/remember>|<forget\s+id="([^"]+)"\s*\/?>(?:<\/forget>)?|<log\s+([^>]*)>([\s\S]*?)<\/log>|<water\s+([^>]*?)\/?>(?:<\/water>)?|<workout\b([^>]*)>([\s\S]*?)<\/workout>|<weight\s+([^>]*?)\/?>(?:<\/weight>)?/g;
function attrs(s) { const o = {}; String(s || '').replace(/(\w+)="([^"]*)"/g, (m, k, v) => { o[k] = v; }); return o; }
function stripTags(text) {
  return text.replace(TAG_RE, '')
    .replace(/<(remember|log|water|forget|workout|weight)\b[^]*$/i, '') // a tag still streaming in
    .replace(/\n{3,}/g, '\n\n').trim();
}
function applyTags(raw, msg) {
  const actions = [];
  const ai = aiDb();
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(raw))) {
    if (m[1] && aiSet().autoMemory) {
      const text = m[2].trim();
      if (text && !ai.memory.some(x => x.text === text)) { const id = 'm' + uid().slice(-6); ai.memory.push({ id, text, t: new Date().toISOString() }); actions.push({ type: 'remember', id, text }); }
    } else if (m[3]) {
      const i = ai.memory.findIndex(x => x.id === m[3]);
      if (i >= 0) { const f = ai.memory.splice(i, 1)[0]; actions.push({ type: 'forget', text: f.text, fact: f }); }
    } else if (m[4] != null && aiSet().allowLog) {
      const a = attrs(m[4]);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(a.date || '') ? a.date : todayISO();
      const meal = MEALS.includes(a.meal) ? a.meal : 'snack';
      const items = P.parseItems(m[5] || '', lex());
      if (items.length) {
        const added = addItemsToMeal(date, meal, items, true);
        actions.push({ type: 'log', date, meal, ids: added.map(x => x.id), text: added.map(x => P.formatItem(x)).join(', ') });
      }
    } else if (m[6] != null && aiSet().allowLog) {
      const a = attrs(m[6]);
      const ml = Math.round(+a.ml || 0);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(a.date || '') ? a.date : todayISO();
      if (ml > 0 && ml <= 5000) {
        const d = getDay(date, true); d.drinks = d.drinks || [];
        const t = date === todayISO() ? nowHHMM() : null;
        d.drinks.push({ t, ml }); actions.push({ type: 'water', date, ml, t });
      }
    } else if (m[8] != null && aiSet().allowLog) {
      const a = attrs(m[7]);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(a.date || '') ? a.date : todayISO();
      const r = window.Gym.parseWorkout(m[8]);
      if (r.exercises.length) {
        const g = gymOf(date, true);
        const added = addExercises(date, r.exercises);
        if (r.minutes && !g.minutes) g.minutes = r.minutes;
        actions.push({ type: 'workout', date, ids: added.map(x => x.id), text: added.map(x => window.Gym.exText(x)).join(', ') });
      }
    } else if (m[9] != null && aiSet().allowLog) {
      const a = attrs(m[9]);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(a.date || '') ? a.date : todayISO();
      const kg = parseFloat(String(a.kg || '').replace(',', '.'));
      if (kg >= 20 && kg <= 400) { const prev = weightOn(date); setWeight(date, kg); actions.push({ type: 'weight', date, kg, prev }); }
    }
  }
  msg.actions = actions;
  return actions;
}
function undoAction(msg, i) {
  const a = msg.actions[i]; if (!a || a.undone) return;
  const ai = aiDb();
  if (a.type === 'remember') ai.memory = ai.memory.filter(x => x.id !== a.id);
  else if (a.type === 'forget' && a.fact) ai.memory.push(a.fact);
  else if (a.type === 'log') { const d = getDay(a.date, false); if (d) { d.meals[a.meal] = d.meals[a.meal].filter(x => !a.ids.includes(x.id)); cleanupDay(a.date); } }
  else if (a.type === 'workout') { const d = getDay(a.date, false); if (d && d.gym) { d.gym.ex = d.gym.ex.filter(x => !a.ids.includes(x.id)); pruneGym(a.date); } }
  else if (a.type === 'weight') setWeight(a.date, a.prev || 0);
  else if (a.type === 'water') { const d = getDay(a.date, false); if (d && d.drinks) { const k = d.drinks.findIndex(x => x.ml === a.ml && x.t === a.t); if (k >= 0) d.drinks.splice(k, 1); cleanupDay(a.date); } }
  a.undone = true;
  save();
}

/* ---------- simple, safe markdown ---------- */
function mdLite(text) {
  const lines = esc(text).split('\n');
  let html = '', list = null;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?:]|$)/g, '$1<i>$2</i>');
  for (const l of lines) {
    const ul = l.match(/^\s*[-*•]\s+(.*)$/), ol = l.match(/^\s*\d+[.)]\s+(.*)$/);
    const kind = ul ? 'ul' : ol ? 'ol' : null;
    if (kind !== list) { if (list) html += `</${list}>`; if (kind) html += `<${kind}>`; list = kind; }
    if (kind) html += `<li>${inline((ul || ol)[1])}</li>`;
    else if (l.trim()) html += `<p>${inline(l)}</p>`;
  }
  if (list) html += `</${list}>`;
  return html;
}

/* ---------- the chat screen ---------- */
function actionCard(msg, i) {
  const a = msg.actions[i];
  const mealName = a.meal && MEAL[a.meal] ? MEAL[a.meal].label : '';
  const d = a.date ? P.displayDate(a.date) : '';
  const label = a.type === 'remember' ? [`נשמר בזיכרון: ${a.text}`, `Remembered: ${a.text}`]
    : a.type === 'forget' ? [`נמחק מהזיכרון: ${a.text}`, `Forgot: ${a.text}`]
    : a.type === 'log' ? [`נוסף ל${mealName} (${d}): ${a.text}`, `Added to ${mealName} (${d}): ${a.text}`]
    : a.type === 'workout' ? [`נוסף לאימון (${d}): ${a.text}`, `Added to workout (${d}): ${a.text}`]
    : a.type === 'weight' ? [`נרשם משקל (${d}): ${a.kg} ק״ג`, `Weight logged (${d}): ${a.kg} kg`]
    : [`נוספו ${fmtAmount(a.ml)} מים (${d})`, `Added ${fmtAmount(a.ml)} of water (${d})`];
  const ic = { remember: 'brain', forget: 'brain', log: 'book', water: 'drop', workout: 'dumbbell', weight: 'scale' }[a.type];
  return `<div class="aact ${a.undone ? 'undone' : ''}">${icon(ic, 16)}<span class="grow">${a.type === 'workout' ? gymHtml(tr(label[0], label[1])) : esc(tr(label[0], label[1]))}</span>${a.undone ? `<span class="small">${tr('בוטל', 'Undone')}</span>` : `<button class="linkbtn" data-act="aiUndo" data-id="${msg.id}" data-i="${i}">${tr('ביטול', 'Undo')}</button>`}</div>`;
}
function bubble(m) {
  const mine = m.role === 'user';
  const body = mine ? `<p>${esc(m.text).replace(/\n/g, '<br>')}</p>` : mdLite(m.text);
  return `<div class="msg ${mine ? 'me' : 'bot'} ${m.error ? 'err' : ''}" data-mid="${m.id}"><div class="bub">${body || '<span class="typing"><i></i><i></i><i></i></span>'}</div>${(m.actions || []).map((_, i) => actionCard(m, i)).join('')}${m.error ? `<button class="linkbtn" data-act="aiRetry">${icon('undo', 14)} ${tr('נסה שוב', 'Try again')}</button>` : ''}</div>`;
}
function viewChat() {
  const s = aiSet();
  let h = `<section class="topbar chat-top"><h1>${icon('sparkle', 22)} ${tr('העוזר שלי', 'My assistant')}</h1>
    ${s.key ? `<div class="row" style="gap:6px"><button class="iconbtn" data-act="aiMemory" aria-label="${tr('מה אני זוכר', 'What I remember')}">${icon('brain')}</button><button class="iconbtn" data-act="aiClear" aria-label="${tr('שיחה חדשה', 'New chat')}">${icon('trash')}</button></div>` : ''}</section>`;
  if (!s.key) return h + aiSetupHtml();
  const msgs = aiDb().messages;
  if (!msgs.length) {
    const sug = LANG === 'en'
      ? ['What did I eat this week?', 'How am I doing with water today?', 'Suggest a dinner based on what I ate today', 'How am I progressing at the gym?', 'Remember that I don’t eat cilantro', 'I just had a toast with cheese']
      : ['מה אכלתי השבוע?', 'איך אני עם המים היום?', 'תציע ארוחת ערב לפי מה שאכלתי היום', 'איך אני מתקדם באימונים?', 'תזכור שאני לא אוהב כוסברה', 'אכלתי עכשיו טוסט עם גבינה'];
    h += `<div class="card chat-hello"><div class="row" style="gap:10px"><span class="qi" style="--q1:#A78BFA;--q2:#6D5BD0">${icon('sparkle', 20)}</span><b>${tr('היי! אני מכיר את כל היומן שלך', 'Hi! I know your whole diary')}</b></div>
      <p class="small muted" style="margin:8px 0 0">${tr('אפשר לשאול אותי על מה שאכלת, לבקש רעיונות, או פשוט לספר לי מה אכלת ואני ארשום. מה שתספר לי על עצמך אזכור גם בפעם הבאה.', 'Ask about what you ate, get ideas, or just tell me what you ate and I’ll log it. What you tell me about yourself I’ll remember next time too.')}</p>
      <div class="chips">${sug.map(t => `<button class="chip" data-act="aiSuggest" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`;
  }
  h += `<div class="chat" id="chatList">${msgs.map(bubble).join('')}</div>`;
  h += `<form class="chat-input" data-form="chat" autocomplete="off">
    <textarea rows="1" data-on="chatText" placeholder="${tr('כתוב הודעה…', 'Write a message…')}" aria-label="${tr('הודעה', 'Message')}" enterkeyhint="send">${esc(AI.draft || '')}</textarea>
    ${AI.busy ? `<button type="button" class="iconbtn primary" data-act="aiStop" aria-label="${tr('עצור', 'Stop')}">${icon('stop')}</button>` : `<button type="submit" class="iconbtn primary" aria-label="${tr('שליחה', 'Send')}">${icon('send')}</button>`}
  </form>`;
  return h;
}
function aiSetupHtml() {
  return `<section class="card stack">
    <div class="row" style="gap:10px"><span class="qi" style="--q1:#A78BFA;--q2:#6D5BD0">${icon('sparkle', 20)}</span><b class="grow">${tr('צ׳אט עם AI על מה שאכלת', 'Chat with AI about what you ate')}</b></div>
    <p class="small muted" style="margin:0">${tr('הצ׳אט משתמש ב-Google Gemini בחינם. צריך פעם אחת מפתח אישי וחינמי:', 'The chat uses Google Gemini for free. You need a personal free key once:')}</p>
    <ol class="steps">
      <li>${tr('פתח את', 'Open')} <a href="https://aistudio.google.com/apikey">aistudio.google.com/apikey</a> ${tr('והתחבר עם חשבון Google', 'and sign in with Google')}</li>
      <li>${tr('לחץ "Create API key" והעתק את המפתח', 'Tap "Create API key" and copy the key')}</li>
      <li>${tr('הדבק אותו כאן ולחץ "חיבור"', 'Paste it here and tap "Connect"')}</li>
    </ol>
    <div class="row" style="gap:8px"><input class="search grow" type="text" data-on="aiKey" placeholder="AQ.… / AIza…" autocomplete="off" autocapitalize="off" spellcheck="false" dir="ltr">
      <button class="btn soft" data-act="aiPasteKey">${icon('paste', 18)}</button></div>
    <button class="btn primary big block" data-act="aiConnect">${icon('check', 20)}${tr('חיבור', 'Connect')}</button>
    <div class="small muted">${tr('השיחות, הזיכרון והמפתח נשמרים רק בטלפון. ההודעות והיומן נשלחים ל-Google כדי לקבל תשובה, ובגרסה החינמית Google עשויה להשתמש בהם לשיפור המוצרים שלה. המפתח לא נכלל בקובץ הגיבוי.', 'Chats, memory and the key stay on your phone. Messages and your diary are sent to Google to get answers, and on the free tier Google may use them to improve its products. The key is not included in backup files.')}</div>
  </section>`;
}
function chatScrollBottom(force) {
  const sc = $('#screen');
  if (!sc) return;
  if (force || sc.scrollHeight - sc.scrollTop - sc.clientHeight < 160) sc.scrollTop = sc.scrollHeight;
}
function updateStreamingBubble(msg) {
  const el = document.querySelector(`.msg[data-mid="${msg.id}"] .bub`);
  if (!el) return;
  const shown = stripTags(msg.raw || '');
  el.innerHTML = shown ? mdLite(shown) : '<span class="typing"><i></i><i></i><i></i></span>';
  chatScrollBottom(false);
}

/* ---------- sending ---------- */
function aiSend(text) {
  text = String(text || '').trim();
  if (!text || AI.busy) return;
  const ai = aiDb();
  ai.messages.push({ id: 'u' + uid(), role: 'user', text, t: new Date().toISOString() });
  AI.draft = '';
  aiRun();
}
function aiRun() {
  const ai = aiDb();
  const s = aiSet();
  const bot = { id: 'a' + uid(), role: 'model', text: '', raw: '', t: new Date().toISOString() };
  ai.messages.push(bot);
  AI.busy = true; AI.triedFallback = false;
  save();
  render(); chatScrollBottom(true);
  const body = {
    systemInstruction: { parts: [{ text: aiSystemPrompt() }] },
    contents: aiContents().filter(c => c.parts[0].text),
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };
  const go = (model) => aiStream(model, body, {
    chunk(t) { bot.raw += t; bot.text = stripTags(bot.raw); updateStreamingBubble(bot); },
    blocked() { bot.raw = bot.raw || tr('לא יכולתי לענות על זה.', "I couldn't answer that."); },
    done() {
      AI.busy = false;
      if (!bot.raw.trim()) { bot.error = true; bot.text = tr('לא התקבלה תשובה. נסה שוב.', 'No answer came back. Try again.'); }
      else { applyTags(bot.raw, bot); bot.text = stripTags(bot.raw); }
      save(); if (S.tab === 'chat') { render({ keepScroll: true }); chatScrollBottom(true); }
    },
    error(code, detail) {
      if ((code === 429 || code === 404 || code === 503) && !AI.triedFallback && s.fallback && model !== s.fallback) { AI.triedFallback = true; bot.raw = ''; go(s.fallback); return; }
      AI.busy = false; bot.error = true;
      bot.text = code === 429 ? tr('הגעת למגבלת השימוש החינמית לרגע. נסה שוב בעוד דקה.', 'You hit the free usage limit for now. Try again in a minute.')
        : (code === 401 || code === 403 || (code === 400 && /API_KEY|api key|PERMISSION|UNAUTHENTICATED|ACCESS_TOKEN/i.test(detail || ''))) ? tr('המפתח לא תקין. אפשר להחליף אותו בהגדרות › צ׳אט AI.', 'The key is not valid. You can replace it in Settings › AI chat.')
        : code === 0 ? tr('אין חיבור לאינטרנט. נסה שוב כשיש רשת.', 'No internet connection. Try again when you are online.')
        : tr(`משהו השתבש (${code}). נסה שוב.`, `Something went wrong (${code}). Try again.`);
      save(); if (S.tab === 'chat') { render({ keepScroll: true }); chatScrollBottom(true); }
    },
  });
  go(s.model || 'gemini-flash-latest');
}

/* ---------- memory sheet ---------- */
function memoryHtml() {
  const mem = aiDb().memory;
  return sheetHead(tr('מה אני זוכר עליך', 'What I remember about you')) + `<div class="body">
    <p class="small muted" style="margin:0">${tr('את הדברים האלה העוזר יודע בכל שיחה. אפשר למחוק או להוסיף.', 'The assistant knows these in every chat. You can delete or add.')}</p>
    ${mem.length ? `<div class="list">${mem.map(m => `<div class="li"><span class="grow">${esc(m.text)}</span><button class="iconbtn plain" data-act="memDel" data-id="${m.id}" aria-label="${tr('מחיקה', 'Delete')}">${icon('trash', 18)}</button></div>`).join('')}</div>` : `<div class="empty-state">${icon('brain', 36)}<div>${tr('עוד לא נשמר כלום.', 'Nothing saved yet.')}</div></div>`}
    <button class="btn" data-act="memAdd">${icon('plus', 18)}${tr('הוסף משהו לזכור', 'Add something to remember')}</button>
    <div class="row between"><span>${tr('לזכור אוטומטית מהשיחות', 'Remember automatically from chats')}</span>${sw('aiAutoMem', aiSet().autoMemory, tr('זיכרון אוטומטי', 'Automatic memory'))}</div>
  </div>`;
}

/* ---------- settings section ---------- */
function aiSettingsHtml() {
  const s = aiSet();
  return `<section class="card stack">
    <h2 class="row">${icon('sparkle', 20)}${tr('צ׳אט AI', 'AI chat')}</h2>
    ${s.key ? `<div class="row between"><span>${tr('מחובר ל-Google Gemini', 'Connected to Google Gemini')}<br><span class="small muted" dir="ltr">${esc(s.model || '')} · ${esc(s.key.slice(0, 6))}…${esc(s.key.slice(-4))}</span></span>
        <button class="btn danger" data-act="aiDisconnect">${tr('ניתוק', 'Disconnect')}</button></div>
      <div class="row between"><span>${tr('לרשום ליומן מה שאני מספר בצ׳אט', 'Log what I tell the chat into the diary')}</span>${sw('aiAllowLog', s.allowLog, tr('רישום מהצ׳אט', 'Logging from chat'))}</div>
      <div class="row between"><span>${tr('לזכור אוטומטית מהשיחות', 'Remember automatically from chats')}</span>${sw('aiAutoMem', s.autoMemory, tr('זיכרון אוטומטי', 'Automatic memory'))}</div>
      <button class="btn" data-act="aiMemory">${icon('brain', 18)}${tr(`מה העוזר זוכר (${aiDb().memory.length})`, `What the assistant remembers (${aiDb().memory.length})`)}</button>`
    : `<div class="small muted">${tr('לא מחובר. בלשונית הצ׳אט יש הוראות חיבור חינמי.', 'Not connected. The Chat tab explains the free setup.')}</div><button class="btn soft" data-act="tab" data-id="chat">${icon('sparkle', 18)}${tr('לחיבור', 'Set up')}</button>`}
  </section>`;
}

/* ---------- actions (merged into ACT by app.js) ---------- */
const AI_ACT = {
  async aiConnect() {
    const inp = $('[data-on="aiKey"]');
    // Both key formats work: the new auth keys ("AQ.…") and the older ones ("AIza…")
    const key = ((inp && inp.value) || '').trim().replace(/\s+/g, '').replace(/^["'`]+|["'`]+$/g, '');
    if (!/^[A-Za-z0-9._\-]{20,300}$/.test(key)) { toast(tr('זה לא נראה כמו מפתח. הוא מתחיל בדרך כלל ב-AQ. או ב-AIza', "That doesn't look like a key. It usually starts with AQ. or AIza")); return; }
    const s = aiSet(); const old = s.key; s.key = key;
    toast(tr('בודק את המפתח…', 'Checking the key…'));
    const r = await aiPickModels();
    if (r.error) {
      s.key = old;
      toast(r.error === 'key' ? tr('המפתח לא עובד. בדוק שהעתקת את כולו', "The key doesn't work. Check you copied all of it") : tr('אין חיבור ל-Google. בדוק אינטרנט ונסה שוב', "Can't reach Google. Check the internet and try again"));
      return;
    }
    s.model = r.main; s.fallback = r.lite;
    save(); render(); toast(tr('מחובר! אפשר להתחיל לדבר', 'Connected! You can start chatting'));
  },
  aiPasteKey() {
    let t = '';
    try { t = A && A.readClipboard ? A.readClipboard() : ''; } catch (e) { }
    const inp = $('[data-on="aiKey"]');
    if (t && inp) inp.value = t.trim(); else if (navigator.clipboard) navigator.clipboard.readText().then(v => { if (inp) inp.value = v.trim(); }).catch(() => { });
  },
  aiDisconnect() {
    confirmSheet(tr('ניתוק הצ׳אט', 'Disconnect chat'), tr('המפתח יימחק מהטלפון. השיחות והזיכרון יישארו.', 'The key will be removed from the phone. Chats and memory stay.'), tr('ניתוק', 'Disconnect'), () => { const s = aiSet(); s.key = ''; s.model = ''; s.fallback = ''; save(); render({ keepScroll: true }); });
  },
  aiSuggest(el) { aiSend(el.dataset.t); },
  aiStop() { if (A && A.aiCancel && AI.reqId) A.aiCancel(AI.reqId); const h = aiPending[AI.reqId]; if (h) { delete aiPending[AI.reqId]; h.done(); } },
  aiRetry() {
    const ai = aiDb();
    while (ai.messages.length && ai.messages[ai.messages.length - 1].role !== 'user') ai.messages.pop();
    if (ai.messages.length) aiRun();
  },
  aiUndo(el) {
    const m = aiDb().messages.find(x => x.id === el.dataset.id);
    if (m) { undoAction(m, +el.dataset.i); render({ keepScroll: true }); }
  },
  aiClear() {
    confirmSheet(tr('שיחה חדשה', 'New chat'), tr('ההודעות יימחקו. מה שהעוזר זוכר עליך יישאר (אפשר לראות בכפתור הזיכרון).', 'Messages will be deleted. What the assistant remembers about you stays (see the memory button).'), tr('מחק הודעות', 'Delete messages'), () => { aiDb().messages = []; save(); render(); });
  },
  aiMemory() { openSheet('memory', memoryHtml(), { title: tr('זיכרון', 'Memory'), onClose: () => render({ keepScroll: true }) }); },
  memDel(el) { const ai = aiDb(); ai.memory = ai.memory.filter(x => x.id !== el.dataset.id); save(); replaceSheetBody('memory', memoryHtml()); },
  memAdd() {
    promptSheet(tr('משהו לזכור', 'Something to remember'), tr('למשל: אני צמחוני / לא אוהב כוסברה / מנסה לאכול יותר ירקות', "e.g. I'm vegetarian / I don't like cilantro / trying to eat more vegetables"), '', (v) => {
      if (v) { aiDb().memory.push({ id: 'm' + uid().slice(-6), text: v, t: new Date().toISOString() }); save(); }
      replaceSheetBody('memory', memoryHtml());
    });
  },
  aiAutoMem() { const s = aiSet(); s.autoMemory = !s.autoMemory; save(); if (sheetStack.find(x => x.id === 'memory')) replaceSheetBody('memory', memoryHtml()); else render({ keepScroll: true }); },
  aiAllowLog() { const s = aiSet(); s.allowLog = !s.allowLog; save(); render({ keepScroll: true }); },
};
const AI_ON = {
  chatText(el) {
    AI.draft = el.value;
    el.style.height = 'auto'; el.style.height = Math.min(140, el.scrollHeight) + 'px';
  },
  aiKey() { },
};
