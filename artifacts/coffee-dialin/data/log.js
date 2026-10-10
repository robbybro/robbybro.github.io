window.DIALIN = {
 "generated_at": "2026-10-10T15:33-07:00",
 "source": "postgres claude: coffee_bags, coffee_shots, coffee_experiments, kv coffee-dialin, coffee_* (untamped), kv marzocco-telemetry",
 "rules": {
  "_doc": "Espresso house rules for Balthamos (Linea Mini R) + Zerno Z2. SOURCE OF TRUTH since 2026-10-10 (the Coffee Dial-In sheet is retired; its Reference tab is preserved verbatim in `sections`). Shots live in coffee_shots, bags in coffee_bags (data.dialin). Edit `laws`/`priors`/`rules` here; the public page renders `sections` and these fields.",
  "laws": {
   "timing": "clock starts at pump start and INCLUDES the 5 s pre-brew; target 30–35 s total (classic 25–30 + 5)",
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
   "source": "~/git/marzocco-water (house default agreed 2026-07-11)",
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
  "retired_sheet": {
   "id": "1H55uA6EMT98yAonN8Il2PudnP_SHZfeegY-9bA0qYNk",
   "note": "read-only history; never write to it again",
   "retired_on": "2026-10-10",
   "imported_by": "import_coffee_dialin.py"
  },
  "retired_tools": {
   "distributor": "edge flow + bald middle, +4 s (9/9)",
   "Weber blind shaker": "clumps with RDT"
  },
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
   "queued": null
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
     "settled": false
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
   "shots": 4,
   "last_shot": {
    "id": 25,
    "shot_at": "2026-10-10T12:24:00-07:00",
    "burrs": "Core",
    "microns": 225,
    "rpm": 600,
    "dose_g": 18,
    "yield_g": 38,
    "time_s": 18.4,
    "ratio": 2.11,
    "taste": null,
    "verdict": "spray much reduced — too fast",
    "next_change": "→ 200 at 600 RPM; if <22s go 190",
    "by_whom": null
   },
   "queued": {
    "id": 26,
    "shot_at": "2026-10-10T12:25:00-07:00",
    "burrs": "Core",
    "microns": 200,
    "rpm": 600,
    "dose_g": 18,
    "next_change": "aim 25–30s, watch spray stays calm as it goes finer"
   }
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
   "queued": {
    "id": 21,
    "shot_at": "2026-09-13T12:20:00-07:00",
    "burrs": "Core",
    "microns": 167,
    "rpm": 1200,
    "dose_g": 18,
    "next_change": "aim 33–36s, cut 34"
   }
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
   "queued": null
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
   "queued": null
  },
  {
   "id": 7,
   "short_name": "Ghost Rider",
   "label": "Proud Mary — Ghost Rider (Brazil + Ethiopia, natural)",
   "verdict": null,
   "noted_at": "2026-08-31 12:00:00-07:00",
   "offering_id": 2296,
   "data": {
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
   "queued": null
  }
 ],
 "shots": [
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
   "by_whom": "Robby"
  },
  {
   "id": 26,
   "shot_at": "2026-10-10 12:25:00-07:00",
   "bag": "Makeworth Danche",
   "method": "espresso",
   "status": "queued",
   "burrs": "Core",
   "microns": 200,
   "rpm": 600,
   "dose_g": "18",
   "yield_g": null,
   "time_s": null,
   "ratio": null,
   "taste": null,
   "verdict": null,
   "next_change": "aim 25–30s, watch spray stays calm as it goes finer",
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
  },
  {
   "id": 21,
   "shot_at": "2026-09-13 12:20:00-07:00",
   "bag": "Oaxaca (D. Garcia)",
   "method": "espresso",
   "status": "queued",
   "burrs": "Core",
   "microns": 167,
   "rpm": 1200,
   "dose_g": "18",
   "yield_g": "37",
   "time_s": null,
   "ratio": "2.06",
   "taste": null,
   "verdict": null,
   "next_change": "aim 33–36s, cut 34",
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": "Emily"
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
   "by_whom": "Robby"
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
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
   "by_whom": null
  }
 ],
 "experiments": [
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
  "last_shot_at": "2026-10-10 15:09:47.429041-07:00",
  "shots_7d": 5,
  "shots_30d": 6,
  "shots_total": 27,
  "queued": 2,
  "bags_settled": 3,
  "bags_dialing": 3,
  "backflush": {
   "last": "2026-09-15",
   "cadence_days": 90,
   "days_ago": 25
  },
  "machine_shots_7d": 10,
  "machine_telemetry_at": "2026-10-10T13:15:45+00:00"
 },
 "origin": {
  "provenance": [
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
    "offerings": 35,
    "producers": 16,
    "in_my_bags": true
   },
   {
    "name": "Makeworth Coffee",
    "city": "Bellingham, WA",
    "country": "USA",
    "lat": 48.7519,
    "lng": -122.4787,
    "website": "https://makeworthcoffee.com",
    "offerings": 15,
    "producers": 3,
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
    "producers": 12,
    "in_my_bags": true
   },
   {
    "name": "Archers Coffee",
    "city": "Dubai",
    "country": "UAE",
    "lat": 25.2048,
    "lng": 55.2708,
    "website": "https://archerscoffee.com",
    "offerings": 221,
    "producers": 103,
    "in_my_bags": false
   },
   {
    "name": "Coffee Collective",
    "city": "Copenhagen",
    "country": "Denmark",
    "lat": 55.6828,
    "lng": 12.5357,
    "website": "https://coffeecollective.dk",
    "offerings": 53,
    "producers": 30,
    "in_my_bags": false
   },
   {
    "name": "Onyx Coffee Lab",
    "city": "Rogers, AR",
    "country": "USA",
    "lat": 36.332,
    "lng": -94.1185,
    "website": "https://onyxcoffeelab.com",
    "offerings": 48,
    "producers": 24,
    "in_my_bags": false
   },
   {
    "name": "Assembly Coffee",
    "city": "London",
    "country": "UK",
    "lat": 51.4613,
    "lng": -0.1156,
    "website": "https://assemblycoffee.co.uk",
    "offerings": 43,
    "producers": 34,
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
    "producers": 17,
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
    "name": "Hydrangea Coffee Roasters",
    "city": "Petaluma, CA",
    "country": "USA",
    "lat": 38.2324,
    "lng": -122.6367,
    "website": "https://hydrangea.coffee",
    "offerings": 25,
    "producers": 12,
    "in_my_bags": false
   },
   {
    "name": "Bows & Arrows",
    "city": "Victoria, BC",
    "country": "Canada",
    "lat": 48.4284,
    "lng": -123.3656,
    "website": "https://bowsandarrowscoffee.com",
    "offerings": 24,
    "producers": 9,
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
    "name": "September Coffee",
    "city": "Vancouver, BC",
    "country": "Canada",
    "lat": 49.2827,
    "lng": -123.1207,
    "website": "https://september.coffee",
    "offerings": 22,
    "producers": 8,
    "in_my_bags": false
   },
   {
    "name": "Devoción",
    "city": "Brooklyn, NY",
    "country": "USA",
    "lat": 40.7176,
    "lng": -73.9629,
    "website": "https://devocion.com",
    "offerings": 21,
    "producers": 11,
    "in_my_bags": false
   },
   {
    "name": "Friedhats",
    "city": "Amsterdam",
    "country": "Netherlands",
    "lat": 52.3676,
    "lng": 4.9041,
    "website": "https://www.friedhats.com",
    "offerings": 21,
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
    "offerings": 19,
    "producers": 15,
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
    "name": "POMA Coffee Research Lab",
    "city": "Copenhagen",
    "country": "Denmark",
    "lat": 55.6761,
    "lng": 12.5683,
    "website": "https://www.pomacoffee.com",
    "offerings": 18,
    "producers": 1,
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
    "name": "La Cabra",
    "city": "Copenhagen (HQ Aarhus) + NYC",
    "country": "Denmark",
    "lat": 56.1572,
    "lng": 10.2107,
    "website": "https://www.lacabra.dk",
    "offerings": 12,
    "producers": 0,
    "in_my_bags": false
   },
   {
    "name": "Prolog Coffee",
    "city": "Copenhagen",
    "country": "Denmark",
    "lat": 55.669,
    "lng": 12.5586,
    "website": "https://prologcoffee.com",
    "offerings": 12,
    "producers": 11,
    "in_my_bags": false
   },
   {
    "name": "Heart Coffee Roasters",
    "city": "Portland, OR",
    "country": "USA",
    "lat": 45.5231,
    "lng": -122.6765,
    "website": "https://www.heartroasters.com",
    "offerings": 11,
    "producers": 6,
    "in_my_bags": false
   },
   {
    "name": "Sweven Coffee",
    "city": "Bristol",
    "country": "UK",
    "lat": 51.4545,
    "lng": -2.5879,
    "website": "https://www.swevencoffee.co.uk",
    "offerings": 10,
    "producers": 9,
    "in_my_bags": false
   },
   {
    "name": "SEY",
    "city": "Brooklyn, NY",
    "country": "USA",
    "lat": 40.7057,
    "lng": -73.9204,
    "website": "https://www.seycoffee.com",
    "offerings": 10,
    "producers": 9,
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
   }
  ],
  "countries": [
   {
    "country": "Colombia",
    "producers": 92,
    "roasters": 18,
    "offerings": 121,
    "my_bags": 1
   },
   {
    "country": "Panama",
    "producers": 66,
    "roasters": 7,
    "offerings": 141,
    "my_bags": 0
   },
   {
    "country": "Ethiopia",
    "producers": 51,
    "roasters": 17,
    "offerings": 88,
    "my_bags": 1
   },
   {
    "country": "Peru",
    "producers": 22,
    "roasters": 7,
    "offerings": 28,
    "my_bags": 0
   },
   {
    "country": "Kenya",
    "producers": 19,
    "roasters": 12,
    "offerings": 29,
    "my_bags": 0
   },
   {
    "country": "Guatemala",
    "producers": 17,
    "roasters": 9,
    "offerings": 17,
    "my_bags": 0
   },
   {
    "country": "Brazil",
    "producers": 11,
    "roasters": 5,
    "offerings": 16,
    "my_bags": 0
   },
   {
    "country": "Costa Rica",
    "producers": 10,
    "roasters": 7,
    "offerings": 16,
    "my_bags": 0
   },
   {
    "country": "Ecuador",
    "producers": 10,
    "roasters": 6,
    "offerings": 11,
    "my_bags": 0
   },
   {
    "country": "Honduras",
    "producers": 9,
    "roasters": 6,
    "offerings": 11,
    "my_bags": 0
   },
   {
    "country": "Bolivia",
    "producers": 7,
    "roasters": 3,
    "offerings": 7,
    "my_bags": 0
   },
   {
    "country": "Mexico",
    "producers": 6,
    "roasters": 5,
    "offerings": 7,
    "my_bags": 0
   },
   {
    "country": "Nicaragua",
    "producers": 5,
    "roasters": 2,
    "offerings": 7,
    "my_bags": 0
   },
   {
    "country": "El Salvador",
    "producers": 4,
    "roasters": 3,
    "offerings": 4,
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
    "country": "Burundi",
    "producers": 3,
    "roasters": 2,
    "offerings": 3,
    "my_bags": 0
   },
   {
    "country": "Uganda",
    "producers": 2,
    "roasters": 2,
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
    "country": "DR Congo",
    "producers": 2,
    "roasters": 1,
    "offerings": 2,
    "my_bags": 0
   },
   {
    "country": "Zambia",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
    "my_bags": 0
   },
   {
    "country": "China",
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
    "offerings": 4,
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
    "country": "Timor-Leste",
    "producers": 1,
    "roasters": 1,
    "offerings": 1,
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
   "Mexico"
  ],
  "shared_producers": [
   {
    "name": "Finca El Paraíso (Bermúdez)",
    "country": "Colombia",
    "region": null,
    "roasters": 7,
    "offerings": 49,
    "roasted_by": [
     "Archers Coffee",
     "Black & White Coffee Roasters",
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
    "name": "Finca Soledad",
    "country": "Ecuador",
    "region": "Imababura",
    "roasters": 5,
    "offerings": 26,
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
    "name": "Danche",
    "country": "Ethiopia",
    "region": "Gedeo, Gedeb",
    "roasters": 5,
    "offerings": 11,
    "roasted_by": [
     "Friedhats",
     "Makeworth Coffee",
     "Offshoot Coffee",
     "September Coffee",
     "SEY"
    ],
    "in_my_bags": true
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
    "name": "Finca Hartmann",
    "country": "Panama",
    "region": "Santa Clara, Renacimiento, Chiriquí",
    "roasters": 3,
    "offerings": 41,
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
    "offerings": 16,
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
    "name": "Buku Sayisa",
    "country": "Ethiopia",
    "region": "West Guji",
    "roasters": 3,
    "offerings": 7,
    "roasted_by": [
     "Friedhats",
     "Hydrangea Coffee Roasters",
     "SEY"
    ],
    "in_my_bags": false
   }
  ],
  "totals": {
   "roasters": 25,
   "producers": 1879,
   "offerings": 3719,
   "offerings_available": 757,
   "offerings_with_producer": 530,
   "last_release": "2026-09-30 16:42:02-07:00"
  },
  "last_scrape": {
   "fired_at": "2026-10-01 14:34:55.884683-07:00",
   "status": "error",
   "summary": "RuntimeError: unparseable response from https://aprilcoffeeroasters.com/products.json?limit=250&page=1: Expecting value: line 1 column 1 (char 0)",
   "failing_runs": 6,
   "failing_since": "2026-10-01 06:40:39.488990-07:00",
   "last_ok": null
  }
 }
};
