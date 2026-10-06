const PRIMARY_SHOTS={
  "Spawn":{pov:"Parrot"},
  "Capitol City":{pov:"Parrot"},
  "Fort Feather":{pov:"Parrot"},
  "Wheat Kingdom":{pov:"Wemmbu"},
  "Kingdom of the Caves":{pov:"Wemmbu"},
  "Sculk Kingdom":{pov:"Wemmbu"},
  "Zam Empire":{pov:"Wemmbu"},
  "Skyblock Civilization":{pov:"Wemmbu"},
  "Mafia City":{pov:"Spoke"},
  "Point Nemo":{pov:"Spoke"},
  "The Amplified":{pov:"Spoke"},
  "BAT Headquarters":{pov:"Spoke"},
  "Paragon":{pov:"Parrot"},
  "Proton":{pov:"Parrot"},
  "Great Sea":{pov:"Wemmbu"},
  "The Mist":{pov:"Flame"},
  "Mistrul's Cave":{pov:"Flame"},
  "Far Lands":{pov:"Parrot"},
  "Purgatory":{pov:"Spoke"},
  "Underworld Castle":{pov:"Wemmbu"},
  "Underworld Portal Hub":{pov:"Wemmbu"},
  "Mafia Tomb":{pov:"Parrot"},
  "Capitol City Train Station":{pov:"Parrot"},
  "Capitol Market Street":{pov:"Parrot"},
  "Parrot & Theo's Potion Shop":{pov:"Parrot"},
  "ClownPierce's Kingdom":{pov:"Parrot"},
  "ClownPierce's Overworld Castle":{pov:"Parrot"}
};
const VISUAL_EXCLUDE=new Set([
  "Capitol City Train Station","Capitol Market Street","Parrot & Theo's Potion Shop",
  "Warriors District","Farmers District","Builders District","Far Lands Temple",
  "Mistrul's Cave","Point Nemo","BAT Headquarters","Treebo Village",
  "Pirate City / Ranger Point","Floating Market","Ocean Rangers Base",
  "Gardens of Babylon","Frosted Palace","The Crone","Marshland Mansion","Pyramid of Anubis",
  "Mysterious Tomb","End Station","ClownPierce's Nether Vault","ClownPierce's Overworld Castle",
  "Fort Feather","Sculk Kingdom","The Fabric","Serpentbound's Kingdom","Black Market","Far Lands Civilization"
]);
const PHOTO_POIS=POIS.filter(p=>PHOTO_MAP[p.n] && PHOTO_MAP[p.n].shots && PHOTO_MAP[p.n].shots.some(s=>s.remote));
const ACTIVE_POIS=PHOTO_POIS.filter(p=>!VISUAL_EXCLUDE.has(p.n));
const POV_POIS=ACTIVE_POIS.filter(p=>PRIMARY_SHOTS[p.n]?.pov);
const POV_ROUND_CONFIG=[
  {name:"Merchant City", pov:"Parrot", shotIndex:1},
  {name:"Redstone Town", pov:"Wemmbu", shotIndex:1},
  {name:"Highwater City", pov:"Parrot", shotIndex:1},
  {name:"Cindercrest", pov:"Flame", shotIndex:1},
  {name:"Wheat Kingdom", pov:"Wemmbu", shotIndex:1},
  {name:"Kingdom of the Caves", pov:"Wemmbu", shotIndex:1},
  {name:"Sculk Kingdom", pov:"Wemmbu", shotIndex:1},
  {name:"Zam Empire", pov:"Wemmbu", shotIndex:1},
  {name:"Skyblock Civilization", pov:"Wemmbu", shotIndex:1},
  {name:"End Civilization", pov:"Parrot", shotIndex:1},
  {name:"Mafia City", pov:"Spoke", shotIndex:1},
  {name:"The Amplified", pov:"Spoke", shotIndex:1},
  {name:"BAT Headquarters", pov:"Spoke", shotIndex:1},
  {name:"Verdaria", pov:"Parrot", shotIndex:1},
  {name:"Great Sea", pov:"Wemmbu", shotIndex:1},
  {name:"The Mist", pov:"Flame", shotIndex:1},
  {name:"Far Lands", pov:"Parrot", shotIndex:1},
  {name:"Purgatory", pov:"Spoke", shotIndex:1},
  {name:"ClownPierce's Kingdom", pov:"Parrot", shotIndex:1},
  {name:"ClownPierce's Nether Castle", pov:"Parrot", shotIndex:1},
  {name:"Underworld Castle", pov:"Wemmbu", shotIndex:1},
  {name:"Underworld Portal Hub", pov:"Wemmbu", shotIndex:1},
  {name:"Mafia Tomb", pov:"Parrot", shotIndex:1},
  {name:"Capitol City Train Station", pov:"Parrot", shotIndex:1},
  {name:"Capitol Market Street", pov:"Parrot", shotIndex:1},
  {name:"Black Market", pov:"Parrot", shotIndex:1}
];
function selectPovShot(cfg){
  const gallery=(PHOTO_MAP[cfg.name]?.shots||[]);
  const numberedFrame = gallery.find(s=>/ytimg\.com\/vi\/.+\/[123]\.jpg/.test(s.remote||''));
  const gameplayFrame = gallery.find(s=>(s.credit||'').toLowerCase().includes('gameplay'));
  const fallback = gallery[cfg.shotIndex] || gallery[1] || gallery[0] || {};
  return numberedFrame || gameplayFrame || fallback;
}
const POV_ROUNDS=POV_ROUND_CONFIG.map((cfg,i)=>{
  const shot=selectPovShot(cfg);
  return {
    id:`pov-ingame-${i}-${cfg.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`,
    pov:cfg.pov,
    u:shot.u,
    remote:shot.remote,
    note:"In-game shot only. Center crop is used to hide foreground characters."
  };
})

const MODES=[
  {id:"geo",name:"Geo Guess",desc:"Read the scene, switch realms, and click the lore-relative map."},
  {id:"pov",name:"Guess the POV",desc:"Guess from in-game gameplay shots only (20+ rounds)."},
  {id:"arc",name:"Guess the Arc",desc:"Match a POI to the storyline arc it belongs to."},
  {id:"visitors",name:"Who Visited?",desc:"Select every main POV confirmed in this prototype dataset."},
  {id:"region",name:"Place It",desc:"Guess the parent region or realm cluster for a structure."},
  {id:"timeline",name:"Timeline Duel",desc:"Choose which of two POIs appeared earlier in the story."},
  {id:"duel",name:"1v1 Multiplayer",desc:"Create or join a live browser-to-browser duel room."}
];

let state={mode:"geo",round:0,total:10,score:0,streak:0,best:+localStorage.getItem("unstableBest")||0,current:null,answered:false,realm:"overworld",guess:null,deck:[],usedNames:new Set()};
const $=s=>document.querySelector(s), main=$("#main"), scoreEl=$("#score"), streakEl=$("#streak"), bestEl=$("#best");

function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function sample(a,n=1){const s=shuffle(a);return n===1?s[0]:s.slice(0,n)}
function uniq(a){return [...new Set(a)]}
function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function youtubeQualityCandidates(url){
  if(!url) return [];
  const m=url.match(/^(https:\/\/i\.ytimg\.com\/vi\/[^/]+)\/[^?#]+/);
  if(!m) return [url];
  return [m[1]+"/maxresdefault.jpg",m[1]+"/sddefault.jpg",m[1]+"/hqdefault.jpg",url];
}
function imageCandidates(shot){
  const out=[];
  if(shot?.remote) out.push(...youtubeQualityCandidates(shot.remote));
  if(shot?.u) out.push(shot.u);
  return uniq(out.filter(Boolean));
}
function imageAttrs(shot){
  const c=imageCandidates(shot||{}), src=c[0]||"", rest=c.slice(1).join("|");
  return `src="${src}" data-candidates="${rest}"`;
}
function imgOnError(img){
  if(!img) return;
  const queue=(img.dataset.candidates||"").split("|").filter(Boolean);
  if(queue.length){const next=queue.shift();img.dataset.candidates=queue.join("|");img.src=next;return;}
  const media=img.closest('.scene-media');
  if(media) media.classList.add('image-failed');
}
function itemKey(p){return p?.n||p?.id||String(p)}
function poolForMode(){return state.mode==="pov"?POV_ROUNDS:ACTIVE_POIS}
function buildDeck(){state.deck=shuffle(poolForMode());state.usedNames=new Set()}
function popNextPoi(filter=()=>true){
  for(let i=state.deck.length-1;i>=0;i--){const p=state.deck[i],key=itemKey(p);if(!state.usedNames.has(key)&&filter(p)){state.deck.splice(i,1);state.usedNames.add(key);return p;}}
  return null;
}
function modeInfo(){return MODES.find(m=>m.id===state.mode)}
function updateStats(){scoreEl.textContent=state.score.toLocaleString();streakEl.textContent=state.streak;bestEl.textContent=state.best.toLocaleString()}
function setBest(){if(state.score>state.best){state.best=state.score;localStorage.setItem("unstableBest",state.best)}updateStats()}
function clueCount(){return $("#difficulty").value==="easy"?3:$("#difficulty").value==="normal"?2:1}
function pickSceneShot(poi){
  const gallery=(PHOTO_MAP[poi.n]?.shots||[]), meta=PRIMARY_SHOTS[poi.n]||{};
  const idx=meta.shotIndex||0;
  const shot=gallery[idx]||gallery[0]||{};
  return {shot,meta};
}
function sceneCard(poi,showClues=true){
  const {shot}=pickSceneShot(poi);
  const clueHtml=showClues?`<div class="clues">${sample(poi.cl,clueCount()).map(c=>`<div class="clue">${c}</div>`).join("")}</div>`:'';
  return `<div class="scene"><div class="scene-media"><img class="scene-main" ${imageAttrs(shot)} alt="Minecraft location screenshot" referrerpolicy="no-referrer" onerror="imgOnError(this)"><div class="photo-top"><span class="photo-badge">IN-GAME LOCATION</span><span class="realm-pill">${poi.realm==="overworld"?"OVERWORLD":poi.realm==="nether"?"NETHER / UNDERWORLD":"THE END"}</span></div></div><div class="round-image-note">Source titles and location labels are hidden during the round.</div>${clueHtml}</div>`
}
function duelImageCard(poi){
  const {shot}=pickSceneShot(poi);
  return `<div class="duel-card"><div class="scene-media"><img ${imageAttrs(shot)} alt="Minecraft location screenshot" referrerpolicy="no-referrer" onerror="imgOnError(this)"></div><div class="duel-card-name">${poi.n}</div></div>`
}
function povSceneCard(round){
  return `<div class="scene pov-frame"><div class="scene-media"><img ${imageAttrs(round)} alt="Minecraft POV challenge image" referrerpolicy="no-referrer" onerror="imgOnError(this)"><div class="photo-top"><span class="photo-badge">POV ROUND</span><span class="realm-pill">GAMEPLAY SHOT</span></div></div><div class="round-image-note">POV mode uses full in-game shots only. Thumbnail-style images are excluded from this mode.</div></div>`
}
function header(title,sub){return `<div class="hero"><div><h2>${title}</h2><p>${sub}</p></div><div class="round-badge">Round ${state.round} / ${state.total}</div></div>`}
function initModes(){const list=$("#modeList");list.innerHTML=MODES.map(m=>`<button class="mode ${m.id===state.mode?'active':''}" data-mode="${m.id}"><strong>${m.name}</strong><span>${m.desc}</span></button>`).join("");list.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;initModes();newGame()})}
function newGame(){if(state.mode==="duel"){renderMultiplayerLobby();return}const requested=+$("#roundCount").value;const pool=poolForMode();const maxRounds=state.mode==="timeline"?Math.max(1,Math.floor(pool.length/2)):pool.length;state.total=Math.min(requested,maxRounds);state.round=0;state.score=0;state.streak=0;state.answered=false;state.guess=null;state.realm="overworld";buildDeck();updateStats();nextRound()}
function nextRound(){if(state.round>=state.total){endGame();return}const next=popNextPoi();if(!next){endGame();return}state.round++;state.answered=false;state.guess=null;state.realm="overworld";state.current=next;render()}
function answerPoints(ok,base=1000){if(ok){state.streak++;state.score+=base+Math.min(500,state.streak*50)}else state.streak=0;setBest()}
function endGame(){setBest();main.innerHTML=`<div class="start"><div class="sub">RUN COMPLETE</div><div class="start-shell"><h2>${modeInfo().name}</h2><div class="score-big">${state.score.toLocaleString()}</div><p>Your lore score across ${state.total} rounds.</p><div class="result-grid"><div class="result-card"><b>${state.score.toLocaleString()}</b><span>Total score</span></div><div class="result-card"><b>${state.best.toLocaleString()}</b><span>Best score</span></div><div class="result-card"><b>${ACTIVE_POIS.length}</b><span>Curated visual POIs</span></div></div><button class="btn primary" onclick="newGame()">Run it again</button></div></div>`}
function finishFeedback(ok,msg){const f=$("#feedback");if(!f)return;f.className="feedback show "+(ok?"good":"bad");f.innerHTML=msg+`<div style="margin-top:9px"><button class="btn primary" onclick="nextRound()">Next round</button></div>`}
