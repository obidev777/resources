export function createInput(canvas){
  const keys=new Set(), touches=new Map(), state={x:0,y:0,attack:0,ranged:0,dash:0,skill:0,summon:0,ultimate:0,start:0,pause:0};
  const layout={stick:{x:90,y:0,r:62},buttons:{}};
  addEventListener('keydown',e=>keys.add(e.code)); addEventListener('keyup',e=>keys.delete(e.code));
  function setLayout(W,H){layout.stick={x:96,y:H-96,r:66};layout.buttons={attack:{x:W-72,y:H-82,r:44},ranged:{x:W-166,y:H-55,r:34},dash:{x:W-166,y:H-128,r:34},skill:{x:W-248,y:H-88,r:38},summon:{x:W-250,y:H-166,r:34},ultimate:{x:W-332,y:H-154,r:42},start:{x:W/2,y:H*.68,w:270,h:64}};}
  function read(){return {...state,attack:state.attack||keys.has('KeyJ'),ranged:state.ranged||keys.has('KeyK'),dash:state.dash||keys.has('KeyL'),skill:state.skill||keys.has('KeyU'),summon:state.summon||keys.has('KeyO'),ultimate:state.ultimate||keys.has('KeyI'),pause:keys.has('KeyP'),x:(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)||state.x,y:(keys.has('ArrowUp')||keys.has('KeyW')?-1:keys.has('ArrowDown')||keys.has('KeyS')?1:0)||state.y};}
  function hit(p,b){return b.r?Math.hypot(p.x-b.x,p.y-b.y)<b.r:p.x>b.x-b.w/2&&p.x<b.x+b.w/2&&p.y>b.y-b.h/2&&p.y<b.y+b.h/2;}
  function apply(){Object.assign(state,{attack:0,ranged:0,dash:0,skill:0,summon:0,ultimate:0,start:0,x:0,y:0});for(const p of touches.values()){const s=layout.stick,d=Math.hypot(p.x-s.x,p.y-s.y);if(d<s.r*1.45){state.x=Math.abs(p.x-s.x)<10?0:(p.x-s.x)/s.r;state.y=Math.abs(p.y-s.y)<10?0:(p.y-s.y)/s.r;}for(const [k,b] of Object.entries(layout.buttons))if(hit(p,b))state[k]=1;}}
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});apply();});canvas.addEventListener('pointermove',e=>{if(touches.has(e.pointerId)){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});apply();}});['pointerup','pointercancel'].forEach(ev=>canvas.addEventListener(ev,e=>{touches.delete(e.pointerId);apply();}));
  return {state,layout,setLayout,read,touches};
}
