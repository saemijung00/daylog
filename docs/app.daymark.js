import {taskReport} from './tasks.js?v=tasks1';
import {report,weekDates,validate} from './core.js?v=tasks1';

'use strict';
const CATEGORIES = [
  {key:'PalM디자인',label:'PalM디자인',color:'#57ae91',desc:'회사 UI · 아이콘 · 리소스 등 디자인 업무'},
  {key:'PalM에디터',label:'PalM에디터',color:'#6f9ee8',desc:'에디터 · 엔진 · Unity / Unreal 작업'},
  {key:'PalM기타업무',label:'PalM기타업무',color:'#e6ae6b',desc:'회의 · 기획 · 자료 확인 · 기타 회사 업무'},
  {key:'_N_Vtu',label:'_N_Vtu',color:'#9675d1',desc:'저녁 CSS · 방송화면 · 스케줄표 디자인'},
  {key:'_갠작',label:'_갠작',color:'#b08cd7',desc:'개인 포트폴리오 · 게임 개발'},
  {key:'새미',label:'새미',color:'#a0abb9',desc:'이동 · 운동 · 식사 · 독서 · 휴식'}
];
const KST_OFFSET=9*3600000, DAY_MS=86400000;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const kstDate=ms=>new Date(ms+KST_OFFSET).toISOString().slice(0,10);
const kstTime=ms=>new Date(ms+KST_OFFSET).toISOString().slice(11,16);
const at=(date,time='00:00')=>Date.parse(date+'T'+time+':00+09:00');
const nextDate=date=>kstDate(at(date)+DAY_MS);
const addDay=(date,n)=>kstDate(at(date)+n*DAY_MS);
const monthKey=date=>date.slice(0,7);
const fmtMinutes=m=>(m=Math.round(m))>=60?`${Math.floor(m/60)}시간${m%60?' '+m%60+'분':''}`:`${m}분`;
const fmtDuration=m=>(m=Math.round(m))>=60?`${Math.floor(m/60)}h ${pad(m%60)}m`:`${m}m`;
const weeks=['일','월','화','수','목','금','토'];
const weekday=date=>weeks[new Date(at(date,'12:00')).getUTCDay()];
const category=k=>CATEGORIES.find(c=>c.key===k)||{key:'Plan',label:'Plan',color:'#b7c4da'};
const minutes=r=>Math.round((r.end-r.start)/60000);
let state={date:'',view:'day',tab:'actual',filter:'all',query:''};
let selectedFile=null, demo=true, reportKey=null, reportEnvelope=null;
const now=Date.now(),today=kstDate(now);let data={version:1,generatedAt:new Date(now).toISOString(),coverage:{from:weekDates(today)[0],to:kstDate(at(today)+86400000)},events:[]};
for(const [i,d] of weekDates(today).entries())if(d<=today){for(const [j,c] of ['새미','_N_Vtu','PalM디자인'].entries()){const start=at(d)+(8+j*3)*3600000;data.events.push({key:`sample-${i}-${j}`,role:'actual',category:c,title:['일상 기록 예시','작업 기록 예시','디자인 기록 예시'][j],project:j===0?'일상':'샘플 프로젝트',task:['휴식','기획 검토','화면 디자인'][j],start,end:start+(1+(i%3)*.5)*3600000});data.events.push({key:`plan-${i}-${j}`,role:'plan',category:'Plan',title:'계획 예시',project:j===0?'일상':'샘플 프로젝트',task:['휴식','기획 검토','화면 디자인'][j],start,end:start+2*3600000});}}
const sample=structuredClone(data);

function within(date){return date>=data.coverage.from&&date<data.coverage.to;}
function datasetStats(date=state.date){
 const r=report(within(date)?data.events:[],date,Math.min(Date.now(),Date.parse(data.generatedAt)));
 const rows=r.entries.map(e=>({...e,kind:e.role==='plan'?'planned':'actual',note:[e.note,e.classificationNote].filter(Boolean).join(' · ')}));
 return {...r,actualTotal:r.actual,plan:rows.filter(e=>e.role==='plan'),actual:rows.filter(e=>e.role==='actual'),count:rows.filter(e=>e.role==='actual').length,available:within(date)};
}
function appIcon(type){const p={clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',chart:'<path d="M4 20V11M10 20V5M16 20v-8M22 20V3"/>',activity:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',note:'<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/>',calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p[type]||p.clock}</svg>`}
function setActiveView(view){state.view=view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));render();}
function setDate(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;state.date=date;render();}
function changeMonth(step){const [y,m]=state.date.slice(0,7).split('-').map(Number);const d=new Date(Date.UTC(y,m-1+step,1));setDate(d.toISOString().slice(0,7)+'-01');}
function render(){
 
 const view=state.view,d=datasetStats();
 $('connection').className='live'+(demo?' demo':'');$('connection').lastElementChild.textContent=demo?'샘플 데이터':'Google Calendar 기록';
 $('syncText').textContent=demo?'· 실제 기록이 아닌 샘플입니다.':'· 캘린더를 읽어온 시점 '+new Date(data.generatedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
 $('reportStatus').textContent=!d.available?'동기화 범위 밖 날짜입니다.':(demo?'샘플 · ':'')+(d.closed?'자정 리포트 · 종료된 하루':'진행 중 · 동기화 시점까지 잠정 집계')+' · Asia/Seoul';
 if(view==='week'||view==='month')$('reportStatus').textContent=(demo?'샘플 · ':'')+'프로젝트별 업무 리포트 · 실제는 동기화 시점까지 · Asia/Seoul';
 $('crumb').textContent=({day:'대시보드',records:'활동 기록',week:'주간 분석',month:'월간 분석',guide:'분류 가이드'})[view];
 const date=state.date,weekdayText=weekday(date),[y,m,dd]=date.split('-');
 $('dateLabel').firstChild.textContent=`${y}. ${Number(m)}. ${Number(dd)}. (${weekdayText})`;$('dateInput').value=date;
 const h=({day:['YOUR DAY, IN FOCUS','하루를 더 선명하게.','계획과 실제를 한눈에 비교하고, 시간의 흐름을 돌아보세요.'],records:['ACTIVITY LOG','하루의 모든 기록.','작업과 휴식, 메모까지 시간순으로 이어집니다.'],week:['WEEKLY PROJECT REVIEW','이번 주, 어떤 일을 했나요?','프로젝트와 업무별 예상·실제 소요시간을 비교하세요.'],month:['MONTHLY PROJECT REVIEW','한 달의 업무를 돌아보세요.','프로젝트별로 쌓인 작업 시간과 예상의 차이를 확인하세요.'],guide:['CATEGORY RULES','나만의 분류 기준.','업무 목적에 따라 여섯 개 캘린더를 구분합니다.']})[view];
 $('headingTop').textContent=h[0];$('mainTitle').textContent=h[1];$('mainSubtitle').textContent=h[2];
 $('timelinePanel').hidden=!(view==='day');$('trendsPanel').hidden=!(view==='week'||view==='month');$('recordsPanel').hidden=view!=='records';$('guidePanel').hidden=view!=='guide';
 $('insightPanel').hidden=view!=='day';
 $('breakdownPanel').hidden=view==='guide'||view==='week'||view==='month';
 $('switchView').textContent=view==='week'?'일간 보기 ↗':'주간 보기 ↗';$('switchView').setAttribute('aria-label',view==='week'?'일간 분석 보기':'주간 분석 보기');
 const summary=(view==='week'||view==='month')?periodStats(view):d;renderStats(summary);renderMonth();if(!summary.period)renderBreakdown(summary);renderInsights(d);renderHistory();renderTimeline(d);renderRecords(d);if(view==='week'||view==='month')renderTrend(view);if(view==='guide')renderGuide();
}
function renderStats(d){
 const cards=[[d.period?'업무 실제 시간':'확인된 실제 시간',fmtMinutes(d.actualTotal),`${d.count}개 활동 구간 · 겹친 시간은 한 번만`,'briefcase'],[d.period?'업무 예상 시간':'계획 시간',fmtMinutes(d.planned),d.period?'선택한 기간의 계획 합계':'하루 전체 계획 시간','calendar'],['계획 대비 차이',`${d.actualTotal>=d.planned?'+':'−'}${fmtMinutes(Math.abs(d.actualTotal-d.planned))}`,'총시간 차이 · 작업 이행률과는 달라요','chart'],];
 $('stats').innerHTML=cards.map(x=>`<article class="stat"><div class="stat-head"><div class="stat-label">${x[0]}</div><div class="stat-icon">${appIcon(x[3])}</div></div><div class="stat-value">${d.available?x[1]:'—'}</div><div class="stat-desc">${x[2]}</div></article>`).join('');
}
function renderTimeline(d){
 const all=d.plan.concat(d.actual);
 if(!all.length){$('timeline').innerHTML=empty('이 날짜에는 아직 일정이 없어요.');return;}
 const origin=at(state.date),first=Math.floor((Math.min(...all.map(e=>e.start))-origin)/3600000),last=Math.min(24,Math.max(first+1,Math.ceil((Math.max(...all.map(e=>e.end))-origin)/3600000)));
 const hourHeight=84,height=(last-first)*hourHeight;
 const time=t=>t===origin+DAY_MS?'24:00':kstTime(t);
 const ticks=Array.from({length:last-first+1},(_,i)=>`<span style="top:${i*hourHeight}px">${pad(first+i)}:00</span>`).join('');
 function lane(rows,planned){
  const ends=[];const placed=rows.map(e=>{let col=ends.findIndex(t=>t<=e.start);if(col<0){col=ends.length;ends.push(e.end)}else ends[col]=e.end;return {...e,col};});
  const cols=Math.max(1,ends.length);
  return placed.map(e=>{const color=planned?'#718bb8':category(e.category).color,top=(e.start-origin-first*3600000)/3600000*hourHeight,size=(e.end-e.start)/3600000*hourHeight;
   return `<button class="compare-event ${planned?'is-plan':'is-actual'}" style="top:${top}px;height:${Math.max(3,size-2)}px;left:calc(${e.col/cols*100}% + 3px);width:calc(${100/cols}% - 6px);--event-color:${color}" data-event="${esc(e.key)}" data-role="${e.role}" title="${esc(e.title+' · '+time(e.start)+'–'+time(e.end)+' · '+fmtMinutes(minutes(e)))}" aria-label="${esc((planned?'계획 ':'실제 ')+e.title+' '+time(e.start)+'부터 '+time(e.end))}"><strong>${esc(e.title)}</strong>${size>34?`<small>${time(e.start)}–${time(e.end)} · ${fmtDuration(minutes(e))}</small>`:''}</button>`;
  }).join('');
 }
 $('timeline').innerHTML=`<div class="compare-heading"><span></span><b>계획 <small>${fmtMinutes(d.planned)}</small></b><b>실제 <small>${fmtMinutes(d.actualTotal)}</small></b></div><div class="compare-scroll"><div class="compare-grid" style="height:${height}px;--hour-height:${hourHeight}px"><div class="compare-hours">${ticks}</div><div class="compare-lane">${lane(d.plan,true)}</div><div class="compare-lane">${lane(d.actual,false)}</div></div></div><div class="compare-detail" id="compareDetail" aria-live="polite">블록을 누르면 활동명·시간·진행 메모를 볼 수 있어요.</div>`;
 $('timeline').querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>{const e=all.find(e=>e.key===b.dataset.event&&e.role===b.dataset.role);if(e)$('compareDetail').textContent=`${e.role==='plan'?'계획':'실제'} · ${e.title} · ${time(e.start)}–${time(e.end)} · ${fmtMinutes(minutes(e))}${e.note?'\n'+e.note:''}`;});
}
function renderMonth(){
 const [y,m]=state.date.split('-').map(Number);$('calendarMonth').textContent=`${y}년 ${m}월`;
 const offset=new Date(Date.UTC(y,m-1,1)).getUTCDay();const max=new Date(Date.UTC(y,m,0)).getUTCDate();
 const titles=weeks.map(n=>`<span class="weeklabel">${n}</span>`).join('');
 let days='';for(let i=0;i<offset;i++)days+='<span></span>';
 for(let day=1;day<=max;day++){
 const key=`${y}-${pad(m)}-${pad(day)}`,actual=datasetStats(key).actual;const active=state.date===key, today=kstDate(Date.now())===key;
 days+=`<button class="mini-day ${active?'active':''} ${today?'today':''}" data-date="${key}" aria-label="${key}, 활동 ${actual.length}개">${day}${actual.length?'<i></i>':'<i style="visibility:hidden"></i>'}</button>`;
 }
 $('miniCalendar').innerHTML=titles+days;
 $('miniCalendar').querySelectorAll('[data-date]').forEach(btn=>btn.addEventListener('click',()=>setDate(btn.dataset.date)));
}
function renderBreakdown(d){
 const values=CATEGORIES.map(c=>({...c,value:d.totals[c.key]})).filter(c=>c.value>0);
 if(d.conflict)values.push({label:'분류 충돌',color:'#d2a56d',value:d.conflict});
 const sum=d.actualTotal;$('donutTotal').textContent=d.available?fmtMinutes(sum):'—';
 let last=0;const segments=values.map(c=>{const s=last;last+=c.value/sum*100;return `${c.color} ${s}% ${last}%`});
 $('donut').style.background=sum?`conic-gradient(${segments.join(',')})`:'#e9edf4';
 $('categoryLegend').innerHTML=values.length?values.map(c=>`<div class="cat-row"><i style="background:${c.color}"></i><span>${esc(c.label)}</span><b>${fmtMinutes(c.value)}</b></div>`).join(''):'<div class="panel-sub">확인된 기록이 없어요.</div>';
}
function renderInsights(d){
 const items=d.available?[
 ['target','비교 화면 읽는 법','왼쪽은 계획, 오른쪽은 실제예요. 같은 높이는 같은 시각이며, 블록의 길이는 소요시간을 뜻해요.'],
 ['clock','시간과 작업을 함께 비교해요','시작 위치가 아래로 내려가면 늦게 시작한 활동이에요. 제목도 함께 확인해 어떤 작업으로 바뀌었는지 살펴보세요.']
 ]:[['calendar','동기화 범위 밖','이 날짜를 포함한 리포트 파일을 열어 주세요.']];
 if(d.conflict)items.push(['activity','분류가 겹치는 시간',fmtMinutes(d.conflict)+'을 분류별 시간에서 분리했어요.']);
 $('insights').innerHTML=items.map(([type,title,body])=>`<div class="insight-item"><span class="insight-icon">${appIcon(type)}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`).join('');
}
function renderHistory(){
 const archive=data.analyses?.[state.date];
 $('historyPanel').hidden=demo||!archive||state.view!=='records';
 $('historySource').textContent=archive?.source||'';
 $('historyContent').textContent=archive?.text||'';
}
function empty(text){return `<div class="empty"><div class="empty-icon">${appIcon('calendar')}</div>${esc(text)}</div>`;}
function renderRecords(d){
 const rows=(state.tab==='actual'?d.actual:d.plan).filter(r=>(state.filter==='all'||r.category===state.filter)&&(!state.query||(r.title+' '+r.note).toLowerCase().includes(state.query.toLowerCase())));
 $('recordCount').textContent=`${state.tab==='actual'?'실제':'계획'} 일정 ${rows.length}개 · 시간순 정리`;
 $('recordTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.tab===state.tab));
 $('recordList').innerHTML=rows.length?rows.map(r=>`<div class="record"><div class="record-time">${kstTime(r.start)}<small>~ ${r.end===at(state.date)+DAY_MS?'24:00':kstTime(r.end)}</small></div><div class="record-line"><i style="background:${category(r.category).color}"></i></div><div style="min-width:0"><div class="record-title">${esc(r.title)}<span class="record-chip">${esc(r.category)}</span></div>${r.note?`<div class="record-note">${esc(r.note)}</div>`:''}</div><div class="record-duration">${fmtDuration(minutes(r))}</div></div>`).join(''):empty('선택한 날짜에 해당하는 기록이 없어요.');
}
function periodDays(view){
 const [y,m]=state.date.split('-').map(Number),count=new Date(Date.UTC(y,m,0)).getUTCDate();
 return view==='week'?weekDates(state.date):Array.from({length:count},(_,i)=>`${y}-${pad(m)}-${pad(i+1)}`);
}
function workEvents(){return data.events.filter(e=>e.project!=='일상'&&e.category!=='새미');}
function periodStats(view){
 const days=periodDays(view),start=at(days[0]),end=at(addDay(days.at(-1),1)),r=taskReport(workEvents(),start,end,Math.min(Date.now(),Date.parse(data.generatedAt)));
 return {period:true,available:days.some(within),actualTotal:r.actual,planned:r.plan,count:r.tasks.reduce((n,t)=>n+t.events.filter(e=>e.role==='actual').length,0),conflict:0,totals:Object.fromEntries(CATEGORIES.map(c=>[c.key,0]))};
}
function renderTrend(view){
 const days=periodDays(view),cutoff=Math.min(Date.now(),Date.parse(data.generatedAt));
 const r=taskReport(workEvents(),at(days[0]),at(addDay(days.at(-1),1)),cutoff);
 const signed=n=>(n>0?'+':n<0?'−':'')+fmtMinutes(Math.abs(n));
 $('trendTitle').textContent=view==='week'?'이번 주 프로젝트별 업무':'이번 달 프로젝트별 업무';
 $('trendSubtitle').textContent=`${days[0]} ~ ${days.at(-1)} · 기록 범위 ${data.coverage.from} ~ ${addDay(data.coverage.to,-1)} · 실제는 마지막 동기화 시점까지`;
 $('trendChart').innerHTML=`<div class="work-report"><p class="work-help">업무 기록만 집계하며 일상 활동은 제외합니다. 오차 = 실제 − 예상. +는 예상보다 오래 걸린 시간, −는 예상보다 적게 기록된 시간이에요. 업무를 완료했다는 뜻은 아니에요.</p>${r.projects.map(p=>{
 const max=Math.max(p.plan,p.actual,1),done=p.tasks.filter(t=>t.actual>0);
 return `<section class="project-report"><header><div><span class="project-eyebrow">PROJECT</span><h3>${esc(p.project)}</h3></div><strong class="variance ${p.actual>p.plan?'over':''}">${signed(p.actual-p.plan)}</strong></header><p class="project-summary">${done.length?'진행한 업무 · '+done.map(t=>esc(t.task)).join(' / '):'이 기간에 실제 수행 기록이 없습니다.'}</p><div class="project-bars"><label>예상 <span><i style="width:${p.plan/max*100}%"></i></span><b>${fmtMinutes(p.plan)}</b></label><label>실제 <span><i class="actual" style="width:${p.actual/max*100}%"></i></span><b>${fmtMinutes(p.actual)}</b></label></div><div class="task-columns"><span>업무</span><span>예상</span><span>실제</span><span>오차</span></div>${p.tasks.map(t=>{
 const index=r.tasks.indexOf(t),status=t.plan===0?'계획 없이 기록됨':t.actual===0?'실제 기록 없음':Math.abs(t.delta)<.01?'예상 시간과 같음':t.delta>0?'예상보다 오래 기록됨':'예상보다 적게 기록됨';
 return `<details class="task-item"><summary><span><b>${esc(t.task)}</b><small>${status}</small></span><span>${fmtMinutes(t.plan)}</span><span>${fmtMinutes(t.actual)}</span><span class="variance ${t.delta>0?'over':''}">${signed(t.delta)}</span></summary><div class="task-details">${t.id==='conflicts'?'<p>서로 다른 업무가 동시에 기록된 시간입니다. 각 업무의 합계에서 빼고 여기에 한 번만 집계했어요.</p>':`<div class="task-editor"><label>프로젝트<input data-project="${index}" value="${esc(t.project)}" maxlength="120"></label><label>업무<input data-task="${index}" value="${esc(t.task)}" maxlength="120"></label><button class="outline-btn" data-regroup="${index}">분류 적용</button></div><p>같은 프로젝트·업무 이름으로 바꾸면 합쳐져요. 원본 캘린더는 바뀌지 않습니다.</p>`}${t.events.map(e=>`<div class="task-source"><span>${kstDate(e.start)} · ${e.role==='plan'?'계획':'실제'} · ${kstTime(e.start)}–${kstDate(e.end)!==kstDate(e.start)?kstDate(e.end)+' ':''}${kstTime(e.end)}</span><b>${esc(e.title)}</b><small>${fmtMinutes((e.end-e.start)/60000)}</small></div>`).join('')}</div></details>`;
 }).join('')}</section>`;
 }).join('')||empty('이 기간에는 기록이 없어요.')}<div class="work-save"><span>프로젝트가 불명확하거나 여러 업무가 섞인 일정은 분류 전으로 남깁니다. 분류 변경은 현재 화면에 적용되며, 파일로 저장하면 다음에도 이어서 볼 수 있어요.</span>${demo?'':'<button class="outline-btn" id="saveTaskReport">분류한 리포트 저장</button>'}<span id="saveTaskStatus" role="status"></span></div></div>`;
 $('trendChart').querySelectorAll('[data-regroup]').forEach(button=>button.onclick=()=>{
 const index=Number(button.dataset.regroup),task=r.tasks[index],project=$('trendChart').querySelector(`[data-project="${index}"]`).value.trim(),name=$('trendChart').querySelector(`[data-task="${index}"]`).value.trim();
 if(!project||!name)return;
 const keys=new Set(task.events.map(e=>e.key));data.events.forEach(e=>{if(keys.has(e.key)){e.project=project;e.task=name;}});render();
 });
 if($('saveTaskReport'))$('saveTaskReport').onclick=async()=>{try{
 const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},reportKey,new TextEncoder().encode(JSON.stringify(data))),b64=bytes=>{let str='';for(const byte of bytes)str+=String.fromCharCode(byte);return btoa(str);};
 const envelope={...reportEnvelope,iv:b64(iv),ciphertext:b64(new Uint8Array(cipher))},url=URL.createObjectURL(new Blob([JSON.stringify(envelope)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='daylog-project-report.enc.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('saveTaskStatus').textContent='암호화 파일을 저장했습니다. 기존 리포트 암호로 열 수 있어요.';
 }catch{$('saveTaskStatus').textContent='저장하지 못했습니다. 리포트를 다시 열고 시도해 주세요.';}};
}
function renderGuide(){$('guideContent').innerHTML=CATEGORIES.map(c=>`<div class="guide-item"><h4><i style="background:${c.color}"></i>${esc(c.label)}</h4><p>${esc(c.desc)}</p></div>`).join('')}
function init(){
 $('sideCategories').innerHTML=CATEGORIES.map(c=>`<div class="cal-line"><i style="background:${c.color}"></i><span>${esc(c.label)}</span></div>`).join('');
 $('catFilter').innerHTML='<option value="all">전체 캘린더</option>'+CATEGORIES.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('');
 document.querySelectorAll('[data-view]').forEach(node=>node.addEventListener('click',()=>setActiveView(node.dataset.view)));
 $('prevDate').addEventListener('click',()=>setDate(addDay(state.date,-1)));
 $('nextDate').addEventListener('click',()=>setDate(addDay(state.date,1)));
 $('dateInput').addEventListener('change',e=>setDate(e.target.value));
 $('prevMonth').addEventListener('click',()=>changeMonth(-1));$('nextMonth').addEventListener('click',()=>changeMonth(1));
 $('recordTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(b){state.tab=b.dataset.tab;renderRecords(datasetStats());}});
 $('searchInput').addEventListener('input',e=>{state.query=e.target.value;renderRecords(datasetStats());});
 $('catFilter').addEventListener('change',e=>{state.filter=e.target.value;renderRecords(datasetStats());});
 $('refreshBtn').addEventListener('click',()=>$('accessDialog').showModal());
 $('switchView').addEventListener('click',()=>setActiveView(state.view==='week'?'day':'week'));
 state.date=today;state.month=monthKey(today);render();
}
$('file').onchange=e=>{selectedFile=e.target.files[0];$('message').textContent=selectedFile?'선택한 암호화 파일을 열려면 암호를 입력하세요.':'암호화 파일을 선택하세요.';};
$('unlock').onsubmit=async e=>{e.preventDefault();const pass=$('password').value;$('password').value='';try{const envelope=selectedFile?JSON.parse(await selectedFile.text()):await fetch('./report.enc.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});if(envelope.version!==1||envelope.iterations!==600000||envelope.kdf!=='PBKDF2-SHA256')throw Error();const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']),key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(envelope.salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt','encrypt']);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(envelope.iv)},key,bytes(envelope.ciphertext));data=validate(JSON.parse(new TextDecoder().decode(plain)));reportKey=key;reportEnvelope={version:envelope.version,kdf:envelope.kdf,iterations:envelope.iterations,salt:envelope.salt};demo=false;$('message').textContent=`동기화 완료 · 시간 집계 제외 항목 ${data.excluded||0}개`;state.date=data.coverage.from;state.month=monthKey(state.date);render();$('accessDialog').close();}catch{$('message').textContent='열 수 없습니다. 암호와 암호화 리포트 파일을 확인하세요.';}};

$('closeAccess').onclick=()=>$('accessDialog').close();
$('lock').onclick=()=>{data=structuredClone(sample);reportKey=null;reportEnvelope=null;demo=true;selectedFile=null;$('file').value='';$('password').value='';$('message').textContent='내 기록을 닫았습니다.';state.date=today;render();$('accessDialog').close();};
init();
