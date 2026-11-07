import {
  ArrowDownRight,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  GraduationCap,
  Layers3,
  ListChecks,
  Menu,
  MessageCircle,
  Route,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { LANDING_PATHS } from "@features/landing-page/paths";
import { ROUTES } from "@shared/constants";

const benefits = [
  { icon: Route, title: "Lộ trình theo CEFR", description: "Học đúng trình độ, tiến bộ bền vững." },
  { icon: BookOpenText, title: "Nội dung thực tế", description: "Từ vựng theo tình huống gần gũi với đời sống." },
  { icon: Layers3, title: "Luyện tập đa dạng", description: "Nghe, đọc, viết, nói và củng cố kiến thức." },
  { icon: TrendingUp, title: "Theo dõi tiến độ", description: "Đánh giá kết quả và điều chỉnh lộ trình học." },
];

const features = [
  {
    icon: MessageCircle,
    title: "Học theo chủ đề",
    eyebrow: "TỪ VỰNG & GIAO TIẾP",
    description: "Học tiếng Anh qua các tình huống quen thuộc trong cuộc sống.",
    to: ROUTES.TOPICS,
    action: "Khám phá chủ đề",
    color: "bg-learning-mint",
  },
  {
    icon: BookOpenText,
    title: "Ngữ pháp",
    eyebrow: "NẮM VỮNG NỀN TẢNG",
    description: "Ôn tập ngữ pháp theo lộ trình rõ ràng, dễ theo dõi.",
    to: ROUTES.GRAMMAR,
    action: "Khám phá ngữ pháp",
    color: "bg-learning-nav-active",
  },
  {
    icon: ListChecks,
    title: "Kiểm tra trình độ",
    eyebrow: "TÌM MỨC HỌC PHÙ HỢP",
    description: "Tính năng kiểm tra trình độ đang được chuẩn bị.",
    to: LANDING_PATHS.PLACEMENT,
    action: "Tìm hiểu thêm",
    color: "bg-learning-note",
  },
];

const journey = [
  { icon: ListChecks, number: "01", title: "Tìm hiểu trình độ", description: "Chọn nội dung phù hợp với mục tiêu học tập của bạn." },
  { icon: BookOpenText, number: "02", title: "Học và luyện tập", description: "Khám phá chủ đề, ngữ pháp và luyện tập mỗi ngày." },
  { icon: TrendingUp, number: "03", title: "Theo dõi tiến bộ", description: "Nhìn lại hành trình và tiếp tục với bước học tiếp theo." },
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to={ROUTES.HOME} aria-label="EngoLearn — Trang chủ" className={`inline-flex min-h-12 items-center gap-3 rounded-xl font-bold text-headline-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${light ? "text-white" : "text-primary"}`}>
      <span aria-hidden="true" className={`grid size-10 place-items-center rounded-full ${light ? "bg-white/15" : "bg-learning-mint"}`}>
        <GraduationCap className="size-6" />
      </span>
      <span>EngoLearn</span>
    </Link>
  );
}

export default function GuestLandingView({ sessionError, onRetry }: { sessionError?: boolean; onRetry?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-surface text-on-surface">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Bỏ qua điều hướng</a>
      {sessionError && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 bg-learning-note px-5 py-3 text-center text-label-lg text-learning-note-ink">
          <span>Chưa kiểm tra được phiên đăng nhập. Bạn vẫn có thể khám phá các nội dung công khai.</span>
          {onRetry && <Button type="button" variant="outline" className="min-h-11 border-learning-note-ink text-learning-note-ink" onClick={onRetry}>Thử lại</Button>}
        </div>
      )}
      <header className="relative z-20 border-b border-learning-outline bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5">
          <Brand />
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
            <a className="min-h-11 rounded-xl px-4 py-3 text-label-lg font-semibold text-primary hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary" href="#main-content">Trang chủ</a>
            <a className="min-h-11 rounded-xl px-4 py-3 text-label-lg font-semibold hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary" href="#features">Tính năng</a>
            <a className="min-h-11 rounded-xl px-4 py-3 text-label-lg font-semibold hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary" href="#journey">Lộ trình học</a>
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Button asChild variant="outline" className="min-h-12 rounded-xl border-learning-mint-border px-5">
              <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
            </Button>
            <Button asChild className="min-h-12 rounded-xl px-5">
              <Link to={LANDING_PATHS.PLACEMENT}>Kiểm tra trình độ <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
          <button type="button" aria-label={menuOpen ? "Đóng điều hướng" : "Mở điều hướng"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)} className="grid size-12 place-items-center rounded-xl text-primary hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary lg:hidden">
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" aria-label="Điều hướng chính" className="grid gap-1 border-t border-learning-outline bg-white px-5 py-3 lg:hidden">
            <a onClick={() => setMenuOpen(false)} className="min-h-12 rounded-xl px-4 py-3 font-semibold hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary" href="#main-content">Trang chủ</a>
            <a onClick={() => setMenuOpen(false)} className="min-h-12 rounded-xl px-4 py-3 font-semibold hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary" href="#features">Tính năng</a>
            <a onClick={() => setMenuOpen(false)} className="min-h-12 rounded-xl px-4 py-3 font-semibold hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary" href="#journey">Lộ trình học</a>
            <Button asChild variant="outline" className="mt-2 min-h-12 rounded-xl">
              <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
            </Button>
            <Button asChild className="min-h-12 rounded-xl">
              <Link to={LANDING_PATHS.PLACEMENT}>Kiểm tra trình độ <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </nav>
        )}
      </header>

      <main id="main-content">
        <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-gradient-to-br from-learning-nav-active via-learning-mint to-white">
          <div aria-hidden="true" className="absolute -right-24 top-0 -z-10 size-96 rounded-full bg-white/40 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-10 pt-10 sm:pb-14 sm:pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-4 lg:pb-16 lg:pt-16">
            <div className="relative z-10 max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-learning-mint-border bg-white/80 px-4 py-2 text-label-lg font-semibold text-primary">
                <CheckCircle2 aria-hidden="true" className="size-4" /> Nền tảng tiếng Anh theo CEFR
              </span>
              <h1 id="hero-title" className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-on-surface sm:text-5xl sm:leading-tight">Học tiếng Anh theo cách phù hợp với bạn</h1>
              <p className="max-w-xl text-body-lg leading-8 text-on-surface-variant">Khám phá trình độ hiện tại, học từ vựng theo tình huống thực tế và cải thiện ngữ pháp với EngoLearn.</p>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
                <Button asChild className="min-h-12 rounded-xl px-5 text-base">
                  <Link to={LANDING_PATHS.PLACEMENT}><ListChecks aria-hidden="true" />Kiểm tra trình độ đầu vào<ArrowRight aria-hidden="true" /></Link>
                </Button>
                <Button asChild variant="outline" className="min-h-12 rounded-xl border-primary/30 bg-white/70 px-5 text-base">
                  <Link to={ROUTES.LOGIN}><GraduationCap aria-hidden="true" />Đăng nhập để học tiếp</Link>
                </Button>
              </div>
              <p className="flex items-start gap-2 text-label-lg text-on-surface-variant"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />Tính năng kiểm tra trình độ đang được chuẩn bị. Bạn có thể bắt đầu với chủ đề và ngữ pháp.</p>
            </div>
            <div aria-hidden="true" className="relative mx-auto w-full max-w-2xl">
              <div className="absolute inset-x-10 bottom-3 top-8 rounded-[2rem] bg-white/55 blur-2xl" />
              <img src="/landing/hero.webp" alt="" width="1050" height="700" fetchPriority="high" className="relative z-10 h-auto w-full object-contain" />
              <div className="absolute left-0 top-1/4 z-20 hidden items-center gap-2 rounded-2xl border border-learning-mint-border bg-white px-4 py-3 font-semibold text-primary shadow-sm sm:flex">
                <TrendingUp aria-hidden="true" className="size-5" />Từng bước tiến bộ
              </div>
              <div className="absolute bottom-6 right-0 z-20 hidden items-center gap-2 rounded-2xl border border-learning-mint-border bg-white px-4 py-3 font-semibold text-primary shadow-sm sm:flex">
                <MessageCircle aria-hidden="true" className="size-5" />Học qua tình huống
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Điểm nổi bật" className="relative z-10 mx-auto -mt-1 max-w-7xl px-5 pb-16 sm:-mt-7">
          <ul className="grid gap-1 rounded-3xl border border-learning-outline bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex min-h-24 items-center gap-4 rounded-2xl px-3 py-4 sm:px-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-learning-mint text-primary"><Icon aria-hidden="true" className="size-7" /></span>
                <span className="space-y-1"><span className="block font-semibold">{title}</span><span className="block text-label-lg leading-5 text-on-surface-variant">{description}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-7xl scroll-mt-8 px-5 pb-20">
          <header className="mx-auto mb-9 max-w-3xl space-y-3 text-center">
            <span className="text-label-lg font-bold uppercase tracking-widest text-primary">Học theo cách của bạn</span>
            <h2 id="features-title" className="text-3xl font-bold tracking-tight sm:text-4xl">Bạn có thể học gì trên EngoLearn?</h2>
            <p className="text-body-md text-on-surface-variant">Các nội dung học tập được thiết kế để giúp bạn phát triển tiếng Anh từng bước.</p>
          </header>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, eyebrow, description, to, action, color }) => (
              <Link key={title} to={to} className="group flex min-h-64 flex-col overflow-hidden rounded-2xl border border-learning-outline bg-white p-6 transition hover:-translate-y-1 hover:border-learning-mint-border hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                <span aria-hidden="true" className={`mb-6 grid size-16 place-items-center rounded-2xl ${color} text-primary`}><Icon className="size-8" /></span>
                <span className="text-label-sm font-bold tracking-wider text-primary">{eyebrow}</span>
                <span className="mt-1 text-headline-md font-bold">{title}</span>
                <span className="mt-2 flex-1 text-body-md leading-6 text-on-surface-variant">{description}</span>
                <span className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary">{action}<ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </section>

        <section id="journey" aria-labelledby="journey-title" className="scroll-mt-8 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5">
            <header className="mx-auto mb-10 max-w-3xl space-y-3 text-center">
              <span className="text-label-lg font-bold uppercase tracking-widest text-primary">Bắt đầu thật đơn giản</span>
              <h2 id="journey-title" className="text-3xl font-bold tracking-tight sm:text-4xl">Hành trình học cùng EngoLearn</h2>
              <p className="text-body-md text-on-surface-variant">Tìm nội dung phù hợp, thực hành đều đặn và theo dõi hành trình của bạn.</p>
            </header>
            <ol className="grid gap-5 lg:grid-cols-3">
              {journey.map(({ icon: Icon, number, title, description }) => (
                <li key={number} className="relative flex items-start gap-4 rounded-2xl border border-learning-outline bg-surface p-5 sm:p-6">
                  <span className="relative grid size-16 shrink-0 place-items-center rounded-full border-2 border-white bg-learning-mint text-primary shadow-sm"><Icon aria-hidden="true" className="size-8" /><span className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-white">{number}</span></span>
                  <span className="space-y-2"><span className="block text-headline-md font-bold">{title}</span><span className="block text-body-md leading-6 text-on-surface-variant">{description}</span></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="start-title" className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl justify-items-center gap-5 overflow-hidden rounded-3xl bg-primary px-6 py-8 text-center text-white sm:px-10 sm:py-9 lg:grid-cols-[minmax(12rem,0.85fr)_minmax(0,2fr)_auto] lg:items-center lg:gap-8 lg:px-12 lg:py-10 lg:text-left xl:px-14 xl:py-12">
            <img src="/landing/closing-banner.webp" alt="" width="720" height="480" loading="lazy" decoding="async" className="h-auto w-32 object-contain sm:w-44 lg:w-full lg:max-w-64" />
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 text-label-lg font-semibold text-white/80"><GraduationCap aria-hidden="true" className="size-5" />ENGOLEARN</span>
              <h2 id="start-title" className="text-3xl font-bold leading-tight sm:text-4xl">Sẵn sàng bắt đầu hành trình học tiếng Anh của bạn?</h2>
              <p className="text-body-md leading-6 text-white/85">Khám phá chủ đề và ngữ pháp để bắt đầu học theo cách của riêng bạn.</p>
            </div>
            <Button asChild variant="secondary" className="min-h-12 shrink-0 rounded-xl bg-white px-6 font-bold text-primary hover:bg-learning-mint">
              <Link to={LANDING_PATHS.PLACEMENT}>Kiểm tra trình độ ngay<ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </section>

      </main>

      <footer className="border-t border-learning-outline bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2"><Brand /><p className="text-label-lg text-on-surface-variant">Học tiếng Anh theo chuẩn CEFR.</p></div>
          <div><h2 className="mb-3 font-bold">Sản phẩm</h2><ul className="space-y-2 text-label-lg text-on-surface-variant"><li><Link className="rounded focus-visible:outline-2 focus-visible:outline-primary hover:text-primary" to={ROUTES.TOPICS}>Học theo chủ đề</Link></li><li><Link className="rounded focus-visible:outline-2 focus-visible:outline-primary hover:text-primary" to={ROUTES.GRAMMAR}>Ngữ pháp</Link></li><li><Link className="rounded focus-visible:outline-2 focus-visible:outline-primary hover:text-primary" to={LANDING_PATHS.PLACEMENT}>Kiểm tra trình độ</Link></li></ul></div>
          <div><h2 className="mb-3 font-bold">Hỗ trợ</h2><ul className="space-y-2 text-label-lg text-on-surface-variant"><li><Link className="rounded focus-visible:outline-2 focus-visible:outline-primary hover:text-primary" to={ROUTES.LOGIN}>Đăng nhập</Link></li><li><Link className="rounded focus-visible:outline-2 focus-visible:outline-primary hover:text-primary" to={ROUTES.HOME}>Trang chủ</Link></li></ul></div>
          <div><h2 className="mb-3 font-bold">Bắt đầu học</h2><p className="mb-3 text-label-lg leading-5 text-on-surface-variant">Chọn một chủ đề và bắt đầu luyện tập tiếng Anh.</p><Link className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4" to={ROUTES.TOPICS}>Khám phá ngay<ArrowDownRight aria-hidden="true" className="size-4" /></Link></div>
        </div>
        <div className="border-t border-learning-outline px-5 py-4 text-center text-label-sm text-on-surface-variant">© EngoLearn</div>
      </footer>
    </div>
  );
}
