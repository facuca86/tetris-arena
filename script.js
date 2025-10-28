(() => {
  const MAX_PISTAS = 10;
  const MAX_FONDOS = 10;
  const COLS=10, ROWS=20, CELL=38;
  const board=document.getElementById('board');
  const ctx=board.getContext('2d');
  const nextCanvas=document.getElementById('next');
  const nctx=nextCanvas.getContext('2d');
  const scoreEl=document.getElementById('score');
  const linesEl=document.getElementById('lines');
  const levelEl=document.getElementById('level');
  const speedEl=document.getElementById('speed');
  const timeEl=document.getElementById('time');
  const hud=document.getElementById('hud');

  // listas dinámicas (hasta 10)
  const pistas = Array.from({length: MAX_PISTAS}, (_,i)=>`assets/music/${i+1}.mp3`);
  const fondos = Array.from({length: MAX_FONDOS}, (_,i)=>`assets/img/${i+1}.jpeg`);

  let pistaIndex = 0; // empezamos en music/1.mp3 al cargar
  let fondoIndex = -1; // se elegirá al cargar

  // reproductor
  const player = document.createElement('audio'); player.loop = false; player.volume = 0.6; document.body.appendChild(player);

  function updateHUD(){ const t = pistaIndex+1; const f = (fondoIndex===-1)?'--':fondoIndex+1; hud.textContent = `🎵 Track ${t} | Fondo ${f}`; }

  // Preload de fondo seguro: intenta hasta encontrar una imagen válida
  function setRandomBackgroundDifferent(){
    const start = Math.floor(Math.random()*fondos.length);
    for(let i=0;i<fondos.length;i++){
      const idx = (start + i) % fondos.length;
      if(idx===fondoIndex) continue; // queremos distinto
      // preload
      const img = new Image();
      img.onload = ()=>{ document.documentElement.style.setProperty('--fondo', `url('${fondos[idx]}')`); fondoIndex = idx; updateHUD(); };
      img.onerror = ()=>{/* ignora y prueba la siguiente */};
      img.src = fondos[idx];
      // Si carga se ejecutará onload y salimos del bucle natural (but we still tried); return to avoid rapid overrides
      return;
    }
    // fallback sólido en caso de que ninguna exista
    document.documentElement.style.setProperty('--fondo', `linear-gradient(135deg,#10202b,#203a5a)`);
    fondoIndex = -1; updateHUD();
  }

  // Al cargar la página: fondo aleatorio y reproducir music/1.mp3 (si el navegador lo permite)
  (function initMediaOnLoad(){
    // establecer primer fondo aleatorio
    const init = Math.floor(Math.random()*fondos.length);
    const img = new Image();
    img.onload = ()=>{ document.documentElement.style.setProperty('--fondo', `url('${fondos[init]}')`); fondoIndex = init; updateHUD(); };
    img.onerror = ()=>{ setRandomBackgroundDifferent(); };
    img.src = fondos[init];

    // intentar reproducir la primera pista (music/1.mp3)
    pistaIndex = 0;
    player.src = pistas[pistaIndex];
    player.play().catch(()=>{ /* autoplay puede bloquearse, seguirá silencioso hasta Start */ });
    updateHUD();
  })();

  // cuando termina una canción: avanzamos secuencialmente y cambiamos fondo instantáneamente
  player.addEventListener('ended', ()=>{
    pistaIndex = (pistaIndex + 1) % pistas.length;
    // intentar reproducir siguiente pista; si falla, avanzar silenciosamente
    player.src = pistas[pistaIndex];
    player.play().catch(()=>{ /* ignora */ });
    // cambiar fondo instantáneamente (aleatorio distinto)
    setRandomBackgroundDifferent();
    updateHUD();
    console.log('[Music] Reproduciendo:', pistas[pistaIndex]); console.log('[Background] Fondo:', fondoIndex+1);
  });

  function playRandomTrackOnStart(){ pistaIndex = Math.floor(Math.random()*pistas.length); player.src = pistas[pistaIndex]; player.play().catch(()=>{}); updateHUD(); }
  function nextTrack(){ pistaIndex = (pistaIndex + 1) % pistas.length; player.src = pistas[pistaIndex]; player.play().catch(()=>{}); setRandomBackgroundDifferent(); updateHUD(); console.log('[Music] Cambió a:', pistas[pistaIndex]); }

  // Prevención de errores al cambiar pista: si no se reproduce, no rompe el juego

  // ====== LÓGICA DEL JUEGO (igual que antes) ======
  const COLORS={I:'#00fff0',J:'#00a8ff',L:'#ff6a00',O:'#fffb37',S:'#00ff6a',T:'#d500f9',Z:'#ff1744'};
  const SHAPES={I:[[1,1,1,1]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0]],T:[[0,1,0],[1,1,1]],Z:[[1,1,0],[0,1,1]]};
  const KEYS={LEFT:37,UP:38,RIGHT:39,DOWN:40,SPACE:32,P:80};

  let grid, current, next, score, lines, level, dropInterval, lastTime=0, acc=0, running=false, paused=false, startMs=0;

  function rotate(m){const h=m.length,w=m[0].length;return Array.from({length:w},(_,x)=>Array.from({length:h},(_,y)=>m[h-1-y][x]));}
  function collide(g,p){for(let y=0;y<p.shape.length;y++)for(let x=0;x<p.shape[0].length;x++)if(p.shape[y][x]){const ny=p.y+y,nx=p.x+x;if(ny<0)continue;if(nx<0||nx>=COLS||ny>=ROWS||g[ny][nx])return true;}return false;}
  function merge(g,p){for(let y=0;y<p.shape.length;y++)for(let x=0;x<p.shape[0].length;x++)if(p.shape[y][x]){const ny=p.y+y,nx=p.x+x;if(ny>=0)g[ny][nx]=p.type;}}
  function spawn(){const types=Object.keys(SHAPES);const t=types[(Math.random()*types.length)|0];return{type:t,shape:SHAPES[t].map(r=>r.slice()),x:(COLS>>1)-1,y:-1};}
  function updateSpeed(){dropInterval=Math.max(700-(level-1)*70,80);speedEl.textContent=dropInterval;}
  function formatTime(sec){const m=Math.floor(sec/60),s=Math.floor(sec%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}

  // Estética 8-bit para celdas
  function hexToRgb(hex){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');const num=parseInt(hex,16);return {r:(num>>16)&255,g:(num>>8)&255,b:num&255};}
  function rgbToHex(r,g,b){const h=(n)=>n.toString(16).padStart(2,'0');return `#${h(r)}${h(g)}${h(b)}`;}
  function shade(hex,p){const {r,g,b}=hexToRgb(hex);const mix=(c)=>Math.min(255,Math.max(0,Math.round(c+(p*255))));return rgbToHex(mix(r-255*(p<0)),mix(g-255*(p<0)),mix(b-255*(p<0)));}
  function draw8bitCell(context, px, py, size, hex){
    const base=hex; const light=shade(base, 0.25); const dark=shade(base, -0.35); const darker=shade(base, -0.55);
    context.fillStyle=base; context.fillRect(px,py,size,size);
    context.fillStyle='#000'; context.fillRect(px,py,size,2); context.fillRect(px,py,2,size); context.fillRect(px,py+size-2,size,2); context.fillRect(px+size-2,py,2,size);
    context.fillStyle=light; context.fillRect(px+2,py+2,size-4,3); context.fillRect(px+2,py+2,3,size-4);
    context.fillStyle=dark; context.fillRect(px+2,py+size-5,size-4,3); context.fillRect(px+size-5,py+2,3,size-4);
    const step=Math.max(3,Math.floor(size/6)); for(let y=4;y<size-4;y+=step){ for(let x=4;x<size-4;x+=step){ context.fillStyle = ((x+y)/step)%2?dark:darker; context.fillRect(px+x,py+y,step-1,step-1); }}
    context.fillStyle=light; context.fillRect(px+4,py+4,Math.max(2,Math.floor(size/6)),Math.max(2,Math.floor(size/6)));
  }
  function drawCell(gx,gy,t){ const x=gx*CELL,y=gy*CELL; draw8bitCell(ctx,x,y,CELL, COLORS[t]||'#9cf'); }
  function drawGridBg(){ctx.save();ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;for(let x=1;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL+0.5,0);ctx.lineTo(x*CELL+0.5,ROWS*CELL);ctx.stroke();}for(let y=1;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL+0.5);ctx.lineTo(COLS*CELL,y*CELL+0.5);ctx.stroke();}ctx.restore();}
  function drawNext(){ nctx.clearRect(0,0,nextCanvas.width,nextCanvas.height); const c=14; for(let y=0;y<next.shape.length;y++){ for(let x=0;x<next.shape[0].length;x++){ if(next.shape[y][x]) draw8bitCell(nctx, 30+x*c, 30+y*c, c, COLORS[next.type]); } } }
  function draw(){ ctx.clearRect(0,0,board.width,board.height); drawGridBg(); for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const t=grid[y][x]; if(t) drawCell(x,y,t); } for(let y=0;y<current.shape.length;y++) for(let x=0;x<current.shape[0].length;x++) if(current.shape[y][x]){ const gy=current.y+y,gx=current.x+x; if(gy>=0) drawCell(gx,gy,current.type); } drawNext(); }

  function clearLines(){let c=0;outer:for(let y=ROWS-1;y>=0;y--){for(let x=0;x<COLS;x++)if(!grid[y][x])continue outer;grid.splice(y,1);grid.unshift(Array(COLS).fill(null));c++;y++;}if(c>0){score+=[0,40,100,300,1200][c]*level;lines+=c;const nl=1+Math.floor(lines/10);if(nl!==level){level=nl;updateSpeed();}}}
  function tick(){const m={...current,y:current.y+1};if(!collide(grid,m))current=m;else{merge(grid,current);clearLines();current=next;next=spawn();if(collide(grid,current)){running=false;alert('GAME OVER');reset();return;}}draw();scoreEl.textContent=score;linesEl.textContent=lines;levelEl.textContent=level;}
  function hardDrop(){while(!collide(grid,{...current,y:current.y+1}))current.y++;tick();}
  function loop(ts){if(!running)return;if(paused){requestAnimationFrame(loop);return;}const dt=ts-lastTime;lastTime=ts;acc+=dt;const elapsed=(Date.now()-startMs)/1000;timeEl.textContent=formatTime(elapsed);if(acc>=dropInterval){acc=0;tick();}draw();requestAnimationFrame(loop);}

  function reset(){grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));score=0;lines=0;level=1;updateSpeed();current=spawn();next=spawn();acc=0;lastTime=0;running=false;paused=false;draw();scoreEl.textContent=0;linesEl.textContent=0;levelEl.textContent=1;timeEl.textContent='00:00';}

  document.getElementById('start').onclick=()=>{if(!running){running=true;paused=false;startMs=Date.now(); // si el reproductor no está tocando, iniciamos o retomamos la pista actual
      player.play().catch(()=>{}); requestAnimationFrame(loop);}};
  document.getElementById('pause').onclick=()=>{if(running){paused=!paused;}};
  document.getElementById('reset').onclick=()=>{reset();};
  document.getElementById('nextTrack').onclick=()=>{ nextTrack(); };
  document.addEventListener('keydown',e=>{if(!running||paused)return;switch(e.keyCode){case KEYS.LEFT:if(!collide(grid,{...current,x:current.x-1}))current.x--;break;case KEYS.RIGHT:if(!collide(grid,{...current,x:current.x+1}))current.x++;break;case KEYS.DOWN:tick();break;case KEYS.UP:{const r=rotate(current.shape);if(!collide(grid,{...current,shape:r}))current.shape=r;else if(!collide(grid,{...current,shape:r,x:current.x-1})){current.shape=r;current.x--;}else if(!collide(grid,{...current,shape:r,x:current.x+1})){current.shape=r;current.x++;}break;}case KEYS.SPACE:hardDrop();break;case KEYS.P:paused=!paused;break;}draw();});

  board.width=COLS*CELL; board.height=ROWS*CELL;
  reset();

  // small console logs for debugging
  console.log('[INIT] Pistas hasta:', pistas.length, 'Fondos hasta:', fondos.length);
})();