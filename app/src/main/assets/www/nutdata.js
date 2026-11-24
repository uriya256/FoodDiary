// Estimated nutrition for the built-in foods, and the math that turns a diary item into calories and macros.
// Values are per 100 g (kcal | protein | carbs | fat), from common food tables, rounded.
// serving = grams when no amount is written ("סלט ירקות"), piece = grams of one counted item ("4 אגוזי מלך"),
// add = grams when attached after "עם" without an amount ("קפה עם חלב"), then grams for specific units.
(function () {
'use strict';

const NUT_LINES = `
סלט ירקות|20|0.9|4|0.2|150|150|60|כוסות=150;קערות=250;צלחות=250
מלפפון|15|0.7|3.6|0.1|120|120|40
עגבנייה|18|0.9|3.9|0.2|120|120|40
גזר|41|0.9|9.6|0.2|70|70|30
חסה|15|1.4|2.9|0.2|50|10|20
פלפל|26|1|6|0.3|150|150|40
בצל|40|1.1|9.3|0.1|50|110|20
שום|149|6.4|33|0.5|4|4|4
לימון|22|0.4|6.9|0.2|15|30|15
כרוב|25|1.3|5.8|0.1|100|100|40
ברוקולי|34|2.8|6.6|0.4|100|100|50
כרובית|25|1.9|5|0.3|100|100|50
קישוא|17|1.2|3.1|0.3|200|200|60
חציל|25|1|6|0.2|150|300|60
תפוח אדמה|87|1.9|20|0.1|150|150|80
בטטה|90|2|20.7|0.2|150|150|80
פטריות|22|3.1|3.3|0.3|70|15|40
תירס|96|3.4|21|1.5|100|100|40|כוסות=150
סלק|44|1.7|10|0.2|80|80|40
אבוקדו|160|2|8.5|14.7|70|140|50|כפות=15
תרד|23|2.9|3.6|0.4|80|80|40
ירקות מוקפצים|50|2|7|2|200|200|80
מרק ירקות|35|1.2|6|0.8|300|300|150|קערות=300;כוסות=250
תפוח|52|0.3|14|0.2|180|180|60
בננה|89|1.1|23|0.3|120|120|60
תפוז|47|0.9|12|0.1|150|150|60
תמר|277|1.8|75|0.2|20|20|20
ענבים|69|0.7|18|0.2|150|5|50|כוסות=150
אגס|57|0.4|15|0.1|180|180|60
אפרסק|39|0.9|10|0.3|150|150|60
אבטיח|30|0.6|7.6|0.2|300|300|100|פרוסות=300
מלון|34|0.8|8|0.2|200|200|80|פרוסות=150
מנגו|60|0.8|15|0.4|150|250|60
תותים|32|0.7|7.7|0.3|150|12|50|כוסות=150
אוכמניות|57|0.7|14.5|0.3|100|1|40|כוסות=150
קיווי|61|1.1|15|0.5|75|75|40
רימון|83|1.7|19|1.2|100|170|40|כוסות=170
פירות יבשים|300|2.5|75|0.5|40|5|20|חופנים=40
קינואה|120|4.4|21.3|1.9|150|150|80|כוסות=185
אורז מלא|112|2.3|23.5|0.8|150|150|80|כוסות=195
כוסמת|92|3.4|20|0.6|150|150|80|כוסות=170
שיבולת שועל|379|13|68|6.5|40|40|30|כוסות=80;קערות=50;כפות=8
לחם מלא|247|13|41|3.4|60|30|30|פרוסות=30
פיתה מלאה|262|9.8|55|1.7|75|75|75
פסטה מלאה|149|6|30|1.7|200|200|100|כוסות=140
בורגול|83|3|18.6|0.2|150|150|80|כוסות=180
לחם|266|8.9|49|3.3|60|30|30|פרוסות=30
לחם קל|205|10|34|2.5|44|22|22|פרוסות=22
חלה|290|8.5|50|6|80|40|40|פרוסות=40
פיתה|275|9|56|1.2|90|90|90
לחמנייה|280|9|50|4|70|70|70
באגט|270|9|55|1.5|80|250|80|פרוסות=25;חתיכות=80
טורטייה|300|8|50|7|60|60|60
קרקר|400|8.5|75|7|30|9|20
אורז|130|2.7|28|0.3|150|150|80|כוסות=160
פסטה|158|5.8|31|0.9|200|200|100|כוסות=140
קוסקוס|112|3.8|23|0.2|150|150|80|כוסות=160
טוסט|275|11|33|11|120|120|120
בורקס|380|7|35|23|100|100|100
קרואסון|406|8|46|21|60|60|60
עוגייה|480|5.5|65|22|15|15|15
ביצה|150|12.6|1|10|55|55|55
ביצה קשה|155|12.6|1.1|10.6|50|50|50
ביצה רכה|143|12.6|0.7|9.5|50|50|50
ביצה מקושקשת|170|11|1.6|13|120|60|60|ביצים=60
חביתה|165|11|1|13|124|124|124|ביצים=62
ביצת עין|180|12|1|14|60|60|60|ביצים=60
שקשוקה|90|5.5|5|5.5|280|280|280|ביצים=140
עוף|180|28|0|7.5|150|150|100|חתיכות=100;פרוסות=30;משולשים=120
חזה עוף|165|31|0|3.6|150|150|100|חתיכות=100;פרוסות=30
פרגית|210|26|0|11.5|150|120|100|חתיכות=120
שניצל|250|18|14|13|130|130|130
הודו|120|22|2|3|150|150|60|פרוסות=15
בשר|250|26|0|16|150|150|100
קציצות|230|17|7|15|150|50|50
דג|130|25|0|3|150|150|100
טונה|150|26|0|5|110|110|60|קופסאות=110
טונה במים|116|26|0|1|110|110|60|קופסאות=110
טונה בשמן|190|27|0|9|110|110|60|קופסאות=110
סלמון|208|20|0|13|150|150|100
נקניקיות|290|11|3|26|100|50|50
טופו|120|13|3|7|100|100|60
חומוס|230|7.5|14|17|100|100|40|כפות=25
עדשים|116|9|20|0.4|150|150|60|כוסות=200;קערות=250
שעועית|120|8|21|0.5|150|150|60|כוסות=180
אפונה|81|5.4|14|0.4|100|100|40
גרגירי חומוס|164|8.9|27|2.6|100|100|40|כוסות=165;כפות=12
פלאפל|333|13|32|18|85|17|50
אדממה|121|12|9|5|100|100|50
יוגורט|70|6|5.5|3|150|150|50|קופסאות=150;כפות=20;כוסות=245
גבינה לבנה|95|10|3|5|100|100|30|קופסאות=250;כפות=25;כוסות=225
גבינה צהובה|330|26|1|25|40|20|20|פרוסות=20
גבינה בולגרית|200|17|1.5|14|40|30|20|כפות=20;חתיכות=30;פרוסות=25
חלב|60|3.3|4.7|3|240|240|50|כוסות=240;כפות=15
שמנת|200|2.8|3.5|20|30|30|20|כפות=15
אגוזי מלך|654|15|14|65|30|5|15|חופנים=30;כפות=8;כוסות=120
שקדים|579|21|22|50|30|1.2|15|חופנים=30;כפות=9;כוסות=140
קשיו|553|18|30|44|30|1.6|15|חופנים=30;כפות=9
פיסטוקים|560|20|28|45|30|0.7|15|חופנים=30;כפות=9
בוטנים|567|26|16|49|30|0.7|15|חופנים=30;כפות=16;כפיות=5
גרעיני דלעת|559|30|11|49|20|0.3|10|חופנים=30;כפות=9
גרעיני חמנייה|584|21|20|51|20|0.06|10|חופנים=30;כפות=9
זרעי צ׳יה|486|17|42|31|12|12|10|כפות=12;כפיות=4
זרעי פשתן|534|18|29|42|10|10|10|כפות=10;כפיות=3
שומשום|573|18|23|50|9|9|5|כפות=9;כפיות=3
טחינה|300|8.5|10.5|27|40|40|30|כפות=20;כפיות=7
שמן זית|884|0|0|100|10|10|10|כפות=13;כפיות=4.5
מלח|0|0|0|0|1|1|1
פלפל שחור|0|0|0|0|1|1|1
כמון|0|0|0|0|1|1|1
פפריקה|0|0|0|0|1|1|1
קטשופ|101|1|25|0.1|17|17|17|כפות=17;כפיות=6
מיונז|680|1|0.6|75|14|14|14|כפות=14;כפיות=5
חרדל|66|4|6|4|5|5|5|כפות=15;כפיות=5
רוטב|50|1.5|8|1.5|60|60|40|כפות=15
סילאן|290|1|72|0|15|15|10|כפות=20;כפיות=7
דבש|304|0.3|82|0|10|10|7|כפות=21;כפיות=7
ריבה|250|0.4|62|0.1|20|20|15|כפות=20;כפיות=7
מים|0|0|0|0|240|240|240
תה|1|0|0.3|0|240|240|240|ספלים=300
קפה|2|0.1|0.3|0|240|240|240|ספלים=300
הפוך|42|2.2|3.5|2.2|300|300|240|כוסות=240;ספלים=300
מיץ|45|0.7|10.4|0.2|240|240|240|כוסות=240
משקה|42|0|10.6|0|330|330|240|כוסות=240
סוכר|400|0|100|0|5|5|5|כפיות=5;כפות=13
שוקולד|540|6|58|31|25|5|10|חתיכות=7
עוגה|380|5|52|17|80|80|80|פרוסות=80
גלידה|207|3.5|24|11|100|65|60|כוסות=140
במבה|535|15|37|36|40|40|25
ביסלי|490|9|62|23|35|35|25
חטיף|400|15|50|14|40|40|40
וופל|520|6|63|27|30|12|12
פיצה|266|11|33|10|220|110|110|חתיכות=110;משולשים=110;פרוסות=110
המבורגר|250|13|22|12|220|220|220
שווארמה|220|13|18|11|320|320|320
סושי|150|5|28|2.5|240|30|30|חתיכות=30
מלוואח|400|7|40|24|130|130|130
ג׳חנון|390|7|45|20|200|100|100
כריך|230|10|30|8|200|200|200
מרק עוף|40|3.5|3|1.5|350|350|200|קערות=350;כוסות=250
bagel|257|10|50|1.5|100|100|100
cereal|380|7|84|2|40|40|30|כוסות=30;קערות=40
chips|536|7|53|34|40|40|25
`;

// English built-in foods share the Hebrew values.
const NUT_EN = {
  'salad': 'סלט ירקות', 'cucumber': 'מלפפון', 'tomato': 'עגבנייה', 'carrot': 'גזר', 'lettuce': 'חסה', 'bell pepper': 'פלפל',
  'onion': 'בצל', 'garlic': 'שום', 'lemon': 'לימון', 'broccoli': 'ברוקולי', 'cauliflower': 'כרובית', 'zucchini': 'קישוא',
  'eggplant': 'חציל', 'potato': 'תפוח אדמה', 'sweet potato': 'בטטה', 'mushrooms': 'פטריות', 'corn': 'תירס', 'spinach': 'תרד',
  'avocado': 'אבוקדו', 'vegetables': 'ירקות מוקפצים', 'vegetable soup': 'מרק ירקות', 'apple': 'תפוח', 'banana': 'בננה',
  'orange': 'תפוז', 'date': 'תמר', 'grapes': 'ענבים', 'pear': 'אגס', 'peach': 'אפרסק', 'watermelon': 'אבטיח', 'melon': 'מלון',
  'mango': 'מנגו', 'strawberries': 'תותים', 'blueberries': 'אוכמניות', 'kiwi': 'קיווי', 'dried fruit': 'פירות יבשים',
  'quinoa': 'קינואה', 'brown rice': 'אורז מלא', 'oatmeal': 'שיבולת שועל', 'whole wheat bread': 'לחם מלא',
  'whole wheat pita': 'פיתה מלאה', 'whole wheat pasta': 'פסטה מלאה', 'bread': 'לחם', 'challah': 'חלה', 'pita': 'פיתה',
  'roll': 'לחמנייה', 'baguette': 'באגט', 'tortilla': 'טורטייה', 'crackers': 'קרקר', 'rice': 'אורז', 'pasta': 'פסטה',
  'couscous': 'קוסקוס', 'toast': 'טוסט', 'croissant': 'קרואסון', 'egg': 'ביצה', 'omelette': 'חביתה', 'fried egg': 'ביצת עין',
  'shakshuka': 'שקשוקה', 'chicken': 'עוף', 'schnitzel': 'שניצל', 'turkey': 'הודו', 'beef': 'בשר', 'meatballs': 'קציצות',
  'hard-boiled egg': 'ביצה קשה', 'soft-boiled egg': 'ביצה רכה', 'scrambled eggs': 'ביצה מקושקשת', 'chicken breast': 'חזה עוף',
  'chicken thigh': 'פרגית', 'tuna in water': 'טונה במים', 'tuna in oil': 'טונה בשמן', 'cappuccino': 'הפוך', 'light bread': 'לחם קל',
  'fish': 'דג', 'tuna': 'טונה', 'salmon': 'סלמון', 'hot dogs': 'נקניקיות', 'tofu': 'טופו', 'hummus': 'חומוס',
  'lentils': 'עדשים', 'beans': 'שעועית', 'peas': 'אפונה', 'chickpeas': 'גרגירי חומוס', 'falafel': 'פלאפל',
  'edamame': 'אדממה', 'yogurt': 'יוגורט', 'cottage cheese': 'גבינה לבנה', 'cheese': 'גבינה צהובה', 'feta': 'גבינה בולגרית',
  'milk': 'חלב', 'walnuts': 'אגוזי מלך', 'almonds': 'שקדים', 'cashews': 'קשיו', 'pistachios': 'פיסטוקים', 'peanuts': 'בוטנים',
  'pumpkin seeds': 'גרעיני דלעת', 'sunflower seeds': 'גרעיני חמנייה', 'chia seeds': 'זרעי צ׳יה', 'flax seeds': 'זרעי פשתן',
  'sesame': 'שומשום', 'tahini': 'טחינה', 'olive oil': 'שמן זית', 'salt': 'מלח', 'black pepper': 'פלפל שחור',
  'ketchup': 'קטשופ', 'mayo': 'מיונז', 'mustard': 'חרדל', 'sauce': 'רוטב', 'date syrup': 'סילאן', 'honey': 'דבש',
  'jam': 'ריבה', 'water': 'מים', 'tea': 'תה', 'coffee': 'קפה', 'juice': 'מיץ', 'soft drink': 'משקה', 'sugar': 'סוכר',
  'chocolate': 'שוקולד', 'cake': 'עוגה', 'ice cream': 'גלידה', 'cookie': 'עוגייה', 'snack bar': 'חטיף', 'waffle': 'וופל',
  'pizza': 'פיצה', 'burger': 'המבורגר', 'shawarma': 'שווארמה', 'sushi': 'סושי', 'sandwich': 'כריך', 'chicken soup': 'מרק עוף',
};

// Rough values by category, for foods that have no values of their own (shown as a rough guess).
const CAT_NUT = {
  veg: [25, 1.2, 5, 0.2, 100], fruit: [55, 0.7, 14, 0.2, 120], whole: [150, 5, 28, 2, 120], grain: [270, 8.5, 50, 4, 60],
  protein: [190, 24, 2, 10, 130], legume: [150, 8, 20, 4, 120], dairy: [120, 9, 4, 7, 100], nuts: [580, 18, 18, 50, 25],
  sauce: [150, 2, 10, 12, 15], drink: [30, 0.5, 7, 0.3, 240], sweet: [420, 5, 60, 18, 40], dish: [220, 10, 22, 10, 300],
};

// Grams for a unit when the food has no number of its own. null = use the food's piece / serving.
const UNIT_G = {
  'פרוסות': 30, 'כפות': 15, 'כפיות': 5, 'חתיכות': null, 'משולשים': null, 'כוסות': 240, 'ספלים': 300, 'קערות': 300,
  'צלחות': 350, 'מנות': null, 'יחידות': null, 'חופנים': 30, 'קופסאות': 150, 'בקבוקים': 500, 'פחיות': 330, 'גרם': 1, 'ביצים': 55,
};
const SOLID_CUP = 150;

function parseNut() {
  const t = {};
  for (const line of NUT_LINES.split('\n')) {
    const l = line.trim();
    if (!l) continue;
    const [name, k, p, c, f, serving, piece, add, units] = l.split('|');
    const u = {};
    (units || '').split(';').filter(Boolean).forEach(x => { const [a, b] = x.split('='); u[a] = +b; });
    t[name] = { k: +k, p: +p, c: +c, f: +f, serving: +serving, piece: +piece, add: +add, u };
  }
  return t;
}
const NUT = parseNut();

/** Per-100g values for a food name: user values first, then the built-in table, then the category. */
function nutFor(name, cat, user) {
  const key = NUT[name] ? name : NUT_EN[name];
  let base = null;
  if (key && NUT[key]) base = Object.assign({}, NUT[key], { src: 'db' });
  else if (CAT_NUT[cat]) { const cv = CAT_NUT[cat]; base = { k: cv[0], p: cv[1], c: cv[2], f: cv[3], serving: cv[4], piece: cv[4], add: Math.min(cv[4], 30), u: {}, src: 'cat' }; }
  const x = user && user[name];
  if (x) {
    // user values replace the numbers; their weight replaces the piece or the serving they edited
    const o = Object.assign({ serving: 100, piece: 100, add: 30, u: {} }, base || {}, { k: +x.k || 0, p: +x.p || 0, c: +x.c || 0, f: +x.f || 0, src: 'user' });
    if (x.g) {
      if (x.gk === 'piece') o.piece = x.g;
      else { o.serving = x.g; if (!base || base.src === 'cat') { o.piece = x.g; o.add = Math.min(x.g, 30); } }
    }
    return o;
  }
  return base;
}
/** Which weight the value editor shows: one piece when the food is counted in pieces, else a serving. */
function editWeightKey(n) { return n && n.piece !== n.serving && n.piece >= 15 ? 'piece' : 'serving'; }

// Bare names that mean a portion, not a single piece ("סושי" is a plate of sushi, not one roll).
const PORTION_NAMES = new Set(['סושי', 'פלאפל', 'חסה', 'פירות יבשים', 'sushi', 'falafel', 'lettuce', 'dried fruit']);
/** Whether the words name more than one ("שקדים", "אגוזי מלך", "almonds"); then no number means a usual portion. */
function looksPlural(w) {
  const s = String(w || '').trim();
  if (!s) return false;
  const words = s.split(/\s+/);
  if (/^[a-z\s'-]+$/i.test(s)) { const l = words[words.length - 1]; return /s$/i.test(l) && !/(ss|us|is)$/i.test(l); }
  return words.some(x => /(ים|ות)$/.test(x)) || (words.length > 1 && /[^ו]י$/.test(words[0]));
}
/** A food written without a number means one ("פיצה" = a slice, "פרגית" = one thigh), unless the words are plural or the food is eaten by the portion. */
function meansOne(item, name) {
  if (PORTION_NAMES.has(name)) return false;
  return !looksPlural(item.said || item.name);
}

/** Grams of one diary amount. attached = written after "עם"; one = written without a number and meaning a single piece. */
function gramsOf(n, qty, unit, attached, cat, one) {
  if (unit === 'גרם') return qty == null ? 100 : qty;
  if (unit) {
    let g = n.u && n.u[unit];
    if (g == null) {
      g = UNIT_G[unit];
      if (unit === 'כוסות' && cat !== 'drink' && cat !== 'dairy') g = SOLID_CUP;
      if (g == null) g = n.piece || n.serving;
    }
    return (qty == null ? 1 : qty) * g;
  }
  if (qty == null) return attached ? (n.add || n.serving) : (one && n.piece ? n.piece : n.serving);
  return qty * (n.piece || n.serving);
}

function zero() { return { k: 0, p: 0, c: 0, f: 0, g: 0, guess: 0, unknown: 0 }; }
function addTo(t, n, grams, src) {
  const r = grams / 100;
  t.k += n.k * r; t.p += n.p * r; t.c += n.c * r; t.f += n.f * r; t.g += grams;
  if (src === 'cat' || src === 'guess') t.guess++;
}
/**
 * Calories and macros of one diary item, including what was written after "עם".
 * resolve(name) -> {name, cat} finds a known food for free text ("לימון סחוט" -> לימון).
 */
function itemNut(item, resolve, user) {
  const t = zero();
  const main = resolve(item.name);
  const n = main && nutFor(main.name, main.cat, user);
  if (n) addTo(t, n, gramsOf(n, item.qty, item.unit, false, main.cat, meansOne(item, main.name)), main.guess ? 'guess' : n.src);
  else t.unknown++;
  for (const w of item.with || []) {
    const r = resolve(w);
    const wn = r && nutFor(r.name, r.cat, user);
    if (wn) addTo(t, wn, gramsOf(wn, null, null, true, r.cat), r.guess ? 'guess' : wn.src);
  }
  return t;
}
function sumNut(list) {
  const t = zero();
  for (const x of list) { t.k += x.k; t.p += x.p; t.c += x.c; t.f += x.f; t.g += x.g; t.guess += x.guess; t.unknown += x.unknown; }
  return t;
}
/** Share of calories from each macro, rounded to whole percents that add up to 100. */
function macroPct(t) {
  const c = t.c * 4, p = t.p * 4, f = t.f * 9, all = c + p + f;
  if (all < 1) return null;
  const raw = [c / all * 100, p / all * 100, f / all * 100];
  const fl = raw.map(Math.floor);
  let left = 100 - fl.reduce((a, b) => a + b, 0);
  raw.map((v, i) => [v - fl[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { fl[i]++; left--; } });
  return { c: fl[0], p: fl[1], f: fl[2] };
}
/** How close a split is to the target: 'ok' within 10 points on every macro, 'near' within 20, else 'off'. */
function balance(pct, target) {
  if (!pct) return null;
  const d = { c: pct.c - target.c, p: pct.p - target.p, f: pct.f - target.f };
  const worst = Math.max(Math.abs(d.c), Math.abs(d.p), Math.abs(d.f));
  const level = worst <= 10 ? 'ok' : worst <= 20 ? 'near' : 'off';
  let low = null, high = null;
  for (const k of ['c', 'p', 'f']) {
    if (d[k] < -10 && (!low || d[k] < d[low])) low = k;
    if (d[k] > 10 && (!high || d[k] > d[high])) high = k;
  }
  return { level, low, high, d };
}

/*
 * Israel's Ministry of Health bases nutrient amounts on the DRI tables. For adults the acceptable share of calories is
 * carbs 45-65%, protein 10-35%, fat 20-35%, and at least 0.8 g protein per kg of body weight.
 * (The food rainbow itself recommends food groups and how often to eat them, not percentages.)
 */
const MOH = { c: [45, 65], p: [10, 35], f: [20, 35], proteinPerKg: 0.8 };
/** Like balance(), against ranges: 'ok' when every macro is inside its range, 'near' within 10 points, else 'off'. */
function balanceRange(pct, R) {
  if (!pct) return null;
  R = R || MOH;
  const d = {};
  let worst = 0, low = null, high = null;
  for (const k of ['c', 'p', 'f']) {
    const v = pct[k], lo = R[k][0], hi = R[k][1];
    d[k] = v < lo ? v - lo : v > hi ? v - hi : 0;
    worst = Math.max(worst, Math.abs(d[k]));
    if (d[k] < 0 && (!low || d[k] < d[low])) low = k;
    if (d[k] > 0 && (!high || d[k] > d[high])) high = k;
  }
  return { level: worst === 0 ? 'ok' : worst <= 10 ? 'near' : 'off', low, high, d };
}
/** Grams of each macro that fit the ranges for a number of calories (4 kcal per gram of carbs or protein, 9 of fat). */
function gramRange(kcal, R) {
  R = R || MOH;
  const per = { c: 4, p: 4, f: 9 };
  const o = {};
  for (const k of ['c', 'p', 'f']) o[k] = [kcal * R[k][0] / 100 / per[k], kcal * R[k][1] / 100 / per[k]];
  return o;
}

const NUT_API = { NUT, NUT_EN, CAT_NUT, UNIT_G, MOH, nutFor, editWeightKey, gramsOf, looksPlural, meansOne, itemNut, sumNut, macroPct, balance, balanceRange, gramRange };
if (typeof module !== 'undefined') module.exports = NUT_API;
if (typeof window !== 'undefined') window.Nutri = NUT_API;
})();
