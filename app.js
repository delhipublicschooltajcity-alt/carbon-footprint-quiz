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
   Quiz structure
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
  { arena:"transport", pill:"🚗 Transport", tip:"Shared travel reduces per-family footprint.", text:"How does your child usually go to school?", options:[
    {label:"Walk / Cycle", pts:5, note:"Zero fuel + healthier routine"},
    {label:"School bus / shared van", pts:4, note:"Shared commute lowers emissions"},
    {label:"Carpool with parents", pts:4, note:"Good when consistent"},
    {label:"Private car", pts:1, note:"Highest footprint"},
  ]},
  { arena:"home", pill:"🏠 Home Energy", tip:"Cooling habits matter.", text:"AC temperature is usually…", options:[
    {label:"26–28°C", pts:5, note:"Efficient"},
    {label:"24–25°C", pts:3, note:"Can improve"},
    {label:"Below 24°C", pts:1, note:"High electricity use"},
  ]},
  { arena:"devices", pill:"📱 Devices", tip:"Standby power adds up.", text:"At night, plugs are…", options:[
    {label:"Switched off", pts:5, note:"Great habit"},
    {label:"Sometimes off", pts:3, note:"Pick 2–3 daily"},
    {label:"Always on", pts:1, note:"Avoid"},
  ]},
  { arena:"food", pill:"🍲 Food", tip:"Food waste causes emissions.", text:"Food waste at home is…", options:[
    {label:"Rare", pts:5, note:"Good planning"},
    {label:"Sometimes", pts:3, note:"Reduce portions"},
    {label:"Often", pts:1, note:"Improve"},
  ]},
  { arena:"waste", pill:"🗑️ Waste", tip:"Segregation helps recycling.", text:"Waste segregation is…", options:[
    {label:"Regular", pts:5, note:"Excellent"},
    {label:"Sometimes", pts:3, note:"Be consistent"},
    {label:"Not done", pts:1, note:"Start with 2 bins"},
  ]}
];

/* =========================
   State
========================= */
let state = {
  profile:{ parentName:"", phone:"", address:"", childClass:"" },
  index:0,
  answers:{},
  submitted:false
};

/* =========================
   Helpers
========================= */
const el = id => document.getElementById(id);

const stepProfile = el("stepProfile");
const stepQuiz = el("stepQuiz");
const stepResults = el("stepResults");

const parentNameEl = el("parentName");
const phoneEl = el("phone");
const addressEl = el("address");
const childClassEl = el("childClass");

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

const btnStart = el("btnStart");
const btnRestart = el("btnRestart");
const btnRefreshLB = el("btnRefreshLB");
const submitStatus = el("submitStatus");
const leaderboardEl = el("leaderboard");

/* =========================
   Storage
========================= */
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function clearSave(){ localStorage.removeItem(LS_KEY); }

/* =========================
   Navigation
========================= */
function show(which){
  stepProfile.style.display = which==="profile" ? "block" : "none";
  stepQuiz.style.display = which==="quiz" ? "block" : "none";
  stepResults.style.display = which==="results" ? "block" : "none";
}

/* =========================
   Quiz rendering
========================= */
function renderQuestion(){
  const q = QUIZ[state.index];
  arenaPill.textContent = q.pill;
  qText.textContent = q.text;
  qSub.textContent = q.tip;

  progText.textContent = `${state.index+1}/${QUIZ.length}`;
  progFill.style.width = `${(state.index/QUIZ.length)*100}%`;

  optionsEl.innerHTML = "";
  q.options.forEach((opt,i)=>{
    const d = document.createElement("div");
    d.className = "opt" + (state.answers[state.index]===i ? " selected":"");
    d.innerHTML = `<div class="o1">${opt.label}</div><div class="o2">${opt.note}</div>`;
    d.onclick = ()=>{
      state.answers[state.index]=i;
      btnNext.disabled=false;
      save();
      renderQuestion();
    };
    optionsEl.appendChild(d);
  });

  btnBack.disabled = state.index===0;
  btnNext.disabled = state.answers[state.index]===undefined;
}

/* =========================
   Scoring
========================= */
function calcScores(){
  const arenaAgg = {};
  ARENAS.forEach(a=>arenaAgg[a]={got:0,max:0});

  QUIZ.forEach((q,qi)=>{
    const max = Math.max(...q.options.map(o=>o.pts));
    arenaAgg[q.arena].max += max;
    if(state.answers[qi]!=null){
      arenaAgg[q.arena].got += q.options[state.answers[qi]].pts;
    }
  });

  const arenaScores = {};
  ARENAS.forEach(a=>{
    arenaScores[a] = arenaAgg[a].max ? Math.round((arenaAgg[a].got/arenaAgg[a].max)*100) : 0;
  });

  const overall = Math.round(
    (arenaScores.transport + arenaScores.home + arenaScores.devices + arenaScores.food + arenaScores.waste) / 5
  );

  return { overall, arenaScores };
}

/* =========================
   Results
========================= */
function renderResults(){
  const { overall, arenaScores } = calcScores();
  const band = scoreBand(overall);

  overallScoreEl.textContent = overall;
  badgeTextEl.textContent = band.badge;
  whereYouAreEl.textContent = band.where;

  arenaScoresEl.innerHTML="";
  ARENAS.forEach(a=>{
    const box=document.createElement("div");
    box.className="box";
    box.innerHTML=`<div class="k">${LABEL[a]}</div><div class="v">${arenaScores[a]}/100</div>`;
    arenaScoresEl.appendChild(box);
  });

  recommendationsEl.innerHTML = "<p>Focus on shared travel, efficient cooling, reduced screen time, food planning, and waste segregation.</p>";
}

/* =========================
   Leaderboard
========================= */
async function loadLeaderboard(){
  leaderboardEl.innerHTML="Loading...";
  try{
    const res = await fetch(`${APPS_SCRIPT_URL}?action=leaderboard`);
    const data = await res.json();
    leaderboardEl.innerHTML="";

    const medal = r => r===1?"🥇":r===2?"🥈":r===3?"🥉":`#${r}`;

    data.rows.forEach(row=>{
      const band = scoreBand(row.overall);
      const d=document.createElement("div");
      d.className="lbrow";
      d.innerHTML=`
        <div><b>${medal(row.rank)}</b></div>
        <div>${row.name} • ${band.badge}</div>
        <div style="text-align:right;"><b>${row.overall}</b></div>
      `;
      leaderboardEl.appendChild(d);
    });
  }catch{
    leaderboardEl.innerHTML="Error loading leaderboard";
  }
}

/* =========================
   Events
========================= */
btnStart.onclick=()=>{
  state.profile={
    parentName:parentNameEl.value,
    phone:phoneEl.value,
    address:addressEl.value,
    childClass:childClassEl.value
  };
  state.index=0;
  state.answers={};
  save();
  show("quiz");
  renderQuestion();
};

btnBack.onclick=()=>{
  if(state.index>0){
    state.index--;
    save();
    renderQuestion();
  }
};

btnNext.onclick=async ()=>{
  state.index++;
  save();
  if(state.index>=QUIZ.length){
    show("results");
    renderResults();
    await loadLeaderboard();
  }else{
    renderQuestion();
  }
};

btnRestart.onclick=()=>{
  clearSave();
  state={ profile:{}, index:0, answers:{}, submitted:false };
  show("profile");
};

btnRefreshLB.onclick=loadLeaderboard;

/* =========================
   Init
========================= */
show("profile");
