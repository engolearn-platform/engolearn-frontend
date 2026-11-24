import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";

test("real submitted Placement counts blanks as wrong without inventing selected answers", {
  skip: !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD, timeout: 120_000,
}, async () => {
  const base = process.env.PLACEMENT_FE_URL || "http://localhost:3000";
  const dom = new JSDOM("<!doctype html><body><main></main></body>", { url: base });
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const nativeFetch = globalThis.fetch; const cookies = new Map();
  globalThis.fetch = async (url, options = {}) => {
    const headers = new Headers(options.headers);
    headers.set("Cookie", [...cookies].map(([k,v]) => `${k}=${v}`).join("; "));
    const response = await nativeFetch(new URL(url,base), {...options,headers});
    for (const cookie of response.headers.getSetCookie()) {
      const pair=cookie.split(";",1)[0];const i=pair.indexOf("=");cookies.set(pair.slice(0,i),pair.slice(i+1));
    }
    return response;
  };
  async function api(method,path,body,status=200) {
    const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
    assert.equal(response.status,status,`real ${method} ${path} must succeed`);
    return (await response.json()).data;
  }
  let vite;let root;
  try {
    await api("POST","/api/v1/auth/login",{email:process.env.TEST_ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD});
    const catalog=await api("GET","/api/v1/placement/admin/test-sets?page=0&size=100");
    const keys=new Map();
    for(const entry of catalog.items.filter(t=>t.status==="PUBLISHED")) {
      const paper=await api("GET","/api/v1/placement/admin/test-sets/"+entry.id);
      for(const q of paper.snapshot)keys.set(q.id,q.correctOptionId);
    }
    cookies.clear();
    await api("POST","/api/v1/auth/register",{email:`placement-review-${crypto.randomUUID()}@example.test`,password:"PlacementReview-Only-2026!"},201);
    const endpoint="/api/v1/placement/attempts";
    const attempt=await api("POST",endpoint,{},201);
    const paper=await api("GET",endpoint+"/"+attempt.attemptId);
    const first=paper.questions[0],second=paper.questions[1];
    await api("PATCH",endpoint+"/"+attempt.attemptId+"/answers",{questionId:first.id,selectedOptionId:keys.get(first.id)});
    await api("PATCH",endpoint+"/"+attempt.attemptId+"/answers",{questionId:second.id,selectedOptionId:second.options.find(o=>o.id!==keys.get(second.id)).id});
    await api("POST",endpoint+"/"+attempt.attemptId+"/submit",{});
    const result=await api("GET",endpoint+"/"+attempt.attemptId+"/result");
    const review=await api("GET",endpoint+"/"+attempt.attemptId+"/review");
    assert.equal(result.score,1);assert.equal(result.summary.incorrectCount,1);assert.equal(result.summary.unansweredCount,18);
    const blank=review.questions.find(q=>q.selectedOptionId===null&&q.section==="READING");
    assert.ok(blank);
    const routerModule="/tests/placement-result-router.mjs";
    vite=await createServer({server:{middlewareMode:true,hmr:false,watch:null},optimizeDeps:{noDiscovery:true},appType:"custom",plugins:[{name:"placement-result-router",resolveId:id=>id===routerModule?id:undefined,load:id=>id===routerModule?'export { createMemoryRouter, RouterProvider } from "react-router";':undefined}]});
    const [{default:Result},{default:Summary},{default:Grid},{default:Question},{createMemoryRouter,RouterProvider}]=await Promise.all([
      vite.ssrLoadModule("/src/features/placement/components/learning/result/PlacementResultCard.tsx"),
      vite.ssrLoadModule("/src/features/placement/components/learning/review/PlacementReviewSummary.tsx"),
      vite.ssrLoadModule("/src/features/placement/components/learning/review/PlacementReviewQuestionGrid.tsx"),
      vite.ssrLoadModule("/src/features/placement/components/learning/review/PlacementReviewQuestionCard.tsx"),
      vite.ssrLoadModule(routerModule),
    ]);
    const screen=h("div",null,h("section",{id:"result"},h(Result,{result})),h("section",{id:"summary"},h(Summary,{review})),
      h(Grid,{questions:review.questions,currentOrder:blank.order,onSelectOrder:()=>{},resultPath:"/placement"}),h(Question,{question:blank,current:true}));
    root=createRoot(document.querySelector("main"));
    const router=createMemoryRouter([{path:"/",element:screen}]);
    await act(async()=>{root.render(h(RouterProvider,{router}));});
    assert.match(document.querySelector("#result").textContent,/Sai:\s*19\s*câu/);
    assert.match(document.querySelector("#summary").textContent,/Sai:\s*19/);
    assert.ok(!document.body.textContent.includes("Bỏ trống"));
    assert.ok(!document.body.textContent.includes("Chưa trả lời"));
    const cell=document.querySelector(`button[aria-label="Câu ${blank.order} — Sai"]`);
    assert.ok(cell?.className.includes("bg-error-container"));
    const detail=document.querySelector(`#review-question-${blank.order}`);
    assert.ok(detail.textContent.includes("Bạn không trả lời câu này"));
    assert.ok(!detail.textContent.includes("Bạn đã chọn")&&!detail.textContent.includes("Bạn chọn"));
    assert.ok(detail.textContent.includes("Đáp án đúng"));
    assert.equal(blank.selectedOptionId,null);
  } finally {
    if(root)await act(async()=>root.unmount());await vite?.close();globalThis.fetch=nativeFetch;
    dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
