import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {normalize,dayStart,dateKey} from '../docs/core.js';import {encrypt} from './crypto.mjs';
const config=JSON.parse(await readFile(process.argv[2]||'private/config.json','utf8'));
config.to ||= dateKey(Date.now()+2*86400000);
const {GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GOOGLE_REFRESH_TOKEN,REPORT_PASSWORD}=process.env;
if(!REPORT_PASSWORD||REPORT_PASSWORD.length<20)throw Error('20자 이상의 고유한 리포트 암호가 필요합니다');
if(!config.from||!config.to||dayStart(config.to)<=dayStart(config.from)||!Array.isArray(config.calendars)||!config.calendars.some(c=>c.name==='Plan'))throw Error('설정을 확인하세요');
if(!GOOGLE_CLIENT_ID||!GOOGLE_CLIENT_SECRET||!GOOGLE_REFRESH_TOKEN)throw Error('비공개 환경에 Google 인증 설정이 필요합니다');
async function jsonFetch(url,options){const r=await fetch(url,options);if(!r.ok)throw Error('동기화 실패: HTTP '+r.status);return r.json();}
const token=await jsonFetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:GOOGLE_CLIENT_ID,client_secret:GOOGLE_CLIENT_SECRET,refresh_token:GOOGLE_REFRESH_TOKEN,grant_type:'refresh_token'})});
const rows=[];
for(const cal of config.calendars){let pageToken;do{
 const params=new URLSearchParams({timeMin:config.from+'T00:00:00+09:00',timeMax:config.to+'T00:00:00+09:00',singleEvents:'true',showDeleted:'false',maxResults:'2500',timeZone:'Asia/Seoul'});if(pageToken)params.set('pageToken',pageToken);
 const data=await jsonFetch('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(cal.id)+'/events?'+params,{headers:{Authorization:'Bearer '+token.access_token}});
 for(const event of data.items||[])rows.push({...event,calendar:cal.name,organizerCategory:config.calendars.find(c=>c.id===event.organizer?.email)?.name});
 pageToken=data.nextPageToken;
 }while(pageToken);}
const normalized=normalize(rows);
const output=await encrypt({version:1,generatedAt:new Date().toISOString(),coverage:{from:config.from,to:config.to},...normalized},REPORT_PASSWORD);
await mkdir('docs',{recursive:true});await writeFile('docs/report.enc.json.tmp',JSON.stringify(output));await rename('docs/report.enc.json.tmp','docs/report.enc.json');
console.log('암호화 리포트 갱신 완료. 원본 캘린더 변경 없음.');
