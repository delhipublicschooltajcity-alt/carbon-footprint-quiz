/* =========================================================
   CONFIG
   ========================================================= */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwv6RkxDakPptLFkBntJx7Q9gZO_46ymanX-lctuh-rvvLKXXgv9lKLFitcmwZYTXsMjQ/exec";
const LS_KEY = "dps_tajcity_cf_vfinal";
const LB_KEY = "dps_tajcity_leaderboard";

const FAMILY_SIZE = 4;
const BASE_GLOBAL_PER_PERSON_T = 6.6;
const BASE_INDIA_PER_PERSON_T = 1.89;

const ARENAS = ["transport", "home", "devices", "food", "waste"];
const LABEL = {
  transport: "🚗 Transport",
  home:      "🏠 Home Energy",
  devices:   "📱 Devices",
  food:      "🍲 Food",
  waste:     "🗑️ Waste"
};

const AREA_WEIGHTS = { transport: 0.22, home: 0.26, devices: 0.10, food: 0.28, waste: 0.14 };


/* =========================================================
   STATUS HELPERS — Alarming / Warning / Safe
   ---------------------------------------------------------
   ≤ 4.5 tCO₂e/yr  →  ✅ Safe      (green)
   4.5 – 7.0        →  ⚠️ Warning   (amber)
   > 7.0            →  🚨 Alarming  (red)
   ========================================================= */
function getCO2Status(totalT) {
  if (totalT <= 4.5)  return { level: "safe",     label: "Safe",     cls: "safe",     icon: "✅" };
  if (totalT <= 7.0)  return { level: "warning",  label: "Warning",  cls: "warning",  icon: "⚠️" };
  return                      { level: "alarming", label: "Alarming", cls: "alarming", icon: "🚨" };
}

function statusMessage(status) {
  if (status.level === "safe")    return "Your carbon footprint is within a safe range. Great habits — keep it up!";
  if (status.level === "warning") return "Your carbon footprint is moderate. A few habit changes can bring it down.";
  return "Your carbon footprint is alarmingly high. Immediate action is recommended to reduce emissions.";
}

function areaTag(co2T) {
  if (co2T <= 0.8) return "✅ Good";
  if (co2T <= 1.6) return "⚠️ Can Improve";
  return "🚨 Needs Focus";
}

function bandByCO2(totalT) {
  if (totalT <= 3.0) return { badge: "🏆 Eco Champion",    where: "Excellent! Very low footprint habits." };
  if (totalT <= 4.5) return { badge: "🌟 Green Leader",    where: "Low footprint overall. A couple of small upgrades can improve further." };
  if (totalT <= 6.0) return { badge: "✅ Eco Smart",       where: "Good progress. Improve 1–2 habits to reduce footprint further." };
  if (totalT <= 8.0) return { badge: "🌱 Getting Started", where: "Good base. Start with easy wins (shared travel, efficient cooling, waste separation)." };
  return              { badge: "🚀 Ready for Change",       where: "High footprint today. Choose two improvements this week and stay consistent." };
}


/* =========================================================
   CO₂ ESTIMATION
   ========================================================= */
function estimateFamilyCO2FromFootprintScore(score) {
  var s = Math.max(0, Math.min(100, Number(score) || 0));
  var minT = 2.0, maxT = 12.0;
  return Math.round((minT + (s / 100) * (maxT - minT)) * 10) / 10;
}


/* =========================================================
   QUIZ QUESTIONS (15 total, 5 arenas × 3 each)
   ========================================================= */
var QUIZ = [
  // ── transport ──
  { arena: "transport", text: "How does your child usually go to school?", options: [
    { label: "Walk / Cycle", pts: 5 },
    { label: "School bus / shared van", pts: 4 },
    { label: "Carpool with other parents", pts: 4 },
    { label: "Private car (only family)", pts: 1 }
  ]},
  { arena: "transport", text: "When waiting near school, the vehicle engine is…", options: [
    { label: "Always switched off", pts: 5 },
    { label: "Sometimes switched off", pts: 3 },
    { label: "Mostly kept on", pts: 1 }
  ]},
  { arena: "transport", text: "Vehicle servicing + tyre pressure checks are…", options: [
    { label: "Regular", pts: 5 },
    { label: "Occasional", pts: 3 },
    { label: "Rare", pts: 1 }
  ]},

  // ── home ──
  { arena: "home", text: "AC usage at home on most days is…", options: [
    { label: "No AC", pts: 5 },
    { label: "0–2 hours/day", pts: 4 },
    { label: "2–5 hours/day", pts: 3 },
    { label: "5+ hours/day", pts: 1 }
  ]},
  { arena: "home", text: "If you use AC, which type is mostly used?", options: [
    { label: "No AC", pts: 5 },
    { label: "Split AC (inverter / newer)", pts: 4 },
    { label: "Split AC (older)", pts: 3 },
    { label: "Window AC (older)", pts: 2 },
    { label: "Not sure", pts: 3 }
  ]},
  { arena: "home", text: "Most of your home lighting is…", options: [
    { label: "Mostly LED", pts: 5 },
    { label: "Mix of LED + old bulbs", pts: 3 },
    { label: "Mostly old bulbs/tubes", pts: 1 }
  ]},

  // ── devices ──
  { arena: "devices", text: "At night, plugs for TV/chargers are…", options: [
    { label: "Mostly switched off", pts: 5 },
    { label: "Sometimes switched off", pts: 3 },
    { label: "Rarely switched off", pts: 1 }
  ]},
  { arena: "devices", text: "Family screen time per day (TV + mobile + laptop) is…", options: [
    { label: "< 2 hours", pts: 5 },
    { label: "2–4 hours", pts: 4 },
    { label: "4–6 hours", pts: 2 },
    { label: "6+ hours", pts: 1 }
  ]},
  { arena: "devices", text: "Microwave use at home is…", options: [
    { label: "Rare / almost never", pts: 5 },
    { label: "1–3 times/week", pts: 4 },
    { label: "Most days (1–2 times/day)", pts: 3 },
    { label: "Many times/day", pts: 2 }
  ]},

  // ── food ──
  { arena: "food", text: "How often does food get wasted at home?", options: [
    { label: "Rarely", pts: 5 },
    { label: "Sometimes", pts: 3 },
    { label: "Often", pts: 1 }
  ]},
  { arena: "food", text: "Fruits/vegetables at home are mostly…", options: [
    { label: "Local + seasonal", pts: 5 },
    { label: "Mixed", pts: 3 },
    { label: "Mostly packaged/imported", pts: 1 }
  ]},
  { arena: "food", text: "Cooking at home is mainly done using…", options: [
    { label: "Induction mostly", pts: 5 },
    { label: "Mix of induction + gas", pts: 4 },
    { label: "Gas mostly", pts: 3 },
    { label: "Not sure", pts: 3 }
  ]},

  // ── waste ──
  { arena: "waste", text: "Do you segregate wet and dry waste at home?", options: [
    { label: "Yes, regularly", pts: 5 },
    { label: "Sometimes", pts: 3 },
    { label: "No", pts: 1 }
  ]},
  { arena: "waste", text: "Kitchen waste (peels/leftovers) is usually…", options: [
    { label: "Compost at home / give for composting", pts: 5 },
    { label: "Sometimes compost, sometimes mixed", pts: 3 },
    { label: "Thrown with all waste", pts: 1 }
  ]},
  { arena: "waste", text: "Single-use plastic (bags/cups) use is…", options: [
    { label: "Rare", pts: 5 },
    { label: "Sometimes", pts: 3 },
    { label: "Often", pts: 1 }
  ]}
];


/* =========================================================
   STATE
   ========================================================= */
var state = {
  profile: { parentName: "", phone: "", address: "", childClass: "" },
  arenaIndex: 0,
  answers: {},
  submittedOnce: false,
  submissionId: null
};


/* =========================================================
   DOM REFS
   ========================================================= */
var el = function(id) { return document.getElementById(id); };

var stepProfile  = el("stepProfile");
var stepQuiz     = el("stepQuiz");
var stepResults  = el("stepResults");

var parentNameEl = el("parentName");
var phoneEl      = el("phone");
var addressEl    = el("address");
var childClassEl = el("childClass");

var btnStart    = el("btnStart");
var arenaPill   = el("arenaPill");
var qText       = el("qText");
var qSub        = el("qSub");
var optionsEl   = el("options");
var btnBack     = el("btnBack");
var btnNext     = el("btnNext");
var progFill    = el("progFill");
var progText    = el("progText");

var badgeTextEl       = el("badgeText");
var whereYouAreEl     = el("whereYouAre");
var resultStatusBadge = el("resultStatusBadge");
var co2TotalEl        = el("co2Total");
var compareBarsEl     = el("compareBars");
var arenaScoresEl     = el("arenaScores");
var recommendationsEl = el("recommendations");

var btnRestart   = el("btnRestart");
var btnRefreshLB = el("btnRefreshLB");
var submitStatus = el("submitStatus");
var leaderboardEl = el("leaderboard");


/* =========================================================
   UTILS
   ========================================================= */
function save() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function clearSave() { localStorage.removeItem(LS_KEY); }

function show(which) {
  stepProfile.style.display = which === "profile" ? "block" : "none";
  stepQuiz.style.display    = which === "quiz"    ? "block" : "none";
  stepResults.style.display = which === "results" ? "block" : "none";
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSubmissionId() {
  if (state.submissionId) return state.submissionId;
  state.submissionId = "sub_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  save();
  return state.submissionId;
}


/* =========================================================
   ARENA HELPERS
   ========================================================= */
function getArenaQuestionIndexes(arena) {
  var idx = [];
  QUIZ.forEach(function(q, qi) { if (q.arena === arena) idx.push(qi); });
  return idx;
}

function isArenaComplete(arena) {
  return getArenaQuestionIndexes(arena).every(function(qi) {
    return state.answers[qi] !== undefined;
  });
}


/* =========================================================
   CALC: FOOTPRINT SCORES
   ========================================================= */
function calcFootprintScores() {
  var agg = {};
  ARENAS.forEach(function(a) { agg[a] = { got: 0, max: 0 }; });

  QUIZ.forEach(function(q, qi) {
    var maxPts = Math.max.apply(null, q.options.map(function(o) { return o.pts; }));
    agg[q.arena].max += maxPts;
    var pick = state.answers[qi];
    if (pick !== undefined) agg[q.arena].got += q.options[pick].pts;
  });

  var arenaFootprint = {};
  ARENAS.forEach(function(a) {
    var got = agg[a].got, max = agg[a].max;
    var eco = max ? Math.round((got / max) * 100) : 0;
    arenaFootprint[a] = 100 - eco;
  });

  var sum = 0;
  ARENAS.forEach(function(a) { sum += arenaFootprint[a]; });
  var overall = Math.round(sum / ARENAS.length);

  return { overallFootprintScore: overall, arenaFootprint: arenaFootprint };
}


/* =========================================================
   CALC: CO₂ BREAKDOWN
   ========================================================= */
function calcCO2Breakdown(overallFootprintScore, arenaFootprint) {
  var totalT = estimateFamilyCO2FromFootprintScore(overallFootprintScore);

  var intensity = {};
  ARENAS.forEach(function(a) {
    var s = Math.max(0, Math.min(100, arenaFootprint[a]));
    intensity[a] = 0.6 + (s / 100) * 0.8;
  });

  var sum = 0;
  var raw = {};
  ARENAS.forEach(function(a) { raw[a] = AREA_WEIGHTS[a] * intensity[a]; sum += raw[a]; });

  var byAreaT = {};
  ARENAS.forEach(function(a) { byAreaT[a] = Math.round((totalT * (raw[a] / sum)) * 10) / 10; });

  return { totalT: totalT, byAreaT: byAreaT };
}


/* =========================================================
   COMPARISON BARS
   ========================================================= */
function renderComparisonBars(yourT) {
  var indiaT  = Math.round((BASE_INDIA_PER_PERSON_T * FAMILY_SIZE) * 10) / 10;
  var globalT = Math.round((BASE_GLOBAL_PER_PERSON_T * FAMILY_SIZE) * 10) / 10;
  var maxV = Math.max(yourT, indiaT, globalT, 0.1);

  var rows = [
    { name: "Your family", val: yourT },
    { name: "India avg",   val: indiaT },
    { name: "Global avg",  val: globalT }
  ];

  compareBarsEl.innerHTML = rows.map(function(r) {
    return '<div class="cbar">' +
      '<div class="cbarName">' + esc(r.name) + '</div>' +
      '<div class="cbarTrack"><div class="cbarFill" style="width:' + Math.round((r.val / maxV) * 100) + '%"></div></div>' +
      '<div class="cbarVal">' + r.val.toFixed(1) + '</div>' +
    '</div>';
  }).join("");
}


/* =========================================================
   RECOMMENDATIONS
   ========================================================= */
function buildRecommendations(totalT, byAreaT) {
  var sorted = Object.keys(byAreaT).sort(function(a, b) { return byAreaT[b] - byAreaT[a]; });
  var worst1 = sorted[0];
  var worst2 = sorted[1];
  var best   = Object.keys(byAreaT).sort(function(a, b) { return byAreaT[a] - byAreaT[b]; })[0];

  var tips = {
    transport: [
      "Prefer school bus or a consistent carpool for daily commute.",
      "Switch off engine while waiting near school gate (avoid idling).",
      "Maintain tyre pressure + regular service for better mileage."
    ],
    home: [
      "If buying new: prefer inverter split AC (more efficient than older window AC).",
      "Reduce AC hours; use fan first where possible.",
      "Switch remaining bulbs to LED starting with most-used rooms."
    ],
    devices: [
      "Switch off TV/set-top box/chargers at night (reduce standby power).",
      "Reduce background screen time (TV running while not watching).",
      "Use microwave only when needed; avoid repeated reheating cycles."
    ],
    food: [
      "Plan portions and store leftovers properly to reduce food waste.",
      "Prefer seasonal/local fruits and vegetables more often.",
      "Use pressure cooker/covered cooking when possible to save fuel."
    ],
    waste: [
      "Segregate wet and dry waste daily (two bins).",
      "Compost kitchen waste (peels/leftovers) if possible.",
      "Carry reusable cloth bag; reduce single-use plastic."
    ]
  };

  function explainArea(a) { return LABEL[a] + " ≈ " + byAreaT[a].toFixed(1) + " tCO₂e/yr"; }
  function listHTML(arr) { return "<ul>" + arr.map(function(x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; }

  var blocks = [];
  if (worst1) {
    blocks.push("<p><b>Top area to reduce first:</b> " + explainArea(worst1) + "</p>" + listHTML(tips[worst1].slice(0, 3)));
  }
  if (worst2) {
    blocks.push("<p><b>Second focus area:</b> " + explainArea(worst2) + "</p>" + listHTML(tips[worst2].slice(0, 3)));
  }

  var co2Status = getCO2Status(totalT);
  var statusBlock =
    "<p><b>" + co2Status.icon + " Overall status: " + co2Status.label + "</b></p>" +
    "<p>" + statusMessage(co2Status) + "</p>";

  var meaning =
    "<p><b>Meaning</b></p>" +
    "<ul>" +
      "<li>This is an <b>approximate CO₂ estimate</b> based on habits (not a lab measurement).</li>" +
      "<li><b>Lower CO₂ is better</b> (lower emissions).</li>" +
      "<li>Comparison uses <b>family of " + FAMILY_SIZE + "</b> as reference.</li>" +
      "<li><b>≤ 4.5 tCO₂e</b> = ✅ Safe &nbsp;|&nbsp; <b>4.5–7.0</b> = ⚠️ Warning &nbsp;|&nbsp; <b>&gt; 7.0</b> = 🚨 Alarming</li>" +
    "</ul>";

  var bestNote = best ? "<p><b>Your strongest area:</b> " + LABEL[best] + " (keep this habit strong)</p>" : "";

  return statusBlock + meaning + blocks.join("") + bestNote;
}


/* =========================================================
   RENDER: ARENA PAGE (quiz step)
   ========================================================= */
function renderArenaPage() {
  var arena = ARENAS[state.arenaIndex];
  var qIdx  = getArenaQuestionIndexes(arena);

  arenaPill.textContent = LABEL[arena];
  qText.textContent     = "Answer these questions";
  qSub.textContent      = "";

  progText.textContent = (state.arenaIndex + 1) + "/" + ARENAS.length;
  progFill.style.width = Math.round((state.arenaIndex / ARENAS.length) * 100) + "%";

  optionsEl.innerHTML = "";

  qIdx.forEach(function(qi, pos) {
    var q = QUIZ[qi];
    var selected = state.answers[qi];

    var block = document.createElement("div");
    block.className = "qblock";

    var title = document.createElement("div");
    title.className = "qblockTitle";
    title.textContent = (pos + 1) + ". " + q.text;
    block.appendChild(title);

    var wrap = document.createElement("div");
    wrap.className = "qblockOptions";

    q.options.forEach(function(opt, oi) {
      var div = document.createElement("div");
      div.className = "opt" + (selected === oi ? " selected" : "");
      div.innerHTML = '<div class="o1">' + opt.label + '</div>';
      div.onclick = function() {
        state.answers[qi] = oi;
        save();
        btnNext.disabled = !isArenaComplete(arena);
        renderArenaPage();
      };
      wrap.appendChild(div);
    });

    block.appendChild(wrap);
    optionsEl.appendChild(block);
  });

  btnBack.disabled    = state.arenaIndex === 0;
  btnNext.disabled    = !isArenaComplete(arena);
  btnNext.textContent = (state.arenaIndex === ARENAS.length - 1) ? "Finish →" : "Next →";
}


/* =========================================================
   RENDER: RESULTS
   ========================================================= */
function renderResults() {
  var scores  = calcFootprintScores();
  var co2     = calcCO2Breakdown(scores.overallFootprintScore, scores.arenaFootprint);
  var totalT  = co2.totalT;
  var byAreaT = co2.byAreaT;
  var band    = bandByCO2(totalT);
  var status  = getCO2Status(totalT);

  badgeTextEl.textContent   = band.badge;
  whereYouAreEl.textContent = band.where;

  // Big status badge
  resultStatusBadge.innerHTML =
    '<div class="result-status result-' + status.cls + '">' +
      '<span class="dot"></span>' +
      status.icon + " " + status.label + " — " + statusMessage(status) +
    '</div>';

  co2TotalEl.textContent = "≈ " + totalT.toFixed(1) + " tCO₂e/year (" + Math.round(totalT * 1000) + " kg/year)";
  renderComparisonBars(totalT);

  arenaScoresEl.innerHTML = "";
  ARENAS.forEach(function(a) {
    var t = byAreaT[a];
    var box = document.createElement("div");
    box.className = "box";
    box.innerHTML =
      '<div class="k">' + LABEL[a] + '</div>' +
      '<div class="co2">≈ ' + t.toFixed(1) + ' tCO₂e/year</div>' +
      '<div class="kg">(' + Math.round(t * 1000) + ' kg/year)</div>' +
      '<div class="tag">' + areaTag(t) + '</div>';
    arenaScoresEl.appendChild(box);
  });

  recommendationsEl.innerHTML = buildRecommendations(totalT, byAreaT);
}


/* =========================================================
   VALIDATE PROFILE
   ========================================================= */
function saveProfileOrAlert() {
  var parentName = (parentNameEl.value || "").trim();
  var phone      = (phoneEl.value || "").trim();
  var address    = (addressEl.value || "").trim();
  var childClass = (childClassEl.value || "").trim().replace(/\s+/g, "");

  if (!parentName || !phone || !address || !childClass) {
    alert("Please fill Parent Name, Phone, Address, and Child Class.");
    return null;
  }
  var digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) {
    alert("Please enter a valid 10-digit phone number.");
    return null;
  }
  if (!/^(?:[1-9]|1[0-2])$/.test(childClass)) {
    alert("Child Class should be a number from 1 to 12.");
    return null;
  }

  return { parentName: parentName, phone: digits, address: address, childClass: childClass };
}

function buildAnswerPayload() {
  var out = {};
  QUIZ.forEach(function(q, qi) {
    var pick = state.answers[qi];
    out["Q" + (qi + 1) + " (" + q.arena + ")"] = (pick !== undefined) ? q.options[pick].label : "";
  });
  return out;
}


/* =========================================================
   LOCAL LEADERBOARD STORAGE
   ========================================================= */
function getLocalLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
  catch(e) { return []; }
}

function saveToLocalLeaderboard(entry) {
  var lb = getLocalLeaderboard();
  // Prevent duplicate submissions
  var exists = -1;
  for (var i = 0; i < lb.length; i++) {
    if (lb[i].submissionId === entry.submissionId) { exists = i; break; }
  }
  if (exists >= 0) lb[exists] = entry;
  else lb.push(entry);
  // Sort ascending by CO₂ (lowest = best)
  lb.sort(function(a, b) { return a.co2Total - b.co2Total; });
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}


/* =========================================================
   SUBMIT TO GOOGLE SHEET + LOCAL
   ========================================================= */
function submitToSheet() {
  if (state.submittedOnce) return;

  submitStatus.textContent = "Saving…";

  var scores  = calcFootprintScores();
  var co2     = calcCO2Breakdown(scores.overallFootprintScore, scores.arenaFootprint);
  var totalT  = co2.totalT;
  var byAreaT = co2.byAreaT;
  var band    = bandByCO2(totalT);
  var status  = getCO2Status(totalT);

  var recHTML = buildRecommendations(totalT, byAreaT);
  var recText = recHTML
    .replace(/<li>/g, "• ")
    .replace(/<\/li>/g, "\n")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  var submissionId = getSubmissionId();

  // Always save locally
  saveToLocalLeaderboard({
    submissionId: submissionId,
    name: state.profile.parentName,
    childClass: state.profile.childClass,
    co2Total: totalT,
    badge: band.badge,
    status: status.label,
    statusLevel: status.level
  });

  var payload = {
    submissionId: submissionId,
    parentName: state.profile.parentName,
    phone: state.profile.phone,
    address: state.profile.address,
    childClass: state.profile.childClass,
    badgeLabel: band.badge,
    statusLabel: status.label,
    recommendationsText: recText,
    co2: {
      total: totalT,
      transport: byAreaT.transport,
      home: byAreaT.home,
      devices: byAreaT.devices,
      food: byAreaT.food,
      waste: byAreaT.waste
    },
    answers: buildAnswerPayload()
  };

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(function() {
    state.submittedOnce = true;
    save();
    submitStatus.textContent = "✅ Saved!";
  }).catch(function() {
    state.submittedOnce = true;
    save();
    submitStatus.textContent = "⚠️ Could not reach server — saved locally.";
  }).finally(function() {
    renderLeaderboard();
  });
}


/* =========================================================
   LEADERBOARD RENDER
   ========================================================= */
function renderLeaderboard() {
  var lb = getLocalLeaderboard();

  if (!lb.length) {
    leaderboardEl.innerHTML = '<div class="no-data">No submissions yet. Be the first!</div>';
    return;
  }

  function medal(r) {
    if (r === 1) return "🥇";
    if (r === 2) return "🥈";
    if (r === 3) return "🥉";
    return "#" + r;
  }

  leaderboardEl.innerHTML = "";

  lb.forEach(function(row, i) {
    var rank   = i + 1;
    var co2    = Number(row.co2Total) || 0;
    var status = getCO2Status(co2);

    var div = document.createElement("div");
    div.className = "lbrow";
    div.innerHTML =
      '<div class="rank">' + medal(rank) + '</div>' +
      '<div class="info">' +
        '<div class="name">' + esc(row.name || "Anonymous") + '</div>' +
        '<div class="detail">Class ' + esc(row.childClass || "-") + ' • ' + esc(row.badge || "") + '</div>' +
      '</div>' +
      '<div>' +
        '<span class="status-badge status-' + status.cls + '">' +
          '<span class="dot"></span>' +
          status.label +
        '</span>' +
      '</div>' +
      '<div class="co2val">' +
        '<b>' + co2.toFixed(1) + ' tCO₂e/yr</b>' +
        '<div class="sub">(' + Math.round(co2 * 1000) + ' kg/yr)</div>' +
      '</div>';
    leaderboardEl.appendChild(div);
  });
}

/* Try fetching remote leaderboard from Google Sheet */
function loadRemoteLeaderboard() {
  fetch(APPS_SCRIPT_URL + "?action=leaderboard&limit=20")
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (!json.ok) return;
      var all = (json.podium || []).concat(json.others || []);
      if (!all.length) return;

      all.forEach(function(row) {
        var co2 = Number(row.co2Total) || 0;
        var status = getCO2Status(co2);
        saveToLocalLeaderboard({
          submissionId: row.submissionId || ("remote_" + row.name + "_" + row.className),
          name: row.name || "Anonymous",
          childClass: row.className || "-",
          co2Total: co2,
          badge: row.badge || "",
          status: status.label,
          statusLevel: status.level
        });
      });

      renderLeaderboard();
    })
    .catch(function() {
      console.log("Remote leaderboard unavailable, showing local data.");
    });
}


/* =========================================================
   EVENT HANDLERS
   ========================================================= */
btnStart.onclick = function() {
  var profile = saveProfileOrAlert();
  if (!profile) return;

  state.profile       = profile;
  state.arenaIndex    = 0;
  state.answers       = {};
  state.submittedOnce = false;
  state.submissionId  = null;
  save();

  show("quiz");
  renderArenaPage();
};

btnBack.onclick = function() {
  state.arenaIndex = Math.max(0, state.arenaIndex - 1);
  save();
  renderArenaPage();
};

btnNext.onclick = function() {
  var arena = ARENAS[state.arenaIndex];
  if (!isArenaComplete(arena)) return;

  state.arenaIndex += 1;
  save();

  if (state.arenaIndex >= ARENAS.length) {
    show("results");
    renderResults();
    submitToSheet();
    loadRemoteLeaderboard();
  } else {
    renderArenaPage();
  }
};

btnRestart.onclick = function() {
  clearSave();
  state = {
    profile: { parentName: "", phone: "", address: "", childClass: "" },
    arenaIndex: 0,
    answers: {},
    submittedOnce: false,
    submissionId: null
  };
  parentNameEl.value  = "";
  phoneEl.value       = "";
  addressEl.value     = "";
  childClassEl.value  = "";
  submitStatus.textContent = "";
  show("profile");
};

btnRefreshLB.onclick = function() {
  renderLeaderboard();
  loadRemoteLeaderboard();
};


/* =========================================================
   INIT
   ========================================================= */
show("profile");
