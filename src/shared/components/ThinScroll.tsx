import type * as React from "react";
import { cn } from "@shared/utils";

interface ThinScrollProps extends React.ComponentProps<"div"> {
  orientation?: "vertical" | "horizontal" | "both";
}

const overflowClasses = {
  vertical: "overflow-x-hidden overflow-y-auto",
  horizontal: "overflow-x-auto overflow-y-hidden",
  both: "overflow-auto",
} as const;

/**
 * Shared scroll container với thanh cuộn mỏng, ít gây chú ý.
 * Dùng cho nội dung dài trong Dialog/Card (thay `overflow-y-auto` trần).
 */
export function ThinScroll({
  orientation = "vertical",
  className,
  ...props
}: ThinScrollProps) {
  return (
    <div
      className={cn(
        "scroll-thin min-h-0 overscroll-contain",
        overflowClasses[orientation],
        className,
      )}
      {...props}
    />
  );
}
