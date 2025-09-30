class Collectible {
  constructor({ x, y, value = 1, id }) {
    this.x = Number(x);
    this.y = Number(y);
    this.value = Number(value);
    this.id = id;
  }
}

/* Export compat com testes que possam requerer CommonJS */
try { module.exports = Collectible; } catch (e) {}

export default Collectible;
