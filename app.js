const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwv6RkxDakPptLFkBntJx7Q9gZO_46ymanX-lctuh-rvvLKXXgv9lKLFitcmwZYTXsMjQ/exec";
const LS_KEY = "dps_tajcity_cf_vfinal";

/* Fixed family size */
const FAMILY_SIZE = 4;

/* Baselines per-person (tCO2e/year) */
const BASE_GLOBAL_PER_PERSON_T = 6.6;
const BASE_INDIA_PER_PERSON_T = 1.89;

/* Arenas */
const ARENAS = ["transport","home","devices","food","waste"];
const LABEL = {
  transport:"🚗 Transport",
  home:"🏠 Home Energy",
  devices:"📱 Devices",
  food:"🍲 Food",
  waste:"🗑️ Waste"
};

/* Area weights */
const AREA_WEIGHTS = { transport:0.22, home:0.26, devices:0.10, food:0.28, waste:0.14 };

function areaTag(co2T){
  if(co2T <= 0.8) return "✅ Good";
  if(co2T <= 1.6) return "⚠️ Can Improve";
  return "🚨 Needs Focus";
}

function bandByCO2(totalT){
  if(totalT <= 3.0) return { badge:"🏆 Eco Champion", where:"Excellent! Very low footprint habits." };
  if(totalT <= 4.5) return { badge:"🌟 Green Leader", where:"Low footprint overall. A couple of small upgrades can improve further." };
  if(totalT <= 6.0) return { badge:"✅ Eco Smart", where:"Good progress. Improve 1–2 habits to reduce footprint further." };
  if(totalT <= 8.0) return { badge:"🌱 Getting Started", where:"Good base. Start with easy wins (shared travel, efficient cooling, waste separation)." };
  return { badge:"🚀 Ready for Change", where:"High footprint today. Choose two improvements this week and stay consistent." };
}

/* Map habit footprint score (0 best → 100 worst) to family CO2 (t/year) */
function estimateFamilyCO2FromFootprintScore(score){
  const s = Math.max(0, Math.min(100, Number(score)||0));
  const minT = 2.0;
  const maxT = 12.0;
  const t = minT + (s/100)*(maxT-minT);
  return Math.round(t*10)/10;
}

/* Quiz */
const QUIZ = [
  // transport
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

  // home
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

  // devices
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

  // food
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

  // waste
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

/* State */
let state = {
  profile:{ parentName:"", phone:"", address:"", childClass:"" },
  arenaIndex:0,
  answers:{},
  submittedOnce:false,
  submissionId:null
};

/* DOM */
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

const badgeTextEl = el("badgeText");
const whereYouAreEl = el("whereYouAre");
const co2TotalEl = el("co2Total");
const compareBarsEl = el("compareBars");
const arenaScoresEl = el("arenaScores");
const recommendationsEl = el("recommendations");

const btnRestart = el("btnRestart");
const btnRefreshLB = el("btnRefreshLB");
const submitStatus = el("submitStatus");
const leaderboardEl = el("leaderboard");

/* Storage */
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

/* Arena helpers */
function getArenaQuestionIndexes(arena){
  const idx = [];
  QUIZ.forEach((q, qi) => { if(q.arena === arena) idx.push(qi); });
  return idx;
}
function isArenaComplete(arena){
  return getArenaQuestionIndexes(arena).every(qi => state.answers[qi] !== undefined);
}

/* Footprint score */
function calcFootprintScores(){
  const agg = Object.fromEntries(ARENAS.map(a => [a, {got:0, max:0}]));

  QUIZ.forEach((q, qi) => {
    const maxPts = Math.max(...q.options.map(o => o.pts));
    agg[q.arena].max += maxPts;

    const pick = state.answers[qi];
    if(pick !== undefined) agg[q.arena].got += q.options[pick].pts;
  });

  const arenaFootprint = {};
  ARENAS.forEach(a => {
    const {got, max} = agg[a];
    const eco = max ? Math.round((got/max)*100) : 0; // higher eco = better habits
    arenaFootprint[a] = 100 - eco; // footprint score (lower better)
  });

  const overall = Math.round(
    (arenaFootprint.transport + arenaFootprint.home + arenaFootprint.devices + arenaFootprint.food + arenaFootprint.waste)/5
  );

  return { overallFootprintScore: overall, arenaFootprint };
}

/* CO2 breakdown */
function calcCO2Breakdown(overallFootprintScore, arenaFootprint){
  const totalT = estimateFamilyCO2FromFootprintScore(overallFootprintScore);

  const intensity = {};
  ARENAS.forEach(a => {
    const s = Math.max(0, Math.min(100, arenaFootprint[a]));
    intensity[a] = 0.6 + (s/100)*0.8; // 0.6..1.4
  });

  let sum = 0;
  const raw = {};
  ARENAS.forEach(a => { raw[a] = AREA_WEIGHTS[a] * intensity[a]; sum += raw[a]; });

  const byAreaT = {};
  ARENAS.forEach(a => { byAreaT[a] = Math.round((totalT * (raw[a]/sum))*10)/10; });

  return { totalT, byAreaT };
}

function renderComparisonBars(yourT){
  const indiaT = Math.round((BASE_INDIA_PER_PERSON_T * FAMILY_SIZE) * 10) / 10;
  const globalT = Math.round((BASE_GLOBAL_PER_PERSON_T * FAMILY_SIZE) * 10) / 10;
  const maxV = Math.max(yourT, indiaT, globalT, 0.1);

  const rows = [
    {name:"Your family", val:yourT},
    {name:"India avg", val:indiaT},
    {name:"Global avg", val:globalT},
  ];

  compareBarsEl.innerHTML = rows.map(r => `
    <div class="cbar">
      <div class="cbarName">${esc(r.name)}</div>
      <div class="cbarTrack"><div class="cbarFill" style="width:${Math.round((r.val/maxV)*100)}%"></div></div>
      <div class="cbarVal">${r.val.toFixed(1)}</div>
    </div>
  `).join("");
}

/* ✅ Recommendations based on highest CO2 areas */
function buildRecommendations(totalT, byAreaT){
  const sortedDesc = Object.entries(byAreaT).sort((a,b)=>b[1]-a[1]);
  const worst1 = sortedDesc[0]?.[0];
  const worst2 = sortedDesc[1]?.[0];
  const best = Object.entries(byAreaT).sort((a,b)=>a[1]-b[1])[0]?.[0];

  const tips = {
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

  const explainArea = (a) => `${LABEL[a]} ≈ ${byAreaT[a].toFixed(1)} tCO₂e/yr`;
  const listHTML = (arr) => `<ul>${arr.map(x=>`<li>${x}</li>`).join("")}</ul>`;

  const blocks = [];
  if(worst1){
    blocks.push(`
      <p><b>Top area to reduce first:</b> ${explainArea(worst1)}</p>
      ${listHTML((tips[worst1]||[]).slice(0,3))}
    `);
  }
  if(worst2){
    blocks.push(`
      <p><b>Second focus area:</b> ${explainArea(worst2)}</p>
      ${listHTML((tips[worst2]||[]).slice(0,3))}
    `);
  }

  const meaning = `
    <p><b>Meaning</b></p>
    <ul>
      <li>This is an <b>approximate CO₂ estimate</b> based on habits (not a lab measurement).</li>
      <li><b>Lower CO₂ is better</b> (lower emissions).</li>
      <li>Comparison uses <b>family of ${FAMILY_SIZE}</b> as reference.</li>
    </ul>
  `;

  const bestNote = best ? `<p><b>Your strongest area:</b> ${LABEL[best]} (keep this habit strong)</p>` : "";

  return `${meaning}${blocks.join("")}${bestNote}`;
}

/* Render one arena page */
function renderArenaPage(){
  const arena = ARENAS[state.arenaIndex];
  const qIdx = getArenaQuestionIndexes(arena);

  arenaPill.textContent = LABEL[arena];
  qText.textContent = "Answer these questions";
  qSub.textContent = "";

  progText.textContent = `${state.arenaIndex+1}/${ARENAS.length}`;
  progFill.style.width = `${Math.round((state.arenaIndex/ARENAS.length)*100)}%`;

  optionsEl.innerHTML = "";

  qIdx.forEach((qi, pos) => {
    const q = QUIZ[qi];
    const selected = state.answers[qi];

    const block = document.createElement("div");
    block.className = "qblock";

    const title = document.createElement("div");
    title.className = "qblockTitle";
    title.textContent = `${pos+1}. ${q.text}`;
    block.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = "qblockOptions";

    q.options.forEach((opt, oi) => {
      const div = document.createElement("div");
      div.className = "opt" + (selected===oi ? " selected" : "");
      div.innerHTML = `<div class="o1">${opt.label}</div>`;
      div.onclick = () => {
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

  btnBack.disabled = state.arenaIndex === 0;
  btnNext.disabled = !isArenaComplete(arena);
  btnNext.textContent = (state.arenaIndex === ARENAS.length-1) ? "Finish →" : "Next →";
}

/* Render results */
function renderResults(){
  const { overallFootprintScore, arenaFootprint } = calcFootprintScores();
  const { totalT, byAreaT } = calcCO2Breakdown(overallFootprintScore, arenaFootprint);
  const band = bandByCO2(totalT);

  badgeTextEl.textContent = band.badge;
  whereYouAreEl.textContent = band.where;

  co2TotalEl.textContent = `≈ ${totalT.toFixed(1)} tCO₂e/year (${Math.round(totalT*1000)} kg/year)`;
  renderComparisonBars(totalT);

  arenaScoresEl.innerHTML = "";
  ARENAS.forEach(a => {
    const t = byAreaT[a];
    const box = document.createElement("div");
    box.className = "box";
    box.innerHTML = `
      <div class="k">${LABEL[a]}</div>
      <div class="co2">≈ ${t.toFixed(1)} tCO₂e/year</div>
      <div class="kg">(${Math.round(t*1000)} kg/year)</div>
      <div class="tag">${areaTag(t)}</div>
    `;
    arenaScoresEl.appendChild(box);
  });

  recommendationsEl.innerHTML = buildRecommendations(totalT, byAreaT);
}

/* Validate profile */
function saveProfileOrAlert(){
  const parentName = (parentNameEl.value||"").trim();
  const phone = (phoneEl.value||"").trim();
  const address = (addressEl.value||"").trim();
  const childClass = (childClassEl.value||"").trim().replace(/\s+/g,"");

  if(!parentName || !phone || !address || !childClass){
    alert("Please fill Parent Name, Phone, Address, and Child Class.");
    return null;
  }
  const digits = phone.replace(/\D/g,"");
  if(digits.length !== 10){
    alert("Please enter a valid 10-digit phone number.");
    return null;
  }
  if(!/^(?:[1-9]|1[0-2])$/.test(childClass)){
    alert("Child Class should be a number from 1 to 12.");
    return null;
  }

  return { parentName, phone:digits, address, childClass };
}

function buildAnswerPayload(){
  const out = {};
  QUIZ.forEach((q, qi) => {
    const pick = state.answers[qi];
    out[`Q${qi+1} (${q.arena})`] = (pick !== undefined) ? q.options[pick].label : "";
  });
  return out;
}

/* ✅ Submit: recompute CO2 + recs here so Sheet never gets 0 */
async function submitToSheet(){
  if(state.submittedOnce) return;

  submitStatus.textContent = "Saving to Google Sheet...";

  const { overallFootprintScore, arenaFootprint } = calcFootprintScores();
  const { totalT, byAreaT } = calcCO2Breakdown(overallFootprintScore, arenaFootprint);
  const band = bandByCO2(totalT);

  const recHTML = buildRecommendations(totalT, byAreaT);
  const recText = recHTML
    .replaceAll(/<li>/g, "• ")
    .replaceAll(/<\/li>/g, "\n")
    .replaceAll(/<\/p>/g, "\n\n")
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();

  const payload = {
    submissionId: getSubmissionId(),
    parentName: state.profile.parentName,
    phone: state.profile.phone,
    address: state.profile.address,
    childClass: state.profile.childClass,
    badgeLabel: band.badge,
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

  try{
    await fetch(APPS_SCRIPT_URL, {
      method:"POST",
      mode:"no-cors",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload)
    });

    state.submittedOnce = true;
    save();
    submitStatus.textContent = "✅ Saved. Refreshing leaderboard...";
    setTimeout(loadLeaderboard, 700);

  }catch(e){
    state.submittedOnce = false;
    save();
    submitStatus.textContent = "❌ Save failed. Please try Refresh Leaderboard.";
  }
}

/* Leaderboard */
async function loadLeaderboard(){
  leaderboardEl.innerHTML = "Loading...";
  try{
    const res = await fetch(`${APPS_SCRIPT_URL}?action=leaderboard&limit=20`);
    const json = await res.json();
    if(!json.ok) throw new Error(json.error || "Leaderboard fetch failed");

    const all = [...(json.podium||[]), ...(json.others||[])];
    if(!all.length){
      leaderboardEl.innerHTML = `<div class="status">No submissions yet.</div>`;
      return;
    }

    const medal = (r) => r===1 ? "🥇" : r===2 ? "🥈" : r===3 ? "🥉" : `#${r}`;
    leaderboardEl.innerHTML = "";

    all.forEach(row => {
      const co2 = Number(row.co2Total)||0;
      const div = document.createElement("div");
      div.className = "lbrow";
      div.innerHTML = `
        <div><b>${medal(row.rank)}</b></div>
        <div>
          <div style="font-weight:850">${esc(row.name||"Anonymous")}</div>
          <div style="opacity:.85;font-size:.92em">Class ${esc(row.className||"-")} • ${esc(row.badge||"")}</div>
        </div>
        <div style="text-align:right;">
          <b>${co2.toFixed(1)} tCO₂e/yr</b>
          <div style="opacity:.85;font-size:.85em">(${Math.round(co2*1000)} kg/yr)</div>
        </div>
      `;
      leaderboardEl.appendChild(div);
    });

  }catch(e){
    leaderboardEl.innerHTML = `<div class="status">❌ ${esc(e.message)}</div>`;
  }
}

/* Events */
btnStart.onclick = () => {
  const profile = saveProfileOrAlert();
  if(!profile) return;

  state.profile = profile;
  state.arenaIndex = 0;
  state.answers = {};
  state.submittedOnce = false;
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
    submittedOnce:false,
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

/* Init */
show("profile");
