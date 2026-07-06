import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "../api/client";
import { Logo } from "../components/Logo";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      setOtp(data.otp ?? null);
    } catch (err) {
      setError(apiError(err, "Could not process request"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Logo size={44} />
        </div>
        <h2>Forgot password</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Enter your email and we&apos;ll send a one-time password to reset your account.
        </p>

        {sent ? (
          <div style={{ marginTop: "1.2rem" }}>
            <p>If an account exists for <strong>{email}</strong>, a password reset OTP has been sent.</p>
            {otp && (
              <div className="card" style={{ background: "#0b1d35", marginTop: "1rem" }}>
                <p className="muted" style={{ marginTop: 0, fontSize: "0.8rem" }}>
                  Demo mode (no email provider configured) - use this OTP:
                </p>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "0.18em", textAlign: "center" }}>
                  {otp}
                </div>
              </div>
            )}
            <Link
              to={`/reset-password?email=${encodeURIComponent(email)}`}
              className="btn"
              style={{ width: "100%", marginTop: "1rem" }}
            >
              Continue with OTP
            </Link>
            <p className="muted" style={{ marginTop: "1.2rem", textAlign: "center" }}>
              <Link to="/login">Back to sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ marginTop: "1.2rem" }}>
            <label>
              Email
              <input
                className="input"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn" style={{ width: "100%", marginTop: "0.5rem" }} disabled={busy}>
              {busy ? "Sending..." : "Send OTP"}
            </button>
            <p className="muted" style={{ marginTop: "1.2rem", textAlign: "center" }}>
              Remembered it? <Link to="/login">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
