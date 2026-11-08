interface BrandImageProps {
  variant?: "full" | "mark";
  className?: string;
}

export default function BrandImage({ variant = "full", className }: BrandImageProps) {
  const isMark = variant === "mark";

  return (
    <img
      src={isMark ? "/brand/engolearn-mark.png" : "/brand/engolearn-logo.webp"}
      alt=""
      aria-hidden="true"
      width={isMark ? 128 : 560}
      height={isMark ? 128 : 160}
      className={className}
    />
  );
}
