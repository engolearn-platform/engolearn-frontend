import { Flame } from "lucide-react";

interface LearningTopBarProps {
  userName: string;
  streakDays: number;
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
  avatarUrl,
}: LearningTopBarProps) {
  return (
    <header className="z-20 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-5 py-4 md:hidden">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-10 rounded-full border border-outline-variant object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-primary-container text-label-lg font-semibold text-on-primary-container"
          >
            {getInitials(userName)}
          </span>
        )}
        <h1 className="text-headline-sm font-semibold text-primary">
          Xin chào, {userName}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-label-lg text-on-surface-variant">
          {streakDays} Ngày
        </span>
        <Flame
          className="size-5 text-on-secondary-container"
          fill="currentColor"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
