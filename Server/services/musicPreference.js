function validPositionBody(body) {
  if(!body || Object.keys(body).length!==1 || !Object.hasOwn(body,'position'))return false;
  const p=body.position;
  return p===null || (typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===2&&['x','y'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1));
}
module.exports={validPositionBody};
