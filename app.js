/* =========================
   CONFIG
========================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwv6RkxDakPptLFkBntJx7Q9gZO_46ymanX-lctuh-rvvLKXXgv9lKLFitcmwZYTXsMjQ/exec";
const LS_KEY = "dps_tajcity_cf_v9";

/* =========================
   Badge banding
========================= */
function scoreBand(overall){
  if (overall >= 90) return { badge:"🏆 Eco Champion", where:"Outstanding habits. You’re already low-footprint—now maintain consistency and inspire others." };
  if (overall >= 75) return { badge:"🌟 Green Leader", where:"Strong practices across categories. A few routine upgrades can make you even better." };
  if (overall >= 60) return { badge:"✅ Eco Smart", where:"Good direction. With 2–3 consistent changes, you can reduce footprint noticeably in a month." };
  if (overall >= 45) return { badge:"🌱 Getting Started", where:"You have a good base. Start with the easiest wins—shared travel, LED, and reducing waste." };
  return { badge:"🚀 Ready for Change", where:"Big improvement potential. Pick just two habits this week and stick to them—results come fast." };
}

/* =========================
   Quiz structure (15 Q)
========================= */
const ARENAS = ["transport","home","devices","food","waste"];
const LABEL = {
  transport:"🚗 Transport",
  home:"🏠 Home Energy",
  devices:"📱 Devices",
  food:"🍲 Food",
  waste:"🗑️ Waste"
};

const QUIZ = [
  /* 🚗 TRANSPORT (3) */
  { arena:"transport", pill:"🚗 Transport", tip:"Shared travel reduces per-family footprint.", text:"How does your child usually go to school?", options:[
    {label:"Walk / Cycle", pts:5, note:"Zero fuel + healthier routine"},
    {label:"School bus / shared van", pts:4, note:"Shared commute lowers per-family emissions"},
    {label:"Carpool with other parents", pts:4, note:"Good when it’s consistent"},
    {label:"Private car (only family)", pts:1, note:"Highest footprint for daily school run"},
  ]},
  { arena:"transport", pill:"🚗 Transport", tip:"Idling adds local fumes near children.", text:"When waiting near school, the engine is…", options:[
    {label:"Always switched off", pts:5, note:"Best for air quality near the gate"},
    {label:"Sometimes switched off", pts:3, note:"Try making it a fixed habit"},
    {label:"Mostly kept on", pts:1, note:"Avoid idling in queues"},
  ]},
  { arena:"transport", pill:"🚗 Transport", tip:"Maintenance improves mileage.", text:"Vehicle service + tyre pressure checks are…", options:[
    {label:"Regular", pts:5, note:"Better mileage = less fuel burned"},
    {label:"Occasional", pts:3, note:"Set a monthly reminder"},
    {label:"Rare", pts:1, note:"Low mileage increases fuel use"},
  ]},

  /* 🏠 HOME ENERGY (3) */
  { arena:"home", pill:"🏠 Home Energy", tip:"Cooling choices change electricity use a lot.", text:"AC usage on most days is…", options:[
    {label:"No AC", pts:5, note:"Lowest electricity load"},
    {label:"0–2 hours/day", pts:4, note:"Controlled usage"},
    {label:"2–5 hours/day", pts:3, note:"Moderate usage"},
    {label:"5+ hours/day", pts:1, note:"High usage"},
  ]},
  { arena:"home", pill:"🏠 Home Energy", tip:"A higher setpoint saves electricity.", text:"If AC is used, temperature is usually…", options:[
    {label:"26–28°C", pts:5, note:"Efficient + comfortable"},
    {label:"24–25°C", pts:3, note:"Can improve by increasing slightly"},
    {label:"Below 24°C", pts:1, note:"High electricity use"},
    {label:"Not sure", pts:2, note:"Try 26°C as default"},
  ]},
  { arena:"home", pill:"🏠 Home Energy", tip:"LEDs are one of the fastest wins.", text:"Most of your home lighting is…", options:[
    {label:"Mostly LED", pts:5, note:"Great—lower electricity use"},
    {label:"Mix of LED + old bulbs", pts:3, note:"Replace remaining bulbs gradually"},
    {label:"Mostly old bulbs/tubes", pts:1, note:"Switching to LED helps a lot"},
  ]},

  /* 📱 DEVICES (3) */
  { arena:"devices", pill:"📱 Devices", tip:"Standby power is small but constant.", text:"At night, plugs for TV/chargers are…", options:[
    {label:"Mostly switched off", pts:5, note:"Excellent routine"},
    {label:"Sometimes switched off", pts:3, note:"Pick 2–3 plugs daily"},
    {label:"Rarely switched off", pts:1, note:"Standby adds up over months"},
  ]},
  { arena:"devices", pill:"📱 Devices", tip:"Balanced screen time helps health + energy use.", text:"Family screen time per day (TV + mobile + laptop) is…", options:[
    {label:"< 2 hours", pts:5, note:"Great balance"},
    {label:"2–4 hours", pts:4, note:"Good"},
    {label:"4–6 hours", pts:2, note:"Try reducing background screens"},
    {label:"6+ hours", pts:1, note:"High usage"},
  ]},
  { arena:"devices", pill:"📱 Devices", tip:"Reuse reduces manufacturing emissions.", text:"Old electronics are usually…", options:[
    {label:"Reuse / repair / donate", pts:5, note:"Best option"},
    {label:"Send to e-waste recycler", pts:4, note:"Safe disposal"},
    {label:"Keep unused at home", pts:2, note:"Try donate/recycle"},
    {label:"Throw with regular waste", pts:1, note:"Avoid"},
  ]},

  /* 🍲 FOOD (3) */
  { arena:"food", pill:"🍲 Food", tip:"Food waste creates avoidable emissions.", text:"How often does food get wasted at home?", options:[
    {label:"Rarely", pts:5, note:"Good planning"},
    {label:"Sometimes", pts:3, note:"Plan portions + storage"},
    {label:"Often", pts:1, note:"Big improvement area"},
  ]},
  { arena:"food", pill:"🍲 Food", tip:"Seasonal/local food often needs less transport & storage.", text:"Your fruits/vegetables are mostly…", options:[
    {label:"Local + seasonal", pts:5, note:"Best choice"},
    {label:"Mixed", pts:3, note:"Try more seasonal/local"},
    {label:"Mostly packaged/imported", pts:1, note:"Higher footprint"},
  ]},
  { arena:"food", pill:"🍲 Food", tip:"Covered cooking saves fuel.", text:"Cooking habits are mostly…", options:[
    {label:"Pressure cooker / covered cooking often", pts:5, note:"Efficient"},
    {label:"Mixed", pts:3, note:"Can optimize"},
    {label:"Mostly open cooking for long time", pts:1, note:"Higher fuel use"},
  ]},

  /* 🗑️ WASTE (3) */
  { arena:"waste", pill:"🗑️ Waste", tip:"Segregation improves recycling and reduces landfill load.", text:"Do you segregate wet/dry waste at home?", options:[
    {label:"Yes, regularly", pts:5, note:"Great habit"},
    {label:"Sometimes", pts:3, note:"Try consistent daily"},
    {label:"No", pts:1, note:"Start with 2 bins"},
  ]},
  { arena:"waste", pill:"🗑️ Waste", tip:"Composting reduces landfill methane.", text:"Kitchen waste is usually…", options:[
    {label:"Composted at home / given for composting", pts:5, note:"Best option"},
    {label:"Mixed disposal", pts:3, note:"Start small with peels"},
    {label:"Thrown with all waste", pts:1, note:"Improvement area"},
  ]},
  { arena:"waste", pill:"🗑️ Waste", tip:"Single-use plastic adds waste load.", text:"Single-use plastic (bags/cups) use is…", options:[
    {label:"Rare", pts:5, note:"Good"},
    {label:"Sometimes", pts:3, note:"Carry a cloth bag"},
    {label:"Often", pts:1, note:"Replace with reusable"},
  ]},
];

/* =========================
   State + DOM
========================= */
let state = {
  profile:{ parentName:"", phone:"", address:"", childClass:"" },
  index:0,
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

const btnRestart = el("btnRestart");
const btnRefreshLB = el("btnRefreshLB");
const leaderboardEl = el("leaderboard");
const submitStatus = el("submitStatus");

/* =========================
   Utils
========================= */
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return false;
    state = JSON.parse(raw);
    return true;
  }catch{ return false; }
}
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

/* =========================
   Scoring
========================= */
function calcScores(){
  const agg = Object.fromEntries(ARENAS.map(a => [a, {got:0, max:0}]));

  const chosen = [];

  QUIZ.forEach((q, qi) => {
    const maxPts = Math.max(...q.options.map(o => o.pts));
    agg[q.arena].max += maxPts;

    const pick = state.answers[qi];
    if(pick !== undefined){
      const opt = q.options[pick];
      agg[q.arena].got += opt.pts;
      chosen.push({ arena:q.arena, q:q.text, pts:opt.pts, label:opt.label });
    }
  });

  const arenaScores = {};
  ARENAS.forEach(a => {
    const {got, max} = agg[a];
    arenaScores[a] = max ? Math.round((got/max)*100) : 0;
  });

  const overall = Math.round(
    (arenaScores.transport + arenaScores.home + arenaScores.devices + arenaScores.food + arenaScores.waste) / 5
  );

  return { overall, arenaScores, chosen };
}

/* =========================
   Recommendations
========================= */
function buildRecommendations({ overall, arenaScores, chosen }){
  const band = scoreBand(overall);

  const sorted = Object.entries(arenaScores).sort((a,b)=>a[1]-b[1]);
  const weakest = sorted[0]?.[0];
  const second = sorted[1]?.[0];

  const cityContext = `
    <p><b>City context</b></p>
    <ul>
      <li><b>During school hours and peak market times</b>, traffic congestion often leads to engine idling, increasing local air pollution near pedestrians.</li>
      <li><b>Small efficiency gaps</b>—like open doors/windows while cooling—can raise electricity use without improving comfort.</li>
      <li>For most families, the <b>largest practical reductions</b> come from shared commuting, sensible cooling, and daily waste segregation.</li>
    </ul>
  `;

  const doByArena = {
    transport: [
      "Prefer school bus or a consistent carpool for routine commute.",
      "Switch off the engine while waiting near the school gate."
    ],
    home: [
      "Use fan first; if AC is needed, keep it around 26°C and keep doors/windows closed.",
      "Replace remaining bulbs with LED—start from the most-used rooms."
    ],
    devices: [
      "Switch off TV/set-top box/chargers at night to reduce standby electricity use.",
      "Reuse/repair/donate old devices instead of storing unused."
    ],
    food: [
      "Plan portions to reduce leftovers; store food properly.",
      "Prefer seasonal/local fruits and vegetables when possible."
    ],
    waste: [
      "Segregate wet and dry waste daily (two bins).",
      "Carry a cloth bag to reduce single-use plastic."
    ]
  };

  const avoidByArena = {
    transport: [
      "Avoid idling in long queues near school and markets.",
      "Avoid private car for very short trips when walking/shared options are practical."
    ],
    home: [
      "Avoid setting AC below 24°C for long hours.",
      "Avoid running AC with doors/windows open."
    ],
    devices: [
      "Avoid throwing e-waste with regular garbage.",
      "Avoid leaving chargers plugged in continuously."
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

  const doList = [
    ...(doByArena[weakest] || []).slice(0,2),
    ...(doByArena[second] || []).slice(0,1),
  ].filter(Boolean);

  const avoidList = (avoidByArena[weakest] || []).slice(0,2);

  const nextSteps = (overall >= 90) ? [
    "Maintain consistency and inspire one more family (carpool/LED/segregation).",
    "Track one habit for 14 days until it becomes automatic."
  ] : (overall >= 75) ? [
    "Pick 2 upgrades this month: engine-off waiting + LED replacement in one high-use room.",
    "Add one weekly habit: leftover-meal day or a plastic-free market routine."
  ] : (overall >= 60) ? [
    "This week: choose 2 habits (switch off plugs + reduce short private-car trips).",
    "Next 2 weeks: add one upgrade (LED replacement or consistent waste segregation)."
  ] : (overall >= 45) ? [
    "Start with 2 easy wins: engine-off waiting + wet/dry waste separation.",
    "Within 14 days: replace LEDs in one high-use room."
  ] : [
    "This week: lock 2 habits—engine-off waiting + wet/dry waste separation.",
    "Next 2 weeks: shift one routine trip to shared travel and use fan-first + 26°C cooling routine."
  ];

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
  `;
}

/* =========================
   UI Render
========================= */
function renderQuestion(){
  const q = QUIZ[state.index];

  arenaPill.textContent = q.pill;
  qText.textContent = q.text;
  qSub.textContent = q.tip;

  progText.textContent = `${state.index+1}/${QUIZ.length}`;
  progFill.style.width = `${Math.round((state.index / QUIZ.length) * 100)}%`;

  optionsEl.innerHTML = "";
  const selected = state.answers[state.index];

  q.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "opt" + (selected === i ? " selected" : "");
    div.innerHTML = `<div class="o1">${opt.label}</div><div class="o2">${opt.note}</div>`;
    div.onclick = () => {
      state.answers[state.index] = i;
      save();
      renderQuestion();
      btnNext.disabled = false;
    };
    optionsEl.appendChild(div);
  });

  btnBack.disabled = state.index === 0;
  btnNext.disabled = (state.answers[state.index] === undefined);
}

function renderResults(){
  const { overall, arenaScores, chosen } = calcScores();
  const band = scoreBand(overall);

  overallScoreEl.textContent = overall;
  badgeTextEl.textContent = band.badge;
  whereYouAreEl.textContent = band.where;

  arenaScoresEl.innerHTML = "";
  ARENAS.forEach(a => {
    const box = document.createElement("div");
    box.className = "box";
    box.innerHTML = `<div class="k">${LABEL[a]}</div><div class="v">${arenaScores[a]}/100</div>`;
    arenaScoresEl.appendChild(box);
  });

  recommendationsEl.innerHTML = buildRecommendations({ overall, arenaScores, chosen });
}

/* =========================
   Submission helpers
========================= */
function buildAnswerPayload(){
  const out = {};
  QUIZ.forEach((q, qi) => {
    const pick = state.answers[qi];
    out[`Q${qi+1} (${q.arena})`] = (pick !== undefined) ? q.options[pick].label : "";
  });
  return out;
}

function getSubmissionId(){
  if(state.submissionId) return state.submissionId;
  state.submissionId = `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  save();
  return state.submissionId;
}

async function submitToSheet(){
  if (state._submittedOnce) return;

  submitStatus.textContent = "Saving to Google Sheet...";
  state._submittedOnce = true;
  save();

  const { overall, arenaScores, chosen } = calcScores();
  const band = scoreBand(overall);
  const recHTML = buildRecommendations({ overall, arenaScores, chosen });

  const payload = {
    submissionId: getSubmissionId(),
    parentName: state.profile.parentName,
    phone: state.profile.phone,
    address: state.profile.address,
    childClass: state.profile.childClass,
    scores: {
      overall,
      transport: arenaScores.transport,
      home: arenaScores.home,
      devices: arenaScores.devices,
      food: arenaScores.food,
      waste: arenaScores.waste
    },
    badgeLabel: band.badge,
    recommendationsText: recHTML.replace(/<[^>]*>?/gm, ""),
    answers: buildAnswerPayload()
  };

  try{
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type":"text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    submitStatus.textContent = "✅ Saved. Refreshing leaderboard...";
  }catch{
    submitStatus.textContent = "❌ Save failed. Tap Refresh Leaderboard to retry.";
    state._submittedOnce = false;
    save();
  }
}

/* =========================
   Leaderboard
========================= */
async function loadLeaderboard(){
  leaderboardEl.innerHTML = "Loading...";

  try{
    const url = `${APPS_SCRIPT_URL}?action=leaderboard&limit=20`;
    const res = await fetch(url);
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
      const band = scoreBand(Number(row.overall) || 0);
      const div = document.createElement("div");
      div.className = "lbrow";
      div.innerHTML = `
        <div><b>${medal(row.rank)}</b></div>
        <div>
          <div style="font-weight:850">${esc(row.name || "Anonymous")}</div>
          <div style="opacity:.85;font-size:.92em">${esc(row.className || "-")} • ${band.badge}</div>
        </div>
        <div style="text-align:right;"><b>${row.overall}</b></div>
      `;
      leaderboardEl.appendChild(div);
    });

  }catch(e){
    leaderboardEl.innerHTML = `<div class="status">❌ ${e.message}</div>`;
  }
}

/* =========================
   Validation
========================= */
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

  if(!/^\d{1,2}\s*-\s*[A-Za-z]$/.test(childClass)){
    alert("Child Class format should be like 6-B, 10-A, 12-C.");
    return null;
  }

  return {
    parentName,
    phone: digits,
    address,
    childClass: childClass.replace(/\s+/g,"")
  };
}

/* =========================
   Events
========================= */
btnStart.onclick = () => {
  const profile = saveProfileOrAlert();
  if(!profile) return;

  state.profile = profile;
  state.index = 0;
  state.answers = {};
  state._submittedOnce = false;
  state.submissionId = null;
  save();

  show("quiz");
  renderQuestion();
};

btnBack.onclick = () => {
  state.index = Math.max(0, state.index - 1);
  save();
  renderQuestion();
};

btnNext.onclick = async () => {
  if(state.answers[state.index] === undefined) return;

  state.index += 1;
  save();

  if(state.index >= QUIZ.length){
    show("results");
    renderResults();
    await submitToSheet();
    setTimeout(loadLeaderboard, 900);
  }else{
    renderQuestion();
  }
};

btnRestart.onclick = () => {
  clearSave();
  state = {
    profile:{ parentName:"", phone:"", address:"", childClass:"" },
    index:0,
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
  state._submittedOnce = false;
  save();
  await submitToSheet();
  await loadLeaderboard();
};

/* =========================
   Init
========================= */
load();
show("profile");
