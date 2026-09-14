import { showIntro } from './intro-entry.mjs?v=20260914d';
const companions = [
  ['red','紅色','帶著一點好奇，開始吧。'],
  ['yellow','黃色','新的發現，也許就在下一個選擇。'],
  ['green','綠色','慢慢來，照自己的步調。'],
  ['blue','藍色','每一面，都值得好好看看。']
];
export function aboutView() {
  return `<article class="about-colorlab">
  <div class="about-toolbar"><a class="back-link" href="/app/#home">← 回到首頁</a><span data-about-music></span></div>
  <section class="about-hero about-final-hero"><h1 class="about-scene-text">關於 ColorLab</h1><div class="about-final-scene">
  <picture><source media="(orientation:portrait)" srcset="/assets/intro/about-mobile-final-v6.webp"><img class="about-final-poster" src="/assets/intro/about-desktop-final-v6.webp" alt="" fetchpriority="high"></picture>
  <div class="about-stage" aria-label="點選角色，看看它的招呼">${companions.map(([key,label,saying],i)=>`<button type="button" class="about-character" data-companion="${key}" style="--order:${i}" aria-label="${label}角色，點一下打招呼"><span class="about-saying" hidden>${saying}</span></button>`).join('')}</div><p class="about-dialogue" role="status" aria-live="polite"></p></div>
  <p class="about-scene-text">每一種顏色，都值得被理解。留一點時間，遇見自己</p><button type="button" class="about-scroll-cue"><span aria-hidden="true">⌄</span>往下探索</button></section>
  <section class="about-intention"><h2>為什麼有 ColorLab？</h2><p>對心理健康與自殺防治議題的關注，是我想做這個網站的起點。我希望能做一個容易接近的自我探索工具，讓人有機會停下來，留意自己的感受、想法，以及面對生活時的習慣。</p><p>我也對人格與色彩之間的關係感到好奇，於是從專題研究開始，嘗試把兩者放在一起探索，慢慢發展成現在的 ColorLab。</p></section>
  <div class="about-columns"><section><h2>從日常選擇，覺察自己</h2><p>有時候，直接回答「我是怎樣的人」並不容易。ColorLab 希望透過日常情境的選擇與色彩呈現，提供一個思考的起點：哪些描述像自己？哪些不太像？比起得到一個類型，更希望你能從中注意到自己的感受與偏好。</p></section><section><h2>認識自己，也看見自己的需要</h2><p>自我探索不必停在測驗結果。網站也整理心理健康資訊與求助資源，希望在你想進一步了解、或需要支持時，能更容易找到下一步。測驗不能解決所有困難，但希望這裡能成為你開始關心自己的入口。</p></section></div>
  <aside class="about-boundary" aria-labelledby="about-boundary-title"><h2 id="about-boundary-title">這份測驗能做的，以及不能做的</h2><p>本測驗提供自我探索參考，不能判斷自殺風險，也不能取代心理或醫療專業評估。每次結果都只是當次作答的呈現。</p><a href="/app/#home">到首頁查看心理健康資訊 →</a></aside>
  <section class="about-email"><h2>留下你的訊息</h2><form id="contact-form" class="form-stack about-contact"><label>稱呼（必填）<input name="name" required autocomplete="name" maxlength="80"></label><label>回覆 Email（必填）<input name="email" required type="email" autocomplete="email" maxlength="254"></label><label>訊息內容（必填）<textarea name="description" rows="5" required maxlength="5000" placeholder="你想詢問的問題，或對網站的建議"></textarea></label><p class="hint">訊息會儲存於管理後台，並透過郵件服务通知網站負責人。請勿填寫密碼或敏感個資；此表單不提供即時心理支持。</p><p class="form-status" role="status" aria-live="polite"></p><button type="submit" class="button primary">送出訊息</button></form></section>
  </article>`;
}
export function bindAbout(root) {
  document.dispatchEvent(new Event('colorlab-about-ready'));
  showIntro();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollCue=root.querySelector('.about-scroll-cue');
  const arrow=scrollCue?.querySelector('span');
  arrow?.getAnimations().forEach(animation=>animation.cancel());
  arrow?.animate?.([{transform:'translateY(0)',opacity:.5},{transform:'translateY(9px)',opacity:1},{transform:'translateY(0)',opacity:.5}],{duration:1600,easing:'ease-in-out',iterations:Infinity});
  if(scrollCue)scrollCue.onclick=()=>{const heading=root.querySelector('.about-intention h2');if(!heading)return;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});heading.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});};
  let timeout;
  const dialogue=root.querySelector('.about-dialogue');
  root.querySelectorAll('[data-companion]').forEach(button=>{
    button.onclick=()=>{
      clearTimeout(timeout);
      root.querySelectorAll('.is-speaking').forEach(other=>other.classList.remove('is-speaking'));
      dialogue.textContent=button.querySelector('.about-saying').textContent;
      dialogue.dataset.companion=button.dataset.companion;
      button.classList.add('is-speaking');
      button.getAnimations().forEach(a=>a.cancel());
      dialogue.animate?.([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'});
      timeout=setTimeout(()=>{button.classList.remove('is-speaking');dialogue.textContent='';delete dialogue.dataset.companion;},3500);
    };
  });
}
