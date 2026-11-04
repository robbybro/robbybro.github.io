#!/usr/bin/env python3
"""Build the Emily & Robby 2027 mark and splice it into index.html.

Source: mark-trace.svg — the Illustrator Image Trace of the Gemini line drawing
(one fused outline per rider+bike; nothing is separable, and the rims have no
spokes). The traced art is kept untouched; this adds a spoke group inside each
rim, behind the drawing, that the page rotates with scroll so the wheels turn.

Run:  python3 build_mark.py        (rewrites the block between the mark markers)
"""
import json, math, pathlib, re

HERE = pathlib.Path(__file__).parent
SRC = HERE / "mark-trace.svg"
HTML = HERE / "index.html"

# Rim centres measured from the trace (viewBox units); r = outer tyre radius.
WHEELS = [
    dict(id="w1", cx=78.4, cy=286.6, r=39),   # Emily rear
    dict(id="w2", cx=185.8, cy=286.9, r=41),  # Emily front
    dict(id="w3", cx=237.2, cy=285.7, r=40),  # Robby rear
    dict(id="w4", cx=351.3, cy=285.3, r=40),  # Robby front
]
SPOKES = (0.3, 2.394, 4.489)  # three spokes, 120° apart


def wheel(w):
    cx, cy, rr = w["cx"], w["cy"], w["r"] - 8
    spokes = "".join(
        f'<line x1="{cx}" y1="{cy}" x2="{cx + rr * math.cos(a):.1f}" y2="{cy + rr * math.sin(a):.1f}"/>' for a in SPOKES
    )
    return f'<g id="{w["id"]}" data-cx="{cx}" data-cy="{cy}" data-r="{w["r"]}">{spokes}<circle cx="{cx}" cy="{cy}" r="2.4"/></g>'


def build():
    src = SRC.read_text(encoding="utf-8")
    # keep the riders, bikes and heart; drop the "EMILY & ROBBY 2027" lettering (every path that starts below y=340)
    paths = "".join(p for p in re.findall(r"<path[^>]*/>", src, flags=re.S)
                    if float(re.search(r'd="M[-\d.]+,([-\d.]+)', p).group(1)) < 340)
    svg = (
        '<svg class="mark" viewBox="38 112 356 222" role="img" '
        'aria-label="Line drawing of Emily and Robby riding bikes">\n'
        '<g class="spokes" fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round">'
        + "".join(wheel(w) for w in WHEELS)
        + '</g>\n<g fill="currentColor">' + paths + "</g>\n</svg>"
    )
    html = HTML.read_text(encoding="utf-8")
    start, end = "<!-- mark:start -->", "<!-- mark:end -->"
    assert start in html and end in html, "markers missing in index.html"
    pre, rest = html.split(start, 1)
    _, post = rest.split(end, 1)
    HTML.write_text(pre + start + "\n" + svg + "\n" + end + post, encoding="utf-8")
    print("mark spliced:", len(svg), "bytes")


if __name__ == "__main__":
    build()
