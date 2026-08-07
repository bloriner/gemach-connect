export function Logo({ className, iconOnly, dark }: { className?: string; iconOnly?: boolean; dark?: boolean }) {
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
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
        </defs>
        {/* Building body */}
        <rect x="6" y="20" width="36" height="24" rx="3" fill="url(#logoGrad)" />
        {/* Roof */}
        <polygon points="24,4 2,20 46,20" fill="url(#logoGrad)" />
        {/* Gold columns */}
        <rect x="10" y="24" width="4" height="20" rx="0.5" fill="#c9a84c" opacity="0.4" />
        <rect x="16" y="24" width="4" height="20" rx="0.5" fill="#c9a84c" opacity="0.25" />
        <rect x="22" y="24" width="4" height="20" rx="0.5" fill="white" opacity="0.3" />
        <rect x="28" y="24" width="4" height="20" rx="0.5" fill="#c9a84c" opacity="0.25" />
        <rect x="34" y="24" width="4" height="20" rx="0.5" fill="#c9a84c" opacity="0.4" />
        {/* Gold checkmark badge */}
        <circle cx="38" cy="12" r="8" fill="#c9a84c" />
        <path d="M34 12l2.5 2.5 5-5" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span className={dark ? "text-lg font-extrabold tracking-tight text-white" : "text-lg font-extrabold tracking-tight text-navy-900"}>
            PREMIER
          </span>
          <span className={dark ? "text-[11px] font-medium tracking-[0.2em] text-brand-300 uppercase" : "text-[11px] font-medium tracking-[0.2em] text-brand-500 uppercase"}>
            Pro Services
          </span>
        </div>
      )}
    </div>
  );
}
