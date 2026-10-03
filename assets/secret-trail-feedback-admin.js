(() => {
  const root=document.querySelector('[data-secret-trail-feedback-admin]');
  if(!root)return;
  const token=document.querySelector('[data-admin-token]');
  const range=document.querySelector('[data-feedback-range]');
  const campaign=document.querySelector('[data-feedback-campaign]');
  const button=document.querySelector('[data-load-secret-trail-feedback]');
  const status=document.querySelector('[data-secret-trail-feedback-status]');

  const labels={
    completed:'Completed whole trail',partly:'Tried part of it',looked_only:'Looked only',
    under_7:'Under 7','7_9':'7–9','10_12':'10–12','13_14':'13–14', '15_plus':'15+',not_applicable:'Not applicable',
    under_45:'Under 45 minutes','45_60':'45–60 minutes','61_75':'61–75 minutes',over_75:'Over 75 minutes',did_not_finish:'Did not finish',
    none:'None',main_1:'Main clue 1',main_2:'Main clue 2',main_3:'Main clue 3',main_4:'Main clue 4',main_5:'Main clue 5',
    side_cases:'Side case',final_deduction:'Final deduction',route:'Route / next stop',instructions:'Instructions',other:'Other',
    hard_to_see:'Hard to see',instructions_unclear:'Unclear instructions',route_problem:'Route / crossing problem',safety_concern:'Safety concern',
    changed_outdated:'Changed / out of date',child_bored:'Children lost interest',yes:'Yes',maybe:'Maybe',no:'No'
  };
  const label=value=>labels[value]||String(value||'—').replace(/_/g,' ');
  const ageLabel=value=>String(value||'').split(',').filter(Boolean).map(label).join(', ')||'—';
  const formatDate=value=>{
    if(!value)return '—';
    const d=new Date(String(value).replace(' ','T')+'Z');
    return Number.isNaN(d.getTime())?String(value):new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(d);
  };
  const addCells=(tr,values)=>values.forEach(value=>{const td=document.createElement('td');td.textContent=String(value??'');tr.appendChild(td);});
  const renderCounts=(selector,counts)=>{
    const body=document.querySelector(selector);body.replaceChildren();
    Object.entries(counts||{}).sort((a,b)=>Number(b[1])-Number(a[1])||label(a[0]).localeCompare(label(b[0]))).forEach(([key,value])=>{
      const tr=document.createElement('tr');addCells(tr,[label(key),value]);body.appendChild(tr);
    });
    if(!body.children.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=2;td.textContent='No responses in this range.';tr.appendChild(td);body.appendChild(tr);}
  };
  const renderRecent=rows=>{
    const body=document.querySelector('[data-feedback-recent]');body.replaceChildren();
    rows.forEach(row=>{
      const tr=document.createElement('tr');
      addCells(tr,[formatDate(row.created_at),label(row.completion_status),ageLabel(row.age_bands),label(row.issue_type),row.problem_text||'—',row.best_bit||'—',label(row.would_do_another)]);
      body.appendChild(tr);
    });
    if(!body.children.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=7;td.textContent='No written feedback in this range.';tr.appendChild(td);body.appendChild(tr);}
  };

  const load=async()=>{
    const adminToken=token.value.trim();
    if(!adminToken){status.textContent='Enter the Cloudflare admin token first.';return;}
    button.disabled=true;status.textContent='Loading feedback…';
    try{
      const params=new URLSearchParams({days:String(Number(range.value)||30)});
      if(campaign.value.trim())params.set('campaign',campaign.value.trim());
      const response=await fetch('/api/secret-trail-feedback-stats?'+params.toString(),{headers:{authorization:'Bearer '+adminToken},cache:'no-store'});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Could not load feedback');
      const summary=data.summary||{};
      document.querySelector('[data-feedback-total]').textContent=summary.total||0;
      document.querySelector('[data-feedback-completed]').textContent=(summary.completion&&summary.completion.completed)||0;
      document.querySelector('[data-feedback-another-yes]').textContent=(summary.would_do_another&&summary.would_do_another.yes)||0;
      const noProblem=(summary.issue_type&&summary.issue_type.none)||0;
      document.querySelector('[data-feedback-problems]').textContent=Math.max(0,Number(summary.total||0)-Number(noProblem));
      renderCounts('[data-hardest-body]',summary.hardest||{});
      renderCounts('[data-issue-body]',summary.issue_type||{});
      renderCounts('[data-duration-body]',summary.duration||{});
      renderRecent(data.recent||[]);
      status.textContent='Showing '+(data.campaign==='all'?'all campaigns':data.campaign)+' from the last '+data.days+' days.';
    }catch(error){
      status.textContent=error&&error.message?error.message:'Could not load Secret Trail feedback.';
    }finally{button.disabled=false;}
  };

  button.addEventListener('click',load);
  range.addEventListener('change',()=>{if(token.value.trim())load();});
  campaign.addEventListener('keydown',event=>{if(event.key==='Enter')load();});
  token.addEventListener('keydown',event=>{if(event.key==='Enter')load();});
})();