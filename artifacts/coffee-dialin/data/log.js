window.DIALIN = {
 "generated_at": "2026-10-30T07:14-07:00",
 "source": "postgres claude: coffee_bags, coffee_shots, coffee_experiments, kv coffee-dialin, coffee_* (untamped), kv marzocco-telemetry",
 "rules": {
  "_doc": "Espresso house rules for Balthamos (Linea Mini R) + Zerno Z2. SOURCE OF TRUTH since 2026-10-10 (the Coffee Dial-In sheet is retired; its Reference tab is preserved verbatim in `sections`). Shots live in coffee_shots, bags in coffee_bags (data.dialin). Edit `laws`/`priors`/`rules` here; the public page renders `sections` and these fields.",
  "laws": {
   "timing": "clock starts at pump start and INCLUDES the 5 s pre-brew (3 on / 2 off); target 30–35 s total (classic 25–30 + 5); Robby's sweet spot is 30–32 s total (reaffirmed 2026-10-11 — he subtracts the 5 s himself, so never quote a flow-only number back to him)",
   "prebrew": {
    "on_s": 3,
    "off_s": 2,
    "always_on": true
   },
   "cut_at_g": {
    "slow_flow": 33.5,
    "normal_flow": 34
   },
   "espresso_ratio": 2.05,
   "pourover_ratio": 16,
   "espresso_dose_g": 18,
   "espresso_yield_g": 37
  },
  "burrs": {
   "owned": [
    "Core",
    "SSP Lab Sweet"
   ],
   "installed": "Core"
  },
  "links": [
   [
    "Zerno FAQ",
    "https://zerno.co/pages/faq"
   ],
   [
    "espressoAF Zerno",
    "https://espressoaf.com/manufacturers/zerno/z1.html"
   ]
  ],
  "power": "20 A circuit shared by Mini + fridge + Z2: grind above 400 RPM only with the Mini in standby until the grinder moves circuits",
  "water": {
   "url": "https://robbybro.com/marzocco-water/",
   "base": "distilled",
   "note": "chloride-free: all hardness from Epsom salt (MgSO4·7H2O), alkalinity from baking soda; inside La Marzocco spec (hardness 70–100, alkalinity 40–80, chloride <30 ppm)",
   "hardness_ppm": 75,
   "alkalinity_ppm": 47,
   "epsom_g_per_gal": 0.7,
   "baking_soda_g_per_gal": 0.3
  },
  "priors": {
   "note": "then dial grind at one RPM until time is in window; only then bracket RPM",
   "espresso_blend": {
    "microns": 180
   },
   "sugarcane_decaf": {
    "rpm": 400,
    "microns": 140
   },
   "light_single_origin": {
    "microns": "165–170"
   }
  },
  "grinder": "Zerno Z2",
  "machine": "Linea Mini R (Balthamos)",
  "glossary": [
   [
    "Next up",
    "the queue of shots planned for this bag, newest plan first — grind, motor speed and grams in. Pull the top one; logging that shot clears it. When a bag runs out, tell Robby and the whole queue is cleared."
   ],
   [
    "µm",
    "grind size on the Zerno Z2 dial, in microns (real microns, 0–2000; lower = finer)"
   ],
   [
    "RPM",
    "grinder motor speed; set per bag (decaf 400, Ghost Rider 1200, new bags start at 1000)"
   ],
   [
    "cut at 34",
    "stop the shot when the scale under the cup reads 34 g — drip lands it at ~36–37 g"
   ],
   [
    "time",
    "seconds from pressing brew, INCLUDING the 5 s pre-brew (3 s on, 2 s pause); target 30–35 s"
   ],
   [
    "ratio",
    "grams out ÷ grams in; the house law is 1:2.05 (18 g in → ~37 g out)"
   ],
   [
    "RDT",
    "Ross droplet technique — one or two sprays of water on the beans before grinding, kills static and clumps"
   ],
   [
    "WDT",
    "Weiss distribution technique — stirring the grounds in the basket with thin needles before tamping; here an orbital raker"
   ],
   [
    "PF",
    "portafilter, the basket handle"
   ],
   [
    "Core / Lab Sweet",
    "the two burr sets owned for the Z2; Core is installed"
   ],
   [
    "GR",
    "Ghost Rider, the Proud Mary espresso blend"
   ],
   [
    "VdC",
    "Valle del Cauca, the Push x Pull sugarcane decaf"
   ],
   [
    "EA",
    "ethyl acetate (sugarcane) decaffeination"
   ],
   [
    "masl",
    "metres above sea level, farm elevation"
   ],
   [
    "settled",
    "the bag has a final recipe; dialing in = still being adjusted"
   ],
   [
    "queued",
    "a planned next shot that has not been pulled yet"
   ]
  ],
  "pourover": {
   "rule": "4 for less dense, lower-elevation roasts; 5 for denser, high-altitude coffees",
   "ratio": "1:16 (kv laws.pourover_ratio)",
   "logged": "2026-10-10",
   "brewers": [
    {
     "use": "single cup",
     "name": "Kinto Slow Coffee Style",
     "water": "~360 g (12 oz) or ~480 g (16 oz) at 1:16",
     "scoops": "1.5 or 2",
     "coffee_g": "~22 or ~30"
    },
    {
     "use": "two cups",
     "name": "Chemex",
     "water": "~710 g (2 × 12 oz cups)",
     "scoops": 3,
     "coffee_g": "~45"
    }
   ],
   "grinder": "Fellow Ode Gen 2",
   "scoop_g": null,
   "scoop_note": "Robby thinks the scoop is ~1.5 tbsp (unweighed, 10/10). That is ~8–10 g of beans, which would put the Chemex at ~1:25 — so either the scoop is bigger than it looks or pourover runs weaker than the 1:16 law. Weigh one scoop to settle it (blocked item). Pourover precision is deliberately low: an A− cup for X+ effort is the standard.",
   "setting_range": "4–5"
  },
  "rpm_rule": {
   "why": "brittle beans (sugarcane decaf) → fewer fines wanted → low RPM; dense sweet blends → fines add body → high RPM",
   "new_bag": "dial grind at 1000 first, then bracket RPM per bean",
   "ghost_rider": 1200,
   "decaf_sugarcane": 400
  },
  "sections": [
   {
    "rows": [
     [
      "Espresso — Core",
      "150–200µm",
      "medium roasts ~170, light ~150, dark ~200"
     ],
     [
      "Espresso — Lab Sweet",
      "125–150µm",
      "light-roast burr; will drift over first 2–7kg seasoning"
     ],
     [
      "Pourover — Lab Sweet",
      "600µm",
      "community range 500–700"
     ]
    ],
    "title": "STARTING POINTS (Z2 dial = real microns, 0–2000)",
    "title_value": ""
   },
   {
    "rows": [
     [
      "Sour / gushing / fast",
      "go FINER ~10µm",
      ""
     ],
     [
      "Bitter / choking / slow",
      "go COARSER ~10µm",
      ""
     ],
     [
      "Adjust finer only with motor running",
      "",
      ""
     ],
     [
      "Re-zero after every burr swap: loosen knob 1–2 turns, run to first chirp, set dial to 0",
      "",
      ""
     ],
     [
      "RDT: 1–2 sprays max (more = clumps)",
      "",
      ""
     ]
    ],
    "title": "DIAL RULES",
    "title_value": ""
   },
   {
    "rows": [
     [
      "Zerno FAQ",
      "https://zerno.co/pages/faq",
      ""
     ],
     [
      "espressoAF Zerno",
      "https://espressoaf.com/manufacturers/zerno/z1.html",
      ""
     ],
     [
      "Owners settings spreadsheet",
      "https://docs.google.com/spreadsheets/d/1l_Q2Ebh48SsCl7b0TFkflBrK11kf-bfUthRuspAanuI/edit",
      ""
     ]
    ],
    "title": "LINKS",
    "title_value": ""
   },
   {
    "rows": [
     [
      "Clock starts at pump start and INCLUDES pre-brew",
      "",
      ""
     ],
     [
      "Pre-brew = 3s on + 2s off (5s total) → target 30–35s total",
      "classic 25–30s window + the 5s pre-brew",
      ""
     ]
    ],
    "title": "TIMING",
    "title_value": ""
   },
   {
    "rows": [
     [
      "Espresso dose",
      "18g",
      ""
     ],
     [
      "Espresso ratio",
      "1:2.05 (37g out) — cut at 34 on ~30s flow, 33.5 slower (amended 9/10 from 36g: the cup kept voting 37–38)",
      ""
     ],
     [
      "Pourover ratio",
      "1:16 (e.g. 20g → 320g water); 1:15 stronger, 1:17 lighter",
      ""
     ],
     [
      "Pre-brew",
      "3s on + 2s off, always on, counted in shot time",
      ""
     ]
    ],
    "title": "LAWS (fixed — not variables)",
    "title_value": ""
   },
   {
    "rows": [],
    "title": "VARIABLES (dial these)",
    "title_value": "grind µm (primary), RPM (per method, A/B first), water temp (later)"
   },
   {
    "rows": [],
    "title": "POWER (20A shared circuit: Mini + fridge + Z2)",
    "title_value": "Z2 solo is fine to 2000 RPM; trips = cumulative load. Grind >400 RPM only with Mini in standby, until grinder moves to another circuit."
   },
   {
    "rows": [
     [
      "Retired tools",
      "distributor (edge flow + bald middle, +4s), Weber blind shaker (clumps with RDT)",
      ""
     ]
    ],
    "title": "PREP CHAIN (as of 9/9)",
    "title_value": "weigh → RDT 1–2 sprays → shake beans → grind → orbital raker → tamp ×2 (twist at top) → pull"
   },
   {
    "rows": [
     [
      "Prior: espresso-roast blend",
      "start 180µm",
      ""
     ],
     [
      "Prior: lighter single origin",
      "start 165–170 (−10–15 vs blend)",
      ""
     ],
     [
      "Prior: sugarcane decaf",
      "start ~140 AND 400 RPM (−40 vs blend)",
      ""
     ],
     [
      "Then",
      "dial grind at one RPM until time is in window; only then bracket RPM per bean",
      ""
     ]
    ],
    "title": "NEW-BAG INTAKE (v1, 9/11)",
    "title_value": "log roaster/producer/region/variety/process/masl/roast date + MEASURE density (weigh 100mL beans → g/L)"
   }
  ],
  "variables": [
   "grind µm (primary)",
   "RPM (per bag; A/B first)",
   "water temp (later)"
  ],
  "dial_model": {
   "rpm": "+200 rpm = +4..+8 s at fixed grind (GR +4-5, Kuma +8); -400 rpm = -10..-13 s (Luna, Makeworth). RPM is worth about the same as 10-15 um",
   "as_of": "2026-10-29",
   "noise": "same setting repeats spread +-2-4 s (Ghost Rider 177 @1000: 27.7-31.7); steps under 10 um are inside noise, do not read them",
   "shape": "convex, not linear: far from the window (<22 s) 10 um finer buys ~1-3 s; inside ~5 s of the window it buys ~5-8 s (Luna @600: +0.9, +3.0, +8.4 s/10um on successive steps; VdC decaf @400: +0.5 then +6.7)",
   "source": "all pulled espresso shots in coffee_shots, within-bag pairs at fixed RPM + dose",
   "n_shots": 40,
   "per_variety": "unknown: too few bags per variety/process to separate; the window POSITION varies 125-225 um across bags, the near-window slope does not obviously",
   "coarse_prior": "big steps (>=15 um) across all bags: median +3.2 s per 10 um finer (range -2.5..+7.5); use as the first-move estimate only"
  },
  "dial_rules": [
   "sour / gushing / fast → finer ~10 µm",
   "bitter / choking / slow → coarser ~10 µm",
   "adjust finer only with the motor running",
   "re-zero after every burr swap: loosen knob 1–2 turns, run to first chirp, set dial to 0",
   "RDT 1–2 sprays max (more = clumps)"
  ],
  "prep_chain": [
   "weigh",
   "RDT 1–2 sprays",
   "shake beans",
   "grind",
   "orbital raker",
   "tamp ×2 (twist at top)",
   "pull"
  ],
  "new_bag_intake": "log roaster/producer/region/variety/process/masl/roast date + measure density (weigh 100 mL → g/L)"
 },
 "bags": [
  {
   "id": 6,
   "short_name": "Hyacinth Decaf",
   "label": "Hyacinth Coffee (Sea Wolf Bakers) — Decaf",
   "verdict": null,
   "noted_at": "2026-10-10 14:47:03.577224-07:00",
   "offering_id": null,
   "data": {
    "decaf": true,
    "house": true,
    "roast": "unknown (espresso-blend roaster, likely medium)",
    "dialin": {
     "burrs": "Core",
     "start": {
      "rpm": 400,
      "microns": 135
     },
     "settled": false,
     "start_note": "18 g → 36 g, cut at 34, aim 30–35 s total (decaf prior ~140 @ 400; VdC Decaf settled at 125)"
    },
    "logged": "2026-10-10",
    "opened": "2026-10-10",
    "vendor": "Sea Wolf Bakers",
    "process": "unknown decaf process",
    "roaster": "Hyacinth Coffee",
    "roaster_city": "Seattle, WA"
   },
   "shots": 1,
   "last_shot": {
    "id": 29,
    "shot_at": "2026-10-10T15:09:47.429041-07:00",
    "burrs": "Core",
    "microns": 155,
    "rpm": 500,
    "dose_g": 18,
    "yield_g": 35.3,
    "time_s": 29.8,
    "ratio": 1.96,
    "taste": "good crema; a little bitter straight, should be great with milk",
    "verdict": "in window, first shot",
    "next_change": "160 µm, or stay at 155 and drop to 400 rpm, for drinking it straight; for milk hold 155 @ 500",
    "by_whom": "Robby"
   },
   "queued": null,
   "queue": []
  },
  {
   "id": 7,
   "short_name": "Ghost Rider",
   "label": "Proud Mary — Ghost Rider (Brazil + Ethiopia, natural)",
   "verdict": null,
   "noted_at": "2026-08-31 12:00:00-07:00",
   "offering_id": 2296,
   "data": {
    "house": true,
    "roast": "Espresso (medium)",
    "dialin": {
     "rpm": 1200,
     "burrs": "Core",
     "recipe": "18g → 37g, ~35s total, 1200 RPM, no distributor (Core) — SETTLED 9/10; cut 34 fast/33.5 slow",
     "microns": 180,
     "settled": true
    },
    "opened": "2026-08-31",
    "process": "Brazil + Ethiopia, natural",
    "roaster": "Proud Mary"
   },
   "shots": 14,
   "last_shot": {
    "id": 18,
    "shot_at": "2026-09-10T12:17:00-07:00",
    "burrs": "Core",
    "microns": 180,
    "rpm": 1200,
    "dose_g": 18,
    "yield_g": 37,
    "time_s": 35.4,
    "ratio": 2.06,
    "taste": "a lot more balance, real depth",
    "verdict": "1200 RPM SETTLED for GR",
    "next_change": "cut 33.5 on slow shots (longer drip)",
    "by_whom": null
   },
   "queued": {
    "id": 31,
    "shot_at": "2026-10-10T17:39:21.004309-07:00",
    "burrs": "Core",
    "microns": 180,
    "rpm": 1000,
    "dose_g": 18,
    "next_change": "A/B shot A: 180 µm at 1000 rpm, 18 g in, cut at 34 — then shot B at 1200 rpm, same grind; expect A a few seconds faster"
   },
   "queue": [
    {
     "id": 31,
     "shot_at": "2026-10-10T17:39:21.004309-07:00",
     "burrs": "Core",
     "microns": 180,
     "rpm": 1000,
     "dose_g": 18,
     "next_change": "A/B shot A: 180 µm at 1000 rpm, 18 g in, cut at 34 — then shot B at 1200 rpm, same grind; expect A a few seconds faster"
    },
    {
     "id": 30,
     "shot_at": "2026-10-10T17:39:20.887536-07:00",
     "burrs": "Core",
     "microns": 180,
     "rpm": 1200,
     "dose_g": 18,
     "next_change": "A/B shot B: 180 µm at 1200 rpm, 18 g in, cut at 34 — pull right after shot A, taste both straight (and with milk)"
    }
   ]
  },
  {
   "id": 17,
   "short_name": "GR/Hyacinth 50:50",
   "label": "(blend) — GR/Hyacinth 50:50 (9g Ghost Rider + 9g Hyacinth Decaf, mixed pre-RDT)",
   "verdict": null,
   "noted_at": "2026-10-30 07:00:10.592764-07:00",
   "offering_id": null,
   "data": {
    "roast": "half-caf house blend",
    "dialin": {
     "start": {
      "rpm": 1200,
      "microns": 165
     },
     "settled": false
    },
    "opened": "2026-10-30",
    "process": "9g Ghost Rider + 9g Hyacinth Decaf, mixed pre-RDT",
    "roaster": "(blend)",
    "blend_of": [
     "Ghost Rider",
     "Hyacinth Decaf"
    ],
    "decaf_share": 0.5,
    "dialin_start_note": "Robby 2026-10-30: 165 µm at 1200 gets it in the right zone. Replaces GR/VdC 50:50 (Push x Pull VdC is gone). Midpoint rule would say ~158 (GR 180, Hyacinth ~135); his number wins until a shot says otherwise."
   },
   "shots": 0,
   "last_shot": null,
   "queued": {
    "id": 72,
    "shot_at": "2026-10-30T07:00:10.719365-07:00",
    "burrs": null,
    "microns": 165,
    "rpm": 1200,
    "dose_g": null,
    "next_change": "18 g in (9 g each), cut at 34, aim 30–32 s total. Robby: 165 @ 1200 is the right zone. If fast → 160; if slow → 170."
   },
   "queue": [
    {
     "id": 72,
     "shot_at": "2026-10-30T07:00:10.719365-07:00",
     "burrs": null,
     "microns": 165,
     "rpm": 1200,
     "dose_g": null,
     "next_change": "18 g in (9 g each), cut at 34, aim 30–32 s total. Robby: 165 @ 1200 is the right zone. If fast → 160; if slow → 170."
    }
   ]
  },
  {
   "id": 16,
   "short_name": "DAC Booze Cruise",
   "label": "DAC — Booze Cruise (Turrialba, Costa Rica, anaerobic natural Centroamericano)",
   "verdict": null,
   "noted_at": "2026-10-28 06:20:35.933985-07:00",
   "offering_id": null,
   "data": {
    "trip": "San Antonio Oct 23–27 2026",
    "notes": "purple grapes, cherry praline, brown sugar",
    "roast": "filter",
    "dialin": {
     "start": {
      "rpm": 1000,
      "microns": 168
     },
     "settled": false
    },
    "logged": "2026-10-28",
    "opened": "2026-10-28",
    "region": "Turrialba",
    "process": "anaerobic natural",
    "roaster": "DAC",
    "variety": "Centroamericano",
    "roast_date": "2026-10-02",
    "roaster_note": "roaster name per Robby (box shows only the coffee name); not in untamped",
    "origin_country": "Costa Rica",
    "dialin_start_note": "filter roast, anaerobic natural: light single origin prior 165–170 @ 1000; dial grind first, then bracket RPM. Elevation not on box, so no Ode setting yet",
    "roaster_in_untamped": false
   },
   "shots": 5,
   "last_shot": {
    "id": 70,
    "shot_at": "2026-10-30T06:49:24.898864-07:00",
    "burrs": null,
    "microns": 133,
    "rpm": 1000,
    "dose_g": 18,
    "yield_g": 37,
    "time_s": 29.4,
    "ratio": 2.06,
    "taste": null,
    "verdict": "in window (29.4 s total), a hair under the 30–32 aim; 133 landed where the bracket predicted",
    "next_change": "hold 133 @ 1000; taste decides (sour → 130, bitter → 136)",
    "by_whom": null
   },
   "queued": {
    "id": 71,
    "shot_at": "2026-10-30T06:49:25.021035-07:00",
    "burrs": null,
    "microns": 133,
    "rpm": 1000,
    "dose_g": null,
    "next_change": "18 g in, cut at 34, aim 30–32 s. Hold here. If it tastes sour/thin → 130; if bitter/drying → 136. Hit 29.4 s at 133 on 10/30."
   },
   "queue": [
    {
     "id": 71,
     "shot_at": "2026-10-30T06:49:25.021035-07:00",
     "burrs": null,
     "microns": 133,
     "rpm": 1000,
     "dose_g": null,
     "next_change": "18 g in, cut at 34, aim 30–32 s. Hold here. If it tastes sour/thin → 130; if bitter/drying → 136. Hit 29.4 s at 133 on 10/30."
    }
   ]
  },
  {
   "id": 15,
   "short_name": "Perdido Felipe Estela",
   "label": "Perdido — Felipe Estela (Cajamarca, Peru, washed Yellow Caturra)",
   "verdict": null,
   "noted_at": "2026-10-28 06:20:35.790734-07:00",
   "offering_id": null,
   "data": {
    "trip": "San Antonio Oct 23–27 2026",
    "grams": 250,
    "notes": "peaches, manuka honey, lime leaf",
    "roast": "light (filter-leaning single origin; roast level not printed on bag)",
    "dialin": {
     "start": {
      "rpm": 1000,
      "microns": 168
     },
     "settled": false,
     "pourover": {
      "why": "2,000–2,100 masl washed Caturra, dense; same band as Makeworth Danche (2,200 masl → 5)",
      "grinder": "Fellow Ode Gen 2",
      "setting": 5.0
     }
    },
    "logged": "2026-10-28",
    "opened": "2026-10-28",
    "region": "Cajamarca",
    "process": "washed",
    "roaster": "Perdido Coffee",
    "variety": "Yellow Caturra",
    "producer": "Felipe Estela",
    "elevation": "2000-2100 masl",
    "roast_date": "2026-10-07",
    "roaster_id": 295,
    "roaster_city": "San Antonio, TX",
    "elevation_masl": "2000-2100",
    "origin_country": "Peru",
    "dialin_start_note": "light washed single origin prior 165–170 @ 1000; dial grind first, then bracket RPM",
    "roaster_in_untamped": true,
    "offering_in_untamped": false
   },
   "shots": 0,
   "last_shot": null,
   "queued": {
    "id": 60,
    "shot_at": "2026-10-28T06:20:44.779563-07:00",
    "burrs": null,
    "microns": 168,
    "rpm": 1000,
    "dose_g": null,
    "next_change": "first shot: 18 g in, cut at 34, aim 30–32 s total. Light washed prior 165–170 @ 1000; Luna Victor Florez (also washed, light) hit 32.4 s at 175 @ 1000 first try, so if this gushes go 160; if it drags go 175"
   },
   "queue": [
    {
     "id": 60,
     "shot_at": "2026-10-28T06:20:44.779563-07:00",
     "burrs": null,
     "microns": 168,
     "rpm": 1000,
     "dose_g": null,
     "next_change": "first shot: 18 g in, cut at 34, aim 30–32 s total. Light washed prior 165–170 @ 1000; Luna Victor Florez (also washed, light) hit 32.4 s at 175 @ 1000 first try, so if this gushes go 160; if it drags go 175"
    }
   ]
  },
  {
   "id": 14,
   "short_name": "Kuma Gotiti",
   "label": "Kuma — Gotiti, Ethiopia",
   "verdict": null,
   "noted_at": "2026-10-19 11:34:55.149839-07:00",
   "offering_id": null,
   "data": {
    "roast": "2026-10-05",
    "dialin": {
     "start": {
      "rpm": 1000,
      "microns": 180
     },
     "settled": false
    },
    "opened": "2026-10-19",
    "roaster": "Kuma Coffee"
   },
   "shots": 4,
   "last_shot": {
    "id": 58,
    "shot_at": "2026-10-22T09:43:24.709608-07:00",
    "burrs": null,
    "microns": 190,
    "rpm": 1200,
    "dose_g": 18,
    "yield_g": 36,
    "time_s": 37.8,
    "ratio": 2.0,
    "taste": null,
    "verdict": "slow; puck wobbly, two streams off the portafilter that never converged (channeling)",
    "next_change": "→ 190 @ 1000 (lower RPM, same grind; 10/19 at this setting = 29.4 s)",
    "by_whom": null
   },
   "queued": null,
   "queue": []
  },
  {
   "id": 13,
   "short_name": "Creature Friend Blend",
   "label": "Creature Coffee Co — Friend Blend (Guatemala, Costa Rica, Ethiopia)",
   "verdict": null,
   "noted_at": "2026-10-18 08:38:45.468623-07:00",
   "offering_id": null,
   "data": {
    "use": "espresso + filter blend",
    "burrs": "Core",
    "grams": 309,
    "notes": "chocolate torte, black cherry, harmonized",
    "roast": "medium (3 of 5 on bag scale)",
    "dialin": {
     "start": {
      "rpm": 1000,
      "microns": 180
     },
     "settled": false
    },
    "logged": "2026-10-18",
    "opened": "2026-10-18",
    "origins": [
     "Guatemala",
     "Costa Rica",
     "Ethiopia"
    ],
    "process": "blend; processes not stated on bag",
    "roaster": "Creature Coffee Co",
    "roast_date": null,
    "roast_date_note": "not visible on front of bag — check the back/bottom",
    "dialin_start_note": "espresso-blend prior 180 @ 1000 (Ghost Rider, the other medium espresso blend, settled at 180); dial grind first, then bracket RPM",
    "roaster_in_untamped": false
   },
   "shots": 3,
   "last_shot": {
    "id": 51,
    "shot_at": "2026-10-18T08:52:35.104143-07:00",
    "burrs": null,
    "microns": 169,
    "rpm": 1200,
    "dose_g": 18,
    "yield_g": 36.58,
    "time_s": 27,
    "ratio": 2.03,
    "taste": null,
    "verdict": "still fast; 3.5 µm finer moved nothing",
    "next_change": "→ 160 @ 1200",
    "by_whom": null
   },
   "queued": {
    "id": 52,
    "shot_at": "2026-10-18T08:52:35.224046-07:00",
    "burrs": null,
    "microns": 160,
    "rpm": 1200,
    "dose_g": null,
    "next_change": "18 g in, cut at 34; aim 30–32 s total; a full 10 µm step this time"
   },
   "queue": [
    {
     "id": 52,
     "shot_at": "2026-10-18T08:52:35.224046-07:00",
     "burrs": null,
     "microns": 160,
     "rpm": 1200,
     "dose_g": null,
     "next_change": "18 g in, cut at 34; aim 30–32 s total; a full 10 µm step this time"
    }
   ]
  },
  {
   "id": 12,
   "short_name": "Luna Victor Florez",
   "label": "Luna — Victor Florez Chiroso (Urrao, Colombia, washed)",
   "verdict": "loved",
   "noted_at": "2026-10-13 07:21:15.047728-07:00",
   "offering_id": 27675,
   "data": {
    "url": "https://enjoylunacoffee.com/products/victor-florez-washed-chiroso-urrao-colombia",
    "farm": "La Cartagena",
    "grams": 250,
    "notes": "pear, butter cookie, satsuma; poached pear, fresh blueberry, orange butter cookie",
    "roast": "light",
    "dialin": {
     "start": {
      "rpm": 1000,
      "microns": 168
     },
     "settled": false,
     "pourover": {
      "why": "2 scoops in the Kinto at 4.2 worked well first try (10/13); low end of the 4–5 band",
      "grinder": "Fellow Ode Gen 2",
      "setting": 4.2
     }
    },
    "logged": "2026-10-13",
    "opened": "2026-10-13",
    "region": "Urrao, Antioquia",
    "harvest": "February 2026",
    "process": "washed with 48 hr whole-cherry ferment + 60–66 hr tank ferment after depulping",
    "roaster": "Luna",
    "variety": "Chiroso (Ethiopian landrace transplant)",
    "producer": "Victor Florez",
    "best_after": "2 weeks post-roast",
    "roast_date": "2026-09-22",
    "roaster_id": 185,
    "producer_id": 24914,
    "roaster_url": "https://enjoylunacoffee.com",
    "availability": "sold out on enjoylunacoffee.com as of 2026-10-13",
    "roaster_city": "just outside Vancouver, BC (Laura & Nate)",
    "luna_qc_recipe": "V60 1:17 (15 g → 255 g) at 96°C, 525 µm, low-mineral water",
    "origin_country": "Colombia",
    "dialin_start_note": "light washed single origin prior 165–170 @ 1000; dial grind first, then bracket RPM"
   },
   "shots": 6,
   "last_shot": {
    "id": 44,
    "shot_at": "2026-10-14T13:38:00-07:00",
    "burrs": null,
    "microns": 140,
    "rpm": 600,
    "dose_g": 18,
    "yield_g": 36.9,
    "time_s": 32.8,
    "ratio": 2.05,
    "taste": "huge body, well balanced; delicious with milk",
    "verdict": "in window — almost perfect",
    "next_change": "hold 140 @ 600; settle candidate",
    "by_whom": null
   },
   "queued": null,
   "queue": []
  },
  {
   "id": 11,
   "short_name": "Luna Kii AA",
   "label": "Luna — Kii AA (Kenya Kirinyaga, double washed)",
   "verdict": null,
   "noted_at": "2026-10-13 07:21:14.929759-07:00",
   "offering_id": 27680,
   "data": {
    "url": "https://enjoylunacoffee.com/products/kii-aa-field-blend-washed-kirinyaga-kenya",
    "grade": "AA",
    "grams": 250,
    "notes": "honeydew melon, herbal, forest fruits",
    "roast": "light",
    "dialin": {
     "start": {
      "rpm": 1000,
      "microns": 168
     },
     "settled": false
    },
    "logged": "2026-10-13",
    "opened": "2026-10-13",
    "region": "Kirinyaga",
    "process": "double washed (depulped, ferment, additional soak)",
    "roaster": "Luna",
    "station": "Kii washing station",
    "variety": "SL28, SL34, Ruiru 11, Batian",
    "producer": "Rungeto Farmers Cooperative members",
    "best_after": "2 weeks post-roast",
    "roast_date": "2026-09-22",
    "roaster_id": 185,
    "producer_id": 5160,
    "roaster_url": "https://enjoylunacoffee.com",
    "roaster_city": "just outside Vancouver, BC (Laura & Nate)",
    "origin_country": "Kenya",
    "dialin_start_note": "light washed single origin prior 165–170 @ 1000; dial grind first, then bracket RPM"
   },
   "shots": 0,
   "last_shot": null,
   "queued": null,
   "queue": []
  },
  {
   "id": 5,
   "short_name": "Makeworth Danche",
   "label": "Makeworth Coffee — Ethiopia Habtamu Danche, Washed",
   "verdict": null,
   "noted_at": "2026-10-07 12:38:21.769091-07:00",
   "offering_id": 23941,
   "data": {
    "farm": "Danche station, Gedeb (via Falcon Coffees)",
    "grams": 300,
    "notes": "lemon, cherry candy, floral",
    "roast": "light",
    "dialin": {
     "burrs": "Core",
     "settled": false,
     "pourover": {
      "why": "dense washed Ethiopian at 2,200 masl → top of the 4–5 band",
      "brewers": "Kinto 1.5–2 scoops · Chemex 3 scoops for 2×12 oz",
      "grinder": "Fellow Ode Gen 2",
      "setting": 5
     }
    },
    "logged": "2026-10-07",
    "opened": "2026-10-09",
    "region": "Yirgacheffe (Danche, Gedeb woreda, Gedeo Zone)",
    "process": "washed",
    "roaster": "Makeworth Coffee",
    "station": "Danche",
    "variety": "74110, 74112",
    "importer": "Falcon Coffees",
    "elevation": "2200 masl",
    "price_usd": 27,
    "roaster_id": 159,
    "producer_id": 4397,
    "roaster_city": "Bellingham, WA",
    "elevation_masl": "2200",
    "origin_country": "Ethiopia"
   },
   "shots": 5,
   "last_shot": {
    "id": 32,
    "shot_at": "2026-10-11T12:40:01.116268-07:00",
    "burrs": null,
    "microns": 200,
    "rpm": 600,
    "dose_g": 18,
    "yield_g": 38,
    "time_s": 23.4,
    "ratio": 2.11,
    "taste": null,
    "verdict": "still fast (23.4 s total incl. 5 s pre-brew = ~18 s flow)",
    "next_change": "→ 190 at 600 RPM; want 30–32 s total",
    "by_whom": null
   },
   "queued": null,
   "queue": []
  },
  {
   "id": 10,
   "short_name": "Oaxaca (D. Garcia)",
   "label": "Drumroaster Coffee Co. — Oaxaca (D. Garcia) (Oaxaca, Mexico — producer Dionisio García; harvested Feb 2026)",
   "verdict": null,
   "noted_at": "2026-09-11 12:00:00-07:00",
   "offering_id": null,
   "data": {
    "farm": "Dionisio García",
    "roast": "single origin (level TBD — lighter than GR per flow)",
    "dialin": {
     "burrs": "Core",
     "settled": false
    },
    "opened": "2026-09-11",
    "region": "Oaxaca",
    "country": "Mexico",
    "harvest": "harvested Feb 2026",
    "roaster": "Drumroaster Coffee Co.",
    "producer": "Dionisio García",
    "roast_date": "8/16/2026",
    "harvest_year": "2026 (Feb harvest)"
   },
   "shots": 1,
   "last_shot": {
    "id": 20,
    "shot_at": "2026-09-11T12:19:00-07:00",
    "burrs": "Core",
    "microns": 180,
    "rpm": 1200,
    "dose_g": 18,
    "yield_g": 38,
    "time_s": 19.7,
    "ratio": 2.11,
    "taste": "pretty sour — as the 19.7s predicted",
    "verdict": "gusher — bean denser/lighter-roasted than GR",
    "next_change": "→ 167; roast-level prior would have called this",
    "by_whom": null
   },
   "queued": null,
   "queue": []
  },
  {
   "id": 9,
   "short_name": "GR/VdC 50:50",
   "label": "(blend) — GR/VdC 50:50 (9g Ghost Rider + 9g VdC Decaf, mixed pre-RDT)",
   "verdict": null,
   "noted_at": "2026-09-02 12:00:00-07:00",
   "offering_id": null,
   "data": {
    "dialin": {
     "rpm": 1000,
     "burrs": "Core",
     "recipe": "18g → 36g, ~30s total, 1000 RPM — midpoint rule worked first try",
     "microns": 168,
     "settled": true
    },
    "opened": "2026-09-02",
    "process": "9g Ghost Rider + 9g VdC Decaf, mixed pre-RDT",
    "roaster": "(blend)",
    "blend_of": [
     "Ghost Rider",
     "VdC Decaf"
    ]
   },
   "shots": 1,
   "last_shot": {
    "id": 10,
    "shot_at": "2026-09-02T12:09:00-07:00",
    "burrs": "Core",
    "microns": 168,
    "rpm": 1000,
    "dose_g": 18,
    "yield_g": 36.1,
    "time_s": 30.3,
    "ratio": 2.01,
    "taste": "passable; a little sour + bitter, leaning bitter; not very sweet",
    "verdict": "good enough for a half-caf",
    "next_change": "optional: 172 next to shave the decaf bitterness",
    "by_whom": null
   },
   "queued": null,
   "queue": []
  },
  {
   "id": 8,
   "short_name": "VdC Decaf",
   "label": "Push Pull — VdC Decaf (Colombia Valle del Cauca, Castillo/Caturra, sugarcane (EA) decaf)",
   "verdict": null,
   "noted_at": "2026-08-31 12:00:00-07:00",
   "offering_id": 943,
   "data": {
    "dialin": {
     "rpm": 400,
     "burrs": "Core",
     "recipe": "18g → 36g, ~30s total, 400 RPM, no distributor (Core) — SETTLED 9/10",
     "microns": 125,
     "settled": true
    },
    "opened": "2026-08-31",
    "process": "Colombia Valle del Cauca, Castillo/Caturra, sugarcane (EA) decaf",
    "roaster": "Push Pull"
   },
   "shots": 6,
   "last_shot": {
    "id": 19,
    "shot_at": "2026-09-10T12:18:00-07:00",
    "burrs": "Core",
    "microns": 125,
    "rpm": 400,
    "dose_g": 18,
    "yield_g": 35.71,
    "time_s": 30.3,
    "ratio": 1.98,
    "taste": "way better than 1000 RPM",
    "verdict": "SETTLED — decaf lives at 400 RPM",
    "next_change": "per-bean RPM confirmed",
    "by_whom": null
   },
   "queued": null,
   "queue": []
  }
 ],
 "shots": [
  {
   "id": 72,
   "shot_at": "2026-10-30 07:00:10.719365-07:00",
   "bag": "GR/Hyacinth 50:50",
   "method": "espresso",
   "status": "queued",
   "burrs": null,
   "microns": 165,
   "rpm": 1200,
   "dose_g": null,
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": null,
   "verdict": null,
   "next_change": "18 g in (9 g each), cut at 34, aim 30–32 s total. Robby: 165 @ 1200 is the right zone. If fast → 160; if slow → 170.",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 71,
   "shot_at": "2026-10-30 06:49:25.021035-07:00",
   "bag": "DAC Booze Cruise",
   "method": "espresso",
   "status": "queued",
   "burrs": null,
   "microns": 133,
   "rpm": 1000,
   "dose_g": null,
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": null,
   "verdict": null,
   "next_change": "18 g in, cut at 34, aim 30–32 s. Hold here. If it tastes sour/thin → 130; if bitter/drying → 136. Hit 29.4 s at 133 on 10/30.",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 70,
   "shot_at": "2026-10-30 06:49:24.898864-07:00",
   "bag": "DAC Booze Cruise",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 133,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "37",
   "time_s": "29.4",
   "ratio": "2.06",
   "taste": null,
   "verdict": "in window (29.4 s total), a hair under the 30–32 aim; 133 landed where the bracket predicted",
   "next_change": "hold 133 @ 1000; taste decides (sour → 130, bitter → 136)",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 68,
   "shot_at": "2026-10-29 14:32:11.357851-07:00",
   "bag": "DAC Booze Cruise",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 125,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "37.2",
   "time_s": "39.8",
   "ratio": "2.07",
   "taste": null,
   "verdict": "slow (39.8 s total); 15 µm finer bought +14.5 s = 9.7 s/10 µm — steep part of the curve",
   "next_change": "→ 133 @ 1000",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 66,
   "shot_at": "2026-10-29 10:10:05.366009-07:00",
   "bag": "DAC Booze Cruise",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 140,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "37.1",
   "time_s": "25.3",
   "ratio": "2.06",
   "taste": "tasted best (with the 155 @ 1200 shot) — Robby 10/30",
   "verdict": "still fast (25.3 s total); 15 µm finer + RPM 1200→1000 net +1.8 s",
   "next_change": "RPM up or grind down — see queue",
   "by_whom": "Robby",
   "data": {}
  },
  {
   "id": 64,
   "shot_at": "2026-10-28 13:45:59.021307-07:00",
   "bag": "DAC Booze Cruise",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 155,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "38.1",
   "time_s": "23.5",
   "ratio": "2.12",
   "taste": "tasted best (with the 140 @ 1000 shot) — Robby 10/30",
   "verdict": "still fast (23.5 s total); 25 µm bought ~8 s",
   "next_change": "→ 140 @ 1000 (Robby: wants more clarity, drop RPM)",
   "by_whom": "Robby",
   "data": {}
  },
  {
   "id": 62,
   "shot_at": "2026-10-28 08:35:39.380766-07:00",
   "bag": "DAC Booze Cruise",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 180,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "38.3",
   "time_s": "15.6",
   "ratio": "2.13",
   "taste": null,
   "verdict": "gusher — 15.6 s total (~10 s flow), way too fast",
   "next_change": "→ 155 @ 1200",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 60,
   "shot_at": "2026-10-28 06:20:44.779563-07:00",
   "bag": "Perdido Felipe Estela",
   "method": "espresso",
   "status": "queued",
   "burrs": null,
   "microns": 168,
   "rpm": 1000,
   "dose_g": null,
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": null,
   "verdict": null,
   "next_change": "first shot: 18 g in, cut at 34, aim 30–32 s total. Light washed prior 165–170 @ 1000; Luna Victor Florez (also washed, light) hit 32.4 s at 175 @ 1000 first try, so if this gushes go 160; if it drags go 175",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 58,
   "shot_at": "2026-10-22 09:43:24.709608-07:00",
   "bag": "Kuma Gotiti",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 190,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "36",
   "time_s": "37.8",
   "ratio": "2.00",
   "taste": null,
   "verdict": "slow; puck wobbly, two streams off the portafilter that never converged (channeling)",
   "next_change": "→ 190 @ 1000 (lower RPM, same grind; 10/19 at this setting = 29.4 s)",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 56,
   "shot_at": "2026-10-21 12:51:46.380959-07:00",
   "bag": "Kuma Gotiti",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 185,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "36",
   "time_s": "37",
   "ratio": "2.00",
   "taste": null,
   "verdict": null,
   "next_change": null,
   "by_whom": null,
   "data": {}
  },
  {
   "id": 54,
   "shot_at": "2026-10-19 12:59:42.167376-07:00",
   "bag": "Kuma Gotiti",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 190,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "37.24",
   "time_s": "29.4",
   "ratio": "2.07",
   "taste": "not far off, a little bitter",
   "verdict": "in window, fast edge",
   "next_change": "→ 185 (Robby's call; bitter rule says coarser)",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 53,
   "shot_at": "2026-10-19 11:35:02.894286-07:00",
   "bag": "Kuma Gotiti",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 180,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "36.2",
   "time_s": "44.6",
   "ratio": "2.01",
   "taste": null,
   "verdict": "slow (target 30–35 s total)",
   "next_change": "→ 190 @ 1000",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 52,
   "shot_at": "2026-10-18 08:52:35.224046-07:00",
   "bag": "Creature Friend Blend",
   "method": "espresso",
   "status": "queued",
   "burrs": null,
   "microns": 160,
   "rpm": 1200,
   "dose_g": null,
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": null,
   "verdict": null,
   "next_change": "18 g in, cut at 34; aim 30–32 s total; a full 10 µm step this time",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 51,
   "shot_at": "2026-10-18 08:52:35.104143-07:00",
   "bag": "Creature Friend Blend",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 169,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "36.58",
   "time_s": "27",
   "ratio": "2.03",
   "taste": null,
   "verdict": "still fast; 3.5 µm finer moved nothing",
   "next_change": "→ 160 @ 1200",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 49,
   "shot_at": "2026-10-18 08:46:45.998980-07:00",
   "bag": "Creature Friend Blend",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 172,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "37",
   "time_s": "27.4",
   "ratio": "2.06",
   "taste": null,
   "verdict": "a little fast",
   "next_change": "→ 165 @ 1200",
   "by_whom": null,
   "data": {
    "note": "dial set at 172.5; --um is integer-only",
    "microns_exact": 172.5
   }
  },
  {
   "id": 47,
   "shot_at": "2026-10-18 08:43:08.987901-07:00",
   "bag": "Creature Friend Blend",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 180,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "37.1",
   "time_s": "19.7",
   "ratio": "2.06",
   "taste": null,
   "verdict": "way fast",
   "next_change": "→ 165",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 44,
   "shot_at": "2026-10-14 13:38:00-07:00",
   "bag": "Luna Victor Florez",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 140,
   "rpm": 600,
   "dose_g": "18",
   "yield_g": "36.9",
   "time_s": "32.8",
   "ratio": "2.05",
   "taste": "huge body, well balanced; delicious with milk",
   "verdict": "in window — almost perfect",
   "next_change": "hold 140 @ 600; settle candidate",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 42,
   "shot_at": "2026-10-14 13:17:57.517380-07:00",
   "bag": "Luna Victor Florez",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 150,
   "rpm": 600,
   "dose_g": "18",
   "yield_g": "37.8",
   "time_s": "24.4",
   "ratio": "2.10",
   "taste": null,
   "verdict": "still fast; 15 µm finer bought 4.5 s (19.9 → 24.4)",
   "next_change": "→ 140 @ 600 per plan (<28 s rule)",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 40,
   "shot_at": "2026-10-14 08:32:16.336560-07:00",
   "bag": "Luna Victor Florez",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 165,
   "rpm": 600,
   "dose_g": "18",
   "yield_g": "37.3",
   "time_s": "19.9",
   "ratio": "2.07",
   "taste": null,
   "verdict": "still way too fast; 10 µm finer moved time 0.9 s (19.0 → 19.9)",
   "next_change": "→ 150 @ 600 (Robby's call, 15 µm step since 165 did nothing)",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 38,
   "shot_at": "2026-10-13 09:10:04.320685-07:00",
   "bag": "Luna Victor Florez",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 175,
   "rpm": 600,
   "dose_g": "18",
   "yield_g": "35.6",
   "time_s": "19",
   "ratio": "1.98",
   "taste": "over-acidic note gone; held up better in the cappuccino; a bit under-extracted",
   "verdict": "fast — 600 rpm took 13 s off at the same grind; RPM A/B: 600 wins on flavour, grind must follow",
   "next_change": "→ 165 @ 600 (finer ~10); if still under 28 s go 155",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 36,
   "shot_at": "2026-10-13 08:19:54.814452-07:00",
   "bag": "Luna Victor Florez",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 175,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "35.8",
   "time_s": "32.4",
   "ratio": "1.99",
   "taste": "really good; slightly acidic; washed out by the milk in a cappuccino",
   "verdict": "in window first shot — time on the money",
   "next_change": "A/B RPM: same 175, drop to 600; Robby's call for bolder + clarity. House rule predicts fewer fines → faster + cleaner but thinner; if it thins, go 170 @ 1000 and cut at 32 for milk",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 34,
   "shot_at": "2026-10-13 07:23:14.529235-07:00",
   "bag": "Luna Victor Florez",
   "method": "pourover",
   "status": "pulled",
   "burrs": null,
   "microns": null,
   "rpm": null,
   "dose_g": null,
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": "delicious",
   "verdict": "worked well — pourover setting found first try",
   "next_change": null,
   "by_whom": null,
   "data": {
    "brewer": "Kinto",
    "scoops": 2.0,
    "grind_setting": "4.2"
   }
  },
  {
   "id": 32,
   "shot_at": "2026-10-11 12:40:01.116268-07:00",
   "bag": "Makeworth Danche",
   "method": "espresso",
   "status": "pulled",
   "burrs": null,
   "microns": 200,
   "rpm": 600,
   "dose_g": "18",
   "yield_g": "38",
   "time_s": "23.4",
   "ratio": "2.11",
   "taste": null,
   "verdict": "still fast (23.4 s total incl. 5 s pre-brew = ~18 s flow)",
   "next_change": "→ 190 at 600 RPM; want 30–32 s total",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 31,
   "shot_at": "2026-10-10 17:39:21.004309-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "queued",
   "burrs": "Core",
   "microns": 180,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": null,
   "verdict": null,
   "next_change": "A/B shot A: 180 µm at 1000 rpm, 18 g in, cut at 34 — then shot B at 1200 rpm, same grind; expect A a few seconds faster",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 30,
   "shot_at": "2026-10-10 17:39:20.887536-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "queued",
   "burrs": "Core",
   "microns": 180,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": null,
   "verdict": null,
   "next_change": "A/B shot B: 180 µm at 1200 rpm, 18 g in, cut at 34 — pull right after shot A, taste both straight (and with milk)",
   "by_whom": null,
   "data": {}
  },
  {
   "id": 29,
   "shot_at": "2026-10-10 15:09:47.429041-07:00",
   "bag": "Hyacinth Decaf",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 155,
   "rpm": 500,
   "dose_g": "18",
   "yield_g": "35.3",
   "time_s": "29.8",
   "ratio": "1.96",
   "taste": "good crema; a little bitter straight, should be great with milk",
   "verdict": "in window, first shot",
   "next_change": "160 µm, or stay at 155 and drop to 400 rpm, for drinking it straight; for milk hold 155 @ 500",
   "by_whom": "Robby",
   "data": {}
  },
  {
   "id": 25,
   "shot_at": "2026-10-10 12:24:00-07:00",
   "bag": "Makeworth Danche",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 225,
   "rpm": 600,
   "dose_g": "18",
   "yield_g": "38",
   "time_s": "18.4",
   "ratio": "2.11",
   "taste": null,
   "verdict": "spray much reduced — too fast",
   "next_change": "→ 200 at 600 RPM; if <22s go 190",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 26,
    "sheet_ratio": "2.11"
   }
  },
  {
   "id": 24,
   "shot_at": "2026-10-10 12:23:00-07:00",
   "bag": "Makeworth Danche",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 225,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "37.8",
   "time_s": "28.1",
   "ratio": "2.10",
   "taste": null,
   "verdict": "in window, tons of spray (taller glass to contain)",
   "next_change": "drop RPM 1000 → 600, same µm (fewer fines, less static)",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 25,
    "sheet_ratio": "2.1"
   }
  },
  {
   "id": 23,
   "shot_at": "2026-10-09 12:22:00-07:00",
   "bag": "Makeworth Danche",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 225,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": "good-looking stream; heavy spray reset the scale",
   "verdict": "poured — fresh bag (<10d), choked at 160",
   "next_change": "fresh light roast runs tight; expect to walk finer as it degasses. Spray + group seal issue → silicone gasket",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 24,
    "sheet_ratio": ""
   }
  },
  {
   "id": 22,
   "shot_at": "2026-10-09 12:21:00-07:00",
   "bag": "Makeworth Danche",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 160,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "0",
   "time_s": "12",
   "ratio": "0.00",
   "taste": "nothing came out",
   "verdict": "choked — bean runs much finer than GR at same µm",
   "next_change": "→ 195 (big bracket); if it gushes <25s, bisect to ~178",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 23,
    "sheet_ratio": ""
   }
  },
  {
   "id": 20,
   "shot_at": "2026-09-11 12:19:00-07:00",
   "bag": "Oaxaca (D. Garcia)",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 180,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "38",
   "time_s": "19.7",
   "ratio": "2.11",
   "taste": "pretty sour — as the 19.7s predicted",
   "verdict": "gusher — bean denser/lighter-roasted than GR",
   "next_change": "→ 167; roast-level prior would have called this",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 21,
    "sheet_ratio": ""
   }
  },
  {
   "id": 19,
   "shot_at": "2026-09-10 12:18:00-07:00",
   "bag": "VdC Decaf",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 125,
   "rpm": 400,
   "dose_g": "18",
   "yield_g": "35.71",
   "time_s": "30.3",
   "ratio": "1.98",
   "taste": "way better than 1000 RPM",
   "verdict": "SETTLED — decaf lives at 400 RPM",
   "next_change": "per-bean RPM confirmed",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 20,
    "sheet_ratio": ""
   }
  },
  {
   "id": 18,
   "shot_at": "2026-09-10 12:17:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 180,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "37",
   "time_s": "35.4",
   "ratio": "2.06",
   "taste": "a lot more balance, real depth",
   "verdict": "1200 RPM SETTLED for GR",
   "next_change": "cut 33.5 on slow shots (longer drip)",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 19,
    "sheet_ratio": ""
   }
  },
  {
   "id": 17,
   "shot_at": "2026-09-10 12:16:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 170,
   "rpm": 800,
   "dose_g": "18",
   "yield_g": "37.38",
   "time_s": "34.9",
   "ratio": "2.08",
   "taste": "bitter — do not love",
   "verdict": "800 RPM loses to 1000 on taste for GR",
   "next_change": "back to 1000; 1200 test still pending",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 18,
    "sheet_ratio": ""
   }
  },
  {
   "id": 16,
   "shot_at": "2026-09-10 12:15:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 170,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "37",
   "time_s": "37",
   "ratio": "2.06",
   "taste": "closer, still slow vs 33s target",
   "verdict": null,
   "next_change": "next: hold 170, drop to 800 RPM (lower RPM = faster) — else one tick coarser",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 17,
    "sheet_ratio": ""
   }
  },
  {
   "id": 15,
   "shot_at": "2026-09-10 12:14:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 165,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "36.5",
   "time_s": "42",
   "ratio": "2.03",
   "taste": null,
   "verdict": "too slow — overshot the finer step",
   "next_change": "→ 170",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 16,
    "sheet_ratio": ""
   }
  },
  {
   "id": 14,
   "shot_at": "2026-09-09 12:13:00-07:00",
   "bag": "VdC Decaf",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 148,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "35.4",
   "time_s": "33.9",
   "ratio": "1.97",
   "taste": "hollow — bitter + acidic, no sweetness; really not bad",
   "verdict": "time target hit; taste at its 1000-RPM ceiling?",
   "next_change": "next decaf: 400 RPM @ 125 (day-one smooth shot) — test bean-specific RPM",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 15,
    "sheet_ratio": ""
   }
  },
  {
   "id": 13,
   "shot_at": "2026-09-09 12:12:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 177,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "38.4",
   "time_s": "27.7",
   "ratio": "2.13",
   "taste": "good, a little muted; milk verdict pending",
   "verdict": "NO DISTRIBUTOR: −4s vs same setting with it; headspace clean (no imprint)",
   "next_change": "bald spot gone? → if yes, distributor leaves the chain. GR → 165 for ~33s",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 14,
    "sheet_ratio": ""
   }
  },
  {
   "id": 12,
   "shot_at": "2026-09-09 12:11:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 177,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "38",
   "time_s": "31.7",
   "ratio": "2.11",
   "taste": "a little more sour; liked it straight; 175 was better for milk",
   "verdict": "good straight",
   "next_change": "bald middle → check headspace imprint, consider puck screen, A/B without distributor",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 13,
    "sheet_ratio": ""
   }
  },
  {
   "id": 11,
   "shot_at": "2026-09-09 12:10:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 175,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "36.73",
   "time_s": "39.4",
   "ratio": "2.04",
   "taste": "one of the better-balanced ones; spray reduced",
   "verdict": "good — slow per the clock, great per the cup",
   "next_change": "taste > window noted",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 12,
    "sheet_ratio": ""
   }
  },
  {
   "id": 10,
   "shot_at": "2026-09-02 12:09:00-07:00",
   "bag": "GR/VdC 50:50",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 168,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "36.1",
   "time_s": "30.3",
   "ratio": "2.01",
   "taste": "passable; a little sour + bitter, leaning bitter; not very sweet",
   "verdict": "good enough for a half-caf",
   "next_change": "optional: 172 next to shave the decaf bitterness",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 11,
    "sheet_ratio": ""
   }
  },
  {
   "id": 28,
   "shot_at": "2026-09-02 09:01:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 185,
   "rpm": null,
   "dose_g": null,
   "yield_g": "38.4",
   "time_s": "26.7",
   "ratio": null,
   "taste": "Emily made it, Robby did not taste; looked textbook if dose ~18g (~1:2.1). ALSO sprayed, less than the 180 shot — same puck prep both. Spray at two settings w/ identical prep = prep/seasoning, not the dial (coarser sprays less only because puck resistance drops).",
   "verdict": null,
   "next_change": null,
   "by_whom": "Emily",
   "data": {
    "source": "kv zerno-dialin",
    "bag_assumed": "Ghost Rider — bag not recorded in kv; the bag in use on 9/2"
   }
  },
  {
   "id": 27,
   "shot_at": "2026-09-02 09:00:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 180,
   "rpm": null,
   "dose_g": null,
   "yield_g": null,
   "time_s": "33.7",
   "ratio": null,
   "taste": "tons of spraying (channeling); TOO SOUR — but sour-while-channeling is a prep verdict, not a dial verdict",
   "verdict": null,
   "next_change": null,
   "by_whom": "Robby",
   "data": {
    "source": "kv zerno-dialin",
    "bag_assumed": "Ghost Rider — bag not recorded in kv; the bag in use on 9/2"
   }
  },
  {
   "id": 9,
   "shot_at": "2026-09-01 12:08:00-07:00",
   "bag": "VdC Decaf",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 145,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "35.8",
   "time_s": "38.5",
   "ratio": "1.99",
   "taste": "a little bitter",
   "verdict": "slow — too fine at 1000",
   "next_change": "→ 155; cut-at-34 confirmed (~1.8g lag). Decaf RPM offset runs bigger than GR's",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 10,
    "sheet_ratio": ""
   }
  },
  {
   "id": 8,
   "shot_at": "2026-09-01 12:07:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 180,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "39.1",
   "time_s": "31.5",
   "ratio": "2.17",
   "taste": "pretty good, a little bitter",
   "verdict": "close",
   "next_change": "cut at 34g → land ~36; if still bitter at 36, coarsen ~5µm or temp down",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 9,
    "sheet_ratio": ""
   }
  },
  {
   "id": 7,
   "shot_at": "2026-09-01 12:06:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 180,
   "rpm": 1000,
   "dose_g": "18",
   "yield_g": "39",
   "time_s": "30.7",
   "ratio": "2.17",
   "taste": "sprayed a lot (channeling)",
   "verdict": "in window, messy",
   "next_change": "RDT 1–2 sprays + WDT next; trim yield toward 36",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 8,
    "sheet_ratio": ""
   }
  },
  {
   "id": 6,
   "shot_at": "2026-08-31 12:05:00-07:00",
   "bag": "VdC Decaf",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 125,
   "rpm": 400,
   "dose_g": "18",
   "yield_g": "37.5",
   "time_s": "32.1",
   "ratio": "2.08",
   "taste": "pretty smooth",
   "verdict": "DIALED ✅",
   "next_change": "settled — time incl. 3s pre-soak",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 7,
    "sheet_ratio": ""
   }
  },
  {
   "id": 5,
   "shot_at": "2026-08-31 12:04:00-07:00",
   "bag": "VdC Decaf",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 140,
   "rpm": 400,
   "dose_g": "18",
   "yield_g": "38",
   "time_s": "22",
   "ratio": "2.11",
   "taste": "still fast — barely moved vs 160",
   "verdict": "too coarse",
   "next_change": "→ 130",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 6,
    "sheet_ratio": ""
   }
  },
  {
   "id": 4,
   "shot_at": "2026-08-31 12:03:00-07:00",
   "bag": "VdC Decaf",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 160,
   "rpm": 400,
   "dose_g": "18",
   "yield_g": "40",
   "time_s": "21",
   "ratio": "2.22",
   "taste": "gushed — 40g in 21s",
   "verdict": "way too coarse",
   "next_change": "big step finer → try ~135",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 5,
    "sheet_ratio": ""
   }
  },
  {
   "id": 3,
   "shot_at": "2026-08-31 12:02:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 160,
   "rpm": 400,
   "dose_g": "18",
   "yield_g": "37",
   "time_s": "27",
   "ratio": "2.06",
   "taste": null,
   "verdict": "DIALED ✅",
   "next_change": "retro: 27s incl. 5s pre-brew = ~22s pressure, fast — try 155",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 4,
    "sheet_ratio": ""
   }
  },
  {
   "id": 2,
   "shot_at": "2026-08-31 12:01:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 125,
   "rpm": 400,
   "dose_g": "18",
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": "barely poured — choked",
   "verdict": "way too fine",
   "next_change": "back coarser",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 3,
    "sheet_ratio": ""
   }
  },
  {
   "id": 1,
   "shot_at": "2026-08-31 12:00:00-07:00",
   "bag": "Ghost Rider",
   "method": "espresso",
   "status": "pulled",
   "burrs": "Core",
   "microns": 165,
   "rpm": 400,
   "dose_g": "18",
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": "a little sour",
   "verdict": "close",
   "next_change": "went finer",
   "by_whom": null,
   "data": {
    "source": "sheet import",
    "sheet_row": 2,
    "sheet_ratio": "#REF!"
   }
  }
 ],
 "experiments": [
  {
   "id": 7,
   "run_on": "2026-10-10",
   "method": "espresso",
   "variable": "GR RPM rematch: 1000 vs 1200 at the same grind",
   "held_constant": "Ghost Rider, Core, 180 µm, 18 g in, cut at 34, 3+2 pre-brew, back to back",
   "option_a": "1000 rpm",
   "option_b": "1200 rpm",
   "winner": "",
   "notes": "QUEUED 10/10: the 9/10 bracket crowned 1200 on one shot pulled while 1000 was being tested at 165–170 µm, never the same grind. Robby has been pulling GR at 1000 in practice (unlogged). Rematch settles the house recipe."
  },
  {
   "id": 6,
   "run_on": "2026-09-10",
   "method": "Espresso",
   "variable": "GR RPM: 800 vs 1000",
   "held_constant": "Ghost Rider, Core, 170µm, no distributor",
   "option_a": "800: 37.38g/34.9s — bitter",
   "option_b": "1000 @ 177.5 (9/9): balanced, good",
   "winner": "1000 RPM",
   "notes": "RESOLVED 9/10: bracket complete — 800 bitter, 1000 good, 1200 balanced + depth. GR = 180µm @ 1200 RPM"
  },
  {
   "id": 4,
   "run_on": "2026-09-09",
   "method": "Espresso",
   "variable": "Distributor: with vs without",
   "held_constant": "Ghost Rider, Core, 177.5µm, 1000 RPM, 18g",
   "option_a": "with: 31.7s, bald middle",
   "option_b": "without: 27.7s, good flavor (slightly muted)",
   "winner": "WITHOUT — bald spot gone",
   "notes": "distributor RETIRED 9/9: compacted the puck (+4s) and caused the edge-favoring flow/bald middle. Chain is now: weigh → RDT → shake → grind → orbital raker → tamp (twist at top)"
  },
  {
   "id": 3,
   "run_on": "2026-09-01",
   "method": "Espresso",
   "variable": "Dose delivery: weigh loaded PF vs 18.0g in",
   "held_constant": "RDT on, same prep",
   "option_a": "@ 1000 RPM: ___ g of 18.0",
   "option_b": "@ 400 RPM: ___ g of 18.0",
   "winner": "",
   "notes": "quantifies Z2 retention + chute-spray loss; if actual dose <18, ratios have been computed against a phantom dose"
  },
  {
   "id": 2,
   "run_on": "2026-09-01",
   "method": "Espresso",
   "variable": "Spray fix at 1000 RPM",
   "held_constant": "Ghost Rider, Core, 18g, kill at ~36g, same puck prep (orbital WDT + distributor + 25lb tamp)",
   "option_a": "RDT + orbital WDT @ 1000/180 → still sprays",
   "option_b": "Weber blind shaker @ 1000/180: clumpy with RDT (damp grounds re-clump) — BENCHED, back to orbital raker chain",
   "winner": "",
   "notes": "yield overshoot is the live issue: paddle lag ~2g+; cutting at 34g next. Bitterness likely partly the long 39g tail — judge again at a true 36"
  },
  {
   "id": 1,
   "run_on": "2026-09-01",
   "method": "Espresso",
   "variable": "RPM: 400 vs 1000",
   "held_constant": "Ghost Rider, Core, 160µm, 18g → ~36g, 3+2 pre-brew",
   "option_a": "400 RPM (37g/27s)",
   "option_b": "1000 RPM",
   "winner": "1000 RPM (taste)",
   "notes": "RESULT 9/1: at 1000 RPM needed 180µm to hit 30.7s where 400 RPM ran 160µm fast → ~20µm finer-per-micron offset at high RPM. Taste verdict pending; sprayed (static/channeling) at 1000."
  },
  {
   "id": 8,
   "run_on": null,
   "method": "espresso",
   "variable": "RPM: 1000 vs 600 (Luna Victor Florez, Chiroso washed)",
   "held_constant": "175 µm, 18 g, Core burrs, cut 34, cappuccino",
   "option_a": "1000 rpm: 35.8 g / 32.4 s — really good, slightly acidic, washed out by milk",
   "option_b": "600 rpm: 19 s — acidity gone, held up better in milk, under-extracted",
   "winner": "600 rpm on flavour; grind must go ~10 finer to recover time",
   "notes": "600 took 13 s off the shot at the same grind — far more than the 'few seconds' predicted; low RPM = fewer fines = faster flow, confirmed for a light washed Colombian. Robby's milk-drink read: lower RPM, then finer."
  },
  {
   "id": 5,
   "run_on": null,
   "method": "Espresso",
   "variable": "Decaf RPM: 1000 vs 400",
   "held_constant": "VdC Decaf, Core, no distributor, 18g",
   "option_a": "1000 RPM @ 148: hollow (33.9s)",
   "option_b": "400 RPM @ 125: day-one was smoothest decaf yet",
   "winner": "400 RPM",
   "notes": "RESOLVED 9/10: 125 @ 400 = way better (35.71g/30.3s) vs hollow at 1000. PER-BEAN RPM RULE: brittle sugarcane decaf → 400 (fines-averse); GR → 1200 (fines-friendly). RPM is a per-bag variable, dial it with the bag"
  }
 ],
 "health": {
  "last_shot_at": "2026-10-30 06:49:24.898864-07:00",
  "shots_7d": 5,
  "shots_30d": 24,
  "shots_total": 46,
  "queued": 6,
  "bags_settled": 3,
  "bags_dialing": 10,
  "backflush": {
   "last": "2026-09-15",
   "cadence_days": 90,
   "days_ago": 45
  },
  "machine_shots_7d": 12,
  "machine_telemetry_at": "2026-10-28T13:19:08+00:00"
 },
 "origin": {
  "provenance": [
   {
    "bag": "Luna Victor Florez",
    "offering_id": 27675,
    "title": "Victor Florez (Washed Chiroso) | Urrao, Colombia",
    "url": "https://enjoylunacoffee.com/products/victor-florez-washed-chiroso-urrao-colombia",
    "roaster": "Luna Coffee",
    "roaster_city": "just outside Vancouver, BC",
    "roaster_country": "Canada",
    "lat": null,
    "lng": null,
    "website": "https://enjoylunacoffee.com",
    "producer_id": 24914,
    "producer": "Victor Florez",
    "producer_country": "Colombia",
    "producer_region": "Urrao",
    "also_roasted_by": null,
    "origin": {
     "country": "Colombia",
     "region": "Urrao",
     "producer": "Victor Florez",
     "process": "Washed",
     "variety": "Chiroso"
    }
   },
   {
    "bag": "Luna Kii AA",
    "offering_id": 27680,
    "title": "Kii AA (Field Blend Washed) | Kirinyaga, Kenya",
    "url": "https://enjoylunacoffee.com/products/kii-aa-field-blend-washed-kirinyaga-kenya",
    "roaster": "Luna Coffee",
    "roaster_city": "just outside Vancouver, BC",
    "roaster_country": "Canada",
    "lat": null,
    "lng": null,
    "website": "https://enjoylunacoffee.com",
    "producer_id": 5160,
    "producer": "Kii",
    "producer_country": "Kenya",
    "producer_region": "Kirinyaga",
    "also_roasted_by": [
     "Botz Coffee",
     "Friedhats",
     "Sweven Coffee"
    ],
    "origin": {
     "country": "Kenya",
     "region": "Kirinyaga",
     "process": "Washed",
     "variety": "Field Blend"
    }
   },
   {
    "bag": "Makeworth Danche",
    "offering_id": 23941,
    "title": "Ethiopia • Habtamu Danche",
    "url": "https://makeworthcoffee.com/products/ethiopia-habtamu-danche",
    "roaster": "Makeworth Coffee",
    "roaster_city": "Bellingham, WA",
    "roaster_country": "USA",
    "lat": 48.7519,
    "lng": -122.4787,
    "website": "https://makeworthcoffee.com",
    "producer_id": 4397,
    "producer": "Danche",
    "producer_country": "Ethiopia",
    "producer_region": "Gedeo, Gedeb",
    "also_roasted_by": [
     "Friedhats",
     "Luna Coffee",
     "Offshoot Coffee",
     "September Coffee",
     "SEY"
    ],
    "origin": {
     "country": "Ethiopia",
     "region": "Yirgacheffe",
     "process": "Washed",
     "variety": "74110, 74112",
     "elevation": "2,200 masl"
    }
   },
   {
    "bag": "VdC Decaf",
    "offering_id": 943,
    "title": "DECAF! COLOMBIA VALLE DE CAUCA EA DECAF",
    "url": "https://www.pushxpullcoffee.com/products/decaf-colombia-valle-de-cauca-ea-decaf",
    "roaster": "Push x Pull",
    "roaster_city": "Seattle, WA",
    "roaster_country": "USA",
    "lat": 47.6062,
    "lng": -122.3321,
    "website": "https://www.pushxpullcoffee.com",
    "producer_id": 5109,
    "producer": "Various smallholders",
    "producer_country": "Colombia",
    "producer_region": "Valle de Cauca",
    "also_roasted_by": null,
    "origin": {
     "country": "Colombia",
     "region": "Valle de Cauca",
     "farm": "Various smallholders",
     "process": "EA sugarcane decaf",
     "variety": "Caturra, castillo",
     "elevation": "1750 MASL",
     "importer": "Genuine Origin"
    }
   },
   {
    "bag": "Ghost Rider",
    "offering_id": 2296,
    "title": "Ghost Rider Blend",
    "url": "https://proudmarycoffee.com/products/ghost-rider",
    "roaster": "Proud Mary Coffee",
    "roaster_city": "Portland, OR (ex-Melbourne)",
    "roaster_country": "USA",
    "lat": 45.5202,
    "lng": -122.6742,
    "website": "https://proudmarycoffee.com",
    "producer_id": null,
    "producer": null,
    "producer_country": null,
    "producer_region": null,
    "also_roasted_by": null,
    "origin": {
     "country": "Brazil",
     "process": "Natural"
    }
   }
  ],
  "roasters": [
   {
    "name": "Proud Mary Coffee",
    "city": "Portland, OR (ex-Melbourne)",
    "country": "USA",
    "lat": 45.5202,
    "lng": -122.6742,
    "website": "https://proudmarycoffee.com",
    "offerings": 36,
    "producers": 19,
    "in_my_bags": true
   },
   {
    "name": "Push x Pull",
    "city": "Seattle, WA",
    "country": "USA",
    "lat": 47.6062,
    "lng": -122.3321,
    "website": "https://www.pushxpullcoffee.com",
    "offerings": 13,
    "producers": 11,
    "in_my_bags": true
   },
   {
    "name": "Makeworth Coffee",
    "city": "Bellingham, WA",
    "country": "USA",
    "lat": 48.7519,
    "lng": -122.4787,
    "website": "https://makeworthcoffee.com",
    "offerings": 12,
    "producers": 3,
    "in_my_bags": true
   },
   {
    "name": "Luna Coffee",
    "city": "just outside Vancouver, BC",
    "country": "Canada",
    "lat": null,
    "lng": null,
    "website": "https://enjoylunacoffee.com",
    "offerings": 1,
    "producers": 1,
    "in_my_bags": true
   },
   {
    "name": "Archers Coffee",
    "city": "Dubai",
    "country": "UAE",
    "lat": 25.2048,
    "lng": 55.2708,
    "website": "https://archerscoffee.com",
    "offerings": 215,
    "producers": 101,
    "in_my_bags": false
   },
   {
    "name": "Coffee Collective",
    "city": "Copenhagen",
    "country": "Denmark",
    "lat": 55.6828,
    "lng": 12.5357,
    "website": "https://coffeecollective.dk",
    "offerings": 61,
    "producers": 28,
    "in_my_bags": false
   },
   {
    "name": "Onyx Coffee Lab",
    "city": "Rogers, AR",
    "country": "USA",
    "lat": 36.332,
    "lng": -94.1185,
    "website": "https://onyxcoffeelab.com",
    "offerings": 54,
    "producers": 23,
    "in_my_bags": false
   },
   {
    "name": "Assembly Coffee",
    "city": "London",
    "country": "UK",
    "lat": 51.4613,
    "lng": -0.1156,
    "website": "https://assemblycoffee.co.uk",
    "offerings": 44,
    "producers": 35,
    "in_my_bags": false
   },
   {
    "name": "Barrett's Coffee",
    "city": "Austin, TX",
    "country": "USA",
    "lat": 30.2672,
    "lng": -97.7431,
    "website": "https://www.barrettscoffee.com",
    "offerings": 39,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Offshoot Coffee",
    "city": "Melbourne",
    "country": "Australia",
    "lat": -37.8136,
    "lng": 144.9631,
    "website": "https://www.offshootcoffee.com.au",
    "offerings": 37,
    "producers": 18,
    "in_my_bags": false
   },
   {
    "name": "April Coffee Roasters",
    "city": "Copenhagen",
    "country": "Denmark",
    "lat": 55.6867,
    "lng": 12.57,
    "website": "https://aprilcoffeeroasters.com",
    "offerings": 27,
    "producers": 5,
    "in_my_bags": false
   },
   {
    "name": "Bows & Arrows",
    "city": "Victoria, BC",
    "country": "Canada",
    "lat": 48.4284,
    "lng": -123.3656,
    "website": "https://bowsandarrowscoffee.com",
    "offerings": 25,
    "producers": 10,
    "in_my_bags": false
   },
   {
    "name": "Devoción",
    "city": "Brooklyn, NY",
    "country": "USA",
    "lat": 40.7176,
    "lng": -73.9629,
    "website": "https://devocion.com",
    "offerings": 24,
    "producers": 17,
    "in_my_bags": false
   },
   {
    "name": "Tim Wendelboe",
    "city": "Oslo",
    "country": "Norway",
    "lat": 59.9227,
    "lng": 10.7527,
    "website": "https://timwendelboe.no",
    "offerings": 24,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Hydrangea Coffee Roasters",
    "city": "Petaluma, CA",
    "country": "USA",
    "lat": 38.2324,
    "lng": -122.6367,
    "website": "https://hydrangea.coffee",
    "offerings": 23,
    "producers": 10,
    "in_my_bags": false
   },
   {
    "name": "Friedhats",
    "city": "Amsterdam",
    "country": "Netherlands",
    "lat": 52.3676,
    "lng": 4.9041,
    "website": "https://www.friedhats.com",
    "offerings": 20,
    "producers": 19,
    "in_my_bags": false
   },
   {
    "name": "Black & White Coffee Roasters",
    "city": "Wake Forest, NC",
    "country": "USA",
    "lat": 35.9799,
    "lng": -78.5097,
    "website": "https://www.blackwhiteroasters.com",
    "offerings": 18,
    "producers": 14,
    "in_my_bags": false
   },
   {
    "name": "NATIVE Coffee Co.",
    "city": "Dallas, TX",
    "country": "USA",
    "lat": 32.9334,
    "lng": -96.8354,
    "website": "https://www.thenativecoffeecompany.com",
    "offerings": 18,
    "producers": 5,
    "in_my_bags": false
   },
   {
    "name": "Kuma Coffee",
    "city": "Seattle, WA",
    "country": "USA",
    "lat": 47.6062,
    "lng": -122.3321,
    "website": "https://kumacoffee.com",
    "offerings": 18,
    "producers": 6,
    "in_my_bags": false
   },
   {
    "name": "Prolog Coffee",
    "city": "Copenhagen",
    "country": "Denmark",
    "lat": 55.669,
    "lng": 12.5586,
    "website": "https://prologcoffee.com",
    "offerings": 16,
    "producers": 14,
    "in_my_bags": false
   },
   {
    "name": "POMA Coffee Research Lab",
    "city": "Copenhagen",
    "country": "Denmark",
    "lat": 55.6761,
    "lng": 12.5683,
    "website": "https://www.pomacoffee.com",
    "offerings": 16,
    "producers": 1,
    "in_my_bags": false
   },
   {
    "name": "September Coffee",
    "city": "Stittsville (Ottawa), ON",
    "country": "Canada",
    "lat": 45.2743576,
    "lng": -75.9019097,
    "website": "https://september.coffee",
    "offerings": 16,
    "producers": 8,
    "in_my_bags": false
   },
   {
    "name": "Sweven Coffee",
    "city": "Bristol",
    "country": "UK",
    "lat": 51.4545,
    "lng": -2.5879,
    "website": "https://www.swevencoffee.co.uk",
    "offerings": 11,
    "producers": 10,
    "in_my_bags": false
   },
   {
    "name": "Merit Coffee",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": 29.4195,
    "lng": -98.4906,
    "website": "https://meritcoffee.com",
    "offerings": 10,
    "producers": 4,
    "in_my_bags": false
   },
   {
    "name": "Heart Coffee Roasters",
    "city": "Portland, OR",
    "country": "USA",
    "lat": 45.5231,
    "lng": -122.6765,
    "website": "https://www.heartroasters.com",
    "offerings": 9,
    "producers": 4,
    "in_my_bags": false
   },
   {
    "name": "La Cabra",
    "city": "Copenhagen (HQ Aarhus) + NYC",
    "country": "Denmark",
    "lat": 56.1572,
    "lng": 10.2107,
    "website": "https://www.lacabra.dk",
    "offerings": 8,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "SEY",
    "city": "Brooklyn, NY",
    "country": "USA",
    "lat": 40.7057,
    "lng": -73.9204,
    "website": "https://www.seycoffee.com",
    "offerings": 7,
    "producers": 6,
    "in_my_bags": false
   },
   {
    "name": "Proud Hound Coffee",
    "city": "Cincinnati, OH",
    "country": "USA",
    "lat": 39.1946,
    "lng": -84.4119,
    "website": "https://proudhoundcoffee.com",
    "offerings": 5,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Pulp Coffee Roasters",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": 29.4225,
    "lng": -98.4782,
    "website": "https://pulp.coffee",
    "offerings": 4,
    "producers": 2,
    "in_my_bags": false
   },
   {
    "name": "Mural Roasters",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": 29.4241,
    "lng": -98.5193,
    "website": "https://www.muralroasters.com",
    "offerings": 3,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Weathered Hands Coffee",
    "city": "Texas Hill Country",
    "country": "USA",
    "lat": 30.1902,
    "lng": -98.0867,
    "website": "https://www.weatheredhandscoffee.com",
    "offerings": 3,
    "producers": 3,
    "in_my_bags": false
   },
   {
    "name": "NoFi Slow Bar",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": null,
    "lng": null,
    "website": null,
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Coffee Project NY",
    "city": "New York, NY",
    "country": "USA",
    "lat": 40.7264,
    "lng": -73.9878,
    "website": "https://coffeeprojectny.com",
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Cuvée Coffee",
    "city": "Austin, TX",
    "country": "USA",
    "lat": null,
    "lng": null,
    "website": "https://cuveecoffee.com",
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Úniko Coffee (ex Ferra)",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": null,
    "lng": null,
    "website": null,
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "What's Brewing Coffee Roasters",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": null,
    "lng": null,
    "website": "https://www.sacoffeeroasters.com",
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Perdido Coffee",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": null,
    "lng": null,
    "website": null,
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Botz Coffee",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": 29.4241,
    "lng": -98.4936,
    "website": "https://botz-coffee.com",
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Estate Coffee Company",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": null,
    "lng": null,
    "website": "https://www.estatecoffeecompany.com",
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Akhanay Coffee Roasters",
    "city": "San Antonio, TX",
    "country": "USA",
    "lat": null,
    "lng": null,
    "website": null,
    "offerings": 0,
    "producers": 0,
    "in_my_bags": false
   }
  ],
  "countries": [
   {
    "country": "Colombia",
    "producers": 94,
    "roasters": 19,
    "offerings": 124,
    "my_bags": 1
   },
   {
    "country": "Panama",
    "producers": 64,
    "roasters": 7,
    "offerings": 134,
    "my_bags": 0
   },
   {
    "country": "Ethiopia",
    "producers": 59,
    "roasters": 19,
    "offerings": 105,
    "my_bags": 1
   },
   {
    "country": "Guatemala",
    "producers": 25,
    "roasters": 12,
    "offerings": 31,
    "my_bags": 0
   },
   {
    "country": "Kenya",
    "producers": 21,
    "roasters": 12,
    "offerings": 32,
    "my_bags": 0
   },
   {
    "country": "Peru",
    "producers": 18,
    "roasters": 9,
    "offerings": 22,
    "my_bags": 0
   },
   {
    "country": "Costa Rica",
    "producers": 15,
    "roasters": 11,
    "offerings": 19,
    "my_bags": 0
   },
   {
    "country": "Mexico",
    "producers": 10,
    "roasters": 6,
    "offerings": 10,
    "my_bags": 0
   },
   {
    "country": "Honduras",
    "producers": 10,
    "roasters": 6,
    "offerings": 12,
    "my_bags": 0
   },
   {
    "country": "Ecuador",
    "producers": 7,
    "roasters": 5,
    "offerings": 9,
    "my_bags": 0
   },
   {
    "country": "El Salvador",
    "producers": 6,
    "roasters": 6,
    "offerings": 7,
    "my_bags": 0
   },
   {
    "country": "Brazil",
    "producers": 6,
    "roasters": 2,
    "offerings": 8,
    "my_bags": 0
   },
   {
    "country": "Nicaragua",
    "producers": 4,
    "roasters": 2,
    "offerings": 5,
    "my_bags": 0
   },
   {
    "country": "Uganda",
    "producers": 3,
    "roasters": 3,
    "offerings": 3,
    "my_bags": 0
   },
   {
    "country": "Tanzania",
    "producers": 3,
    "roasters": 1,
    "offerings": 3,
    "my_bags": 0
   },
   {
    "country": "China",
    "producers": 2,
    "roasters": 2,
    "offerings": 2,
    "my_bags": 0
   },
   {
    "country": "DR Congo",
    "producers": 2,
    "roasters": 1,
    "offerings": 2,
    "my_bags": 0
   },
   {
    "country": "Burundi",
    "producers": 2,
    "roasters": 1,
    "offerings": 2,
    "my_bags": 0
   },
   {
    "country": "Rwanda",
    "producers": 2,
    "roasters": 2,
    "offerings": 2,
    "my_bags": 0
   },
   {
    "country": "Bolivia",
    "producers": 2,
    "roasters": 2,
    "offerings": 2,
    "my_bags": 0
   },
   {
    "country": "Yemen",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Coffee Discovery Set",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Denmark",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Drip Coffee Bags",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Finca",
    "producers": 1,
    "roasters": 1,
    "offerings": 2,
    "my_bags": 0
   },
   {
    "country": "Indonesia",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Kayon Mountain",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Panama + Guatemala",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Piedra candela",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Sumatra",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Timor-Leste",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "Assembly Decaf",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   }
  ],
  "counter_countries": [
   "Brazil",
   "Colombia",
   "Ethiopia",
   "Kenya",
   "Mexico"
  ],
  "shared_producers": [
   {
    "name": "Finca El Paraíso (Bermúdez)",
    "country": "Colombia",
    "region": null,
    "roasters": 8,
    "offerings": 51,
    "roasted_by": [
     "Archers Coffee",
     "Black & White Coffee Roasters",
     "Botz Coffee",
     "Hydrangea Coffee Roasters",
     "NATIVE Coffee Co.",
     "Offshoot Coffee",
     "Onyx Coffee Lab",
     "September Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Hacienda La Esmeralda",
    "country": "Panama",
    "region": "Jaramillo",
    "roasters": 6,
    "offerings": 26,
    "roasted_by": [
     "Black & White Coffee Roasters",
     "Hydrangea Coffee Roasters",
     "Offshoot Coffee",
     "Onyx Coffee Lab",
     "Proud Mary Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Danche",
    "country": "Ethiopia",
    "region": "Gedeo, Gedeb",
    "roasters": 6,
    "offerings": 12,
    "roasted_by": [
     "Friedhats",
     "Luna Coffee",
     "Makeworth Coffee",
     "Offshoot Coffee",
     "September Coffee",
     "SEY"
    ],
    "in_my_bags": true
   },
   {
    "name": "Finca Soledad",
    "country": "Ecuador",
    "region": "Imababura",
    "roasters": 5,
    "offerings": 27,
    "roasted_by": [
     "Archers Coffee",
     "Black & White Coffee Roasters",
     "Hydrangea Coffee Roasters",
     "Proud Mary Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Hachi Project",
    "country": "Panama",
    "region": "Chiriquí",
    "roasters": 5,
    "offerings": 18,
    "roasted_by": [
     "Archers Coffee",
     "Hydrangea Coffee Roasters",
     "NATIVE Coffee Co.",
     "Offshoot Coffee",
     "September Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Chelbesa",
    "country": "Ethiopia",
    "region": "Gedeb",
    "roasters": 5,
    "offerings": 10,
    "roasted_by": [
     "Friedhats",
     "Hydrangea Coffee Roasters",
     "Luna Coffee",
     "September Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Gesha Village",
    "country": "Ethiopia",
    "region": "Bench Maji, Ethiopia",
    "roasters": 5,
    "offerings": 10,
    "roasted_by": [
     "April Coffee Roasters",
     "Black & White Coffee Roasters",
     "Friedhats",
     "Offshoot Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "El Vergel",
    "country": "Colombia",
    "region": "Tolima",
    "roasters": 5,
    "offerings": 8,
    "roasted_by": [
     "Archers Coffee",
     "Black & White Coffee Roasters",
     "Hydrangea Coffee Roasters",
     "Onyx Coffee Lab",
     "Weathered Hands Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Elida Estate",
    "country": "Panama",
    "region": "Falda",
    "roasters": 4,
    "offerings": 22,
    "roasted_by": [
     "Archers Coffee",
     "Black & White Coffee Roasters",
     "Proud Mary Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Kii",
    "country": "Kenya",
    "region": "Kirinyaga",
    "roasters": 4,
    "offerings": 6,
    "roasted_by": [
     "Botz Coffee",
     "Friedhats",
     "Luna Coffee",
     "Sweven Coffee"
    ],
    "in_my_bags": true
   },
   {
    "name": "Habtamu Fikadu",
    "country": "Ethiopia",
    "region": "Gedeb",
    "roasters": 4,
    "offerings": 5,
    "roasted_by": [
     "Botz Coffee",
     "Heart Coffee Roasters",
     "Luna Coffee",
     "September Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Nestor Lasso",
    "country": "Colombia",
    "region": "Pitalito, Huila",
    "roasters": 4,
    "offerings": 5,
    "roasted_by": [
     "Black & White Coffee Roasters",
     "Luna Coffee",
     "Offshoot Coffee",
     "September Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Finca Hartmann",
    "country": "Panama",
    "region": "Santa Clara, Renacimiento, Chiriquí",
    "roasters": 3,
    "offerings": 44,
    "roasted_by": [
     "Archers Coffee",
     "Hydrangea Coffee Roasters",
     "Proud Mary Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "El Mirador",
    "country": "Colombia",
    "region": "Palestina, Huila",
    "roasters": 3,
    "offerings": 17,
    "roasted_by": [
     "Offshoot Coffee",
     "Push x Pull",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Finca Nuguo (Gallardo)",
    "country": "Panama",
    "region": null,
    "roasters": 3,
    "offerings": 15,
    "roasted_by": [
     "Archers Coffee",
     "Hydrangea Coffee Roasters",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "La Esperanza",
    "country": "Colombia",
    "region": "Valle del Cauca",
    "roasters": 3,
    "offerings": 12,
    "roasted_by": [
     "Archers Coffee",
     "Hydrangea Coffee Roasters",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Diego Horta",
    "country": "Colombia",
    "region": null,
    "roasters": 3,
    "offerings": 11,
    "roasted_by": [
     "Black & White Coffee Roasters",
     "Friedhats",
     "Onyx Coffee Lab"
    ],
    "in_my_bags": false
   },
   {
    "name": "Jairo Arcila",
    "country": "Colombia",
    "region": "Villarazo, Quindío",
    "roasters": 3,
    "offerings": 10,
    "roasted_by": [
     "Friedhats",
     "Offshoot Coffee",
     "Proud Mary Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Keramo",
    "country": "Ethiopia",
    "region": null,
    "roasters": 3,
    "offerings": 8,
    "roasted_by": [
     "Botz Coffee",
     "September Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Buku Sayisa",
    "country": "Ethiopia",
    "region": "West Guji",
    "roasters": 3,
    "offerings": 8,
    "roasted_by": [
     "Friedhats",
     "Hydrangea Coffee Roasters",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Finca Sophia",
    "country": "Panama",
    "region": "Neuva Suiza, Panama",
    "roasters": 3,
    "offerings": 8,
    "roasted_by": [
     "Archers Coffee",
     "Proud Mary Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Kibingo",
    "country": "Burundi",
    "region": "Kayanza",
    "roasters": 3,
    "offerings": 7,
    "roasted_by": [
     "Offshoot Coffee",
     "Proud Mary Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Bookkisa",
    "country": "Ethiopia",
    "region": null,
    "roasters": 3,
    "offerings": 6,
    "roasted_by": [
     "Friedhats",
     "Kuma Coffee",
     "September Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Bumba Hill",
    "country": "Burundi",
    "region": "Kayanza",
    "roasters": 3,
    "offerings": 6,
    "roasted_by": [
     "Offshoot Coffee",
     "September Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Mil Cumbres",
    "country": "Panama",
    "region": "Volcan, Chiriqui",
    "roasters": 3,
    "offerings": 6,
    "roasted_by": [
     "Archers Coffee",
     "Friedhats",
     "Offshoot Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "La Muralla",
    "country": "Colombia",
    "region": null,
    "roasters": 3,
    "offerings": 5,
    "roasted_by": [
     "Friedhats",
     "September Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Karimikui",
    "country": "Kenya",
    "region": "Embu, Mt. Kenya",
    "roasters": 3,
    "offerings": 4,
    "roasted_by": [
     "Friedhats",
     "Luna Coffee",
     "Offshoot Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Las Lajas",
    "country": "Costa Rica",
    "region": "Finca San Isidro",
    "roasters": 3,
    "offerings": 4,
    "roasted_by": [
     "Offshoot Coffee",
     "Onyx Coffee Lab",
     "Proud Mary Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Iris Estate",
    "country": "Panama",
    "region": "Volcán, Chiriqui",
    "roasters": 3,
    "offerings": 4,
    "roasted_by": [
     "Archers Coffee",
     "Black & White Coffee Roasters",
     "Offshoot Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Las Margaritas",
    "country": "Colombia",
    "region": "Valle del Cauca",
    "roasters": 3,
    "offerings": 4,
    "roasted_by": [
     "Archers Coffee",
     "Hydrangea Coffee Roasters",
     "Offshoot Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Las Perlitas",
    "country": "Colombia",
    "region": null,
    "roasters": 3,
    "offerings": 3,
    "roasted_by": [
     "Botz Coffee",
     "September Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Duwancho",
    "country": "Ethiopia",
    "region": "Sidama",
    "roasters": 3,
    "offerings": 3,
    "roasted_by": [
     "Assembly Coffee",
     "Offshoot Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Nemba",
    "country": "Burundi",
    "region": "Kayanza",
    "roasters": 3,
    "offerings": 3,
    "roasted_by": [
     "Offshoot Coffee",
     "Proud Mary Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Gatomboya",
    "country": "Kenya",
    "region": null,
    "roasters": 3,
    "offerings": 3,
    "roasted_by": [
     "Botz Coffee",
     "Kuma Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Kiamugumo",
    "country": "Kenya",
    "region": "Kirinyaga",
    "roasters": 3,
    "offerings": 3,
    "roasted_by": [
     "Friedhats",
     "Merit Coffee",
     "Offshoot Coffee"
    ],
    "in_my_bags": false
   },
   {
    "name": "Gahahe",
    "country": "Burundi",
    "region": "Gahahe, Kayanza",
    "roasters": 3,
    "offerings": 3,
    "roasted_by": [
     "Offshoot Coffee",
     "Proud Mary Coffee",
     "SEY"
    ],
    "in_my_bags": false
   },
   {
    "name": "Halo Beriti",
    "country": "Ethiopia",
    "region": "Worka, Gedeb, Yirgacheffe",
    "roasters": 3,
    "offerings": 3,
    "roasted_by": [
     "Friedhats",
     "Offshoot Coffee",
     "SEY"
    ],
    "in_my_bags": false
   }
  ],
  "totals": {
   "roasters": 40,
   "producers": 2059,
   "offerings": 4217,
   "offerings_available": 817,
   "offerings_with_producer": 547,
   "last_release": "2026-10-29 08:49:42-07:00"
  },
  "last_scrape": {
   "fired_at": "2026-10-29 12:36:31.764423-07:00",
   "status": "ok",
   "summary": "refresh complete 2026-10-29T12:38"
  }
 }
};
