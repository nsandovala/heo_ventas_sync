(function(){
  const btnStart = document.getElementById('btnStart');
  const eggWrap  = document.getElementById('eggWrap');
  const canvas   = document.getElementById('tbbGame');

  // START → Pedidos
  btnStart && btnStart.addEventListener('click', () => { window.location.href = "/pedido"; });

  // Mostrar huevo aleatorio
  function appearEgg(){
    if (!eggWrap || !canvas) return;
    if (!eggWrap.classList.contains('hide')) return;
    if (Math.random() < 0.65){
      eggWrap.classList.remove('hide');
      eggWrap.setAttribute('aria-hidden','false');
      initGame(canvas);
    }
  }
  setTimeout(appearEgg, 2200 + Math.random()*1800);
  setInterval(appearEgg, 50000 + Math.random()*30000);

  // Ocultar con doble tap o long-press (móvil)
  eggWrap && eggWrap.addEventListener('dblclick', hideEgg);
  if (eggWrap){
    let timer; eggWrap.addEventListener('touchstart', ()=> timer=setTimeout(hideEgg, 600));
    eggWrap.addEventListener('touchend', ()=> clearTimeout(timer));
  }
  function hideEgg(){ stopGame(); eggWrap.classList.add('hide'); eggWrap.setAttribute('aria-hidden','true'); }

  /* ------------------- GAME ------------------- */
  let raf=null, ctx, W, H, t, playing=false, burger, obstacles=[], score, gravity, jumpV, groundY;
  let boundInput = null;

  // Canvas responsivo manteniendo pixel-art
  function sizeCanvas(cv){
    const targetW = Math.min(640, cv.parentElement.clientWidth - 24);
    const targetH = Math.round(targetW / 3.2); // aspect 3.2:1
    cv.width  = targetW;
    cv.height = targetH;
  }

  function initGame(cv){
    sizeCanvas(cv);
    ctx = cv.getContext('2d');
    W = cv.width; H = cv.height;
    groundY = H - 24;

    // FÍSICA MÁS LENTA Y SUAVE
    gravity = 0.45;         // antes 0.65
    jumpV   = -8.8;         // salto menos brusco
    t=0; score=0; obstacles=[]; playing=false;
    burger = {x: Math.round(W*0.12), y: groundY-20, vy:0, s:20, onGround:true};

    drawIntro();

    boundInput = handleInput.bind(null);
    cv.addEventListener('pointerdown', boundInput);
    window.addEventListener('resize', onResize);
  }

  function onResize(){
    if(!canvas) return;
    // resample tamaño pero conserva estado básico
    const oldH = H;
    sizeCanvas(canvas);
    W = canvas.width; H = canvas.height; groundY = H - 24;
    // recoloca al “suelo”
    burger.y = Math.min(burger.y, groundY - burger.s);
  }

  function handleInput(){
    if(!playing){ playing=true; loop(); return; }
    if(burger.onGround){ burger.vy = jumpV; burger.onGround = false; }
  }

  function spawnObstacle(){
    // Menos frecuencia y velocidades más bajas
    const high = Math.random() < 0.35;
    const h = high ? 46 : 22;
    const y = high ? groundY - 60 : groundY - h;
    obstacles.push({x: W + 10, y, w: high ? 16 : 26, h});
  }

  function loop(){ raf = requestAnimationFrame(loop); update(); render(); }
  function stopGame(){
    if (raf !== null) cancelAnimationFrame(raf);
    raf=null; playing=false;
    if (canvas && boundInput) canvas.removeEventListener('pointerdown', boundInput);
    window.removeEventListener('resize', onResize);
    boundInput=null;
  }

  function update(){
    t++;
    // Spawnea cada ~90 frames (lento) con aleatorio
    if (t % 90 === 0 && Math.random() < 0.9) spawnObstacle();

    // Física
    burger.vy += gravity;
    burger.y  += burger.vy;
    if (burger.y >= groundY - burger.s){ burger.y = groundY - burger.s; burger.vy = 0; burger.onGround = true; }

    // Obstáculos más lentos, aceleran levemente con score
    const base = 2.8, accel = Math.min(3.5, score/240);
    obstacles.forEach(o => o.x -= base + accel);
    if (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // Colisiones AABB
    for (const o of obstacles){
      if (burger.x < o.x + o.w && burger.x + burger.s > o.x &&
          burger.y < o.y + o.h && burger.y + burger.s > o.y){
        drawGameOver(); stopGame(); return;
      }
    }
    score++;
  }

  function render(){
    // fondo
    ctx.fillStyle = '#092414'; ctx.fillRect(0,0,W,H);
    // piso
    ctx.fillStyle = '#0e3b23'; ctx.fillRect(0, groundY, W, H-groundY);

    // burger
    ctx.fillStyle = '#f3d97a'; ctx.fillRect(burger.x, burger.y, burger.s, burger.s);
    ctx.fillStyle = '#00000055'; ctx.fillRect(burger.x, burger.y+burger.s-4, burger.s, 4);

    // obstáculos
    ctx.fillStyle = '#27a45c';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    // score
    ctx.fillStyle = '#bdf8cf'; ctx.font = '16px monospace';
    ctx.fillText('SCORE ' + score, 10, 18);
  }

  function drawIntro(){
    ctx.fillStyle='#0a2315'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#bdf8cf'; ctx.font='20px monospace';
    ctx.fillText('HAMBURGUESA RUNNER', Math.round(W*0.28), 80);
    ctx.font='14px monospace';
    ctx.fillText('Toca para saltar. Doble toque o mantener para ocultar.', Math.round(W*0.08), 110);
  }

  function drawGameOver(){
    ctx.fillStyle='#000000aa'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffdf88'; ctx.font='22px monospace';
    ctx.fillText('GAME OVER', Math.round(W*0.38), 90);
    ctx.font='14px monospace';
    ctx.fillText('Puntaje: ' + score + ' — toca para reintentar', Math.round(W*0.22), 120);
    canvas.addEventListener('pointerdown', ()=>{ initGame(canvas); playing=true; loop(); }, {once:true});
  }

  // Pausa si la pestaña se oculta
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stopGame(); });

})();

