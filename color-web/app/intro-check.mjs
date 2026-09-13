// Temporary opt-in, on-device comparison. No persistence or result upload.
export const cases=[
  ['原尺寸・120 幀・H.264','2560 × 3840','about-mobile-4k120-v6.mp4'],
  ['原尺寸・120 幀・HEVC','2560 × 3840','about-mobile-4k120-hevc-v7.mp4'],
  ['只降低幀率・60 幀・HEVC','2560 × 3840','diagnostics/mobile-full-60-hevc.mp4'],
  ['只降低尺寸・120 幀・HEVC','1920 × 2880','diagnostics/mobile-small-120-hevc.mp4'],
  ['降低尺寸及幀率・60 幀・HEVC','1920 × 2880','diagnostics/mobile-small-60-hevc.mp4'],
  ['相同尺寸及幀率・60 幀・H.264','1920 × 2880','diagnostics/mobile-small-60-avc.mp4']
];
const start=document.querySelector('#start'),stop=document.querySelector('#stop'),status=document.querySelector('#status');
const screen=document.querySelector('#screen'),results=document.querySelector('#results');
let running=false,cancel;
function probe(file,output){
  return new Promise(resolve=>{
    const video=document.createElement('video');let finished=false,timer;
    const done=message=>{
      if(finished)return;finished=true;clearTimeout(timer);cancel=null;
      output.textContent=`${message}；讀取尺寸 ${video.videoWidth} × ${video.videoHeight}；播放 ${video.currentTime.toFixed(2)} 秒；錯誤代碼 ${video.error?.code||0}`;
      video.pause();video.removeAttribute('src');video.load();resolve();
    };
    cancel=()=>done('已停止');video.muted=true;video.defaultMuted=true;video.playsInline=true;
    video.setAttribute('playsinline','');video.setAttribute('muted','');video.preload='auto';
    video.addEventListener('ended',()=>done('播放完成'),{once:true});
    video.addEventListener('error',()=>done('來源或解碼失敗'),{once:true});
    screen.replaceChildren(video);video.src='/assets/intro/'+file;
    timer=setTimeout(()=>done(document.hidden?'頁面在背景，請留在畫面重測':'載入或播放逾時'),15000);
    video.play().catch(error=>done(error?.name==='NotAllowedError'?'瀏覽器阻擋播放，不能據此判定格式不支援':'播放請求失敗'));
  });
}
start.onclick=async()=>{
  if(running)return;running=true;start.disabled=true;stop.disabled=false;results.replaceChildren();
  try{
    for(const [index,[label,size,file]] of cases.entries()){
      if(!running)break;status.textContent=`正在測試第 ${index+1} / ${cases.length} 項`;
      const row=document.createElement('li'),heading=document.createElement('strong'),output=document.createElement('span');
      heading.textContent=`${label}（${size}）`;output.textContent='載入中';row.append(heading,output);results.append(row);
      await probe(file,output);
    }
    status.textContent=running?'測試完成，請截圖六項結果':'測試已停止，可重新開始';
  }finally{running=false;start.disabled=false;stop.disabled=true;}
};
stop.onclick=()=>{running=false;cancel?.();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){running=false;cancel?.();}});
window.addEventListener('pagehide',()=>{running=false;cancel?.();});
