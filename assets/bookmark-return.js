(()=>{'use strict';
  if(location.pathname!=='/' && location.pathname!=='/whats-on/' && location.pathname!=='/whats-on')return;
  const key='sk8-bookmark-reminder-dismissed-until';
  try{if(Number(localStorage.getItem(key))>Date.now())return;}catch(_){}
  let shown=false,scrollActive=false,elapsed=false;
  const style=document.createElement('style');style.textContent=`
  .sk8-bookmark-nudge{position:fixed;z-index:90;right:16px;bottom:16px;width:min(376px,calc(100vw - 32px));background:#fff9ed;border:2px solid #0f6470;border-radius:14px;box-shadow:0 14px 45px #132d3140;color:#132d31;padding:19px 18px 18px;font-family:Inter,Arial,sans-serif;line-height:1.45}
  .sk8-bookmark-nudge h2{font-size:1.12rem;line-height:1.25;margin:0 30px 9px 0;color:#12383d}
  .sk8-bookmark-nudge p{margin:0 0 12px;font-size:.94rem}
  .sk8-bookmark-nudge button{font:inherit;cursor:pointer}
  .sk8-bookmark-nudge .sk8-bookmark-close{position:absolute;right:9px;top:7px;width:34px;height:34px;border:0;background:transparent;color:#12383d;font-size:1.5rem}
  .sk8-bookmark-nudge .sk8-bookmark-action{background:#0b525b;color:#fff;border:0;border-radius:7px;min-height:44px;padding:9px 13px;font-weight:700}
  .sk8-bookmark-nudge .sk8-bookmark-later{border:0;background:transparent;color:#0b525b;font-weight:700;padding:10px;margin-left:4px;text-decoration:underline}
  .sk8-bookmark-nudge .sk8-bookmark-instructions{margin-top:10px;padding-top:10px;border-top:1px solid #d9dfda;font-size:.9rem}
  @media(max-width:480px){.sk8-bookmark-nudge{bottom:10px;right:10px;width:calc(100vw - 20px);padding:15px}.sk8-bookmark-nudge h2{font-size:1.04rem}}
  @media(prefers-reduced-motion:no-preference){.sk8-bookmark-nudge{animation:sk8BookmarkIn .25s ease-out}@keyframes sk8BookmarkIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}}
  `;document.head.appendChild(style);
  const dismiss=()=>{try{localStorage.setItem(key,String(Date.now()+30*24*60*60*1000));}catch(_){}document.querySelector('.sk8-bookmark-nudge')?.remove();};
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid=/Android/.test(navigator.userAgent);
  const instructions=isIOS?'In Safari, tap Share, then Add Bookmark or Add to Home Screen.':isAndroid?'In your browser menu (⋮), choose Bookmark or Add to Home screen.':'Press Ctrl+D (Windows) or Command+D (Mac) to bookmark this page.';
  const show=()=>{
    if(shown||!elapsed||!scrollActive)return;shown=true;
    const section=document.createElement('aside');section.className='sk8-bookmark-nudge';section.setAttribute('aria-label','Save SK8 Scoop for later');
    section.innerHTML='<button class="sk8-bookmark-close" type="button" aria-label="Dismiss bookmark reminder">×</button><h2>Next time you wonder what to do…</h2><p>Keep SK8 Scoop handy for local events, free days out, walks and things worth discovering.</p><button class="sk8-bookmark-action" type="button" aria-expanded="false">How to save this site</button><button class="sk8-bookmark-later" type="button">Not now</button><div class="sk8-bookmark-instructions" hidden></div>';
    const details=section.querySelector('.sk8-bookmark-instructions');details.textContent=instructions;
    section.querySelector('.sk8-bookmark-action').addEventListener('click',e=>{details.hidden=!details.hidden;e.currentTarget.setAttribute('aria-expanded',String(!details.hidden));});
    section.querySelector('.sk8-bookmark-close').addEventListener('click',dismiss);
    section.querySelector('.sk8-bookmark-later').addEventListener('click',dismiss);
    document.body.appendChild(section);
  };
  const onScroll=()=>{if(window.scrollY>Math.max(320,document.documentElement.scrollHeight*.2)){scrollActive=true;window.removeEventListener('scroll',onScroll);show();}};
  window.addEventListener('scroll',onScroll,{passive:true});setTimeout(()=>{elapsed=true;show();},18000);
})();
