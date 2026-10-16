window.DDIA = window.DDIA || {chapters:[], viz:[], system:null};
window.DDIA.mocks = window.DDIA.mocks || [];
window.DDIA.mocks.push({
  slug: "airbnb", n: 2, date: "2026-10-16", title: "Airbnb: search, availability, booking",
  chapters: [3, 7, 8, 10, 11, 12],
  prompt: "Design the core of Airbnb. Guests search for listings by location and date range and see which ones are available. A guest can book an available listing for a set of nights, and the system must never let two guests hold the same listing for the same night. Hosts manage a calendar for each listing, blocking and unblocking dates, and sometimes two people edit the same host calendar at the same time from different devices. Assume Airbnb's real scale. You have 45 minutes.",
  why: "The second mock in the queue and the first full one. It is built to catch two things: the no-overlap rule is a <b>write-skew</b> problem that one writer and a unique key solve without any extra machinery, and search is <b>derived data</b> that lags the calendar, which is fine as long as the leader is the truth. The round below is the prompt asked the way an interviewer asks it, in sequence, with the answer that earns the follow-up.",
  sections: [
    { id: "round", title: "The round: forty-five minutes, in order", intro: "Each card is the next thing the interviewer asks. Answer out loud before reading.", items: [
      { q: "\"Design the core of Airbnb. Where do you start?\"",
        a: "<p>Functional requirements as verbs: <b>search</b> by location and dates, <b>see availability</b>, <b>hold and book</b> a set of nights, <b>host edits the calendar</b>. Then nonfunctional as numbers: searches and bookings per second, search p99 under ~300 ms, checkout p99 under ~1 s, and the one invariant stated as a sentence: <b>no two guests ever hold the same listing-night</b>. Say which parts may be stale (search, availability shown on a listing page) and which may not (the booking itself). That split is the whole design.</p>",
        followups: [
          { q: "\"Which load parameter is the architecture sensitive to?\"", a: "<p><b>Searches per booking</b>, not bookings per second. Bookings are tens per second worldwide; searches are a hundred or more per booking, each a geo-plus-date query. Bookings decide the consistency design; searches decide the read path and the index.</p>" },
          { q: "\"Name the invariant in the book's words.\"", a: "<p>Two transactions each read \"these nights are free\" and each write a booking: both premises were true when read and false after both commit. That is <b>write skew</b>. The fix is not locking the read; it is making the write itself fail when the premise is gone, which a unique key on (listing, night) does.</p>" }
        ],
        line: "verbs, then numbers, then the invariant as one sentence: no two guests hold the same listing-night." },
      { q: "\"Give me the numbers.\"",
        a: "<p>About <b>5–8M listings</b>, ~100M guests, ~3 trips per guest per year → ~300M bookings/yr ≈ <b>10 bookings/s average, 50/s at peak</b>. Searches at ~100 per booking → <b>~1k/s average, 5k/s peak</b>. Bytes: a night row is ~16 bytes, so 5M listings × 365 nights ≈ <b>30 GB per year</b>, which is nothing. Photos: 5M × 20 × 500 KB ≈ <b>50 TB</b>, which is the real storage and lives in an object store behind a CDN, never in the database. Verdict: booking is <b>cheap</b> (one Postgres could take the writes), search is <b>medium</b> (an index per region), photos are where the money goes.</p>",
        followups: [
          { q: "\"Could one database do it?\"", a: "<p>For bookings, yes: 50 writes/s is a laptop. Regions exist for <b>latency and blast radius</b>, not throughput. Say that out loud, because it changes what the regions are for: a leader per listing near its host, replicas near the guests.</p>" },
          { q: "\"Why bring up photos unprompted?\"", a: "<p>Because bytes decide cost and the calendar's bytes round to zero. The first storage sentence in any product with images is \"the blobs are 99% of the bytes and they go to object storage plus a CDN.\" Then the database is small and the interesting part.</p>" }
        ],
        line: "10 bookings a second, a thousand searches, 30 GB of calendar, 50 TB of photos: the database is small, the blobs are the bytes." },
      { q: "\"Where does each piece of data live, and what query is it good at?\"",
        a: "<table><thead><tr><th>Data</th><th>Store, shape</th><th>Query it serves</th></tr></thead><tbody><tr><td>Listings</td><td>Postgres row</td><td>point lookup by id; the listing page</td></tr><tr><td><b>Nights</b></td><td>Postgres table, primary key <code>(listing_id, night)</code>, with <code>status</code> (held · booked · blocked), <code>booking_id</code>, <code>expires_at</code></td><td>range scan for a calendar; the insert that enforces no-overlap</td></tr><tr><td>Bookings</td><td>Postgres row, index on <code>guest_id</code></td><td>\"my trips\"; one row per stay</td></tr><tr><td>Search</td><td>Elasticsearch or a geo index, <b>derived</b> from Postgres by change data capture</td><td>bounding box + date range + filters, ranked</td></tr><tr><td>Photos</td><td>Object store + CDN</td><td>bytes by key</td></tr></tbody></table><p>A night that has no row is available. No calendar needs pre-populating and no nightly job exists.</p>",
        followups: [
          { q: "\"Why not a calendar array per listing, one slot per day?\"", a: "<p>Three reasons. You cannot put a uniqueness constraint on an element of an array, so the invariant moves into application code. A range query becomes \"load the document and scan.\" And every edit rewrites the whole document, so two hosts editing different weeks collide on the same row. Rows per night give the constraint, the range scan, and the merge for free.</p>" },
          { q: "\"Where's the cache?\"", a: "<p>Not in the booking path. Checkout reads the leader, because stale availability is the one thing that must not be served there. The CDN is the photo cache. A search-results cache keyed by query is worth adding only when the p99 number says so; say the number that would make you add it rather than adding Redis by reflex.</p>" }
        ],
        line: "nights are rows with (listing, night) as the key; absence means available; search is derived; photos are blobs behind a CDN." },
      { q: "\"Two guests click Book on overlapping nights at the same moment. What happens?\"",
        a: "<p>Every write for a listing goes to <b>one leader</b>. Each checkout is <b>one transaction</b> that inserts one row per night with <code>status = held</code> and an <code>expires_at</code>. The second transaction inserts a row whose key already exists, the primary key rejects it, and <b>the whole transaction rolls back</b>, including the nights that did not overlap. No lock service, no queue, no two-phase commit: one writer and a unique key. The loser sees \"those dates were just taken\" and a refreshed calendar. If you want one row per stay instead of one per night, Postgres has an <b>exclusion constraint</b> on a date range (<code>EXCLUDE USING gist (listing_id WITH =, nights WITH &amp;&amp;)</code>), which does the same thing for ranges.</p>",
        followups: [
          { q: "\"Why isn't that two-phase commit?\"", a: "<p>Two-phase commit is a coordinator asking <b>several independent participants</b> to prepare and then commit so that an update spanning two stores is atomic. Here there is one participant, one database, one transaction. The word for what the booking does is <b>a transaction with a constraint</b>. Reaching for 2PC when there is one store is the \"more machinery\" reflex.</p>" },
          { q: "\"Which isolation level do you need?\"", a: "<p>With the unique key, <b>read committed</b> is enough: the constraint, not the isolation level, stops the second writer. Without the key you would need <b>serializable</b> to catch the write skew, which is slower and still needs a retry loop. Put the invariant in the schema.</p>" },
          { q: "\"A guest books five nights and two of them overlap mine. All five fail?\"", a: "<p>Yes, and that is the point. A stay is all-or-nothing, so the transaction is all-or-nothing. They see the three free nights on refresh and decide.</p>" }
        ],
        line: "one leader per listing, one transaction per stay, a unique key on (listing, night): the second writer fails, the whole stay rolls back, no 2PC." },
      { q: "\"The guest never finishes checkout. How does the hold expire?\"",
        a: "<p>The held rows carry <code>expires_at</code>, ten minutes out. Confirming the booking is one <code>UPDATE</code> from held to booked. A <b>sweeper</b> deletes expired holds every minute, and the booking insert treats an expired hold as absent (delete the stale rows, then insert, in the same transaction) so a late sweeper never blocks a sale. No queue, no Redis key with a TTL: the expiry is a column on the row that already exists.</p>",
        followups: [
          { q: "\"Why not a Redis TTL for the hold?\"", a: "<p>A second store for a one-column fact is a <b>dual write</b>: the row and the key can disagree, and now you need to reconcile. The database already has the row; give it the timestamp.</p>" }
        ],
        line: "a hold is a row with an expiry; confirmation is an update; a sweeper tidies; nothing else." },
      { q: "\"A host blocks dates from two devices at the same time.\"",
        a: "<p>Two cases. <b>Different nights</b>: the rows do not collide, both writes succeed, and the merge was free because the unit of write is the night, not the calendar. <b>The same night, opposite intent</b>: there is no merge; the second write must find out it lost. Carry a <b>version</b> on the night row (or on the listing's calendar), send it back with the edit, and update only if the version still matches: <b>compare-and-set</b>. The losing device gets a conflict and refreshes. A guest and a host racing for the same night go through the same single-writer path, and whoever commits first wins; the host can cancel afterwards.</p>",
        followups: [
          { q: "\"Could you just let the last write win?\"", a: "<p>For a calendar, silently losing a person's edit is the bug the prompt is asking you to notice. Last-write-wins is acceptable for data where the newest value is the right value (a profile photo). It is not acceptable where both writers had intent.</p>" }
        ],
        line: "per-night rows merge non-overlapping edits for free; same-night edits need a version and compare-and-set, never last-write-wins." },
      { q: "\"Regions. Where is the leader, and what is the shard key?\"",
        a: "<p><b>Partitioned single-leader.</b> Each listing has exactly one leader, in the region nearest its host; the dataset is spread across many leaders. Other regions hold <b>asynchronous replicas</b> for reads. Browsing reads the local replica; the moment a guest starts checkout, the request routes to the listing's leader. The shard key is a <b>hash of the listing id within its region</b>: region alone is a hot shard, because North America dwarfs the rest, and a small country alone is a cold one.</p>",
        followups: [
          { q: "\"Single-leader or multi-leader?\"", a: "<p>Single. <b>Multi-leader</b> means the same row accepts writes in two places and you reconcile later. This design refuses that on purpose, because reconciling two bookings for one night has no good answer. The phrase to say is <b>\"leader per shard.\"</b></p>" },
          { q: "\"The network between Europe and North America partitions.\"", a: "<p>Writes to listings whose leader is across the partition <b>fail fast</b>; the guest sees \"booking unavailable, try again\"; holds on that side time out on their own. Reads continue from the local replica and go stale by the length of the partition. Writes for local listings are unaffected. That is choosing consistency for the booking and availability for the browse, and it is the right split.</p>" }
        ],
        line: "leader per shard, shard by listing id within the region, replicas elsewhere; checkout goes to the leader, browsing stays local." },
      { q: "\"Search said available; the booking failed. Why, and is that okay?\"",
        a: "<p>Search is <b>derived data</b>: an index fed from the nights and listings tables by <b>change data capture</b>, seconds behind the leader. The leader is the truth, so the booking is right and the search was stale. That is acceptable; the user sees \"just taken\" and a refreshed calendar. What you measure is the rate at which stale search turns into a conflict at the leader, and the end-to-end lag that produces it.</p>",
        followups: [
          { q: "\"Who serves the index, who patches it, who rebuilds it?\"", a: "<p>Elasticsearch <b>serves</b>. A <b>source connector</b> (Debezium) reads the Postgres write-ahead log through logical decoding and publishes changes to Kafka; a <b>sink connector</b> writes them into the index: that <b>patches</b>. A <b>rebuild</b> is a snapshot of the tables plus a replay of the log from the snapshot's offset. The application never writes the index directly, because that would be a dual write.</p>" },
          { q: "\"Sink, or sync?\"", a: "<p>Sink. In Kafka Connect a <i>source</i> connector reads from a system into a topic, and a <i>sink</i> connector writes from a topic into a system. Elasticsearch does not read the database's log itself; the pipeline does.</p>" }
        ],
        line: "search is derived by change data capture and lags by seconds; the leader is the truth; measure how often stale search becomes a conflict." },
      { q: "\"Walk me through two failures: what the user sees, the fix, and what the fix costs.\"",
        a: "<ol><li><b>A leader region goes down.</b> Sees: bookings for those listings fail for the failover window; browsing continues from replicas. Fix: automatic failover to a replica with <b>fencing</b> so the old leader cannot accept a late write. Cost: thirty seconds to a few minutes of no bookings for that region's listings, plus any holds not yet replicated, which is fine because holds are re-creatable and bookings were acknowledged only after the leader committed.</li><li><b>The change-data-capture consumer dies.</b> Sees: search goes stale; conflicts at checkout rise; nothing is lost. Fix: alert on consumer lag, restart, replay from the last offset. Cost: minutes of stale search, a spike in \"just taken\" messages, zero data loss, which is the point of deriving search from a log rather than dual-writing it.</li></ol>",
        followups: [
          { q: "\"What does 'cost' mean in that answer?\"", a: "<p>What the fix takes from you: write unavailability for the failover window, replica lag made visible, an extra component to operate, money. A fix with no stated cost is a fix the interviewer does not believe.</p>" }
        ],
        line: "leader down: brief write unavailability, failover with fencing; CDC down: stale search, replay the log; say the cost of each." },
      { q: "\"What would you measure first?\"",
        a: "<p><b>Booking conflict rate at the leader</b> and <b>search-to-leader lag</b>, because together they say whether the eventual side is cheating the strong side. Then checkout p99, because that path crosses regions. Then hold-expiry rate, which is a product number dressed as a system number.</p>",
        followups: [],
        line: "conflict rate and search lag first; they prove the invariant and bound the staleness." },
      { q: "\"Closing tradeoffs: half the budget, ten times the scale, one thing you'd cut.\"",
        a: "<p><b>Half:</b> drop the cross-region replicas; route search to the listing's home region and accept the latency. <b>Ten times:</b> more regions, a search index per region, read replicas per region for the listing page, and a cache for hot listings after a viral post; the booking path does not change, because 500 writes a second is still one leader. <b>Cut:</b> the hold. Book directly and let cancellation handle regret; the nights table and the unique key stay, because they are the invariant.</p>",
        followups: [],
        line: "half: no replicas; 10×: more regions and indexes, the booking path unchanged; cut the hold, keep the key." }
    ]},
    { id: "mechanisms", title: "Mechanisms, re-asked against the design", intro: "The recap, as the interviewer pushing on each choice.", items: [
      { q: "\"Unique key versus two-phase commit: when is each the answer?\"",
        a: "<p>A unique key when the invariant lives in <b>one store</b>: the database refuses the second writer. Two-phase commit when one logical update must land in <b>two independent stores</b> atomically, and even then the modern answer is usually a log: write once, derive the rest. If you can name one store, you do not need 2PC.</p>", followups: [], line: "one store, one constraint; two stores, a log before a coordinator." },
      { q: "\"Exclusion constraint on a range versus one row per night.\"",
        a: "<p>Same guarantee, different shape. One row per stay with a date range and an exclusion constraint keeps the table small and makes a stay one row. One row per night makes the calendar a range scan and makes host edits per night merge for free. Pick per night when hosts edit nights; pick ranges when stays are the only writer.</p>", followups: [], line: "ranges when stays are the only writer; nights when hosts edit the calendar." },
      { q: "\"Change data capture versus writing the index from the application.\"",
        a: "<p>The application writing both the row and the index is a <b>dual write</b>: no atomicity, so they drift and nothing tells you. Change data capture reads the database's own log, so the index is a <b>deterministic function of the log</b> and can be rebuilt by replay. It costs a pipeline and seconds of lag.</p>", followups: [], line: "dual writes drift silently; derive from the log and rebuild by replay." },
      { q: "\"Partitioned single-leader versus multi-leader.\"",
        a: "<p>Both have many leaders. In partitioned single-leader each <b>row</b> has one; in multi-leader the same row has several and you reconcile. Use the first wherever a conflict has no good resolution (a booking). Use the second only for data with a merge rule (counters, sets, text with CRDTs) or for offline clients.</p>", followups: [], line: "many leaders is fine; the same row with two leaders is the thing to avoid." },
      { q: "\"A hold with an expiry column versus a lease service.\"",
        a: "<p>A lease service is a second system that owns time. For a ten-minute hold on a row you already have, the column is the lease: <code>expires_at</code>, a sweeper, and the insert path treating expired holds as absent. Reach for a separate lease only when the held thing is not a row in a database.</p>", followups: [], line: "the row already exists; give it the timestamp." },
      { q: "\"A CDN versus a cache.\"",
        a: "<p>A CDN caches <b>immutable bytes by key</b> at the edge: photos. A cache (Redis) caches <b>query results</b> near the application and goes stale when the row changes. Photos want the first. Availability wants neither in the checkout path. Search results want the second only once a p99 number asks for it.</p>", followups: [], line: "immutable bytes go to the CDN; query results go to a cache only when a number says so." },
      { q: "\"A version column and compare-and-set.\"",
        a: "<p>Read the row with its version, send the version back with the write, update only where the version still matches, and treat zero rows updated as a conflict. It is <b>optimistic concurrency</b>: no lock held across the user's think time, and the loser finds out instead of being silently overwritten.</p>", followups: [], line: "update where version = what I read; zero rows means someone else won." }
    ]},
    { id: "followups", title: "Interviewer follow-ups", intro: "The pushes that come after the design is on the board.", items: [
      { q: "\"A listing goes viral: ten thousand views a minute.\"", a: "<p>A hot key on the read side only. Reads come from replicas and a short-lived cache of the listing page; photos are already on the CDN. Writes are unaffected because views are not writes. If people start booking it, the unique key handles the stampede: one wins, the rest roll back.</p>", followups: [], line: "hot reads go to replicas and a short cache; the write path does not notice." },
      { q: "\"The guest wants to extend by one night.\"", a: "<p>Insert one more row for that listing-night with the same booking id, in a transaction. Same path, same constraint. If the night is taken, the insert fails and they see why.</p>", followups: [], line: "an extension is one more row through the same door." },
      { q: "\"Cancellation and refund.\"", a: "<p>Flip the booking to cancelled and delete or free the night rows in the same transaction; the refund is a <b>ledger</b> entry with an idempotency key, not a mutation of the charge. Search catches up by change data capture.</p>", followups: [], line: "free the nights in one transaction; the money is an append to a ledger." },
      { q: "\"Time zones.\"", a: "<p>Nights are <b>local dates</b>, never timestamps: check-in is 3 pm local wherever the listing is, so a night is a calendar date in the listing's zone. The key is a date; the only timestamp in the design is the hold's expiry, and that one is UTC.</p>", followups: [], line: "a night is a local date; the hold's expiry is the only timestamp." },
      { q: "\"Prices change per night.\"", a: "<p>Price is an attribute of the night row (or a pricing table keyed the same way). The hold copies the price onto the held rows so the quote is frozen for the ten minutes, and the booking confirms the frozen price, not the current one.</p>", followups: [], line: "price lives on the night; the hold freezes it." }
    ]}
  ],
  takeaways: [
    "State the invariant as one sentence before drawing anything: no two guests hold the same listing-night.",
    "Nights are rows with (listing, night) as the key; absence means available; the schema enforces the invariant.",
    "One leader per listing and one transaction per stay. The second writer fails on the key. No two-phase commit for one store.",
    "A hold is a row with an expiry column, not a lease service, not a Redis key.",
    "Per-night rows merge non-overlapping host edits for free; same-night edits need a version and compare-and-set.",
    "Partitioned single-leader, shard by listing id within the region. Multi-leader is the same row with two leaders, and a booking has no merge rule.",
    "Search is derived by change data capture and lags by seconds; the leader is the truth; measure how often stale search becomes a conflict.",
    "Photos are the bytes: object store plus CDN. The calendar rounds to zero.",
    "Every failure gets three sentences: what the user sees, the fix, what the fix costs.",
    "When the answer feels heavy, ask what one writer, a unique key, and a log would do instead."
  ]
});
