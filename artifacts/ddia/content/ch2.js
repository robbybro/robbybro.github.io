window.DDIA = window.DDIA || {chapters:[], viz:[], system:null};
window.DDIA.chapters.push({
  n: 2, title: "Defining Nonfunctional Requirements",
  worksheet: "https://docs.google.com/document/d/1_jK3Wj0yrHR-6LqE9QdNQcJGF1XXG9UzAFvy8DisE4g/edit",
  why: "Every design round opens with \"what are the requirements?\" and the candidate who answers with <b>numbers</b> (writes per second, p99, how many nines) instead of adjectives is the one who gets the staff-level follow-ups. This chapter is the vocabulary for those first five minutes: load parameters, percentiles, faults versus failures, scaling, maintainability. The round below is the opening of the messaging-system design that every later chapter builds on.",
  jargon: [
    ["Nonfunctional requirement", "What the system must <i>be</i> (fast, available, cheap, changeable) as opposed to what it must <i>do</i> (send a message)."],
    ["Load parameter", "A number describing how hard the system is pushed: requests per second, fan-out per post, reads per write, followers per user. The x-axis of the graph. Not the target."],
    ["Performance target / SLO / SLA", "A performance target is what you promise, the y-axis. An SLO (service level objective) is the target written with a percentile and a window: \"p99 under 200 ms, 99.9% of minutes per month.\" An SLA adds a contract and a penalty."],
    ["Fan-out", "How many downstream reads or writes one action triggers. Fan-out on write = precompute each recipient's view at send time. Fan-out on read = query at load time."],
    ["Throughput / response time / latency", "Work per second; what the client sees end to end; the waiting part only. The book keeps the last two apart."],
    ["Percentile (p50, p95, p99, p999)", "The response time that 50 / 95 / 99 / 99.9% of <i>requests</i> beat. p50 is the median. p99 is \"one in a hundred is slower than this.\""],
    ["Tail latency amplification", "One user request fans out to many backend calls, so the user sees the slowest one. With 20 calls, a p99 backend is hit on 1 − 0.99<sup>20</sup> ≈ 18% of requests."],
    ["Head-of-line blocking", "A few slow requests hold up the queue, so fast requests behind them get slow too."],
    ["Fault vs failure", "A fault is one component misbehaving. A failure is the system as a whole not doing its job. Fault tolerance = faults don't become failures."],
    ["Cascading failure", "One component's fault overloads its neighbours, which then fault, and so on. Retry storms are the classic cause."],
    ["Shared-memory / shared-disk / shared-nothing", "One machine, all cores see one RAM (scale <b>up</b>) · many machines, one storage array · each node owns its data, coordination over the network (scale <b>out</b>)."],
    ["Elasticity", "Adding and removing capacity automatically as load changes."],
    ["Operability / simplicity / evolvability", "The three pillars of maintainability: easy to keep healthy, free of accidental complexity (usually via a good abstraction), easy to change."],
    ["Outbox + idempotency key", "The client persists the send locally and retries with the same message ID until the server acks; the server dedupes on the ID. The standard answer to \"the request was lost.\""]
  ],
  sections: [
    { id: "round", title: "The round: a messaging system for a billion daily users", intro: "The interviewer's prompt and the first five minutes. Each card is the next thing they ask; the follow-ups are where they push.", items: [
      { q: "\"Design a messaging system for a billion daily users. Where do you start?\"",
        a: "<p>Functional requirements as three to five verbs: send 1:1 and group messages, deliver to every device, sync history, media. Then nonfunctional requirements <b>as numbers</b>, not adjectives: sends per second, recipients per message, p99 delivery, what must never be lost, retention, regions. Separate the <b>load parameters</b> (how hard the system is pushed, the x-axis) from the <b>targets</b> (what you promise, the y-axis), and name the load parameter the <i>architecture</i> is sensitive to before the one you would optimize.</p>",
        followups: [
          { q: "\"Which single number is <i>the</i> load parameter here?\"", a: "<p><b>Recipients per message.</b> It multiplies every downstream cost (inbox writes, pushes, storage, sync), it has a tail (groups cap at 250, broadcast channels do not), and users choose it per message. Sends per second sizes the front door; recipients per message decides the architecture.</p>" },
          { q: "\"Why not p99 as the load parameter?\"", a: "<p>p99 is a target, the y-axis. A load parameter is something the world does to you; a target is something you promise back. Putting the target on the x-axis is the tell that the two are confused.</p>" }
        ],
        line: "load parameters describe the load, targets describe the promise; name the parameter the architecture is sensitive to." },
      { q: "\"Give me the numbers. Sends per second, average and peak.\"",
        a: "<p>10 messages per user per day → 10B/day → <b>~116k sends/s average</b>. Peak is hours or minutes, never a day: a global app is smoothed by time zones, so the sustained peak hour is ~3× average, and the known worst case is New Year's Eve rolling through time zones at ~10× a region's baseline. <b>Size for 5× average, ~600k/s</b>, with the reason attached.</p>",
        followups: [
          { q: "\"Why not size for the 10×?\"", a: "<p>Because 10× is one region for one hour, not the fleet for a day. Capacity is sized on the aggregate peak; the regional spike is handled by headroom plus load shedding of the degradable features (presence, typing indicators), which is cheaper than idle hardware the other 364 days.</p>" }
        ],
        line: "116k sends per second average; peaks are hours, so 5× is the sizing number and New Year's Eve is the story." },
      { q: "\"What's the read-to-write ratio?\"",
        a: "<p>In messaging a \"read\" is mostly a <b>delivery</b>: the message is written into each recipient's inbox and pushed at send time. A 10-person group is read by 9 recipients on ~1.5 devices each, so call it <b>5:1 to 6:1</b>, and say what it really is: a <b>write-amplification factor</b>. 116k sends/s becomes ~600k inbox writes/s, 3M at peak.</p>",
        followups: [
          { q: "\"A broadcast channel gets a million subscribers. What breaks?\"", a: "<p>Fan-out on write for that sender means a million inbox writes per post. The tail needs its own path: mark high-fan-out senders, skip materializing their messages, and have each subscriber's read merge the materialized inbox with a live query against those channels. Same hybrid a social feed uses for celebrities; it costs every read's p99 forever.</p>" }
        ],
        line: "the ratio is really write amplification, and recipients per message is what sets it." },
      { q: "\"Set the p50 and p99 for message delivery.\"",
        a: "<p>One number hides two populations, so split them. <b>Server-side</b>: p99 under 300 ms from receipt to push handoff, entirely ours. <b>Client-observed, recipient online</b>: p50 under 500 ms (two radio hops), p99 under 5 s, dominated by push wake-up latency that belongs to Apple and Google. <b>Recipient offline</b>: not a latency metric at all; measure time-to-sync after reconnect, and what matters is nothing is lost.</p>",
        followups: [
          { q: "\"Measured where, the server or the client?\"", a: "<p>The client, because that is what users see and the server number excludes queueing and network. One rule for load tests: the generator keeps sending on schedule and never waits for slow responses, or the slow ones are undercounted and the p99 flatters you.</p>" },
          { q: "\"Why p99 and not the mean?\"", a: "<p>The mean is pulled by outliers and hides the tail; the median hides it on purpose. The tail is often the heaviest, most valuable users. Say p99, then say what it does not tell you: it is per request not per user, it cannot be averaged across hosts, and it says nothing about the 1% past it.</p>" }
        ],
        line: "measure at the client, set targets on what you control, and split online from offline before quoting a number." },
      { q: "\"Which faults must not become failures? Name three.\"",
        a: "<p>The contract is the user's: a message acknowledged to the sender reaches every recipient exactly once, eventually. Three faults that must stay faults: <b>hardware</b>, a node dies after the ack, so ack only after the write is replicated and run delivery from a durable queue; <b>network</b>, the send is lost or times out, so <b>client outbox + idempotency key</b>, retried until acked, deduped server-side, so it is neither lost nor duplicated; <b>dependency</b>, the push provider is down, so the push is a hint, the message is durable, and the client syncs on open.</p>",
        followups: [
          { q: "\"What's allowed to degrade?\"", a: "<p>Typing indicators, presence, read and delivery receipts, media quality, ordering by seconds. Never the durability contract. Saying the degradable list out loud is what makes the \"never\" list credible.</p>" },
          { q: "\"Everyone retries at once. Now what?\"", a: "<p>That is how a fault cascades: a retry storm overloads the neighbour that was recovering. Exponential backoff with jitter, collapse duplicate retries per conversation, and a durable source of truth the client can resync from, so a retry is cheap and bounded rather than a second copy of the load.</p>" }
        ],
        line: "a fault is a component, a failure is the contract; design the place the request waits while it retries." },
      { q: "\"Retention and storage growth per year.\"",
        a: "<p>Anchor on the rate you already have; growth is the derivative. 10B/day × 365 = <b>3.65 trillion messages/year</b>, ~3.65 PB at 1 KB each (text is ~300 B, round up). <b>Media dominates</b>: 10% of messages × 500 KB = 500 TB/day ≈ 180 PB/year. Multiply everything durable by 3 for replication. The message index is petabytes, the media is exabytes, and they are different systems: a database for the index, object storage plus a CDN for the bytes.</p>",
        followups: [
          { q: "\"What's the only lever on that number?\"", a: "<p>Retention policy. Keep-forever is the default and the expensive one; disappearing messages are the exception; old media can go cold (cheaper tier, slower first byte). Nothing in the architecture shrinks the number; only the product decision does.</p>" }
        ],
        line: "petabytes of index, exabytes of media, different systems; retention is the lever." },
      { q: "\"What would you NOT build on day one?\"",
        a: "<div class=\"tbl\"><table><tr><th>Step</th><th>Day one?</th><th>Why</th></tr><tr><td><b>Multi-region active-active</b></td><td>No</td><td>Two regions accepting writes for one conversation means conflict resolution (chapter 6's hardest section). Day one: one write region per conversation, a replica elsewhere for disaster recovery.</td></tr><tr><td>Broadcast-channel path</td><td>No</td><td>The tail does not exist until someone has a million subscribers.</td></tr><tr><td>Sharding the message store</td><td>Probably not</td><td>Partition by conversation ID on one big database first; sharding early means rebalancing and routing before you know the hot key.</td></tr><tr><td>Elastic auto-scaling</td><td>No</td><td>Manual capacity with 5× headroom beats a scaling loop that misfires during the spike it exists for.</td></tr><tr><td>Durable, replicated message store</td><td>Yes</td><td>\"Acknowledged means delivered.\"</td></tr><tr><td>Object storage + CDN for media</td><td>Yes</td><td>Media is 98% of bytes; putting it in the database is the mistake you cannot undo.</td></tr></table></div>",
        followups: [
          { q: "\"So what is day one?\"", a: "<p>\"I'd build for about 10× current load with a plan for the next 10×, because the thing that changes at the next order of magnitude is <i>which</i> parameter matters.\" And shrink the numbers first if asked: nothing drawn for a billion users is day one.</p>" }
        ],
        line: "name the step you would defer, not the principle; active-active is the one to say." },
      { q: "\"Which requirement changes the whole design if I flip it?\"",
        a: "<p><b>End-to-end encryption.</b> If the server cannot read contents, server-side search, spam detection, link previews and moderation are gone or move to the client; multi-device becomes key distribution and a new device cannot see history unless another device hands it over; history is only as durable as the keys; backups need a separate encrypted-backup design.</p><div class=\"tbl\"><table><tr><th>Other flips</th><th>What changes</th></tr><tr><td>Strict ordering within a conversation, identical on every device</td><td>One leader per conversation assigning sequence numbers. Kills active-active for good.</td></tr><tr><td>Disappearing messages by default</td><td>The durable store becomes a short-lived buffer; retention, backups and \"acknowledged means stored forever\" invert.</td></tr><tr><td>Data residency</td><td>Partition by jurisdiction, not by conversation; a cross-border group is a legal question first.</td></tr></table></div>",
        line: "know which requirement everything rests on, and say it before the interviewer flips it." }
    ]},
    { id: "mechanisms", title: "Mechanisms, probed on the design", intro: "The chapter's tradeoffs, asked as the interviewer would ask them: when you choose it, where it breaks.", items: [
      { q: "\"You keep quoting p99. Where does p99 mislead you?\"",
        a: "<p>Four places. <b>Requests are not users</b>: a screen fanning out to 20 calls hits a p99 backend on ~18% of loads, tail latency amplification. <b>Small samples</b>: 100 requests in a window makes the p99 one request; per-endpoint p99 on quiet paths is noise. <b>You cannot average percentiles</b>: the p99 of ten servers is not the mean of their p99s; aggregate full histograms (HdrHistogram, t-digest). <b>It says nothing about the 1%</b>: the tail past p99 may be 2× or 100× slower, and if that 1% is your biggest customers, look at p999 or max, knowing p999 gets expensive fast.</p>",
        line: "p99 breaks when requests fan out, when samples are small, when someone averages it, and when the 1% is who you care about." },
      { q: "\"Why scale out instead of one big box?\"",
        a: "<p>Scale out when one machine hits a ceiling on cost or a physical resource, when it is a single point of failure, or when users must be served near where they are; fault tolerance is the reason the chapter leads with. Where it breaks: <b>complexity moves into the application</b> (partial failure, replication lag, cross-node consistency, chapters 6 through 10); <b>coordination can make N machines slower than one</b>, every hop is a round trip; <b>big machines got cheap</b>, the second edition softens the first edition's argument and premature scale-out is the commoner mistake; <b>ops cost multiplies</b>, ten machines is ten times the deploys and the 3am pages unless the platform absorbs it.</p>",
        followups: [
          { q: "\"We doubled the fleet and throughput didn't move. Why?\"", a: "<p>The bottleneck is not the thing you doubled: a single leader taking all writes, a shared database, a lock, a hot partition, or coordination overhead growing with node count. Scale-out only helps the part that partitions. Find the load parameter the architecture is sensitive to.</p>" }
        ],
        line: "scale-out breaks when the workload doesn't partition, when coordination outweighs the parallelism, and when one big box would have done it." },
      { q: "\"You have text, photos and disappearing messages. One message envelope or three code paths?\"",
        a: "<p>One abstraction when the cases share a <i>shape</i> and differ only in data, when the same bug keeps getting fixed three times, and when the fourth case is coming; wait until you have three, because two is a coincidence. Where it breaks: <b>the fourth case does not fit</b>, voice notes need streaming upload and now the envelope grows <code>if type == voice</code> inside it, the three special cases back behind an interface that pretends they are gone; <b>the abstraction hides a cost</b>, an ORM turns one page load into 200 queries; <b>too early</b>, abstracting from one case bakes in a guess.</p>",
        line: "abstract when the cases share a shape and differ in data; it breaks when the next case doesn't fit or the clean interface hides an expensive mechanism." },
      { q: "\"One database replica is slow. What does the user see, and what do you change?\"",
        a: "<p>A tail question dressed as operations. A slow (not dead) follower keeps passing health checks and keeps getting 1/N of reads. <b>What the user sees</b>: p50 unchanged, p99 jumps, and with fan-out nearly every screen touches it (20 reads → 1 − 0.9<sup>20</sup> ≈ 88%). If it is slow because it is <i>behind</i>, users also see stale data: the message they just sent is missing from the thread. A slow node is worse than a dead node (gray failure, chapter 9). <b>What you change</b>: per-replica latency histograms, not fleet averages; health checks on latency, not liveness; hedged requests (re-send to a second replica after the p95 time, take the first answer); route freshness-sensitive reads to the leader or a caught-up replica (read-your-writes, chapter 6); then fix the box.</p>",
        line: "a slow node is worse than a dead one; health-check on latency and hedge the reads." },
      { q: "\"Contrast with a social feed. What changes?\"",
        a: "<p>The load parameter becomes the <b>followers-per-user distribution</b>, because it sets the fan-out. The classic numbers: a ~300k:5k read-to-write ratio chose <b>fan-out on write</b> (materialize each follower's timeline at post time, write amplification for cheap reads); the mean of 75 followers sized it (~350k timeline writes/s); the 30-million-follower tail forced a hybrid, fan-out on read for a few accounts, merged into every timeline read. Inactive users get no materialized timeline at all.</p>",
        followups: [
          { q: "\"A celebrity with 50 million followers posts. Walk me through it.\"", a: "<p>50 million timeline writes for one post, arriving as a burst: write amplification with a face on it. The hybrid: mark high-follower accounts, skip materializing for them, and have every timeline read merge the materialized list with a live query for the celebrities the user follows. A small change in code, a permanent cost on every read's p99.</p>" }
        ],
        line: "reads-to-writes decided the architecture, the mean decided capacity, the tail decided the exception." },
      { q: "\"The three pillars of maintainability, applied to this design.\"",
        a: "<p><b>Operability</b>: client-observed p99 per screen, per-replica latency, replication lag, delivery-queue depth, push-provider error rates, synthetic end-to-end sends, alerts on SLO burn rate rather than raw thresholds. <b>Simplicity</b>: one message envelope, one conversation-owner path, media out of the database. <b>Evolvability</b>: the flips table above is the list of things the schema and the ownership model must not make impossible; end-to-end encryption is the one to design for even if it is not day one.</p>",
        followups: [
          { q: "\"How would you know this system is healthy at 3am without a human looking?\"", a: "<p>The operability list, measured as a real user would: a synthetic send from one region to another, acknowledged and delivered within the client SLO, every minute. If that passes and the burn-rate alerts are quiet, nobody wakes up.</p>" }
        ] }
    ]},
    { id: "followups", title: "Interviewer follow-ups", intro: "The pushes that come after the design is on the board.", items: [
      { q: "\"Your p99 is 200 ms but users complain the app is slow. What's going on?\"",
        a: "<p>Ask which p99, measured where, aggregated how. Tail latency amplification: a screen fanning out to many calls hits the tail far more often than 1%. Or p99 is server-side and the client's number includes queueing and network. Or the p99 is averaged across hosts and one host is terrible. Or the slow 1% is the users who matter.</p>" },
      { q: "\"Which requirement would you drop first if I cut your budget in half?\"",
        a: "<p>Everything on the degradable list: presence, typing indicators, receipts, media quality, multi-region latency. Never the durability contract, never exactly-once delivery. Say what you would keep before what you would drop.</p>" },
      { q: "\"Your SLO is 99.9%. What does that mean in minutes, and who decides it?\"",
        a: "<p>About 43 minutes of budget a month. The SLO is set with product from what users notice and what the business promises, then engineering owns the error budget: when it is spent, reliability work pre-empts features. Write it with a percentile and a window, never as \"fast and reliable.\"</p>" },
      { q: "\"Give me one number you'd want on a dashboard that most teams don't have.\"",
        a: "<p>Client-observed delivery latency split by recipient state (online, backgrounded, offline-then-synced). The server-side number is the one every team has, and it is the one that cannot see the push provider or the radio.</p>" },
      { q: "\"Where did your estimate go wrong, if it did?\"",
        a: "<p>The two classic misses: computing storage from the growth increment instead of the base (off by 100×), and quoting a peak as a multiple of a day instead of an hour. Both are caught by saying the units out loud.</p>" }
    ]}
  ],
  takeaways: [
    "<b>Load parameters go on the x-axis; targets go on the y-axis.</b> Name the parameter the architecture is sensitive to, not the one you'd optimize.",
    "<b>Mean sizes, tail decides.</b> The mean of a distribution sizes capacity; its tail forces the exception path. Say both.",
    "<b>p99 is per request, not per user.</b> Fan-out turns a 1% tail into an every-screen problem; percentiles can't be averaged; the 1% may be the customers.",
    "<b>Measure at the client, set targets on what you control.</b> Split server-side, client-online, and offline into separate numbers.",
    "<b>A fault is a component; a failure is the contract.</b> Design the place the request waits while it retries (outbox + idempotency key), or a fault becomes a failure.",
    "<b>Retries contain faults and also cascade them.</b> Backoff, collapse, and a durable source of truth the client can resync from.",
    "<b>Anchor estimates on the rate you already have.</b> Growth is the derivative. Media dominates bytes; text is a rounding error.",
    "<b>Shared-memory / shared-disk / shared-nothing.</b> Scale out for fault tolerance and physical ceilings; it breaks when the workload doesn't partition or coordination beats parallelism.",
    "<b>Name the step you'd defer, not the principle.</b> Multi-region active-active is the one to say; durable replicated store and object storage for media are day one.",
    "<b>Know which requirement everything rests on.</b> For a messaging product it's end-to-end encryption; ordering, ephemerality, and residency are the other flips."
  ]
});
