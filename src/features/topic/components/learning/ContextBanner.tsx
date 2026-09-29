export interface ContextBannerProps {
  imageUrl: string;
  imageAlt: string;
  promptLabel: string;
  promptText: string;
}

export function ContextBanner({
  imageUrl,
  imageAlt,
  promptLabel,
  promptText,
}: ContextBannerProps) {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-sm md:h-80">
      <div
        role="img"
        aria-label={imageAlt}
        className="h-full w-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 text-white md:p-7">
        <div className="mb-2 flex items-center gap-2 text-primary-fixed">
          <span className="text-label-sm font-semibold uppercase tracking-wider">
            {promptLabel}
          </span>
        </div>
        <p className="text-headline-md leading-snug font-semibold text-white">
          {promptText}
        </p>
      </div>
    </div>
  );
}
