#!/usr/bin/env python3
"""Regenerate artifacts/index.html from the artifact folders.

    python3 artifacts/build.py

Every artifacts/<slug>/index.html becomes one card. Title comes from the page's
<title>; blurb from its <meta name="description"> or, failing that, from
artifacts/blurbs.json (slug -> text). Dates come from git: first commit = made,
last commit = updated. Newest first. Commit the regenerated index.html.
"""
import html, json, os, re, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
BLURBS = json.load(open(os.path.join(ROOT, "blurbs.json"))) if os.path.exists(os.path.join(ROOT, "blurbs.json")) else {}

def git_dates(rel):
    log = subprocess.run(["git", "-C", REPO, "log", "--format=%as", "--", rel], capture_output=True, text=True).stdout.split()
    return (log[-1], log[0]) if log else ("", "")

cards = []
for slug in sorted(os.listdir(ROOT)):
    page = os.path.join(ROOT, slug, "index.html")
    if not os.path.isfile(page):
        continue
    src = open(page, encoding="utf-8", errors="replace").read()
    if re.search(r'http-equiv="refresh"', src):   # a redirect stub for a moved artifact, not a page
        continue
    title = re.search(r"<title>(.*?)</title>", src, re.S)
    title = html.unescape(title.group(1).strip()) if title else slug
    desc = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', src)
    blurb = html.unescape(desc.group(1)) if desc else BLURBS.get(slug, "")
    made, updated = git_dates(f"artifacts/{slug}")
    cards.append({"slug": slug, "title": title, "blurb": blurb, "made": made, "updated": updated})

cards.sort(key=lambda c: (c["updated"], c["slug"]), reverse=True)

def fmt(d):
    if not d:
        return ""
    y, m, dd = d.split("-")
    return f"{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][int(m)-1]} {int(dd)}, {y}"

items = []
for c in cards:
    when = fmt(c["made"]) + (f" · updated {fmt(c['updated'])}" if c["updated"] != c["made"] else "")
    items.append(f"""    <li>
      <a class="card" href="/artifacts/{c['slug']}/">
        <h2>{html.escape(c['title'])}</h2>
        {f'<p>{html.escape(c["blurb"])}</p>' if c['blurb'] else ''}
        <time datetime="{c['made']}">{when}</time>
      </a>
    </li>""")

page = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Artifacts — Robby Brosman</title>
  <meta name="description" content="Every one-off page Robby has built: build sheets, maps, palettes, visualizers." />
  <meta name="robots" content="noindex" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Rubik+Mono+One&display=swap" rel="stylesheet" />
  <style>
    :root {{
      --bg: #0b0f1a; --ink: #f4f6fb; --ink-dim: #aab3c5; --accent: #7c5cff;
      --card: rgba(255,255,255,0.04); --line: rgba(255,255,255,0.12);
    }}
    @media (prefers-color-scheme: light) {{
      :root {{ --bg: #f6f7fb; --ink: #0b0f1a; --ink-dim: #4b5468; --card: rgba(0,0,0,0.03); --line: rgba(0,0,0,0.12); }}
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: var(--bg); color: var(--ink); font-family: "Open Sans", system-ui, sans-serif; line-height: 1.5; }}
    main {{ max-width: 72rem; margin: 0 auto; padding: clamp(1.5rem, 5vw, 4rem) 16px 4rem; }}
    header a.home {{ color: var(--ink-dim); text-decoration: none; font-weight: 600; }}
    header a.home:hover {{ color: var(--accent); }}
    h1 {{ font-family: "Rubik Mono One", monospace; font-size: clamp(1.8rem, 5vw, 3rem); margin: .4rem 0 .3rem; letter-spacing: -0.01em; }}
    .lede {{ color: var(--ink-dim); margin: 0 0 2rem; max-width: 52ch; }}
    ul {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr)); }}
    .card {{ display: flex; flex-direction: column; gap: .4rem; height: 100%; padding: 1.1rem 1.2rem; border: 1px solid var(--line); border-radius: 14px; background: var(--card); color: inherit; text-decoration: none; transition: border-color .15s, transform .15s; }}
    .card:hover {{ border-color: var(--accent); transform: translateY(-2px); }}
    .card h2 {{ font-size: 1.1rem; margin: 0; line-height: 1.3; }}
    .card p {{ margin: 0; color: var(--ink-dim); font-size: .95rem; flex: 1; }}
    .card time {{ color: var(--ink-dim); font-size: .8rem; }}
    footer {{ margin-top: 3rem; color: var(--ink-dim); font-size: .85rem; }}
    footer code {{ font-size: .85em; }}
  </style>
</head>
<body>
  <main>
    <header>
      <a class="home" href="/">← robbybro.com</a>
      <h1>Artifacts</h1>
      <p class="lede">One-off pages, newest first. {len(cards)} so far.</p>
    </header>
    <ul>
{chr(10).join(items)}
    </ul>
    <footer>Generated by <code>artifacts/build.py</code> from the folders in <code>/artifacts</code>.</footer>
  </main>
</body>
</html>
"""
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(page)
print(f"wrote artifacts/index.html ({len(cards)} artifacts)")
