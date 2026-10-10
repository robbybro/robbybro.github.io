#!/usr/bin/env python3
"""Hourly publish for the Coffee Dial-In artifact (Dispatch job `coffee-dialin-publish`).

Postgres is the single source of truth for every espresso shot (coffee_shots), every bag
(coffee_bags.data.dialin) and the house rules (kv coffee-dialin). This script asks db.py
for the public export, writes data/log.js + data/log.json and commits when the content
changed. The post-commit hook queues the push (git-push job); GitHub Pages is the publish
step. Nothing here ever writes back to the database.
"""
import datetime, json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
DATA = os.path.join(HERE, 'data')
DB = os.path.expanduser('~/.claude/skills/_db/db.py')


def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise SystemExit('FAILED %s\n%s\n%s' % (' '.join(cmd), r.stdout[-2000:], r.stderr[-2000:]))
    return r


def main():
    doc = json.loads(run([DB, 'coffee', 'export']).stdout)
    os.makedirs(DATA, exist_ok=True)
    body = json.dumps(doc, ensure_ascii=False, indent=1)
    with open(os.path.join(DATA, 'log.json'), 'w', encoding='utf-8') as f:
        f.write(body + '\n')
    with open(os.path.join(DATA, 'log.js'), 'w', encoding='utf-8') as f:
        f.write('window.DIALIN = ' + body + ';\n')

    rel = os.path.relpath(HERE, REPO)
    paths = [os.path.join(rel, 'data', 'log.js'), os.path.join(rel, 'data', 'log.json')]
    run(['git', 'add'] + paths, cwd=REPO)
    diff = run(['git', 'diff', '--cached', '--', paths[1]], cwd=REPO, check=False).stdout
    changed = any(l.startswith(('+', '-')) and not l.startswith(('+++', '---')) and '"generated_at"' not in l for l in diff.splitlines())
    n_shots = sum(1 for s in doc['shots'] if s.get('status') == 'pulled')
    if changed:
        run(['git', 'commit', '-q', '-m', 'coffee-dialin: refresh %s (%d shots, %d bags)' % (datetime.date.today().isoformat(), n_shots, len(doc['bags']))], cwd=REPO)
        print('ok committed shots=%d bags=%d' % (n_shots, len(doc['bags'])))
    else:
        run(['git', 'reset', '-q', '--'] + paths, cwd=REPO, check=False)
        run(['git', 'checkout', '-q', '--'] + paths, cwd=REPO, check=False)
        print('ok unchanged shots=%d bags=%d' % (n_shots, len(doc['bags'])))


if __name__ == '__main__':
    main()
