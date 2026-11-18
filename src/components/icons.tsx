type P = { className?: string };
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "square" as const,
  "aria-hidden": true,
};

export function ArrowRight({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

export function ArrowLeft({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M17 10H4M9 5l-5 5 5 5" />
    </svg>
  );
}

export function ShareIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2v11M6 6l4-4 4 4M4 11v7h12v-7" />
    </svg>
  );
}

export function Shuffle({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M2 5h4l8 10h4M2 15h4l2-2.5M12 7.5 14 5h4M15 2l3 3-3 3M15 12l3 3-3 3" />
    </svg>
  );
}

/** Tier marks, drawn as record center labels: fuller label = rarer pull. */
export function TierMark({ tier, className }: { tier: string; className?: string }) {
  const color = `var(--tier-${tier})`;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className={className}>
      {tier === "miss" ? (
        <path d="M5 5l8 8M13 5l-8 8" stroke={color} strokeWidth="2" />
      ) : (
        <>
          <circle cx="9" cy="9" r="7.5" fill="none" stroke={color} strokeWidth="1.5" />
          {tier === "white-label" && <circle cx="9" cy="9" r="5" fill={color} />}
          {tier === "b-side" && <circle cx="9" cy="9" r="4" fill={color} />}
          {tier === "album-track" && <path d="M9 4a5 5 0 0 1 0 10z" fill={color} />}
          <circle cx="9" cy="9" r="1" fill="var(--ink)" />
        </>
      )}
    </svg>
  );
}
