import {restoreSession} from './auth.mjs';
export function positionStore(onLoad) {
  let owner=null, revision=0, writes=Promise.resolve();
  const identify=()=>{
    const role=restoreSession(),token=role&&sessionStorage.getItem(role==='admin'?'adminToken':'userToken');
    try {const id=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).id;return {key:`colorlab-music-position-v1:${role}:${id}`,token};} catch {return {key:'colorlab-music-position-v1',token:null};}
  };
  const valid=p=>p&&['x','y'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1);
  const request=(who,method,position)=>fetch('/api/explore/music-preference',{method,headers:{Authorization:`Bearer ${who.token}`,...(method==='PUT'?{'Content-Type':'application/json'}:{})},...(method==='PUT'?{body:JSON.stringify({position})}:{}),signal:AbortSignal.timeout(8000)}).then(response=>{if(!response.ok)throw Error('Preference unavailable');return response.json();});
  const remember=(who,p)=>{try{localStorage.setItem(who.key,JSON.stringify(p));}catch{}};
  const pending=who=>{try{return JSON.parse(localStorage.getItem(who.key+':pending'));}catch{return null;}};
  const upload=(who,item)=>{
    writes=writes.catch(()=>{}).then(()=>request(who,'PUT',item.position)).then(()=>{
      try{if(pending(who)?.version===item.version)localStorage.removeItem(who.key+':pending');}catch{}
    }).catch(()=>{});
  };
  const load=()=>{
    const who=identify();if(who.key===owner?.key){owner=who;return;}owner=who;const version=++revision;
    let cached=null;try{cached=JSON.parse(localStorage.getItem(who.key));}catch{}
    onLoad(valid(cached)?cached:null);
    const unsaved=pending(who);
    if(who.token&&unsaved){upload(who,unsaved);return;}
    if(who.token)request(who,'GET').then(value=>{
      if(revision!==version||owner.key!==who.key)return;
      const point=valid(value.position)?value.position:null;remember(who,point);onLoad(point);
    }).catch(()=>{});
  };
  document.addEventListener('colorlab-page-route',load);
  window.addEventListener('storage',load);window.addEventListener('colorlab:session-changed',load);
  window.addEventListener('online',()=>{const who=identify(),item=pending(who);if(who.token&&item)upload(who,item);});
  load();
  return point=>{
    ++revision;const who=owner||identify();remember(who,point);
    if(who.token){const item={position:point,version:crypto.randomUUID()};try{localStorage.setItem(who.key+':pending',JSON.stringify(item));}catch{}upload(who,item);}
  };
}
