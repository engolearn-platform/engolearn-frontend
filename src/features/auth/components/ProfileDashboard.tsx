import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, BookOpen, Check, LogOut, Medal, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components/Card";
import { ROUTES } from "@shared/constants";
import { useAuth, useFetch } from "@shared/hooks";
import { useMySubscription } from "@features/subscription/contract";
import { profileService } from "@features/auth/services/profile.service";
import type { UserProfile } from "@features/auth/services/profile.service";

type User = { id: string; email: string; role: "USER" | "CONTENT_MANAGER" | "ADMIN" };

const roleLabels: Record<User["role"], string> = {
  USER: "Học viên", CONTENT_MANAGER: "Quản lý nội dung", ADMIN: "Quản trị viên",
};
const levelLabels: Record<UserProfile["cefrLevel"], string> = {
  A1: "Sơ cấp", A2: "Sơ cấp", B1: "Trung cấp", B2: "Trung cao", C1: "Cao cấp", C2: "Thành thạo",
};

function initials(value: string): string {
  const words = value.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : value.slice(0, 2)).toLocaleUpperCase("vi-VN");
}

function ProfileError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="space-y-3 rounded-xl border border-learning-outline bg-surface p-5">
    <p className="text-body-md text-on-surface-variant">{message}</p>
    <Button type="button" variant="outline" className="min-h-12" onClick={retry}><RefreshCw aria-hidden="true" />Thử lại</Button>
  </div>;
}

export default function ProfileDashboard({ user, pending, message, notice, onLogout, onCheckSession, onRefreshSession }: {
  user: User;
  pending: boolean;
  message: string | null;
  notice: string | null;
  onLogout: () => void;
  onCheckSession: () => void;
  onRefreshSession: () => void;
}) {
  const profile = useFetch(profileService.me);
  const session = useAuth();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null | undefined>(undefined);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const displayName = savedName === undefined ? profile.data?.displayName : savedName;
  const title = displayName || user.email;
  const verifiedRole = !session.isLoading && !session.error && session.user?.id === user.id ? session.user.role : null;
  const showLearnerLevel = verifiedRole === "USER";
  const subscription = useMySubscription(showLearnerLevel);
  const summary = subscription.data?.data;
  const benefits = summary ? [...summary.currentBenefits.benefits].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const activePeriod = summary?.status === "ACTIVE" || summary?.status === "TRIAL";

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextName = draftName.trim();
    if (nextName.length > 80) { setSaveError("Tên hiển thị tối đa 80 ký tự."); return; }
    setSaving(true); setSaveError(null);
    try {
      const result = await profileService.updateDisplayName(nextName || null);
      if (!alive.current) return;
      setSavedName(result.displayName);
      setEditing(false);
      profile.refetch();
    } catch (error) {
      if (alive.current) setSaveError(error instanceof Error ? error.message : "Chưa thể lưu tên. Vui lòng thử lại.");
    } finally {
      if (alive.current) setSaving(false);
    }
  }

  return <main className="min-h-screen bg-surface px-5 py-8 text-on-surface md:py-12">
    <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
      <Link to={ROUTES.HOME} className="inline-flex min-h-12 items-center gap-2 text-body-md font-semibold text-primary underline-offset-4 hover:underline"><ArrowLeft aria-hidden="true" className="size-5" />Trang chủ</Link>
      <header className="space-y-2"><h1 className="text-headline-lg font-bold">Hồ sơ cá nhân</h1><p className="text-body-md text-on-surface-variant">{showLearnerLevel ? "Thông tin tài khoản, trình độ và quyền lợi của bạn." : "Thông tin tài khoản của bạn."}</p></header>

      <Card className="rounded-2xl border-learning-outline bg-white p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-learning-mint text-headline-md font-bold text-primary">{initials(title)}</span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3"><h2 className="break-words text-headline-md font-bold">{title}</h2>{verifiedRole && <span className="rounded-full bg-learning-mint px-3 py-1 text-label-sm font-medium text-primary">{roleLabels[verifiedRole]}</span>}</div>
            {displayName && <p className="break-all text-body-md text-on-surface-variant">{user.email}</p>}
          </div>
          <Button type="button" variant="outline" className="min-h-12 self-start border-learning-outline bg-surface sm:self-center" disabled={pending || profile.loading || !!profile.error} onClick={() => { setDraftName(displayName ?? ""); setSaveError(null); setEditing(true); }}><Pencil aria-hidden="true" />Chỉnh sửa tên</Button>
        </div>
        {editing && <form onSubmit={saveName} className="mt-5 flex flex-col gap-3 border-t border-learning-outline pt-5">
          <label htmlFor="profile-display-name" className="text-body-md font-semibold">Tên hiển thị</label>
          <input id="profile-display-name" name="displayName" autoComplete="nickname" maxLength={80} value={draftName} onChange={event => setDraftName(event.target.value)} disabled={saving} className="min-h-12 w-full rounded-md border border-learning-outline bg-white px-3 text-body-md outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          <p className="text-label-sm text-on-surface-variant">Để trống rồi lưu để xóa tên hiển thị. Email không thay đổi.</p>
          {saveError && <p role="alert" className="text-body-md text-error">{saveError}</p>}
          <div className="flex flex-wrap gap-3"><Button type="submit" className="min-h-12" disabled={saving}>{saving ? "Đang lưu…" : "Lưu tên"}</Button><Button type="button" variant="outline" className="min-h-12" disabled={saving} onClick={() => setEditing(false)}>Hủy</Button></div>
        </form>}
      </Card>

      {showLearnerLevel && <div className="grid gap-5 md:grid-cols-2">
        <Card className="flex flex-col gap-6 rounded-2xl border-learning-outline bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-3 text-headline-md font-semibold"><span className="rounded-xl bg-learning-mint p-2 text-primary"><BookOpen aria-hidden="true" className="size-5" /></span>Trình độ CEFR</h2><span className="rounded-full bg-learning-mint px-3 py-1 text-label-sm text-primary">Trình độ hiện tại</span></div>
          {profile.loading && <p role="status" className="text-body-md text-on-surface-variant">Đang tải trình độ…</p>}
          {profile.error && <ProfileError message={profile.error.code === "PROFILE_NOT_FOUND" ? "Hồ sơ của bạn chưa được khởi tạo. Vui lòng liên hệ quản trị viên." : "Chưa thể tải trình độ. Vui lòng thử lại."} retry={profile.refetch} />}
          {profile.data && <><div className="flex items-center gap-5 rounded-xl border border-learning-outline bg-surface p-5"><strong className="text-5xl text-primary">{profile.data.cefrLevel}</strong><div className="min-w-0"><p className="text-headline-md font-semibold">{levelLabels[profile.data.cefrLevel]}</p><p className="text-body-md text-on-surface-variant">Khung tham chiếu châu Âu (CEFR)</p></div></div><p className="rounded-xl border border-learning-outline bg-surface p-5 text-body-md text-on-surface-variant">Trình độ hồ sơ giúp hệ thống chọn nội dung học phù hợp với bạn.</p></>}
        </Card>

        <Card className="flex flex-col gap-6 rounded-2xl border-learning-outline bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-3 text-headline-md font-semibold"><span className="rounded-xl bg-learning-mint p-2 text-primary"><Medal aria-hidden="true" className="size-5" /></span>Gói quyền lợi</h2>{summary && <span className="rounded-full bg-learning-mint px-3 py-1 text-label-sm text-primary">{activePeriod ? "Đang hiệu lực" : "Gói hiện tại"}</span>}</div>
          {subscription.loading && <p role="status" className="text-body-md text-on-surface-variant">Đang tải quyền lợi…</p>}
          {subscription.error && <ProfileError message="Chưa thể tải gói quyền lợi. Vui lòng thử lại." retry={subscription.refetch} />}
          {summary && <><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-headline-lg font-bold text-primary">{summary.currentBenefits.displayName}</h3><p className="text-body-md text-on-surface-variant">{summary.tier === "FREE" ? "Gói miễn phí" : summary.status === "TRIAL" ? "Gói dùng thử" : "Gói thành viên"}</p></div>{activePeriod && summary.periodEndAt && <p className="text-body-md text-on-surface-variant">Hạn dùng: <time className="font-semibold text-on-surface" dateTime={summary.periodEndAt}>{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(summary.periodEndAt))}</time></p>}</div><ul className="flex-1 space-y-3">{benefits.map(benefit => <li key={benefit.code} className="flex items-start gap-3 text-body-md"><span className="mt-0.5 rounded-full bg-learning-mint p-1 text-primary"><Check aria-hidden="true" className="size-4" /></span><span>{benefit.title}{benefit.displayValue ? ` · ${benefit.displayValue}` : ""}</span></li>)}{benefits.length === 0 && <li className="text-body-md text-on-surface-variant">Chưa có quyền lợi được công bố.</li>}</ul><Link to={ROUTES.SUBSCRIPTION} className="inline-flex min-h-12 items-center gap-2 self-start font-semibold text-primary underline-offset-4 hover:underline">Xem quyền lợi <ArrowRight aria-hidden="true" className="size-5" /></Link></>}
        </Card>
      </div>}

      <Button type="button" variant="outline" className="min-h-12 border-error/20 bg-error-container/30 text-error hover:bg-error-container" disabled={pending} onClick={onLogout}><LogOut aria-hidden="true" />Đăng xuất tài khoản</Button>
      {notice && <p role="status" className="text-body-md text-on-surface-variant">{notice}</p>}
      <details className="rounded-2xl border border-learning-outline bg-white p-5"><summary className="cursor-pointer font-semibold">Thông tin phiên đăng nhập (Kỹ thuật)</summary><div className="mt-5 space-y-4 border-t border-learning-outline pt-5"><p className="break-all text-body-md text-on-surface-variant">ID tài khoản: {user.id}</p><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" className="min-h-12" disabled={pending} onClick={onCheckSession}>Kiểm tra phiên</Button><Button type="button" variant="outline" className="min-h-12" disabled={pending} onClick={onRefreshSession}>Làm mới phiên</Button><Button type="button" variant="outline" className="min-h-12" disabled={pending} onClick={() => window.location.reload()}>Tải lại trang</Button></div>{message && <p role="alert" className="text-body-md text-error">{message}</p>}</div></details>
    </div>
  </main>;
}
