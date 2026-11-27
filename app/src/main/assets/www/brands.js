/* =============================================================================
 * Companies, brands and chains whose sites the app searches for a product's values
 * (market.js). One line per company:
 *
 *   he | en | domains | other names | flags
 *
 * domains      the first one is the company's main site; the others are searched with it.
 * other names  more names and product names that point to the company when they are
 *              written in the food's name ("במבה" -> Osem), comma separated.
 * flags        the group letter (BRAND_GROUPS), and:
 *                e  the site is in English, so a Hebrew search is turned into English
 *                x  the names alone are common words: only the other names find the company
 *                *  shown first, before anything is typed
 * ========================================================================== */
'use strict';

const BRAND_GROUPS = {
  d: ['חלב, גבינות ותחליפים', 'Dairy & alternatives'],
  m: ['בשר, עוף ודגים', 'Meat, poultry & fish'],
  b: ['לחם ומאפים', 'Bread & bakery'],
  s: ['מתוקים וחטיפים', 'Sweets & snacks'],
  k: ['דגני בוקר וממרחים', 'Cereal & spreads'],
  p: ['מזווה, רטבים ושימורים', 'Pantry, sauces & cans'],
  f: ['קפואים, גלידות וצמחי', 'Frozen, ice cream & plant-based'],
  y: ['שתייה', 'Drinks'],
  c: ['קפה ותה', 'Coffee & tea'],
  h: ['חלבון, חטיפי חלבון ותוספים', 'Protein & supplements'],
  r: ['מסעדות ובתי קפה', 'Restaurants & cafés'],
  t: ['סופרמרקטים ומאגרים', 'Supermarkets & databases'],
};

const BRAND_LINES = `
תנובה|Tnuva|tnuva.co.il|יופלה,yoplait,טל העמק,גוש חלב,גבינת עמק,אדום אדום|d*
שטראוס|Strauss|strauss-group.co.il|דנונה,danone,דנונה פרו,אקטיביה,activia,מילקי,milky,מעדן דני,חומוס צבר,סלטי צבר|d*
טרה|Tara|tara.co.il||d*
יטבתה|Yotvata|yotvata.co.il||d
מחלבות גד|Gad Dairy|gad-dairy.co.il|גבינות גד,גבינת גד,gad dairy|d
מטרנה|Materna|materna.co.il||d
אלפרו|Alpro|alpro.com||de
אוטלי|Oatly|oatly.com||de
בלו דיימונד|Blue Diamond|bluediamond.com|almond breeze,אלמונד בריז|de
קליפיה|Califia Farms|califiafarms.com|califia|de
ויוליף|Violife|violifefoods.com||de
לורפק|Lurpak|lurpak.com||de
קריגולד|Kerrygold|kerrygold.com||de
ארלה|Arla|arla.com arlafoods.co.uk||de
קסטלו|Castello|castellocheese.com||de
לירדאמר|Leerdammer|leerdammer.com||de
בייביבל|Babybel|babybel.com|baby bel|de
הפרה הצוחקת|The Laughing Cow|thelaughingcow.com thelaughingcow.co.uk|פרה צוחקת,laughing cow,la vache qui rit|de
בורסן|Boursin|boursin.com||de
פילדלפיה|Philadelphia|philadelphia.co.uk|philadelphia cheese|de
גלבני|Galbani|galbanicheese.com galbani.com||de
מולר|Müller|muller.co.uk|muller,mueller|de
צ׳ובני|Chobani|chobani.com||de
סיגיז|Siggi's|siggis.com||de
פיירלייף|fairlife|fairlife.com||de
טילמוק|Tillamook|tillamook.com||de
סרג׳נטו|Sargento|sargento.com||de
דאייה|Daiya|daiyafoods.com||de
לקטאייד|Lactaid|lactaid.com||de
יאקולט|Yakult|yakult.co.uk yakult.com||de

זוגלובק|Zoglowek|zoglowek.co.il soglowek.co.il|soglowek|m
עוף טוב|Of Tov|oftov.co.il||m
יחיעם|Yehiam|yehiam.co.il||m
טירת צבי|Tirat Zvi|tiratzvi.co.il|tirat tsvi|m
נפטון|Neptune|neptunefoods.co.il|neptune foods|m
סטארקיסט|StarKist|starkist.com||me

אנג׳ל|Angel|angel.co.il|מאפיית אנג׳ל|b*
ברמן|Berman|berman.co.il|מאפיית ברמן|b
מישן|Mission|missionfoods.com missionwraps.co.uk|mission wraps,mission tortillas|be
פילסבורי|Pillsbury|pillsbury.com||be
פפרידג׳ פארם|Pepperidge Farm|pepperidgefarm.com|milano cookies|be
אנטנמנס|Entenmann's|entenmanns.com||be
הוסטס|Hostess|hostesscakes.com|twinkies,טווינקיז|be
ליטל דבי|Little Debbie|littledebbie.com||be
נייצ׳רס בייקרי|Nature's Bakery|naturesbakery.com||be

עלית|Elite|elite.co.il strauss-group.co.il|פסק זמן,מקופלת,כיף כף,טורטית,שוקולד פרה,קליק,קרמבו,ספלנדיד,תפוצ׳יפס,דוריטוס,doritos,צ׳יטוס,cheetos|s*
כרמית|Carmit|carmit.co.il|שוקולד אגו,פניני|s
בייגל בייגל|Beigel & Beigel|beigel.co.il unilever.co.il|בייגל ובייגל,beigel beigel,beigel & beigel|s
גדרון|Gidron|gidron.co.il||s
קינדר|Kinder|kinder.com|kinder bueno,קינדר בואנו,kinder joy|se
פררו|Ferrero|ferrerorocher.com ferrero.com|ferrero rocher,פררו רושה,רפאלו,raffaello|se
מילקה|Milka|milka.com milka.co.uk||se
טובלרון|Toblerone|toblerone.com||se
לינדט|Lindt|lindt.com lindt.co.uk lindtusa.com|lindor,לינדור|se
קדבורי|Cadbury|cadbury.co.uk|dairy milk|se
ריטר ספורט|Ritter Sport|ritter-sport.com||se
גודייבה|Godiva|godiva.com||se
גיליאן|Guylian|guylian.com||se
גירארדלי|Ghirardelli|ghirardelli.com||se
גרין אנד בלאקס|Green & Black's|greenandblacks.co.uk greenandblacks.com|green and blacks|se
טוניז|Tony's Chocolonely|tonyschocolonely.com|tonys chocolonely,טוניס|se
הרשיז|Hershey's|hersheys.com|hershey,reeses,ריסס|se
קיטקט|KitKat|kitkat.com hersheys.com|kit kat,קיט קט|se
אם אנד אמס|M&M's|mms.com|m&m,אמ אנד אמס,אם&אמס|se
סניקרס|Snickers|snickers.com||se
טוויקס|Twix|twix.com||se
מלטיזרס|Maltesers|maltesers.co.uk||se
סטארברסט|Starburst|starburst.com||se
סקיטלס|Skittles|skittles.com||se
טוויזלרס|Twizzlers|twizzlers.com||se
הריבו|Haribo|haribo.com||se
ג׳לי בלי|Jelly Belly|jellybelly.com||se
ג׳ל-או|Jell-O|jello.com|jello|se
מנטוס|Mentos|mentos.com||se
טיק טק|Tic Tac|tictac.com|tictac,טיקטק|se
ורת׳רס|Werther's Original|werthers-original.com|werthers|se
אוראו|Oreo|oreo.com||se
צ׳יפס אהוי|Chips Ahoy!|chipsahoy.com||se
לוטוס|Lotus Biscoff|lotusbiscoff.com|lotus,biscoff,ביסקוף|se
באלסן|Bahlsen|bahlsen.com|leibniz,לייבניץ|se
לואקר|Loacker|loacker.com||se
מקוויטיז|McVitie's|mcvities.co.uk|mcvities,hobnobs|se
ווקרס שורטברד|Walkers Shortbread|walkersshortbread.com||se
טים טאם|Tim Tam|arnotts.com||se
קיבלר|Keebler|keebler.com||se
פרינגלס|Pringles|pringles.com||se
לייז|Lay's|lays.com|lays|se
רפלס|Ruffles|ruffles.com||se
טוסטיטוס|Tostitos|tostitos.com||se
פריטוס|Fritos|fritos.com||se
סאן צ׳יפס|SunChips|sunchips.com|sun chips|se
ווקרס|Walkers Crisps|walkers.co.uk|walkers crisps|se
קטל צ׳יפס|Kettle Brand|kettlebrand.com|kettle chips|se
סקיני פופ|SkinnyPop|skinnypop.com|skinny pop|se
סמארטפוד|Smartfood|smartfood.com||se
סניידרס|Snyder's of Hanover|snydersofhanover.com|snyders|se
צ׳יז איט|Cheez-It|cheezit.com||se
טריסקיט|Triscuit|triscuit.com||se
ריץ|Ritz|ritzcrackers.com|ritz crackers|se
נייצ׳ר ואלי|Nature Valley|naturevalley.com naturevalley.co.uk|נייצ׳ר וואלי|se
קינד|KIND|kindsnacks.com kindsnacks.co.uk|קינד,kind bar,kind snacks|sex

נוטלה|Nutella|nutella.com||ke
תלמה|Telma|telma.co.il unilever.co.il|קורנפלקס תלמה|k
קלוגס|Kellogg's|kelloggs.co.uk kelloggs.com|kellogg,special k,ספיישל קיי,ספיישל k,קוקו פופס,coco pops,פרוסטיז,frosties,פרוט לופס,froot loops,rice krispies,קרייב,krave,crunchy nut,all bran,pop tarts,פופ טארטס|ke
קוואקר|Quaker|quakeroats.com quaker.co.uk|quaker oats,capn crunch|ke
ויטביקס|Weetabix|weetabix.co.uk||ke
נייצ׳רס פאת׳|Nature's Path|naturespath.com||ke
קאשי|Kashi|kashi.com||ke
פייבר וואן|Fiber One|fiberone.com||ke
פוסט|Post|postconsumerbrands.com|honey bunches of oats,fruity pebbles|kex
ג׳ורדנס|Jordans|jordanscereals.co.uk||ke
דורסט|Dorset Cereals|dorsetcereals.co.uk||ke
בון מאמן|Bonne Maman|bonnemaman.co.uk bonnemaman.us||ke
סמאקרס|Smucker's|smuckers.com||ke
ג׳סטינס|Justin's|justins.com||ke
פיפ אנד נאט|Pip & Nut|pipandnut.com|pip and nut|ke

אסם / נסטלה|Osem / Nestlé|osem-nestle.co.il|אסם,osem,נסטלה,nestle,nestlé,במבה,bamba,ביסלי,bissli,אפרופו,פתיבר,שקדי מרק,פתיתים,נסקפה,nescafe,nescafé,נסקוויק,nesquik,צ׳יריוס,cheerios,דגני פיטנס|p*
טעמן|Taaman|taaman.co.il||p
סוגת|Sugat|sugat.co.il||p
יכין|Yachin|yachin.co.il||p
יוניליוור|Unilever|unilever.co.il|קנור,knorr,הלמנס,hellmanns,מגנום,magnum,קורנטו,cornetto|p
ווילי פוד|Willi-Food|willi-food.co.il|וילי פוד,willi food,willifood|p
ברילה|Barilla|barilla.com||pe
דה צ׳קו|De Cecco|dececco.com||pe
מוטי|Mutti|mutti-parma.com||pe
היינץ|Heinz|heinz.co.uk heinz.com||pe
קיקומן|Kikkoman|kikkoman.com kikkoman.eu||pe
לי קום קי|Lee Kum Kee|lkk.com||pe
טבסקו|Tabasco|tabasco.com||pe
פרנקס|Frank's RedHot|franksredhot.com|franks red hot|pe
מאיי|Maille|maille.com||pe
פרנצ׳ס|French's|frenchs.com||pe
סוויט בייבי ריי׳ס|Sweet Baby Ray's|sweetbabyrays.com||pe
היידן ואלי|Hidden Valley|hiddenvalley.com|hidden valley ranch|pe
וולדן פארמס|Walden Farms|waldenfarms.com||pe
פריימל קיצ׳ן|Primal Kitchen|primalkitchen.com||pe
ראוס|Rao's|raos.com|raos homemade|pe
פרגו|Prego|prego.com||pe
ניומנס אוון|Newman's Own|newmansown.com||pe
קמפבלס|Campbell's|campbells.com||pe
אולד אל פאסו|Old El Paso|oldelpaso.co.uk oldelpaso.com||pe
פאטאקס|Patak's|pataks.co.uk||pe
מרמייט|Marmite|marmite.co.uk||pe
אנניז|Annie's|annies.com||pe
ניסין|Nissin|nissinfoods.com nissin.com|cup noodles,קאפ נודלס|pe
אינדומי|Indomie|indomie.com||pe
בנס אוריג׳ינל|Ben's Original|bensoriginal.com bensoriginal.co.uk|uncle bens,אנקל בנס|pe
טילדה|Tilda|tilda.com||pe
Goya|Goya|goya.com||pe
דל מונטה|Del Monte|delmonte.com||pe
גרין ג׳איינט|Green Giant|greengiant.com||pe
דול|Dole|dole.com||pe
בובס רד מיל|Bob's Red Mill|bobsredmill.com||pe
קינג ארתור|King Arthur|kingarthurbaking.com|king arthur flour|pe
ד״ר אטקר|Dr. Oetker|oetker.co.uk oetker.com|oetker,אטקר,דוקטור אטקר|pe
בטי קרוקר|Betty Crocker|bettycrocker.com||pe
מקורמיק|McCormick|mccormick.com||pe
בראג|Bragg|bragg.com|braggs|pe
נוטיווה|Nutiva|nutiva.com||pe
ספלנדה|Splenda|splenda.com||pe

סנפרוסט|Sunfrost|sunfrost.co.il tnuva.co.il||f
מעדנות|Maadanot|maadanot.co.il tnuva.co.il||f
טבעול|Tivall|tivall.co.il||f
דורות|Dorot Gardens|dorot.co.il|dorot|f
בן אנד ג׳ריס|Ben & Jerry's|benjerry.co.il benjerry.com benjerry.co.uk|ben and jerrys,בן & ג׳ריס,בן וג׳ריס|f
מקיין|McCain|mccain.co.uk mccain.com||fe
בירדס איי|Birds Eye|birdseye.co.uk birdseye.com||fe
אור-אידה|Ore-Ida|oreida.com||fe
איימיס|Amy's Kitchen|amys.com|amys|fe
לין קוויזין|Lean Cuisine|leancuisine.com||fe
האגן דאס|Häagen-Dazs|haagendazs.us haagen-dazs.co.uk|haagen dazs,האגן דאז|fe
ברייירס|Breyers|breyers.com||fe
הלו טופ|Halo Top|halotop.com||fe
ביונד מיט|Beyond Meat|beyondmeat.com||fe
אימפוסיבל|Impossible Foods|impossiblefoods.com|impossible burger|fe
מורנינגסטאר|MorningStar Farms|morningstarfarms.com|morningstar|fe
גרדין|Gardein|gardein.com||fe
קוורן|Quorn|quorn.co.uk quorn.com||fe

קוקה-קולה|Coca-Cola|cocacola.co.il coca-cola.com|coke,ספרייט,sprite,פאנטה,fanta,פיוז טי,fuze tea,קינלי,kinley|y
טמפו|Tempo|tempo.co.il|פפסי,pepsi,סבן אפ,7up,7 up,מירינדה,mirinda,גולדסטאר,goldstar,בירה מכבי|y
יפאורה תבורי|Jafora-Tabori|jafora.co.il|יפאורה,jafora,שוופס,schweppes,תפוזינה,מיץ ספרינג,ספרינג תה,מים עין גדי,מיץ קריסטל,rc cola,פרוט ווטר|y
פריגת|Prigat|prigat.co.il||y
פרימור|Primor|primor.co.il||y
מי עדן|Mey Eden|meyeden.co.il||y
נביעות|Neviot|neviot.co.il||y
סודהסטרים|SodaStream|sodastream.co.il|סודה סטרים,soda stream|y
רד בול|Red Bull|redbull.com|redbull,רדבול|ye
מונסטר|Monster Energy|monsterenergy.com|monster energy|ye
סלסיוס|Celsius|celsius.com|celsius energy,משקה סלסיוס|yex
פריים|Prime|drinkprime.com|prime hydration,prime energy,משקה פריים|yex
גטורייד|Gatorade|gatorade.com||ye
פאוורייד|Powerade|powerade.com||ye
לוקוזייד|Lucozade|lucozade.com||ye
סן פלגרינו|San Pellegrino|sanpellegrino.com|s pellegrino,פלגרינו|ye
פרייה|Perrier|perrier.com||ye
אוויאן|Evian|evian.com||ye
ויטה קוקו|Vita Coco|vitacoco.com||ye
אושן ספריי|Ocean Spray|oceanspray.com||ye
טרופיקנה|Tropicana|tropicana.com||ye
קפרי סאן|Capri-Sun|capri-sun.com||ye
אינוסנט|innocent|innocentdrinks.co.uk|אינוסנט,innocent drinks,innocent smoothie|yex
סנאפל|Snapple|snapple.com||ye
אריזונה|AriZona|drinkarizona.com|arizona tea,arizona iced tea|ye
ליפטון|Lipton|lipton.com||ye
ד״ר פפר|Dr Pepper|drpepper.com||ye
פיבר-טרי|Fever-Tree|fever-tree.com||ye
היינקן|Heineken|heineken.com||ye
גינס|Guinness|guinness.com||ye
קרלסברג|Carlsberg|carlsberg.com||ye

לנדוור|Landwer|landwer.co.il|קפה לנדוור|c
ויסוצקי|Wissotzky|wissotzky.co.il wissotzkytea.com||c
דולצ׳ה גוסטו|Dolce Gusto|dolce-gusto.co.il dolce-gusto.co.uk||c
נספרסו|Nespresso|nespresso.com||ce
לוואצה|Lavazza|lavazza.com||ce
illy|illy|illy.com|illy coffee|ce
טווינינגס|Twinings|twinings.co.uk||ce
טטלי|Tetley|tetley.co.uk||ce
יוגי טי|Yogi Tea|yogitea.com||ce
סוויס מיס|Swiss Miss|swissmiss.com||ce

מייפרוטאין|Myprotein|myprotein.co.il myprotein.com|my protein,מיי פרוטאין|he
הרבלייף|Herbalife|herbalife.co.il herbalife.com||h
אופטימום נוטרישן|Optimum Nutrition|optimumnutrition.com|gold standard,אופטימום|he
דיימטייז|Dymatize|dymatize.com|iso100|he
מאסלטק|MuscleTech|muscletech.com||he
סייטק|Scitec Nutrition|scitecnutrition.com|scitec|he
באלק|Bulk|bulk.com|באלק,bulk powders|hex
פרוטאין וורקס|The Protein Works|theproteinworks.com|protein works|he
גוסט|Ghost|ghostlifestyle.com|ghost protein,גוסט פרוטאין|hex
קווסט|Quest|questnutrition.com|quest bar,quest protein|he
ברבלס|Barebells|barebells.com|בר בלס|he
גרנייד|Grenade|grenade.com|carb killa|he
קליף|Clif Bar|clifbar.com|clif|he
RXBAR|RXBAR|rxbar.com|rx bar|he
לארבר|Larabar|larabar.com||he
לני ולארי|Lenny & Larry's|lennylarry.com|lenny and larrys|he
פרמייר פרוטאין|Premier Protein|premierprotein.com||he
פיור פרוטאין|Pure Protein|pureprotein.com||he
מאסל מילק|Muscle Milk|musclemilk.com||he
אנשור|Ensure|ensure.com||he
סלים פאסט|SlimFast|slimfast.com|slim fast|he
אטקינס|Atkins|atkins.com||he
Huel|Huel|huel.com||he
אורגיין|Orgain|orgain.com||he
וגה|Vega|myvega.com|vega protein,וגה פרוטאין|hex
גארדן אוף לייף|Garden of Life|gardenoflife.com||he
נאו פודס|NOW Foods|nowfoods.com||he
סיינס אין ספורט|Science in Sport|scienceinsport.com|sis gel|he

מקדונלד׳ס|McDonald's|mcdonalds.co.il|מקדונלדס,ביג מק,big mac,מקנאגטס,mcnuggets,מקפלורי,mcflurry|r
ברגר קינג|Burger King|burgerking.co.il|בורגר קינג,וופר,whopper|r
דומינו׳ס|Domino's|dominos.co.il|דומינוס|r
פיצה האט|Pizza Hut|pizzahut.co.il||r
ארומה|Aroma|aroma.co.il|קפה ארומה,אייס ארומה|r
קופיקס|Cofix|cofix.co.il||r
מקס ברנר|Max Brenner|maxbrenner.co.il maxbrenner.com||r
בורגראנץ׳|Burgeranch|burgeranch.co.il|בורגר ראנץ׳,burger ranch|r
סטארבקס|Starbucks|starbucks.com starbucks.co.uk||re
סאבוויי|Subway|subway.com||re
KFC|KFC|kfc.co.uk kfc.com|kentucky fried chicken,קנטאקי|re
פופאייס|Popeyes|popeyes.com popeyes.co.uk||re
וונדיס|Wendy's|wendys.com||re
טאקו בל|Taco Bell|tacobell.com||re
צ׳יפוטלה|Chipotle|chipotle.com|chipotle mexican grill,מסעדת צ׳יפוטלה|rex
פייב גייז|Five Guys|fiveguys.com fiveguys.co.uk||re
שייק שאק|Shake Shack|shakeshack.com||re
אין אנד אאוט|In-N-Out|in-n-out.com||re
צ׳יק-פיל-איי|Chick-fil-A|chick-fil-a.com||re
פנדה אקספרס|Panda Express|pandaexpress.com||re
פנרה|Panera Bread|panerabread.com|panera|re
סוויטגרין|sweetgreen|sweetgreen.com||re
פאפא ג׳ונס|Papa John's|papajohns.com papajohns.co.uk||re
ליטל סיזרס|Little Caesars|littlecaesars.com||re
פיצה אקספרס|PizzaExpress|pizzaexpress.com|pizza express|re
דאנקין׳|Dunkin'|dunkindonuts.com|dunkin donuts,דאנקין דונאטס|re
קריספי קרים|Krispy Kreme|krispykreme.com krispykreme.co.uk||re
טים הורטונס|Tim Hortons|timhortons.com timhortons.ca||re
קוסטה קופי|Costa Coffee|costa.co.uk||re
פרט א מנז׳ה|Pret A Manger|pret.co.uk pret.com|pret|re
גרגס|Greggs|greggs.co.uk||re
וואגאמאמה|wagamama|wagamama.com||re
itsu|itsu|itsu.com||re
נאנדוס|Nando's|nandos.co.uk nandos.com||re
דיירי קווין|Dairy Queen|dairyqueen.com||re
באסקין רובינס|Baskin-Robbins|baskinrobbins.com||re
סינבון|Cinnabon|cinnabon.com||re
אנטי אנס|Auntie Anne's|auntieannes.com||re

שופרסל|Shufersal|shufersal.co.il||t*
רמי לוי|Rami Levy|rami-levy.co.il||t
יוחננוף|Yochananof|yochananof.co.il||t
ויקטורי|Victory|victoryonline.co.il|ויקטורי|tx
קרפור|Carrefour|carrefour.co.il ybitan.co.il|יינות ביתן,yeinot bitan|t
טיב טעם|Tiv Taam|tivtaam.co.il||t
אושר עד|Osher Ad|osherad.co.il||t
סופר-פארם|Super-Pharm|super-pharm.co.il|superpharm|t
Open Food Facts (מאגר פתוח)|Open Food Facts|openfoodfacts.org|open food facts,אופן פוד פקטס|t
iHerb|iHerb|iherb.com|איהרב,אייהרב|te
טסקו|Tesco|tesco.com||te
סיינסבריז|Sainsbury's|sainsburys.co.uk||te
אסדה|Asda|asda.com||te
מוריסונס|Morrisons|morrisons.com||te
ווייטרוז|Waitrose|waitrose.com||te
אוקדו|Ocado|ocado.com||te
מרקס אנד ספנסר|Marks & Spencer|marksandspencer.com|m&s,marks and spencer|te
אלדי|Aldi|aldi.co.uk aldi.us||te
לידל|Lidl|lidl.co.uk||te
הולנד אנד בארט|Holland & Barrett|hollandandbarrett.com|holland and barrett|te
טריידר ג׳וז|Trader Joe's|traderjoes.com||te
הול פודס|Whole Foods|wholefoodsmarket.com||te
וולמארט|Walmart|walmart.com||te
קוסטקו|Costco|costco.com|kirkland,קירקלנד|te
קרוגר|Kroger|kroger.com||te
`;

/** The list, ready to use: { site, he, en, d: [domains], al: [other names], g, e, x, top }. */
const BRANDS = BRAND_LINES.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
  const [he, en, dom, al, fl] = l.split('|');
  const d = dom.split(/\s+/).filter(Boolean);
  return {
    site: d[0], he, en, d, al: (al || '').split(',').map(s => s.trim()).filter(Boolean),
    g: (fl || '').replace(/[^a-z]/g, '').replace(/[ex]/g, '').charAt(0) || 'p',
    e: /e/.test(fl || ''), x: /x/.test(fl || ''), top: /\*/.test(fl || ''),
  };
});
