let THREE;
try {
  THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
} catch (firstError) {
  try {
    THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
  } catch (secondError) {
    console.error('Three.js failed to load from both CDNs.', firstError, secondError);
    const start = document.getElementById('startBtn');
    if (start) { start.textContent = 'GAME ENGINE FAILED TO LOAD — REFRESH'; start.disabled = true; }
    throw secondError;
  }
}
const $=id=>document.getElementById(id),screens=['intro','select','arenas','fight','result'];
let selected=0,arena='ground',game=null,scene,camera,renderer,clock,playerModel,cpuModel,beam,splash,keys={},paused=false,raf=0,lastHud=0,audioToken=0,currentVoice=null;
// Background music starts on the first user gesture (browser autoplay policy).
const bgm = new Audio('assets/audio/background-bgm.mp3');
bgm.loop = true;
bgm.volume = 0.32;
bgm.preload = 'auto';
let bgmStarted = false;
function startBgm() {
  bgmStarted = true;
  bgm.play().catch(err => console.info('Add assets/audio/background-bgm.mp3 to enable BGM.', err));
}
function pauseBgm() { if (!bgm.paused) bgm.pause(); }
function resumeBgm() { if (bgmStarted && bgm.paused) bgm.play().catch(()=>{}); }

const fighters=[{name:'BAUNA KID',face:'assets/bauna-face.jpg',top:0x9d2638,short:true},{name:'NIMBU CHATORA',face:'assets/nimbu-face.jpg',top:0x126b9b,short:false}];
function show(id){screens.forEach(s=>$(s).classList.toggle('hidden',s!==id));}
function stopVoice(){audioToken++;if(currentVoice){currentVoice.pause();currentVoice.currentTime=0;currentVoice=null;}}
function playVoice(file,token=audioToken){return new Promise(resolve=>{const a=new Audio('assets/audio/'+file);currentVoice=a;let settled=false;const finish=()=>{if(settled)return;settled=true;if(currentVoice===a)currentVoice=null;resolve();};a.addEventListener('ended',finish,{once:true});a.addEventListener('error',()=>setTimeout(finish,650),{once:true});a.play().then(()=>{}).catch(()=>setTimeout(finish,650));});}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
if($('startBtn')) $('startBtn').onclick=()=>{startBgm();show('select');};
document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.pick);document.querySelectorAll('.fighter-select').forEach((c,i)=>c.classList.toggle('selected',i===selected));show('arenas');});
$('backSelect').onclick=()=>show('select');
document.querySelectorAll('[data-arena]').forEach(b=>b.onclick=()=>{arena=b.dataset.arena;startMatch();});
$('pauseBtn').onclick=pause;$('resumeBtn').onclick=resume;$('mainMenuBtn').onclick=()=>{paused=false;resumeBgm();stopScene();show('intro');};
$('rematchBtn').onclick=()=>startMatch();$('newFightBtn').onclick=()=>{stopScene();show('select');};
function mat(color,roughness=.7){return new THREE.MeshStandardMaterial({color,roughness});}
function makeFighter(data,x,isCpu=false){
 const root=new THREE.Group(),skin=mat(0xb97858),cloth=mat(data.top),dark=mat(0x20283a),shoe=mat(0xe8e8e8),hairMat=mat(0x171820);
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.68,8,16),cloth);torso.scale.set(1.08,1,.82);torso.position.y=1.45;root.add(torso);
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.22,12),skin);neck.position.y=1.98;root.add(neck);
 const headGroup=new THREE.Group();headGroup.position.y=2.32;root.add(headGroup);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.36,32,24),skin);head.scale.set(.92,1.08,.9);headGroup.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.37,24,18),hairMat);hair.scale.set(.96,.52,.91);hair.position.set(0,.22,-.015);headGroup.add(hair);
 // Use the supplied portrait as a curved, forward-facing face panel, with visible facial structure around it.
 const tex=new THREE.TextureLoader().load(data.face);tex.colorSpace=THREE.SRGBColorSpace;
 const faceGeo=new THREE.PlaneGeometry(.49,.68,18,24);const pos=faceGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,.075*(1-(x/.245)**2)+.018*(1-(y/.34)**2));}faceGeo.computeVertexNormals();const face=new THREE.Mesh(faceGeo,new THREE.MeshStandardMaterial({map:tex,roughness:.82,side:THREE.DoubleSide}));face.position.set(0,-.005,.315);headGroup.add(face);
 const earMat=skin;for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.085,16,12),earMat);ear.scale.set(.62,1,.55);ear.position.set(side*.315,-.015,.005);headGroup.add(ear);}const jaw=new THREE.Mesh(new THREE.SphereGeometry(.255,24,18),skin);jaw.scale.set(.92,.52,.72);jaw.position.set(0,-.245,.055);headGroup.add(jaw);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const armPivot=new THREE.Group();armPivot.position.set(side*.46,1.78,0);root.add(armPivot);
  const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.35,5,10),skin);upper.position.y=-.25;armPivot.add(upper);
  const elbow=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),skin);elbow.position.y=-.48;armPivot.add(elbow);
  const fore=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.32,5,10),skin);fore.position.set(0,-.68,.005);armPivot.add(fore);
  const fist=new THREE.Mesh(new THREE.SphereGeometry(.13,14,12),skin);fist.position.set(0,-.88,.035);armPivot.add(fist);arms.push(armPivot);
  const legPivot=new THREE.Group();legPivot.position.set(side*.2,.94,0);root.add(legPivot);
  const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.145,.36,5,10),dark);thigh.position.y=-.25;legPivot.add(thigh);
  const shin=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.32,5,10),dark);shin.position.y=-.57;legPivot.add(shin);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.24,.14,.4),shoe);foot.position.set(0,-.82,.12);legPivot.add(foot);legs.push(legPivot);
 }
 const belt=new THREE.Mesh(new THREE.BoxGeometry(.65,.12,.34),mat(0xd5b46b));belt.position.y=1.04;root.add(belt);
 root.position.x=x;const scale=data.short?.88:1.03;root.scale.set(scale,scale,scale);
 root.userData={arms,legs,torso,headGroup,baseY:0,attack:null,hitUntil:0,downUntil:0,block:false,step:0,isCpu};return root;
}
function setupScene(){const host=$('threeRoot');host.innerHTML='';scene=new THREE.Scene();const h=host.clientHeight||420;camera=new THREE.PerspectiveCamera(42,host.clientWidth/h,.1,100);camera.position.set(0,4.05,10.5);camera.lookAt(0,1.35,0);renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,h);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);scene.add(new THREE.HemisphereLight(0xffffff,0x46506c,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(-3,8,6);sun.castShadow=true;scene.add(sun);
 // No raised platform or rectangular floor mesh: the arena artwork itself supplies the ground. Add only soft foot shadows.
 const shadowMat=new THREE.MeshBasicMaterial({color:0x05070b,transparent:true,opacity:.28,depthWrite:false});for(const x of [-1.8,1.8]){const sh=new THREE.Mesh(new THREE.CircleGeometry(.48,32),shadowMat);sh.rotation.x=-Math.PI/2;sh.position.set(x,.012,.12);sh.scale.set(1.45,.72,1);scene.add(sh);}
 playerModel=makeFighter(fighters[selected],-1.8,false);cpuModel=makeFighter(fighters[1-selected],1.8,true);playerModel.rotation.y=.12;cpuModel.rotation.y=-.12;scene.add(playerModel,cpuModel);
 beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.28,5.4,16),new THREE.MeshBasicMaterial({color:0xffef7a,transparent:true,opacity:0,emissive:0xffc82e}));beam.rotation.z=Math.PI/2;beam.position.set(0,2.3,0);scene.add(beam);
 splash=new THREE.Group();const lemon=new THREE.Mesh(new THREE.SphereGeometry(.45,20,16),mat(0xffdf21));lemon.scale.set(1.35,.7,.8);splash.add(lemon);for(let i=0;i<16;i++){const bit=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:0xffe84d}));const a=i/16*Math.PI*2;bit.position.set(Math.cos(a)*(.7+Math.random()*.35),Math.sin(a)*(.6+Math.random()*.35),0);splash.add(bit);}splash.visible=false;scene.add(splash);
 clock=new THREE.Clock();window.addEventListener('resize',resizeScene);}
function resizeScene(){if(!renderer)return;const h=$('threeRoot');camera.aspect=h.clientWidth/h.clientHeight;camera.updateProjectionMatrix();renderer.setSize(h.clientWidth,h.clientHeight);}
function stopScene(){stopVoice();if(raf)cancelAnimationFrame(raf);raf=0;if(renderer){renderer.dispose();renderer.domElement.remove();}renderer=null;scene=null;window.removeEventListener('resize',resizeScene);}
async function startMatch(){startBgm();stopScene();paused=true;$('pauseOverlay').classList.add('hidden');show('fight');game={ph:200,ch:200,ps:25,cs:25,pwins:0,cwins:0,round:1,time:60,over:false,intro:true,px:-1.8,cx:1.8,lastCpu:0,lastCpuMove:0,specialBusy:false,hitFlash:0};$('pName').textContent=fighters[selected].name;$('cName').textContent=fighters[1-selected].name+' · CPU';$('arenaName').textContent=arena==='ground'?'RISHRA FOOTBALL GROUND':'STEPPING STONE SCHOOL · RISHRA';$('arenaStage').style.backgroundImage=`url('${arena==='ground'?'assets/football-ground.png':'assets/stepping-stone-rishra.png'}')`;setupScene();hud();loop();const token=audioToken;callout(fighters[selected].name+'!');await playVoice(selected===0?'bauna-intro.mp3':'nimbu-intro.mp3',token);if(token!==audioToken||!game)return;callout(fighters[1-selected].name+' · CPU!');await playVoice(selected===0?'nimbu-intro.mp3':'bauna-intro.mp3',token);if(token!==audioToken||!game)return;for(const n of ['3','2','1','FIGHT!']){callout(n);await wait(n==='FIGHT!'?350:700);if(token!==audioToken||!game)return;}game.intro=false;paused=false;clock.getDelta();callout('ROUND 1 · FIGHT!');}
function hud(){$('pHealth').style.width=(game.ph/200*100)+'%';$('cHealth').style.width=(game.ch/200*100)+'%';$('pHp').textContent=Math.ceil(game.ph)+' HP';$('cHp').textContent=Math.ceil(game.ch)+' HP';$('pSpecial').style.width=game.ps+'%';$('cSpecial').style.width=game.cs+'%';$('roundLabel').textContent='ROUND '+game.round;$('timer').textContent=Math.ceil(game.time);}
function callout(t){$('fightCallout').textContent=t;$('fightCallout').classList.remove('pop');void $('fightCallout').offsetWidth;$('fightCallout').classList.add('pop');}
function pause(){if(!game||game.over||game.intro)return;paused=true;pauseBgm();$('pauseOverlay').classList.remove('hidden');}
function resume(){paused=false;resumeBgm();$('pauseOverlay').classList.add('hidden');clock.getDelta();}
function distance(){return Math.abs(game.cx-game.px);}
function triggerAttack(who,type){
 if(!game||game.over||paused||game.specialBusy)return;
 const isP=who==='p',attacker=isP?playerModel:cpuModel,defender=isP?cpuModel:playerModel,dist=distance(),now=performance.now();
 const reach=type==='kick'?1.72:1.28; if(dist>reach)return;
 const au=attacker.userData,du=defender.userData;
 if((au.attack&&now<au.attack.until)||now<au.hitUntil||now<au.downUntil)return;
 au.attack={type,started:now,until:now+(type==='kick'?680:440),hit:false};au.block=false;
 const defending=du.block&&Math.random()<.72,base=type==='kick'?10:6,dmg=defending?Math.max(1,Math.round(base*.25)):base;
 const impactDelay=type==='kick'?300:190;
 setTimeout(()=>{
  if(!game||game.over||!au.attack||au.attack.hit)return;
  if(distance()>(type==='kick'?1.88:1.42))return;
  au.attack.hit=true;
  if(isP){game.ch=Math.max(0,game.ch-dmg);game.ps=Math.min(100,game.ps+(defending?5:13));}
  else{game.ph=Math.max(0,game.ph-dmg);game.cs=Math.min(100,game.cs+(defending?5:13));}
  if(defending){du.hitUntil=performance.now()+180;callout('BLOCK!');}
  else{
   const side=isP?1:-1,now2=performance.now();
   du.block=false;du.attack=null;du.hitUntil=now2+(type==='kick'?520:380);
   if(type==='kick'){
    du.downUntil=now2+1250;du.fallSide=side;defender.userData.knockback=side*1.05;
    callout('KICK! · KNOCKDOWN');
   }else{
    du.punchChain=(du.punchChain||0)+1;du.lastPunch=now2;defender.userData.knockback=side*.48;
    if(du.punchChain>=2){du.punchChain=0;du.downUntil=now2+1050;du.fallSide=side;callout('2-HIT COMBO! · DOWN!');}
    else callout('PUNCH CONNECTED!');
   }
  }
  hud();if(game.ch<=0)roundWin('p');if(game.ph<=0)roundWin('c');
 },impactDelay);
}

function action(type){if(!game||game.over||paused||game.specialBusy)return;if(type==='special'){special('p');return;}if(type==='block'){playerModel.userData.block=true;return;}triggerAttack('p',type);}
async function special(who){
 if(!game||game.over||paused)return;
 const isP=who==='p',meter=isP?'ps':'cs';
 if(game[meter]<100||game.specialBusy)return;
 game[meter]=0;game.specialBusy=true;hud();
 const attacker=isP?playerModel:cpuModel,defender=isP?cpuModel:playerModel;
 const fighterIndex=isP?selected:1-selected,name=fighters[fighterIndex].name;
 const au=attacker.userData,du=defender.userData,originX=attacker.position.x;
 au.attack={type:'special',started:performance.now(),until:performance.now()+3600,hit:true};
 const side=isP?1:-1;
 const pauseFrames=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const animate=(duration,fn)=>new Promise(resolve=>{
  const begin=performance.now();
  const tick=now=>{if(!game){resolve();return;}const p=Math.min(1,(now-begin)/duration);fn(p);if(p<1)requestAnimationFrame(tick);else resolve();};
  requestAnimationFrame(tick);
 });
 if(fighterIndex===0){
  callout('JAI BHAVANI! · HIGH KICK');
  // Power-up: grow noticeably before the high kick.
  await animate(700,p=>{const s=1+0.48*Math.sin(p*Math.PI/2);attacker.scale.setScalar(s*(fighters[fighterIndex].short?.88:1.03));attacker.position.y=.08*Math.sin(p*Math.PI);});
  await animate(500,p=>{const leg=au.legs[1];leg.rotation.z=-1.9*p;attacker.rotation.z=-.08*p;});
  defender.userData.block=false;defender.userData.attack=null;
  defender.userData.hitUntil=performance.now()+450;
  defender.userData.downUntil=performance.now()+1450;
  defender.userData.fallSide=side;
  defender.userData.knockback=side*1.65;
  game.ch=Math.max(0,game.ch-60);game.ps=Math.min(100,game.ps+18);
  callout('HIGH KICK! · AIRBORNE KNOCKDOWN');
  await animate(420,p=>{au.legs[1].rotation.z=-1.9*(1-p);});
  await pauseFrames(250);
  attacker.scale.set(fighters[fighterIndex].short?.88:1.03,fighters[fighterIndex].short?.88:1.03,fighters[fighterIndex].short?.88:1.03);
  attacker.position.y=0;attacker.rotation.z=0;au.legs[1].rotation.z=0;
 }else{
  callout('NIMBU SPLASH! · LIFT OFF');
  splash.visible=true;splash.position.set(attacker.position.x,2.25,.25);splash.scale.setScalar(.12);
  // Slow, controlled rise, pause at the apex, then splash.
  await animate(1250,p=>{attacker.position.y=1.35*p;splash.position.y=2.2+1.25*p;splash.scale.setScalar(.12+.2*p);});
  await pauseFrames(350);
  callout('LEMON SPLASH!');
  await animate(650,p=>{splash.scale.setScalar(.32+1.35*p);splash.position.x=attacker.position.x+side*(.6+p*.45);});
  defender.visible=false;
  const paneer=new THREE.Group();
  for(let i=0;i<14;i++){const cube=new THREE.Mesh(new THREE.BoxGeometry(.24,.2,.2),mat(0xfff0cf));cube.position.set((Math.random()-.5)*1.15,Math.random()*.95,(Math.random()-.5)*.5);cube.rotation.set(Math.random(),Math.random(),Math.random());paneer.add(cube);}
  paneer.position.set(defender.position.x,0,.2);scene.add(paneer);
  game.ch=Math.max(0,game.ch-60);game.ps=Math.min(100,game.ps+18);hud();
  callout('PANEER TRANSFORMATION · 4 SECONDS');
  await pauseFrames(4000);
  scene.remove(paneer);defender.visible=true;splash.visible=false;
  await animate(850,p=>{attacker.position.y=1.35*(1-p);});
  attacker.position.y=0;
 }
 splash.visible=false;attacker.position.y=0;attacker.rotation.z=0;attacker.scale.set(fighters[fighterIndex].short?.88:1.03,fighters[fighterIndex].short?.88:1.03,fighters[fighterIndex].short?.88:1.03);
 au.attack=null;game.specialBusy=false;hud();callout(name+' SPECIAL · -60 HP');
 if(game.ch<=0)roundWin('p');if(game.ph<=0)roundWin('c');
}
function roundWin(winner){if(game.over)return;game.over=true;if(winner==='p')game.pwins++;else game.cwins++;callout((winner==='p'?fighters[selected].name:fighters[1-selected].name)+' WINS ROUND '+game.round);setTimeout(async()=>{if(!game)return;if(game.pwins===2||game.cwins===2){const playerWon=game.pwins>game.cwins,winnerIndex=playerWon?selected:1-selected;stopScene();show('result');$('winnerText').textContent=fighters[winnerIndex].name+' WINS!';$('resultSub').textContent=`FINAL SCORE ${game.pwins} — ${game.cwins} · Champion of Rishra`;const token=audioToken;await playVoice(winnerIndex===0?'bauna-win.mp3':'nimbu-win.mp3',token);return;}game.round++;game.ph=game.ch=200;game.ps=game.cs=25;game.time=90;game.over=false;game.px=-1.8;game.cx=1.8;playerModel.position.set(-1.8,0,0);cpuModel.position.set(1.8,0,0);hud();callout('ROUND '+game.round+' · FIGHT!');},1600);}
function animateFighter(model,now,dt,walking){
 const u=model.userData;u.step+=dt*(walking?9:2);u.arms.forEach(a=>a.rotation.set(0,0,0));u.legs.forEach(l=>l.rotation.set(0,0,0));
 
 if(now<u.downUntil){const fall=u.fallSide||1;model.position.y=-.62;model.rotation.z=fall*.98;u.torso.rotation.x=.28;u.arms[0].rotation.z=-.9;u.arms[1].rotation.z=.9;u.legs[0].rotation.z=.45;u.legs[1].rotation.z=-.45;return;}
 model.position.y=0;model.rotation.z=0;u.torso.rotation.set(0,0,0);
 if(now<u.hitUntil){model.rotation.z=model===playerModel?-.12:.12;u.torso.rotation.x=-.28;u.arms[0].rotation.z=.5;u.arms[1].rotation.z=-.5;return;}
 if(u.attack&&now<u.attack.until){const p=(now-u.attack.started)/(u.attack.until-u.attack.started),q=Math.sin(Math.min(1,p*1.35)*Math.PI/2);
  if(u.attack.type==='punch'){const arm=model===playerModel?1:0;u.arms[arm].rotation.z=(arm? -1:1)*q*1.8;u.arms[1-arm].rotation.z=.35;u.torso.rotation.y=model===playerModel?.28:-.28;u.torso.rotation.x=-.12;}
  else if(u.attack.type==='kick'){const leg=model===playerModel?1:0;u.legs[leg].rotation.z=(leg?1:-1)*q*1.45;u.arms[0].rotation.z=.5;u.arms[1].rotation.z=-.5;u.torso.rotation.x=-.18;}
  return;
 }else u.attack=null;
 if(u.block){u.arms[0].rotation.z=.8;u.arms[1].rotation.z=-.8;u.torso.rotation.x=.12;return;}
 if(walking){u.legs[0].rotation.z=Math.sin(u.step)*.48;u.legs[1].rotation.z=-Math.sin(u.step)*.48;u.arms[0].rotation.z=-Math.sin(u.step)*.3;u.arms[1].rotation.z=Math.sin(u.step)*.3;model.position.y=Math.abs(Math.sin(u.step*2))*.045;}
 else{u.arms[0].rotation.z=-.12;u.arms[1].rotation.z=.12;}
}

function loop(){if(!renderer||!game)return;raf=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05),now=performance.now();if(!paused&&!game.over&&!game.intro){game.time-=dt;if(game.time<=0)roundWin(game.ph>=game.ch?'p':'c');
 const move=(keys.ArrowLeft||keys.KeyA?-1:0)+(keys.ArrowRight||keys.KeyD?1:0);game.px=Math.max(-3.8,Math.min(3.8,game.px+move*dt*3.1));
 const d=game.cx-game.px,abs=Math.abs(d);playerModel.rotation.y=d>0?.16:-.16;cpuModel.rotation.y=d<0?-.16:.16;
 // CPU advances into striking range, retreats after pressure, blocks and chooses punches/kicks.
 const cpu=cpuModel.userData;if(now>game.lastCpuMove){game.lastCpuMove=now+520+Math.random()*520;const r=Math.random();if(abs<1.35&&r<.42){cpu.block=true;cpu.blockUntil=now+450+Math.random()*350;}else if(r<.22&&abs<1.7){game.cx+=Math.sign(d)*.45;}else cpu.block=false;}
 if(abs>1.55){game.cx-=Math.sign(d)*Math.min(abs-1.42,dt*.95);}else if(abs<1.12){game.cx+=Math.sign(d)*dt*.8;}
 game.cx=Math.max(-3.8,Math.min(3.8,game.cx));if(cpu.blockUntil&&now>cpu.blockUntil)cpu.block=false;
 if(game.cs>=100&&abs<3.1&&!game.specialBusy&&Math.random()<.004){special('c');}else if(abs<1.62&&now-game.lastCpu>1450+Math.random()*850&&!game.specialBusy){game.lastCpu=now;triggerAttack('c',Math.random()<.38?'kick':'punch');}
 game.cs=Math.min(100,game.cs+dt*.42);game.ps=Math.min(100,game.ps+dt*.32);
 if(playerModel.userData.knockback){game.px+=playerModel.userData.knockback;playerModel.userData.knockback*=.78;if(Math.abs(playerModel.userData.knockback)<.018)playerModel.userData.knockback=0;}if(cpuModel.userData.knockback){game.cx+=cpuModel.userData.knockback;cpuModel.userData.knockback*=.78;if(Math.abs(cpuModel.userData.knockback)<.018)cpuModel.userData.knockback=0;}game.px=Math.max(-3.8,Math.min(3.8,game.px));game.cx=Math.max(-3.8,Math.min(3.8,game.cx));playerModel.position.x=game.px;cpuModel.position.x=game.cx;
 animateFighter(playerModel,now,dt,!!move);animateFighter(cpuModel,now,dt,Math.abs(game.cx-(game._prevCx??game.cx))>.002);game._prevCx=game.cx;
 if(now-lastHud>100){hud();lastHud=now;}}
 renderer.render(scene,camera);}
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyJ')action('punch');if(e.code==='KeyK')action('kick');if(e.code==='KeyL')action('special');if(e.code==='KeyI'||e.code==='KeyS')action('block');if(e.code==='Escape'&&!paused)pause();});window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyI'||e.code==='KeyS')playerModel&&(playerModel.userData.block=false);});
document.querySelectorAll('[data-action]').forEach(b=>{const a=b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();if(a==='left')keys.ArrowLeft=true;else if(a==='right')keys.ArrowRight=true;else action(a);});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{if(a==='left')keys.ArrowLeft=false;if(a==='right')keys.ArrowRight=false;if(a==='block'&&playerModel)playerModel.userData.block=false;}));});
