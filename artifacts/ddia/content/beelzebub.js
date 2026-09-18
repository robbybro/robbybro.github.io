window.DDIA = window.DDIA || {chapters:[], viz:[], system:null};

window.DDIA.viz.push({
  slug: "btree-stepper", chapter: 4, title: "B-Tree & LSM Stepper", path: "viz/btree-stepper/index.html",
  blurb: "The same API calls run against both engines, broken into the steps each one takes. Presets for a full tour, write-heavy and read-heavy workloads, sequential inserts, build-up-and-tear-down, and a secondary index on a changing column (stale entries, tombstones, index range scans)."
});
