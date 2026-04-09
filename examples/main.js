const {
  GameEngine,
  Scene,
  Entity,
  Transform,
  Sprite,
  Rigidbody,
  Collider,
  Script,
  ParticleEmitter,
  TileMap,
  createPlayer,
} = window.Nova2D;

const canvas = document.getElementById("game");
const engine = new GameEngine({ canvas, width: 960, height: 540, debug: false });

class DemoScene extends Scene {
  constructor() {
    super("demo");
    this.background = "#0f172a";

    const mapData = [];
    const w = 60;
    const h = 24;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isFloor = y >= 20;
        const isPillar = (x === 15 || x === 32 || x === 47) && y >= 16;
        mapData.push(isFloor || isPillar ? 1 : 0);
      }
    }

    this.tileMap = new TileMap({
      tileSize: 32,
      width: w,
      height: h,
      data: mapData,
      solid: new Set([1]),
    });

    this.player = createPlayer({ x: 120, y: 120, color: "#22d3ee" });
    this.player.add(
      new Script({
        onUpdate: (entity, scene, game) => {
          const rb = entity.get("Rigidbody");
          const speed = 190;
          const jump = -420;

          if (game.input.isKeyDown("KeyA") || game.input.isKeyDown("ArrowLeft")) {
            rb.velocity.x = -speed;
          } else if (game.input.isKeyDown("KeyD") || game.input.isKeyDown("ArrowRight")) {
            rb.velocity.x = speed;
          } else {
            rb.velocity.x *= 0.8;
          }

          const grounded = Math.abs(rb.velocity.y) < 2 || this._isTouchingGround(entity, scene.tileMap);
          if ((game.input.wasKeyPressed("Space") || game.input.wasKeyPressed("ArrowUp")) && grounded) {
            rb.velocity.y = jump;
          }

          const t = entity.get("Transform");
          if (t.position.y > 900) {
            t.position.set(120, 120);
            rb.velocity.set(0, 0);
          }

          if (game.input.wasKeyPressed("KeyF")) {
            entity.add(new ParticleEmitter({ rate: 60, color: "#f97316", life: 0.5, spread: Math.PI * 2 }));
            setTimeout(() => entity.remove("ParticleEmitter"), 500);
          }
        },
      })
    );

    this.addEntity(this.player);

    const box = new Entity("Box")
      .add(new Transform({ x: 420, y: 220 }))
      .add(new Sprite({ width: 48, height: 48, color: "#f59e0b" }))
      .add(new Rigidbody({ mass: 1, drag: 0.4, bounce: 0.1 }))
      .add(new Collider({ width: 48, height: 48, layer: "dynamic" }));
    this.addEntity(box);

    this.camera.follow(this.player);
    this.camera.zoom = 1.2;

    this.ui.push((ctx, game) => {
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px monospace";
      ctx.fillText("Nova2D Demo - Mover: WASD/Flechas | Saltar: Espacio | Particulas: F", 18, 28);
      ctx.fillText(`FPS aprox: ${Math.round(1 / Math.max(0.0001, game.time.delta))}`, 18, 52);
    });
  }

  _isTouchingGround(entity, map) {
    const t = entity.get("Transform");
    const c = entity.get("Collider");
    const bottomY = t.position.y + c.height / 2 + 2;
    const leftX = t.position.x - c.width / 2 + 2;
    const rightX = t.position.x + c.width / 2 - 2;

    const l = map.worldToTile(leftX, bottomY);
    const r = map.worldToTile(rightX, bottomY);
    return map.isSolid(l.x, l.y) || map.isSolid(r.x, r.y);
  }
}

engine.addScene(new DemoScene());
engine.start("demo");
