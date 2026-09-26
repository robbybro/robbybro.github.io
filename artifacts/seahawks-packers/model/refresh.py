#!/usr/bin/env python3
"""Weekly refresh for the Seahawks × Packers artifact (Dispatch job `hawks-pack-watch`).

1. Pull the current season's ESPN scoreboard (pre/reg/post) into data/.
2. Re-run the simulation and regenerate data/sim.js.
3. Commit + push the page (GitHub Pages is the publish step).

Silent by design: the page carries the odds. DETECTION IS NOT THIS JOB'S: the daily
`nfl-rivalry-watch` job (dispatch/lib/nfl_rivalry_watch.py, since 2026-09-10) already
alerts the moment a Seahawks–Packers game appears on any schedule; this page only
mirrors that fact in its banner from the same ESPN feed.
"""
import datetime, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.abspath(os.path.join(HERE, '..'))
REPO = os.path.abspath(os.path.join(ART, '..', '..'))
SEASON = '2026'
SIMS = os.environ.get('HAWKS_PACK_SIMS', '50000')
PY = sys.executable


def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise SystemExit('FAILED %s\n%s\n%s' % (' '.join(cmd), r.stdout[-2000:], r.stderr[-2000:]))
    return r


def main():
    run([PY, os.path.join(HERE, 'fetch.py'), SEASON])
    run([PY, os.path.join(HERE, 'sim.py'), SIMS])
    sim = json.load(open(os.path.join(ART, 'data', 'sim.json')))

    # publish
    rel = os.path.relpath(ART, REPO)
    run(['git', 'add', os.path.join(rel, 'data', 'sim.js'), os.path.join(rel, 'data', 'sim.json')], cwd=REPO)
    if run(['git', 'diff', '--cached', '--quiet'], cwd=REPO, check=False).returncode != 0:
        stamp = datetime.date.today().isoformat()
        run(['git', 'commit', '-q', '-m', 'seahawks-packers: weekly refresh %s (meet %.1f%%)' % (stamp, 100 * sim['meet_total'])], cwd=REPO)
        run(['git', 'push', '-q'], cwd=REPO)

    print('ok meet=%.4f scheduled=%d sims=%s' % (sim['meet_total'], len(sim.get('scheduled_meeting', [])), SIMS))


if __name__ == '__main__':
    main()
