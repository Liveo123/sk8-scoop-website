(() => {
  const root=document.querySelector('[data-search-insights]');
  if(!root) return;
  const token=document.querySelector('[data-admin-token]');
  const loadButton=document.querySelector('[data-load-search-insights]');
  const range=document.querySelector('[data-search-range]');
  const status=document.querySelector('[data-search-insights-status]');
  const topBody=document.querySelector('[data-top-searches]');
  const unmetBody=document.querySelector('[data-unmet-searches]');
  const recentBody=document.querySelector('[data-recent-searches]');

  const setText=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=String(value??'0');};
  const formatDate=value=>{
    if(!value) return '—';
    const date=new Date(String(value).replace(' ','T')+'Z');
    return Number.isNaN(date.getTime())?String(value):new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(date);
  };
  const addCells=(tr,values)=>values.forEach(value=>{const td=document.createElement('td');td.textContent=String(value??'');tr.appendChild(td);});

  const renderTop=rows=>{
    topBody.replaceChildren();
    rows.forEach(row=>{
      const tr=document.createElement('tr');
      addCells(tr,[row.query_text,row.searches,row.avg_results,row.zero_results,formatDate(row.last_seen)]);
      topBody.appendChild(tr);
    });
  };

  const renderUnmet=rows=>{
    unmetBody.replaceChildren();
    rows.forEach(row=>{
      const tr=document.createElement('tr');
      addCells(tr,[row.query_text,row.searches,formatDate(row.last_seen)]);
      unmetBody.appendChild(tr);
    });
  };

  const renderRecent=rows=>{
    recentBody.replaceChildren();
    rows.forEach(row=>{
      const tr=document.createElement('tr');
      addCells(tr,[formatDate(row.created_at),row.query_text,row.result_count,row.search_type,row.search_area,row.source]);
      recentBody.appendChild(tr);
    });
  };

  const load=async()=>{
    const adminToken=token.value.trim();
    if(!adminToken){status.textContent='Enter the Cloudflare admin token first.';return;}
    loadButton.disabled=true;
    status.textContent='Loading search insight…';
    try{
      const days=Number(range.value)||30;
      const response=await fetch(`/api/search-stats?days=${encodeURIComponent(days)}`,{headers:{authorization:`Bearer ${adminToken}`},cache:'no-store'});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||'Could not load search insight');
      setText('[data-total-searches]',data.totals.searches||0);
      setText('[data-unique-searches]',data.totals.unique_queries||0);
      setText('[data-zero-searches]',data.totals.zero_results||0);
      setText('[data-average-results]',data.totals.avg_results||0);
      renderTop(data.top||[]);
      renderUnmet(data.unmet||[]);
      renderRecent(data.recent||[]);
      status.textContent=`Showing the last ${data.days} days. Search terms are stored without email, IP address or device identifiers in the search log.`;
    }catch(error){
      status.textContent=error&&error.message?error.message:'Could not load search insight.';
    }finally{
      loadButton.disabled=false;
    }
  };

  loadButton.addEventListener('click',load);
  range.addEventListener('change',()=>{if(token.value.trim())load();});
  token.addEventListener('keydown',event=>{if(event.key==='Enter')load();});
})();
