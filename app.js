/* =========================================================
   CONFIG
   ========================================================= */
var APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwv6RkxDakPptLFkBntJx7Q9gZO_46ymanX-lctuh-rvvLKXXgv9lKLFitcmwZYTXsMjQ/exec";
var LS_KEY  = "dps_tajcity_cf_v4";
var LB_KEY  = "dps_tajcity_lb_v4";
var FAMILY_SIZE = 4;
var BASE_GLOBAL_PER_PERSON_T = 6.6;
var BASE_INDIA_PER_PERSON_T  = 1.89;

var ARENAS = ["transport","home","devices","food","waste"];
var LABEL  = {
  transport: "🚗 Transport",
  home:      "🏠 Home Energy",
  devices:   "📱 Devices",
  food:      "🍲 Food",
  waste:     "🗑️ Waste"
};

/* =================================================================
   QUIZ — 11 questions, 5 arenas
   Each option has a REAL CO₂ value (tCO₂e/year for family of 4).
   Based on Indian emission factors & realistic household data.
   ================================================================= */
var QUIZ = [
  /* ── TRANSPORT (2 questions) ── */
  {arena:"transport", text:"How does your child usually go to school?", options:[
    {label:"School bus",               co2: 0.20},
    {label:"Shared van",               co2: 0.35},
    {label:"Carpool with other parents",co2: 0.50},
    {label:"Private car",              co2: 1.20}
  ]},
  {arena:"transport", text:"When waiting near school, the vehicle engine is…", options:[
    {label:"Always switched off",     co2: 0.00},
    {label:"Sometimes switched off",  co2: 0.15},
    {label:"Mostly kept on",          co2: 0.45}
  ]},

  /* ── HOME ENERGY (3 questions) ── */
  {arena:"home", text:"AC usage at home on most days is…", options:[
    {label:"No AC",            co2: 0.00},
    {label:"0–2 hours/day",    co2: 0.40},
    {label:"2–5 hours/day",    co2: 1.10},
    {label:"5+ hours/day",     co2: 2.20}
  ]},
  {arena:"home", text:"If you use AC, which type is mostly used?", options:[
    {label:"No AC",                                co2: 0.00},
    {label:"Split AC (inverter / newer)",          co2: 0.20},
    {label:"Split AC (more than 6 years old)",     co2: 0.50},
    {label:"Window AC (more than 6 years old)",    co2: 0.80}
  ]},
  {arena:"home", text:"Most of your home lighting is…", options:[
    {label:"LED",                 co2: 0.10},
    {label:"LED + Bulbs",         co2: 0.35},
    {label:"Old bulbs / tubes",   co2: 0.70}
  ]},

  /* ── DEVICES (2 questions) ── */
  {arena:"devices", text:"Family screen time per day (mobile + laptop) is…", options:[
    {label:"< 2 hours",   co2: 0.08},
    {label:"2–4 hours",   co2: 0.20},
    {label:"4–6 hours",   co2: 0.40},
    {label:"6+ hours",    co2: 0.65}
  ]},
  {arena:"devices", text:"Microwave use at home is…", options:[
    {label:"Rare / almost never",        co2: 0.02},
    {label:"1–3 times/week",             co2: 0.08},
    {label:"Most days (1–2 times/day)",  co2: 0.18},
    {label:"Many times/day",             co2: 0.35}
  ]},

  /* ── FOOD (2 questions) ── */
  {arena:"food", text:"How often does food get wasted at home?", options:[
    {label:"Rarely",     co2: 0.10},
    {label:"Sometimes",  co2: 0.55},
    {label:"Often",      co2: 1.20}
  ]},
  {arena:"food", text:"Cooking at home is mainly done using…", options:[
    {label:"Induction",              co2: 0.20},
    {label:"Mix of induction + gas", co2: 0.45},
    {label:"Gas",                    co2: 0.70}
  ]},

  /* ── WASTE (2 questions) ── */
  {arena:"waste", text:"Do you segregate wet and dry waste at home?", options:[
    {label:"Yes, regularly",  co2: 0.05},
    {label:"Sometimes",       co2: 0.30},
    {label:"No",              co2: 0.65}
  ]},
  {arena:"waste", text:"Single-use plastic (bags/cups) use is…", options:[
    {label:"Rare",       co2: 0.05},
    {label:"Sometimes",  co2: 0.25},
    {label:"Often",      co2: 0.60}
  ]}
];


/* =========================================================
   STATUS HELPERS
   ========================================================= */
function getCO2Status(t) {
  if (t <= 4.0)  return {level:"safe",    label:"Safe",    cls:"safe",    icon:"✅"};
  if (t <= 7.0)  return {level:"warning", label:"Warning", cls:"warning", icon:"⚠️"};
  return                {level:"alarming",label:"Alarming",cls:"alarming",icon:"🚨"};
}

function statusMessage(s) {
  if (s.level === "safe")    return "Your family's carbon footprint is low — excellent habits!";
  if (s.level === "warning") return "Moderate footprint. A few changes can make a big difference.";
  return "High footprint — immediate action recommended.";
}

function areaTag(t) {
  if (t <= 0.5) return "✅ Great";
  if (t <= 1.2) return "⚠️ Can Improve";
  return "🚨 Needs Attention";
}

function areaColor(t) {
  if (t <= 0.5) return "#48db97";
  if (t <= 1.2) return "#ffc148";
  return "#ff5858";
}

function bandByCO2(t) {
  if (t <= 2.5) return {badge:"🏆 Eco Champion",    where:"Outstanding — among the lowest footprint families!"};
  if (t <= 4.0) return {badge:"🌟 Green Leader",    where:"Great habits. Small tweaks can make you a champion."};
  if (t <= 6.0) return {badge:"✅ Eco Aware",       where:"Good start. Focus on 1–2 areas to improve."};
  if (t <= 8.0) return {badge:"🌱 Getting Started", where:"Room to grow. Easy wins are within reach."};
  return               {badge:"🚀 Ready for Change",where:"High footprint. Pick two changes and start today."};
}


/* =========================================================
   STATE
   ========================================================= */
var state = {
  profile: {parentName:"", phone:"", address:"", childClass:""},
  arenaIndex: 0, answers: {}, submittedOnce: false, submissionId: null
};
(function(){
  try { var s = JSON.parse(localStorage.getItem(LS_KEY)); if (s && s.profile) state = s; } catch(e){}
})();


/* =========================================================
   DOM REFS
   ========================================================= */
function $(id) { return document.getElementById(id); }

var stepProfile  = $("stepProfile"),  stepQuiz = $("stepQuiz"),  stepResults = $("stepResults");
var parentNameEl = $("parentName"),   phoneEl = $("phone"),      addressEl = $("address"), childClassEl = $("childClass");
var btnStart     = $("btnStart"),     arenaPill = $("arenaPill"), qText = $("qText"), qSub = $("qSub");
var optionsEl    = $("options"),       btnBack = $("btnBack"),    btnNext = $("btnNext");
var progFill     = $("progFill"),     progText = $("progText");
var badgeTextEl  = $("badgeText"),    whereYouAreEl = $("whereYouAre"), resultStatusBadge = $("resultStatusBadge");
var co2TotalEl   = $("co2Total"),     compareBarsEl = $("compareBars"), arenaScoresEl = $("arenaScores");
var gaugeFill    = $("gaugeFill");
var recommendationsEl = $("recommendations");
var btnRestart   = $("btnRestart"),   btnRefreshLB = $("btnRefreshLB");
var submitStatus = $("submitStatus"), leaderboardEl = $("leaderboard");


/* =========================================================
   HELPERS
   ========================================================= */
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e){} }
function clearSave() { try { localStorage.removeItem(LS_KEY); } catch(e){} }

function show(w) {
  stepProfile.style.display = w === "profile" ? "block" : "none";
  stepQuiz.style.display    = w === "quiz"    ? "block" : "none";
  stepResults.style.display = w === "results" ? "block" : "none";
  window.scrollTo(0,0);
}

function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function getSubmissionId() {
  if (state.submissionId) return state.submissionId;
  state.submissionId = "sub_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  save();
  return state.submissionId;
}

function getArenaQIs(arena) {
  var o = [];
  for (var i = 0; i < QUIZ.length; i++) { if (QUIZ[i].arena === arena) o.push(i); }
  return o;
}

function isArenaComplete(arena) {
  var q = getArenaQIs(arena);
  for (var i = 0; i < q.length; i++) { if (state.answers[q[i]] === undefined) return false; }
  return true;
}


/* =========================================================
   SCORING — Direct CO₂ sum
   ========================================================= */
function calcCO2() {
  var byArea = {};
  var i, a;
  for (i = 0; i < ARENAS.length; i++) byArea[ARENAS[i]] = 0;

  for (i = 0; i < QUIZ.length; i++) {
    var pick = state.answers[i];
    if (pick !== undefined && pick !== null) {
      byArea[QUIZ[i].arena] += QUIZ[i].options[pick].co2;
    }
  }

  var totalT = 0;
  for (i = 0; i < ARENAS.length; i++) {
    a = ARENAS[i];
    byArea[a] = Math.round(byArea[a] * 100) / 100;
    totalT += byArea[a];
  }
  totalT = Math.round(totalT * 100) / 100;

  return { totalT: totalT, byAreaT: byArea };
}


/* =========================================================
   COMPARISON BARS
   ========================================================= */
function renderComparisonBars(yourT) {
  var indiaT  = Math.round(BASE_INDIA_PER_PERSON_T * FAMILY_SIZE * 10) / 10;
  var globalT = Math.round(BASE_GLOBAL_PER_PERSON_T * FAMILY_SIZE * 10) / 10;
  var maxV = Math.max(yourT, indiaT, globalT, 0.1);
  var rows = [
    {name:"Your family", val:yourT},
    {name:"India avg",   val:indiaT},
    {name:"Global avg",  val:globalT}
  ];

  var html = "";
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var pct = Math.round((r.val / maxV) * 100);
    var color;
    if (r.name === "Your family") {
      color = yourT <= 4.0
        ? "background:#48db97"
        : yourT <= 7.0 ? "background:#ffc148" : "background:#ff5858";
    } else {
      color = "background:linear-gradient(90deg,rgba(116,185,255,.95),rgba(83,255,192,.85))";
    }
    html += '<div class="cbar"><div class="cbarName">' + esc(r.name) + '</div><div class="cbarTrack"><div class="cbarFill" style="width:' + pct + '%;' + color + '"></div></div><div class="cbarVal">' + r.val.toFixed(1) + '</div></div>';
  }
  compareBarsEl.innerHTML = html;
}


/* =========================================================
   RECOMMENDATIONS
   ========================================================= */
function buildRecommendations(totalT, byAreaT) {
  var keys = Object.keys(byAreaT);
  keys.sort(function(a,b) { return byAreaT[b] - byAreaT[a]; });
  var worst1 = keys[0], worst2 = keys[1];
  var keysAsc = keys.slice().sort(function(a,b) { return byAreaT[a] - byAreaT[b]; });
  var best = keysAsc[0];

  var tips = {
    transport: [
      "Prefer school bus or carpool for daily commute.",
      "Switch off engine while waiting near school.",
      "Maintain tyre pressure + regular service for better mileage."
    ],
    home: [
      "Prefer inverter split AC (much more efficient).",
      "Reduce AC hours — use fan first where possible.",
      "Switch all bulbs to LED starting with most-used rooms."
    ],
    devices: [
      "Reduce background screen time (device running while not in use).",
      "Switch off chargers at night (standby power adds up).",
      "Use microwave only when needed; avoid repeated reheating."
    ],
    food: [
      "Plan portions and store leftovers to cut waste.",
      "Use pressure cooker / covered cooking to save fuel.",
      "Buy seasonal and local produce when possible."
    ],
    waste: [
      "Segregate wet and dry waste daily (two bins).",
      "Compost kitchen waste if possible.",
      "Use reusable bags — reduce single-use plastic."
    ]
  };

  function ea(a) { return LABEL[a] + " ≈ " + byAreaT[a].toFixed(2) + " tCO₂e/yr"; }
  function ul(arr) { var h = "<ul>"; for (var i = 0; i < arr.length; i++) h += "<li>" + arr[i] + "</li>"; return h + "</ul>"; }

  var out = "";

  if (worst1 && byAreaT[worst1] > 0) {
    out += "<p><b>🔴 Top area to reduce:</b> " + ea(worst1) + "</p>" + ul(tips[worst1] || []);
  }
  if (worst2 && byAreaT[worst2] > 0) {
    out += "<p><b>🟡 Second focus:</b> " + ea(worst2) + "</p>" + ul(tips[worst2] || []);
  }
  if (best) {
    out += "<p><b>🟢 Strongest area:</b> " + LABEL[best] + " (" + byAreaT[best].toFixed(2) + " tCO₂e) — keep it up!</p>";
  }
  return out;
}


/* =========================================================
   RENDER: QUIZ
   ========================================================= */
function renderArenaPage() {
  var arena = ARENAS[state.arenaIndex];
  var qis = getArenaQIs(arena);

  arenaPill.textContent = LABEL[arena];
  qText.textContent = "Answer these questions";
  qSub.textContent = "";
  progText.textContent = (state.arenaIndex + 1) + "/" + ARENAS.length;
  progFill.style.width = Math.round((state.arenaIndex / ARENAS.length) * 100) + "%";

  optionsEl.innerHTML = "";
  for (var p = 0; p < qis.length; p++) {
    var qi = qis[p], q = QUIZ[qi], selected = state.answers[qi];
    var block = document.createElement("div"); block.className = "qblock";
    var title = document.createElement("div"); title.className = "qblockTitle";
    title.textContent = (p + 1) + ". " + q.text;
    block.appendChild(title);

    var wrap = document.createElement("div"); wrap.className = "qblockOptions";
    for (var oi = 0; oi < q.options.length; oi++) {
      (function(questionIdx, optionIdx, opt) {
        var div = document.createElement("div");
        div.className = "opt" + (selected === optionIdx ? " selected" : "");
        div.innerHTML = '<div class="o1">' + opt.label + '</div>';
        div.onclick = function() {
          state.answers[questionIdx] = optionIdx;
          save();
          btnNext.disabled = !isArenaComplete(arena);
          renderArenaPage();
        };
        wrap.appendChild(div);
      })(qi, oi, q.options[oi]);
    }
    block.appendChild(wrap);
    optionsEl.appendChild(block);
  }

  btnBack.disabled = state.arenaIndex === 0;
  btnNext.disabled = !isArenaComplete(arena);
  btnNext.textContent = (state.arenaIndex === ARENAS.length - 1) ? "Finish →" : "Next →";
}


/* =========================================================
   RENDER: RESULTS
   ========================================================= */
function renderResults() {
  var result  = calcCO2();
  var totalT  = result.totalT;
  var byAreaT = result.byAreaT;
  var band    = bandByCO2(totalT);
  var status  = getCO2Status(totalT);

  badgeTextEl.textContent   = band.badge;
  whereYouAreEl.textContent = band.where;
  resultStatusBadge.innerHTML =
    '<div class="result-status result-' + status.cls + '"><span class="dot"></span>' +
    status.icon + ' ' + status.label + ' — ' + statusMessage(status) + '</div>';

  co2TotalEl.textContent = "≈ " + totalT.toFixed(1) + " tCO₂e / year";

  var gaugeMax = 12;
  var gaugePct = Math.min(Math.round((totalT / gaugeMax) * 100), 100);
  gaugeFill.style.left = gaugePct + "%";

  renderComparisonBars(totalT);

  var maxArea = 0;
  for (var i = 0; i < ARENAS.length; i++) {
    if (byAreaT[ARENAS[i]] > maxArea) maxArea = byAreaT[ARENAS[i]];
  }

  arenaScoresEl.innerHTML = "";
  for (var i = 0; i < ARENAS.length; i++) {
    var a = ARENAS[i], t = byAreaT[a];
    var barPct = maxArea > 0 ? Math.round((t / Math.max(maxArea, 0.1)) * 100) : 0;
    var box = document.createElement("div"); box.className = "box";
    box.innerHTML =
      '<div class="k">' + LABEL[a] + '</div>' +
      '<div class="co2">' + t.toFixed(2) + ' tCO₂e</div>' +
      '<div class="kg">' + Math.round(t * 1000) + ' kg/yr</div>' +
      '<div class="area-bar"><div class="area-bar-fill" style="width:' + barPct + '%;background:' + areaColor(t) + '"></div></div>' +
      '<div class="tag">' + areaTag(t) + '</div>';
    arenaScoresEl.appendChild(box);
  }

  recommendationsEl.innerHTML = buildRecommendations(totalT, byAreaT);
}


/* =========================================================
   PROFILE VALIDATION
   ========================================================= */
function validateProfile() {
  var pn = (parentNameEl.value || "").trim();
  var ph = (phoneEl.value || "").trim();
  var ad = (addressEl.value || "").trim();
  var cc = (childClassEl.value || "").trim();

  if (!pn || !ph || !ad || !cc) {
    alert("Please fill Parent Name, Phone, Address, and Child Class.");
    return null;
  }
  var digits = ph.replace(/\D/g, "");
  if (digits.length !== 10) {
    alert("Please enter a valid 10-digit phone number.");
    return null;
  }

  return { parentName: pn, phone: digits, address: ad, childClass: cc };
}

function buildAnswerPayload() {
  var out = {};
  for (var i = 0; i < QUIZ.length; i++) {
    var p = state.answers[i];
    out["Q" + (i + 1) + " (" + QUIZ[i].arena + ")"] = (p !== undefined && p !== null) ? QUIZ[i].options[p].label : "";
  }
  return out;
}


/* =========================================================
   LOCAL LEADERBOARD (fallback)
   ========================================================= */
function getLocalLB() { try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; } catch(e) { return []; } }

function saveLocalLB(entry) {
  var lb = getLocalLB();
  var exists = -1;
  for (var i = 0; i < lb.length; i++) { if (lb[i].submissionId === entry.submissionId) { exists = i; break; } }
  if (exists >= 0) lb[exists] = entry; else lb.push(entry);
  lb.sort(function(a,b) { return a.co2Total - b.co2Total; });
  try { localStorage.setItem(LB_KEY, JSON.stringify(lb)); } catch(e){}
}


/* =========================================================
   SUBMIT TO GOOGLE SHEET
   ========================================================= */
function submitToSheet() {
  if (state.submittedOnce) return;
  submitStatus.textContent = "Saving…";

  var result = calcCO2();
  var totalT = result.totalT, byAreaT = result.byAreaT;
  var band = bandByCO2(totalT), status = getCO2Status(totalT);
  var sid = getSubmissionId();

  saveLocalLB({
    submissionId: sid, name: state.profile.parentName, childClass: state.profile.childClass,
    co2Total: totalT, badge: band.badge, status: status.label, statusLevel: status.level
  });

  var recText = buildRecommendations(totalT, byAreaT)
    .replace(/<li>/g, "• ").replace(/<\/li>/g, "\n")
    .replace(/<\/p>/g, "\n\n").replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n").trim();

  var payload = {
    submissionId: sid,
    parentName: state.profile.parentName,
    phone: state.profile.phone,
    address: state.profile.address,
    childClass: state.profile.childClass,
    badgeLabel: band.badge,
    statusLabel: status.label,
    recommendationsText: recText,
    co2: { total: totalT, transport: byAreaT.transport, home: byAreaT.home, devices: byAreaT.devices, food: byAreaT.food, waste: byAreaT.waste },
    answers: buildAnswerPayload()
  };

  fetch(APPS_SCRIPT_URL, {
    method: "POST", mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
  .then(function() { state.submittedOnce = true; save(); submitStatus.textContent = "✅ Saved!"; })
  .catch(function() { state.submittedOnce = true; save(); submitStatus.textContent = "⚠️ Server unreachable — saved locally."; })
  .finally(function() { loadRemoteLB(); });
}


/* =========================================================
   LEADERBOARD — Render from Google Sheet (primary)
   ========================================================= */
function renderLeaderboard(data) {
  if (!data || !data.length) {
    var lb = getLocalLB();
    if (!lb.length) {
      leaderboardEl.innerHTML = '<div class="no-data">No submissions yet.</div>';
      return;
    }
    renderLeaderboardRows(lb);
    return;
  }
  renderLeaderboardRows(data);
}

function renderLeaderboardRows(lb) {
  function medal(r) { return r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : "#" + r; }

  leaderboardEl.innerHTML = "";
  for (var i = 0; i < lb.length; i++) {
    var row = lb[i], rank = i + 1;
    var co2 = Number(row.co2Total) || 0;
    var st = getCO2Status(co2);

    var div = document.createElement("div"); div.className = "lbrow";
    div.innerHTML =
      '<div class="rank">' + medal(rank) + '</div>' +
      '<div class="info"><div class="name">' + esc(row.name || "Anonymous") + '</div>' +
      '<div class="detail">Class ' + esc(row.childClass || row.className || "-") + ' • ' + esc(row.badge || "") + '</div></div>' +
      '<div><span class="status-badge status-' + st.cls + '"><span class="dot"></span>' + st.label + '</span></div>' +
      '<div class="co2val"><b>' + co2.toFixed(1) + ' tCO₂e/yr</b><div class="sub">(' + Math.round(co2 * 1000) + ' kg/yr)</div></div>';
    leaderboardEl.appendChild(div);
  }
}

function loadRemoteLB() {
  leaderboardEl.innerHTML = '<div class="lb-loading">Loading leaderboard…</div>';

  fetch(APPS_SCRIPT_URL + "?action=leaderboard&limit=20")
    .then(function(r) { return r.json(); })
    .then(function(json) {
      if (!json.ok) { renderLeaderboard(null); return; }
      var all = (json.podium || []).concat(json.others || []);
      if (!all.length) { renderLeaderboard(null); return; }

      var rows = [];
      for (var i = 0; i < all.length; i++) {
        var row = all[i];
        var co2 = Number(row.co2Total) || 0;
        if (co2 <= 0) continue;
        rows.push({
          submissionId: row.submissionId || ("r_" + i),
          name: row.name || "Anonymous",
          childClass: row.className || "-",
          co2Total: co2,
          badge: row.badge || "",
          status: getCO2Status(co2).label,
          statusLevel: getCO2Status(co2).level
        });
        saveLocalLB(rows[rows.length - 1]);
      }
      renderLeaderboard(rows);
    })
    .catch(function() {
      renderLeaderboard(null);
    });
}


/* =========================================================
   EVENTS
   ========================================================= */
btnStart.onclick = function() {
  var p = validateProfile(); if (!p) return;
  state.profile = p; state.arenaIndex = 0; state.answers = {};
  state.submittedOnce = false; state.submissionId = null;
  save(); show("quiz"); renderArenaPage();
};

btnBack.onclick = function() {
  state.arenaIndex = Math.max(0, state.arenaIndex - 1);
  save(); renderArenaPage();
};

btnNext.onclick = function() {
  var arena = ARENAS[state.arenaIndex];
  if (!isArenaComplete(arena)) return;
  state.arenaIndex++; save();
  if (state.arenaIndex >= ARENAS.length) {
    show("results"); renderResults(); submitToSheet();
  } else {
    renderArenaPage();
  }
};

btnRestart.onclick = function() {
  clearSave();
  state = { profile:{parentName:"",phone:"",address:"",childClass:""}, arenaIndex:0, answers:{}, submittedOnce:false, submissionId:null };
  parentNameEl.value = ""; phoneEl.value = ""; addressEl.value = ""; childClassEl.value = "";
  submitStatus.textContent = ""; show("profile");
};

btnRefreshLB.onclick = function() { loadRemoteLB(); };

/* INIT */
show("profile");
