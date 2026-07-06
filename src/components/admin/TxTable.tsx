import { Check, X } from "lucide-react";
import type { Transaction } from "../../types";

const money = (n: number) =>
  `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  rows: Transaction[];
  loading?: boolean;
  emptyText?: string;
  onResolve?: (id: number, status: "approved" | "rejected") => void;
  showScreenshotView?: boolean;
}

export function TxTable({
  rows,
  loading,
  emptyText = "Nothing here yet.",
  onResolve,
  showScreenshotView,
}: Props) {
  if (loading) return <p className="muted">Loading...</p>;
  if (rows.length === 0) return <p className="muted">{emptyText}</p>;

  function viewScreenshot(data: string) {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(
      `<html><head><title>Deposit Screenshot</title></head><body style="margin:0;background:#0a1628;display:grid;place-items:center;min-height:100vh;"><img src="${data}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`,
    );
    win.document.close();
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Details</th>
            <th>Created</th>
            {showScreenshotView && <th>Screenshot</th>}
            {onResolve && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="muted">#{t.id}</td>
              <td>user #{t.user_id}</td>
              <td style={{ fontWeight: 600 }}>{money(t.amount)}</td>
              <td><span className={`badge ${t.status}`}>{t.status}</span></td>
              <td className="muted">
                {[t.account_name, t.network, t.wallet_address, t.note].filter(Boolean).join(" | ") || "—"}
              </td>
              <td className="muted">{new Date(t.created_at).toLocaleString()}</td>
              {showScreenshotView && (
                <td>
                  {t.screenshot_data ? (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "0.35rem 0.7rem" }}
                      onClick={() => viewScreenshot(t.screenshot_data!)}
                    >
                      View
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              )}
              {onResolve && (
                <td>
                  {t.status === "pending" ? (
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        className="btn"
                        style={{ padding: "0.35rem 0.7rem", display: "flex", gap: "0.3rem" }}
                        onClick={() => onResolve(t.id, "approved")}
                      >
                        <Check size={15} /> Approve
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "0.35rem 0.7rem", display: "flex", gap: "0.3rem" }}
                        onClick={() => onResolve(t.id, "rejected")}
                      >
                        <X size={15} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
