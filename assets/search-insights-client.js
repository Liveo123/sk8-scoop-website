(() => {
  const form=document.querySelector('[data-search-form]');
  const input=document.querySelector('[data-search-input]');
  const status=document.querySelector('[data-search-status]');
  if(!form||!input||!status) return;

  const STORAGE_KEY='sk8_search_event_last_v1';
  const normalise=value=>String(value||'').normalize('NFKD').replace(/[’‘]/g,"'").replace(/[^a-zA-Z0-9£]+/g,' ').toLowerCase().replace(/\s+/g,' ').trim();
  const selected=(selector,key)=>document.querySelector(`${selector}[aria-pressed="true"]`)?.dataset[key]||'all';
  const countResults=()=>document.querySelectorAll('.search-result-card').length;
  const initialSource=()=>{
    const requested=(new URLSearchParams(location.search).get('source')||'').trim().toLowerCase();
    if(requested==='header') return 'header';
    try{
      const ref=document.referrer?new URL(document.referrer):null;
      if(ref&&ref.origin===location.origin&&(ref.pathname==='/'||ref.pathname==='/index.html')) return 'homepage';
    }catch(_){}
    return 'direct';
  };

  const recentlyLogged=key=>{
    try{
      const prior=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null');
      return Boolean(prior&&prior.key===key&&Date.now()-Number(prior.at||0)<15000);
    }catch(_){return false;}
  };
  const remember=key=>{try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify({key,at:Date.now()}));}catch(_){}};

  const record=(source)=>{
    const query=input.value.trim();
    if(normalise(query).length<2) return;
    const payload={
      query,
      result_count:countResults(),
      search_type:selected('[data-search-type]','searchType'),
      search_area:selected('[data-search-area]','searchArea'),
      source
    };
    const key=[normalise(query),payload.result_count,payload.search_type,payload.search_area,source].join('|');
    if(recentlyLogged(key)) return;
    remember(key);
    fetch('/api/search-event',{
      method:'POST',
      headers:{'content-type':'application/json','accept':'application/json'},
      body:JSON.stringify(payload),
      keepalive:true
    }).catch(()=>{});
  };

  form.addEventListener('submit',()=>{
    // search.js renders synchronously in its earlier submit listener.
    setTimeout(()=>record('search_page'),0);
  });

  const initialQuery=new URLSearchParams(location.search).get('q')||'';
  if(normalise(initialQuery).length>=2){
    let done=false;
    const tryInitial=()=>{
      if(done) return;
      const text=String(status.textContent||'');
      if(/loading/i.test(text)||/could not load/i.test(text)) return;
      done=true;
      record(initialSource());
    };
    const observer=new MutationObserver(()=>{tryInitial();if(done)observer.disconnect();});
    observer.observe(status,{childList:true,subtree:true,characterData:true});
    setTimeout(tryInitial,0);
  }
})();