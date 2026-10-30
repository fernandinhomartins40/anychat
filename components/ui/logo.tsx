/**
 * AnyChat mark: a speech bubble in the brand gradient with a spark, plus the
 * wordmark. Pure SVG + text, no image request.
 */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="anychat-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c3aed" />
            <stop offset="0.55" stopColor="#db2777" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path
          d="M16 3C8.8 3 3 8.3 3 14.8c0 3.6 1.8 6.8 4.6 9L6.5 29l5.6-2.9c1.2.3 2.5.5 3.9.5 7.2 0 13-5.3 13-11.8S23.2 3 16 3Z"
          fill="url(#anychat-logo)"
        />
        <path d="m16 8.5 1.6 4.3 4.4 1.6-4.4 1.6L16 20.3l-1.6-4.3-4.4-1.6 4.4-1.6L16 8.5Z" fill="#fff" />
      </svg>
      {!compact && <span className="text-lg font-extrabold tracking-tight text-foreground">AnyChat</span>}
    </span>
  );
}
