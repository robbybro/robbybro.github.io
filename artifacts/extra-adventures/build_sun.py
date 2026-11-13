#!/usr/bin/env python3
"""Build the sun for the load animation and splice it into index.html.

The bikes are an Illustrator Image Trace of a hand line drawing: every pen line
is a filled outline shape in currentColor, slightly wobbly, with round ends.
This draws a sun the same way: one pen stroke for the circle (it overshoots
where the pen came back round) and one short stroke per ray, each turned into
a filled outline. It makes FRAMES versions with the wobble re-rolled, and the
page cycles through them (a hand-drawn "boil").

Run:  python3 build_sun.py        (rewrites the block between the sun markers)
"""
import math, pathlib, random

HERE = pathlib.Path(__file__).parent
HTML = HERE / "index.html"

FRAMES = 4
BOX = 120          # viewBox is 0 0 BOX BOX; the page sizes the sun box at 0.46 x the bikes' width
C = BOX / 2
R = 22             # circle radius
RAYS = 11
HALF = 0.55        # pen half-width: matches the bikes' line weight at the size above
SEED = 2027


def outline(pts, halves):
    """A pen stroke along pts (centre line) with a half-width per point -> closed polygon with round ends."""
    n = len(pts)
    tang = []
    for i in range(n):
        ax, ay = pts[max(i - 1, 0)]
        bx, by = pts[min(i + 1, n - 1)]
        d = math.hypot(bx - ax, by - ay) or 1
        tang.append(((bx - ax) / d, (by - ay) / d))
    left = [(x - ty * h, y + tx * h) for (x, y), (tx, ty), h in zip(pts, tang, halves)]
    right = [(x + ty * h, y - tx * h) for (x, y), (tx, ty), h in zip(pts, tang, halves)]

    def cap(p, t, h, sign):
        nx, ny = -t[1], t[0]
        return [(p[0] + h * (sign * nx * math.cos(a) + sign * t[0] * math.sin(a)),
                 p[1] + h * (sign * ny * math.cos(a) + sign * t[1] * math.sin(a))) for a in (math.pi / 4, math.pi / 2, 3 * math.pi / 4)]

    return left + cap(pts[-1], tang[-1], halves[-1], 1) + right[::-1] + cap(pts[0], tang[0], halves[0], -1)


def smooth(poly):
    """Closed polygon -> path through the edge midpoints with the corners as quadratic control points."""
    m = len(poly)
    mid = [((poly[i][0] + poly[(i + 1) % m][0]) / 2, (poly[i][1] + poly[(i + 1) % m][1]) / 2) for i in range(m)]
    d = f"M{mid[-1][0]:.1f} {mid[-1][1]:.1f}"
    for p, q in zip(poly, mid):
        d += f"Q{p[0]:.1f} {p[1]:.1f} {q[0]:.1f} {q[1]:.1f}"
    return d + "Z"


def frame(rng, base):
    cx, cy = C + rng.uniform(-0.5, 0.5), C + rng.uniform(-0.5, 0.5)
    # the circle: one stroke, a little lumpy, that drifts in or out so the end misses the start
    start = base["start"] + rng.uniform(-0.25, 0.25)
    sweep = 2 * math.pi + rng.uniform(0.06, 0.3)
    drift = rng.uniform(-1.5, 1.5)
    lumps = [(k, rng.uniform(0.012, 0.03), rng.uniform(0, 2 * math.pi)) for k in (2, 3, 5)]
    wob = rng.uniform(0, 2 * math.pi)
    steps = 56
    pts, halves = [], []
    for i in range(steps + 1):
        f = i / steps
        a = start + sweep * f
        r = R * (1 + sum(amp * math.sin(k * a + ph) for k, amp, ph in lumps)) + drift * (f - 0.5)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        halves.append(HALF * (1 + 0.16 * math.sin(3 * a + wob)) * (0.8 if i in (0, steps) else 1))
    d = smooth(outline(pts, halves))
    # the rays: long and short by turns, each a short stroke with a slight bend, thinner where the pen lifts
    for i in range(RAYS):
        a = base["angles"][i] + rng.uniform(-0.04, 0.04)
        r0 = base["inner"][i] + rng.uniform(-0.8, 0.8)
        length = base["length"][i] * rng.uniform(0.9, 1.1)
        bend = rng.uniform(-0.8, 0.8)
        ray, hw = [], []
        for j in range(5):
            f = j / 4
            rr = r0 + length * f
            off = bend * math.sin(math.pi * f)
            ray.append((cx + rr * math.cos(a) - off * math.sin(a), cy + rr * math.sin(a) + off * math.cos(a)))
            hw.append(HALF * (1.08, 1.12, 1.05, 0.95, 0.78)[j] * rng.uniform(0.92, 1.08))
        d += smooth(outline(ray, hw))
    return d


def build():
    rng = random.Random(SEED)
    base = dict(
        start=rng.uniform(0, 2 * math.pi),
        angles=[2 * math.pi * i / RAYS + rng.uniform(-0.07, 0.07) for i in range(RAYS)],
        inner=[R + 7.5 + rng.uniform(-1, 1) for _ in range(RAYS)],
        length=[(12.5 if i % 2 == 0 else 8) * rng.uniform(0.88, 1.12) for i in range(RAYS)],
    )
    paths = "\n".join(f'<path class="sf{" on" if k == 0 else ""}" d="{frame(rng, base)}"/>' for k in range(FRAMES))
    svg = (f'<svg class="sun" id="sun" viewBox="0 0 {BOX} {BOX}" aria-hidden="true" focusable="false">\n'
           f'<g fill="currentColor">\n{paths}\n</g>\n</svg>')
    html = HTML.read_text(encoding="utf-8")
    start, end = "<!-- sun:start -->", "<!-- sun:end -->"
    assert start in html and end in html, "markers missing in index.html"
    pre, rest = html.split(start, 1)
    _, post = rest.split(end, 1)
    HTML.write_text(pre + start + "\n" + svg + "\n" + end + post, encoding="utf-8")
    print("sun spliced:", FRAMES, "frames,", len(svg), "bytes")


if __name__ == "__main__":
    build()
