import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "../utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
  role?: string;
}

export function Card({
  children,
  className,
  onClick,
  onKeyDown,
  tabIndex,
  role,
}: CardProps) {
  return (
    <div
      className={cn("rounded-lg border p-4 border-black/20", className)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      role={role}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("font-bold text-lg", className)}>{children}</div>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("text-gray-700 mt-2", className)}>{children}</div>;
}
