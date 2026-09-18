window.DDIA = window.DDIA || {chapters:[], viz:[], system:null};

window.DDIA.viz.push({
  slug: "btree-stepper", chapter: 4, title: "B-Tree & LSM Stepper", path: "viz/btree-stepper/index.html",
  blurb: "The same API calls run against both engines, broken into the steps each one takes. Presets for a full tour, write-heavy and read-heavy workloads, sequential inserts, build-up-and-tear-down, and a secondary index on a changing column (stale entries, tombstones, index range scans)."
});

window.DDIA.system = {
  intro: "One Mac mini in Seattle, always on. Postgres 16 (one node, local trust auth), a launchd timer every five minutes running <code>dispatch.py</code>, which fans out headless Claude agents and plain commands as jobs, ~20 skills, a Tailscale-only dashboard, and a weekly <code>pg_dump</code> to Google Drive. One user. Every chapter's questions apply; the answers are just small, which is what makes it a good place to see the mechanisms without the scale hiding them.",
  body:
    '<section class="blk"><h2>The database, 2026-09-18</h2><div class="tbl"><table><thead><tr><th>Table</th><th>Rows</th><th>Size</th><th>Model (ch. 3)</th><th>Write shape (ch. 4)</th></tr></thead><tbody>' +
    '<tr><td><code>recipes</code></td><td>2,487,465</td><td>2.9 GB (2.0 heap + 0.9 indexes)</td><td>relational row + <code>data jsonb</code>; many-to-one to books by URL</td><td>one bulk load, then a few inserts a week; nine indexes incl. inverted (tsvector GIN) and trigram</td></tr>' +
    '<tr><td><code>books</code></td><td>16,299 (41 owned)</td><td>19 MB</td><td>the shelf plus a copy of Eat Your Books for one query</td><td>bulk load; <code>recipe_count</code> is an unmaintained denormalized count</td></tr>' +
    '<tr><td><code>cron_runs</code></td><td>19,543</td><td>6 MB</td><td>event log</td><td>append-only, ~one row per job fire; <code>(job, fired_at DESC)</code> index</td></tr>' +
    '<tr><td><code>edge_requests</code> / <code>edge_hourly</code> / <code>edge_daily</code></td><td>8,939 / 648 / 142</td><td>4.7 MB</td><td>event log + two rollups (a data cube by hand)</td><td>hourly appends; the rollups are materialized views refreshed by the job</td></tr>' +
    '<tr><td><code>places</code></td><td>3,424</td><td>3.5 MB</td><td>relational row + jsonb; unique on (name, city) and on Google place ID</td><td>state: verdicts and Maps sync flags updated in place</td></tr>' +
    '<tr><td><code>listings</code> / <code>listing_events</code></td><td>366 / 761</td><td>1.3 MB</td><td>state + its event log</td><td>RentCast daily, Redfin email hourly; scored in place</td></tr>' +
    '<tr><td><code>media</code> / <code>media_recs</code></td><td>463 / 290</td><td>0.6 MB</td><td>relational + jsonb; <code>media_recs</code> is a join table people ↔ media with per-edge columns</td><td>state</td></tr>' +
    '<tr><td><code>people</code> / <code>relationships</code></td><td>150 / 77</td><td>0.5 MB</td><td><b>property graph</b> as two tables: vertices with tags + jsonb, edges with type + attributes, indexed both directions</td><td>state</td></tr>' +
    '<tr><td><code>roles</code></td><td>138</td><td>0.3 MB</td><td>relational + jsonb; unique on (source, ext_id)</td><td>daily upsert from job boards; status changes in place</td></tr>' +
    '<tr><td><code>kv</code></td><td>37</td><td>0.3 MB</td><td><b>key-value store</b>: one JSON value per key, all mutable skill state</td><td>state, rewritten whole</td></tr>' +
    '<tr><td><code>garmin_daily</code>, <code>training_log</code>, <code>body_comp</code>, <code>bills</code>, <code>consumption</code>, <code>practice_log</code> …</td><td>small</td><td>&lt; 1 MB each</td><td>relational + jsonb</td><td>daily appends and in-place corrections</td></tr>' +
    '</tbody></table></div></section>' +
    '<section class="blk"><h2>Where each chapter lands</h2><ul>' +
    '<li><b>Chapter 2</b>: the nonfunctional requirement is liveness, not latency (<code>expected_cadence_hours</code>, <code>requires_sentinel</code>, the Sunday health email); three documented faults and their containment; a deliberate scale-up.</li>' +
    '<li><b>Chapter 3</b>: JSONB-forward rows are the convergence argument as a house rule; the wedding graph is a property graph in two tables; an Instagram link becomes one document-shaped row; 16,000 cookbooks are a copy of the world for one query.</li>' +
    '<li><b>Chapter 4</b>: the recipes table runs the whole index ladder (inverted, trigram, array GIN, partial B-trees) at a write rate where it\'s free; the planner had never seen statistics for it (fixed); event logs and state share one B-tree engine correctly at this volume; pgvector is the vector-index row waiting to happen.</li>' +
    '</ul></section>' +
    '<section class="blk"><h2>Findings so far</h2><div class="tbl"><table><thead><tr><th></th><th>Finding</th><th>Where</th></tr></thead><tbody>' +
    '<tr><td><span class="find fix">fixed</span></td><td><code>recipes</code> and <code>books</code> had never been analyzed; planner statistics said 8 rows. <code>ANALYZE</code> run 2026-09-18.</td><td><a href="#/ch/4/applied/2">ch. 4</a></td></tr>' +
    '<tr><td><span class="find idea">idea</span></td><td><code>books.recipe_count</code> is a denormalized copy nothing maintains; compute it or trigger it.</td><td><a href="#/ch/3/applied/5">ch. 3</a></td></tr>' +
    '<tr><td><span class="find idea">idea</span></td><td>Write the \"allowed to degrade\" list into the dashboard README.</td><td><a href="#/ch/2/applied/5">ch. 2</a></td></tr>' +
    '<tr><td><span class="find idea">idea</span></td><td>pgvector: link it, embed recipes and places, decide on quantization before the table is 4 GB of vectors.</td><td><a href="#/ch/4/applied/5">ch. 4</a></td></tr>' +
    '</tbody></table></div></section>'
};
