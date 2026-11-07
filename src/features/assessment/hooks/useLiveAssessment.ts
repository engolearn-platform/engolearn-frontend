import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@shared/hooks/useAuth";
import { assessmentApi, abandonOnLeave, leaveHeaders } from "@features/assessment/services/assessmentApi";
import { currentSession, clearSession } from "@features/assessment/services/assessmentSession";
import type { AnswerCommand, AssessmentState, FinishStageCommand } from "@features/assessment/types/assessment.types";

let delayedLeave: ReturnType<typeof setTimeout> | undefined;
export function useLiveAssessment() {
  const {user} = useAuth();
  const candidate = currentSession();
  const session = candidate && candidate.owner === user?.id && candidate.live ? candidate : null;
  const navigate = useNavigate();
  const [state, setState] = useState<AssessmentState | null>(session?.state ?? null);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState("Đã lưu");
  const mounted = useRef(false);
  const revision = useRef(state?.revision ?? -1);
  const mutation = useRef(false);
  const queued = useRef<Promise<unknown>>(Promise.resolve());
  const pendingNext = useRef<AnswerCommand | null>(null);
  const pendingStage = useRef<FinishStageCommand | null>(null);
  const failedSaves = useRef(new Set<number>());
  const [drafts, setDrafts] = useState<Record<number, {choice: number | null; sequence: number}>>({});
  const currentNumber = state?.current?.number;
  useEffect(() => {setSaving("Chưa chọn đáp án");}, [currentNumber]);
  useEffect(() => {
    if (!state) return;
    const open = new Set(state.rulesVersion === 2 ? state.questions.map(q => q.number)
      : state.current ? [state.current.number] : []);
    let expired = false;
    for (const question of failedSaves.current) if (!open.has(question)) {
      failedSaves.current.delete(question);
      expired = true;
    }
    if (expired) {
      setSaving("Có câu hết giờ trước khi lưu");
      setError("Một lựa chọn chưa lưu đã bị khóa do hết giờ. Kết quả chỉ tính đáp án máy chủ đã lưu.");
    }
  }, [state]);
  const apply = (value: AssessmentState) => {
    if (!mounted.current || value.revision < revision.current) return;
    revision.current = value.revision;
    if (session) session.state = value;
    setState(value);
  };
  useEffect(() => {
    mounted.current = true;
    if (delayedLeave) clearTimeout(delayedLeave);
    if (!session?.state || !session.live) return () => {mounted.current = false;};
    const id = session.state.id, identity = leaveHeaders();
    const leave = () => {if (session.live) {session.live = false; abandonOnLeave(id, identity);}};
    const beforeUnload = (event: BeforeUnloadEvent) => {if (session.live) {event.preventDefault();event.returnValue = "";}};
    const pageshow = (event: PageTransitionEvent) => {if (event.persisted) {clearSession();navigate("/assessment", {replace: true});}};
    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pageshow", pageshow);
    let polling = false;
    const poll = async () => {
      if (polling || mutation.current || !session.live) return;
      polling = true;
      try {
        const value = await assessmentApi.state(id, session.binding);
        if (mounted.current && value.revision >= revision.current) {
          revision.current = value.revision; session.state = value; setState(value);
        }
      } catch (e) {if (mounted.current) setError((e as Error).message);}
      finally {polling = false;}
    };
    const timer = window.setInterval(() => void poll(), 1000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pageshow", pageshow);
      // React's development remount cancels this; a real route departure abandons the live document.
      delayedLeave = setTimeout(leave, 0);
    };
  }, [session, navigate]);
  useEffect(() => {
    if (state && state.status !== "ACTIVE") {
      if (session) session.live = false;
      clearSession();
      navigate(state.status === "READY" ? `/assessment/attempts/${state.id}/result` : "/assessment/history", {replace: true});
    }
  }, [state, session, navigate]);
  const save = (question: number, choice: number | null) => {
    if (!session || !session.live || !state) return;
    pendingNext.current = null;
    const sequence = ++session.sequence;
    setSaving("Đang lưu…");
    setDrafts(previous => ({...previous, [question]: {choice, sequence}}));
    const command = {question, choice, sequence, commandId: crypto.randomUUID()};
    queued.current = queued.current.catch(() => undefined).then(async () => {
      const value = await assessmentApi.answer(state.id, session.binding, command);
      apply(value);
      failedSaves.current.delete(question);
      setDrafts(previous => {
        if (previous[question]?.sequence !== sequence) return previous;
        const next = {...previous}; delete next[question]; return next;
      });
      if (mounted.current && sequence === session.sequence) {setSaving("Đã lưu");setError(null);}
    }).catch(e => {
      const latest = session.state;
      const stillOpen = latest?.rulesVersion === 2 ? latest.questions.some(q => q.number === question) : latest?.current?.number === question;
      if (stillOpen) failedSaves.current.add(question);
      if (mounted.current) {setSaving("Chưa lưu");setError((e as Error).message);}
    });
  };
  const perform = async (action: "next" | "finishStage" | "submit" | "abandon", choice: number | null) => {
    if (!session || !session.live || !state || mutation.current) return;
    mutation.current = true; setBusy(true); setError(null);
    try {
      await queued.current;
      if (action !== "abandon" && failedSaves.current.size) throw new Error("Có đáp án chưa lưu. Chọn lại đáp án để thử lưu trước khi tiếp tục.");
      let value: AssessmentState;
      if (action === "next" && state.current) {
        if (!pendingNext.current || pendingNext.current.question !== state.current.number) pendingNext.current = {
          question: state.current.number, choice, sequence: ++session.sequence, commandId: crypto.randomUUID(),
        };
        value = await assessmentApi.next(state.id, session.binding, pendingNext.current);
        pendingNext.current = null;
      } else if (action === "finishStage") {
        if (!pendingStage.current || pendingStage.current.unitIndex !== state.unitIndex) pendingStage.current = {
          unitIndex: state.unitIndex, phase: state.phase, commandId: crypto.randomUUID(),
        };
        value = await assessmentApi.finishStage(state.id, session.binding, pendingStage.current);
        pendingStage.current = null;
      } else if (action === "submit") value = await assessmentApi.submit(state.id, session.binding);
      else if (action === "abandon") value = await assessmentApi.abandon(state.id);
      else return;
      apply(value); setSaving("Đã lưu");
      return true;
    } catch (e) {if (mounted.current) {setError((e as Error).message);setSaving("Chưa lưu");}}
    finally {mutation.current = false; if (mounted.current) setBusy(false);}
  };
  return {session, state, error, busy, saving, drafts, save, perform};
}
