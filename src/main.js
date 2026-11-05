import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { characters } from "./characters.js";

const $ = (id) => document.getElementById(id);
const mat = (color, roughness = 0.78) => new THREE.MeshStandardMaterial({ color, roughness });
function mesh(parent, geometry, material, position, scale) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  if (scale) m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

function makeFighter(data, scene, x = 0) {
  const root = new THREE.Group(); root.position.x = x; root.scale.setScalar(data.height); scene.add(root);
  const skin=mat(data.skin), hair=mat(data.hair), jacket=mat(data.jacket), shirt=mat(data.shirt), pants=mat(data.pants), shoe=mat(0xeee9e4), dark=mat(0x211d24);
  const legs=[], arms=[];
  for (const s of [-1,1]) {
    const leg = new THREE.Group(); leg.position.set(s*.14,.78,0); root.add(leg);
    mesh(leg,new THREE.CapsuleGeometry(.105,.48,5,10),pants,[0,-.2,0]);
    mesh(leg,new THREE.BoxGeometry(.24,.12,.38),shoe,[0,-.58,.09]);
    legs.push(leg);
  }
  mesh(root,new THREE.CapsuleGeometry(.27,.48,6,12),shirt,[0,1.35,0]);
  if(data.id==="bauna-kid") for(const s of [-1,1]) mesh(root,new THREE.BoxGeometry(.16,.62,.34),jacket,[s*.205,1.35,.015]);
  else mesh(root,new THREE.CapsuleGeometry(.285,.5,6,12),jacket,[0,1.35,-.012]);
  for(const s of [-1,1]) {
    const pivot=new THREE.Group(); pivot.position.set(s*.29,1.55,0); root.add(pivot);
    mesh(pivot,new THREE.CapsuleGeometry(.085,.36,4,8),skin,[s*.1,-.13,.1]);
    mesh(pivot,new THREE.SphereGeometry(.105,12,10),skin,[s*.18,-.28,.19]);
    arms.push(pivot);
  }
  mesh(root,new THREE.CylinderGeometry(.09,.1,.18,12),skin,[0,1.78,0]);
  const head=new THREE.Group(); head.position.y=2.04; root.add(head);
  mesh(head,new THREE.SphereGeometry(.29,24,20),skin,[0,0,0],[.88,1.05,.9]);
  mesh(head,new THREE.SphereGeometry(.285,20,14,0,Math.PI*2,0,Math.PI*.53),hair,[0,.12,-.015],[1,.72,1]);
  mesh(head,new THREE.BoxGeometry(.34,.09,.14),hair,[0,.12,.22],[1,1,.7]);
  const white=mat(0xfafafa,.4), iris=mat(0x211b18,.3);
  for(const s of [-1,1]) {
    mesh(head,new THREE.SphereGeometry(.045,12,10),white,[s*.105,.025,.245],[1.15,.75,.45]);
    mesh(head,new THREE.SphereGeometry(.022,10,8),iris,[s*.105,.022,.281]);
    mesh(head,new THREE.BoxGeometry(.095,.025,.035),hair,[s*.105,.095,.245]);
  }
  mesh(head,new THREE.SphereGeometry(.035,10,8),skin,[0,-.045,.265],[.8,1.3,.8]);
  mesh(head,new THREE.BoxGeometry(.16,.035,.025),dark,[0,-.115,.265],[1,.7,1]);
  let lemon=null;
  if(data.lemon) {
    lemon=mesh(root,new THREE.SphereGeometry(.14,16,12),mat(0xffd51d),[.42,1.08,.18],[1.25,.85,.85]);
    lemon.rotation.z=-.3;
  }
  return {root,head,arms,legs,lemon,data,health:100,blocking:false,attackUntil:0,hitFlash:0};
}

function makeLights(scene) {
  scene.add(new THREE.HemisphereLight(0xdde7ff,0x46334b,2.0));
  const key=new THREE.DirectionalLight(0xffffff,2.4); key.position.set(-4,8,6); key.castShadow=true; scene.add(key);
  const rim=new THREE.PointLight(0xffb45e,2.5,25); rim.position.set(0,5,-5); scene.add(rim);
}
function makePreview(canvasId, character) {
  const canvas=$(canvasId), renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true;
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,1,.1,100);
  camera.position.set(0,2.25,6.8); camera.lookAt(0,1.25,0); makeLights(scene);
  mesh(scene,new THREE.CircleGeometry(2.5,48),mat(0x33344b),[0,0,0]).rotation.x=-Math.PI/2;
  const fighter=makeFighter(character,scene);
  function resize(){const w=canvas.clientWidth||300,h=canvas.clientHeight||300;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvas); resize();
  const clock=new THREE.Clock();
  function tick(){const t=clock.getElapsedTime();fighter.root.position.y=Math.sin(t*2)*.025;fighter.root.rotation.y=Math.sin(t*.65)*.08;fighter.head.rotation.z=Math.sin(t*1.7)*.025;renderer.render(scene,camera);requestAnimationFrame(tick);}
  tick();
}

makePreview("fighter-one",characters[0]); makePreview("fighter-two",characters[1]);

let game=null, chosenIndex=0, keys={}, touchState={}, locked=false;
const selectScreen=$("select-screen"), battleScreen=$("battle-screen"), resultScreen=$("result-screen");

function createArena() {
  const canvas=$("battle-canvas"), renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x171b38); scene.fog=new THREE.Fog(0x171b38,15,32);
  const camera=new THREE.PerspectiveCamera(38,1,.1,80); camera.position.set(0,6.2,13.8); camera.lookAt(0,1.1,0);
  makeLights(scene);
  const floor=mesh(scene,new THREE.PlaneGeometry(24,18),mat(0x76516a),[0,0,0]); floor.rotation.x=-Math.PI/2;
  const grid=new THREE.GridHelper(24,24,0xf6c65b,0x66506e); grid.position.y=.015; scene.add(grid);
  // Stadium walls and warm lights
  for(let i=0;i<12;i++){
    const a=(i/12)*Math.PI*2, r=10.5;
    const pillar=mesh(scene,new THREE.BoxGeometry(.38,3.4,.38),mat(i%2?0x3a3b67:0x68405d),[Math.cos(a)*r,1.7,Math.sin(a)*r-2]);
    const lamp=new THREE.PointLight(i%2?0x469cff:0xff4764,1.2,7);lamp.position.set(Math.cos(a)*r,3.4,Math.sin(a)*r-2);scene.add(lamp);
  }
  const p1=makeFighter(characters[chosenIndex],scene,-2.25);
  const p2=makeFighter(characters[1-chosenIndex],scene,2.25);
  p1.root.rotation.y=.32; p2.root.rotation.y=-.32;
  function resize(){const w=canvas.clientWidth||700,h=canvas.clientHeight||420;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvas); resize();
  return {scene,camera,renderer,p1,p2,clock:new THREE.Clock(),resize};
}

function setMessage(text, duration=1100) {
  const el=$("battle-message"); el.textContent=text; el.classList.remove("hidden");
  clearTimeout(setMessage.timer); setMessage.timer=setTimeout(()=>el.classList.add("hidden"),duration);
}
function updateHud() {
  if(!game)return;
  const {p1,p2,round,playerWins,cpuWins,timeLeft}=game;
  $("player-name").textContent=p1.data.name;
  $("cpu-name").textContent=p2.data.name+" · CPU";
  $("player-health").style.width=p1.health+"%"; $("cpu-health").style.width=p2.health+"%";
  $("player-hp-text").textContent=Math.ceil(p1.health)+" HP"; $("cpu-hp-text").textContent=Math.ceil(p2.health)+" HP";
  $("player-rounds").textContent="WINS "+playerWins; $("cpu-rounds").textContent="WINS "+cpuWins;
  $("round-label").textContent="ROUND "+round; $("timer").textContent=Math.ceil(timeLeft);
}
function startMatch(index) {
  chosenIndex=index; selectScreen.classList.add("hidden"); resultScreen.classList.add("hidden"); battleScreen.classList.remove("hidden");
  const arena=createArena();
  game={...arena,round:1,playerWins:0,cpuWins:0,timeLeft:60,roundStart:performance.now(),lastCpu:0,roundOver:false,matchOver:false};
  updateHud(); setMessage("ROUND 1 · FIGHT!",1300);
  requestAnimationFrame(loop);
}
function showResult() {
  battleScreen.classList.add("hidden"); resultScreen.classList.remove("hidden");
  const playerWon=game.playerWins>game.cpuWins;
  $("winner-title").textContent=(playerWon?game.p1.data.name:game.p2.data.name)+" WINS!";
  $("winner-subtitle").textContent=playerWon?"The lafda champion has been decided!":"CPU takes the showdown. Run it back!";
}
function finishRound(winner) {
  if(game.roundOver||game.matchOver)return;
  game.roundOver=true;
  if(winner==="player")game.playerWins++; else if(winner==="cpu")game.cpuWins++;
  updateHud();
  const label=winner==="player"?game.p1.data.name+" WINS ROUND "+game.round:game.p2.data.name+" WINS ROUND "+game.round;
  setMessage(label,1500);
  setTimeout(()=>{
    if(game.playerWins===2||game.cpuWins===2){game.matchOver=true;showResult();return;}
    game.round++;game.p1.health=100;game.p2.health=100;game.timeLeft=60;game.roundOver=false;
    game.p1.root.position.x=-2.25;game.p2.root.position.x=2.25;
    updateHud();setMessage("ROUND "+game.round+" · FIGHT!",1200);
  },1600);
}
function doAttack(attacker, defender, type) {
  if(!game||game.roundOver||locked)return;
  const now=performance.now();
  if(now<attacker.attackUntil)return;
  const damage=type==="special"?30:type==="kick"?12:8;
  const cooldown=type==="special"?4200:type==="kick"?650:420;
  attacker.attackUntil=now+cooldown;
  attacker.root.userData.attackAnim={until:now+360,type};
  const dist=Math.abs(attacker.root.position.x-defender.root.position.x);
  const inRange=type==="special"?dist<5.5:dist<(type==="kick"?2.05:1.65);
  if(inRange){
    const dealt=defender.blocking?Math.ceil(damage*.25):damage;
    defender.health=Math.max(0,defender.health-dealt);defender.hitFlash=now+180;
    setMessage(type==="special"?(attacker.data.id==="bauna-kid"?"JAI BHAVANI!":"CHAAT LE!"):"-"+dealt+" HP",650);
    if(defender.health<=0)finishRound(attacker===game.p1?"player":"cpu");
  } else if(type==="special") setMessage(attacker.data.id==="bauna-kid"?"JAI BHAVANI!":"LEMON BLAST!",700);
  updateHud();
}
function playerAction(action) {
  if(!game||game.roundOver)return;
  if(action==="punch"||action==="kick"||action==="special")doAttack(game.p1,game.p2,action);
  if(action==="block")game.p1.blocking=true;
}
function loop() {
  if(!game||game.matchOver)return;
  const dt=Math.min(game.clock.getDelta(),.04),now=performance.now();
  if(!game.roundOver){
    const p=game.p1,c=game.p2;
    p.blocking=!!(keys.Space||touchState.block);
    let move=(keys.KeyD||keys.ArrowRight||touchState.right?1:0)-(keys.KeyA||keys.ArrowLeft||touchState.left?1:0);
    p.root.position.x=THREE.MathUtils.clamp(p.root.position.x+move*dt*3.4,-5.2,5.2);
    p.root.rotation.y=p.root.position.x<c.root.position.x?.32:-.32;
    c.root.rotation.y=c.root.position.x>p.root.position.x?-.32:.32;
    // Simple CPU: approach, then alternate punches and kicks.
    const gap=Math.abs(c.root.position.x-p.root.position.x);
    if(gap>1.55)c.root.position.x+=Math.sign(p.root.position.x-c.root.position.x)*dt*1.65;
    c.blocking=gap<1.7&&Math.random()<.012;
    if(gap<1.9&&now-game.lastCpu>1050){game.lastCpu=now;doAttack(c,p,Math.random()<.24?"kick":"punch");}
    game.timeLeft-=dt;
    if(game.timeLeft<=0){game.timeLeft=0;finishRound(p.health>=c.health?"player":"cpu");}
    for(const fighter of [p,c]){
      const anim=fighter.root.userData.attackAnim;
      if(anim&&now<anim.until){fighter.arms[0].rotation.z=-1.0;fighter.arms[1].rotation.z=.8;}
      else {fighter.arms[0].rotation.z=.45;fighter.arms[1].rotation.z=-.45;fighter.root.userData.attackAnim=null;}
      fighter.root.position.y=Math.sin(now*.006+(fighter===p?0:1))*.025;
      fighter.head.rotation.z=Math.sin(now*.002)*.018;
      if(fighter.hitFlash>now)fighter.root.children.forEach(o=>{if(o.material?.emissive)o.material.emissive.setHex(0x551111);});
      else fighter.root.children.forEach(o=>{if(o.material?.emissive)o.material.emissive.setHex(0x000000);});
    }
    updateHud();
  }
  game.renderer.render(game.scene,game.camera);
  requestAnimationFrame(loop);
}

document.querySelectorAll(".choose-button").forEach(btn=>btn.addEventListener("click",()=>startMatch(Number(btn.dataset.fighter))));
$("back-button").addEventListener("click",()=>{game=null;battleScreen.classList.add("hidden");selectScreen.classList.remove("hidden");});
$("rematch-button").addEventListener("click",()=>{game=null;resultScreen.classList.add("hidden");selectScreen.classList.remove("hidden");});
$("select-again-button").addEventListener("click",()=>{game=null;resultScreen.classList.add("hidden");selectScreen.classList.remove("hidden");});
window.addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(["Space","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(e.code==="KeyJ")playerAction("punch");
  if(e.code==="KeyK")playerAction("kick");
  if(e.code==="KeyL")playerAction("special");
});
window.addEventListener("keyup",e=>{keys[e.code]=false;if(e.code==="Space"&&game)game.p1.blocking=false;});
document.querySelectorAll("[data-action]").forEach(btn=>{
  const action=btn.dataset.action;
  const down=e=>{e.preventDefault();touchState[action]=true;if(["punch","kick","special"].includes(action))playerAction(action);};
  const up=e=>{e.preventDefault();touchState[action]=false;if(action==="block"&&game)game.p1.blocking=false;};
  btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointercancel",up);btn.addEventListener("pointerleave",up);
});
