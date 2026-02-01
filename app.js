const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwv6RkxDakPptLFkBntJx7Q9gZO_46ymanX-lctuh-rvvLKXXgv9lKLFitcmwZYTXsMjQ/exec";
const LS_KEY = "dps_tajcity_cf_v4";

function scoreBand(overall){
  if (overall >= 90) return { badge:"🏆 Eco Champion", where:"Outstanding habits. You’re already low-footprint—now maintain consistency and inspire others." };
  if (overall >= 75) return { badge:"🌟 Green Leader", where:"Strong practices across categories. A few routine upgrades can make you even better." };
  if (overall >= 60) return { badge:"✅ Eco Smart", where:"Good direction. With 2–3 consistent changes, you can reduce footprint noticeably in a month." };
  if (overall >= 45) return { badge:"🌱 Getting Started", where:"You have a good base. Start with the easiest wins—shared travel, LED, and reducing waste." };
  return { badge:"🚀 Ready for Change", where:"Big improvement potential. Pick just two habits this week and stick to them—results come fast." };
}

const ARENAS = ["transport","home","devices","food","waste"];
const LABEL = {
  transport:"🚗 Transport",
  home:"🏠 Home Energy",
  devices:"📱 Devices",
  food:"🍲 Food",
  waste:"🗑️ Waste"
};

const QUIZ = [
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
  { arena:"devices", pill:"📱 Devices", tip:"Reuse reduces new manufacturing emissions.", text:"Old electronics are usually…", options:[
    {label:"Reuse / repair / donate", pts:5, note:"Best option"},
    {label:"Send to e-waste recycler", pts:4, note:"Safe disposal"},
    {label:"Keep unused at home", pts:2, note:"Try donate/recycle"},
    {label:"Throw with regular waste", pts:1, note:"Avoid"},
  ]},

  { arena:"food", pill:"🍲 Food", tip:"Food waste creates avoidable emissions.", text:"How often does food get wasted at home?", options:[
    {label:"Rarely", pts:5, note:"Good planning"},
    {label:"Sometimes", pts:3, note:"Plan portions + storage"},
    {label:"Often", pts:1, note:"Big improvement area"},
  ]},
  { arena:"food", pill:"🍲 Food", tip:"Seasonal/local food usually needs less transport & cold storage.", text:"Your fruits/vegetables are mostly…", options:[
    {label:"Local + seasonal", pts:5, note:"Best choice"},
    {label:"Mixed", pts:3, note:"Try more seasonal/local"},
    {label:"Mostly packaged/imported", pts:1, note:"Higher footprint"},
  ]},
  { arena:"food", pill:"🍲 Food", tip:"Covered cooking saves gas/electricity.", text:"Cooking habits are mostly…", options:[
    {label:"Pressure cooker / covered cooking often", pts:5, note:"Efficient"},
    {label:"Mixed", pts:3, note:"Can optimize"},
    {label:"Mostly open cooking for long time", pts:1, note:"Higher fuel use"},
  ]},

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

let state = { profile:{ parentName:"",phone:"",address:"",childClass:"" }, index:0, answers:{} };

const el = (id) => document.getElementById(id);
const stepProfile = el("stepProfile");
const stepQuiz = el("stepQuiz");
const stepResults = el("stepResults");

const parentNameEl = el("parentName");
const phoneEl = el("phone");
const addressEl = el("address");
const childClassEl = el("childClass");

const btnStart = el("btnStart");
const btnResume = el("btnResume");
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

const btnSubmit = el("btnSubmit");
const btnRestart = el("btnRestart");
const btnRefreshLB = el("btnRefreshLB");
const submitStatus = el("submitStatus");

const podiumEl = el("podium");
const leaderboardEl = el("leaderboard");

function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function load(){
  try{ const raw=localStorage.getItem(LS_KEY); if(!raw) return false; state=JSON.parse(raw); return true; }
  catch{ return false; }
}
function clearSave(){ localStorage.removeItem(LS_KEY); }

function show(which){
  stepProfile.style.display = which==="profile" ? "block" : "none";
  stepQuiz.style.display = which==="quiz" ? "block" : "none";
  stepResults.style.display = which==="results" ? "block" : "none";
}

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

  const overall = Math.round((arenaScores.transport + arenaScores.home + arenaScores.devices + arenaScores.food + arenaScores.waste) / 5);
  return { overall, arenaScores, chosen };
}

function buildAnswerPayload(){
  const out = {};
  QUIZ.forEach((q, qi) => {
    const pick = state.answers[qi];
    out[`Q${qi+1} (${q.arena})`] = (pick !== undefined) ? q.options[pick].label : "";
  });
  return out;
}

function stripHtml(html){
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return tmp.textContent || tmp.innerText || "";
}

/* ✅ UPDATED: Recommendations now use "City context" and bullet pointers.
   ✅ No "Agra next steps" text.
   ✅ No "Complete all questions..." fallback when score is very high.
*/
function buildRecommendations({ overall, arenaScores, chosen }){
  const band = scoreBand(overall);

  const sorted = Object.entries(arenaScores).sort((a,b)=>a[1]-b[1]);
  const weakest = sorted[0]?.[0];
  const second = sorted[1]?.[0];

  const worst = chosen.slice().sort((a,b)=>a.pts-b.pts);

  const specific = [];
  worst.forEach(w => {
    if (w.pts > 3) return;

    if (w.q.includes("go to school") && w.label.includes("Private car")) {
      specific.push("School commute: Try school bus or a consistent carpool 3 days/week instead of private car.");
    }
    if (w.q.includes("waiting near school") && (w.label.includes("Mostly") || w.label.includes("Sometimes"))) {
      specific.push("School gate queue: Switch off the engine during waiting to reduce local exhaust exposure.");
    }
    if (w.q.includes("service + tyre") && (w.label.includes("Occasional") || w.label.includes("Rare"))) {
      specific.push("Vehicle efficiency: Maintain tyre pressure + regular service to improve mileage and reduce fuel burn.");
    }
    if (w.q.includes("temperature") && (w.label.includes("Below") || w.label.includes("Not sure"))) {
      specific.push("Cooling: Set AC around 26°C and use fan first—lower settings increase electricity use sharply.");
    }
    if (w.q.includes("lighting") && w.label.includes("old")) {
      specific.push("Lighting: Replace the most-used room bulbs with LED first—fastest visible improvement.");
    }
    if (w.q.includes("screen time") && (w.label.includes("4–6") || w.label.includes("6+"))) {
      specific.push("Screen time: Reduce background screens (TV on without watching). It improves health and cuts power use.");
    }
    if (w.q.includes("Old electronics") && w.label.includes("Keep unused")) {
      specific.push("Old devices: Donate/reuse/recycle instead of storing unused at home (reduces e-waste and new manufacturing demand).");
    }
    if (w.q.includes("food get wasted") && (w.label.includes("Sometimes") || w.label.includes("Often"))) {
      specific.push("Food waste: Plan portions and keep one “leftover meal” day weekly to avoid unnecessary waste.");
    }
    if (w.q.includes("segregate") && (w.label.includes("No") || w.label.includes("Sometimes"))) {
      specific.push("Waste segregation: Start daily wet/dry separation with two bins—improves recycling and reduces landfill load.");
    }
    if (w.q.includes("Single-use plastic") && (w.label.includes("Sometimes") || w.label.includes("Often"))) {
      specific.push("Single-use plastic: Keep a cloth bag in your vehicle and carry a reusable bottle.");
    }
  });

  const uniqueSpecific = [...new Set(specific)];

  const cityContext = `
    <p><b>City context</b></p>
    <ul>
      <li><b>School-hour queues</b> and market traffic often lead to idling—this adds avoidable emissions near pedestrians.</li>
      <li><b>Summer heat</b> increases home electricity load due to cooling (fans/AC).</li>
      <li><b>Daily routines</b> like shared commuting, efficient cooling, and waste segregation give the biggest realistic impact for families.</li>
    </ul>
  `;

  const doByArena = {
    transport: [
      "Prefer school bus or a consistent carpool for routine commute.",
      "Switch off the engine while waiting near the school gate.",
      "Keep tyres inflated and vehicle serviced for better mileage."
    ],
    home: [
      "Use fan first; if AC is needed, keep it around 26°C and keep doors/windows closed.",
      "Replace remaining bulbs with LED—start from the most-used rooms.",
      "Use natural ventilation in morning/evening when weather allows."
    ],
    devices: [
      "Switch off TV/set-top box/chargers at night to reduce standby use.",
      "Avoid background screens when no one is watching.",
      "Reuse/repair/donate old devices instead of storing unused."
    ],
    food: [
      "Plan portions to reduce leftovers; store food properly.",
      "Prefer seasonal/local fruits and vegetables when possible.",
      "Use pressure cooker/covered cooking to reduce fuel use."
    ],
    waste: [
      "Segregate wet and dry waste daily (two bins).",
      "Compost basic kitchen waste (peels) or send for composting if available.",
      "Carry a cloth bag to reduce single-use plastic."
    ]
  };

  const avoidByArena = {
    transport: [
      "Avoid idling in long queues near school and markets.",
      "Avoid using private car for very short trips when walking/shared options are practical."
    ],
    home: [
      "Avoid setting AC below 24°C for long hours.",
      "Avoid running AC with doors/windows open."
    ],
    devices: [
      "Avoid throwing e-waste with regular garbage.",
      "Avoid leaving chargers plugged in 24/7."
    ],
    food: [
      "Avoid cooking extra that often gets wasted.",
      "Avoid frequent packaged/over-processed foods when fresh options are available."
    ],
    waste: [
      "Avoid mixing wet and dry waste—it reduces recycling.",
      "Avoid frequent use of single-use plastic bags/cups."
    ]
  };

  const nextStepsByTier = (s) => {
    if (s >= 90) return [
      "Maintain consistency and help one more family improve (carpool/LED/waste segregation).",
      "Track one habit for 14 days (engine-off waiting OR wet/dry segregation) and make it automatic."
    ];
    if (s >= 75) return [
      "Pick 2 upgrades: engine-off waiting + LED replacement in one high-use room.",
      "Add one weekly habit: leftover-meal day or a plastic-free market routine."
    ];
    if (s >= 60) return [
      "This week: choose 2 habits (carpool twice + switch off plugs at night).",
      "Next 2 weeks: add one upgrade (LED replacement or consistent waste segregation)."
    ];
    if (s >= 45) return [
      "Start with 2 easiest wins: engine-off waiting + LED in the most-used room.",
      "Add wet/dry waste separation within 7 days."
    ];
    return [
      "This week: lock 2 habits—engine-off waiting + wet/dry waste segregation.",
      "Next 2 weeks: reduce short private-car trips and follow fan-first + 26°C cooling routine."
    ];
  };

  const doList = [
    ...(doByArena[weakest] || []).slice(0,2),
    ...((doByArena[second] || []).slice(0,1))
  ].filter(Boolean);

  const avoidList = (avoidByArena[weakest] || []).slice(0,2);
  const nextSteps = nextStepsByTier(overall);

  const title = `<p><b>Next steps (what to do, what to avoid, and what to do next)</b></p>`;
  const intro = `<p><b>${band.badge}:</b> ${band.where}</p>`;

  let easyBlock = "";
  if (uniqueSpecific.length === 0) {
    if (overall >= 95) {
      easyBlock = `
        <p><b>Your easiest improvements</b></p>
        <ul>
          <li>You’re already doing very well. Focus on <b>maintaining consistency</b> and <b>influencing others</b> (carpool, LED, segregation).</li>
        </ul>
      `;
    } else {
      easyBlock = `
        <p><b>Your easiest improvements</b></p>
        <ul>
          <li>Your answers look strong overall. The fastest gains usually come from <b>commute habits</b>, <b>AC setpoint</b>, and <b>waste segregation</b>.</li>
        </ul>
      `;
    }
  } else {
    easyBlock = `
      <p><b>Your easiest improvements (based on your answers)</b></p>
      <ul>${uniqueSpecific.slice(0,5).map(x=>`<li>${x}</li>`).join("")}</ul>
    `;
  }

  const doHtml = `<p><b>What to do next</b></p><ul>${doList.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  const avoidHtml = `<p><b>What to avoid</b></p><ul>${avoidList.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  const stepsHtml = `<p><b>Next steps</b></p><ul>${nextSteps.map(x=>`<li>${x}</li>`).join("")}</ul>`;

  return title + intro + cityContext + easyBlock + doHtml + avoidHtml + stepsHtml;
}

async function submitToSheet(){
  submitStatus.textContent = "Submitting...";
  btnSubmit.disabled = true;

  const { overall, arenaScores, chosen } = calcScores();
  const band = scoreBand(overall);
  const recHTML = buildRecommendations({ overall, arenaScores, chosen });

  state.recommendationsHTML = recHTML;
  save();

  const payload = {
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
    recommendationsText: stripHtml(recHTML),
    answers: buildAnswerPayload()
  };

  try{
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if(!json.ok) throw new Error(json.error || "Submit failed");
    submitStatus.textContent = "✅ Submitted. Refreshing leaderboard...";
    await loadLeaderboard();
  }catch(e){
    submitStatus.textContent = `❌ Submit failed: ${e.message}`;
  }finally{
    btnSubmit.disabled = false;
  }
}

function renderQuestion(){
  const q = QUIZ[state.index];
  arenaPill.textContent = q.pill;
  qText.textContent = q.text;
  qSub.textContent = q.tip;

  const pct = Math.round((state.index / QUIZ.length) * 100);
  progFill.style.width = `${pct}%`;
  progText.textContent = `${state.index+1}/${QUIZ.length}`;

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

  const recHTML = buildRecommendations({ overall, arenaScores, chosen });
  recommendationsEl.innerHTML = recHTML;

  state.final = { overall, ...arenaScores };
  state.badgeLabel = band.badge;
  state.recommendationsHTML = recHTML;
  save();
}

function saveProfileOrAlert(){
  const parentName = parentNameEl.value.trim();
  const phone = phoneEl.value.trim();
  const address = addressEl.value.trim();
  const childClass = childClassEl.value.trim();

  if(!parentName || !phone || !address || !childClass){
    alert("Please fill Parent Name, Phone, Address, and Child Class.");
    return null;
  }
  return { parentName, phone, address, childClass };
}

function buildAnswerPayload(){
  const out = {};
  QUIZ.forEach((q, qi) => {
    const pick = state.answers[qi];
    out[`Q${qi+1} (${q.arena})`] = (pick !== undefined) ? q.options[pick].label : "";
  });
  return out;
}

function stripHtml(html){
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return tmp.textContent || tmp.innerText || "";
}

function esc(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function loadLeaderboard(){
  podiumEl.innerHTML = "";
  leaderboardEl.innerHTML = "Loading...";

  try{
    const url = `${APPS_SCRIPT_URL}?action=leaderboard&limit=20`;
    const res = await fetch(url);
    const json = await res.json();
    if(!json.ok) throw new Error("Leaderboard fetch failed");

    const podium = json.podium || [];
    const others = json.others || [];

    const slots = [
      {rank:2, cls:"silver", label:"🥈 2nd"},
      {rank:1, cls:"gold", label:"🥇 1st"},
      {rank:3, cls:"bronze", label:"🥉 3rd"},
    ];

    if(!podium.length){
      podiumEl.innerHTML = `<div class="status">No submissions yet.</div>`;
    } else {
      slots.forEach(slt => {
        const p = podium.find(x => x.rank === slt.rank);
        const div = document.createElement("div");
        div.className = `pcard ${slt.cls}`;
        if(!p){
          div.innerHTML = `<div class="rank">${slt.label}</div><div class="name">—</div><div class="cls">—</div><div class="score">—</div>`;
        } else {
          div.innerHTML = `
            <div class="rank">${slt.label}</div>
            <div class="name">${esc(p.name)}</div>
            <div class="cls">${esc(p.className)}</div>
            <div class="score">${p.overall}</div>
          `;
        }
        podiumEl.appendChild(div);
      });
    }

    if(!others.length){
      leaderboardEl.innerHTML = `<div class="status">No other entries.</div>`;
      return;
    }

    leaderboardEl.innerHTML = "";
    others.forEach(r => {
      const div = document.createElement("div");
      div.className = "lbrow";
      div.innerHTML = `
        <div><b>#${r.rank}</b></div>
        <div>${esc(r.name)} • ${esc(r.className)} <span style="color:#a9b7d6;">• ${esc(r.badge || "")}</span></div>
        <div style="text-align:right;"><b>${r.overall}</b></div>
      `;
      leaderboardEl.appendChild(div);
    });
  }catch(e){
    leaderboardEl.innerHTML = `<div class="status">❌ ${e.message}</div>`;
  }
}

function checkResume(){
  const ok = load();
  const hasAnswers = ok && state?.answers && Object.keys(state.answers).length > 0;
  btnResume.style.display = hasAnswers ? "inline-block" : "none";

  if(ok && state.profile){
    parentNameEl.value = state.profile.parentName || "";
    phoneEl.value = state.profile.phone || "";
    addressEl.value = state.profile.address || "";
    childClassEl.value = state.profile.childClass || "";
  }
}

btnStart.onclick = () => {
  const profile = saveProfileOrAlert();
  if(!profile) return;

  state.profile = profile;
  state.index = 0;
  state.answers = {};
  save();

  show("quiz");
  renderQuestion();
};

btnResume.onclick = () => { show("quiz"); renderQuestion(); };

btnBack.onclick = () => {
  state.index = Math.max(0, state.index - 1);
  save();
  renderQuestion();
};

btnNext.onclick = () => {
  if(state.answers[state.index] === undefined) return;
  state.index += 1;
  save();

  if(state.index >= QUIZ.length){
    show("results");
    renderResults();
    loadLeaderboard();
  } else {
    renderQuestion();
  }
};

btnSubmit.onclick = submitToSheet;

btnRestart.onclick = () => {
  clearSave();
  state = { profile:{ parentName:"",phone:"",address:"",childClass:"" }, index:0, answers:{} };
  parentNameEl.value = ""; phoneEl.value = ""; addressEl.value = ""; childClassEl.value = "";
  submitStatus.textContent = "";
  show("profile");
  checkResume();
};

btnRefreshLB.onclick = loadLeaderboard;

checkResume();
show("profile");
