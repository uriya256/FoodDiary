// Built-in food dictionary: "canonical name|category|alias, alias, ..."
// Categories are used for the weekly summary. Users can change any food's category in the app.
'use strict';

const CATEGORIES = {
  veg:     { label: 'ירקות', en: 'Vegetables',            color: '#2F7D4F' },
  fruit:   { label: 'פירות', en: 'Fruit',            color: '#C0581F' },
  whole:   { label: 'דגנים מלאים', en: 'Whole grains',      color: '#8A6A1F' },
  grain:   { label: 'לחם ומאפים', en: 'Bread & baked goods',       color: '#A07A3C' },
  protein: { label: 'חלבונים', en: 'Protein',          color: '#B0413E' },
  legume:  { label: 'קטניות', en: 'Legumes',           color: '#7A5C2E' },
  dairy:   { label: 'מוצרי חלב', en: 'Dairy',        color: '#3E6FA8' },
  nuts:    { label: 'אגוזים וזרעים', en: 'Nuts & seeds',    color: '#7D5A3C' },
  sauce:   { label: 'רטבים ותבלינים', en: 'Sauces & spices',   color: '#6B7A3A' },
  drink:   { label: 'שתייה', en: 'Drinks',            color: '#2C7F9A' },
  sweet:   { label: 'מתוקים וחטיפים', en: 'Sweets & snacks',   color: '#B2497E' },
  dish:    { label: 'מנות ומזון מהיר', en: 'Dishes & fast food',  color: '#8A4FB0' },
  other:   { label: 'אחר', en: 'Other',              color: '#6B746F' },
};

const FOOD_LINES = `
סלט ירקות|veg|סלט,סלט ישראלי,סלט קצוץ,סלט ירקות קצוץ,ירקות,ירקות טריים
מלפפון|veg|מלפפונים
עגבנייה|veg|עגבניה,עגבניות,עגבניות שרי,שרי
גזר|veg|גזרים
חסה|veg|עלי חסה
פלפל|veg|פלפלים,גמבה,פלפל אדום
בצל|veg|בצלים,בצל ירוק
שום|veg|שן שום,שיני שום
לימון|veg|לימונים,מיץ לימון
כרוב|veg|כרוב לבן,כרוב סגול
ברוקולי|veg|
כרובית|veg|
קישוא|veg|קישואים
חציל|veg|חצילים
תפוח אדמה|veg|תפוחי אדמה,תפו״א,תפוא
בטטה|veg|בטטות
פטריות|veg|פטרייה,פטריה
תירס|veg|
סלק|veg|
אבוקדו|veg|
תרד|veg|
ירקות מוקפצים|veg|ירקות מבושלים,ירקות בתנור
מרק ירקות|veg|מרק
תפוח|fruit|תפוחים,תפוח עץ
בננה|fruit|בננות
תפוז|fruit|תפוזים,קלמנטינה,קלמנטינות,מנדרינה
תמר|fruit|תמרים
ענבים|fruit|ענב
אגס|fruit|אגסים
אפרסק|fruit|אפרסקים,נקטרינה
אבטיח|fruit|
מלון|fruit|
מנגו|fruit|
תותים|fruit|תות,תות שדה
אוכמניות|fruit|
קיווי|fruit|
רימון|fruit|רימונים
פירות יבשים|fruit|צימוקים,משמש מיובש,שזיפים מיובשים
קינואה|whole|קינאה,קינוא
אורז מלא|whole|
כוסמת|whole|
שיבולת שועל|whole|קוואקר,דייסת שיבולת שועל,פתיתי שיבולת שועל
לחם מלא|whole|לחם קמח מלא,קמח מלא,לחם דגנים,לחם מחיטה מלאה,לחם שיפון,לחם כוסמין,כוסמין
פיתה מלאה|whole|
פסטה מלאה|whole|
בורגול|whole|
לחם|grain|לחם לבן,לחם אחיד
לחם קל|grain|לחם לייט,לחם דיאט
חלה|grain|חלות
פיתה|grain|פיתות
לחמנייה|grain|לחמניה,לחמניות
באגט|grain|באגטים
טורטייה|grain|טורטיה,לאפה,טורטיות
קרקר|grain|קרקרים,פריכיות,פריכית
אורז|grain|אורז לבן
פסטה|grain|ספגטי,מקרוני,פתיתים
קוסקוס|grain|
טוסט|grain|טוסטים
בורקס|grain|בורקסים
קרואסון|grain|קרואסונים
עוגייה|sweet|עוגיות,עוגיה
ביצה|protein|ביצים
ביצה קשה|protein|ביצים קשות,ביצה מבושלת,ביצים מבושלות
ביצה רכה|protein|ביצים רכות
ביצה מקושקשת|protein|ביצים מקושקשות,מקושקשת
חביתה|protein|חביתות
ביצת עין|protein|ביצה עין,ביצי עין
שקשוקה|protein|
עוף|protein|שוקיים,כרעיים,כנפיים,עוף בתנור
חזה עוף|protein|חזה,חזות עוף
פרגית|protein|פרגיות
שניצל|protein|שניצלים
הודו|protein|חזה הודו,פסטרמה
בשר|protein|בקר,בשר בקר,סטייק,בשר טחון
קציצות|protein|קציצה,קבב
דג|protein|דגים,אמנון,פילה דג,לברק,דניס,בורי
טונה|protein|קופסת טונה
טונה במים|protein|
טונה בשמן|protein|
סלמון|protein|
נקניקיות|protein|נקניקייה,נקניק
טופו|protein|
חומוס|legume|
עדשים|legume|עדשים כתומות,מרק עדשים
שעועית|legume|שעועית לבנה,שעועית ירוקה
אפונה|legume|
גרגירי חומוס|legume|
פלאפל|legume|כדורי פלאפל
אדממה|legume|
יוגורט|dairy|יוגורטים,יוגורט יווני,מעדן חלבון
גבינה לבנה|dairy|לבנה,קוטג׳,קוטג',קוטג
גבינה צהובה|dairy|גבינה
גבינה בולגרית|dairy|בולגרית,פטה,צפתית
חלב|dairy|
שמנת|dairy|
אגוזי מלך|nuts|אגוז מלך,אגוזים
שקדים|nuts|שקד
קשיו|nuts|
פיסטוקים|nuts|פיסטוק
בוטנים|nuts|בוטן,חמאת בוטנים
גרעיני דלעת|nuts|גרעין דלעת
גרעיני חמנייה|nuts|גרעיני חמניה,גרעיני חמניות,גרעינים
זרעי צ׳יה|nuts|צ׳יה,צ'יה,זרעי צ'יה
זרעי פשתן|nuts|פשתן
שומשום|nuts|
טחינה|sauce|טחינה מלאה,טחינה גולמית,טחינה גולמית מלאה
שמן זית|sauce|שמן
מלח|sauce|
פלפל שחור|sauce|
כמון|sauce|
פפריקה|sauce|
קטשופ|sauce|
מיונז|sauce|
חרדל|sauce|
רוטב|sauce|רוטב עגבניות
סילאן|sauce|דבש תמרים
דבש|sauce|
ריבה|sweet|
מים|drink|כוס מים,מים מינרליים,סודה
תה|drink|תה ירוק,תה צמחים
קפה|drink|אספרסו,נס קפה,קפה שחור
הפוך|drink|קפוצ׳ינו,קפוצינו,לאטה
מיץ|drink|מיץ תפוזים,מיץ טבעי
משקה|drink|שתייה מתוקה,קולה,קוקה קולה
סוכר|sweet|
שוקולד|sweet|
עוגה|sweet|עוגות
גלידה|sweet|גלידות
במבה|sweet|
ביסלי|sweet|
חטיף|sweet|חטיפים,חטיף אנרגיה,חטיף חלבון
וופל|sweet|ופל,וופלים,ופלים
פיצה|dish|פיצות
המבורגר|dish|המבורגרים
שווארמה|dish|
סושי|dish|
מלוואח|dish|
ג׳חנון|dish|ג'חנון,ג׳חנונים,ג'חנונים
כריך|dish|סנדוויץ׳,סנדוויץ',כריכים
מרק עוף|dish|
salad|veg|green salad,vegetable salad,veggie salad,side salad
cucumber|veg|cucumbers
tomato|veg|tomatoes,cherry tomatoes
carrot|veg|carrots
lettuce|veg|
bell pepper|veg|peppers,pepper,red pepper
onion|veg|onions
garlic|veg|
lemon|veg|lemons,lemon juice
broccoli|veg|
cauliflower|veg|
zucchini|veg|courgette
eggplant|veg|aubergine
potato|veg|potatoes,mashed potatoes,baked potato
sweet potato|veg|sweet potatoes
mushrooms|veg|mushroom
corn|veg|
spinach|veg|
avocado|veg|avocados
vegetables|veg|veggies,roasted vegetables,steamed vegetables
vegetable soup|veg|soup
apple|fruit|apples
banana|fruit|bananas
orange|fruit|oranges,clementine,clementines,tangerine
date|fruit|dates
grapes|fruit|grape
pear|fruit|pears
peach|fruit|peaches,nectarine
watermelon|fruit|
melon|fruit|
mango|fruit|
strawberries|fruit|strawberry
blueberries|fruit|blueberry
kiwi|fruit|
dried fruit|fruit|raisins
quinoa|whole|
brown rice|whole|
oatmeal|whole|oats,porridge,rolled oats
whole wheat bread|whole|whole grain bread,wholemeal bread,whole wheat,multigrain bread,rye bread
whole wheat pita|whole|
whole wheat pasta|whole|
bread|grain|white bread
light bread|grain|diet bread
challah|grain|
pita|grain|pitas,pita bread
roll|grain|rolls,bun,buns
baguette|grain|
tortilla|grain|tortillas,wrap,wraps
crackers|grain|cracker,rice cakes,rice cake
rice|grain|white rice
pasta|grain|spaghetti,macaroni,noodles
couscous|grain|
toast|grain|toasts
croissant|grain|croissants
bagel|grain|bagels
cereal|grain|cornflakes,granola
egg|protein|eggs
hard-boiled egg|protein|hard boiled egg,boiled egg,boiled eggs,hard boiled eggs,hard-boiled eggs
soft-boiled egg|protein|soft boiled egg,soft-boiled eggs
scrambled eggs|protein|scrambled egg
omelette|protein|omelet
fried egg|protein|fried eggs,sunny side up
shakshuka|protein|
chicken|protein|chicken drumsticks,drumsticks,grilled chicken
chicken breast|protein|chicken breasts
chicken thigh|protein|chicken thighs
schnitzel|protein|
turkey|protein|turkey breast,pastrami
beef|protein|steak,ground beef,meat
meatballs|protein|meatball,kebab
fish|protein|cod,tilapia,sea bass
tuna|protein|tuna salad
tuna in water|protein|
tuna in oil|protein|
salmon|protein|
hot dogs|protein|hot dog,sausage,sausages
tofu|protein|
hummus|legume|houmous
lentils|legume|lentil soup
beans|legume|green beans,black beans,kidney beans
peas|legume|
chickpeas|legume|garbanzo
falafel|legume|
edamame|legume|
yogurt|dairy|greek yogurt,yoghurt
cottage cheese|dairy|cream cheese,white cheese,labneh
cheese|dairy|yellow cheese,cheddar,mozzarella
feta|dairy|feta cheese
milk|dairy|
walnuts|nuts|walnut
almonds|nuts|almond
cashews|nuts|cashew
pistachios|nuts|pistachio
peanuts|nuts|peanut,peanut butter
pumpkin seeds|nuts|
sunflower seeds|nuts|seeds
chia seeds|nuts|chia
flax seeds|nuts|flaxseed
sesame|nuts|sesame seeds
tahini|sauce|tahini sauce
olive oil|sauce|oil
salt|sauce|
black pepper|sauce|
ketchup|sauce|
mayo|sauce|mayonnaise
mustard|sauce|
sauce|sauce|tomato sauce
date syrup|sauce|silan
honey|sauce|
jam|sweet|
water|drink|glass of water,sparkling water,soda water
tea|drink|green tea,herbal tea
coffee|drink|espresso,black coffee
cappuccino|drink|latte,flat white
juice|drink|orange juice
soft drink|drink|cola,coke,soda
sugar|sweet|
chocolate|sweet|
cake|sweet|
ice cream|sweet|
cookie|sweet|cookies,biscuit,biscuits
snack bar|sweet|protein bar,granola bar,energy bar,bar
chips|sweet|crisps
waffle|sweet|waffles
pizza|dish|
burger|dish|hamburger
shawarma|dish|
sushi|dish|
sandwich|dish|sandwiches
chicken soup|dish|
`;

// Which categories can be "inside" another dish after the word "עם" (e.g. סלט ירקות עם גזר).
const ATTACH_CATS = new Set(['veg', 'sauce']);

// Specific foods that also join a dish after "עם" (קפה עם חלב, תה עם סוכר).
const ATTACH_NAMES = new Set(['חלב', 'שמנת', 'סוכר', 'דבש', 'סילאן', 'שמן זית', 'לימון', 'שומשום', 'milk', 'sugar', 'honey', 'olive oil', 'lemon', 'sesame', 'date syrup']);

// Plural forms used when showing "3 תמרים" instead of "3 תמר".
const PLURALS = {
  'ביצה': 'ביצים', 'תמר': 'תמרים', 'תפוח': 'תפוחים', 'בננה': 'בננות', 'עגבנייה': 'עגבניות',
  'מלפפון': 'מלפפונים', 'לחמנייה': 'לחמניות', 'פיתה': 'פיתות', 'עוגייה': 'עוגיות', 'תפוז': 'תפוזים',
  'אגס': 'אגסים', 'שניצל': 'שניצלים', 'טורטייה': 'טורטיות', 'קרקר': 'קרקרים', 'חביתה': 'חביתות',
  'אפרסק': 'אפרסקים', 'רימון': 'רימונים', 'גזר': 'גזרים', 'פלפל': 'פלפלים', 'קישוא': 'קישואים',
  'חציל': 'חצילים', 'בטטה': 'בטטות', 'חלה': 'חלות', 'טוסט': 'טוסטים', 'בורקס': 'בורקסים',
  'קרואסון': 'קרואסונים', 'כריך': 'כריכים', 'המבורגר': 'המבורגרים', 'חטיף': 'חטיפים', 'וופל': 'וופלים',
  'פיתה מלאה': 'פיתות מלאות', 'תפוח אדמה': 'תפוחי אדמה', 'לימון': 'לימונים', 'אבוקדו': 'אבוקדו',
  'ביצה קשה': 'ביצים קשות', 'ביצה רכה': 'ביצים רכות', 'ביצה מקושקשת': 'ביצים מקושקשות', 'ביצת עין': 'ביצי עין', 'חזה עוף': 'חזות עוף', 'פרגית': 'פרגיות',
};
// Construct forms of units before a noun: "2 משולשי עוף".
const CONSTRUCT = { 'משולשים': 'משולשי', 'ספלים': 'ספלי', 'בקבוקים': 'בקבוקי', 'חופנים': 'חופני' };

// Dishes whose quantity is counted in another food: "חביתה שתי ביצים" = חביתה (2 ביצים).
const COMPOSITE = {
  'חביתה': ['ביצים', 'ביצה'],
  'ביצת עין': ['ביצים', 'ביצה'],
  'שקשוקה': ['ביצים', 'ביצה'],
  'omelette': ['ביצים', 'ביצה', 'eggs', 'egg'],
  'shakshuka': ['ביצים', 'ביצה', 'eggs', 'egg'],
};

const NUM_WORDS = {
  'אחד': 1, 'אחת': 1, 'שתיים': 2, 'שתים': 2, 'שניים': 2, 'שנים': 2, 'שתי': 2, 'שני': 2,
  'שלוש': 3, 'שלושה': 3, 'שלושת': 3, 'ארבע': 4, 'ארבעה': 4, 'ארבעת': 4,
  'חמש': 5, 'חמישה': 5, 'חמשת': 5, 'שש': 6, 'שישה': 6, 'ששת': 6,
  'שבע': 7, 'שבעה': 7, 'שבעת': 7, 'שמונה': 8, 'שמונת': 8, 'תשע': 9, 'תשעה': 9, 'תשעת': 9,
  'עשר': 10, 'עשרה': 10, 'עשרת': 10, 'חצי': 0.5, 'רבע': 0.25,
};

// unit word -> [plural, singular]
const UNITS_RAW = {
  'פרוסות': ['פרוסות', 'פרוסה'], 'פרוסה': ['פרוסות', 'פרוסה'], 'פרוסת': ['פרוסות', 'פרוסה'],
  'כפות': ['כפות', 'כף'], 'כף': ['כפות', 'כף'],
  'כפיות': ['כפיות', 'כפית'], 'כפית': ['כפיות', 'כפית'],
  'חתיכות': ['חתיכות', 'חתיכה'], 'חתיכה': ['חתיכות', 'חתיכה'], 'חתיכת': ['חתיכות', 'חתיכה'],
  'משולשים': ['משולשים', 'משולש'], 'משולשי': ['משולשים', 'משולש'], 'משולש': ['משולשים', 'משולש'],
  'כוסות': ['כוסות', 'כוס'], 'כוס': ['כוסות', 'כוס'],
  'ספלים': ['ספלים', 'ספל'], 'ספל': ['ספלים', 'ספל'],
  'קערות': ['קערות', 'קערה'], 'קערה': ['קערות', 'קערה'], 'קערת': ['קערות', 'קערה'],
  'צלחות': ['צלחות', 'צלחת'], 'צלחת': ['צלחות', 'צלחת'],
  'מנות': ['מנות', 'מנה'], 'מנה': ['מנות', 'מנה'], 'מנת': ['מנות', 'מנה'],
  'יחידות': ['יחידות', 'יחידה'], 'יחידה': ['יחידות', 'יחידה'], 'יחידת': ['יחידות', 'יחידה'],
  'חופנים': ['חופנים', 'חופן'], 'חופן': ['חופנים', 'חופן'],
  'קופסאות': ['קופסאות', 'קופסה'], 'קופסה': ['קופסאות', 'קופסה'], 'קופסת': ['קופסאות', 'קופסה'],
  'בקבוקים': ['בקבוקים', 'בקבוק'], 'בקבוק': ['בקבוקים', 'בקבוק'],
  'פחיות': ['פחיות', 'פחית'], 'פחית': ['פחיות', 'פחית'],
  'גרם': ['גרם', 'גרם'], 'גר': ['גרם', 'גרם'], 'ג׳': ['גרם', 'גרם'],
  'ביצים': ['ביצים', 'ביצה'],
  // English unit words (stored with the same Hebrew unit keys)
  'slice': ['פרוסות', 'פרוסה'], 'slices': ['פרוסות', 'פרוסה'],
  'piece': ['חתיכות', 'חתיכה'], 'pieces': ['חתיכות', 'חתיכה'],
  'tbsp': ['כפות', 'כף'], 'tablespoon': ['כפות', 'כף'], 'tablespoons': ['כפות', 'כף'], 'spoon': ['כפות', 'כף'], 'spoons': ['כפות', 'כף'], 'spoonful': ['כפות', 'כף'],
  'tsp': ['כפיות', 'כפית'], 'teaspoon': ['כפיות', 'כפית'], 'teaspoons': ['כפיות', 'כפית'],
  'triangle': ['משולשים', 'משולש'], 'triangles': ['משולשים', 'משולש'],
  'cup': ['כוסות', 'כוס'], 'cups': ['כוסות', 'כוס'], 'glass': ['כוסות', 'כוס'], 'glasses': ['כוסות', 'כוס'],
  'mug': ['ספלים', 'ספל'], 'mugs': ['ספלים', 'ספל'],
  'bowl': ['קערות', 'קערה'], 'bowls': ['קערות', 'קערה'],
  'plate': ['צלחות', 'צלחת'], 'plates': ['צלחות', 'צלחת'],
  'serving': ['מנות', 'מנה'], 'servings': ['מנות', 'מנה'], 'portion': ['מנות', 'מנה'], 'portions': ['מנות', 'מנה'],
  'handful': ['חופנים', 'חופן'], 'handfuls': ['חופנים', 'חופן'],
  'can': ['קופסאות', 'קופסה'], 'cans': ['קופסאות', 'קופסה'],
  'bottle': ['בקבוקים', 'בקבוק'], 'bottles': ['בקבוקים', 'בקבוק'],
  'g': ['גרם', 'גרם'], 'gr': ['גרם', 'גרם'], 'gram': ['גרם', 'גרם'], 'grams': ['גרם', 'גרם'],
};
const UNIT_LIST = ['פרוסות', 'כפות', 'כפיות', 'חתיכות', 'משולשים', 'כוסות', 'ספלים', 'קערות', 'צלחות', 'מנות', 'יחידות', 'חופנים', 'קופסאות', 'בקבוקים', 'פחיות', 'גרם', 'ביצים'];
// Units written after the food name: "חביתה 2 ביצים"
const AFTER_UNITS = new Set(['ביצים']);
for (const k in UNITS_RAW) if (/^[a-z]/.test(k)) UNITS_RAW[k].en = true;

const FILLER = new Set(['שתיית', 'שתייה', 'שתיה', 'אכלתי', 'שתיתי', 'של', 'את', 'גם', 'וגם', 'קצת', 'בערך', 'כ']);

function buildDictionary() {
  const dict = {};      // canonical -> {cat}
  const aliases = {};   // normalized phrase -> canonical
  for (const line of FOOD_LINES.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const [name, cat, al] = t.split('|');
    dict[name] = { cat };
    aliases[normKey(name)] = name;
    (al || '').split(',').map(s => s.trim()).filter(Boolean).forEach(a => {
      if (!aliases[normKey(a)]) aliases[normKey(a)] = name;
    });
  }
  return { dict, aliases };
}

// Normalize a phrase for matching: no niqqud/zero-width, final letters unified, single spaces.
function normKey(s) {
  return String(s)
    .replace(/[֑-ׇ]/g, '')
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, '')
    .replace(/[׳'`]/g, '׳').replace(/[״"]/g, '״')
    .replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const FOODS_API = { ATTACH_NAMES, PLURALS, CONSTRUCT, CATEGORIES, FOOD_LINES, ATTACH_CATS, COMPOSITE, NUM_WORDS, UNITS_RAW, UNIT_LIST, AFTER_UNITS, FILLER, buildDictionary, normKey };
if (typeof module !== 'undefined') module.exports = FOODS_API;
else window.Foods = FOODS_API;
