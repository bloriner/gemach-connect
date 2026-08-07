export function Logo({ className, iconOnly, dark }: { className?: string; iconOnly?: boolean; dark?: boolean }) {
  const textColor = dark ? "text-white" : "text-slate-900";
  const subColor = dark ? "text-amber-300" : "text-amber-500";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <svg
        width="38"
        height="38"
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoShield" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </linearGradient>
          <linearGradient id="logoGold" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer hexagon ring */}
        <polygon
          points="26,2 48,14 48,38 26,50 4,38 4,14"
          fill="url(#logoShield)"
          stroke="url(#logoGold)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner subtle glow */}
        <polygon
          points="26,6 44,16 44,36 26,46 8,36 8,16"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.15"
          strokeLinejoin="round"
        />

        {/* Bold "P" monogram */}
        <text
          x="26"
          y="34"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="26"
          fontWeight="bold"
          fill="white"
          letterSpacing="0"
        >
          P
        </text>

        {/* Gold accent bar below P */}
        <rect x="16" y="40" width="20" height="2.5" rx="1.25" fill="url(#logoGold)" opacity="0.9" />
      </svg>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`text-lg font-extrabold tracking-tight leading-none ${textColor}`}>
            PREMIER
          </span>
          <span className={`text-[10px] font-semibold tracking-[0.22em] uppercase leading-tight ${subColor}`}>
            Pro Services
          </span>
        </div>
      )}
    </div>
  );
}
