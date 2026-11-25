#!/usr/bin/env python3
"""
Downloads the food products sold in Israel from Open Food Facts (openfoodfacts.org, ODbL) and writes them,
with their nutrition values per 100 g, to a small JavaScript file the app loads when you pick a product.
The build runs it; the app works without the file (the product search then says it has no list).

Usage: python3 tools/fetch_products.py app/src/main/assets/www/products.js
"""
import collections
import datetime
import json
import re
import sys
import time
import urllib.error
import urllib.request

API = 'https://world.openfoodfacts.org/api/v2/search'
UA = 'FoodDiary/1.20 (https://github.com/uriya256/FoodDiary)'
FIELDS = 'code,product_name,product_name_he,product_name_en,generic_name_he,brands,quantity,serving_quantity,product_quantity,nutriments'
PAGE = 250
PAUSE = 6.5  # Open Food Facts allows 10 searches a minute


def get(url, tries=6):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as e:
            wait = 20 * (i + 1)
            print(f'  retry in {wait}s: {e}', flush=True)
            time.sleep(wait)
    raise SystemExit('Open Food Facts did not answer')


def num(v):
    try:
        x = float(v)
        return x if x == x and x >= 0 else None
    except (TypeError, ValueError):
        return None


def clean(s):
    return re.sub(r'\s+', ' ', str(s or '')).strip()


def row(p):
    n = p.get('nutriments') or {}
    k = num(n.get('energy-kcal_100g'))
    if k is None:
        kj = num(n.get('energy-kj_100g')) or num(n.get('energy_100g'))
        if kj is not None:
            k = kj / 4.184
    pr, c, f = num(n.get('proteins_100g')), num(n.get('carbohydrates_100g')), num(n.get('fat_100g'))
    if k is None or pr is None or c is None or f is None:
        return None, 'no values'
    if k > 920 or pr > 100 or c > 100 or f > 100 or pr + c + f > 105:
        return None, 'odd values'
    # calories that don't fit the macros at all are a typo (kJ written as kcal and the like)
    est = 4 * pr + 4 * c + 9 * f
    if est > 30 and not (0.55 * est <= k <= 1.6 * est + 25):
        return None, 'odd values'
    name = clean(p.get('product_name_he') or p.get('product_name') or p.get('generic_name_he') or p.get('product_name_en'))
    if len(name) < 2:
        return None, 'no name'
    brand = clean((p.get('brands') or '').split(',')[0])
    qty = clean(p.get('quantity'))[:24]
    # grams of one unit: the serving on the label, else a small package (a yogurt cup, a snack bar)
    g = num(p.get('serving_quantity'))
    if not g or g > 600:
        pq = num(p.get('product_quantity'))
        g = pq if pq and pq <= 300 else 0
    r1 = lambda x: round(x, 1)
    return [str(p.get('code') or ''), name[:80], brand[:40], qty, round(g or 0), round(k), r1(pr), r1(c), r1(f)], None


def main(out):
    rows, seen, why = [], set(), collections.Counter()
    page, count, got = 1, 0, 0
    while True:
        url = f'{API}?countries_tags_en=israel&fields={FIELDS}&page_size={PAGE}&page={page}&sort_by=unique_scans_n'
        d = get(url)
        count = d.get('count') or count
        prods = d.get('products') or []
        got += len(prods)
        print(f'page {page}: {got} of {count}', flush=True)
        for p in prods:
            code = str(p.get('code') or '')
            if not code or code in seen:
                continue
            seen.add(code)
            r, bad = row(p)
            if r:
                rows.append(r)
            else:
                why[bad] += 1
        if not prods or got >= count:
            break
        page += 1
        time.sleep(PAUSE)
    heb = sum(1 for r in rows if re.search('[֐-׿]', r[1]))
    brands = collections.Counter(r[2] for r in rows if r[2])
    print(f'products sold in Israel: {count}; with full values: {len(rows)} ({heb} with a Hebrew name); left out: {dict(why)}')
    print('top brands:', ', '.join(f'{b} {n}' for b, n in brands.most_common(25)))
    data = {'v': datetime.date.today().isoformat(), 'cols': ['code', 'name', 'brand', 'qty', 'g', 'k', 'p', 'c', 'f'], 'rows': rows}
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write('// Food products sold in Israel and their values per 100 g, from Open Food Facts (openfoodfacts.org), '
                 'available under the Open Database License (ODbL). Made by tools/fetch_products.py.\n')
        fh.write('window.PRODUCTS = ')
        json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
        fh.write(';\n')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'products.js')
