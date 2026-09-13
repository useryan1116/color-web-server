const key='colorlab-tour-v1';
let running=false, attempted=false;
const steps=[
  ['home','從這裡，慢慢認識自己','首頁有色彩互動與心理健康資訊，可以照自己的步調探索。'],
  ['surveys','選一份測驗，開始探索','到「測驗」看看有哪些主題。結果是自我覺察的參考，不是診斷。'],
  ['history','回頭看看每一次的自己','完成的測驗可以在「紀錄」查看，再次閱讀那一次的結果。'],
  ['me','你的設定，都在這裡','到「我的」管理帳號、查看使用說明，也能找到關於 ColorLab。'],
  ['install','第一次來，從這裡開始','「初次使用 ColorLab？」整理了使用方式、紀錄保存與加入主畫面的步驟，之後想查也能隨時回來。']
];
export function offerTour(){
  if(running||attempted||!['','#home'].includes(location.hash))return;
  try{if(localStorage.getItem(key))return;}catch{}
  attempted=true;
  // Wait for the existing brief brand entrance, without delaying page data.
  setTimeout(()=>{if(['','#home'].includes(location.hash)&&!document.querySelector('dialog[open]'))openTour();},900);
}
function openTour(){
  running=true;
  let index=0,frame,closed=false,lastRect='';
  const prior=document.activeElement,previousScroll=window.scrollY;
  const dialog=document.createElement('dialog');dialog.className='first-tour';
  dialog.setAttribute('aria-labelledby','tour-title');dialog.setAttribute('aria-describedby','tour-copy');
  dialog.innerHTML='<div class="tour-spot" aria-hidden="true"></div><section class="tour-card"><p class="tour-count" aria-live="polite"></p><h2 id="tour-title"></h2><p id="tour-copy"></p><div class="tour-actions"><button type="button" data-skip>跳過導覽</button><button type="button" data-back>上一步</button><button type="button" data-next>下一步</button></div><div data-tour-music></div></section>';
  const spot=dialog.querySelector('.tour-spot'),card=dialog.querySelector('.tour-card');
  const next=dialog.querySelector('[data-next]'),back=dialog.querySelector('[data-back]');
  const gesture=()=>document.dispatchEvent(new Event('colorlab-tour-gesture'));
  function close(save=true){
    if(closed)return;closed=true;running=false;cancelAnimationFrame(frame);
    if(save)try{localStorage.setItem(key,'1');}catch{}
    if(save){const url=new URL(location.href);if(url.searchParams.has('tour')){url.searchParams.delete('tour');history.replaceState(history.state,'',url);}}
    document.dispatchEvent(new Event('colorlab-tour-close'));
    dialog.close();dialog.remove();window.removeEventListener('hashchange',routeExit);
    window.removeEventListener('pagehide',routeExit);
    if(save){window.scrollTo({top:previousScroll,behavior:'instant'});if(prior?.isConnected)prior.focus({preventScroll:true});}
  }
  const routeExit=()=>close(false);
  function position(){
    if(closed)return;
    const target=document.querySelector(steps[index][0]==='install'?'.first-use-link':`#navigation a[href="#${steps[index][0]}"]`);
    if(!target){close(false);return;}
    const r=target.getBoundingClientRect(),w=innerWidth,h=innerHeight;
    const signature=[r.x,r.y,r.width,r.height,w,h,index].join();
    if(signature!==lastRect){
      lastRect=signature;
      const x=Math.max(6,r.left-7),y=Math.max(6,r.top-7),right=Math.min(w-6,r.right+7),bottom=Math.min(h-6,r.bottom+7);
      Object.assign(spot.style,{left:`${x}px`,top:`${y}px`,width:`${right-x}px`,height:`${bottom-y}px`});
      const cw=Math.min(360,w-24);card.style.width=`${cw}px`;
      const ch=card.getBoundingClientRect().height;
      Object.assign(card.style,{left:`${Math.max(12,Math.min(w-cw-12,r.left+r.width/2-cw/2))}px`,top:`${Math.max(12,Math.min(h-ch-12,bottom+ch+24<h?bottom+18:y-ch-18))}px`});
    }
    frame=requestAnimationFrame(position);
  }
  function show(){
    dialog.querySelector('.tour-count').textContent=`認識 ColorLab · ${index+1} / ${steps.length}`;
    dialog.querySelector('#tour-title').textContent=steps[index][1];dialog.querySelector('#tour-copy').textContent=steps[index][2];
    back.disabled=index===0;next.textContent=index===steps.length-1?'開始探索':'下一步';lastRect='';
    next.focus({preventScroll:true});
    if(steps[index][0]==='install')document.querySelector('.first-use-link')?.scrollIntoView({block:'center',behavior:'instant'});
  }
  next.onclick=()=>{gesture();if(index===steps.length-1)close();else{index++;show();}};
  back.onclick=()=>{gesture();if(index>0){index--;show();}};
  dialog.querySelector('[data-skip]').onclick=()=>{gesture();close();};
  dialog.addEventListener('cancel',event=>{event.preventDefault();gesture();close();});
  window.addEventListener('hashchange',routeExit);window.addEventListener('pagehide',routeExit);
  document.body.append(dialog);dialog.showModal();
  try{localStorage.setItem(key,'1');}catch{}
  document.dispatchEvent(new CustomEvent('colorlab-tour-open',{detail:dialog.querySelector('[data-tour-music]')}));
  show();position();
}
