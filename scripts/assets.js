export const ASSET_PATHS = { ryu:'assets/ryu.svg', kai:'assets/kai.svg', minion:'assets/minion.svg', tower:'assets/tower.svg' };
export async function loadAssets(){
  const out={};
  await Promise.all(Object.entries(ASSET_PATHS).map(([k,src])=>new Promise((res,rej)=>{const img=new Image();img.onload=()=>{out[k]=img;res();};img.onerror=rej;img.src=src;})));
  return out;
}
