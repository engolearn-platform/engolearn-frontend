import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { HttpError } from "@shared/services";

export function grammarEntryError(error: unknown, fallback: string) {
  const response = error instanceof Error ? error as HttpError : undefined;
  const conflict = response?.code === "GRAMMAR_VERSION_CONFLICT" || (response?.status === 409 && !response.code);
  const fields = Object.fromEntries((response?.fieldErrors ?? []).map(({ field, message }) => [field, message]));
  if (conflict) {
    return { message: "Dữ liệu vừa được thay đổi. Hãy tải lại trước khi chỉnh sửa tiếp.", conflict, fields };
  }
  return { message: response?.message || fallback, conflict, fields };
}

type LoadedRecord = { version: number };

export function useGrammarEntryForm<TFields extends object, TRecord extends LoadedRecord>({
  initialFields,
  initialRecord,
  reconcile,
  validate,
  persist,
}: {
  initialFields: TFields;
  initialRecord?: TRecord;
  reconcile?: (record: TRecord, submitted: TFields) => TFields;
  validate: (fields: TFields) => boolean;
  persist: (fields: TFields, record?: TRecord) => Promise<TRecord>;
}) {
  const [fields, setFields] = useState(initialFields);
  const [record, setRecord] = useState(initialRecord);
  const [savedFields, setSavedFields] = useState(initialFields);
  const [savedAt, setSavedAt] = useState<Date>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ReturnType<typeof grammarEntryError>>();
  const currentFields = useRef(fields);
  const currentRecord = useRef(record);
  const storedFields = useRef(initialFields);
  const inFlight = useRef<Promise<TRecord | undefined> | null>(null);
  const conflict = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const update = useCallback((patch: Partial<TFields>) => {
    currentFields.current = { ...currentFields.current, ...patch };
    setFields(currentFields.current);
    if (!conflict.current) setError(undefined);
  }, []);

  const save = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const snapshot = currentFields.current;
    const existing = currentRecord.current;
    if (conflict.current || !validate(snapshot)) return Promise.resolve(undefined);
    if (existing && JSON.stringify(snapshot) === JSON.stringify(storedFields.current)) {
      return Promise.resolve(existing);
    }
    setSaving(true);
    setError(undefined);
    const request = persist(snapshot, existing)
      .then((result) => {
        currentRecord.current = result;
        const normalized = reconcile ? reconcile(result, snapshot) : snapshot;
        storedFields.current = normalized;
        if (currentFields.current === snapshot) {
          currentFields.current = normalized;
          if (mounted.current) setFields(normalized);
        }
        if (mounted.current) {
          setRecord(result);
          setSavedFields(normalized);
          setSavedAt(new Date());
        }
        return result;
      })
      .catch((cause: unknown) => {
        const failure = grammarEntryError(cause, "Không thể lưu thay đổi. Vui lòng thử lại.");
        conflict.current = failure.conflict;
        if (mounted.current) setError(failure);
        return undefined;
      })
      .finally(() => {
        inFlight.current = null;
        if (mounted.current) setSaving(false);
      });
    inFlight.current = request;
    return request;
  }, [persist, reconcile, validate]);

  const dirty = JSON.stringify(fields) !== JSON.stringify(savedFields);
  const valid = validate(fields);
  useEffect(() => {
    if (!(record && dirty && valid) || saving || error) return;
    const timer = window.setTimeout(() => void save(), 750);
    return () => window.clearTimeout(timer);
  }, [dirty, valid, saving, error, record, fields, save]);

  useEffect(() => {
    if (!dirty && !saving) return;
    const warnOnUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warnOnUnload);
    return () => window.removeEventListener("beforeunload", warnOnUnload);
  }, [dirty, saving]);

  async function flush() {
    let result = await save();
    while (mounted.current && result && JSON.stringify(currentFields.current) !== JSON.stringify(storedFields.current)) {
      result = await save();
    }
    return mounted.current ? result : undefined;
  }

  let status: string | undefined;
  if (saving) status = "Đang lưu…";
  else if (error) status = "Chưa lưu được thay đổi";
  else if (!record) status = "Sẽ lưu khi chọn Tiếp tục";
  else if (dirty) status = "Có thay đổi chưa lưu";
  else if (savedAt) status = `✓ Đã tự động lưu lúc ${savedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;

  return { fields, record, update, save, flush, dirty, valid, saving, error, status };
}

export function useGrammarEntryNavigation({
  dirty, valid, readOnly, canAutosave, conflict, saveFailed, flush,
}: {
  dirty: boolean;
  valid: boolean;
  readOnly: boolean;
  canAutosave: boolean;
  conflict: boolean;
  saveFailed: boolean;
  flush: () => Promise<LoadedRecord | undefined>;
}) {
  const navigate = useNavigate();
  const formElement = useRef<HTMLFormElement>(null);
  const transitioning = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [discardPath, setDiscardPath] = useState<string>();

  async function go<TRecord>(destination: string | ((saved: TRecord) => string), persist: () => Promise<TRecord | undefined>) {
    if (transitioning.current) return;
    if (readOnly && typeof destination === "string") {
      navigate(destination);
      return;
    }
    setAttempted(true);
    if (!formElement.current?.reportValidity() || !valid || conflict) return;
    transitioning.current = true;
    setLeaving(true);
    try {
      const saved = await persist();
      if (saved) navigate(typeof destination === "string" ? destination : destination(saved));
    } finally {
      transitioning.current = false;
      setLeaving(false);
    }
  }

  function back(destination: string) {
    if (transitioning.current) return;
    if (!dirty || readOnly) navigate(destination);
    else if (canAutosave && valid && !saveFailed) void go(destination, flush);
    else setDiscardPath(destination);
  }

  return {
    formElement, leaving, showValidation: attempted && !valid, discardPath,
    go, back, cancelDiscard: () => setDiscardPath(undefined),
    discard: () => { if (discardPath) navigate(discardPath); },
  };
}
