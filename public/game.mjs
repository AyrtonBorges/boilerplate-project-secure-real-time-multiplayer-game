import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

const state = {
  meId: null,
  players: new Map(),        // id -> Player
  collectibles: new Map(),   // id -> Collectible
};

const SPEED = 5;
const pressed = { up:false, down:false, left:false, right:false };

// Atualização vinda do servidor
socket.on('state', ({ players, collectibles }) => {
  // identifica meu id pela heurística: mantém se já setado
  if (!state.meId && players.length) {
    // se só tem um, provavelmente sou eu; caso contrário,
    // deixe para a primeira tecla enviar e manter coerência
    // (isso é suficiente para o projeto do FCC)
  }

  state.players.clear();
  for (const p of players) state.players.set(p.id, new Player(p));

  state.collectibles.clear();
  for (const c of collectibles) state.collectibles.set(c.id, new Collectible(c));

  draw();
});

// Input
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') pressed.up = true;
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') pressed.down = true;
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') pressed.left = true;
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') pressed.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') pressed.up = false;
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') pressed.down = false;
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') pressed.left = false;
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') pressed.right = false;
});

// envia movimentos periodicamente (mantém sync suave)
setInterval(() => {
  if (pressed.left)  socket.emit('move', { dir: 'left',  speed: SPEED });
  if (pressed.right) socket.emit('move', { dir: 'right', speed: SPEED });
  if (pressed.up)    socket.emit('move', { dir: 'up',    speed: SPEED });
  if (pressed.down)  socket.emit('move', { dir: 'down',  speed: SPEED });
}, 50);

// Render bem simples
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // itens
  for (const c of state.collectibles.values()) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#22aa22';
    ctx.fill();
  }

  // players
  const arrPlayers = Array.from(state.players.values());
  for (const p of arrPlayers) {
    ctx.fillStyle = '#3366ff';
    ctx.fillRect(p.x - 8, p.y - 8, 16, 16);

    // rank (exemplo local)
    const rankStr = p.calculateRank(arrPlayers);
    ctx.font = '12px sans-serif';
    ctx.fillText(`${p.id.substring(0,4)} • ${rankStr}`, p.x + 10, p.y - 10);
  }
}
