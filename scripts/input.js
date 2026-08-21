export function createInput(){
  const keys=new Set(), state={x:0,y:0,attack:0,ranged:0,dash:0,skill:0,summon:0,ultimate:0};
  addEventListener('keydown',e=>keys.add(e.code)); addEventListener('keyup',e=>keys.delete(e.code));
  const pressed=()=>({...state,attack:state.attack||keys.has('KeyJ'),ranged:state.ranged||keys.has('KeyK'),dash:state.dash||keys.has('KeyL'),skill:state.skill||keys.has('KeyU'),summon:state.summon||keys.has('KeyO'),ultimate:state.ultimate||keys.has('KeyI'),x:(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)||state.x,y:(keys.has('ArrowUp')||keys.has('KeyW')?-1:keys.has('ArrowDown')||keys.has('KeyS')?1:0)||state.y});
  return {state,keys,pressed};
}
export function bindTouch(input){
  const stick=document.getElementById('stick'), knob=stick.querySelector('i'), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); let sid=null;
  function move(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=clamp(e.clientX-cx,-50,50),dy=clamp(e.clientY-cy,-50,50);input.state.x=Math.abs(dx)<12?0:dx/50;input.state.y=Math.abs(dy)<12?0:dy/50;knob.style.transform=`translate(${dx}px,${dy}px)`;}
  stick.addEventListener('pointerdown',e=>{sid=e.pointerId;stick.setPointerCapture(sid);move(e);}); stick.addEventListener('pointermove',e=>{if(e.pointerId===sid)move(e);}); stick.addEventListener('pointerup',()=>{sid=null;input.state.x=input.state.y=0;knob.style.transform='';});
  document.querySelectorAll('.buttons button').forEach(b=>{const a=b.dataset.act;b.addEventListener('pointerdown',e=>{e.preventDefault();input.state[a]=1;b.setPointerCapture(e.pointerId);});['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>input.state[a]=0));});
}
