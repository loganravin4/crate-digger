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

/** Tier marks, drawn as record center labels: the fuller the label, the deeper the find. */
export function TierMark({ tier, className }: { tier: string | null; className?: string }) {
  const t = tier ?? "miss";
  const color = `var(--tier-${t})`;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className={className}>
      {t === "miss" ? (
        <path d="M5 5l8 8M13 5l-8 8" stroke={color} strokeWidth="2" />
      ) : t === "holy-grail" ? (
        <path d="M9 1.5l2.1 4.6 5 .6-3.7 3.4 1 5-4.4-2.5-4.4 2.5 1-5L1.9 6.7l5-.6z" fill={color} />
      ) : (
        <>
          <circle cx="9" cy="9" r="7.5" fill="none" stroke={color} strokeWidth="1.5" />
          {t === "staff-pick" && <path d="M9 4.5l4.5 4.5L9 13.5 4.5 9z" fill={color} />}
          {t === "album-track" && <path d="M9 4a5 5 0 0 1 0 10z" fill={color} />}
          {t === "b-side" && <circle cx="9" cy="9" r="4.2" fill={color} />}
          {t === "white-label" && <circle cx="9" cy="9" r="5.4" fill={color} />}
          <circle cx="9" cy="9" r="1" fill="var(--ink)" />
        </>
      )}
    </svg>
  );
}

export function SpeakerIcon({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M3 8v4h3l5 4V4L6 8z" />
      {on ? <path d="M14 7.5a3.5 3.5 0 0 1 0 5M16 5a7 7 0 0 1 0 10" /> : <path d="M14 8l4 4M18 8l-4 4" />}
    </svg>
  );
}

export function ImageIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M3 4h14v12H3zM3 13l4-4 3 3 2-2 5 5" />
      <circle cx="13.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
