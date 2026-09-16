import { cn } from "@/lib/utils";

export const BRAND_NAME = "Rolefield";
export const BRAND_TAGLINE = "Job search workspace";

interface BrandMarkProps {
  className?: string;
}

/** Compact field-rows mark. Colour comes from `currentColor` (the plate) and `--brand-mark-fg` (the rows). */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8 shrink-0 text-brand", className)}
      aria-hidden
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <rect
        x="7"
        y="8.5"
        width="18"
        height="3.2"
        rx="1.6"
        fill="var(--brand-mark-fg)"
      />
      <rect
        x="7"
        y="14.4"
        width="12"
        height="3.2"
        rx="1.6"
        fill="var(--brand-mark-fg)"
      />
      <rect
        x="7"
        y="20.3"
        width="15"
        height="3.2"
        rx="1.6"
        fill="var(--brand-mark-fg)"
      />
    </svg>
  );
}

interface BrandProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function Brand({
  className,
  markClassName,
  showWordmark = true,
  wordmarkClassName,
}: BrandProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <BrandMark className={markClassName} />
      {showWordmark ? (
        <span
          className={cn(
            "text-display truncate text-[15px] text-foreground",
            wordmarkClassName,
          )}
        >
          {BRAND_NAME}
        </span>
      ) : (
        <span className="sr-only">{BRAND_NAME}</span>
      )}
    </span>
  );
}

export default Brand;
