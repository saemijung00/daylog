import {report,weekDates,validate} from './core.js';

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
let selectedFile=null, demo=true;
const now=Date.now(),today=kstDate(now);let data={version:1,generatedAt:new Date(now).toISOString(),coverage:{from:weekDates(today)[0],to:kstDate(at(today)+86400000)},events:[]};
for(const [i,d] of weekDates(today).entries())if(d<=today){for(const [j,c] of ['새미','_N_Vtu','PalM디자인'].entries()){const start=at(d)+(8+j*3)*3600000;data.events.push({key:`sample-${i}-${j}`,role:'actual',category:c,title:['일상 기록 예시','작업 기록 예시','디자인 기록 예시'][j],start,end:start+(1+(i%3)*.5)*3600000});data.events.push({key:`plan-${i}-${j}`,role:'plan',category:'Plan',title:'계획 예시',start,end:start+2*3600000});}}
const sample=structuredClone(data);

function within(date){return date>=data.coverage.from&&date<data.coverage.to;}
function datasetStats(date=state.date){
 const r=report(within(date)?data.events:[],date,Math.min(Date.now(),Date.parse(data.generatedAt)));
 const rows=r.entries.map(e=>({...e,kind:e.role==='plan'?'planned':'actual',note:''}));
 return {...r,actualTotal:r.actual,plan:rows.filter(e=>e.role==='plan'),actual:rows.filter(e=>e.role==='actual'),count:rows.filter(e=>e.role==='actual').length,available:within(date)};
}
function appIcon(type){const p={clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',chart:'<path d="M4 20V11M10 20V5M16 20v-8M22 20V3"/>',activity:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',note:'<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/>',calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p[type]||p.clock}</svg>`}
function setActiveView(view){state.view=view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));render();}
function setDate(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;state.date=date;render();}
function changeMonth(step){const [y,m]=state.date.slice(0,7).split('-').map(Number);const d=new Date(Date.UTC(y,m-1+step,1));setDate(d.toISOString().slice(0,7)+'-01');}
function render(){
 
 const view=state.view,d=datasetStats();
 $('connection').className='live'+(demo?' demo':'');$('connection').lastElementChild.textContent=demo?'샘플 데이터':'내 기록 열림';
 $('syncText').textContent=demo?'· 실제 기록이 아닌 샘플입니다.':'· 마지막 동기화 '+new Date(data.generatedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
 $('reportStatus').textContent=!d.available?'동기화 범위 밖 날짜입니다.':(demo?'샘플 · ':'')+(d.closed?'자정 리포트 · 종료된 하루':'진행 중 · 동기화 시점까지 잠정 집계')+' · Asia/Seoul';
 $('crumb').textContent=({day:'대시보드',records:'활동 기록',week:'주간 분석',month:'월간 분석',guide:'분류 가이드'})[view];
 const date=state.date,weekdayText=weekday(date),[y,m,dd]=date.split('-');
 $('dateLabel').firstChild.textContent=`${y}. ${Number(m)}. ${Number(dd)}. (${weekdayText})`;$('dateInput').value=date;
 const h=({day:['YOUR DAY, IN FOCUS','하루를 더 선명하게.','계획과 실제를 한눈에 비교하고, 시간의 흐름을 돌아보세요.'],records:['ACTIVITY LOG','하루의 모든 기록.','작업과 휴식, 메모까지 시간순으로 이어집니다.'],week:['WEEKLY OVERVIEW','이번 주의 흐름.','7일 동안의 계획과 실제 시간 차이를 살펴보세요.'],month:['MONTHLY OVERVIEW','시간이 쌓이는 방식.','한 달 동안 기록된 활동을 돌아보고 패턴을 확인하세요.'],guide:['CATEGORY RULES','나만의 분류 기준.','업무 목적에 따라 여섯 개 캘린더를 구분합니다.']})[view];
 $('headingTop').textContent=h[0];$('mainTitle').textContent=h[1];$('mainSubtitle').textContent=h[2];
 $('timelinePanel').hidden=!(view==='day');$('trendsPanel').hidden=!(view==='week'||view==='month');$('recordsPanel').hidden=(view==='guide'||view==='month'||view==='week');$('guidePanel').hidden=view!=='guide';
 $('insightPanel').hidden=view==='guide';$('notesPanel').hidden=view==='guide';
 $('breakdownPanel').hidden=view==='guide';
 $('switchView').textContent=view==='week'?'일간 보기 ↗':'주간 보기 ↗';$('switchView').setAttribute('aria-label',view==='week'?'일간 분석 보기':'주간 분석 보기');
 renderStats(d);renderMonth();renderBreakdown(d);renderInsights(d);renderNotes(d);renderTimeline(d);renderRecords(d);if(view==='week'||view==='month')renderTrend(view);if(view==='guide')renderGuide();
}
function renderStats(d){
 const cards=[['확인된 실제 시간',fmtMinutes(d.actualTotal),`${d.count}개 활동 · 겹친 시간은 한 번만`,'briefcase'],['계획 시간',fmtMinutes(d.planned),'하루 전체 계획 시간','calendar'],['계획 대비 차이',`${d.actualTotal>=d.planned?'+':'−'}${fmtMinutes(Math.abs(d.actualTotal-d.planned))}`,'실제 − 계획 · 진행 중 수치는 잠정','chart'],['미확인 시간',fmtMinutes(d.unknown),'기록 없는 경과 시간','clock']];
 $('stats').innerHTML=cards.map(x=>`<article class="stat"><div class="stat-head"><div class="stat-label">${x[0]}</div><div class="stat-icon">${appIcon(x[3])}</div></div><div class="stat-value">${d.available?x[1]:'—'}</div><div class="stat-desc">${x[2]}</div></article>`).join('');
}
function renderTimeline(d){
 const all=d.plan.concat(d.actual);if(!all.length){$('timeline').innerHTML=empty('이 날짜에는 아직 일정이 없어요.');return;}
 const startHour=Math.max(0,Math.floor(Math.min(...all.map(x=>x.start-at(state.date)))/3600000)-1);
 const endHour=Math.min(24,Math.ceil(Math.max(...all.map(x=>x.end-at(state.date)))/3600000)+0);
 const maxHour=Math.max(startHour+2,endHour),spanMinutes=(maxHour-startHour)*60;
 const ticks=Array.from({length:maxHour-startHour+1},(_,i)=>`<span class="tick" style="left:${(i/(maxHour-startHour))*100}%">${pad(i+startHour)}:00</span>`).join('');
 function lane(rows,planned){let ends=[];const positioned=rows.map(r=>{const s=(r.start-at(state.date))/60000,e=(r.end-at(state.date))/60000;let level=ends.findIndex(t=>t<=s);if(level<0){level=ends.length;ends.push(e)}else ends[level]=e;return{...r,level,s,e}});const height=Math.max(52,ends.length*41+9);return `<div class="tl-track" style="height:${height}px;--step:${100/(maxHour-startHour)}%">${positioned.map(r=>{const left=(r.s-startHour*60)/spanMinutes*100,width=(r.e-r.s)/spanMinutes*100,color=planned?'':category(r.category).color;const duration=minutes(r);return `<div class="tl-event ${planned?'planned':''}" title="${esc(r.title+' · '+kstTime(r.start)+'–'+kstTime(r.end))}" style="top:${7+r.level*41}px;height:34px;left:${left}%;width:${Math.max(width,.35)}%;background:${planned?'':color};${duration<30?'padding:0 3px;':''}">${width>7?esc(r.title):''}</div>`}).join('')}</div>`}
 $('timeline').innerHTML=`<div class="timeline-overflow"><div class="timecontent"><div class="tl-axis"><div class="tl-axis-inner">${ticks}</div></div><div class="tl-row"><div class="tl-label">계획 <small>Planned</small></div>${lane(d.plan,true)}</div><div class="tl-row"><div class="tl-label">실제 <small>Actual</small></div>${lane(d.actual,false)}</div></div></div><div class="timeline-legend"><span class="legend-item"><i></i>계획</span><span class="legend-item"><i class="actual"></i>실제</span><span class="legend-note">블록에 마우스를 올리면 상세 시간이 표시돼요. 작은 화면은 좌우로 스크롤해 주세요.</span></div>`;
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
 ['target','계획 시간대의 실제 기록',fmtMinutes(d.overlap)+' 동안 계획과 실제 시간대가 겹쳐요. 작업 완료율을 뜻하지는 않아요.'],
 ['clock','기록 확인',d.gaps.length?`${d.gaps.length}개 미확인 구간이 있어요. 아래에서 시간을 확인하세요.`:'경과한 시간에 미확인 구간이 없어요.']
 ]:[['calendar','동기화 범위 밖','이 날짜를 포함한 리포트 파일을 열어 주세요.']];
 if(d.conflict)items.push(['activity','분류가 겹치는 시간',fmtMinutes(d.conflict)+'을 분류별 시간에서 분리했어요.']);
 $('insights').innerHTML=items.map(([type,title,body])=>`<div class="insight-item"><span class="insight-icon">${appIcon(type)}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`).join('');
}
function renderNotes(d){
 $('notes').innerHTML=!d.available?'<p class="panel-sub">동기화 범위 밖입니다.</p>':d.gaps.length?d.gaps.map(g=>`<div class="gap-row"><b>${kstTime(g.start)} – ${g.end===at(state.date)+DAY_MS?'24:00':kstTime(g.end)}</b><br>${fmtMinutes(Math.round((g.end-g.start)/60000))}</div>`).join(''):'<p class="panel-sub">미확인 구간이 없습니다.</p>';
}
function empty(text){return `<div class="empty"><div class="empty-icon">${appIcon('calendar')}</div>${esc(text)}</div>`;}
function renderRecords(d){
 const rows=(state.tab==='actual'?d.actual:d.plan).filter(r=>(state.filter==='all'||r.category===state.filter)&&(!state.query||(r.title+' '+r.note).toLowerCase().includes(state.query.toLowerCase())));
 $('recordCount').textContent=`${state.tab==='actual'?'실제':'계획'} 일정 ${rows.length}개 · 시간순 정리`;
 $('recordTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.tab===state.tab));
 $('recordList').innerHTML=rows.length?rows.map(r=>`<div class="record"><div class="record-time">${kstTime(r.start)}<small>~ ${r.end===at(state.date)+DAY_MS?'24:00':kstTime(r.end)}</small></div><div class="record-line"><i style="background:${category(r.category).color}"></i></div><div style="min-width:0"><div class="record-title">${esc(r.title)}<span class="record-chip">${esc(r.category)}</span></div>${r.note?`<div class="record-note">${esc(r.note)}</div>`:''}</div><div class="record-duration">${fmtDuration(minutes(r))}</div></div>`).join(''):empty('선택한 날짜에 해당하는 기록이 없어요.');
}
function renderTrend(view){
 const [y,m]=state.date.split('-').map(Number),count=new Date(Date.UTC(y,m,0)).getUTCDate();
 const days=view==='week'?weekDates(state.date):Array.from({length:count},(_,i)=>`${y}-${pad(m)}-${pad(i+1)}`);
 const vals=days.map(date=>({date,...datasetStats(date)})),max=Math.max(1,...vals.flatMap(x=>[x.planned,x.actualTotal]));
 $('trendTitle').textContent=view==='week'?'이번 주 활동 흐름':`${m}월 활동 기록`;
 $('trendSubtitle').textContent=`${days[0]} ~ ${days.at(-1)} · 전체 활동 · 동기화 범위 밖은 — 표시`;
 $('trendChart').innerHTML=view==='week'?`<div class="chart-row">${vals.map((x,i)=>`<button class="chart-col ${x.date===state.date?'current':''}" data-day="${x.date}" aria-label="${x.date} ${x.available?'실제 '+fmtMinutes(x.actualTotal):'동기화 범위 밖'}"><div class="chart-bars"><div class="chart-bar" style="height:${x.planned/max*168}px;background:#cbd8ef"></div><div class="chart-bar" style="height:${x.actualTotal/max*168}px;background:#567aca"></div></div><span class="chart-label">${['월','화','수','목','금','토','일'][i]}<br>${x.available?fmtDuration(x.actualTotal):'—'}</span></button>`).join('')}</div>`:`<div class="monthly-chart">${vals.map((x,i)=>`<button class="monthly-col ${x.available?'':'out'} ${x.date===state.date?'selected':''}" data-day="${x.date}" aria-label="${x.date} ${x.available?'실제 '+fmtMinutes(x.actualTotal):'동기화 범위 밖'}" title="${x.date} · ${x.available?fmtMinutes(x.actualTotal):'—'}"><div style="height:${x.available?x.actualTotal/max*100:2}%"></div></button>`).join('')}</div><div class="month-axis"><span>1일</span><span>${count}일</span></div>`;
 $('trendChart').querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{state.view='day';setDate(b.dataset.day);setActiveView('day');});
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
$('unlock').onsubmit=async e=>{e.preventDefault();const pass=$('password').value;$('password').value='';try{const envelope=selectedFile?JSON.parse(await selectedFile.text()):await fetch('./report.enc.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});if(envelope.version!==1||envelope.iterations!==600000||envelope.kdf!=='PBKDF2-SHA256')throw Error();const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']),key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(envelope.salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(envelope.iv)},key,bytes(envelope.ciphertext));data=validate(JSON.parse(new TextDecoder().decode(plain)));demo=false;$('message').textContent=`동기화 완료 · 시간 집계 제외 항목 ${data.excluded||0}개`;state.date=kstDate(Math.min(Date.now(),at(data.coverage.to)-1));state.month=monthKey(state.date);render();$('accessDialog').close();}catch{$('message').textContent='열 수 없습니다. 암호와 암호화 리포트 파일을 확인하세요.';}};

$('closeAccess').onclick=()=>$('accessDialog').close();
$('lock').onclick=()=>{data=structuredClone(sample);demo=true;selectedFile=null;$('file').value='';$('password').value='';$('message').textContent='내 기록을 닫았습니다.';state.date=today;render();$('accessDialog').close();};
init();
