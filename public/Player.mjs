class Player {
  constructor({ x, y, score = 0, id }) {
    this.x = Number(x);
    this.y = Number(y);
    this.score = Number(score);
    this.id = id;
  }

  // (8) e (9)
  movePlayer(dir, speed) {
    const s = Number(speed) || 0;
    if (dir === 'left')  this.x -= s;
    if (dir === 'right') this.x += s;
    if (dir === 'up')    this.y -= s;
    if (dir === 'down')  this.y += s;
    return { x: this.x, y: this.y };
  }

  // (12) e (13) — colisão simples por igualdade (como o teste espera)
  collision(item) {
    if (!item) return false;
    return this.x === item.x && this.y === item.y;
  }

  // (10) e (11)
  calculateRank(arr) {
    const list = Array.isArray(arr) ? [...arr] : [this];
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
    const rank = list.findIndex(p => p.id === this.id) + 1;
    const total = list.length;
    return `Rank: ${rank}/${total}`;
  }
}

export default Player;
