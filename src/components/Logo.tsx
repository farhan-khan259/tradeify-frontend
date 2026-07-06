export function Logo({ size = 36, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <img
        src="/logo.jpeg"
        alt="Tradeify"
        width={size}
        height={size}
        style={{ borderRadius: 8, objectFit: "cover" }}
      />
      {showText && (
        <span style={{ fontWeight: 800, fontSize: size * 0.5, letterSpacing: "-0.02em" }}>
          <span className="gradient-text">Trade</span>
          <span style={{ color: "var(--text)" }}>ify</span>
        </span>
      )}
    </div>
  );
}
