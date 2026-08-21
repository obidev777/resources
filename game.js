(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const menu = document.getElementById('menu');
  const controls = document.getElementById('controls');
  const toast = document.getElementById('toast');
  const hpEls = [document.getElementById('p1hp'), document.getElementById('p2hp')];
  const chEls = [document.getElementById('p1ch'), document.getElementById('p2ch')];
  const timerEl = document.getElementById('timer');
  const keys = new Set();
  let W = 1280, H = 720, DPR = 1, running = false, paused = false, last = 0, shake = 0, finish = '';
  const floor = () => H * 0.78;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const state = { time: 99, input: { x: 0, y: 0, attack: 0, ranged: 0, dash: 0, skill: 0, ultimate: 0 }, particles: [], projectiles: [], hitFx: [] };

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', resize); resize();

  class Fighter {
    constructor(id, x, colors, ai = false) {
      Object.assign(this, { id, x, y: floor(), vx: 0, vy: 0, w: 54, h: 116, face: id ? -1 : 1, hp: 100, chakra: 45, ai, cd: {}, combo: 0, stun: 0, guard: 0, inv: 0, aura: 0, name: id ? 'KAI' : 'RYU', colors });
    }
    get box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    input(enemy, dt) {
      if (this.ai) {
        const dist = enemy.x - this.x; let x = Math.sign(dist), act = {};
        if (Math.abs(dist) < 82) { x = 0; act.attack = Math.random() < .045; }
        if (Math.abs(dist) > 330) act.dash = Math.random() < .02;
        if (Math.abs(dist) > 170 && Math.random() < .018) act.ranged = true;
        if (this.chakra > 35 && Math.abs(dist) < 260 && Math.random() < .014) act.skill = true;
        if (this.chakra > 78 && enemy.hp < 55 && Math.random() < .01) act.ultimate = true;
        if (this.y >= floor() && Math.random() < .006) this.vy = -760;
        return { x, y: 0, ...act };
      }
      return { ...state.input, attack: keys.has('KeyJ') || state.input.attack, ranged: keys.has('KeyK') || state.input.ranged, dash: keys.has('KeyL') || state.input.dash, skill: keys.has('KeyU') || state.input.skill, ultimate: keys.has('KeyI') || state.input.ultimate, x: (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0) || state.input.x, y: (keys.has('ArrowUp') || keys.has('KeyW') ? -1 : 0) || state.input.y };
    }
    update(dt, enemy) {
      for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt);
      this.stun = Math.max(0, this.stun - dt); this.inv = Math.max(0, this.inv - dt); this.aura = Math.max(0, this.aura - dt);
      this.chakra = clamp(this.chakra + dt * 7, 0, 100);
      const inp = this.input(enemy, dt); this.face = enemy.x > this.x ? 1 : -1;
      if (!this.stun) {
        this.vx += inp.x * 2400 * dt;
        if (inp.y < -.4 && this.y >= floor() - 2) this.vy = -860;
        if (inp.dash && !this.cd.dash && this.chakra >= 8) { this.vx = this.face * 920; this.inv = .22; this.cd.dash = .8; this.chakra -= 8; burst(this.x, this.y - 45, '#93c5fd', 18); }
        if (inp.attack && !this.cd.attack) this.melee(enemy);
        if (inp.ranged && !this.cd.ranged && this.chakra >= 7) this.throwStar();
        if (inp.skill && !this.cd.skill && this.chakra >= 28) this.skill(enemy);
        if (inp.ultimate && !this.cd.ultimate && this.chakra >= 75) this.ultimate(enemy);
      }
      this.vy += 1800 * dt; this.vx *= Math.pow(.001, dt);
      this.x = clamp(this.x + this.vx * dt, 60, W - 60); this.y += this.vy * dt;
      if (this.y > floor()) { this.y = floor(); this.vy = 0; }
    }
    melee(enemy) { this.cd.attack = .24; this.combo = (this.combo + 1) % 3; slash(this.x + this.face * 58, this.y - 70, this.face, this.colors.main); if (hit(this, enemy, 95, 92)) damage(enemy, 7 + this.combo * 2, this.face * (360 + this.combo * 80), -230); }
    throwStar() { this.cd.ranged = .55; this.chakra -= 7; state.projectiles.push({ owner: this, x: this.x + this.face * 52, y: this.y - 72, vx: this.face * 760, r: 13, life: 1.4, dmg: 8, color: '#e5e7eb', spin: 0 }); }
    skill(enemy) { this.cd.skill = 2.9; this.chakra -= 28; this.aura = .7; toastMsg(this.name + ' RAIJIN BURST'); for (let i = 0; i < 4; i++) setTimeout(() => { if (running) { slash(enemy.x + rnd(-35,35), enemy.y - rnd(35,105), this.face, '#67e8f9'); if (hit(this, enemy, 300, 140)) damage(enemy, 5, this.face * 260, -120); } }, i * 120); }
    ultimate(enemy) { this.cd.ultimate = 8; this.chakra -= 75; this.aura = 1.5; shake = 25; toastMsg(this.name + ' DRAGON STORM!'); for (let i = 0; i < 60; i++) state.particles.push({ x: this.x, y: this.y - 70, vx: rnd(-600,600), vy: rnd(-600,100), life: rnd(.4,1.2), color: i%2?'#f97316':'#fde047', s: rnd(2,7) }); setTimeout(() => { if (hit(this, enemy, 520, 220)) damage(enemy, 28, this.face * 720, -520); shake = 35; }, 420); }
  }
  const p1 = new Fighter(0, 260, { main: '#f97316', hair: '#facc15', dark: '#172554' });
  const p2 = new Fighter(1, 980, { main: '#7c3aed', hair: '#e0e7ff', dark: '#111827' }, true);
  function hit(a,b,range,height){return Math.abs(a.x-b.x)<range && Math.abs((a.y-65)-(b.y-65))<height && b.inv<=0;}
  function damage(t, amt, kx, ky){ t.hp=clamp(t.hp-amt,0,100); t.vx+=kx; t.vy+=ky; t.stun=.18; shake=Math.max(shake,10); burst(t.x,t.y-70,'#ef4444',16); if(t.hp<=0&&!finish){finish=(t.id?'RYU':'KAI')+' WINS'; toastMsg(finish+' - toca para reiniciar',999);} }
  function burst(x,y,color,n){for(let i=0;i<n;i++)state.particles.push({x,y,vx:rnd(-260,260),vy:rnd(-360,80),life:rnd(.25,.7),color,s:rnd(2,8)});}
  function slash(x,y,dir,color){state.hitFx.push({x,y,dir,life:.18,color}); burst(x,y,color,6);}
  function toastMsg(t,ms=1200){toast.textContent=t; clearTimeout(toast._t); if(ms<9000) toast._t=setTimeout(()=>toast.textContent='',ms);}
  function drawBg(t){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0f172a');g.addColorStop(.55,'#1e1b4b');g.addColorStop(1,'#111827');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#fde68a';ctx.beginPath();ctx.arc(W*.76,H*.18,50,0,7);ctx.fill(); for(let l=0;l<4;l++){ctx.fillStyle=`rgba(${35+l*25},${60+l*22},${95+l*16},${.45+l*.12})`;ctx.beginPath();ctx.moveTo(0,floor()-90-l*35);for(let x=0;x<=W+80;x+=90)ctx.lineTo(x,floor()-90-l*35-Math.sin(x*.01+t+l)*45-rnd(0,0));ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();}ctx.fillStyle='#1f2937';ctx.fillRect(0,floor(),W,H-floor());ctx.fillStyle='#16a34a';for(let x=0;x<W;x+=34)ctx.fillRect(x,floor()+Math.sin(x)*4,24,5);}
  function drawF(f){ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face,1); if(f.aura){ctx.globalAlpha=.35;ctx.strokeStyle=f.colors.main;ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,-62,48+Math.sin(performance.now()/60)*8,86,0,0,7);ctx.stroke();ctx.globalAlpha=1;}ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,6,46,12,0,0,7);ctx.fill();ctx.fillStyle=f.colors.dark;round(-21,-88,42,72,12);ctx.fill();ctx.fillStyle=f.colors.main;round(-28,-75,56,42,10);ctx.fill();ctx.fillStyle='#f3c7a6';round(-18,-128,36,38,15);ctx.fill();ctx.fillStyle=f.colors.hair;ctx.beginPath();ctx.moveTo(-25,-120);ctx.lineTo(-7,-154);ctx.lineTo(8,-128);ctx.lineTo(24,-145);ctx.lineTo(20,-112);ctx.fill();ctx.strokeStyle='#e5e7eb';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(14,-67);ctx.lineTo(48,-42);ctx.stroke();ctx.beginPath();ctx.moveTo(-14,-67);ctx.lineTo(-42,-42);ctx.stroke();ctx.beginPath();ctx.moveTo(13,-18);ctx.lineTo(28,0);ctx.moveTo(-13,-18);ctx.lineTo(-28,0);ctx.stroke();ctx.restore();}
  function round(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function update(dt){if(paused||finish)return; state.time-=dt;if(state.time<=0){finish=(p1.hp>=p2.hp?'RYU':'KAI')+' WINS';toastMsg(finish+' - toca para reiniciar',999);}p1.update(dt,p2);p2.update(dt,p1);for(const pr of state.projectiles){pr.x+=pr.vx*dt;pr.life-=dt;pr.spin+=dt*18;const e=pr.owner===p1?p2:p1;if(Math.hypot(pr.x-e.x,pr.y-(e.y-70))<45&&e.inv<=0){damage(e,pr.dmg,Math.sign(pr.vx)*300,-120);pr.life=0;}}state.projectiles=state.projectiles.filter(p=>p.life>0&&p.x>-80&&p.x<W+80);for(const arr of [state.particles,state.hitFx])for(const o of arr){o.x+=(o.vx||0)*dt;o.y+=(o.vy||0)*dt;if(o.vy!==undefined)o.vy+=900*dt;o.life-=dt;}state.particles=state.particles.filter(o=>o.life>0);state.hitFx=state.hitFx.filter(o=>o.life>0);shake*=Math.pow(.02,dt);hpEls[0].style.width=p1.hp+'%';hpEls[1].style.width=p2.hp+'%';chEls[0].style.width=p1.chakra+'%';chEls[1].style.width=p2.chakra+'%';timerEl.textContent=Math.max(0,Math.ceil(state.time));}
  function render(t){ctx.save();if(shake>1)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));drawBg(t/1000);for(const pr of state.projectiles){ctx.save();ctx.translate(pr.x,pr.y);ctx.rotate(pr.spin);ctx.fillStyle=pr.color;for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillRect(0,-3,24,6);}ctx.restore();}drawF(p1);drawF(p2);for(const s of state.hitFx){ctx.save();ctx.globalAlpha=s.life/.18;ctx.translate(s.x,s.y);ctx.scale(s.dir,1);ctx.strokeStyle=s.color;ctx.lineWidth=10;ctx.beginPath();ctx.arc(0,0,48,-.9,.9);ctx.stroke();ctx.restore();}for(const p of state.particles){ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.s,p.s);}ctx.globalAlpha=1;ctx.restore();}
  function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;if(running){update(dt);render(t);}requestAnimationFrame(loop);}requestAnimationFrame(loop);
  function start(){running=true;finish='';Object.assign(p1,new Fighter(0,W*.22,{main:'#f97316',hair:'#facc15',dark:'#172554'}));Object.assign(p2,new Fighter(1,W*.78,{main:'#7c3aed',hair:'#e0e7ff',dark:'#111827'},true));state.time=99;menu.style.display='none';controls.classList.add('playing');document.documentElement.requestFullscreen?.().catch(()=>{});toastMsg('FIGHT!');}
  document.getElementById('playBtn').onclick=start;document.getElementById('howBtn').onclick=()=>document.getElementById('how').hidden=!document.getElementById('how').hidden;addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyP')paused=!paused;});addEventListener('keyup',e=>keys.delete(e.code));canvas.addEventListener('pointerdown',()=>{if(finish)start();});
  const stick=document.getElementById('stick'), knob=stick.querySelector('i');let sid=null;stick.addEventListener('pointerdown',e=>{sid=e.pointerId;stick.setPointerCapture(sid);moveStick(e);});stick.addEventListener('pointermove',e=>{if(e.pointerId===sid)moveStick(e);});stick.addEventListener('pointerup',()=>{sid=null;state.input.x=state.input.y=0;knob.style.transform='';});function moveStick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=clamp(e.clientX-cx,-48,48),dy=clamp(e.clientY-cy,-48,48);state.input.x=Math.abs(dx)<12?0:dx/48;state.input.y=dy/48;knob.style.transform=`translate(${dx}px,${dy}px)`;}
  document.querySelectorAll('.buttons button').forEach(b=>{const a=b.dataset.act;b.addEventListener('pointerdown',e=>{e.preventDefault();state.input[a]=1;b.setPointerCapture(e.pointerId);});b.addEventListener('pointerup',()=>state.input[a]=0);b.addEventListener('pointercancel',()=>state.input[a]=0);});
})();
