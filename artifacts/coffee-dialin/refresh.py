#!/usr/bin/env python3
"""Hourly publish for the Coffee Dial-In artifact (Dispatch job `coffee-dialin-publish`).

The Google Sheet "Coffee Dial-In" is the single source of truth for every espresso shot
pulled on Balthamos (Linea Mini R) through the Zerno Z2. This script copies its four tabs
(Shots, Bags, Reference, Experiments) into data/log.js + data/log.json and commits when
anything changed. The post-commit hook queues the push (git-push job); GitHub Pages is the
publish step. Nothing is ever written back to the sheet from here.

Reads the sheet with `gws sheets +read` (OAuth in the keychain, so it must run
unsandboxed — launchd is). Silent by design; a read failure exits non-zero so Dispatch
records the failure.
"""
import datetime, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
DATA = os.path.join(HERE, 'data')
SHEET = os.environ.get('COFFEE_DIALIN_SHEET', '1H55uA6EMT98yAonN8Il2PudnP_SHZfeegY-9bA0qYNk')   # same id as kv coffee-dialin.sheet_id
TABS = {'shots': 'Shots!A1:L500', 'bags': 'Bags!A1:Q100', 'reference': 'Reference!A1:D120', 'experiments': 'Experiments!A1:H100'}
GWS = os.environ.get('GWS', '/usr/local/bin/gws')


def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise SystemExit('FAILED %s\n%s\n%s' % (' '.join(cmd), r.stdout[-2000:], r.stderr[-2000:]))
    return r


def read_tab(rng):
    r = run([GWS, 'sheets', '+read', '--spreadsheet', SHEET, '--range', rng, '--format', 'json'])
    values = json.loads(r.stdout).get('values', [])
    width = max((len(row) for row in values), default=0)
    return [row + [''] * (width - len(row)) for row in values]


def table(rows):
    """Header row -> list of dicts (keys = header text); blank header cells become col_N."""
    if not rows:
        return []
    head = [h.strip() or 'col_%d' % i for i, h in enumerate(rows[0])]
    out = []
    for row in rows[1:]:
        if not any(c.strip() for c in row):
            continue
        out.append({head[i]: row[i].strip() for i in range(len(head))})
    return out


def main():
    raw = {k: read_tab(v) for k, v in TABS.items()}
    doc = {
        'generated_at': datetime.datetime.now().astimezone().isoformat(timespec='minutes'),
        'shots': table(raw['shots']),
        'bags': table(raw['bags']),
        'experiments': table(raw['experiments']),
        'reference': raw['reference'],          # free-form blocks; the page groups them by blank rows
    }
    os.makedirs(DATA, exist_ok=True)
    body = json.dumps(doc, ensure_ascii=False, indent=1)
    with open(os.path.join(DATA, 'log.json'), 'w', encoding='utf-8') as f:
        f.write(body + '\n')
    with open(os.path.join(DATA, 'log.js'), 'w', encoding='utf-8') as f:
        f.write('window.DIALIN = ' + body + ';\n')

    rel = os.path.relpath(HERE, REPO)
    run(['git', 'add', os.path.join(rel, 'data', 'log.js'), os.path.join(rel, 'data', 'log.json')], cwd=REPO)
    # generated_at changes every run; only commit when the sheet content itself moved
    diff = run(['git', 'diff', '--cached', '--', os.path.join(rel, 'data', 'log.json')], cwd=REPO, check=False).stdout
    content_changed = any(l.startswith(('+', '-')) and not l.startswith(('+++', '---')) and '"generated_at"' not in l for l in diff.splitlines())
    if content_changed:
        stamp = datetime.date.today().isoformat()
        run(['git', 'commit', '-q', '-m', 'coffee-dialin: sheet refresh %s (%d shots, %d bags)' % (stamp, len(doc['shots']), len(doc['bags']))], cwd=REPO)
        print('ok committed shots=%d bags=%d' % (len(doc['shots']), len(doc['bags'])))
    else:
        run(['git', 'reset', '-q', '--', os.path.join(rel, 'data')], cwd=REPO, check=False)
        run(['git', 'checkout', '-q', '--', os.path.join(rel, 'data')], cwd=REPO, check=False)
        print('ok unchanged shots=%d bags=%d' % (len(doc['shots']), len(doc['bags'])))


if __name__ == '__main__':
    main()
