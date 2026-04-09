/*
 * Nova2D Engine
 * Engine 2D completo en JavaScript (Canvas API) para crear múltiples tipos de juegos 2D.
 * Arquitectura ECS ligera + escenas + física + colisiones + animación + partículas + tilemaps + audio + UI + guardado.
 */

export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  static add(a, b) {
    return new Vec2(a.x + b.x, a.y + b.y);
  }

  static sub(a, b) {
    return new Vec2(a.x - b.x, a.y - b.y);
  }
}

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    const set = this.listeners.get(eventName);
    if (!set) return;
    set.delete(callback);
    if (set.size === 0) this.listeners.delete(eventName);
  }

  emit(eventName, payload) {
    const set = this.listeners.get(eventName);
    if (!set) return;
    for (const cb of set) cb(payload);
  }
}

export class Time {
  constructor() {
    this.delta = 0;
    this.elapsed = 0;
    this.timeScale = 1;
    this._last = performance.now();
  }

  tick(now) {
    const rawDelta = (now - this._last) / 1000;
    this._last = now;
    this.delta = Math.min(rawDelta, 1 / 20) * this.timeScale;
    this.elapsed += this.delta;
  }
}

export class InputManager {
  constructor(target = window) {
    this.keys = new Set();
    this.justPressed = new Set();
    this.justReleased = new Set();
    this.mouse = {
      position: new Vec2(),
      buttons: new Set(),
      wheelDelta: 0,
    };
    this._target = target;
    this._eventsBound = false;
  }

  attach(canvas) {
    if (this._eventsBound) return;
    this._eventsBound = true;

    this._target.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) this.justPressed.add(e.code);
      this.keys.add(e.code);
    });

    this._target.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
      this.justReleased.add(e.code);
    });

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.position.set(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener("mousedown", (e) => {
      this.mouse.buttons.add(e.button);
    });

    canvas.addEventListener("mouseup", (e) => {
      this.mouse.buttons.delete(e.button);
    });

    canvas.addEventListener("wheel", (e) => {
      this.mouse.wheelDelta += e.deltaY;
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  isKeyDown(code) {
    return this.keys.has(code);
  }

  wasKeyPressed(code) {
    return this.justPressed.has(code);
  }

  wasKeyReleased(code) {
    return this.justReleased.has(code);
  }

  endFrame() {
    this.justPressed.clear();
    this.justReleased.clear();
    this.mouse.wheelDelta = 0;
  }
}

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.audio = new Map();
    this.json = new Map();
  }

  async loadImage(key, src) {
    const image = new Image();
    image.src = src;
    await image.decode();
    this.images.set(key, image);
    return image;
  }

  async loadAudio(key, src) {
    const audio = new Audio(src);
    await new Promise((resolve, reject) => {
      audio.addEventListener("canplaythrough", resolve, { once: true });
      audio.addEventListener("error", reject, { once: true });
    });
    this.audio.set(key, audio);
    return audio;
  }

  async loadJSON(key, src) {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Error cargando JSON: ${src}`);
    const data = await response.json();
    this.json.set(key, data);
    return data;
  }

  getImage(key) {
    return this.images.get(key);
  }

  getAudio(key) {
    return this.audio.get(key)?.cloneNode(true);
  }

  getJSON(key) {
    return this.json.get(key);
  }
}

export class AudioManager {
  constructor(loader) {
    this.loader = loader;
    this.music = null;
    this.masterVolume = 1;
    this.sfxVolume = 1;
    this.musicVolume = 1;
    this.muted = false;
  }

  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    this._applyVolumes();
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    this._applyVolumes();
  }

  toggleMute() {
    this.muted = !this.muted;
    this._applyVolumes();
  }

  playSfx(key, { volume = 1, loop = false, playbackRate = 1 } = {}) {
    const sfx = this.loader.getAudio(key);
    if (!sfx) return null;
    sfx.volume = this.muted ? 0 : volume * this.sfxVolume * this.masterVolume;
    sfx.loop = loop;
    sfx.playbackRate = playbackRate;
    sfx.play().catch(() => {});
    return sfx;
  }

  playMusic(key, { loop = true } = {}) {
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
    this.music = this.loader.getAudio(key);
    if (!this.music) return;
    this.music.loop = loop;
    this._applyVolumes();
    this.music.play().catch(() => {});
  }

  stopMusic() {
    if (!this.music) return;
    this.music.pause();
    this.music.currentTime = 0;
    this.music = null;
  }

  _applyVolumes() {
    if (!this.music) return;
    this.music.volume = this.muted ? 0 : this.masterVolume * this.musicVolume;
  }
}

let ENTITY_ID = 1;

export class Component {
  constructor(type) {
    this.type = type;
  }
}

export class Entity {
  constructor(name = "Entity") {
    this.id = ENTITY_ID++;
    this.name = name;
    this.active = true;
    this.tags = new Set();
    this.components = new Map();
  }

  add(component) {
    this.components.set(component.type, component);
    return this;
  }

  remove(type) {
    this.components.delete(type);
    return this;
  }

  get(type) {
    return this.components.get(type);
  }

  has(type) {
    return this.components.has(type);
  }

  tag(tagName) {
    this.tags.add(tagName);
    return this;
  }

  hasTag(tagName) {
    return this.tags.has(tagName);
  }
}

export class Transform extends Component {
  constructor({ x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1 } = {}) {
    super("Transform");
    this.position = new Vec2(x, y);
    this.rotation = rotation;
    this.scale = new Vec2(scaleX, scaleY);
  }
}

export class Sprite extends Component {
  constructor({
    image = null,
    width = 32,
    height = 32,
    color = null,
    zIndex = 0,
    sourceX = 0,
    sourceY = 0,
    sourceW = null,
    sourceH = null,
    opacity = 1,
    anchorX = 0.5,
    anchorY = 0.5,
  } = {}) {
    super("Sprite");
    this.image = image;
    this.width = width;
    this.height = height;
    this.color = color;
    this.zIndex = zIndex;
    this.sourceX = sourceX;
    this.sourceY = sourceY;
    this.sourceW = sourceW;
    this.sourceH = sourceH;
    this.opacity = opacity;
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.visible = true;
  }
}

export class Rigidbody extends Component {
  constructor({ mass = 1, drag = 0, gravityScale = 1, isStatic = false, bounce = 0 } = {}) {
    super("Rigidbody");
    this.mass = Math.max(0.0001, mass);
    this.drag = drag;
    this.gravityScale = gravityScale;
    this.isStatic = isStatic;
    this.bounce = bounce;
    this.velocity = new Vec2();
    this.acceleration = new Vec2();
    this.forces = new Vec2();
  }

  addForce(x, y) {
    this.forces.x += x;
    this.forces.y += y;
  }
}

export class Collider extends Component {
  constructor({ width = 32, height = 32, offsetX = 0, offsetY = 0, isTrigger = false, layer = "default", mask = ["default"] } = {}) {
    super("Collider");
    this.width = width;
    this.height = height;
    this.offset = new Vec2(offsetX, offsetY);
    this.isTrigger = isTrigger;
    this.layer = layer;
    this.mask = new Set(mask);
    this.collisions = new Set();
  }
}

export class Animator extends Component {
  constructor() {
    super("Animator");
    this.animations = new Map();
    this.current = null;
    this.frameIndex = 0;
    this.timer = 0;
    this.paused = false;
  }

  addAnimation(name, { frames, fps = 8, loop = true }) {
    this.animations.set(name, { frames, fps, loop });
    if (!this.current) this.play(name);
  }

  play(name, restart = false) {
    if (!this.animations.has(name)) return;
    if (this.current === name && !restart) return;
    this.current = name;
    this.frameIndex = 0;
    this.timer = 0;
  }

  currentFrame() {
    if (!this.current) return null;
    const anim = this.animations.get(this.current);
    return anim.frames[this.frameIndex] || null;
  }
}

export class Script extends Component {
  constructor({ onCreate, onUpdate, onDestroy } = {}) {
    super("Script");
    this.onCreate = onCreate || (() => {});
    this.onUpdate = onUpdate || (() => {});
    this.onDestroy = onDestroy || (() => {});
    this.initialized = false;
  }
}

export class ParticleEmitter extends Component {
  constructor({
    rate = 10,
    life = 0.8,
    speedMin = 10,
    speedMax = 50,
    spread = Math.PI,
    color = "#ffffff",
    sizeMin = 1,
    sizeMax = 4,
  } = {}) {
    super("ParticleEmitter");
    this.rate = rate;
    this.life = life;
    this.speedMin = speedMin;
    this.speedMax = speedMax;
    this.spread = spread;
    this.color = color;
    this.sizeMin = sizeMin;
    this.sizeMax = sizeMax;
    this._accum = 0;
    this.particles = [];
  }
}

export class Camera2D {
  constructor({ x = 0, y = 0, zoom = 1, smoothing = 0.1 } = {}) {
    this.position = new Vec2(x, y);
    this.zoom = zoom;
    this.smoothing = smoothing;
    this.target = null;
    this.bounds = null;
  }

  follow(entity) {
    this.target = entity;
  }

  setBounds({ x, y, width, height }) {
    this.bounds = { x, y, width, height };
  }

  update(dt) {
    if (!this.target || !this.target.has("Transform")) return;
    const targetPos = this.target.get("Transform").position;
    this.position.x += (targetPos.x - this.position.x) * Math.min(1, this.smoothing * 60 * dt);
    this.position.y += (targetPos.y - this.position.y) * Math.min(1, this.smoothing * 60 * dt);

    if (this.bounds) {
      const { x, y, width, height } = this.bounds;
      this.position.x = Math.max(x, Math.min(x + width, this.position.x));
      this.position.y = Math.max(y, Math.min(y + height, this.position.y));
    }
  }
}

export class TileMap {
  constructor({ tileSize = 32, width = 0, height = 0, data = [], solid = new Set([1]) } = {}) {
    this.tileSize = tileSize;
    this.width = width;
    this.height = height;
    this.data = data;
    this.solid = solid;
  }

  index(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
    return y * this.width + x;
  }

  get(x, y) {
    const i = this.index(x, y);
    if (i < 0) return 0;
    return this.data[i] ?? 0;
  }

  set(x, y, value) {
    const i = this.index(x, y);
    if (i < 0) return;
    this.data[i] = value;
  }

  isSolid(x, y) {
    return this.solid.has(this.get(x, y));
  }

  worldToTile(wx, wy) {
    return {
      x: Math.floor(wx / this.tileSize),
      y: Math.floor(wy / this.tileSize),
    };
  }

  render(ctx, camera, tileset = null, tileRects = new Map()) {
    const halfW = ctx.canvas.width / (2 * camera.zoom);
    const halfH = ctx.canvas.height / (2 * camera.zoom);
    const minX = Math.max(0, Math.floor((camera.position.x - halfW) / this.tileSize) - 1);
    const maxX = Math.min(this.width - 1, Math.floor((camera.position.x + halfW) / this.tileSize) + 1);
    const minY = Math.max(0, Math.floor((camera.position.y - halfH) / this.tileSize) - 1);
    const maxY = Math.min(this.height - 1, Math.floor((camera.position.y + halfH) / this.tileSize) + 1);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const id = this.get(x, y);
        if (!id) continue;
        const dx = x * this.tileSize;
        const dy = y * this.tileSize;

        if (tileset && tileRects.has(id)) {
          const r = tileRects.get(id);
          ctx.drawImage(tileset, r.x, r.y, r.w, r.h, dx, dy, this.tileSize, this.tileSize);
        } else {
          ctx.fillStyle = id === 1 ? "#2e7d32" : "#607d8b";
          ctx.fillRect(dx, dy, this.tileSize, this.tileSize);
        }
      }
    }
  }
}

export class Scene {
  constructor(name = "scene") {
    this.name = name;
    this.entities = [];
    this.toAdd = [];
    this.toRemove = new Set();
    this.tileMap = null;
    this.background = "#111";
    this.camera = new Camera2D();
    this.ui = [];
    this.started = false;
  }

  addEntity(entity) {
    this.toAdd.push(entity);
    return entity;
  }

  removeEntity(entity) {
    this.toRemove.add(entity.id);
  }

  findByTag(tagName) {
    return this.entities.filter((e) => e.hasTag(tagName));
  }

  findByName(name) {
    return this.entities.find((e) => e.name === name);
  }

  onEnter(_engine) {}
  onUpdate(_engine, _dt) {}
  onExit(_engine) {}

  _flushQueues() {
    if (this.toAdd.length > 0) {
      this.entities.push(...this.toAdd);
      this.toAdd.length = 0;
    }
    if (this.toRemove.size > 0) {
      this.entities = this.entities.filter((e) => !this.toRemove.has(e.id));
      this.toRemove.clear();
    }
  }
}

export class SaveSystem {
  static save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static load(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }
}

export class RNG {
  constructor(seed = 1337) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed += 0x6D2B79F5;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
}

export class Pathfinder {
  static findPath(gridWalkable, start, goal) {
    const key = (x, y) => `${x},${y}`;
    const open = [{ ...start, f: 0, g: 0 }];
    const cameFrom = new Map();
    const gScore = new Map([[key(start.x, start.y), 0]]);

    const h = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();
      if (current.x === goal.x && current.y === goal.y) {
        const path = [{ x: current.x, y: current.y }];
        let cKey = key(current.x, current.y);
        while (cameFrom.has(cKey)) {
          const prev = cameFrom.get(cKey);
          path.push(prev);
          cKey = key(prev.x, prev.y);
        }
        return path.reverse();
      }

      const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

      for (const d of dirs) {
        const nx = current.x + d.x;
        const ny = current.y + d.y;
        if (!gridWalkable(nx, ny)) continue;

        const ng = current.g + 1;
        const nKey = key(nx, ny);
        const prevG = gScore.get(nKey);
        if (prevG === undefined || ng < prevG) {
          cameFrom.set(nKey, { x: current.x, y: current.y });
          gScore.set(nKey, ng);
          open.push({ x: nx, y: ny, g: ng, f: ng + h({ x: nx, y: ny }, goal) });
        }
      }
    }

    return [];
  }
}

function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function entityAABB(entity) {
  if (!entity.has("Transform") || !entity.has("Collider")) return null;
  const t = entity.get("Transform");
  const c = entity.get("Collider");
  return {
    x: t.position.x + c.offset.x - c.width / 2,
    y: t.position.y + c.offset.y - c.height / 2,
    w: c.width,
    h: c.height,
  };
}

export class GameEngine {
  constructor({
    canvas,
    width = 960,
    height = 540,
    gravity = new Vec2(0, 980),
    fixedStep = 1 / 120,
    debug = false,
  } = {}) {
    if (!canvas) throw new Error("Debes proporcionar un canvas");

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.canvas.width = width;
    this.canvas.height = height;

    this.time = new Time();
    this.input = new InputManager(window);
    this.input.attach(canvas);

    this.assets = new AssetLoader();
    this.audio = new AudioManager(this.assets);
    this.events = new EventBus();

    this.gravity = gravity;
    this.fixedStep = fixedStep;
    this.fixedAccumulator = 0;
    this.debug = debug;

    this.scenes = new Map();
    this.currentScene = null;
    this.running = false;

    this._loop = this._loop.bind(this);
  }

  addScene(scene) {
    this.scenes.set(scene.name, scene);
    return scene;
  }

  changeScene(name) {
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Escena no encontrada: ${name}`);

    if (this.currentScene) this.currentScene.onExit(this);
    this.currentScene = next;
    this.currentScene._flushQueues();
    this.currentScene.onEnter(this);
    this.currentScene.started = true;
  }

  start(initialSceneName) {
    if (initialSceneName) this.changeScene(initialSceneName);
    this.running = true;
    requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
  }

  _loop(now) {
    if (!this.running) return;
    this.time.tick(now);
    const dt = this.time.delta;

    if (!this.currentScene) {
      requestAnimationFrame(this._loop);
      return;
    }

    this.currentScene._flushQueues();

    this.fixedAccumulator += dt;
    while (this.fixedAccumulator >= this.fixedStep) {
      this._fixedUpdate(this.fixedStep);
      this.fixedAccumulator -= this.fixedStep;
    }

    this._update(dt);
    this._render();
    this.input.endFrame();

    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    const scene = this.currentScene;

    scene.camera.update(dt);
    scene.onUpdate(this, dt);

    for (const entity of scene.entities) {
      if (!entity.active) continue;

      if (entity.has("Script")) {
        const s = entity.get("Script");
        if (!s.initialized) {
          s.onCreate(entity, scene, this);
          s.initialized = true;
        }
        s.onUpdate(entity, scene, this, dt);
      }

      if (entity.has("Animator") && entity.has("Sprite")) {
        const animator = entity.get("Animator");
        if (!animator.paused && animator.current) {
          const anim = animator.animations.get(animator.current);
          animator.timer += dt;
          const frameTime = 1 / anim.fps;
          if (animator.timer >= frameTime) {
            animator.timer -= frameTime;
            animator.frameIndex += 1;
            if (animator.frameIndex >= anim.frames.length) {
              animator.frameIndex = anim.loop ? 0 : anim.frames.length - 1;
            }
          }
          const frame = animator.currentFrame();
          if (frame) {
            const sprite = entity.get("Sprite");
            sprite.sourceX = frame.x;
            sprite.sourceY = frame.y;
            sprite.sourceW = frame.w;
            sprite.sourceH = frame.h;
          }
        }
      }

      if (entity.has("ParticleEmitter") && entity.has("Transform")) {
        const emitter = entity.get("ParticleEmitter");
        const t = entity.get("Transform");
        emitter._accum += dt * emitter.rate;
        while (emitter._accum >= 1) {
          emitter._accum -= 1;
          const angle = (Math.random() - 0.5) * emitter.spread;
          const speed = emitter.speedMin + Math.random() * (emitter.speedMax - emitter.speedMin);
          emitter.particles.push({
            x: t.position.x,
            y: t.position.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: emitter.life,
            maxLife: emitter.life,
            size: emitter.sizeMin + Math.random() * (emitter.sizeMax - emitter.sizeMin),
          });
        }

        for (const p of emitter.particles) {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 50 * dt;
        }
        emitter.particles = emitter.particles.filter((p) => p.life > 0);
      }
    }
  }

  _fixedUpdate(step) {
    const scene = this.currentScene;

    for (const entity of scene.entities) {
      if (!entity.active || !entity.has("Transform") || !entity.has("Rigidbody")) continue;

      const t = entity.get("Transform");
      const rb = entity.get("Rigidbody");
      if (rb.isStatic) continue;

      rb.acceleration.x = rb.forces.x / rb.mass + this.gravity.x * rb.gravityScale;
      rb.acceleration.y = rb.forces.y / rb.mass + this.gravity.y * rb.gravityScale;
      rb.forces.set(0, 0);

      rb.velocity.x += rb.acceleration.x * step;
      rb.velocity.y += rb.acceleration.y * step;

      rb.velocity.x *= 1 - Math.min(0.98, rb.drag * step);
      rb.velocity.y *= 1 - Math.min(0.98, rb.drag * step);

      t.position.x += rb.velocity.x * step;
      t.position.y += rb.velocity.y * step;
    }

    this._solveEntityCollisions(scene);
    this._solveTileCollisions(scene);
  }

  _solveEntityCollisions(scene) {
    const colliders = scene.entities.filter((e) => e.active && e.has("Transform") && e.has("Collider"));
    for (const entity of colliders) entity.get("Collider").collisions.clear();

    for (let i = 0; i < colliders.length; i++) {
      for (let j = i + 1; j < colliders.length; j++) {
        const a = colliders[i];
        const b = colliders[j];
        const ca = a.get("Collider");
        const cb = b.get("Collider");

        if (!ca.mask.has(cb.layer) && !cb.mask.has(ca.layer)) continue;

        const aa = entityAABB(a);
        const bb = entityAABB(b);
        if (!aa || !bb || !aabbOverlap(aa, bb)) continue;

        ca.collisions.add(b.id);
        cb.collisions.add(a.id);
        this.events.emit("collision", { a, b, trigger: ca.isTrigger || cb.isTrigger });

        if (ca.isTrigger || cb.isTrigger) continue;

        const overlapX = Math.min(aa.x + aa.w - bb.x, bb.x + bb.w - aa.x);
        const overlapY = Math.min(aa.y + aa.h - bb.y, bb.y + bb.h - aa.y);

        const at = a.get("Transform");
        const bt = b.get("Transform");
        const arb = a.get("Rigidbody");
        const brb = b.get("Rigidbody");

        if (overlapX < overlapY) {
          const dir = at.position.x < bt.position.x ? -1 : 1;
          if (!arb?.isStatic && !brb?.isStatic) {
            at.position.x += dir * overlapX * 0.5;
            bt.position.x -= dir * overlapX * 0.5;
          } else if (!arb?.isStatic) {
            at.position.x += dir * overlapX;
          } else if (!brb?.isStatic) {
            bt.position.x -= dir * overlapX;
          }
          if (arb) arb.velocity.x *= -arb.bounce;
          if (brb) brb.velocity.x *= -brb.bounce;
        } else {
          const dir = at.position.y < bt.position.y ? -1 : 1;
          if (!arb?.isStatic && !brb?.isStatic) {
            at.position.y += dir * overlapY * 0.5;
            bt.position.y -= dir * overlapY * 0.5;
          } else if (!arb?.isStatic) {
            at.position.y += dir * overlapY;
          } else if (!brb?.isStatic) {
            bt.position.y -= dir * overlapY;
          }
          if (arb) arb.velocity.y *= -arb.bounce;
          if (brb) brb.velocity.y *= -brb.bounce;
        }
      }
    }
  }

  _solveTileCollisions(scene) {
    if (!scene.tileMap) return;
    const map = scene.tileMap;

    for (const entity of scene.entities) {
      if (!entity.active || !entity.has("Transform") || !entity.has("Collider") || !entity.has("Rigidbody")) continue;

      const t = entity.get("Transform");
      const c = entity.get("Collider");
      const rb = entity.get("Rigidbody");
      if (rb.isStatic) continue;

      const aabb = entityAABB(entity);
      const min = map.worldToTile(aabb.x, aabb.y);
      const max = map.worldToTile(aabb.x + aabb.w, aabb.y + aabb.h);

      for (let ty = min.y; ty <= max.y; ty++) {
        for (let tx = min.x; tx <= max.x; tx++) {
          if (!map.isSolid(tx, ty)) continue;

          const tile = {
            x: tx * map.tileSize,
            y: ty * map.tileSize,
            w: map.tileSize,
            h: map.tileSize,
          };

          const box = entityAABB(entity);
          if (!aabbOverlap(box, tile)) continue;

          const overlapX = Math.min(box.x + box.w - tile.x, tile.x + tile.w - box.x);
          const overlapY = Math.min(box.y + box.h - tile.y, tile.y + tile.h - box.y);

          if (overlapX < overlapY) {
            const dir = box.x < tile.x ? -1 : 1;
            t.position.x += dir * overlapX;
            rb.velocity.x = 0;
          } else {
            const dir = box.y < tile.y ? -1 : 1;
            t.position.y += dir * overlapY;
            rb.velocity.y = 0;
          }
        }
      }
    }
  }

  _render() {
    const scene = this.currentScene;
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(scene.camera.zoom, scene.camera.zoom);
    ctx.translate(-scene.camera.position.x, -scene.camera.position.y);

    if (scene.tileMap) {
      scene.tileMap.render(ctx, scene.camera);
    }

    const drawables = scene.entities
      .filter((e) => e.active && e.has("Transform") && e.has("Sprite") && e.get("Sprite").visible)
      .sort((a, b) => a.get("Sprite").zIndex - b.get("Sprite").zIndex);

    for (const e of drawables) {
      const t = e.get("Transform");
      const s = e.get("Sprite");

      ctx.save();
      ctx.translate(t.position.x, t.position.y);
      ctx.rotate(t.rotation);
      ctx.scale(t.scale.x, t.scale.y);
      ctx.globalAlpha = s.opacity;

      const dx = -s.width * s.anchorX;
      const dy = -s.height * s.anchorY;

      if (s.image) {
        if (s.sourceW && s.sourceH) {
          ctx.drawImage(s.image, s.sourceX, s.sourceY, s.sourceW, s.sourceH, dx, dy, s.width, s.height);
        } else {
          ctx.drawImage(s.image, dx, dy, s.width, s.height);
        }
      } else {
        ctx.fillStyle = s.color || "#fff";
        ctx.fillRect(dx, dy, s.width, s.height);
      }

      if (this.debug && e.has("Collider")) {
        const c = e.get("Collider");
        ctx.strokeStyle = "#ff0";
        ctx.lineWidth = 1 / scene.camera.zoom;
        ctx.strokeRect(
          c.offset.x - c.width / 2,
          c.offset.y - c.height / 2,
          c.width,
          c.height
        );
      }

      ctx.restore();

      if (e.has("ParticleEmitter")) {
        const emitter = e.get("ParticleEmitter");
        for (const p of emitter.particles) {
          const alpha = p.life / p.maxLife;
          ctx.fillStyle = emitter.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.restore();

    ctx.save();
    for (const uiElement of scene.ui) {
      uiElement(ctx, this);
    }
    ctx.restore();
  }
}

export function createPlayer({ x = 100, y = 100, color = "#42a5f5" } = {}) {
  return new Entity("Player")
    .tag("player")
    .add(new Transform({ x, y }))
    .add(new Sprite({ width: 32, height: 32, color }))
    .add(new Rigidbody({ mass: 1, drag: 0.8, bounce: 0 }))
    .add(new Collider({ width: 28, height: 28 }));
}
