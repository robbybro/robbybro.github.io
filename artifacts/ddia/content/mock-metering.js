window.DDIA = window.DDIA || {chapters:[], viz:[], system:null};
window.DDIA.mocks = window.DDIA.mocks || [];
window.DDIA.mocks.push({
  slug: "metering", n: 3, date: "2026-10-20", title: "Metering and billing for an API product",
  chapters: [5, 8, 9, 12],
  prompt: "Design the metering and billing system for an API product. Every request carries an API key. The system must enforce a per-key rate limit; meter usage per key in near real time so a customer dashboard can show \"requests and tokens used this minute\"; and produce a monthly bill per customer that is exactly right, auditable, and never double-counts a request, even when requests are retried, a service crashes mid-request, or a region fails over. Assume a large AI API's scale. You have 45 minutes.",
  why: "Built to catch one thing: the prompt names two guarantees with different strengths, and the design has to run both. The <b>rate limit and the spend cap are approximate</b> and live at the edge; the <b>bill is exact</b> and lives in one append-only ledger whose primary key is the whole never-double-count guarantee. Everything the dashboard or a counter shows is derived from that ledger and can be rebuilt from it. The round below is the prompt asked in order, with the answer that earns the follow-up.",
  diagram: '<figure><svg viewBox="0 0 1180 640" role="img" aria-label="Reference design: a client sends a request with an API key and an idempotency key to a regional gateway, which admits it against a local counter; the serving layer tokenizes, infers, streams, and emits a usage event; the event goes through an outbox to a log keyed by request; the ledger in the home region inserts the row with a primary key that refuses duplicates; counters and the dashboard are derived from the log; the billing job folds the ledger monthly; a serving region leases budget from the home region periodically." xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;color:currentColor;font-family:inherit">'
    + '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>'
    + '<style>.box{fill:none;stroke:currentColor;stroke-width:1.6}.key{stroke:#b7791f;stroke-width:2.4;fill:rgba(183,121,31,.08)}.t{font-size:13px;fill:currentColor}.s{font-size:11px;fill:currentColor;opacity:.75}.h{font-size:12px;font-weight:600;fill:currentColor;letter-spacing:.06em}.ln{fill:none;stroke:currentColor;stroke-width:1.4;marker-end:url(#ar)}.dash{stroke-dasharray:5 5}.lbl{font-size:11px;fill:currentColor}.reg{fill:none;stroke:currentColor;stroke-width:1;stroke-dasharray:3 6;opacity:.6}</style>'
    // regions
    + '<rect class="reg" x="20" y="40" width="540" height="580" rx="14"/><text class="h" x="36" y="64">SERVING REGION (e.g. EU)</text>'
    + '<rect class="reg" x="600" y="40" width="560" height="580" rx="14"/><text class="h" x="616" y="64">HOME REGION OF THE API KEY (e.g. US)</text>'
    // client
    + '<rect class="box" x="40" y="100" width="150" height="56" rx="8"/><text class="t" x="115" y="124" text-anchor="middle">Client</text><text class="s" x="115" y="142" text-anchor="middle">api_key · request_id (idempotency)</text>'
    // gateway
    + '<rect class="box" x="40" y="220" width="150" height="56" rx="8"/><text class="t" x="115" y="244" text-anchor="middle">Gateway</text><text class="s" x="115" y="262" text-anchor="middle">admit: RPM / TPM / budget</text>'
    + '<path class="ln" d="M115 156V220"/><text class="lbl" x="122" y="192">request</text>'
    // counters
    + '<rect class="box" x="260" y="206" width="170" height="84" rx="8"/><text class="t" x="345" y="230" text-anchor="middle">Regional counters</text><text class="s" x="345" y="248" text-anchor="middle">Redis · per key · approximate</text><text class="s" x="345" y="264" text-anchor="middle">RPM, TPM, lease remaining</text><text class="s" x="345" y="280" text-anchor="middle">derived; rebuildable from the log</text>'
    + '<path class="ln" d="M190 248H260"/><text class="lbl" x="196" y="240">check, local, µs</text>'
    // serving
    + '<rect class="box" x="40" y="340" width="150" height="72" rx="8"/><text class="t" x="115" y="364" text-anchor="middle">Serving layer</text><text class="s" x="115" y="382" text-anchor="middle">tokenize → infer → stream</text><text class="s" x="115" y="398" text-anchor="middle">checkpoint every N tokens</text>'
    + '<path class="ln" d="M115 276V340"/><text class="lbl" x="122" y="312">admitted</text>'
    + '<path class="ln dash" d="M100 340V156"/><text class="lbl" x="48" y="300" transform="rotate(-90 48 300)">streamed tokens</text>'
    // outbox + log
    + '<rect class="box" x="260" y="340" width="170" height="72" rx="8"/><text class="t" x="345" y="364" text-anchor="middle">Outbox → usage log</text><text class="s" x="345" y="382" text-anchor="middle">Kafka, key = (api_key, request_id)</text><text class="s" x="345" y="398" text-anchor="middle">1 event per request: in, out, status</text>'
    + '<path class="ln" d="M190 376H260"/><text class="lbl" x="196" y="368">usage event at completion</text>'
    + '<path class="ln" d="M345 340V290"/><text class="lbl" x="352" y="320">increment</text>'
    // dashboard
    + '<rect class="box" x="260" y="470" width="170" height="60" rx="8"/><text class="t" x="345" y="494" text-anchor="middle">Dashboard aggregate</text><text class="s" x="345" y="512" text-anchor="middle">per key per minute · stream job</text>'
    + '<path class="ln" d="M345 412V470"/><text class="lbl" x="352" y="446">windowed, event time</text>'
    // lease
    + '<path class="ln dash" d="M430 232H680 V236"/><path class="ln dash" d="M680 300 V 290 H 430 V 290"/><text class="lbl" x="470" y="224">lease budget every N s or M tokens (async)</text><text class="lbl" x="470" y="310">grant: (cap − used) × region share</text>'
    // budget row
    + '<rect class="box" x="680" y="206" width="200" height="84" rx="8"/><text class="t" x="780" y="230" text-anchor="middle">Budget row per key</text><text class="s" x="780" y="248" text-anchor="middle">Postgres · cap (tokens), leased, used</text><text class="s" x="780" y="264" text-anchor="middle">one writer; compare-and-set</text><text class="s" x="780" y="280" text-anchor="middle">the only thing that must be serial</text>'
    // ledger
    + '<rect class="box key" x="680" y="340" width="440" height="104" rx="8"/><text class="t" x="900" y="364" text-anchor="middle">Usage ledger — append-only, exact</text><text class="s" x="900" y="384" text-anchor="middle">Postgres (B-tree) in the home region, async replica elsewhere</text><text class="s" x="900" y="402" text-anchor="middle">PRIMARY KEY (api_key, request_id) — a retry inserts the same row and the key refuses it</text><text class="s" x="900" y="420" text-anchor="middle">customer · input_tokens · output_tokens · status (ok | partial | failed) · model · region · ts</text><text class="s" x="900" y="436" text-anchor="middle">range index (customer_id, completed_at) for the monthly fold</text>'
    + '<path class="ln" d="M430 376H680"/><text class="lbl" x="470" y="368">consumer: INSERT … ON CONFLICT DO NOTHING</text>'
    // billing
    + '<rect class="box" x="680" y="500" width="200" height="72" rx="8"/><text class="t" x="780" y="524" text-anchor="middle">Billing job, monthly</text><text class="s" x="780" y="542" text-anchor="middle">fold over the ledger by customer</text><text class="s" x="780" y="558" text-anchor="middle">invoice idempotent by (customer, month)</text>'
    + '<path class="ln" d="M780 444V500"/><text class="lbl" x="788" y="476">sum tokens × price</text>'
    // audit / rebuild
    + '<rect class="box" x="920" y="500" width="200" height="72" rx="8"/><text class="t" x="1020" y="524" text-anchor="middle">Rebuild + audit</text><text class="s" x="1020" y="542" text-anchor="middle">counters: replay the log from an offset</text><text class="s" x="1020" y="558" text-anchor="middle">bill: every line → one ledger row</text>'
    + '<path class="ln" d="M1020 444V500"/>'
    + '</svg><figcaption>The reference design: approximate things at the edge (regional counters, the lease), one exact thing in the middle (the ledger, whose primary key is the never-double-count guarantee), and everything else derived from it. Dotted lines are periodic or asynchronous; the highlighted box is the only store the bill depends on.</figcaption></figure>',
  sections: [
    { id: "round", title: "The round: forty-five minutes, in order", intro: "Each card is the next thing the interviewer asks. Answer out loud before reading.", items: [
      { q: "\"Design metering and billing for an API product. Where do you start?\"",
        a: "<p>Verbs: <b>admit</b> a request against a per-key rate limit, <b>meter</b> its tokens, <b>show</b> usage this minute, <b>bill</b> monthly. Then the nonfunctional list, said as numbers: scalability (requests per second and events per second, with the write-heavy ratio), latency (admission under 1 ms added to a request that takes seconds), durability (an acknowledged request is never lost from the ledger), CAP split <b>per component</b>: the rate limit and the spend cap may be approximate and stay available; the bill may not be approximate and waits for the home region. Compliance: the bill must be auditable line by line. Say the invariant the prompt repeats: <b>no request is charged twice.</b></p>",
        followups: [
          { q: "\"Which load parameter is the architecture sensitive to?\"", a: "<p><b>Requests per second</b>, because every request is one ledger row and one counter increment; tokens only change row width. The second parameter is keys per customer and customers per region, which sets how coarse a budget lease can be.</p>" },
          { q: "\"You said consistent, not available. For the whole system?\"", a: "<p>No. Say it per component. Enforcement is approximate by design, so it must stay available under a partition (serve against the lease you hold). The bill is exact, so its writes wait for the home region. One system, two consistency models, named out loud.</p>" }
        ],
        line: "admit, meter, show, bill; the cap and the rate limit are approximate at the edge, the bill is exact in one ledger." },
      { q: "\"Give me the numbers.\"",
        a: "<p>Assume ~10k requests/s average, 5× peak → <b>50k/s</b>; one usage event each, ~200 bytes → 2 MB/s, ~170 GB/day in the log, retained 90 days. The ledger adds ~300 bytes per request → ~250 GB/month, kept forever for audit, so tier old months to object storage. Tokens: a request is a few thousand; at a blended <b>$10 per million tokens</b>, $100 buys 10M tokens, $1M buys 100B. Verdict: counters are <b>cheap</b> (Redis per region), the log is <b>medium</b>, the ledger is <b>cheap to write and medium to keep</b>.</p>",
        followups: [
          { q: "\"Could one Postgres take the ledger writes?\"", a: "<p>50k inserts/s at peak is past one node's comfortable write rate, so shard the ledger by api_key within the home region: every query carries the key (dedup, dashboard, bill by customer via the key's customer). Region is not the shard key; it's where the key's shard lives.</p>" }
        ],
        line: "50k requests/s at peak, one row and one event each; shard the ledger by api_key; a blended $10 per million tokens for the napkin." },
      { q: "\"Where does each piece of data live, and what query is it good at?\"",
        a: "<table><thead><tr><th>Data</th><th>Store, shape</th><th>Query it serves</th></tr></thead><tbody><tr><td><b>Usage ledger</b></td><td>Postgres, B-tree, append-only, home region, PK <code>(api_key, request_id)</code>, index <code>(customer_id, completed_at)</code></td><td>the dedup insert; the monthly range scan per customer; audit by request id</td></tr><tr><td>Budget row</td><td>Postgres, one row per key: cap in tokens, leased, used</td><td>compare-and-set when a region asks for a lease</td></tr><tr><td>Regional counters</td><td>Redis per region, per key: RPM, TPM, lease remaining</td><td>increment and read on admission, microseconds; approximate; derived</td></tr><tr><td>Usage log</td><td>Kafka, key <code>(api_key, request_id)</code></td><td>fan to the ledger writer, the counters, the dashboard; replay from an offset</td></tr><tr><td>Dashboard</td><td>stream job → per-key per-minute rows (event time, 30 s watermark)</td><td>\"requests and tokens this minute\"</td></tr></tbody></table><p>Store the cap in <b>tokens</b>, not dollars, so admission compares like with like and price changes don't touch the hot path.</p>",
        followups: [
          { q: "\"Why Postgres for the ledger and not Cassandra?\"", a: "<p>The ledger needs a <b>uniqueness constraint</b> and a range scan per customer; Postgres gives both natively. Cassandra's write throughput isn't the bottleneck at 50k/s once sharded, and lightweight transactions for uniqueness cost more than the Postgres key.</p>" },
          { q: "\"Why not keep tokens as dollars?\"", a: "<p>Prices change and differ by model; tokens are the unit the serving layer produces. Convert once at billing time, where the price list is versioned, not on every admission.</p>" }
        ],
        line: "one exact store with a key, one budget row with a single writer, counters derived in Redis, the log in between." },
      { q: "\"A request is retried. How do you not charge it twice?\"",
        a: "<p>The client attaches an <b>idempotency key</b>: a random id per logical request that it keeps until it has a response, the way payment APIs do. The ledger's primary key is <code>(api_key, request_id)</code>; the ledger writer does <code>INSERT … ON CONFLICT DO NOTHING</code>. A retry inserts the same row and the key refuses it. No dedup cache, no lookup before the write: the write is the check, and a region failover loses nothing that was acknowledged because the key lives in the table.</p>",
        followups: [
          { q: "\"Why not hash the request body as the id?\"", a: "<p>Two identical prompts sent on purpose are two requests and both should be billed; a content hash would merge them. Deliberate duplicates are a <b>rate-limit</b> problem, not a billing one. The key is scoped by api_key, so two customers' ids never collide.</p>" },
          { q: "\"What if the client can't hold the id?\"", a: "<p>Then it can't safely retry at all; that's the contract. SDKs persist it in a local outbox until the response lands. Same pattern as a message client's send id.</p>" }
        ],
        line: "a client idempotency key plus a primary key on (api_key, request_id): the retry inserts the same row and the key refuses it." },
      { q: "\"The serving node crashes mid-stream. What does the customer see, what's the fix, what does it cost?\"",
        a: "<p>Sees: a response that stops; the SDK says \"try again\" and resends under the <b>same request_id</b>. Fix: while streaming, the serving layer <b>checkpoints</b> every N tokens and on disconnect; the last checkpoint becomes a ledger row with <code>status = partial</code> and the output tokens actually streamed. The retry lands on the existing row, so no double charge; the client's new attempt is a <b>new logical request with a new id</b>. Cost: two network trips and redone inference for the customer; one small event per N tokens for us. Billing the partial is a <b>product decision</b>: bill what was delivered, since the customer received those tokens.</p>",
        followups: [
          { q: "\"And a crash before the first token?\"", a: "<p>Insert the row with zero output and <code>status = failed</code> so the id is burned and the retry is clean; charge the input only if the policy says so (most APIs don't).</p>" }
        ],
        line: "checkpoint while streaming; a partial row under the same id; the retry can't double-charge; billing the partial is a policy, not a mechanism." },
      { q: "\"The customer sets a $1M cap. Three regions. How is it enforced without a cross-region hop per request?\"",
        a: "<p>The cap lives on a <b>budget row</b> in the key's home region: cap, leased, used. Each serving region holds a <b>lease</b>, a chunk of budget it may spend locally; admission checks the regional counter in microseconds. A region renews <b>asynchronously</b> every N seconds or when 80% of its lease is spent. The grant is <b>(cap − used) × that region's share of the customer's traffic</b>, so an 80%-US customer's US region gets big leases and Europe small ones, and leases shrink as the cap nears, which bounds the overrun. Enforcement is therefore approximate by one lease's worth, which is inside the tolerance.</p>",
        followups: [
          { q: "\"Why not one leader per customer for exactness?\"", a: "<p>It buys exactness on a thing the prompt said may be approximate, and pays with a cross-region hop on every request for every customer not in the leader's region. The lease moves the hop off the request path and onto a timer.</p>" },
          { q: "\"Equal thirds per region instead of proportional?\"", a: "<p>The busy region blows through its third, renews constantly, and eventually finds the global pool allocated to idle regions: starvation where the customer actually is. Proportional grants plus shrinking near the cap fixes both.</p>" }
        ],
        line: "a budget row with one writer, regional leases sized by (cap − used) × region share, renewed asynchronously; the hop is on a timer, not a request." },
      { q: "\"Regions. What's the leader, what's replicated, what's the shard key?\"",
        a: "<p>Partitioned single-leader: the ledger and the budget row for a key live in the key's <b>home region</b> (the customer's majority region), sharded by <code>api_key</code>; other regions hold async read replicas, seconds behind. Counters are per region and never replicated; they're derived. The log is regional too, with the ledger writer in the home region consuming the home shard.</p>",
        followups: [
          { q: "\"Network partition between a serving region and the home region.\"", a: "<p>The serving region spends the lease it holds, then <b>pauses admission</b> for keys whose lease is exhausted (the customer sees 429s with a retry-after); the home region continues unaffected. Events queue in the regional log and drain when the link returns; the ledger stays exact because the insert is idempotent. That is choosing availability for serving up to one lease, consistency for the bill.</p>" }
        ],
        line: "home region per key, shard by api_key, async replicas; under a partition spend the lease you hold, then pause." },
      { q: "\"The dashboard says 'this minute'. Who serves it, who patches it, who rebuilds it?\"",
        a: "<p><b>Serves:</b> a per-key per-minute table written by a stream job over the usage log, windowed by <b>event time</b> with a 30-second watermark. <b>Patches:</b> the same job, as late events arrive (corrections allowed). <b>Rebuilds:</b> replay the log from an offset, or re-aggregate from the ledger for any range; the dashboard is never a source of truth. Lag of a few seconds is inside \"this minute\".</p>",
        followups: [
          { q: "\"And the regional counters, if Redis is lost?\"", a: "<p>Same answer: rebuild from the log offset for the current window, and until then admit conservatively (a fresh small lease). Nothing in the bill depends on them.</p>" }
        ],
        line: "the dashboard and the counters are derived from the log; replay rebuilds them; the ledger is the only truth." },
      { q: "\"How is the monthly bill produced, and how does a customer audit it?\"",
        a: "<p>A monthly job <b>folds the ledger</b>: for each customer, sum input and output tokens by model over <code>completed_at</code> in the month, price with the versioned price list, and write an invoice that is <b>idempotent by (customer, month)</b> so a re-run can't bill twice. Audit: every invoice line maps to a set of ledger rows, each with its request id, so a customer can ask \"show me the requests behind this line\" and get them. The ledger is append-only; corrections are new rows (credits), never edits.</p>",
        followups: [
          { q: "\"A region failed over on the 31st. Is the bill right?\"", a: "<p>Yes, once the regional log drains into the ledger; the job runs after a <b>completeness check</b> (every region's log offset for the month is consumed), not at midnight by the clock. Cutoffs are log offsets, not timestamps.</p>" }
        ],
        line: "the bill is a fold over the ledger, idempotent by (customer, month), run after the log is complete, auditable row by row." },
      { q: "\"What would you measure first?\"",
        a: "<p><b>Drift</b> between the regional counters and the ledger (the approximate side cheating the exact side), and <b>lease starvation</b>: how often a region's lease runs dry before renewal. Then ledger insert p99 and the dashboard's watermark lag.</p>", followups: [],
        line: "counter-vs-ledger drift and lease starvation first; they prove the two models are living together." },
      { q: "\"Closing tradeoffs: half the budget, ten times the scale, one thing you'd cut.\"",
        a: "<p><b>Half:</b> one region; counters only in the home region; the dashboard at five-minute granularity. <b>Ten times:</b> more ledger shards by api_key, more serving regions each with its own log and counters, the billing fold as a batch job over tiered storage; the budget row and the primary key don't change. <b>Cut:</b> real-time \"this minute\" to \"last five minutes\" — the bill and the cap are untouched by it.</p>", followups: [],
        line: "half: one region; 10×: more shards and regions, the key unchanged; cut the per-minute dashboard first." }
    ]},
    { id: "mechanisms", title: "Mechanisms, re-asked against the design", intro: "The recap, as the interviewer pushing on each choice.", items: [
      { q: "\"A unique key versus a dedup cache.\"", a: "<p>The cache is a second store that can disagree with the first and needs its own rebuild. The key lives in the table the bill reads, so the guarantee and the data are the same thing. One store, one constraint.</p>", followups: [], line: "the write is the check." },
      { q: "\"A lease versus a central counter.\"", a: "<p>A central counter is exact and a hop per request; a lease is approximate by one chunk and a hop per timer. The prompt priced the tolerance; take it.</p>", followups: [], line: "approximate by one lease, on purpose." },
      { q: "\"Outbox versus writing the ledger from the serving node.\"", a: "<p>The serving node writing Postgres directly across a region boundary couples inference latency to the ledger; the outbox makes the event durable locally and lets a consumer insert idempotently. Exactly-once is constructed: idempotent insert plus replay.</p>", followups: [], line: "durable locally, idempotent at the sink." },
      { q: "\"Event time versus processing time for 'this minute'.\"", a: "<p>Event time, from the serving node's completion timestamp, with a watermark; otherwise a slow region shifts usage into the wrong minute and the dashboard disagrees with the bill's month boundary.</p>", followups: [], line: "event time with a watermark; cutoffs are offsets." }
    ]},
    { id: "followups", title: "Interviewer follow-ups", intro: "The pushes that come after the design is on the board.", items: [
      { q: "\"Cached input tokens are priced lower. Where does that go?\"", a: "<p>A third column on the ledger row (cached_input_tokens) and a third price in the versioned list; the serving layer already knows which prefix hit the cache. Nothing structural changes.</p>", followups: [], line: "one more column, one more price." },
      { q: "\"A customer disputes a line.\"", a: "<p>Return the ledger rows behind it, with request ids and timestamps; issue a credit as a new row. Never edit history.</p>", followups: [], line: "credits are rows; history is immutable." },
      { q: "\"Someone hammers the API with identical prompts.\"", a: "<p>Billed every time, by design; the rate limit is what stops them. Serving a cached response for repeated prompts is a product feature with its own price, not a dedup rule.</p>", followups: [], line: "duplicates are a rate-limit problem; billing stays dumb." }
    ]}
  ],
  takeaways: [
    "Say the two guarantees apart in the first five minutes: enforcement approximate at the edge, the bill exact in the ledger.",
    "The never-double-count guarantee is a primary key on (api_key, request_id) with a client-supplied idempotency key. No dedup cache.",
    "Store the cap in tokens; convert to dollars once, at billing time, with a versioned price list.",
    "Leases sized by (cap − used) × region share, renewed on a timer; the cross-region hop is never on a request.",
    "Checkpoint while streaming; a crash leaves a partial row under the same id; billing the partial is a policy.",
    "Counters and the dashboard are derived from the log and rebuilt by replay; the ledger is the only truth.",
    "Shard the ledger by api_key within the key's home region; region is where a shard lives, not the key.",
    "The monthly bill is a fold over the ledger, idempotent by (customer, month), run after a completeness check, not by the clock.",
    "Give three numbers before you draw: requests per second, events per second, bytes in the ledger.",
    "Close with half, ten times, and the one thing you'd cut; a design that ends at the billing job ended early."
  ]
});
