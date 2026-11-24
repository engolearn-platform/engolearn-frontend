import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {act,createElement as h} from 'react';
import {createRoot} from 'react-dom/client';
import {createServer} from 'vite';

test('direct Placement results entry and remount keep exact-version set names', {
  skip:!process.env.TEST_ADMIN_EMAIL||!process.env.TEST_ADMIN_PASSWORD,timeout:60000,
},async()=>{
  const base=process.env.PLACEMENT_FE_URL||'http://localhost:3000';
  const dom=new JSDOM('<main></main>',{url:base+'/admin/placement/attempts'});
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const nativeFetch=globalThis.fetch,cookies=new Map(),requests=[],catalog=[];let rows=[];
  globalThis.fetch=async(url,options={})=>{
    const endpoint=new URL(url,base);requests.push(endpoint);
    const headers=new Headers(options.headers);headers.set('Cookie',[...cookies].map(([k,v])=>`${k}=${v}`).join('; '));
    const response=await nativeFetch(endpoint,{...options,headers});
    for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}
    if(response.ok && endpoint.pathname.endsWith('/test-sets'))catalog.push(...(await response.clone().json()).data.items);
    if(response.ok && endpoint.pathname.endsWith('/attempts'))rows=(await response.clone().json()).data.items;
    return response;
  };
  let vite,root;
  try{
    const login=await fetch(base+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:process.env.TEST_ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD})});assert.equal(login.status,200);
    const routerModule='/tests/placement-filter-router.mjs';
    vite=await createServer({server:{middlewareMode:true,hmr:false,watch:null},optimizeDeps:{noDiscovery:true},appType:'custom',plugins:[{name:'placement-filter-router',resolveId:id=>id===routerModule?id:undefined,load:id=>id===routerModule?'export {createMemoryRouter,RouterProvider} from "react-router";':undefined}]});
    const [{AuthProvider},{default:Provider},{default:Results},{createMemoryRouter,RouterProvider}]=await Promise.all([
      vite.ssrLoadModule('/src/shared/hooks/useAuth.tsx'),vite.ssrLoadModule('/src/features/placement/components/management/PlacementManagementProvider.tsx'),
      vite.ssrLoadModule('/src/features/placement/views/management/PlacementAttemptListView.tsx'),vite.ssrLoadModule(routerModule),
    ]);
    const router=createMemoryRouter([{path:'/admin/placement',element:h(Provider),children:[{path:'attempts',element:h(Results)}]}],{initialEntries:['/admin/placement/attempts']});
    root=createRoot(document.querySelector('main'));await act(async()=>root.render(h(AuthProvider,null,h(RouterProvider,{router}))));
    async function until(predicate){const deadline=Date.now()+15000;while(!predicate()){assert.ok(Date.now()<deadline,'real endpoint did not settle');await act(async()=>new Promise(r=>setTimeout(r,20)));}}
    await until(()=>document.body.textContent.includes('Danh sách lượt làm')&&!document.body.textContent.includes('Đang tải lượt làm…'));
    assert.ok(requests.some(r=>r.pathname.endsWith('/test-sets')),'direct results route must fetch its own set catalog');
    await until(()=>document.querySelector('table tbody tr'));
    const verifyNames=()=>{
      const cells=[...document.querySelectorAll('table tbody tr')].map(row=>row.querySelectorAll('td')[1].textContent);
      assert.equal(cells.length,rows.length);
      let named=0;
      for(let i=0;i<rows.length;i++) {
        const attempt=rows[i];
        const set=catalog.find(s=>s.id===attempt.testSetId&&s.version===attempt.testSetVersion)
          ||catalog.find(s=>s.code===attempt.testSetCode&&s.version===attempt.testSetVersion);
        if(set){assert.ok(cells[i].includes(set.name));named++;}
      }
      assert.ok(named>0,'actual catalog must supply at least one real historical name');
      assert.ok(document.querySelectorAll('#placement-set-codes option').length>0);
    };
    verifyNames();
    await act(async()=>root.unmount());
    root=createRoot(document.querySelector('main'));
    const reloadRouter=createMemoryRouter([{path:'/admin/placement',element:h(Provider),children:[{path:'attempts',element:h(Results)}]}],{initialEntries:['/admin/placement/attempts']});
    await act(async()=>root.render(h(AuthProvider,null,h(RouterProvider,{router:reloadRouter}))));
    await until(()=>document.querySelector('table tbody tr'));
    verifyNames();
    assert.ok(requests.filter(r=>r.pathname.endsWith('/test-sets')).length>=2,'reload must reload catalog independently');
    assert.ok(!requests.some(r=>r.pathname.endsWith('/questions')),'results lookup must not download the entire question bank');
  }finally{
    if(root)await act(async()=>root.unmount());await vite?.close();globalThis.fetch=nativeFetch;dom.window.close();
    delete globalThis.window;delete globalThis.document;delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
