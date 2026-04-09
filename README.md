# Nova2D - Game Engine 2D en JavaScript (sin Node)

Nova2D es un engine 2D completo basado en Canvas API para crear **plataformeros, shooters, RPG, puzzles, survival, metroidvania, runners y más** en JavaScript puro.

## Incluye

- Bucle de juego con `deltaTime` + fixed timestep.
- Arquitectura ECS ligera (Entity + Component + Script).
- Sistema de escenas con cambio dinámico.
- Física 2D básica con gravedad, fuerzas, drag y bounce.
- Colisiones AABB entre entidades y con TileMap sólido.
- Cámara 2D con seguimiento, suavizado y zoom.
- Render por capas (`zIndex`) + soporte de spritesheets.
- Animaciones por frames (`Animator`).
- Sistema de partículas (`ParticleEmitter`).
- Input de teclado y ratón.
- Carga de assets (imágenes, audio, JSON).
- Audio manager para SFX y música.
- EventBus para eventos globales.
- Save/Load persistente con `localStorage`.
- Pathfinder A* para grids.

## Estructura

- `src/engine2d.js`: versión ES Modules.
- `src/engine2d.global.js`: versión global para usar con `<script>` normal (sin imports, sin Node).
- `examples/index.html`: demo ejecutable con scripts normales.
- `examples/main.js`: ejemplo de escena, jugador, tilemap y UI.

## Uso sin Node (script normal)

```html
<canvas id="game"></canvas>
<script src="./src/engine2d.global.js"></script>
<script>
  const { GameEngine, Scene, Entity, Transform, Sprite, Rigidbody, Collider } = window.Nova2D;

  const canvas = document.getElementById("game");
  const engine = new GameEngine({ canvas, width: 960, height: 540 });

  class MyScene extends Scene {
    constructor() {
      super("main");
      const player = new Entity("Player")
        .add(new Transform({ x: 100, y: 100 }))
        .add(new Sprite({ width: 32, height: 32, color: "#00bcd4" }))
        .add(new Rigidbody({ mass: 1 }))
        .add(new Collider({ width: 32, height: 32 }));
      this.addEntity(player);
      this.camera.follow(player);
    }
  }

  engine.addScene(new MyScene());
  engine.start("main");
</script>
```

## Ejecutar la demo

Solo abre este archivo en tu navegador (doble clic):

```text
examples/index.html
```

No necesitas Node, npm ni bundlers.
