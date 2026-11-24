import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {act,createElement as h} from 'react';
import {createRoot} from 'react-dom/client';
import {createServer} from 'vite';

test('real Placement freezes answers throughout submission and after success', {timeout:60_000}, async()=>{
  const base=process.env.PLACEMENT_FE_URL||'http://localhost:3000';
  const dom=new JSDOM('<main></main>',{url:base});
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const nativeFetch=globalThis.fetch,cookies=new Map();
  let release;const gate=new Promise(resolve=>{release=resolve;});
  let reached;const pending=new Promise(resolve=>{reached=resolve;});
  let submitting;
  globalThis.fetch=async(url,options={})=>{
    const endpoint=new URL(url,base);
    if(options.method==='POST'&&endpoint.pathname.endsWith('/submit')){reached();await gate;}
    const headers=new Headers(options.headers);headers.set('Cookie',[...cookies].map(([k,v])=>`${k}=${v}`).join('; '));
    const response=await nativeFetch(endpoint,{...options,headers});
    for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}
    return response;
  };
  async function api(method,path){const response=await fetch(base+'/api/v1/placement/attempts'+path,{method,headers:{'Content-Type':'application/json'},body:method==='POST'?'{}':undefined});assert.ok(response.ok);return(await response.json()).data;}
  const vite=await createServer({server:{middlewareMode:true,hmr:false,watch:null},optimizeDeps:{noDiscovery:true},appType:'custom'});
  const root=createRoot(document.querySelector('main'));
  try{
    const start=await api('POST','');let state;
    const {usePlacementAttempt}=await vite.ssrLoadModule('/src/features/placement/hooks/usePlacementAttempt.ts');
    function Probe(){state=usePlacementAttempt(start.attemptId,true);return null;}
    await act(async()=>root.render(h(Probe)));
    async function until(predicate){const deadline=Date.now()+15000;while(!predicate()){assert.ok(Date.now()<deadline,'real request timed out');await act(async()=>new Promise(r=>setTimeout(r,20)));}}
    await until(()=>state.data&&!state.loading);
    const question=state.data.questions[0],first=question.options[0].id,second=question.options[1].id;
    await act(async()=>state.setAnswer(question.id,first));
    // Hold only the outgoing request. Every response still comes from the real BE.
    await act(async()=>{submitting=state.submit();});
    await act(async()=>{await pending;});
    assert.equal(state.submitting,true);
    await act(async()=>state.setAnswer(question.id,second));
    assert.equal(state.answers[question.id],first,'a pending submission must reject later answer selections');
    await act(async()=>{release();await submitting;});
    assert.ok(state.submitResult);assert.equal(state.submitError,null);
    await act(async()=>state.setAnswer(question.id,second));
    assert.equal(state.answers[question.id],first,'success must keep the finalized selection');
    const saved=await api('GET','/'+start.attemptId);
    assert.equal(saved.answers.find(a=>a.questionId===question.id).selectedOptionId,first);
  }finally{
    await act(async()=>{release();await submitting?.catch(()=>{});});await act(async()=>root.unmount());await vite.close();globalThis.fetch=nativeFetch;
    dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
