const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwv6RkxDakPptLFkBntJx7Q9gZO_46ymanX-lctuh-rvvLKXXgv9lKLFitcmwZYTXsMjQ/exec";
const LS_KEY = "dps_tajcity_cf_v13";

/* =========================
   Baselines (per-person)
   - Global avg: 6.6 tCO2e/year (per capita)
   - India avg: 1.89 tCO2/year (per capita)
   We'll convert to "family" by multiplying by familySize (default 4)
========================= */
const BASE_GLOBAL_PER_PERSON_T = 6.6;
const BASE_INDIA_PER_PERSON_T = 1.89;

let familySize = 4;

/* ---------------- Footprint banding (LOWER is better) ---------------- */
function scoreBand(footprint){
  if (footprint <= 10) return { badge:"🏆 Eco Champion", where:"Excellent! Very low footprint habits." };
  if (footprint <= 20) return { badge:"🌟 Green Leader", where:"Low footprint overall. A couple of small upgrades can improve further." };
  if (footprint <= 35) return { badge:"✅ Eco Smart", where:"Good progress. Improve 1–2 habits to reduce footprint further." };
  if (footprint <= 55) return { badge:"🌱 Getting Started", where:"Good base. Start with easy wins (shared travel, efficient cooling, waste separation)." };
  return { badge:"🚀 Ready for Change", where:"High footprint today. Choose two improvements this week and stay consistent." };
}

/* ---------------- CO2 model (simple + explainable) ----------------
   Convert footprint score (0..100) -> total tCO2e/year.
   Keep range realistic for families (India urban): 2 to 12 tCO2e/year for family of 4.
   You can tune min/max later.
------------------------------------------------------------------- */
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function estimateFamilyCO2FromScore(score){
  const s = clamp(Number(score) || 0, 0, 100);
  const minT = 2.0;      // very low family footprint
  const maxT = 12.0;     // high family footprint
  const t = minT + (s/100) * (maxT - minT);
  return Math.round(t * 10) / 10; // 1 decimal
}

/* Split CO2 into areas using weights (must sum to 1.0) */
const AREA_WEIGHTS = {
  transport: 0.22,
  home:      0.26,
  devices:   0.10,
  food:      0.28,
  waste:     0.14
};

/* range tag for each area */
function areaVerdict(areaScore){
  // areaScore is footprint 0..100 (lower better)
  if (areaScore <= 20) return { tag:"✅ Good", text:"Low impact in this area." };
  if (areaScore <= 45) return { tag:"⚠️ Can Improve", text:"Some improvement possible." };
  return { tag:"🚨 Needs Focus", text:"Highest improvement potential." };
}

/* ---------------- Quiz structure ---------------- */
const ARENAS = ["transport","home","devices","food","waste"];
const LABEL = {
  transport:"🚗 Transport",
  home:"🏠 Home Energy",
  devices:"📱 Devices",
  food:"🍲 Food",
  waste:"🗑️ Waste"
};

const QUIZ = [
  { arena:"transport", text:"How does your child usually go to school?", options:[
    {label:"Walk / Cycle", pts:5},
    {label:"School bus / shared van", pts:4},
    {label:"Carpool with other parents", pts:4},
    {label:"Private car (only family)", pts:1},
  ]},
  { arena:"transport", text:"When waiting near school, the vehicle engine is…", options:[
    {label:"Always switched off", pts:5},
    {label:"Sometimes switched off", pts:3},
    {label:"Mostly kept on", pts:1},
  ]},
  { arena:"transport", text:"Vehicle servicing + tyre pressure checks are…", options:[
    {label:"Regular", pts:5},
    {label:"Occasional", pts:3},
    {label:"Rare", pts:1},
  ]},

  { arena:"home", text:"AC usage at home on most days is…", options:[
    {label:"No AC", pts:5},
    {label:"0–2 hours/day", pts:4},
    {label:"2–5 hours/day", pts:3},
    {label:"5+ hours/day", pts:1},
  ]},
  { arena:"home", text:"If you use AC, which type is mostly used?", options:[
    {label:"No AC", pts:5},
    {label:"Split AC (inverter / newer)", pts:4},
    {label:"Split AC (older)", pts:3},
    {label:"Window AC (older)", pts:2},
    {label:"Not sure", pts:3},
  ]},
  { arena:"home", text:"Most of your home lighting is…", options:[
    {label:"Mostly LED", pts:5},
    {label:"Mix of LED + old bulbs", pts:3},
    {label:"Mostly old bulbs/tubes", pts:1},
  ]},

  { arena:"devices", text:"At night, plugs for TV/chargers are…", options:[
    {label:"Mostly switched off", pts:5},
    {label:"Sometimes switched off", pts:3},
    {label:"Rarely switched off", pts:1},
  ]},
  { arena:"devices", text:"Family screen time per day (TV + mobile + laptop) is…", options:[
    {label:"< 2 hours", pts:5},
    {label:"2–4 hours", pts:4},
    {label:"4–6 hours", pts:2},
    {label:"6+ hours", pts:1},
  ]},
  { arena:"devices", text:"Microwave use at home is…", options:[
    {label:"Rare / almost never", pts:5},
    {label:"1–3 times/week", pts:4},
    {label:"Most days (1–2 times/day)", pts:3},
    {label:"Many times/day", pts:2},
  ]},

  { arena:"food", text:"How often does food get wasted at home?", options:[
    {label:"Rarely", pts:5},
    {label:"Sometimes", pts:3},
    {label:"Often", pts:1},
  ]},
  { arena:"food", text:"Fruits/vegetables at home are mostly…", options:[
    {label:"Local + seasonal", pts:5},
    {label:"Mixed", pts:3},
    {label:"Mostly packaged/imported", pts:1},
  ]},
  { arena:"food", text:"Cooking at home is mainly done using…", options:[
    {label:"Induction mostly", pts:5},
    {label:"Mix of induction + gas", pts:4},
    {label:"Gas mostly", pts:3},
    {label:"Not sure", pts:3},
  ]},

  { arena:"waste", text:"Do you segregate wet and dry waste at home?", options:[
    {label:"Yes, regularly", pts:5},
    {label:"Sometimes", pts:3},
    {label:"No", pts:1},
  ]},
  { arena:"waste", text:"Kitchen waste (peels/leftovers) is usually…", options:[
    {label:"Compost at home / give for composting", pts:5},
    {label:"Sometimes compost, sometimes mixed", pts:3},
    {label:"Thrown with all waste", pts:1},
  ]},
  { arena:"waste", text:"Single-use plastic (bags/cups) use is…", options:[
    {label:"Rare", pts:5},
    {label:"Sometimes", pts:3},
    {label:"Often", pts:1},
  ]},
];

/* ---------------- State ---------------- */
let state = {
  profile:{ parentName:"", phone:"", address:"", childClass:"" },
  arenaIndex:0,
  answers:{},
  _submittedOnce:false,
  submissionId:null
};

const el = (id) => document.getElementById(id);

const stepProfile = el("stepProfile");
const stepQuiz = el("stepQuiz");
const stepResults = el("stepResults");

const parentNameEl = el("parentName");
const phoneEl = el("phone");
const addressEl = el("address");
const childClassEl = el("childClass");

const btnStart = el("btnStart");
const arenaPill = el("arenaPill");
const qText = el("qText");
const qSub = el("qSub");
const optionsEl = el("options");
const btnBack = el("btnBack");
const btnNext = el("btnNext");
const progFill = el("progFill");
const progText = el("progText");

const overallScoreEl = el("overallScore");
const badgeTextEl = el("badgeText");
const whereYouAreEl = el("whereYouAre");
const arenaScoresEl = el("arenaScores");
const recommendationsEl = el("recommendations");

const co2TotalEl = el("co2Total");
const compareBarsEl = el("compareBars");
const famSizeEl = el("famSize");
const btnFamMinus = el("btnFamMinus");
const btnFamPlus = el("btnFamPlus");

const btnRestart = el("btnRestart");
const btnRefreshLB = el("btnRefreshLB");
const submitStatus = el("submitStatus");
const leaderboardEl = el("leaderboard");

/* ---------------- Storage ---------------- */
function save(){ localStorage.setItem(LS_KEY, JSON.stringify({state, familySize})); }
function clearSave(){ localStorage.removeItem(LS_KEY); }

function show(which){
  stepProfile.style.display = which==="profile" ? "block" : "none";
  stepQuiz.style.display = which==="quiz" ? "block" : "none";
  stepResults.style.display = which==="results" ? "block" : "none";
}

function esc(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getSubmissionId(){
  if(state.submissionId) return state.submissionId;
  state.submissionId = `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  save();
  return state.submissionId;
}

/* ---------------- Helpers ---------------- */
function getArenaQuestionIndexes(arena){
  const idx = [];
  QUIZ.forEach((q, qi) => { if(q.arena === arena) idx.push(qi); });
  return idx;
}
function isArenaComplete(arena){
  return getArenaQuestionIndexes(arena).every(qi => state.answers[qi] !== undefined);
}

/* ---------------- Scoring ----------------
   We compute eco% per area -> footprint score per area = 100 - eco%
   Lower footprint score = better
----------------------------------------- */
function calcScores(){
  const agg = Object.fromEntries(ARENAS.map(a => [a, {got:0, max:0}]));

  QUIZ.forEach((q, qi) => {
    const maxPts = Math.max(...q.options.map(o => o.pts));
    agg[q.arena].max += maxPts;

    const pick = state.answers[qi];
    if(pick !== undefined){
      agg[q.arena].got += q.options[pick].pts;
    }
  });

  const arenaEco = {};
  const arenaFootprint = {};

  ARENAS.forEach(a => {
    const {got, max} = agg[a];
    const eco = max ? Math.round((got/max)*100) : 0;
    arenaEco[a] = eco;
    arenaFootprint[a] = 100 - eco;
  });

  const ecoOverall = Math.round(
    (arenaEco.transport + arenaEco.home + arenaEco.devices + arenaEco.food + arenaEco.waste) / 5
  );
  const footprintOverall = 100 - ecoOverall;

  return { footprintOverall, arenaFootprint };
}

/* ---------------- CO2 split by areas ---------------- */
function calcCO2Breakdown(footprintOverall, arenaFootprint){
  const totalT = estimateFamilyCO2FromScore(footprintOverall);

  // scale each area by (weight * relative footprint intensity)
  // relative intensity: 0.6 .. 1.4 (based on area score)
  const intensity = {};
  ARENAS.forEach(a => {
    const s = clamp(arenaFootprint[a], 0, 100);
    intensity[a] = 0.6 + (s/100) * 0.8; // 0.6..1.4
  });

  // raw contribution
  let sum = 0;
  const raw = {};
  ARENAS.forEach(a => {
    raw[a] = AREA_WEIGHTS[a] * intensity[a];
    sum += raw[a];
  });

  // normalized to totalT
  const out = {};
  ARENAS.forEach(a => {
    out[a] = Math.round((totalT * (raw[a]/sum)) * 10) / 10;
  });

  return { totalT, byAreaT: out };
}

/* ---------------- Comparison bars ---------------- */
function renderComparisonBars(yourT){
  const indiaT = Math.round((BASE_INDIA_PER_PERSON_T * familySize) * 10) / 10;
  const globalT = Math.round((BASE_GLOBAL_PER_PERSON_T * familySize) * 10) / 10;

  const maxV = Math.max(yourT, indiaT, globalT, 0.1);

  const rows = [
    { name:"Your family", val: yourT },
    { name:"India avg", val: indiaT },
    { name:"Global avg", val: globalT }
  ];

  compareBarsEl.innerHTML = rows.map(r => `
    <div class="cbar">
      <div class="cbarName">${esc(r.name)}</div>
      <div class="cbarTrack"><div class="cbarFill" style="width:${Math.round((r.val/maxV)*100)}%"></div></div>
      <div class="cbarVal">${r.val.toFixed(1)}</div>
    </div>
  `).join("");
}

/* ---------------- Recommendations ---------------- */
function buildRecommendations({ footprintOverall, arenaFootprint }){
  const band = scoreBand(footprintOverall);

  const sorted = Object.entries(arenaFootprint).sort((a,b)=>b[1]-a[1]);
  const weakest = sorted[0]?.[0];

  const doByArena = {
    transport: [
      "Prefer school bus or a consistent carpool for routine commute.",
      "Switch off the engine while waiting near the school gate.",
      "Maintain tyre pressure and regular service."
    ],
    home: [
      "Prefer inverter split AC (if buying new).",
      "Use LED bulbs in the most-used rooms first.",
      "Avoid running AC with doors/windows open."
    ],
    devices: [
      "Switch off TV/set-top box/chargers at night.",
      "Reduce background screen time."
    ],
    food: [
      "Plan portions to reduce food waste.",
      "Prefer local + seasonal produce when possible."
    ],
    waste: [
      "Segregate wet and dry waste daily (two bins).",
      "Reduce single-use plastic by keeping cloth bags."
    ]
  };

  return `
    <p><b>${band.badge}</b></p>
    <p>${band.where}</p>
    <p><b>Top 3 actions to improve first</b></p>
    <ul>${(doByArena[weakest]||[]).slice(0,3).map(x=>`<li>${x}</li>`).join("")}</ul>
    <hr/>
    <p><b>Meaning</b></p>
    <ul>
      <li><b>Lower score</b> means lower estimated CO₂ emissions (based on habits).</li>
      <li>We also show <b>area-wise CO₂</b> so you know where impact is high.</li>
    </ul>
  `;
}

/* ---------------- Render arena page (3 questions together) ---------------- */
function renderArenaPage(){
  const arena = ARENAS[state.arenaIndex];
  const qIdx = getArenaQuestionIndexes(arena);

  arenaPill.textContent = LABEL[arena];
  qText.textContent = "Answer these questions";
  if(qSub) qSub.textContent = "";

  progText.textContent = `${state.arenaIndex+1}/${ARENAS.length}`;
  progFill.style.width = `${Math.round((state.arenaIndex / ARENAS.length) * 100)}%`;

  optionsEl.innerHTML = "";

  qIdx.forEach((qi, localPos) => {
    const q = QUIZ[qi];
    const selected = state.answers[qi];

    const block = document.createElement("div");
    block.className = "qblock";

    const title = document.createElement("div");
    title.className = "qblockTitle";
    title.textContent = `${localPos+1}. ${q.text}`;
    block.appendChild(title);

    const optWrap = document.createElement("div");
    optWrap.className = "qblockOptions";

    q.options.forEach((opt, oi) => {
      const div = document.createElement("div");
      div.className = "opt" + (selected === oi ? " selected" : "");
      div.innerHTML = `<div class="o1">${opt.label}</div>`;
      div.onclick = () => {
        state.answers[qi] = oi;
        save();
        btnNext.disabled = !isArenaComplete(arena);
        renderArenaPage();
      };
      optWrap.appendChild(div);
    });

    block.appendChild(optWrap);
    optionsEl.appendChild(block);
  });

  btnBack.disabled = state.arenaIndex === 0;
  btnNext.disabled = !isArenaComplete(arena);
  btnNext.textContent = (state.arenaIndex === ARENAS.length - 1) ? "Finish →" : "Next →";
}

/* ---------------- Render results (CO2 meaningful) ---------------- */
function renderResults(){
  const { footprintOverall, arenaFootprint } = calcScores();
  const band = scoreBand(footprintOverall);

  const { totalT, byAreaT } = calcCO2Breakdown(footprintOverall, arenaFootprint);

  overallScoreEl.textContent = footprintOverall;
  badgeTextEl.textContent = band.badge;
  whereYouAreEl.textContent = band.where;

  co2TotalEl.textContent = `≈ ${totalT.toFixed(1)} tCO₂e/year`;
  famSizeEl.textContent = String(familySize);
  renderComparisonBars(totalT);

  // 5 cards: show score + CO2 + good/bad
  arenaScoresEl.innerHTML = "";
  ARENAS.forEach(a => {
    const s = arenaFootprint[a];
    const v = areaVerdict(s);

    const box = document.createElement("div");
    box.className = "box";
    box.innerHTML = `
      <div class="k">${LABEL[a]}</div>
      <div class="v">${s}/100</div>
      <div class="subline"><b>≈ ${byAreaT[a].toFixed(1)} tCO₂e/year</b></div>
      <div class="subline">${v.text}</div>
      <div class="tag">${v.tag}</div>
    `;
    arenaScoresEl.appendChild(box);
  });

  recommendationsEl.innerHTML = buildRecommendations({ footprintOverall, arenaFootprint });
}

/* ---------------- Validate profile ---------------- */
function saveProfileOrAlert(){
  const parentName = (parentNameEl.value || "").trim();
  const phone = (phoneEl.value || "").trim();
  const address = (addressEl.value || "").trim();
  const childClass = (childClassEl.value || "").trim();

  if(!parentName || !phone || !address || !childClass){
    alert("Please fill Parent Name, Phone, Address, and Child Class.");
    return null;
  }

  const digits = phone.replace(/\D/g, "");
  if(digits.length !== 10){
    alert("Please enter a valid 10-digit phone number.");
    return null;
  }

  const cls = childClass.replace(/\s+/g,"");
  if(!/^(?:[1-9]|1[0-2])$/.test(cls)){
    alert("Child Class should be a number from 1 to 12.");
    return null;
  }

  return { parentName, phone: digits, address, childClass: cls };
}

/* ---------------- Build answers payload ---------------- */
function buildAnswerPayload(){
  const out = {};
  QUIZ.forEach((q, qi) => {
    const pick = state.answers[qi];
    out[`Q${qi+1} (${q.arena})`] = (pick !== undefined) ? q.options[pick].label : "";
  });
  return out;
}

/* ---------------- Submit ---------------- */
async function submitToSheet(){
  if(state._submittedOnce) return;

  submitStatus.textContent = "Saving to Google Sheet...";

  const { footprintOverall, arenaFootprint } = calcScores();
  const band = scoreBand(footprintOverall);

  const payload = {
    submissionId: getSubmissionId(),
    parentName: state.profile.parentName,
    phone: state.profile.phone,
    address: state.profile.address,
    childClass: state.profile.childClass,
    scores: {
      overall: footprintOverall,
      transport: arenaFootprint.transport,
      home: arenaFootprint.home,
      devices: arenaFootprint.devices,
      food: arenaFootprint.food,
      waste: arenaFootprint.waste
    },
    badgeLabel: band.badge,
    answers: buildAnswerPayload()
  };

  try{
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload)
    });

    state._submittedOnce = true;
    save();
    submitStatus.textContent = "✅ Saved. Refreshing leaderboard...";
  }catch{
    submitStatus.textContent = "❌ Save failed. Tap Refresh Leaderboard to retry.";
    state._submittedOnce = false;
    save();
  }
}

/* ---------------- Leaderboard ---------------- */
async function loadLeaderboard(){
  leaderboardEl.innerHTML = "Loading...";

  try{
    const res = await fetch(`${APPS_SCRIPT_URL}?action=leaderboard&limit=20`);
    const json = await res.json();
    if(!json.ok) throw new Error(json.error || "Leaderboard fetch failed");

    const all = [...(json.podium || []), ...(json.others || [])];

    if(!all.length){
      leaderboardEl.innerHTML = `<div class="status">No submissions yet.</div>`;
      return;
    }

    const medal = (r) =>
      r === 1 ? "🥇" :
      r === 2 ? "🥈" :
      r === 3 ? "🥉" :
      `#${r}`;

    leaderboardEl.innerHTML = "";

    all.forEach(row => {
      const score = Number(row.overall) || 0;
      const band = scoreBand(score);
      const totalT = estimateFamilyCO2FromScore(score);

      const div = document.createElement("div");
      div.className = "lbrow";
      div.innerHTML = `
        <div><b>${medal(row.rank)}</b></div>
        <div>
          <div style="font-weight:850">${esc(row.name || "Anonymous")}</div>
          <div style="opacity:.85;font-size:.92em">${esc(row.className || "-")} • ${band.badge}</div>
        </div>
        <div style="text-align:right;">
          <b>${totalT.toFixed(1)} tCO₂e/yr</b>
          <div style="opacity:.85;font-size:.85em">Score: ${score}</div>
        </div>
      `;
      leaderboardEl.appendChild(div);
    });

  }catch(e){
    leaderboardEl.innerHTML = `<div class="status">❌ ${esc(e.message)}</div>`;
  }
}

/* ---------------- Init / Events ---------------- */
btnStart.onclick = () => {
  const profile = saveProfileOrAlert();
  if(!profile) return;

  state.profile = profile;
  state.arenaIndex = 0;
  state.answers = {};
  state._submittedOnce = false;
  state.submissionId = null;
  save();

  show("quiz");
  renderArenaPage();
};

btnBack.onclick = () => {
  state.arenaIndex = Math.max(0, state.arenaIndex - 1);
  save();
  renderArenaPage();
};

btnNext.onclick = async () => {
  const arena = ARENAS[state.arenaIndex];
  if(!isArenaComplete(arena)) return;

  state.arenaIndex += 1;
  save();

  if(state.arenaIndex >= ARENAS.length){
    show("results");
    renderResults();
    await submitToSheet();
    setTimeout(loadLeaderboard, 900);
  }else{
    renderArenaPage();
  }
};

btnRestart.onclick = () => {
  clearSave();
  state = {
    profile:{ parentName:"", phone:"", address:"", childClass:"" },
    arenaIndex:0,
    answers:{},
    _submittedOnce:false,
    submissionId:null
  };

  parentNameEl.value = "";
  phoneEl.value = "";
  addressEl.value = "";
  childClassEl.value = "";
  submitStatus.textContent = "";

  show("profile");
};

btnRefreshLB.onclick = async () => {
  await loadLeaderboard();
};

/* family size controls */
btnFamMinus.onclick = () => {
  familySize = clamp(familySize - 1, 1, 10);
  famSizeEl.textContent = String(familySize);
  save();
  // if already on results, re-render comparisons
  if(stepResults.style.display === "block") renderResults();
};
btnFamPlus.onclick = () => {
  familySize = clamp(familySize + 1, 1, 10);
  famSizeEl.textContent = String(familySize);
  save();
  if(stepResults.style.display === "block") renderResults();
};

show("profile");
