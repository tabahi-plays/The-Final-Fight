import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const $=id=>document.getElementById(id),screens=['intro','select','arenas','fight','result'];
let selected=0,arena='ground',game=null,scene,camera,renderer,clock,playerModel,cpuModel,beam,splash,keys={},paused=false,raf=0,lastHud=0;
const fighters=[{name:'BAUNA KID',face:'assets/bauna-face.jpg',top:0x9d2638,short:true},{name:'NIMBU CHATORA',face:'assets/nimbu-face.jpg',top:0x126b9b,short:false}];
function show(id){screens.forEach(s=>$(s).classList.toggle('hidden',s!==id));}
$('startBtn').onclick=()=>show('select');
document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.pick);document.querySelectorAll('.fighter-select').forEach((c,i)=>c.classList.toggle('selected',i===selected));show('arenas');});
$('backSelect').onclick=()=>show('select');
document.querySelectorAll('[data-arena]').forEach(b=>b.onclick=()=>{arena=b.dataset.arena;startMatch();});
$('pauseBtn').onclick=pause;$('resumeBtn').onclick=resume;$('mainMenuBtn').onclick=()=>{paused=false;stopScene();show('intro');};
$('rematchBtn').onclick=()=>startMatch();$('newFightBtn').onclick=()=>{stopScene();show('select');};
function mat(color,roughness=.7){return new THREE.MeshStandardMaterial({color,roughness});}
function makeFighter(data,x,isCpu=false){
 const root=new THREE.Group(),skin=mat(0xb97858),cloth=mat(data.top),dark=mat(0x20283a),shoe=mat(0xe8e8e8),hairMat=mat(0x171820);
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.39,.66,6,12),cloth);torso.position.y=1.45;root.add(torso);
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.22,12),skin);neck.position.y=1.98;root.add(neck);
 const headGroup=new THREE.Group();headGroup.position.y=2.32;root.add(headGroup);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.36,32,24),skin);head.scale.set(.88,1.08,.84);headGroup.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.37,24,18),hairMat);hair.scale.set(.96,.52,.91);hair.position.set(0,.22,-.015);headGroup.add(hair);
 // Use the supplied portrait as a curved, forward-facing face panel, with visible facial structure around it.
 const tex=new THREE.TextureLoader().load(data.face);tex.colorSpace=THREE.SRGBColorSpace;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(.48,.53),new THREE.MeshBasicMaterial({map:tex,transparent:false,side:THREE.DoubleSide}));face.position.set(0,-.005,.305);headGroup.add(face);
 const brow=mat(0x302019),eye=mat(0x171313),white=mat(0xfff3e7),nose=mat(0x9d6048),mouth=mat(0x572b2a);
 for(const s of [-1,1]){const b=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.025),brow);b.position.set(s*.115,.105,.324);headGroup.add(b);const e=new THREE.Mesh(new THREE.SphereGeometry(.027,10,8),white);e.position.set(s*.105,.065,.337);headGroup.add(e);const pupil=new THREE.Mesh(new THREE.SphereGeometry(.013,8,8),eye);pupil.position.set(s*.105,.063,.36);headGroup.add(pupil);}
 const ns=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),nose);ns.scale.set(.7,1,.55);ns.position.set(0,-.045,.34);headGroup.add(ns);const mo=new THREE.Mesh(new THREE.BoxGeometry(.105,.018,.018),mouth);mo.position.set(0,-.15,.335);headGroup.add(mo);
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
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(18,8),mat(arena==='ground'?0x426d38:0x777d88,.95));ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=true;scene.add(ground);
 const lineMat=new THREE.MeshBasicMaterial({color:0xffffff});for(let x=-5;x<=5;x+=5){const line=new THREE.Mesh(new THREE.BoxGeometry(.035,.012,7),lineMat);line.position.set(x,.01,0);scene.add(line);}const mid=new THREE.Mesh(new THREE.TorusGeometry(1.1,.025,8,64),lineMat);mid.rotation.x=Math.PI/2;mid.position.y=.015;scene.add(mid);
 playerModel=makeFighter(fighters[selected],-1.8,false);cpuModel=makeFighter(fighters[1-selected],1.8,true);playerModel.rotation.y=.12;cpuModel.rotation.y=-.12;scene.add(playerModel,cpuModel);
 beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.28,5.4,16),new THREE.MeshBasicMaterial({color:0xffef7a,transparent:true,opacity:0,emissive:0xffc82e}));beam.rotation.z=Math.PI/2;beam.position.set(0,2.3,0);scene.add(beam);
 splash=new THREE.Group();const lemon=new THREE.Mesh(new THREE.SphereGeometry(.45,20,16),mat(0xffdf21));lemon.scale.set(1.35,.7,.8);splash.add(lemon);for(let i=0;i<16;i++){const bit=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:0xffe84d}));const a=i/16*Math.PI*2;bit.position.set(Math.cos(a)*(.7+Math.random()*.35),Math.sin(a)*(.6+Math.random()*.35),0);splash.add(bit);}splash.visible=false;scene.add(splash);
 clock=new THREE.Clock();window.addEventListener('resize',resizeScene);}
function resizeScene(){if(!renderer)return;const h=$('threeRoot');camera.aspect=h.clientWidth/h.clientHeight;camera.updateProjectionMatrix();renderer.setSize(h.clientWidth,h.clientHeight);}
function stopScene(){if(raf)cancelAnimationFrame(raf);raf=0;if(renderer){renderer.dispose();renderer.domElement.remove();}renderer=null;scene=null;window.removeEventListener('resize',resizeScene);}
function startMatch(){stopScene();paused=false;$('pauseOverlay').classList.add('hidden');show('fight');game={ph:100,ch:100,ps:25,cs:25,pwins:0,cwins:0,round:1,time:60,over:false,px:-1.8,cx:1.8,lastCpu:0,lastCpuMove:0,specialBusy:false,hitFlash:0};$('pName').textContent=fighters[selected].name;$('cName').textContent=fighters[1-selected].name+' · CPU';$('arenaName').textContent=arena==='ground'?'RISHRA FOOTBALL GROUND':'STEPPING STONE SCHOOL · RISHRA';$('arenaStage').style.backgroundImage=`url('${arena==='ground'?'assets/football-ground.png':'assets/stepping-stone-rishra.png'}')`;setupScene();hud();callout('ROUND 1 · FIGHT!');loop();}
function hud(){$('pHealth').style.width=game.ph+'%';$('cHealth').style.width=game.ch+'%';$('pHp').textContent=Math.ceil(game.ph)+' HP';$('cHp').textContent=Math.ceil(game.ch)+' HP';$('pSpecial').style.width=game.ps+'%';$('cSpecial').style.width=game.cs+'%';$('roundLabel').textContent='ROUND '+game.round;$('timer').textContent=Math.ceil(game.time);}
function callout(t){$('fightCallout').textContent=t;$('fightCallout').classList.remove('pop');void $('fightCallout').offsetWidth;$('fightCallout').classList.add('pop');}
function pause(){if(!game||game.over)return;paused=true;$('pauseOverlay').classList.remove('hidden');}
function resume(){paused=false;$('pauseOverlay').classList.add('hidden');clock.getDelta();}
function distance(){return Math.abs(game.cx-game.px);}
function triggerAttack(who,type){if(!game||game.over||paused||game.specialBusy)return;const isP=who==='p',attacker=isP?playerModel:cpuModel,defender=isP?cpuModel:playerModel;const dist=distance();if(dist>(type==='kick'?1.95:1.55))return;const now=performance.now();if(attacker.userData.attack&&now<attacker.userData.attack.until)return;if(now<attacker.userData.hitUntil||now<attacker.userData.downUntil)return;
 attacker.userData.attack={type,started:now,until:now+(type==='kick'?560:420),hit:false};attacker.userData.block=false;
 const defending=defender.userData.block&&Math.random()<.8;const dmg=defending?Math.round(type==='kick'?3:2):(type==='kick'?11:7);
 setTimeout(()=>{if(!game||game.over||!attacker.userData.attack)return;if(distance()>(type==='kick'?2.05:1.7))return;attacker.userData.attack.hit=true;if(isP){game.ch=Math.max(0,game.ch-dmg);game.ps=Math.min(100,game.ps+(defending?5:14));}else{game.ph=Math.max(0,game.ph-dmg);game.cs=Math.min(100,game.cs+(defending?5:14));}if(!defending){defender.userData.hitUntil=performance.now()+420;defender.userData.downUntil=performance.now()+(type==='kick'?1050:0);defender.userData.attack=null;defender.userData.block=false;callout(type==='kick'?'KICK CONNECTED!':'PUNCH CONNECTED!');}else callout('BLOCK!');hud();if(game.ch<=0)roundWin('p');if(game.ph<=0)roundWin('c');},type==='kick'?250:175);
}
function action(type){if(!game||game.over||paused||game.specialBusy)return;if(type==='special'){special('p');return;}if(type==='block'){playerModel.userData.block=true;return;}triggerAttack('p',type);}
function special(who){const isP=who==='p',meter=isP?'ps':'cs';if(game[meter]<100||game.specialBusy)return;game[meter]=0;game.specialBusy=true;hud();const attacker=isP?playerModel:cpuModel,defender=isP?cpuModel:playerModel;attacker.userData.attack={type:'special',started:performance.now(),until:performance.now()+1800,hit:true};const fighterIndex=isP?selected:1-selected,name=fighters[fighterIndex].name;
 if(fighterIndex===0){callout('JAI BHAVANI!');beam.material.opacity=.95;beam.position.set((attacker.position.x+defender.position.x)/2,2.3,0);setTimeout(()=>{beam.material.opacity=0;},850);}
 else{callout('NIMBU SPLASH!');splash.visible=true;splash.position.set((attacker.position.x+defender.position.x)/2,2.1,.2);splash.scale.set(.2,.2,.2);defender.visible=false;const paneer=new THREE.Group();for(let i=0;i<12;i++){const cube=new THREE.Mesh(new THREE.BoxGeometry(.27,.22,.22),mat(0xfff0cf));cube.position.set((Math.random()-.5)*1.1,Math.random()*.9,(Math.random()-.5)*.45);paneer.add(cube);}scene.add(paneer);splash.userData.paneer=paneer;}
 let t=0;const anim=()=>{if(!game)return;t+=.06;attacker.position.y=Math.max(0,1.65-Math.abs(Math.sin(t))*1.1);attacker.rotation.z=Math.sin(t)*.12;if(splash.visible){splash.scale.setScalar(Math.min(1.7,.2+t*.16));splash.position.y=2+Math.sin(t)*.12;}if(t<1.8)requestAnimationFrame(anim);else{attacker.position.y=0;attacker.rotation.z=0;splash.visible=false;if(splash.userData.paneer){scene.remove(splash.userData.paneer);splash.userData.paneer=null;defender.visible=true;}setTimeout(()=>{if(!game)return;if(isP)game.ch=Math.max(0,game.ch-30);else game.ph=Math.max(0,game.ph-30);game.specialBusy=false;attacker.userData.attack=null;hud();callout(name+' SPECIAL · -30 HP');if(game.ch<=0)roundWin('p');if(game.ph<=0)roundWin('c');},fighterIndex===1?2000:0);}};anim();}
function roundWin(winner){if(game.over)return;game.over=true;if(winner==='p')game.pwins++;else game.cwins++;callout((winner==='p'?fighters[selected].name:fighters[1-selected].name)+' WINS ROUND '+game.round);setTimeout(()=>{if(!game)return;if(game.pwins===2||game.cwins===2){stopScene();show('result');$('winnerText').textContent=(game.pwins>game.cwins?fighters[selected].name:fighters[1-selected].name)+' WINS!';$('resultSub').textContent=`FINAL SCORE ${game.pwins} — ${game.cwins} · Champion of Rishra`;return;}game.round++;game.ph=game.ch=100;game.ps=game.cs=25;game.time=60;game.over=false;game.px=-1.8;game.cx=1.8;playerModel.position.set(-1.8,0,0);cpuModel.position.set(1.8,0,0);hud();callout('ROUND '+game.round+' · FIGHT!');},1600);}
function animateFighter(model,now,dt,walking){const u=model.userData;u.step+=dt*(walking?9:2);u.arms.forEach((a,i)=>{a.rotation.set(0,0,0);});u.legs.forEach((l,i)=>{l.rotation.set(0,0,0);});model.position.y=0;model.rotation.z=0;u.torso.rotation.set(0,0,0);if(now<u.downUntil){model.position.y=-.45;model.rotation.z=model===playerModel?-.95:.95;u.torso.rotation.x=.35;return;}if(now<u.hitUntil){model.position.x+=(model===playerModel?-.014:.014);model.rotation.z=model===playerModel?-.2:.2;u.torso.rotation.x=-.22;return;}if(u.attack&&now<u.attack.until){const p=(now-u.attack.started)/(u.attack.until-u.attack.started);if(u.attack.type==='punch'){u.arms[model===playerModel?1:0].rotation.z=(model===playerModel?-1:1)*Math.sin(Math.min(1,p*2.3))*1.45;u.torso.rotation.y=(model===playerModel?.16:-.16);}else if(u.attack.type==='kick'){u.legs[model===playerModel?1:0].rotation.z=(model===playerModel?1:-1)*Math.sin(Math.min(1,p*2))*1.25;u.torso.rotation.x=-.12;}return;}else u.attack=null;
 if(u.block){u.arms[0].rotation.z=.65;u.arms[1].rotation.z=-.65;return;}if(walking){u.legs[0].rotation.z=Math.sin(u.step)*.42;u.legs[1].rotation.z=-Math.sin(u.step)*.42;u.arms[0].rotation.z=-Math.sin(u.step)*.25;u.arms[1].rotation.z=Math.sin(u.step)*.25;model.position.y=Math.abs(Math.sin(u.step*2))*.035;}else{u.arms[0].rotation.z=-.08;u.arms[1].rotation.z=.08;}}
function loop(){if(!renderer||!game)return;raf=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05),now=performance.now();if(!paused&&!game.over){game.time-=dt;if(game.time<=0)roundWin(game.ph>=game.ch?'p':'c');
 const move=(keys.ArrowLeft||keys.KeyA?-1:0)+(keys.ArrowRight||keys.KeyD?1:0);game.px=Math.max(-3.8,Math.min(3.8,game.px+move*dt*3.1));
 const d=game.cx-game.px,abs=Math.abs(d);playerModel.rotation.y=d>0?.16:-.16;cpuModel.rotation.y=d<0?-.16:.16;
 // CPU advances into striking range, retreats after pressure, blocks and chooses punches/kicks.
 const cpu=cpuModel.userData;if(now>game.lastCpuMove){game.lastCpuMove=now+220+Math.random()*220;const r=Math.random();if(abs<1.35&&r<.24){cpu.block=true;cpu.blockUntil=now+450+Math.random()*350;}else if(r<.12&&abs<1.7){game.cx+=Math.sign(d)*.45;}else cpu.block=false;}
 if(abs>1.35){game.cx-=Math.sign(d)*Math.min(abs-1.25,dt*1.65);}else if(abs<.9&&Math.random()<.02){game.cx+=Math.sign(d)*dt*.8;}
 game.cx=Math.max(-3.8,Math.min(3.8,game.cx));if(cpu.blockUntil&&now>cpu.blockUntil)cpu.block=false;
 if(game.cs>=100&&abs<3.1&&!game.specialBusy&&Math.random()<.004){special('c');}else if(abs<1.95&&now-game.lastCpu>700+Math.random()*350&&!game.specialBusy){game.lastCpu=now;triggerAttack('c',Math.random()<.48?'kick':'punch');}
 game.cs=Math.min(100,game.cs+dt*.8);game.ps=Math.min(100,game.ps+dt*.5);
 playerModel.position.x=game.px;cpuModel.position.x=game.cx;
 animateFighter(playerModel,now,dt,!!move);animateFighter(cpuModel,now,dt,Math.abs(game.cx-(game._prevCx??game.cx))>.002);game._prevCx=game.cx;
 if(now-lastHud>100){hud();lastHud=now;}}
 renderer.render(scene,camera);}
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyJ')action('punch');if(e.code==='KeyK')action('kick');if(e.code==='KeyL')action('special');if(e.code==='KeyI'||e.code==='KeyS')action('block');if(e.code==='Escape'&&!paused)pause();});window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyI'||e.code==='KeyS')playerModel&&(playerModel.userData.block=false);});
document.querySelectorAll('[data-action]').forEach(b=>{const a=b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();if(a==='left')keys.ArrowLeft=true;else if(a==='right')keys.ArrowRight=true;else action(a);});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{if(a==='left')keys.ArrowLeft=false;if(a==='right')keys.ArrowRight=false;if(a==='block'&&playerModel)playerModel.userData.block=false;}));});
