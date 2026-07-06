export function sentimentMeta(n: number): { text: string; color: string; note: string } {
  if (n < 25) {
    return {
      text: "Extreme Fear",
      color: "#f87171",
      note: "Extreme fear in the market. A potential buying opportunity for long-term investors.",
    };
  }
  if (n < 45) {
    return {
      text: "Fear",
      color: "#fb923c",
      note: "Fear is dominating sentiment. Traders are staying cautious and risk appetite remains soft.",
    };
  }
  if (n < 55) {
    return {
      text: "Neutral",
      color: "#fbbf24",
      note: "The market is balanced. Momentum is mixed as buyers and sellers remain evenly matched.",
    };
  }
  if (n < 75) {
    return {
      text: "Greed",
      color: "#a3e635",
      note: "Greed is building in the market. Momentum is improving, but entries should stay disciplined.",
    };
  }
  return {
    text: "Extreme Greed",
    color: "#2dd4bf",
    note: "Extreme greed is in control. Strong upside momentum can continue, but pullback risk is elevated.",
  };
}

/** A semicircular "Fear & Greed" style gauge (0-100). Value is illustrative/simulated. */
export function SentimentGauge({ value = 18 }: { value?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const { text, color } = sentimentMeta(v);

  const W = 320;
  const H = 180;
  const cx = W / 2;
  const cy = H - 20;
  const r = 130;

  const angle = Math.PI - (v / 100) * Math.PI;
  const nx = cx + Math.cos(angle) * (r - 18);
  const ny = cy - Math.sin(angle) * (r - 18);

  const segs = [
    { from: 0, to: 25, c: "#f87171" },
    { from: 25, to: 45, c: "#fb923c" },
    { from: 45, to: 55, c: "#fbbf24" },
    { from: 55, to: 75, c: "#a3e635" },
    { from: 75, to: 100, c: "#2dd4bf" },
  ];

  const polar = (pct: number) => {
    const a = Math.PI - (pct / 100) * Math.PI;
    return [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
  };

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 360, height: "auto" }}>
        {segs.map((s, i) => {
          const [x1, y1] = polar(s.from);
          const [x2, y2] = polar(s.to);
          const large = s.to - s.from > 50 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`}
              fill="none"
              stroke={s.c}
              strokeWidth={14}
              strokeLinecap="round"
            />
          );
        })}
        <line
          x1={cx}
          y1={cy}
          x2={nx.toFixed(1)}
          y2={ny.toFixed(1)}
          stroke={color}
          strokeWidth={3}
          style={{ transition: "all 0.7s ease" }}
        />
        <circle cx={cx} cy={cy} r={7} fill={color} style={{ transition: "all 0.7s ease" }} />
      </svg>

      <div style={{ marginTop: "-0.5rem" }}>
        <div style={{ fontSize: "2.4rem", fontWeight: 800, color, transition: "all 0.7s ease" }}>
          {Math.round(v)}
        </div>
        <div
          style={{
            fontWeight: 700,
            color,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.85rem",
            transition: "all 0.7s ease",
          }}
        >
          {text}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 360, margin: "0.8rem auto 0" }}>
        <span className="muted" style={{ fontSize: "0.72rem" }}>Extreme Fear</span>
        <span className="muted" style={{ fontSize: "0.72rem" }}>Neutral</span>
        <span className="muted" style={{ fontSize: "0.72rem" }}>Extreme Greed</span>
      </div>
    </div>
  );
}
