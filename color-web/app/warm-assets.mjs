// Warm only the next likely public resources, after the first page is usable.
export function warmAssets() {
  const connection=navigator.connection;
  if(connection?.saveData||/^(slow-)?2g$/.test(connection?.effectiveType||''))return;
  const urls=[innerHeight>innerWidth?'/assets/intro/about-mobile-4k120-v6.mp4':'/assets/intro/about-desktop-4k120-v6.mp4','/assets/music/about-soft-piano-hq.flac'];
  const run=async()=>{
    for(const url of urls){
      if(document.hidden)return;
      try{await fetch(url,{cache:'force-cache',signal:AbortSignal.timeout(12000)});}catch{}
    }
  };
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:5000});else setTimeout(run,2500);
}
