export function HatLogo() {
  return (
    <svg
      viewBox="0 0 240 200"
      className="w-48 h-40 sm:w-64 sm:h-52 relative drop-shadow-[0_0_25px_rgba(168,85,247,0.5)] transform -rotate-6 hover:rotate-0 transition-transform duration-500"
      role="img"
      aria-label="Chapéu estilizado do Curious Hat"
    >
      <defs>
        <linearGradient id="hatCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b0764" />
          <stop offset="50%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="hatBand" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="hatBrim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#581c87" />
          <stop offset="50%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="152" rx="105" ry="26" fill="#000000" opacity="0.7" />
      <path
        d="M 15 142 C 45 175, 195 175, 225 142 C 195 122, 45 122, 15 142 Z"
        fill="url(#hatBrim)"
        stroke="#c084fc"
        strokeWidth="2.5"
      />
      <path
        d="M 62 135 L 74 42 C 95 28, 145 28, 166 42 L 178 135 Z"
        fill="url(#hatCrown)"
        stroke="#e9d5ff"
        strokeWidth="2"
      />
      <ellipse cx="120" cy="42" rx="46" ry="11" fill="#2e1065" stroke="#c084fc" strokeWidth="2" />
      <path
        d="M 64 115 C 95 126, 145 126, 176 115 L 178 133 C 145 144, 95 144, 62 133 Z"
        fill="url(#hatBand)"
      />
      <path d="M 82 55 L 75 110" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
