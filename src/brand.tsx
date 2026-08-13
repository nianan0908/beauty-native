interface BrandMarkProps {
  className?: string;
  size?: "small" | "medium";
}

export function BrandMark({ className = "", size = "medium" }: BrandMarkProps) {
  return (
    <span className={`brand-symbol brand-symbol-${size} ${className}`.trim()} aria-hidden="true">
      <span className="brand-symbol-letter">美</span>
      <span className="brand-symbol-sun" />
    </span>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-lockup ${compact ? "compact" : ""}`.trim()}>
      <BrandMark />
      {!compact && (
        <span className="brand-wordmark">
          <strong>美天</strong>
          <span>美业</span>
        </span>
      )}
    </span>
  );
}
