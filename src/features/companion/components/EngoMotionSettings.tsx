import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import type { EngoMotionPreference, EngoMotionSettings as MotionSettings } from "@features/companion/hooks/useEngoMotionPreference";

const choices: { value: EngoMotionPreference; label: string; detail: string }[] = [
  { value: "system", label: "Theo hệ thống", detail: "Tự động tôn trọng cài đặt giảm chuyển động của thiết bị." },
  { value: "on", label: "Bật chuyển động Engo", detail: "Cho phép Engo chuyển động kể cả khi hệ thống yêu cầu giảm chuyển động." },
  { value: "off", label: "Tắt chuyển động Engo", detail: "Luôn hiển thị Engo dưới dạng ảnh tĩnh." },
];

export function EngoMotionSettings({ motion }: { motion: MotionSettings }) {
  const [selection, setSelection] = useState(motion.preference);
  const [feedback, setFeedback] = useState("");
  const effective = selection === "on" || (selection === "system" && !motion.reduced);
  return (
    <section className="companion-motion-settings" aria-labelledby="companion-motion-title">
      <h3 id="companion-motion-title">Chuyển động Engo</h3>
      <p className="companion-muted">Chỉ thay đổi chuyển động của nhân vật Engo trên trình duyệt này.</p>
      <fieldset className="companion-motion-options">
        <legend className="sr-only">Chế độ chuyển động Engo</legend>
        {choices.map(choice => (
          <label key={choice.value} className="companion-motion-option">
            <input type="radio" name="engo-motion" value={choice.value} checked={selection === choice.value}
              onChange={() => { setSelection(choice.value); setFeedback(""); }} />
            <span><strong>{choice.label}</strong><small>{choice.detail}</small></span>
          </label>
        ))}
      </fieldset>
      <p className="companion-muted">Hệ thống: {motion.reduced ? "giảm chuyển động" : "không yêu cầu giảm chuyển động"}. Engo: {effective ? "có chuyển động" : "ảnh tĩnh"}.</p>
      <div className="companion-memory-actions">
        <Button type="button" disabled={selection === motion.preference} onClick={() => {
          setFeedback(motion.savePreference(selection) ? "Đã lưu lựa chọn." : "Không thể lưu lựa chọn trên trình duyệt này.");
        }}>Lưu chuyển động</Button>
        <Button type="button" variant="ghost" disabled={selection === motion.preference} onClick={() => { setSelection(motion.preference); setFeedback(""); }}>Hủy</Button>
      </div>
      <p role="status" className="companion-muted">{feedback}</p>
    </section>
  );
}
