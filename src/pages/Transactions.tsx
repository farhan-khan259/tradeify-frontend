import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Transaction } from "../types";

const money = (n: number) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Transactions() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Transaction[]>("/transactions")
      .then(({ data }) => setTxns(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Transaction history</h1>
      <p className="muted">All your deposits, withdrawals, and referral bonuses.</p>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : txns.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Note</th><th>Date</th></tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id}>
                  <td className="muted">#{t.id}</td>
                  <td style={{ textTransform: "capitalize" }}>{t.type.replace("_", " ")}</td>
                  <td>{money(t.amount)}</td>
                  <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                  <td className="muted">{t.note ?? "—"}</td>
                  <td className="muted">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
