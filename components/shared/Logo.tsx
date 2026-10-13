type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="nudge-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a8d72" />
          <stop offset="1" stopColor="#46543f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#nudge-logo-gradient)" />
      <path
        d="M18 33l9 9 19-21"
        fill="none"
        stroke="#fff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
