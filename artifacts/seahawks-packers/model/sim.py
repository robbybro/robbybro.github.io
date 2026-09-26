#!/usr/bin/env python3
"""Seahawks–Packers meeting simulator.

Reads the ESPN scoreboard dumps in ../data (2024–2026), fits a margin-aware Elo,
simulates the rest of the 2026 season N times under the real NFL seeding /
tiebreak / bracket rules, and writes ../data/sim.json for the page.

Usage: sim.py [N]   (default 20000)
"""
import json, glob, math, os, random, sys, collections, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')

DIV = {}
for div, teams in {
    'AFC East': ['BUF', 'MIA', 'NE', 'NYJ'], 'AFC North': ['BAL', 'CIN', 'CLE', 'PIT'],
    'AFC South': ['HOU', 'IND', 'JAX', 'TEN'], 'AFC West': ['DEN', 'KC', 'LV', 'LAC'],
    'NFC East': ['DAL', 'NYG', 'PHI', 'WSH'], 'NFC North': ['CHI', 'DET', 'GB', 'MIN'],
    'NFC South': ['ATL', 'CAR', 'NO', 'TB'], 'NFC West': ['ARI', 'LAR', 'SF', 'SEA'],
}.items():
    for t in teams:
        DIV[t] = div
CONF = {t: d[:3] for t, d in DIV.items()}
TEAMS = sorted(DIV)
DIVS = sorted(set(DIV.values()))
NAMES = {'ARI': 'Cardinals', 'ATL': 'Falcons', 'BAL': 'Ravens', 'BUF': 'Bills', 'CAR': 'Panthers', 'CHI': 'Bears',
         'CIN': 'Bengals', 'CLE': 'Browns', 'DAL': 'Cowboys', 'DEN': 'Broncos', 'DET': 'Lions', 'GB': 'Packers',
         'HOU': 'Texans', 'IND': 'Colts', 'JAX': 'Jaguars', 'KC': 'Chiefs', 'LAC': 'Chargers', 'LAR': 'Rams',
         'LV': 'Raiders', 'MIA': 'Dolphins', 'MIN': 'Vikings', 'NE': 'Patriots', 'NO': 'Saints', 'NYG': 'Giants',
         'NYJ': 'Jets', 'PHI': 'Eagles', 'PIT': 'Steelers', 'SEA': 'Seahawks', 'SF': '49ers', 'TB': 'Buccaneers',
         'TEN': 'Titans', 'WSH': 'Commanders'}

A, B = 'SEA', 'GB'
SEASON = 2026
K = 20.0          # Elo K-factor
HFA = 48.0        # home-field advantage in Elo points (~1.7 pts)
REVERT = 1 / 3    # preseason regression toward 1500
MEAN = 1500.0


def load_games():
    games = []
    for f in sorted(glob.glob(os.path.join(DATA, '*-*-*.json'))):
        name = os.path.basename(f)[:-5]
        season, st, week = name.split('-')
        j = json.load(open(f))
        for e in j.get('events', []):
            c = e['competitions'][0]
            home = away = None
            for t in c['competitors']:
                d = {'abbr': t['team']['abbreviation'],
                     'score': int(t['score']) if t.get('score') not in (None, '') else None}
                if t['homeAway'] == 'home':
                    home = d
                else:
                    away = d
            if home['abbr'] not in DIV or away['abbr'] not in DIV:
                continue
            games.append({'season': int(season), 'type': st, 'week': int(week), 'date': e['date'],
                          'home': home['abbr'], 'away': away['abbr'], 'hs': home['score'], 'as': away['score'],
                          'final': bool(e['status']['type']['completed']), 'neutral': bool(c.get('neutralSite', False)),
                          'venue': (c.get('venue') or {}).get('fullName'), 'name': e['name']})
    games.sort(key=lambda g: g['date'])
    return games


def expected(ra, rb):
    return 1.0 / (1.0 + 10 ** ((rb - ra) / 400.0))


def fit_elo(games):
    """Run 538-style Elo over every completed regular/post-season game, regressing between seasons."""
    elo = {t: MEAN for t in TEAMS}
    season = None
    for g in games:
        if g['type'] == 'pre' or not g['final']:
            continue
        if g['season'] != season:
            if season is not None:
                for t in TEAMS:
                    elo[t] = elo[t] * (1 - REVERT) + MEAN * REVERT
            season = g['season']
        h, a = g['home'], g['away']
        hfa = 0 if g['neutral'] else HFA
        eh = expected(elo[h] + hfa, elo[a])
        if g['hs'] == g['as']:
            sh = 0.5
        else:
            sh = 1.0 if g['hs'] > g['as'] else 0.0
        margin = abs(g['hs'] - g['as'])
        winner_diff = (elo[h] + hfa - elo[a]) if sh >= 0.5 else (elo[a] - elo[h] - hfa)
        mult = math.log(max(margin, 1) + 1) * (2.2 / (winner_diff * 0.001 + 2.2))
        delta = K * mult * (sh - eh)
        elo[h] += delta
        elo[a] -= delta
    return elo


# ---------------------------------------------------------------- standings / tiebreakers
class Season:
    __slots__ = ('w', 'l', 't', 'opps', 'res')

    def __init__(self):
        self.w = collections.Counter(); self.l = collections.Counter(); self.t = collections.Counter()
        # res[team] = list of (opponent, outcome 1/0/0.5)
        self.res = {t: [] for t in TEAMS}

    def record(self, winner, loser, tie=False):
        if tie:
            self.t[winner] += 1; self.t[loser] += 1
            self.res[winner].append((loser, 0.5)); self.res[loser].append((winner, 0.5))
        else:
            self.w[winner] += 1; self.l[loser] += 1
            self.res[winner].append((loser, 1.0)); self.res[loser].append((winner, 0.0))

    def pct(self, t):
        n = self.w[t] + self.l[t] + self.t[t]
        return (self.w[t] + 0.5 * self.t[t]) / n if n else 0.0

    def pct_vs(self, t, opps):
        w = n = 0.0
        for o, r in self.res[t]:
            if o in opps:
                w += r; n += 1
        return (w / n if n else -1.0), n

    def pct_filter(self, t, pred):
        w = n = 0.0
        for o, r in self.res[t]:
            if pred(o):
                w += r; n += 1
        return w / n if n else 0.0

    def sov(self, t):
        w = n = 0.0
        for o, r in self.res[t]:
            if r == 1.0:
                w += self.w[o] + 0.5 * self.t[o]; n += self.w[o] + self.l[o] + self.t[o]
        return w / n if n else 0.0

    def sos(self, t):
        w = n = 0.0
        for o, r in self.res[t]:
            w += self.w[o] + 0.5 * self.t[o]; n += self.w[o] + self.l[o] + self.t[o]
        return w / n if n else 0.0


def _top(pool, keyf):
    vals = {t: keyf(t) for t in pool}
    best = max(vals.values())
    return [t for t in pool if abs(vals[t] - best) < 1e-9]


def pick_best(s, pool, kind):
    """Return the single club that wins the tie among `pool` under division ('div') or wild-card ('wc') rules.
    Implements: one club per step; remaining tied clubs restart at step 1."""
    pool = list(pool)
    if len(pool) == 1:
        return pool[0]
    if kind == 'wc' and len(pool) > 2:
        # step 1: apply division tiebreaker to leave only the highest-ranked club from each division
        by_div = collections.defaultdict(list)
        for t in pool:
            by_div[DIV[t]].append(t)
        pool = [pick_best(s, ts, 'div') if len(ts) > 1 else ts[0] for ts in by_div.values()]
        if len(pool) == 1:
            return pool[0]
    multi = len(pool) > 2
    pset = set(pool)

    def h2h(t):
        p, n = s.pct_vs(t, pset - {t})
        if multi and kind == 'wc':
            # sweep rule: only a club that beat (or lost to) every other applies
            others = pset - {t}
            played = {o for o, _ in s.res[t] if o in others}
            if played != others:
                return 0.5
            return 1.0 if p == 1.0 else (0.0 if p == 0.0 else 0.5)
        return p if n else 0.5

    def common(t):
        opp_sets = [set(o for o, _ in s.res[x]) for x in pool]
        com = set.intersection(*opp_sets)
        p, n = s.pct_vs(t, com)
        if kind == 'wc' and n < 4:
            return 0.5
        return p if n else 0.5

    if kind == 'div':
        steps = [h2h, lambda t: s.pct_filter(t, lambda o: DIV[o] == DIV[t]), common,
                 lambda t: s.pct_filter(t, lambda o: CONF[o] == CONF[t]), s.sov, s.sos]
    else:
        steps = [h2h, lambda t: s.pct_filter(t, lambda o: CONF[o] == CONF[t]), common, s.sov, s.sos]
    for step in steps:
        cands = _top(pool, step)
        if len(cands) == 1:
            return cands[0]
        if len(cands) < len(pool):
            return pick_best(s, cands, kind)  # remaining tied clubs revert to step 1
    return random.choice(pool)  # coin toss (points-based steps omitted)


def rank_group(s, teams, kind):
    order = []
    pool = list(teams)
    while pool:
        b = pick_best(s, pool, kind)
        order.append(b); pool.remove(b)
    return order


def order_by_record(s, teams, kind):
    """Sort by win pct; break exact ties with the given tiebreaker family."""
    out = []
    groups = collections.defaultdict(list)
    for t in teams:
        groups[round(s.pct(t), 6)].append(t)
    for p in sorted(groups, reverse=True):
        g = groups[p]
        out.extend(rank_group(s, g, kind) if len(g) > 1 else g)
    return out


def seed_conference(s, conf):
    winners = []
    for d in DIVS:
        if d.startswith(conf):
            members = [t for t in TEAMS if DIV[t] == d]
            winners.append(order_by_record(s, members, 'div')[0])
    seeds = order_by_record(s, winners, 'wc')  # home-field priority among division winners = WC tiebreakers
    rest = [t for t in TEAMS if CONF[t] == conf and t not in winners]
    seeds += order_by_record(s, rest, 'wc')[:3]
    return seeds  # index 0 = seed 1


# ---------------------------------------------------------------- simulation
def sim_game(elo, home, away, neutral=False):
    p = expected(elo[home] + (0 if neutral else HFA), elo[away])
    return home if random.random() < p else away


def play_bracket(elo, seeds, log, conf):
    """seeds: list seed1..seed7. Returns conference champion; appends games to log."""
    alive = {}
    rnd = 'WC'
    for hi, lo in ((2, 7), (3, 6), (4, 5)):
        h, a = seeds[hi - 1], seeds[lo - 1]
        w = sim_game(elo, h, a)
        log.append((conf, rnd, hi, lo, h, a, w))
        alive[w] = hi if w == h else lo
    alive[seeds[0]] = 1
    rem = sorted(alive.items(), key=lambda kv: kv[1])  # (team, seed) ascending seed
    rnd = 'DIV'
    pairs = [(rem[0], rem[3]), (rem[1], rem[2])]
    alive2 = {}
    for (h, hs), (a, as_) in pairs:
        w = sim_game(elo, h, a)
        log.append((conf, rnd, hs, as_, h, a, w))
        alive2[w] = hs if w == h else as_
    rem = sorted(alive2.items(), key=lambda kv: kv[1])
    (h, hs), (a, as_) = rem
    w = sim_game(elo, h, a)
    log.append((conf, 'CCG', hs, as_, h, a, w))
    return w, (hs if w == h else as_)


def simulate_once(elo0, played, remaining):
    elo = dict(elo0)
    s = Season()
    for g in played:
        if g['hs'] == g['as']:
            s.record(g['home'], g['away'], tie=True)
        elif g['hs'] > g['as']:
            s.record(g['home'], g['away'])
        else:
            s.record(g['away'], g['home'])
    outcomes = {}
    for g in remaining:
        h, a = g['home'], g['away']
        neutral = g['neutral']
        ph = expected(elo[h] + (0 if neutral else HFA), elo[a])
        hw = random.random() < ph
        winner, loser = (h, a) if hw else (a, h)
        s.record(winner, loser)
        d = K * ((1.0 if hw else 0.0) - ph)
        elo[h] += d; elo[a] -= d
        outcomes[g['id']] = winner
    seeds = {c: seed_conference(s, c) for c in ('AFC', 'NFC')}
    log = []
    champs = {}
    for c in ('AFC', 'NFC'):
        champs[c] = play_bracket(elo, seeds[c], log, c)
    (ac, acs), (nc, ncs) = champs['AFC'], champs['NFC']
    sb = sim_game(elo, ac, nc, neutral=True)
    log.append(('SB', 'SB', acs, ncs, ac, nc, sb))
    return s, outcomes, seeds, log, sb


def main():
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 20000
    random.seed(int(sys.argv[2]) if len(sys.argv) > 2 else 2026)
    games = load_games()
    elo = fit_elo(games)
    cur = [g for g in games if g['season'] == SEASON and g['type'] == 'reg']
    for i, g in enumerate(cur):
        g['id'] = i
    played = [g for g in cur if g['final']]
    remaining = [g for g in cur if not g['final']]
    scheduled_meeting = [g for g in games if g['season'] == SEASON and {g['home'], g['away']} == {A, B}]

    def team_games(t):
        return [g for g in cur if t in (g['home'], g['away'])]
    rem = {t: [g for g in team_games(t) if not g['final']] for t in (A, B)}
    played_t = {t: [g for g in team_games(t) if g['final']] for t in (A, B)}

    def wins_so_far(t):
        w = 0
        for g in played_t[t]:
            me, opp = (g['hs'], g['as']) if g['home'] == t else (g['as'], g['hs'])
            w += 1 if me > opp else 0
        return w
    base_w = {t: wins_so_far(t) for t in (A, B)}
    base_l = {t: len(played_t[t]) - base_w[t] for t in (A, B)}

    # aggregates
    meet = collections.Counter()               # (round, host) -> n
    seed_ct = {A: collections.Counter(), B: collections.Counter()}
    pair_ct = collections.Counter()            # (seedA, seedB) -> n   (0 = missed playoffs)
    pair_meet = collections.Counter()          # (seedA, seedB, round, host) -> n
    pair_path = collections.defaultdict(collections.Counter)   # (seedA,seedB) -> path signature -> n
    pair_after = collections.defaultdict(collections.Counter)  # (seedA,seedB) -> (meet winner, nfc champ, afc champ, sb champ) -> n
    pair_seedteam = collections.defaultdict(lambda: collections.Counter())  # (seedA,seedB) -> (conf,seed,team) -> n
    rec_ct = collections.Counter(); rec_meet = collections.Counter()
    node_ct = {A: collections.Counter(), B: collections.Counter()}; node_meet = {A: collections.Counter(), B: collections.Counter()}
    edge_ct = {A: collections.Counter(), B: collections.Counter()}; edge_meet = {A: collections.Counter(), B: collections.Counter()}
    gwin = {A: collections.Counter(), B: collections.Counter()}
    div_win = collections.Counter(); playoffs = collections.Counter(); conf_champ = collections.Counter(); sb_win = collections.Counter()
    seed_any = collections.defaultdict(collections.Counter)
    final_wins = {A: collections.Counter(), B: collections.Counter()}
    nfc_bracket_meet = collections.Counter()   # (seedA, seedB, round, host) over all sims
    wc_round_meet_prefix = collections.Counter()

    for _ in range(N):
        s, outcomes, seeds, log, sb = simulate_once(elo, played, remaining)
        sA = seeds['NFC'].index(A) + 1 if A in seeds['NFC'] else 0
        sB = seeds['NFC'].index(B) + 1 if B in seeds['NFC'] else 0
        mt = None
        for (conf, rnd, hs, as_, h, a, w) in log:
            if conf == 'NFC' and {h, a} == {A, B}:
                mt = (rnd, h, w)
                break
        if mt:
            meet[(mt[0], mt[1])] += 1
        seed_ct[A][sA] += 1; seed_ct[B][sB] += 1
        pair = (sA, sB)
        pair_ct[pair] += 1
        if mt:
            pair_meet[(sA, sB, mt[0], mt[1])] += 1
            # path signature: outcomes of NFC games before the meeting, as "seed beats seed"
            sig = []
            for (conf, rnd, hs, as_, h, a, w) in log:
                if conf != 'NFC':
                    continue
                if {h, a} == {A, B}:
                    sig.append('%s:%s@%s' % (rnd, as_, hs)); break
                sig.append('%s:%d>%d' % (rnd, hs if w == h else as_, as_ if w == h else hs))
            pair_path[pair]['|'.join(sig)] += 1
            nfc_c = [x for x in log if x[0] == 'NFC' and x[1] == 'CCG'][0][6]
            afc_c = [x for x in log if x[0] == 'AFC' and x[1] == 'CCG'][0][6]
            pair_after[pair][(mt[2], nfc_c, afc_c, sb)] += 1
        if sA and sB:
            for c in ('AFC', 'NFC'):
                for i, t in enumerate(seeds[c]):
                    pair_seedteam[pair][(c, i + 1, t)] += 1
        wA, wB = s.w[A], s.w[B]
        final_wins[A][wA] += 1; final_wins[B][wB] += 1
        rec_ct[(wA, wB)] += 1
        if mt:
            rec_meet[(wA, wB)] += 1
        for t in (A, B):
            w = base_w[t]
            for i, g in enumerate(rem[t]):
                won = outcomes[g['id']] == t
                edge_ct[t][(i, w, won)] += 1
                if won:
                    gwin[t][i] += 1
                if mt:
                    edge_meet[t][(i, w, won)] += 1
                w += 1 if won else 0
                node_ct[t][(i + 1, w)] += 1
                if mt:
                    node_meet[t][(i + 1, w)] += 1
        for c in ('AFC', 'NFC'):
            for i, t in enumerate(seeds[c]):
                playoffs[t] += 1; seed_any[t][i + 1] += 1
                if i < 4:
                    div_win[t] += 1
        for (conf, rnd, hs, as_, h, a, w) in log:
            if rnd == 'CCG':
                conf_champ[w] += 1
        sb_win[sb] += 1

    def frac(c):
        return {str(k): v / N for k, v in c.items()}

    out = {
        'generated': datetime.datetime.now().astimezone().isoformat(timespec='minutes'),
        'n': N, 'season': SEASON, 'teams': {A: NAMES[A], B: NAMES[B]},
        'elo': {t: round(elo[t], 1) for t in TEAMS}, 'names': NAMES, 'div': DIV,
        'params': {'K': K, 'HFA': HFA, 'revert': REVERT, 'seasons_fit': [2024, 2025, 2026]},
        'games_played': len(played), 'games_remaining': len(remaining),
        'scheduled_meeting': [{'date': g['date'], 'home': g['home'], 'away': g['away'], 'type': g['type'], 'week': g['week'], 'venue': g['venue']} for g in scheduled_meeting],
        'base': {t: {'w': base_w[t], 'l': base_l[t]} for t in (A, B)},
        'played': {t: [{'week': g['week'], 'date': g['date'][:10], 'opp': (g['away'] if g['home'] == t else g['home']), 'home': g['home'] == t,
                        'pf': (g['hs'] if g['home'] == t else g['as']), 'pa': (g['as'] if g['home'] == t else g['hs'])} for g in played_t[t]] for t in (A, B)},
        'remaining': {t: [{'week': g['week'], 'date': g['date'][:10], 'opp': (g['away'] if g['home'] == t else g['home']), 'home': g['home'] == t,
                           'venue': g['venue'], 'p_win_elo': round(expected(elo[t] + (HFA if g['home'] == t else 0), elo[(g['away'] if g['home'] == t else g['home'])] + (0 if g['home'] == t else HFA)), 3),
                           'p_win_sim': round(gwin[t][i] / N, 3)} for i, g in enumerate(rem[t])] for t in (A, B)},
        'meet_total': sum(meet.values()) / N,
        'meet': {'%s|%s' % k: v / N for k, v in meet.items()},
        'seed': {t: frac(seed_ct[t]) for t in (A, B)},
        'pairs': [{'a': k[0], 'b': k[1], 'p': v / N,
                   'meet': {'%s|%s' % (r, h): pair_meet[(k[0], k[1], r, h)] / v for (a_, b_, r, h) in pair_meet if (a_, b_) == k},
                   'paths': [{'sig': sig, 'p': c / v} for sig, c in pair_path[k].most_common(4)],
                   'after': [{'meet_winner': mw, 'nfc': nc, 'afc': ac, 'sb': sbw, 'p': c / v} for (mw, nc, ac, sbw), c in pair_after[k].most_common(3)],
                   'seedteam': {'%s%d' % (c, sd): [[t, cnt / v] for (c2, sd2, t), cnt in sorted(pair_seedteam[k].items(), key=lambda kv: -kv[1]) if (c2, sd2) == (c, sd)][:3] for c in ('AFC', 'NFC') for sd in range(1, 8)} if (k[0] and k[1]) else {},
                   } for k, v in sorted(pair_ct.items(), key=lambda kv: -kv[1])],
        'records': [{'a': k[0], 'b': k[1], 'p': v / N, 'meet': rec_meet[k] / v} for k, v in rec_ct.items()],
        'final_wins': {t: frac(final_wins[t]) for t in (A, B)},
        'lattice': {t: {'nodes': [{'i': k[0], 'w': k[1], 'p': v / N, 'meet': node_meet[t][k] / v} for k, v in sorted(node_ct[t].items())],
                        'edges': [{'i': k[0], 'w': k[1], 'won': k[2], 'p': v / N, 'meet': edge_meet[t][k] / v} for k, v in sorted(edge_ct[t].items())]} for t in (A, B)},
        'league': {t: {'playoffs': playoffs[t] / N, 'div': div_win[t] / N, 'conf': conf_champ[t] / N, 'sb': sb_win[t] / N,
                       'seeds': frac(seed_any[t])} for t in TEAMS},
    }
    js = json.dumps(out, separators=(',', ':'))
    open(os.path.join(DATA, 'sim.json'), 'w').write(js)
    open(os.path.join(DATA, 'sim.js'), 'w').write('window.SIM=' + js + ';\n')
    print('sims', N, 'meet', out['meet_total'], out['meet'])
    print('SEA seeds', out['seed'][A]); print('GB seeds', out['seed'][B])
    print('elo top', sorted(((round(v), t) for t, v in elo.items()), reverse=True)[:8])
    print('SB', sb_win.most_common(6))


if __name__ == '__main__':
    main()
