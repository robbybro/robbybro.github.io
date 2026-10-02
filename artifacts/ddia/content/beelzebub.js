window.DDIA = window.DDIA || {chapters:[], viz:[], system:null};

window.DDIA.viz.push({
  slug: "etl-vs-elt", chapter: 11, title: "ETL vs ELT", path: "viz/etl-vs-elt/index.html",
  blurb: "The same source and the same final table, built two ways: transform before loading, or load raw and transform in SQL. Drag the slider for how much of the source survives the transform and watch the bytes moved; then throw a transform bug, a new question that needs a dropped field, personal data, a non-SQL transform, or a source with 7-day retention at both lanes and see which one copes."
});
window.DDIA.viz.push({
  slug: "batch-joins", chapter: 11, title: "Batch Joins Stepper", path: "viz/batch-joins/index.html",
  blurb: "Six users, twenty-four messages, three mappers, three reducers. Step a count job through map, shuffle, sort and reduce and watch the network count; flip on a combiner. Then the three joins side by side: sort-merge (everything crosses), broadcast hash (ship the small table, no shuffle), partitioned hash (co-partitioned inputs, no shuffle). Finally a hot key: Taylor sends 14 of 24 and one reducer holds 18 records while the others idle, fixed by salting her key or by joining the hot keys map-side."
});

window.DDIA.viz.push({
  slug: "messaging-map", chapter: 10, title: "Messaging System Map", path: "viz/messaging-map/index.html",
  blurb: "The whole messaging system in one picture: two regions, leased owner processes sharded by conversation, a five-node Raft lock service across three zones, Cassandra at quorum, Postgres leader and follower, async cross-region copies. Cut the cross-region link, take down the lock service's majority, pause an owner, or darken a region; slide time forward through lease expiry and the paused owner waking; trace a send from either region to either home; and compare the consistent design as built against an available variant that keeps writing on both sides."
});
window.DDIA.viz.push({
  slug: "isolation-lab", chapter: 8, title: "Isolation Lab", path: "viz/isolation-lab/index.html",
  blurb: "A small bank, two or three concurrent transactions, and every anomaly from chapter 8: dirty read, dirty write, read skew, lost update, write skew, phantom, deadlock, stale reads. Pick the isolation level (read uncommitted → serializable) and the topology (single node, leader + follower, multi-leader, leaderless), step through the interleaving, and compare the race against the serial run and the fix (atomic update, SELECT FOR UPDATE, a uniqueness constraint, a fixed lock order)."
});
window.DDIA.viz.push({
  slug: "btree-stepper", chapter: 4, title: "B-Tree & LSM Stepper", path: "viz/btree-stepper/index.html",
  blurb: "The same API calls run against both engines, broken into the steps each one takes. Presets for a full tour, write-heavy and read-heavy workloads, sequential inserts, build-up-and-tear-down, and a secondary index on a changing column (stale entries, tombstones, index range scans)."
});
