(function(){
  const btnStart = document.getElementById('btnStart');
  const eggWrap  = document.getElementById('eggWrap');
  const canvas   = document.getElementById('tbbGame');

  if (btnStart) btnStart.addEventListener('click', () => {
    window.location.href = "/pedido";
  });

  // Easter egg: aparece ocasionalmente sin botón
  const appearEgg = () => {
    if (!eggWrap || !canvas) return;
    if (!eggWrap.classList.contains('hide')) return;
    if (Math.random() < 0.65) {
      eggWrap.classList.remove('hide');
      eggWrap.setAttribute('aria-hidden','false');
      initGame(canvas);
    }
  };
  setTimeout(appearEgg, 3000 + Math.random()*4000);
  setInterval(appearEgg, 45000 + Math.random()*45000);
  eggWrap && eggWrap.addEventListener('dblclick', () => {
    stopGame(); eggWrap.classList.add('hide'); eggWrap.setAttribute('aria-hidden','true');
  });

  /* --- Minijuego dino-burger --- */
  let raf=null, ctx, W, H, t, playing=false, burger, obstacles=[], score, gravity, jumpV, groundY;

  function initGame(cv){
    ctx=cv.getContext('2d'); W=cv.width; H=cv.height;
    groundY=H-24; gravity=0.65; jumpV=-10; t=0; score=0; obstacles=[]; playing=false;
    burger={x:60,y:groundY-20,vy:0,s:20,onGround:true};
    drawIntro();
    cv.addEventListener('pointerdown', handleInput, {once:false});
  }
  function handleInput(){ if(!playing){ playing=true; loop(); return; }
    if(burger.onGround){ burger.vy=jumpV; burger.onGround=false; } }
  function spawnObstacle(){
    const high=Math.random()<0.4, h=high?48:24, y=high?groundY-60:groundY-h;
    obstacles.push({x:W+10,y,w:high?18:26,h});
  }
  function loop(){ raf=requestAnimationFrame(loop); update(); render(); }
  function stopGame(){ cancelAnimationFrame(raf); raf=null; playing=false; }
  function update(){
    t++; if(t%70===0) spawnObstacle();
    burger.vy+=0.65; burger.y+=burger.vy;
    if(burger.y>=groundY-burger.s){ burger.y=groundY-burger.s; burger.vy=0; burger.onGround=true; }
    obstacles.forEach(o=>o.x-=4+Math.min(6, score/150));
    if(obstacles.length&&obstacles[0].x+obstacles[0].w<0) obstacles.shift();
    for(const o of obstacles){
      if(burger.x<o.x+o.w && burger.x+burger.s>o.x && burger.y<o.y+o.h && burger.y+burger.s>o.y){
        drawGameOver(); stopGame(); return;
      }
    }
    score++;
  }
  function render(){
    ctx.fillStyle='#092414'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#0e3b23'; ctx.fillRect(0, groundY, W, H-groundY);
    ctx.fillStyle='#f3d97a'; ctx.fillRect(burger.x, burger.y, burger.s, burger.s);
    ctx.fillStyle='#27a45c'; obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.w,o.h));
    ctx.fillStyle='#bdf8cf'; ctx.font='16px monospace'; ctx.fillText('SCORE '+score,10,18);
  }
  function drawIntro(){
    ctx.fillStyle='#0a2315'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#bdf8cf'; ctx.font='20px monospace'; ctx.fillText('HAMBURGUESA RUNNER',160,80);
    ctx.font='14px monospace';
    ctx.fillText('Toca para saltar. Doble toque para ocultar.',150,110);
  }
  function drawGameOver(){
    ctx.fillStyle='#000000aa'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffdf88'; ctx.font='22px monospace'; ctx.fillText('GAME OVER',250,90);
    ctx.font='14px monospace'; ctx.fillText('Puntaje: '+score+' — toca para reintentar',170,120);
    canvas.addEventListener('pointerdown', ()=>{ initGame(canvas); playing=true; loop(); }, {once:true});
  }
})();
