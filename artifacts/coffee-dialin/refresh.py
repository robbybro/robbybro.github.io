#!/usr/bin/env python3
"""Hourly publish for the Coffee Dial-In artifact (Dispatch job `coffee-dialin-publish`).

Postgres is the single source of truth for every espresso shot (coffee_shots), every bag
(coffee_bags.data.dialin) and the house rules (kv coffee-dialin). This script asks db.py
for the public export, writes data/log.js + data/log.json and commits when the content
changed. The post-commit hook queues the push (git-push job); GitHub Pages is the publish
step. Nothing here ever writes back to the database.
"""
import datetime, json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
DATA = os.path.join(HERE, 'data')
DB = os.path.expanduser('~/.claude/skills/_db/db.py')


def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise SystemExit('FAILED %s\n%s\n%s' % (' '.join(cmd), r.stdout[-2000:], r.stderr[-2000:]))
    return r


# The page never mentions Robby (2026-10-30: "dont mention me at all. I am the arbiter of
# dialins"). The shot log keeps its attributions; they are stripped here, on the way out.
ME = r"Robby"
SCRUB = [
    (r"\s*[—-]\s*%s\s+\d{1,2}/\d{1,2}\b" % ME, ""),           # "tasted best — Robby 10/30"
    (r"\b%s\s+\d{4}-\d{2}-\d{2}:\s*" % ME, ""),               # "Robby 2026-10-30: 165 µm…"
    (r"\b%s['’]s call[;,]\s*" % ME, ""),                       # "(Robby's call; bitter rule…)"
    (r",?\s*\b%s did not taste\b" % ME, ""),                   # "Emily made it, Robby did not taste;"
    (r",?\s*\b%s['’]s call\b" % ME, ""),                       # "(…, Robby's call…)"
    (r"\b%s:\s*" % ME, ""),                                    # "Robby: wants more clarity"
    (r"\s*\bper %s\b" % ME, ""),                               # "roaster name per Robby"
]
POSSESSIVE = re.compile(r"(^|[.!?]\s+)?\b%s['’]s\s+" % ME)     # "Robby's milk-drink read" → "the …"
PERSON = re.compile(r"\b(%s|he|him|himself|his)\b" % ME, re.I)


def scrub(s):
    for pat, rep in SCRUB:
        s = re.sub(pat, rep, s)
    s = POSSESSIVE.sub(lambda m: (m.group(1) + "The ") if m.group(1) is not None else "the ", s)
    if PERSON.search(s):  # anything the rules missed: drop the clause that still names him
        parts = re.split(r"(?<=[.;—])\s+|\s+(?=—)", s)
        s = " ".join(p for p in parts if not PERSON.search(p))
    s = re.sub(r"\(\s*\)", "", re.sub(r"\(\s+", "(", s))
    if s.count("(") > s.count(")"):  # a dropped clause can leave "(reaffirmed 2026-10-11" open
        s = re.sub(r"\s*\([^()]*$", "", s)
    return re.sub(r"\s{2,}", " ", s).strip(" ;—")


def depersonalize(o):
    if isinstance(o, dict):
        return {k: (None if k == "by_whom" and isinstance(v, str) and re.fullmatch(ME, v.strip())
                    else depersonalize(v)) for k, v in o.items()}
    if isinstance(o, list):
        return [depersonalize(v) for v in o]
    return scrub(o) if isinstance(o, str) else o


def main():
    doc = depersonalize(json.loads(run([DB, 'coffee', 'export']).stdout))
    os.makedirs(DATA, exist_ok=True)
    body = json.dumps(doc, ensure_ascii=False, indent=1)
    # Publish guard (CISO review 2026-10-30): the export is Robby's Postgres verbatim, so a new field
    # carrying a local path, an email address or an image file name must never reach the public page.
    leak = re.search(r'/Users/|/Volumes/|[\w.+-]+@[\w-]+\.[\w.]+|\.(?:png|jpe?g|heic)\b', body)
    if leak:
        raise SystemExit('REFUSED publish: export contains a private-looking value: %r' % body[max(0, leak.start() - 60):leak.end() + 20])
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
