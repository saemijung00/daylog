export const categories=['PalM디자인','PalM에디터','PalM기타업무','_N_Vtu','_갠작','새미'];
export const dayStart=d=>Date.parse(d+'T00:00:00+09:00');
export const dateKey=t=>new Date(t+9*3600000).toISOString().slice(0,10);
export function normalize(rows){
 const unique=new Map(); let excluded=0;
 for(const e of rows){
  if(e.status==='cancelled')continue;
  const role=e.calendar==='Plan'?'plan':/^\[실제\]/.test(e.summary||'')?'actual':null;
  const start=Date.parse(e.start?.dateTime),end=Date.parse(e.end?.dateTime);
  if(!role||!Number.isFinite(start)||!Number.isFinite(end)||end<=start){excluded++;continue;}
  const category=role==='plan'?'Plan':(categories.includes(e.organizerCategory)?e.organizerCategory:e.calendar);
  if(role==='actual'&&!categories.includes(category)){excluded++;continue;}
  const key=role+'|'+(e.iCalUID||e.id)+'|'+(e.originalStartTime?.dateTime||start);
  const item={key,role,category,title:(e.summary||'').replace(/^\[실제\]\s*/,''),start,end,updated:e.updated||''};
  const prev=unique.get(key);
  if(!prev||item.updated>prev.updated||(item.updated===prev.updated&&e.calendar===category))unique.set(key,item);
 }
 return {events:[...unique.values()],excluded};
}
export function report(events,date,now=Date.now()){
 const start=dayStart(date),end=start+86400000,cut=Math.max(start,Math.min(end,now));
 const entries=events.filter(e=>e.start<end&&e.end>start).map(e=>({...e,start:Math.max(start,e.start),end:Math.min(end,e.end)}));
 const points=[...new Set([start,cut,...entries.flatMap(e=>[Math.max(start,Math.min(cut,e.start)),Math.max(start,Math.min(cut,e.end))])])].sort((a,b)=>a-b);
 let actual=0,planned=0,overlap=0,conflict=0;const totals=Object.fromEntries(categories.map(c=>[c,0]));const gaps=[];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],minutes=(b-a)/60000;if(!minutes)continue;
  const active=entries.filter(e=>e.start<b&&e.end>a),acts=active.filter(e=>e.role==='actual'),plans=active.filter(e=>e.role==='plan');
  if(plans.length)planned+=minutes;
  if(acts.length){actual+=minutes;if(plans.length)overlap+=minutes;const cats=[...new Set(acts.map(e=>e.category))];if(cats.length===1)totals[cats[0]]+=minutes;else conflict+=minutes;}
  else {const last=gaps.at(-1);if(last&&last.end===a)last.end=b;else gaps.push({start:a,end:b});}
 }
 const planPoints=[...new Set(entries.filter(e=>e.role==='plan').flatMap(e=>[e.start,e.end]))].sort((a,b)=>a-b);
 let fullPlan=0;for(let i=1;i<planPoints.length;i++)if(entries.some(e=>e.role==='plan'&&e.start<planPoints[i]&&e.end>planPoints[i-1]))fullPlan+=(planPoints[i]-planPoints[i-1])/60000;
 return {date,entries,actual,planned:fullPlan,elapsedPlan:planned,overlap,conflict,totals,gaps,unknown:(cut-start)/60000-actual,closed:now>=end};
}
export function weekDates(date){const d=new Date(dayStart(date)+9*3600000);const offset=(d.getUTCDay()+6)%7;return Array.from({length:7},(_,i)=>new Date(+d+(i-offset)*86400000).toISOString().slice(0,10));}
export function validate(data){if(data?.version!==1||!Array.isArray(data.events)||!/^\d{4}-\d{2}-\d{2}$/.test(data.coverage?.from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(data.coverage?.to||'')||!(dayStart(data.coverage.to)>dayStart(data.coverage.from))||!Number.isFinite(Date.parse(data.generatedAt)))throw Error('지원하지 않는 리포트');for(const e of data.events)if(!['plan','actual'].includes(e.role)||!Number.isFinite(e.start)||!Number.isFinite(e.end)||e.end<=e.start||typeof e.title!=='string'||(e.role==='actual'&&!categories.includes(e.category)))throw Error('잘못된 일정');return data;}
