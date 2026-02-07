/* =========================
   app.js (FULL) — Arena-wise pages (3 questions together) + CO₂ estimate + leaderboard CO₂
   ========================= */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwv6RkxDakPptLFkBntJx7Q9gZO_46ymanX-lctuh-rvvLKXXgv9lKLFitcmwZYTXsMjQ/exec";
const LS_KEY = "dps_tajcity_cf_v12"; // ✅ bump to force fresh state

/* ---------------- Footprint banding (LOWER is better) ---------------- */
function scoreBand(footprint){
  if (footprint <= 10) return { badge:"🏆 Eco Champion", where:"Excellent! Very low footprint habits. Keep it consistent and inspire others." };
  if (footprint <= 20) return { badge:"🌟 Green Leader", where:"Low footprint overall. A couple of small upgrades can make it even better." };
  if (footprint <= 35) return { badge:"✅ Eco Smart", where:"Good progress. Pick 2–3 habits to reduce footprint further this month." };
  if (footprint <= 55) return { badge:"🌱 Getting Started", where:"Good base. Start with easy wins like shared travel, efficient cooling, and daily waste separation." };
  return { badge:"🚀 Ready for Change", where:"High footprint today. Choose just two improvements this week and stay consistent." };
}

/* ---------------- CO₂ estimate (simple indicator) ---------------- */
function estimateCO2FromFootprintScore(score){
  // Indicator mapping (not direct measurement):
  // 0   -> ~1.5 tCO₂e/year
  // 100 -> ~6.0 tCO₂e/year
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const t = 1.5 + (s/100) * 4.5;
  return { t: Math.round(t * 10) / 10, kg: Math.round(t * 1000) };
}
function fmtCO2(score){
  const e = estimateCO2FromFootprintScore(score);
  return `≈ ${e.t} tCO₂e/year (${e.kg} kg)`;
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
  // TRANSPORT (3)
  { arena:"transport", text:"How does your child usually go to school?", options:[
    {label:"Walk / Cycle", pts:5},
    {label:"School bus / shared van", pts:4},
    {label:"Carpool with other parents", pts:4},
    {label:"Private car (only family)", pts:1},
  ]},
  { arena:"transport", text:"When waiting near school, the car/vehicle engine is…", options:[
    {label:"Always switched off", pts:5},
    {label:"Sometimes switched off", pts:3},
    {label:"Mostly kept on", pts:1},
  ]},
  { arena:"transport", text:"Vehicle servicing + tyre pressure checks are…", options:[
    {label:"Regular", pts:5},
    {label:"Occasional", pts:3},
    {label:"Rare", pts:1},
  ]},

  // HOME (3)
  { arena:"home", text:"AC usage at home on most days is…", options:[
    {label:"No AC", pts:5},
    {label:"0–2 hours/day", pts:4},
    {label:"2–5 hours/day", pts:3},
    {label:"5+ hours/day", pts:1},
  ]},
  { arena:"home", text:"If you use AC at home, what type is mostly used?", options:[
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

  // DEVICES (3)
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

  // FOOD (3)
  { arena:"food", text:"How often does food get wasted at home?", options:[
    {label:"Rarely", pts:5},
    {label:"Sometimes", pts:3},
    {label:"Often", pts:1},
  ]},
  { arena:"food", text:"Your fruits/vegetables at home are mostly…", options:[
    {label:"Local + seasonal", pts:5},
    {label:"Mixed", pts:3},
    {label:"Mostly packaged/imported", pts:1},
  ]},
  { arena:"food", text:"At home, cooking is mainly done using…", options:[
    {label:"Induction mostly", pts:5},
    {label:"Mix of induction + gas", pts:4},
    {label:"Gas mostly", pts:3},
    {label:"Not sure", pts:3},
  ]},

  // WASTE (3)
  { arena:"waste", text:"Do you segregate wet and dry waste at home?", options:[
    {label:"Yes, regularly", pts:5},
    {label:"Sometimes", pts:3},
    {label:"No", pts:1},
  ]},
  { arena:"waste", text:"Where do you usually put kitchen waste (food peels/leftovers)?", options:[
    {label:"Compost at home / give for composting", pts:5},
    {label:"Sometimes compost, sometimes mixed", pts:3},
    {label:"Thrown with all waste", pts:1},
  ]},
  { arena:"waste", text:"Single-use plastic (bags/cups) use at home is…", options:[
    {label:"Rare", pts:5},
    {label:"Sometimes", pts:3},
    {label:"Often", pts:1},
  ]},
];

/* ---------------- State ---------------- */
let state = {
  profile:{ parentName:"", phone:"", address:"", childClass:"" },
  arenaIndex:0,     // ✅ one page per arena
  answers:{},       // key: questionIndex -> optionIndex
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
const qText = el("qText");   // arena heading
const qSub = el("qSub");     // kept empty
const optionsEl = el("options");
const btnBack = el("btnBack");
const btnNext = el("btnNext");
const progFill = el("progFill");
const progText = el("progText");

const overallScoreEl = el("overallScore");
const badgeTextEl = el("badgeText");
const whereYouAreEl = el("whereYouAre");
const co2LineEl = el("co2Line"); // ✅ added in HTML
const arenaScoresEl = el("arenaScores");
const recommendationsEl = el("recommendations");

const btnRestart = el("btnRestart");
const btnRefreshLB = el("btnRefreshLB");
const submitStatus = el("submitStatus");
const leaderboardEl = el("leaderboard");

/* ---------------- Storage ---------------- */
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
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

/* ---------------- Helpers: arena questions ---------------- */
function getArenaQuestionIndexes(arena){
  const idx = [];
  QUIZ.forEach((q, qi) => { if(q.arena === arena) idx.push(qi); });
  return idx;
}
function isArenaComplete(arena){
  const qIdx = getArenaQuestionIndexes(arena);
  return qIdx.every(qi => state.answers[qi] !== undefined);
}

/* ---------------- Scoring (footprint: LOWER is better) ---------------- */
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
    const eco = max ? Math.round((got/max)*100) : 0;     // higher = better
    arenaEco[a] = eco;
    arenaFootprint[a] = 100 - eco;                      // lower = better
  });

  const ecoOverall = Math.round(
    (arenaEco.transport + arenaEco.home + arenaEco.devices + arenaEco.food + arenaEco.waste) / 5
  );
  const footprintOverall = 100 - ecoOverall;

  return { footprintOverall, arenaFootprint };
}

/* ---------------- Recommendations + score meaning ---------------- */
function buildRecommendations({ footprintOverall, arenaFootprint }){
  const band = scoreBand(footprintOverall);

  // higher footprint => weakest area
  const sorted = Object.entries(arenaFootprint).sort((a,b)=>b[1]-a[1]);
  const weakest = sorted[0]?.[0];

  const cityContext = `
    <p><b>City context</b></p>
    <ul>
      <li><b>School gate traffic</b> often increases idling and local air pollution.</li>
      <li><b>Cooling</b> becomes inefficient if doors/windows are left open.</li>
      <li>Big practical gains come from <b>shared travel, efficient appliances, and daily waste separation</b>.</li>
    </ul>
  `;

  const doByArena = {
    transport: [
      "Prefer school bus or a consistent carpool for routine commute.",
      "Switch off the engine while waiting near the school gate.",
      "Maintain tyre pressure and regular service for better mileage."
    ],
    home: [
      "If buying new AC, prefer inverter split AC with a good star rating.",
      "Replace remaining bulbs with LED—start from the most-used rooms."
    ],
    devices: [
      "Switch off TV/set-top box/chargers at night to reduce standby power.",
      "Reduce unnecessary screen-on time (background TV)."
    ],
    food: [
      "Plan portions to reduce leftovers and food waste.",
      "If possible, shift some cooking to induction for daily small/medium meals."
    ],
    waste: [
      "Segregate wet and dry waste daily (two bins).",
      "Reduce single-use plastic by keeping cloth bags handy."
    ]
  };

  const avoidByArena = {
    transport: [
      "Avoid idling in long queues near school.",
      "Avoid private car for very short trips when walking/shared options are practical."
    ],
    home: [
      "Avoid running AC with doors/windows open.",
      "Avoid very old/inefficient AC for long hours if alternatives exist."
    ],
    devices: [
      "Avoid leaving chargers plugged in continuously.",
      "Avoid unnecessary repeated heating cycles."
    ],
    food: [
      "Avoid cooking extra that often gets wasted.",
      "Avoid frequent packaged food when fresh options are available."
    ],
    waste: [
      "Avoid mixing wet and dry waste—it reduces recycling.",
      "Avoid frequent use of single-use plastic bags/cups."
    ]
  };

  const doList = (doByArena[weakest] || []).slice(0,3);
  const avoidList = (avoidByArena[weakest] || []).slice(0,2);

  const nextSteps = (footprintOverall <= 10) ? [
    "Maintain consistency and inspire one more family (carpool/LED/segregation).",
    "Track one habit for 14 days until it becomes automatic."
  ] : [
    "Pick two easy upgrades and keep them consistent for 14 days.",
    "Recheck your score after 2 weeks to see improvement."
  ];

  const co2 = estimateCO2FromFootprintScore(footprintOverall);

  const scoreMeaning = `
    <hr/>
    <p><b>What this score means</b></p>
    <ul>
      <li><b>Lower score = lower estimated carbon emissions</b> based on daily habits (travel, electricity, food, and waste).</li>
      <li>Your estimated footprint is <b>${fmtCO2(footprintOverall)}</b>.</li>
      <li>This is an <b>approximate indicator</b>, not a lab measurement in exact kg CO₂.</li>
      <li><b>World context:</b> Many households fall in a “medium” band. If your score is <b>0–20</b>, your habits are generally <b>better than typical</b>. If it is <b>50+</b>, there are <b>clear improvement areas</b> compared to common best practices.</li>
    </ul>
  `;

  return `
    <p><b>${band.badge}</b></p>
    <p>${band.where}</p>
    ${cityContext}
    <p><b>What to do</b></p>
    <ul>${doList.map(x=>`<li>${x}</li>`).join("")}</ul>
    <p><b>What to avoid</b></p>
    <ul>${avoidList.map(x=>`<li>${x}</li>`).join("")}</ul>
    <p><b>What to do next</b></p>
    <ul>${nextSteps.map(x=>`<li>${x}</li>`).join("")}</ul>
    ${scoreMeaning}
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

/* ---------------- Render results ---------------- */
function renderResults(){
  const { footprintOverall, arenaFootprint } = calcScores();
  const band = scoreBand(footprintOverall);

  overallScoreEl.textContent = footprintOverall;
  badgeTextEl.textContent = band.badge;
  whereYouAreEl.textContent = band.where;

  if(co2LineEl) co2LineEl.textContent = fmtCO2(footprintOverall);

  arenaScoresEl.innerHTML = "";
  ARENAS.forEach(a => {
    const box = document.createElement("div");
    box.className = "box";
    box.innerHTML = `<div class="k">${LABEL[a]}</div><div class="v">${arenaFootprint[a]}/100</div>`;
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

  return {
    parentName,
    phone: digits,
    address,
    childClass: cls
  };
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

      const div = document.createElement("div");
      div.className = "lbrow";
      div.innerHTML = `
        <div><b>${medal(row.rank)}</b></div>
        <div>
          <div style="font-weight:850">${esc(row.name || row.parentName || "Anonymous")}</div>
          <div style="opacity:.85;font-size:.92em">${esc(row.className || row.childClass || "-")} • ${band.badge}</div>
        </div>
        <div style="text-align:right;">
          <b>${score}</b>
          <div style="opacity:.85;font-size:.85em">${fmtCO2(score)}</div>
        </div>
      `;
      leaderboardEl.appendChild(div);
    });

  }catch(e){
    leaderboardEl.innerHTML = `<div class="status">❌ ${esc(e.message)}</div>`;
  }
}

/* ---------------- Events ---------------- */
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

// ✅ Refresh leaderboard should NOT submit
btnRefreshLB.onclick = async () => {
  await loadLeaderboard();
};

/* ---------------- Init ---------------- */
show("profile");
