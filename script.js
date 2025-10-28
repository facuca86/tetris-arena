// === CONTROL DE MÚSICA Y FONDO ===
const pistas = Array.from({ length: MAX_PISTAS }, (_, i) => `assets/music/${i + 1}.mp3`);
const fondos = Array.from({ length: MAX_FONDOS }, (_, i) => `assets/img/${i + 1}.jpeg`);

let pistaIndex = 0;
let fondoIndex = -1;

const player = document.createElement('audio');
player.loop = false;
player.volume = 0.6;
document.body.appendChild(player);

function updateHUD() {
  const t = pistaIndex + 1;
  const f = fondoIndex === -1 ? '--' : fondoIndex + 1;
  hud.textContent = `🎵 Track ${t} | Fondo ${f}`;
}

// FONDO SEGURO: si no carga, usa otro hasta tener uno válido
function setRandomBackgroundDifferent() {
  const start = Math.floor(Math.random() * fondos.length);
  let found = false;

  for (let i = 0; i < fondos.length; i++) {
    const idx = (start + i) % fondos.length;
    if (idx === fondoIndex) continue;
    const img = new Image();
    img.onload = () => {
      document.documentElement.style.setProperty('--fondo', `url('${fondos[idx]}')`);
      fondoIndex = idx;
      updateHUD();
    };
    img.onerror = () => {}; // sigue al siguiente
    img.src = fondos[idx];
    found = true;
    break;
  }

  // si no encontró ninguno, fondo de emergencia
  if (!found) {
    document.documentElement.style.setProperty('--fondo', `linear-gradient(135deg,#10202b,#203a5a)`);
    fondoIndex = -1;
    updateHUD();
  }
}

// REPRODUCIR UNA PISTA SEGURA
function playTrack(index) {
  pistaIndex = index % pistas.length;
  player.src = pistas[pistaIndex];
  player.play().catch(() => {
    // Si no puede reproducir (bloqueo de autoplay o error), prueba siguiente pista
    console.warn('Fallo al reproducir pista, intentando siguiente...');
    pistaIndex = (pistaIndex + 1) % pistas.length;
    playTrack(pistaIndex);
  });
  updateHUD();
}

// INICIO AUTOMÁTICO
(function initMediaOnLoad() {
  // Fondo inicial
  setRandomBackgroundDifferent();

  // Intentar reproducir música (si falla, se reintenta hasta lograrlo)
  let tries = 0;
  function ensureMusic() {
    playTrack(0);
    const interval = setInterval(() => {
      if (!player.paused && player.currentTime > 0) {
        clearInterval(interval);
      } else if (tries++ > pistas.length * 2) {
        clearInterval(interval);
        console.warn('No se pudo reproducir ninguna pista.');
      } else {
        pistaIndex = (pistaIndex + 1) % pistas.length;
        playTrack(pistaIndex);
      }
    }, 2000);
  }
  ensureMusic();
})();

// CUANDO TERMINA UNA CANCIÓN
player.addEventListener('ended', () => {
  pistaIndex = (pistaIndex + 1) % pistas.length;
  playTrack(pistaIndex);
  setRandomBackgroundDifferent();
  console.log('[Music] Reproduciendo:', pistas[pistaIndex]);
});

// BOTÓN NEXT TRACK
function nextTrack() {
  pistaIndex = (pistaIndex + 1) % pistas.length;
  playTrack(pistaIndex);
  setRandomBackgroundDifferent();
}
