import type { ManagementQuestion, ManagementQuestionDraft, ManagementState, ManagementTestSet, PlacementManagementService } from "@features/placement/types/placement-management.types";
import { createPlacementManagementSample } from "./placement-management.seed";
import { getQuestionIssues, getSetIssues } from "@features/placement/utils/placement-management";

function isQuestion(value: unknown): value is ManagementQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  return ["id","code","prompt","passage","correctOptionId","explanation","transcript","audioUrl"].every(k=>typeof q[k]==="string")
    && ["READING","LISTENING"].includes(String(q.skill)) && ["A1","A2","B1","B2"].includes(String(q.level)) && ["DRAFT","ACTIVE","INACTIVE"].includes(String(q.status))
    && Array.isArray(q.options) && q.options.length===4 && q.options.every(o=>o && typeof o==="object" && typeof o.id==="string" && typeof o.text==="string" && ["A","B","C","D"].includes(o.label));
}
function isState(value: unknown): value is ManagementState {
  if (!value || typeof value!=="object") return false;
  const s=value as Record<string,unknown>;
  return s.schemaVersion===1 && Array.isArray(s.questions) && s.questions.every(isQuestion)
    && Array.isArray(s.testSets) && s.testSets.every(t=>t && ["id","code","name","createdAt"].every(k=>typeof t[k]==="string") && Number.isInteger(t.version) && t.version>0 && ["DRAFT","PUBLISHED","ARCHIVED"].includes(t.status) && Array.isArray(t.questionIds) && t.questionIds.every((id:unknown)=>typeof id==="string") && Array.isArray(t.snapshot) && t.snapshot.every(isQuestion))
    && Array.isArray(s.attempts) && s.attempts.every(a=>a && ["id","name","testSetId","testSetCode","startedAt"].every(k=>typeof a[k]==="string") && ["USER","GUEST"].includes(a.kind) && ["IN_PROGRESS","SUBMITTED","AUTO_SUBMITTED","EXPIRED"].includes(a.status) && typeof a.testSetVersion==="number" && Array.isArray(a.snapshot) && a.snapshot.every(isQuestion) && a.answers && typeof a.answers==="object" && Object.values(a.answers).every(v=>v===null||typeof v==="string") && (a.correctCount===null||Number.isInteger(a.correctCount)) && (a.level===null||["A1","A2","B1","B2"].includes(a.level)));
}
type PreviewService = Pick<PlacementManagementService, "getState" | "importQuestions" | "createSet" | "newVersion"> & {
  mode: "preview";
  saveQuestion(draft: ManagementQuestionDraft, id?: string): Promise<ManagementQuestion>;
  setQuestionStatus(id: string, status: ManagementQuestion["status"]): Promise<void>;
  saveSet(id: string, name: string, ids: string[]): Promise<void>;
  publishSet(id: string, name: string, ids: string[]): Promise<void>;
  archiveSet(id: string): Promise<void>;
  deleteSet(id: string): Promise<void>;
  resetPreview(): Promise<void>;
};

export function createPreviewManagementService(userId: string): PreviewService {
  const key=`engolearn.placement.management.preview.v2:${encodeURIComponent(userId)}`;
  const write=(state:ManagementState)=>{
    try { localStorage.setItem(key,JSON.stringify(state)); }
    catch { throw new Error("Không thể lưu dữ liệu xem trước. Trình duyệt có thể đã hết dung lượng hoặc chặn lưu trữ."); }
  };
  const read=():ManagementState=>{
    let raw:string|null;
    try { raw=localStorage.getItem(key); } catch { throw new Error("Trình duyệt không cho đọc dữ liệu xem trước."); }
    if(raw===null){const sample=createPlacementManagementSample();write(sample);return sample;}
    try { const state:unknown=JSON.parse(raw);if(!isState(state))throw new Error();return state; }
    catch { throw new Error("Dữ liệu xem trước không hợp lệ. Dùng Đặt lại mẫu để khôi phục; dữ liệu Mongo không bị ảnh hưởng."); }
  };
  const mutate=async<T>(change:(state:ManagementState)=>T):Promise<T>=>{const state=read();const result=change(state);write(state);return structuredClone(result);};
  const requireSet=(state:ManagementState,id:string)=>{const set=state.testSets.find(s=>s.id===id);if(!set)throw new Error("Không tìm thấy bộ đề.");return set;};
  const requireDraft=(state:ManagementState,id:string)=>{const set=requireSet(state,id);if(set.status!=="DRAFT")throw new Error("Chỉ sửa được bản nháp. Hãy tạo phiên bản mới của đề đã xuất bản.");return set;};
  const checkedDraft=(draft:ManagementQuestionDraft)=>{const errors=getQuestionIssues(draft,false);if(errors.length)throw new Error(errors.join(" "));};
  const uniqueCode=(state:ManagementState,draft:ManagementQuestionDraft,id?:string)=>{if(state.questions.some(q=>q.id!==id && q.code.toLowerCase()===draft.code.trim().toLowerCase()))throw new Error("Mã câu hỏi đã tồn tại.");};
  const question=(draft:ManagementQuestionDraft,id:string,status?:ManagementQuestion["status"]):ManagementQuestion=>({...structuredClone(draft),id,code:draft.code.trim(),status:status==="INACTIVE"?"INACTIVE":getQuestionIssues(draft).length?"DRAFT":"ACTIVE"});
  return {
    mode:"preview",
    getState:async(signal)=>{if(signal?.aborted)throw new DOMException("Aborted","AbortError");return read();},
    saveQuestion:(draft,id)=>mutate(state=>{checkedDraft(draft);uniqueCode(state,draft,id);const old=state.questions.find(q=>q.id===id);if(id&&!old)throw new Error("Không tìm thấy câu hỏi.");const saved=question(draft,id??crypto.randomUUID(),old?.status);state.questions=old?state.questions.map(q=>q.id===id?saved:q):[...state.questions,saved];return saved;}),
    setQuestionStatus:(id,status)=>mutate(state=>{const q=state.questions.find(q=>q.id===id);if(!q)throw new Error("Không tìm thấy câu hỏi.");if(status==="ACTIVE"){const errors=getQuestionIssues(q);if(errors.length)throw new Error(errors.join(" "));}q.status=status;}),
    importQuestions:drafts=>mutate(state=>{if(!drafts.length||drafts.length>500)throw new Error("Cần từ 1 đến 500 câu để nhập.");const used=new Set(state.questions.map(q=>q.code.toLowerCase()));for(const draft of drafts){checkedDraft(draft);const code=draft.code.trim().toLowerCase();if(used.has(code))throw new Error(`Mã ${draft.code} đã tồn tại hoặc bị trùng.`);used.add(code);}state.questions.push(...drafts.map(d=>question(d,crypto.randomUUID())));return drafts.length;}),
    createSet:name=>mutate(state=>{if(!name.trim()||name.trim().length>160)throw new Error("Nhập tên bộ đề, tối đa 160 ký tự.");const id=crypto.randomUUID();const set:ManagementTestSet={id,code:`PLT-${id.slice(0,8).toUpperCase()}`,name:name.trim(),version:1,status:"DRAFT",questionIds:[],snapshot:[],createdAt:new Date().toISOString()};state.testSets.push(set);return set;}),
    saveSet:(id,name,ids)=>mutate(state=>{const set=requireDraft(state,id);if(!name.trim()||name.trim().length>160)throw new Error("Nhập tên bộ đề, tối đa 160 ký tự.");if(new Set(ids).size!==ids.length||ids.length>20||ids.some(qid=>!state.questions.some(q=>q.id===qid)))throw new Error("Danh sách câu hỏi không hợp lệ.");set.name=name.trim();set.questionIds=[...ids];}),
    publishSet: (id, name, questionIds) => mutate(state => {
      const set = requireDraft(state, id);
      const errors = getSetIssues(name, questionIds, state.questions);
      if (errors.length) throw new Error(errors.join(" "));
      set.name = name.trim();
      set.questionIds = [...questionIds];
      set.snapshot = structuredClone(questionIds.map(questionId => state.questions.find(q => q.id === questionId)!));
      set.status = "PUBLISHED";
    }),
    archiveSet:id=>mutate(state=>{const set=requireSet(state,id);if(set.status!=="PUBLISHED")throw new Error("Chỉ lưu trữ đề đã xuất bản.");set.status="ARCHIVED";}),
    newVersion:id=>mutate(state=>{const source=requireSet(state,id);if(source.status==="DRAFT")throw new Error("Bản nháp hiện tại có thể chỉnh sửa trực tiếp.");if(state.testSets.some(s=>s.code===source.code&&s.status==="DRAFT"))throw new Error("Bộ đề đã có phiên bản nháp. Hãy tiếp tục bản nháp đó.");const set:ManagementTestSet={...structuredClone(source),id:crypto.randomUUID(),version:Math.max(...state.testSets.filter(s=>s.code===source.code).map(s=>s.version))+1,status:"DRAFT",questionIds:source.snapshot.map(q=>q.id),snapshot:[],createdAt:new Date().toISOString()};state.testSets.push(set);return set;}),
    deleteSet:id=>mutate(state=>{requireDraft(state,id);if(state.attempts.some(a=>a.testSetId===id))throw new Error("Không xóa bộ đề đã có bài làm.");state.testSets=state.testSets.filter(s=>s.id!==id);}),
    resetPreview:async()=>{write(createPlacementManagementSample());},
  };
}
