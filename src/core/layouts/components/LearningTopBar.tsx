import { Flame } from "lucide-react";

interface LearningTopBarProps {
  userName: string;
  streakDays: number;
  level?: string;
  levelName?: string;
  avatarUrl?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function LearningTopBar({
  userName,
  streakDays,
  level = "A1",
  levelName = "Beginner",
  avatarUrl,
}: LearningTopBarProps) {
  return (
    <header className="z-20 w-full border-b border-outline-variant/60 bg-surface-container-lowest">
      <div className="hidden h-[67px] items-center justify-between px-8 lg:flex xl:px-10">
        <h1 className="text-[17px] leading-[25.5px] font-bold text-on-surface">
          Xin chào, {userName}
        </h1>

        <div className="flex items-center gap-[10px] rounded-full border border-outline-variant/60 bg-surface px-[15px] py-[7px] text-[13px] leading-[19.5px] font-semibold text-on-surface">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          <span>{level}</span>
          <span className="h-4 w-px bg-outline-variant" aria-hidden="true" />
          <span className="text-on-surface-variant">{levelName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-9 shrink-0 rounded-full border border-outline-variant object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-md font-semibold text-on-primary-container"
            >
              {getInitials(userName)}
            </span>
          )}

          <h1 className="truncate text-headline-sm font-semibold text-primary">
            Xin chào, {userName}
          </h1>
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-2">
          <span className="text-label-md text-on-surface-variant">
            {streakDays} Ngày
          </span>

          <Flame
            className="size-5 text-on-secondary-container"
            fill="currentColor"
            aria-hidden="true"
          />
        </div>
      </div>
    </header>
  );
}
