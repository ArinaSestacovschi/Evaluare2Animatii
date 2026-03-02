// Joc Canvas - folosind obiecte, animații, setTimeout și controale FPS
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const realFpsEl = document.getElementById('realFps');
  const fpsRange = document.getElementById('fpsRange');
  const targetFpsEl = document.getElementById('targetFps');
  const pauseBtn = document.getElementById('pauseBtn');

  let width = canvas.width;
  let height = canvas.height;

  // Game state
  let mouse = {x: width/2, y: height/2, down:false};
  let player;
  let enemies = [];
  let shots = [];
  let running = true;

  // FPS control
  let targetFps = Number(fpsRange.value);
  targetFpsEl.textContent = targetFps;
  fpsRange.addEventListener('input', ()=>{targetFps = Number(fpsRange.value); targetFpsEl.textContent = targetFps;});

  pauseBtn.addEventListener('click', ()=>{running = !running; pauseBtn.textContent = running? 'Pauză':'Continuă'; if(running) loop();});

  // Load sprite (SVG)
  const shipImg = new Image();
  shipImg.src = 'assets/ship.svg';

  // Basic classes
  class GameObject{
    constructor(x,y,w,h){this.x=x;this.y=y;this.w=w;this.h=h}
    update(dt){}
    draw(ctx){}
  }

  class Player extends GameObject{
    constructor(x,y){super(x,y,36,36);this.cooldown=0}
    update(dt){
      // Smooth follow mouse
      this.x += (mouse.x - this.x) * Math.min(1, 6 * dt);
      this.y += (mouse.y - this.y) * Math.min(1, 6 * dt);
      this.cooldown = Math.max(0, this.cooldown - dt);
      if(mouse.down && this.cooldown===0){this.shoot(); this.cooldown = 0.18}
    }
    shoot(){ shots.push(new Shot(this.x, this.y - 10, 0, -300)); }
    draw(ctx){
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.drawImage(shipImg, -18, -18, 36, 36);
      ctx.restore();
    }
  }

  class Enemy extends GameObject{
    constructor(x,y,vx,vy){super(x,y,28,28);this.vx=vx;this.vy=vy}
    update(dt){this.x += this.vx*dt; this.y += this.vy*dt;}
    draw(ctx){ctx.save();ctx.translate(this.x, this.y);ctx.fillStyle='#ff6b6b';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(12,10);ctx.lineTo(-12,10);ctx.closePath();ctx.fill();ctx.restore();}
  }

  class Shot extends GameObject{
    constructor(x,y,vx,vy){super(x,y,6,12);this.vx=vx;this.vy=vy}
    update(dt){this.x += this.vx*dt; this.y += this.vy*dt}
    draw(ctx){ctx.save();ctx.fillStyle='#ffd85c';ctx.fillRect(this.x-3,this.y-6,6,12);ctx.restore();}
  }

  function spawnEnemy(){
    const x = Math.random()*(width-80)+40;
    const y = -20;
    const speed = 60 + Math.random()*120;
    enemies.push(new Enemy(x,y,0,speed));
    // Folosim setTimeout recursiv pentru a demonstra intervalul de timp
    const next = 600 + Math.random()*1200;
    setTimeout(spawnEnemy, next);
  }

  function init(){
    player = new Player(width/2, height - 80);
    // atac initial
    setTimeout(spawnEnemy, 800);
    // start loop
    loop();
  }

  // Basic collision
  function rectColl(a,b){ return Math.abs(a.x-b.x) < (a.w+b.w)/2 && Math.abs(a.y-b.y) < (a.h+b.h)/2 }

  // Frame timing using setTimeout to control FPS
  let last = performance.now();
  let frames = 0; let fpsTimer = 0;
  function loop(){
    if(!running) return;
    const now = performance.now();
    const dt = Math.min(0.05,(now - last)/1000);
    last = now;

    update(dt);
    render();

    // FPS display
    frames++; fpsTimer += dt;
    if(fpsTimer >= 1){ realFpsEl.textContent = frames; frames = 0; fpsTimer = 0 }

    // schedule next frame respecting targetFps using setTimeout
    const delay = Math.max(0, Math.round(1000/targetFps));
    setTimeout(loop, delay);
  }

  function update(dt){
    player.update(dt);
    enemies.forEach(e=>e.update(dt));
    shots.forEach(s=>s.update(dt));

    // collisions: shots -> enemies
    for(let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];
      for(let j=shots.length-1;j>=0;j--){
        if(rectColl(e, shots[j])){ enemies.splice(i,1); shots.splice(j,1); break }
      }
    }

    // remove offscreen
    enemies = enemies.filter(e=>e.y < height + 60);
    shots = shots.filter(s=>s.y > -20 && s.y < height+20);
  }

  function render(){
    ctx.clearRect(0,0,width,height);
    // background stars using simple effect
    drawStars();
    enemies.forEach(e=>e.draw(ctx));
    shots.forEach(s=>s.draw(ctx));
    player.draw(ctx);

    // HUD overlay on canvas: draw crosshair
    ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(0,mouse.y); ctx.lineTo(width,mouse.y); ctx.moveTo(mouse.x,0); ctx.lineTo(mouse.x,height); ctx.stroke(); ctx.restore();
  }

  // small starfield drawn each frame (cheap)
  const starGrid = [];
  for(let i=0;i<60;i++) starGrid.push({x:Math.random()*900,y:Math.random()*600,r:Math.random()*1.8});
  function drawStars(){ ctx.save(); ctx.fillStyle='rgba(255,255,255,0.06)'; starGrid.forEach(s=>ctx.fillRect(s.x, s.y, s.r, s.r)); ctx.restore(); }

  // Input
  canvas.addEventListener('mousemove', e=>{
    const rect = canvas.getBoundingClientRect(); mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
  });
  window.addEventListener('resize', ()=>{ /* optional resize handling */ });
  canvas.addEventListener('mousedown', ()=>{ mouse.down = true });
  window.addEventListener('mouseup', ()=>{ mouse.down = false });

  // Initialize when sprite loaded (so drawImage works)
  shipImg.onload = ()=>{ init(); };

  // Expose debug for console
  window._game = { start: ()=>{running=true; loop()}, pause: ()=>{running=false} };

})();
