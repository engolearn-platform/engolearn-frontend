import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {spawn, execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
if(process.env.PLACEMENT_DEADLINE_UI_ALLOW_WRITES!=='1') throw Error('Set PLACEMENT_DEADLINE_UI_ALLOW_WRITES=1 only for explicit local DEV regression');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..').split(path.sep).join('/');
const require=createRequire(root+'/package.json');
const esbuild=require('esbuild');
const scenario=process.argv[2]||'auto';
if(!['auto','empty','active'].includes(scenario)) throw Error('Expected auto, empty or active scenario');
const token=randomUUID();
const name='__placement_deadline_audit_'+token+'.html';
const html=path.join(root,'public',name);
const started=new Date().toISOString();
const database=fs.readFileSync(path.resolve(root,'../engolearn-backend/.env'),'utf8').match(/^APP_DB=(.+)$/m)?.[1].trim();
if(!database || !/^engolearn.*dev/.test(database)) throw Error('Explicit local DEV database required');
const records=[];
let finish;
const result=new Promise(resolve=>finish=resolve);
const server=http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers','content-type');
  if(req.method==='OPTIONS'){res.end();return;}
  const url=new URL(req.url,'http://localhost');
  if(url.searchParams.get('token')!==token){res.writeHead(403).end();return;}
  let body='';for await(const chunk of req)body+=chunk;
  try{
    const data=JSON.parse(body);
    if(url.pathname==='/expire'){
      if(!/^[0-9a-f-]{36}$/.test(data.id))throw Error('Invalid test attempt ID');
      const code=`const uri='mongodb://'+encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME)+':'+encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD)+'@127.0.0.1:27017/?authSource=admin&directConnection=true'; const c=new Mongo(uri).getDB(${JSON.stringify(database)}).placement_attempts; const r=c.updateOne({_id:${JSON.stringify(data.id)},user_id:null,status:'IN_PROGRESS',started_at:{$gte:ISODate(${JSON.stringify(started)})}},{$set:{deadline_at:new Date(Date.now()-1000)}}); if(r.modifiedCount!==1) throw Error('Own fresh guest attempt only'); print('TEST_DEADLINE_SHORTENED');`;
      execFileSync('docker',['exec',process.env.PLACEMENT_MONGO_CONTAINER||'mongodb_srv','mongosh','--nodb','--quiet','--eval',code],{stdio:'pipe'});
      records.push(data.id);res.end('{}');
    }else if(url.pathname==='/report'){res.end('{}');finish(data);}
    else{res.writeHead(404).end();}
  }catch(error){res.writeHead(500).end(JSON.stringify({error:error.message}));finish({pass:false,error:error.message});}
});
let chrome;
let profile;
let createdPage=false;
try {
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const control=`http://127.0.0.1:${server.address().port}`;
const js=`
import React,{useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {usePlacementAttempt} from '${root}/src/features/placement/hooks/usePlacementAttempt.ts';
const control=${JSON.stringify(control)}, token=${JSON.stringify(token)}, scenario=${JSON.stringify(scenario)};
const post=(endpoint,data)=>fetch(control+endpoint+'?token='+token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error);return b;});
const api=async(endpoint,method='GET',body)=>{const r=await fetch('/api/v1/placement/attempts'+endpoint,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return data.data;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function Probe({id}){
 const hook=usePlacementAttempt(id,true),run=useRef(false),latest=useRef(hook);latest.current=hook;
 useEffect(()=>{if(!hook.data||run.current)return;run.current=true;
 (async()=>{
   if(scenario!=='active') await post('/expire',{id});
   const q=hook.data.questions[1]; hook.setAnswer(q.id,scenario==='active'?'invalid-audit-option':q.options[0].id);
   await sleep(700); await latest.current.submit(); await sleep(700);
   const persisted=await api('/'+id);
   const actual=latest.current.submitResult;
   const expected=scenario==='auto'?'AUTO_SUBMITTED':scenario==='empty'?'EXPIRED':'IN_PROGRESS';
   const pass=persisted.status===expected&&(scenario==='active'?actual===null&&!!latest.current.submitError:actual?.status===expected);
   await post('/report',{pass,scenario,id,serverStatus:persisted.status,submitResult:actual,submitError:latest.current.submitError});
 })().catch(error=>post('/report',{pass:false,error:error.message}));
 },[hook.data]);
 return React.createElement('pre',null,JSON.stringify({status:hook.data?.status,result:hook.submitResult,error:hook.submitError}));
}
(async()=>{const start=await api('','POST');const detail=await api('/'+start.attemptId);const q=detail.questions[0];if(scenario!=='empty') await api('/'+start.attemptId+'/answers','PATCH',{questionId:q.id,selectedOptionId:q.options[0].id});createRoot(document.getElementById('root')).render(React.createElement(Probe,{id:start.attemptId}));})().catch(error=>post('/report',{pass:false,error:error.message}));
`;
const bundle=await esbuild.build({stdin:{contents:js,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',tsconfig:root+'/tsconfig.app.json',define:{'process.env.NODE_ENV':'"production"'}});
profile=fs.mkdtempSync(path.join(os.tmpdir(),'placement-deadline-audit-'));
 if(fs.existsSync(html))throw Error('Temporary page already exists');
 fs.writeFileSync(html,'<!doctype html><html><body><div id="root"></div><script>'+bundle.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script></body></html>',{flag:'wx'});
 createdPage=true;
 chrome=spawn(process.env.PLACEMENT_CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir='+profile,'http://localhost:3000/'+name],{stdio:'ignore',windowsHide:true});
 chrome.once('error',error=>finish({pass:false,error:error.message}));
 const timeout=setTimeout(()=>finish({pass:false,error:'Browser audit timeout'}),30000);
 const data=await result;clearTimeout(timeout);
 console.log(JSON.stringify({...data,shortenedOwnGuestAttempts:records},null,2));
 if(!data.pass)process.exitCode=1;
}finally{
 if(chrome?.pid){try{execFileSync('taskkill',['/PID',String(chrome.pid),'/T','/F'],{stdio:'ignore'});}catch{}}
 server.close();
 if(createdPage&&path.resolve(html).startsWith(path.resolve(root,'public')+path.sep))fs.rmSync(html,{force:true});
 if(profile&&path.resolve(profile).startsWith(path.resolve(os.tmpdir())+path.sep))fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});
}
