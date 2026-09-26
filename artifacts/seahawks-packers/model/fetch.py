#!/usr/bin/env python3
"""Pull ESPN scoreboard JSON for the seasons the model needs into ../data. No key required."""
import json, os, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')
BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=%d&seasontype=%d&week=%d&limit=100'
PLAN = {2024: {2: 18, 3: 5}, 2025: {2: 18, 3: 5}, 2026: {1: 5, 2: 18, 3: 5}}
NAME = {1: 'pre', 2: 'reg', 3: 'post'}
def main():
    os.makedirs(DATA, exist_ok=True)
    seasons = [int(a) for a in sys.argv[1:]] or [2026]   # past seasons are static; refresh only the current one by default
    for season in seasons:
        for st, weeks in PLAN[season].items():
            for w in range(1, weeks + 1):
                url = BASE % (season, st, w)
                with urllib.request.urlopen(url, timeout=30) as r:
                    j = json.load(r)
                out = os.path.join(DATA, '%d-%s-%d.json' % (season, NAME[st], w))
                json.dump(j, open(out, 'w'))
                print(out, len(j.get('events', [])), 'events')
if __name__ == '__main__':
    main()
