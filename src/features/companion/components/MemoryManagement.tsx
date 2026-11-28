import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import type { CompanionMemory } from "../types/companion.types";

const categories = ["ALL", "FACT", "GOAL", "PREFERENCE", "OBSERVATION", "EXPERIENCE"] as const;
const categoryLabels: Record<(typeof categories)[number], string> = {
  ALL: "Tất cả", FACT: "Thông tin", GOAL: "Mục tiêu", PREFERENCE: "Sở thích",
  OBSERVATION: "Quan sát", EXPERIENCE: "Trải nghiệm",
};

export function MemoryManagement() {
  const { state, loadMemories, updateMemory, forgetMemory } = useCompanion();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const save = async (memory: CompanionMemory) => {
    setSavingId(memory.id);
    const updated = await updateMemory(memory, draft);
    setSavingId(null);
    if (updated) setEditingId(null);
  };

  const forget = async (memory: CompanionMemory) => {
    if (!window.confirm("Bạn muốn quên thông tin này? Thao tác này không thể hoàn tác.")) return;
    setSavingId(memory.id);
    await forgetMemory(memory);
    setSavingId(null);
  };

  return (
    <section className="companion-memory-view" aria-labelledby="companion-memory-title">
      <h3 id="companion-memory-title">Bộ nhớ của Engo</h3>
      <p className="companion-muted">Những điều giúp Engo cá nhân hóa các cuộc trò chuyện của bạn.</p>
      <label className="companion-memory-filter">Lọc theo nhóm
        <select value={state.memoryCategory} onChange={(event) => void loadMemories(event.target.value as typeof state.memoryCategory)}>
          {categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
        </select>
      </label>
      {state.memoryError ? <p role="alert" className="companion-inline-error">{state.memoryError}</p> : null}
      {state.memoryLoading && state.memories.length === 0 ? <p role="status" className="companion-muted">Đang tải bộ nhớ…</p> : null}
      {!state.memoryLoading && state.memories.length === 0 ? <p className="companion-empty-state">Chưa có thông tin được lưu.</p> : null}
      <ul className="companion-memory-list">
        {state.memories.map((memory) => (
          <li key={memory.id} className="companion-memory-item">
            <div className="companion-memory-meta">{categoryLabels[memory.category]}{memory.source === "INFERRED" ? " · Suy đoán của Engo" : " · Bạn đã chia sẻ"}</div>
            {editingId === memory.id ? (
              <>
                <textarea aria-label="Chỉnh sửa thông tin đã lưu" value={draft} maxLength={2000} onChange={(event) => setDraft(event.target.value)} />
                <div className="companion-memory-actions">
                  <Button type="button" disabled={!draft.trim() || state.memoryMutationLoading || savingId === memory.id} onClick={() => void save(memory)}>Lưu thay đổi</Button>
                  <Button type="button" variant="ghost" disabled={state.memoryMutationLoading} onClick={() => setEditingId(null)}>Hủy</Button>
                </div>
              </>
            ) : <p>{memory.content}</p>}
            {editingId !== memory.id ? <div className="companion-memory-actions">
              <Button type="button" variant="ghost" disabled={state.memoryMutationLoading || savingId === memory.id} onClick={() => { setEditingId(memory.id); setDraft(memory.content); }}>Chỉnh sửa</Button>
              <Button type="button" variant="ghost" disabled={state.memoryMutationLoading || savingId === memory.id} onClick={() => void forget(memory)}>Quên</Button>
            </div> : null}
          </li>
        ))}
      </ul>
      {state.memoryCursor ? <Button type="button" variant="outline" disabled={state.memoryLoading} onClick={() => void loadMemories(state.memoryCategory, state.memoryCursor ?? undefined)}>Tải thêm</Button> : null}
    </section>
  );
}

export function CompanionMemorySettings() {
  const { state, setAutomaticMemoryEnabled } = useCompanion();
  return <section className="companion-memory-view" aria-labelledby="companion-memory-settings-title">
    <h3 id="companion-memory-settings-title">Cài đặt bộ nhớ</h3>
    <p className="companion-muted">Cho phép Engo lưu thông tin phù hợp từ cuộc trò chuyện để cá nhân hóa lần sau.</p>
    {state.memoryError ? <p role="alert" className="companion-inline-error">{state.memoryError}</p> : null}
    <label className="companion-memory-toggle">
      <input type="checkbox" checked={state.automaticMemoryEnabled} disabled={state.memorySettingsLoading} onChange={(event) => void setAutomaticMemoryEnabled(event.target.checked)} />
      <span><strong>Bộ nhớ tự động</strong><small>Tắt mục này không ảnh hưởng đến yêu cầu nhớ hoặc quên trực tiếp, hay việc tìm thông tin đã lưu.</small></span>
    </label>
  </section>;
}
