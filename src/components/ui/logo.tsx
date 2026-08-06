export function Logo({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield / Building shape */}
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        {/* Building body */}
        <rect x="6" y="20" width="36" height="24" rx="3" fill="url(#logoGrad)" />
        {/* Roof */}
        <polygon points="24,4 2,20 46,20" fill="url(#logoGrad)" />
        {/* Columns */}
        <rect x="10" y="24" width="4" height="20" rx="0.5" fill="white" opacity="0.3" />
        <rect x="16" y="24" width="4" height="20" rx="0.5" fill="white" opacity="0.25" />
        <rect x="22" y="24" width="4" height="20" rx="0.5" fill="white" opacity="0.35" />
        <rect x="28" y="24" width="4" height="20" rx="0.5" fill="white" opacity="0.25" />
        <rect x="34" y="24" width="4" height="20" rx="0.5" fill="white" opacity="0.3" />
        {/* Checkmark badge */}
        <circle cx="38" cy="12" r="8" fill="#22c55e" />
        <path d="M34 12l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-tight text-white">
            PREMIER
          </span>
          <span className="text-[11px] font-medium tracking-[0.2em] text-brand-300 uppercase">
            Pro Services
          </span>
        </div>
      )}
    </div>
  );
}
