import { AlertCircle } from "lucide-react";

export function Maintenance() {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(10, 22, 40, 1), rgba(15, 30, 50, 1))",
        padding: "2rem",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 500,
          padding: "3rem 2rem",
          borderRadius: "12px",
          background: "rgba(30, 50, 80, 0.6)",
          border: "1px solid rgba(100, 150, 200, 0.2)",
        }}
      >
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            border: "2px solid rgba(239, 68, 68, 0.5)",
            margin: "0 auto 1.5rem",
          }}
        >
          <AlertCircle size={32} color="#ef4444" />
        </div>

        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#fff" }}>
          Under Maintenance
        </h1>
        
        <p
          style={{
            fontSize: "1.1rem",
            color: "rgba(200, 210, 230, 0.8)",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          Tradeify is currently undergoing scheduled maintenance. We're working hard to improve your trading experience and will be back online shortly.
        </p>

        <p
          style={{
            fontSize: "0.95rem",
            color: "rgba(150, 170, 200, 0.7)",
            marginBottom: "2rem",
          }}
        >
          Thank you for your patience.
        </p>

        <div
          style={{
            fontSize: "0.85rem",
            color: "rgba(100, 150, 200, 0.8)",
            padding: "1rem",
            background: "rgba(100, 150, 200, 0.1)",
            borderRadius: "8px",
            borderLeft: "3px solid rgba(100, 150, 200, 0.5)",
          }}
        >
          Expected availability: Coming soon
        </div>
      </div>
    </div>
  );
}
