// Aggregate distinct tasks without counting simultaneous calendar copies twice.
export function taskReport(events,from,to,cutoff=Date.now()){
 const buckets=new Map();
 const identity=e=>JSON.stringify([e.project||'프로젝트 분류 전',e.task||e.title]);
 function bucket(id,project,task){if(!buckets.has(id))buckets.set(id,{id,project,task,plan:0,actual:0,events:[]});return buckets.get(id);}
 const selected=events.filter(e=>e.start<to&&e.end>from).map(e=>({...e,start:Math.max(from,e.start),end:Math.min(to,e.end,e.role==='actual'?cutoff:Infinity)})).filter(e=>e.end>e.start);
 for(const e of selected){const b=bucket(identity(e),e.project||'프로젝트 분류 전',e.task||e.title);b.events.push(e);}
 for(const role of ['plan','actual']){
  const rows=selected.filter(e=>e.role===role),points=[...new Set(rows.flatMap(e=>[e.start,e.end]))].sort((a,b)=>a-b);
  for(let i=1;i<points.length;i++){
   const start=points[i-1],end=points[i],active=[...new Set(rows.filter(e=>e.start<end&&e.end>start).map(identity))];
   if(!active.length)continue;
   const b=active.length===1?buckets.get(active[0]):bucket('conflicts','분류 검토','서로 다른 업무의 겹친 시간');
   b[role]+=(end-start)/60000;
  }
 }
 const tasks=[...buckets.values()].map(b=>({...b,delta:b.actual-b.plan}));
 const projects=[...new Set(tasks.map(t=>t.project))].map(project=>{const rows=tasks.filter(t=>t.project===project).sort((a,b)=>b.actual-a.actual||b.plan-a.plan);return {project,tasks:rows,plan:rows.reduce((s,t)=>s+t.plan,0),actual:rows.reduce((s,t)=>s+t.actual,0)};}).sort((a,b)=>b.actual-a.actual);
 return {projects,tasks,plan:tasks.reduce((s,t)=>s+t.plan,0),actual:tasks.reduce((s,t)=>s+t.actual,0)};
}
