window.DDIA = window.DDIA || {chapters:[], viz:[], system:null};

window.DDIA.viz.push({
  slug: "isolation-lab", chapter: 8, title: "Isolation Lab", path: "viz/isolation-lab/index.html",
  blurb: "A small bank, two or three concurrent transactions, and every anomaly from chapter 8: dirty read, dirty write, read skew, lost update, write skew, phantom, deadlock, stale reads. Pick the isolation level (read uncommitted → serializable) and the topology (single node, leader + follower, multi-leader, leaderless), step through the interleaving, and compare the race against the serial run and the fix (atomic update, SELECT FOR UPDATE, a uniqueness constraint, a fixed lock order)."
});
window.DDIA.viz.push({
  slug: "btree-stepper", chapter: 4, title: "B-Tree & LSM Stepper", path: "viz/btree-stepper/index.html",
  blurb: "The same API calls run against both engines, broken into the steps each one takes. Presets for a full tour, write-heavy and read-heavy workloads, sequential inserts, build-up-and-tear-down, and a secondary index on a changing column (stale entries, tombstones, index range scans)."
});
