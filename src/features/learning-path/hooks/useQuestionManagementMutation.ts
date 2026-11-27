import { useEffect, useRef, useState } from "react";
import type { QuestionManagementError } from "@features/learning-path/services/question-management.service";

export function questionErrorMessage(error: QuestionManagementError): string {
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại và tải lại dữ liệu.";
  if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (error.status === 404) return "Nội dung không còn tồn tại. Hãy đóng và tải lại danh sách.";
  if (error.status === 409) return "Dữ liệu đã thay đổi. Hãy đóng, tải lại danh sách và xem lại trước khi xác nhận.";
  if (error.status === 422) return "Nội dung hoặc xác nhận chuyên môn chưa đạt yêu cầu. Hãy kiểm tra lại.";
  if (error.status === 400) return "Thông tin chưa hợp lệ. Hãy kiểm tra phân loại, passage, bốn lựa chọn và đáp án.";
  return "Chưa xác định được kết quả thao tác. Hãy đóng và tải lại trạng thái trước khi thử lại.";
}

export function useQuestionManagementMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<QuestionManagementError | null>(null);
  const request = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); };
  }, []);
  async function run<T>(operation: (signal: AbortSignal) => Promise<T>, success: (value: T) => void,
    failure?: (error: QuestionManagementError) => void) {
    if (lock.current || !mounted.current) return;
    lock.current = true; setBusy(true); setError(null);
    const controller = new AbortController(); request.current = controller;
    try {
      const value = await operation(controller.signal);
      if (mounted.current && !controller.signal.aborted) success(value);
    } catch (reason) {
      if (mounted.current && !controller.signal.aborted) {
        const error = (reason instanceof Error ? reason : new Error("Không hoàn tất thao tác.")) as QuestionManagementError;
        setError(error); failure?.(error);
      }
    } finally {
      lock.current = false;
      if (mounted.current && !controller.signal.aborted) setBusy(false);
    }
  }
  return { busy, error, run, clearError: () => setError(null), locked: () => lock.current };
}
