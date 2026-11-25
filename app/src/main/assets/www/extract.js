/*
 * Reads a product's nutrition values (per 100 g) from the web page that is open in the app's browser,
 * usually the manufacturer's product page. The app runs this inside that page when you tap
 * "use the values on this page"; it returns JSON text:
 * { ok, k, p, c, f, g, name, host, url }  (ok = all four values were found; g = serving size in grams, if written).
 * Loaded in the app itself (window.__FD_LABEL_API set first), it only adds window.FDLabel.fromText(text),
 * which reads the same values from the text of a photographed label.
 */
(function () {
  function num(s) { return parseFloat(String(s).replace(',', '.')); }
  var NUM = /(\d+(?:[.,]\d+)?)/;
  var KCAL_AFTER = /(\d+(?:[.,]\d+)?)\s*(?:kcal|קק["״'׳]?ל|קלוריות|קילו[\s-]*קלוריות)/i;
  var KJ = /(קילו[\s-]*ג['׳]?(?:או|ו)ל|ק["״]?ג['׳]?|kj\b|kilojoule)/i;
  var LABELS = {
    k: /(^|[\s(|])(אנרג[א-ת]*|קלורי[א-ת]*|ערך\s*קלורי|energy|calories)/i,
    p: /(^|[\s(|])(חלבו[א-ת]*|proteins?)(?![a-z])/i,
    c: /(^|[\s(|])(סה["״]?כ\s*פחמי[א-ת]*|פחמי[א-ת]*|carbohydrates?|total\s*carb)/i,
    f: /(^|[\s(|])(סה["״]?כ\s*שומנ[א-ת]*|שומנ[א-ת]*|שומן|total\s*fat|fats?)(?![a-z])/i,
  };
  // lines about a part of the fat or the carbs ("of which saturated"), not the total
  var NOT = {
    k: /^$/,
    p: /^$/,
    c: /(מתוכ|סוכר|sugars|polyol|כהלים)/i,
    f: /(רוו|טראנס|trans|saturat|כולסטרול|cholest|חומצות|מתוכ|בלתי|unsatur|of which)/i,
  };
  var SECTION = /(ערכים\s*תזונתיים|ערך\s*תזונתי|סימון\s*תזונתי|מידע\s*תזונתי|תכולה\s*תזונתית|nutrition(?:al)?\s*(?:facts|values|information|info)?)/i;

  function linesOf(text) {
    return String(text || '').split(/\n+/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
  }
  /** Every element without child elements, in page order: also finds tables hidden in closed tabs. */
  function leafLines() {
    var out = [];
    var all = document.body ? document.body.getElementsByTagName('*') : [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|PATH)$/i.test(el.tagName)) continue;
      if (el.tagName === 'TR') { // a table row as one line: "חלבונים 11 27.5"
        var cells = [];
        for (var j = 0; j < el.children.length; j++) cells.push(el.children[j].textContent);
        out.push(cells.join(' '));
        continue;
      }
      if (el.closest && el.closest('tr')) continue;
      if (el.children.length === 0 && el.textContent) out.push(el.textContent);
    }
    return linesOf(out.join('\n'));
  }
  /** The part of the page about nutrition, when the page names it. */
  function section(lines) {
    for (var i = 0; i < lines.length; i++) if (SECTION.test(lines[i])) return lines.slice(i, i + 80);
    return lines;
  }
  function energy(line, labelEnd) {
    var rest = line.slice(labelEnd);
    var m = rest.match(KCAL_AFTER);
    if (m) return num(m[1]);
    var lab = line.slice(0, labelEnd + 14);
    // "אנרגיה (קילוג'ול)" alone: kJ, turned into kcal
    var n = rest.match(NUM);
    if (!n) return null;
    if (KJ.test(lab) && !/קלורי|kcal|קק/i.test(lab)) return Math.round(num(n[1]) / 4.184);
    return num(n[1]);
  }
  function find(lines, key) {
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(LABELS[key]);
      if (!m || NOT[key].test(line)) continue;
      var end = m.index + m[0].length;
      var v = null;
      if (key === 'k') v = energy(line, end);
      else { var n = line.slice(end).match(NUM); if (n) v = num(n[1]); }
      // the number is in the next cell: "חלבונים" then "11"
      for (var j = 1; v == null && j <= 3 && i + j < lines.length; j++) {
        var nx = lines[i + j];
        if (!/^\s*\d/.test(nx)) { if (/[א-תa-z]{3}/i.test(nx) && !/^(גרם|ג['׳]|g|מ["״]?ג|mg|kcal|קק["״]?ל|קלוריות)/i.test(nx)) break; continue; }
        if (key === 'k') { var e = nx.match(KCAL_AFTER); v = e ? num(e[1]) : num(nx.match(NUM)[1]); }
        else v = num(nx.match(NUM)[1]);
      }
      if (v != null && isFinite(v)) return v;
    }
    return null;
  }
  function read(lines) {
    var s = section(lines);
    var o = {};
    ['k', 'p', 'c', 'f'].forEach(function (k) { o[k] = find(s, k); if (o[k] == null && s !== lines) o[k] = find(lines, k); });
    return o;
  }
  function good(o) {
    return o.k != null && o.k > 0 && o.k < 950 && ['p', 'c', 'f'].every(function (k) { return o[k] != null && o[k] >= 0 && o[k] <= 100; });
  }
  function count(o) { return ['k', 'p', 'c', 'f'].filter(function (k) { return o[k] != null; }).length; }

  // names of every row a nutrition table may have, so a table read column by column can be matched up
  var ROW = /(אנרג|קלורי|חלבו|פחמי|סוכר|שומנ|שומן|רוו|טראנס|כולסטרול|נתרן|סיבים|סידן|מלח|ויטמין|ברזל|אשלגן|energy|calor|protein|carb|sugar|fat|satur|trans|cholest|sodium|fib(?:er|re)|salt|calcium)/i;
  var NUMLINE = /^\s*(\d+(?:[.,]\d+)?)(?:\s*(?:גרם|ג['׳]|מ["״]?ג|קק["״]?ל|קלוריות|g|mg|kcal))?(?:\s+\d+(?:[.,]\d+)?(?:\s*(?:גרם|ג['׳]|מ["״]?ג|g|mg))?)?\s*$/i;
  /** The reader sometimes gives all the row names, then all the numbers: match them by order. */
  function byColumns(lines, a) {
    var rows = [], nums = [];
    lines.forEach(function (l) {
      if (ROW.test(l) && !/\d/.test(l)) rows.push(l);
      else { var m = l.match(NUMLINE); if (m) nums.push(num(m[1])); }
    });
    if (rows.length < 3 || nums.length < rows.length) return a;
    var o = { k: a.k, p: a.p, c: a.c, f: a.f };
    ['k', 'p', 'c', 'f'].forEach(function (k) {
      if (o[k] != null) return;
      for (var i = 0; i < rows.length; i++) if (LABELS[k].test(rows[i]) && !NOT[k].test(rows[i])) { o[k] = nums[i]; break; }
    });
    return o;
  }
  /** Values from plain text (a photographed label read by OCR). */
  function fromText(text) {
    var t = String(text || '').replace(/[|]/g, ' ');
    var a = read(linesOf(t));
    if (count(a) < 4) a = byColumns(section(linesOf(t)), a);
    ['p', 'c', 'f'].forEach(function (k) { if (a[k] != null && (a[k] < 0 || a[k] > 100)) a[k] = null; });
    if (a.k != null && (a.k <= 0 || a.k >= 950)) a.k = null;
    var sv = t.match(/(גודל\s*(?:ה)?מנה|מנה\s*(?:של|=)|serving\s*size)[^\d\n]{0,20}(\d+(?:[.,]\d+)?)\s*(גרם|ג['׳]|g\b|מ["״]?ל|ml)/i);
    a.g = sv ? num(sv[2]) : null;
    a.ok = good(a);
    return a;
  }
  if (typeof window !== 'undefined' && window.__FD_LABEL_API) { window.FDLabel = { fromText: fromText }; return ''; }

  try {
    var a = read(linesOf(document.body ? document.body.innerText : ''));
    if (!good(a)) {
      var b = read(leafLines());
      if (good(b) || count(b) > count(a)) a = b;
    }
    ['p', 'c', 'f'].forEach(function (k) { if (a[k] != null && (a[k] < 0 || a[k] > 100)) a[k] = null; });
    if (a.k != null && (a.k <= 0 || a.k >= 950)) a.k = null;
    var all = (document.body ? document.body.innerText : '');
    var sv = all.match(/(גודל\s*(?:ה)?מנה|מנה\s*(?:של|=)|serving\s*size)[^\d\n]{0,20}(\d+(?:[.,]\d+)?)\s*(גרם|ג['׳]|g\b|מ["״]?ל|ml)/i);
    var h1 = document.querySelector('h1');
    var og = document.querySelector('meta[property="og:title"]');
    var name = (h1 && h1.textContent.trim()) || (og && og.getAttribute('content')) || document.title || '';
    name = name.replace(/\s+/g, ' ').split(/\s[|–—-]\s/)[0].trim().slice(0, 80);
    return JSON.stringify({
      ok: good(a), k: a.k, p: a.p, c: a.c, f: a.f, g: sv ? num(sv[2]) : null,
      name: name, host: location.hostname.replace(/^www\./, ''), url: location.href,
    });
  } catch (e) {
    return JSON.stringify({ ok: false, err: String(e) });
  }
})();
