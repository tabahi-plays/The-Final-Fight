import {fighters} from './characters.js';
const $=id=>document.getElementById(id),screens=['intro','select','arenas','fight','result'];let chosen=0,arena='ground',g=null,keys={},touch={};
function show(id){screens.forEach(x=>$(x).classList.toggle('hidden',x!==id));}
$('start').onclick=()=>show('select');
document.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{chosen=+b.dataset.player;show('arenas');});
$('back').onclick=()=>show('select');
document.querySelectorAll('[data-arena]').forEach(b=>b.onclick=()=>{arena=b.dataset.arena;start();});
$('change-arena').onclick=()=>{g=null;show('arenas');};
$('newfight').onclick=()=>{g=null;show('select');};
$('rematch').onclick=()=>start();
function hud(){$('pname').textContent=g.pname;$('cname').textContent=g.cname+' · CPU';$('php').style.width=g.ph+'%';$('chp').style.width=g.ch+'%';$('pstat').textContent=Math.ceil(g.ph)+' HP · WINS '+g.pw;$('cstat').textContent=Math.ceil(g.ch)+' HP · WINS '+g.cw;$('round').textContent='ROUND '+g.round;$('time').textContent=Math.ceil(g.time);}
function say(t){$('message').textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>$('message').textContent='',1000);}
function start(){show('fight');g={pname:fighters[chosen].name,cname:fighters[1-chosen].name,ph:100,ch:100,pw:0,cw:0,round:1,time:60,over:false,last:0,px:20,cx:75};$('stage').classList.toggle('school-bg',arena==='school');$('stage-title').textContent=arena==='school'?'STEPPING STONE SCHOOL · OUTSIDE':'RISHRA FOOTBALL GROUND';$('player').textContent=chosen===0?'🥊':'🍋';$('cpu').textContent=chosen===0?'🍋':'🥊';$('player').style.left='20%';$('cpu').style.right='20%';hud();say('ROUND 1 · FIGHT!');g.lastTick=performance.now();requestAnimationFrame(loop);}
function attack(who,type){if(!g||g.over)return;let player=who==='p',target=player?'ch':'ph',distance=Math.abs(g.px-g.cx),damage=type==='special'?30:type==='kick'?12:8;if(performance.now()-(player?g.pcd||0:g.ccd||0)<(type==='special'?4000:500))return;if(player)g.pcd=performance.now();else g.ccd=performance.now();if(distance<(type==='special'?55:22)){g[target]=Math.max(0,g[target]-damage);say(type==='special'?(fighters[chosen].special.toUpperCase()):'-'+damage+' HP');if(g[target]===0)end(player?'p':'c');hud();}}
function end(w){if(g.over)return;g.over=true;if(w==='p')g.pw++;else g.cw++;say((w==='p'?g.pname:g.cname)+' WINS ROUND '+g.round);setTimeout(()=>{if(g.pw===2||g.cw===2){show('result');$('winner').textContent=(g.pw>g.cw?g.pname:g.cname)+' WINS!';return;}g.round++;g.ph=g.ch=100;g.time=60;g.px=20;g.cx=75;g.over=false;hud();say('ROUND '+g.round+' · FIGHT!');},1400);}
function action(a){if(!g||g.over)return;if(a==='punch'||a==='kick'||a==='special')attack('p',a);}
function loop(now){if(!g)return;let dt=Math.min((now-g.lastTick)/1000,.04);g.lastTick=now;if(!g.over){let d=(keys.KeyD||keys.ArrowRight||touch.right?1:0)-(keys.KeyA||keys.ArrowLeft||touch.left?1:0);g.px=Math.max(5,Math.min(45,g.px+d*dt*35));if(g.cx-g.px>19)g.cx-=dt*16;if(g.cx-g.px<23&&now-g.cpuLast>1050){g.cpuLast=now;attack('c',Math.random()<.25?'kick':'punch');}g.time-=dt;if(g.time<=0)end(g.ph>=g.ch?'p':'c');$('player').style.left=g.px+'%';$('cpu').style.right=(100-g.cx)+'%';hud();}requestAnimationFrame(loop);}
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyJ')action('punch');if(e.code==='KeyK')action('kick');if(e.code==='KeyL')action('special');if(e.code==='Space'&&g)g.ph=Math.min(100,g.ph+0);});
window.addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('[data-act]').forEach(b=>{let a=b.dataset.act;b.onpointerdown=e=>{e.preventDefault();touch[a]=true;action(a);};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>touch[a]=false));});