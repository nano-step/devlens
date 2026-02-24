export function getInspectorScript(sessionId: string): string {
  return `(function(){
var SESSION='${sessionId}';
var CATS={network:'NET','null-access':'NULL','undefined-data':'UNDEF','render-data':'RENDER','unhandled-error':'ERR','unhandled-rejection':'REJ','type-mismatch':'TYPE'};
var CAT_CSS={network:'net','null-access':'null','undefined-data':'undef','render-data':'render','unhandled-error':'err','unhandled-rejection':'rej','type-mismatch':'type'};
var issues=[];
var activeTab='issues';
var sevFilter='all';
var catFilter='all';
var searchQuery='';
var expandedId=null;
var autoScroll=true;
var aiModel='gemini-2.5-flash-lite';
var aiResult=null;
var aiLoading=false;
var aiError=null;
var channel=null;

try{channel=new BroadcastChannel('devlens-'+SESSION)}catch(e){}

function send(msg){
  if(channel)try{channel.postMessage(msg);return}catch(e){}
  if(window.opener)window.opener.postMessage(msg,'*');
}

function onMsg(data){
  if(!data||data.sessionId!==SESSION)return;
  if(data.type==='devlens:issue'){issues.push(data.payload);render()}
  if(data.type==='devlens:sync'){issues=data.payload.slice();render()}
  if(data.type==='devlens:clear'){issues=[];aiResult=null;render()}
  if(data.type==='devlens:ping'){send({type:'devlens:pong',sessionId:SESSION})}
}

if(channel)channel.onmessage=function(e){onMsg(e.data)};
window.addEventListener('message',function(e){onMsg(e.data)});
send({type:'devlens:ready',sessionId:SESSION});

function $(id){return document.getElementById(id)}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function relTime(ts){var d=Date.now()-ts;if(d<1000)return'now';if(d<60000)return Math.floor(d/1000)+'s ago';if(d<3600000)return Math.floor(d/60000)+'m ago';return Math.floor(d/3600000)+'h ago'}

function filtered(){
  return issues.filter(function(i){
    if(sevFilter!=='all'&&i.severity!==sevFilter)return false;
    if(catFilter!=='all'&&i.category!==catFilter)return false;
    if(searchQuery){var q=searchQuery.toLowerCase();if(i.message.toLowerCase().indexOf(q)<0&&(!i.path||i.path.toLowerCase().indexOf(q)<0)&&(!i.source||i.source.toLowerCase().indexOf(q)<0)&&i.category.toLowerCase().indexOf(q)<0)return false}
    return true;
  });
}

function catCounts(){
  var c={};issues.forEach(function(i){c[i.category]=(c[i.category]||0)+1});return c;
}

function render(){
  renderNav();renderTopbar();renderContent();renderStatusbar();
}

function renderNav(){
  var el=$('nav-issues-count');if(el)el.textContent=issues.length||'';
  var conn=$('conn-dot');var connText=$('conn-text');
  if(conn&&connText){conn.className='conn-dot on';connText.textContent='Connected'}
}

function renderTopbar(){
  var title=$('topbar-title');
  if(title){
    var titles={issues:'Issues',timeline:'Timeline',ai:'AI Analysis',settings:'Settings'};
    title.textContent=titles[activeTab]||'';
  }
  var controls=$('topbar-controls');
  if(!controls)return;
  if(activeTab==='issues'||activeTab==='timeline'){controls.classList.remove('hidden')}
  else{controls.classList.add('hidden')}
  var btns=controls.querySelectorAll('.sev-btn');
  btns.forEach(function(b){
    b.className='sev-btn';
    var v=b.getAttribute('data-sev');
    if(v===sevFilter){b.className='sev-btn '+(v==='all'?'active':'active-'+v)}
  });
}

function renderContent(){
  var el=$('content');if(!el)return;
  if(activeTab==='issues')renderIssues(el);
  else if(activeTab==='timeline')renderTimeline(el);
  else if(activeTab==='ai')renderAI(el);
  else if(activeTab==='settings')renderSettings(el);
}

function renderIssues(el){
  var f=filtered();
  if(f.length===0){
    el.innerHTML='<div class="empty-state"><div class="empty-logo">'+LOGO_SVG+'</div><div class="empty-title">No issues detected yet</div><div class="empty-sub">DevLens is watching your application for runtime errors, null access, API failures, and more.</div></div>';
    return;
  }
  var html='';
  f.forEach(function(i){
    var exp=expandedId===i.id;
    html+='<div class="issue-row'+(exp?' expanded':'')+'" data-id="'+esc(i.id)+'">';
    html+='<div class="issue-sev-bar '+i.severity+'"></div>';
    html+='<span class="issue-badge '+i.severity+'">'+(CATS[i.category]||'DL')+'</span>';
    html+='<div class="issue-body"><div class="issue-msg">'+esc(i.message)+'</div>';
    html+='<div class="issue-meta">';
    if(i.source)html+='<span class="issue-source">'+esc(i.source)+'</span>';
    html+='<span>'+esc(i.category)+'</span>';
    html+='<span class="issue-time">'+relTime(i.timestamp)+'</span>';
    html+='</div></div></div>';
    html+='<div class="issue-detail">';
    if(i.path)html+='<div class="detail-row"><span class="detail-label">Path</span><span class="detail-value mono">'+esc(i.path)+'</span></div>';
    if(i.foundValue!==undefined){var v=i.foundValue===null?'null':String(i.foundValue);html+='<div class="detail-row"><span class="detail-label">Value</span><span class="detail-value mono">'+esc(v)+'</span></div>'}
    if(i.source)html+='<div class="detail-row"><span class="detail-label">Source</span><span class="detail-value">'+esc(i.source)+'</span></div>';
    if(i.suggestion)html+='<div class="detail-suggestion">'+esc(i.suggestion)+'</div>';
    if(i.stack)html+='<div class="detail-stack">'+esc(i.stack.split('\\n').slice(0,5).join('\\n'))+'</div>';
    html+='<div class="detail-actions"><button class="btn btn-brand" data-ai-id="'+esc(i.id)+'">Analyze with AI</button></div>';
    html+='</div>';
  });
  el.innerHTML=html;
  el.querySelectorAll('.issue-row').forEach(function(row){
    row.addEventListener('click',function(){
      var id=row.getAttribute('data-id');
      expandedId=expandedId===id?null:id;
      renderContent();
    });
  });
  el.querySelectorAll('[data-ai-id]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var id=btn.getAttribute('data-ai-id');
      var issue=issues.find(function(i){return i.id===id});
      if(issue){switchTab('ai');analyzeIssues([issue])}
    });
  });
  if(autoScroll)el.scrollTop=el.scrollHeight;
}

function renderTimeline(el){
  var f=filtered();
  if(f.length===0){el.innerHTML='<div class="empty-state"><div class="empty-title">No issues to display</div><div class="empty-sub">Adjust your filters or wait for issues.</div></div>';return}
  var html='';
  f.forEach(function(i){
    html+='<div class="tl-item"><div class="tl-line"></div><div class="tl-dot '+i.severity+'"></div>';
    html+='<div class="tl-content"><div class="tl-time">'+relTime(i.timestamp)+'</div>';
    html+='<div class="tl-msg">'+esc(i.message)+'</div>';
    html+='<div class="tl-cat"><span class="issue-badge '+i.severity+'">'+(CATS[i.category]||'DL')+'</span> '+esc(i.category)+'</div>';
    html+='</div></div>';
  });
  el.innerHTML=html;
}

var SYSTEM_PROMPT='You are DevLens AI - an expert JavaScript/TypeScript runtime error analyst. Analyze the following detected runtime issues from a web application and provide structured analysis.\\n\\nRESPOND IN VALID JSON with this exact structure:\\n{\\n  "summary": "1-2 sentence overview of the application health based on detected issues",\\n  "criticalIssues": [{"title": "...", "severity": "critical|warning|info", "description": "...", "rootCause": "...", "fix": "...", "affectedPath": "..."}],\\n  "patterns": [{"title": "...", "description": "...", "relatedIssues": ["issue-id-1"]}],\\n  "suggestions": [{"title": "...", "priority": "high|medium|low", "description": "...", "codeExample": "..."}]\\n}\\n\\nRules:\\n- Focus on runtime issues: null access, undefined data, API failures, unhandled errors\\n- Identify patterns: are multiple issues related? Is there a common root cause?\\n- Provide specific, actionable fix suggestions with code examples when possible\\n- For network issues: suggest error handling, retry logic, fallback UI\\n- For null/undefined: suggest optional chaining, default values, loading states\\n- For unhandled errors: suggest error boundaries, try-catch, validation\\n- Be specific with property paths and component names from the issue data\\n- If no real issues found, acknowledge the app is healthy';

function formatIssuesForAI(list){
  return list.map(function(i,idx){
    var lines=['Issue '+(idx+1)+':','  ID: '+i.id,'  Severity: '+i.severity,'  Category: '+i.category,'  Message: '+i.message];
    if(i.path)lines.push('  Path: '+i.path);
    if(i.foundValue!==undefined)lines.push('  Value: '+(i.foundValue===null?'null':String(i.foundValue)));
    if(i.source)lines.push('  Source: '+i.source);
    if(i.suggestion)lines.push('  Suggestion: '+i.suggestion);
    if(i.stack)lines.push('  Stack: '+i.stack.split('\\n').slice(0,3).join(' | '));
    return lines.join('\\n');
  }).join('\\n\\n');
}

function analyzeIssues(list){
  if(aiLoading||list.length===0)return;
  aiLoading=true;aiError=null;aiResult=null;
  renderContent();
  var userPrompt='Detected '+list.length+' runtime issues:\\n\\n'+formatIssuesForAI(list);
  fetch('https://proxy.hoainho.info/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer hoainho'},
    body:JSON.stringify({model:aiModel,messages:[{role:'system',content:SYSTEM_PROMPT},{role:'user',content:userPrompt}],max_tokens:4096,temperature:0.3})
  }).then(function(r){
    if(!r.ok)throw new Error('API error: '+r.status+' '+r.statusText);
    return r.json();
  }).then(function(data){
    var content=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
    if(!content)throw new Error('Empty response from AI');
    var text=content.trim();
    if(text.startsWith('\`\`\`')){var nl=text.indexOf('\\n');text=text.slice(nl+1);var lf=text.lastIndexOf('\`\`\`');if(lf>0)text=text.slice(0,lf)}
    try{aiResult=JSON.parse(text.trim())}catch(e){aiResult={summary:text.slice(0,500),criticalIssues:[],patterns:[],suggestions:[{title:'Raw Analysis',priority:'info',description:text.slice(0,2000)}]}}
    aiResult._model=aiModel;
    aiResult._tokens=data.usage?data.usage.total_tokens:0;
    aiResult._latency=0;
    aiLoading=false;renderContent();
  }).catch(function(err){
    aiError=err.message||'Unknown error';aiLoading=false;renderContent();
  });
}

function renderAI(el){
  var html='<div class="ai-panel">';
  html+='<div class="ai-controls">';
  html+='<select class="ai-select" id="ai-model-select">';
  ['gemini-2.5-flash-lite','gemini-2.5-flash','gemini-3-flash-preview','claude-sonnet-4-6','gpt-5','gpt-5.1-codex-mini'].forEach(function(m){
    html+='<option value="'+m+'"'+(m===aiModel?' selected':'')+'>'+m+'</option>';
  });
  html+='</select>';
  html+='<button class="ai-analyze-btn" id="ai-analyze-btn"'+(aiLoading||issues.length===0?' disabled':'')+'>Analyze All Issues ('+issues.length+')</button>';
  html+='</div>';

  if(aiLoading){
    html+='<div class="ai-loading"><div class="ai-spinner"></div><div class="ai-loading-text">Analyzing with '+esc(aiModel)+'...</div></div>';
  }
  if(aiError){
    html+='<div class="ai-error"><div class="ai-error-dot"></div>'+esc(aiError)+'<button class="btn btn-ghost" id="ai-retry" style="margin-left:auto">Retry</button></div>';
  }
  if(aiResult&&!aiLoading){
    html+='<div class="ai-results">';
    html+='<div class="ai-summary"><div class="ai-summary-title">Summary</div>';
    if(aiResult._model)html+='<div class="ai-summary-meta"><span>'+esc(aiResult._model)+'</span>'+(aiResult._tokens?'<span>'+aiResult._tokens+' tokens</span>':'')+'</div>';
    html+='<div class="ai-summary-text">'+esc(aiResult.summary||'')+'</div></div>';

    if(aiResult.criticalIssues&&aiResult.criticalIssues.length>0){
      html+='<div class="ai-section critical"><div class="ai-section-header">Critical Issues<span class="count">'+aiResult.criticalIssues.length+'</span></div>';
      aiResult.criticalIssues.forEach(function(item,idx){html+=renderAIItem(item,'ci-'+idx)});
      html+='</div>';
    }
    if(aiResult.patterns&&aiResult.patterns.length>0){
      html+='<div class="ai-section patterns"><div class="ai-section-header">Patterns Detected<span class="count">'+aiResult.patterns.length+'</span></div>';
      aiResult.patterns.forEach(function(item,idx){html+=renderAIItem(item,'pa-'+idx)});
      html+='</div>';
    }
    if(aiResult.suggestions&&aiResult.suggestions.length>0){
      html+='<div class="ai-section suggestions"><div class="ai-section-header">Suggestions<span class="count">'+aiResult.suggestions.length+'</span></div>';
      aiResult.suggestions.forEach(function(item,idx){html+=renderAIItem(item,'su-'+idx)});
      html+='</div>';
    }
    html+='<div class="ai-disclaimer">AI analysis may contain inaccuracies. Always verify suggestions before implementing.</div>';
    html+='</div>';
  }
  if(!aiResult&&!aiLoading&&!aiError){
    html+='<div class="empty-state"><div class="empty-logo">'+LOGO_SVG+'</div><div class="empty-title">AI-Powered Analysis</div><div class="empty-sub">Click "Analyze All Issues" to get AI-powered insights: root cause detection, pattern analysis, and actionable fix suggestions.</div></div>';
  }
  html+='</div>';
  el.innerHTML=html;

  var sel=$('ai-model-select');if(sel)sel.addEventListener('change',function(){aiModel=sel.value});
  var btn=$('ai-analyze-btn');if(btn)btn.addEventListener('click',function(){analyzeIssues(issues)});
  var retry=$('ai-retry');if(retry)retry.addEventListener('click',function(){analyzeIssues(issues)});
  el.querySelectorAll('.ai-item').forEach(function(item){
    item.addEventListener('click',function(){item.classList.toggle('expanded')});
  });
}

function renderAIItem(item,key){
  var sev=item.severity||item.priority||'info';
  var html='<div class="ai-item" data-key="'+key+'">';
  html+='<div class="ai-item-title"><span class="ai-item-sev '+sev+'">'+esc(sev)+'</span>'+esc(item.title||'')+'</div>';
  html+='<div class="ai-item-body">';
  if(item.description)html+='<div>'+esc(item.description)+'</div>';
  if(item.rootCause){html+='<div class="ai-item-field"><div class="ai-item-field-label">Root Cause</div>'+esc(item.rootCause)+'</div>'}
  if(item.fix){html+='<div class="ai-item-field"><div class="ai-item-field-label">Fix</div>'+esc(item.fix)+'</div>'}
  if(item.codeExample){html+='<div class="ai-item-code">'+esc(item.codeExample)+'</div>'}
  if(item.affectedPath){html+='<div class="ai-item-field"><div class="ai-item-field-label">Affected Path</div><span class="mono">'+esc(item.affectedPath)+'</span></div>'}
  if(item.relatedIssues&&item.relatedIssues.length){html+='<div class="ai-item-field"><div class="ai-item-field-label">Related Issues</div>'+esc(item.relatedIssues.join(', '))+'</div>'}
  html+='</div></div>';
  return html;
}

function renderSettings(el){
  el.innerHTML='<div class="settings-panel">'+
    '<div class="settings-group"><div class="settings-label">AI Model</div><div class="settings-value">'+esc(aiModel)+'</div></div>'+
    '<div class="settings-group"><div class="settings-label">Proxy API</div><div class="settings-value mono">proxy.hoainho.info</div></div>'+
    '<div class="settings-group"><div class="settings-label">Session ID</div><div class="settings-value mono">'+esc(SESSION)+'</div></div>'+
    '<div class="settings-group"><div class="settings-label">Total Issues</div><div class="settings-value">'+issues.length+'</div></div>'+
    '<div class="settings-group"><button class="btn btn-ghost" id="settings-clear">Clear All Issues</button></div>'+
    '<div class="settings-group"><div class="settings-label">Version</div><div class="settings-value">DevLens Inspector v2.0.0</div></div>'+
    '</div>';
  var clr=$('settings-clear');if(clr)clr.addEventListener('click',function(){
    issues=[];aiResult=null;render();
    send({type:'devlens:clear',sessionId:SESSION});
  });
}

function renderStatusbar(){
  var badges=$('status-badges');if(!badges)return;
  var counts=catCounts();var html='';
  Object.keys(counts).forEach(function(cat){
    var cls=CAT_CSS[cat]||'';
    var active=catFilter===cat?' active':'';
    html+='<span class="cat-badge '+cls+active+'" data-cat="'+cat+'">'+(CATS[cat]||cat)+' '+counts[cat]+'</span>';
  });
  badges.innerHTML=html;
  badges.querySelectorAll('.cat-badge').forEach(function(b){
    b.addEventListener('click',function(){
      var c=b.getAttribute('data-cat');
      catFilter=catFilter===c?'all':c;render();
    });
  });
}

function switchTab(tab){
  activeTab=tab;expandedId=null;
  document.querySelectorAll('.nav-item').forEach(function(n){
    n.classList.toggle('active',n.getAttribute('data-tab')===tab);
  });
  render();
}

document.querySelectorAll('.nav-item').forEach(function(n){
  n.addEventListener('click',function(){switchTab(n.getAttribute('data-tab'))});
});

document.querySelectorAll('.sev-btn').forEach(function(b){
  b.addEventListener('click',function(){sevFilter=b.getAttribute('data-sev');render()});
});

var searchEl=$('search-input');
if(searchEl)searchEl.addEventListener('input',function(){searchQuery=searchEl.value;render()});

$('export-json').addEventListener('click',function(){
  var blob=new Blob([JSON.stringify(issues,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='devlens-issues-'+Date.now()+'.json';a.click();URL.revokeObjectURL(a.href);
});
$('export-csv').addEventListener('click',function(){
  var h='id,timestamp,severity,category,message,path,source,suggestion';
  var rows=issues.map(function(i){return [i.id,new Date(i.timestamp).toISOString(),i.severity,i.category,'"'+String(i.message||'').replace(/"/g,'""')+'"',i.path||'',i.source||'','"'+String(i.suggestion||'').replace(/"/g,'""')+'"'].join(',')});
  var blob=new Blob([h+'\\n'+rows.join('\\n')],{type:'text/csv'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='devlens-issues-'+Date.now()+'.csv';a.click();URL.revokeObjectURL(a.href);
});
$('clear-btn').addEventListener('click',function(){issues=[];aiResult=null;render();send({type:'devlens:clear',sessionId:SESSION})});

var contentEl=$('content');
if(contentEl)contentEl.addEventListener('scroll',function(){autoScroll=contentEl.scrollTop+contentEl.clientHeight>=contentEl.scrollHeight-50});

setInterval(function(){render()},5000);
render();
})();`;
}
