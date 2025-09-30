require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai'); // (FCC usa internamente)
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet'); // ⬅️ novo

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// Estáticos
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

const nocache = require('nocache');
app.use(nocache()); // em vez de helmet.noCache()

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS (FCC)
app.use(cors({ origin: '*' }));

/* 🔒 Segurança — conforme os testes:
   - noSniff:  X-Content-Type-Options: nosniff
   - noCache:  Surrogate-Control/Cache-Control/Pragma/Expires
   - X-Powered-By: 'PHP 7.4.3'
   - X-XSS-Protection: '1; mode=block' (setamos manualmente p/ bater no teste)
*/
app.use(helmet.noSniff());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use((req, res, next) => {
  res.set('X-XSS-Protection', '1; mode=block'); // requerido pelo teste
  next();
});

// Index
app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Rotas de teste FCC
fccTestingRoutes(app);

// 404
app.use(function (req, res, next) {
  res.status(404).type('text').send('Not Found');
});

const portNum = process.env.PORT || 3000;

// ====== 🔌 Estado do jogo (server-authoritative) ======
const GAME_W = 800, GAME_H = 600;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const players = new Map(); // socket.id -> { id, x, y, score }
const collectibles = [
  { id: 'c1', x: Math.floor(Math.random()*GAME_W), y: Math.floor(Math.random()*GAME_H), value: 1 }
];

function broadcastState(io) {
  io.emit('state', {
    players: Array.from(players.values()),
    collectibles
  });
}

// Start server + testes
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try { runner.run(); } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

// ====== 🕹️ Socket.io ======
const io = socket(server);

io.on('connection', (sock) => {
  // cria player
  const p = {
    id: sock.id,
    x: Math.floor(Math.random()*GAME_W),
    y: Math.floor(Math.random()*GAME_H),
    score: 0
  };
  players.set(sock.id, p);
  broadcastState(io);

  // move: {dir:'up|down|left|right', speed:Number}
  sock.on('move', ({ dir, speed }) => {
    const me = players.get(sock.id);
    if (!me) return;
    const s = clamp(Number(speed)||0, 0, 10);
    if (dir === 'left')  me.x -= s;
    if (dir === 'right') me.x += s;
    if (dir === 'up')    me.y -= s;
    if (dir === 'down')  me.y += s;

    me.x = clamp(me.x, 0, GAME_W);
    me.y = clamp(me.y, 0, GAME_H);

    // colisão servidor -> evita trapaça
    for (const item of collectibles) {
      const dx = me.x - item.x, dy = me.y - item.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 16) { // hit radius
        me.score += item.value;
        // respawna item
        item.x = Math.floor(Math.random()*GAME_W);
        item.y = Math.floor(Math.random()*GAME_H);
      }
    }
    broadcastState(io);
  });

  sock.on('disconnect', () => {
    players.delete(sock.id);
    broadcastState(io);
  });
});

module.exports = app; // For testing
