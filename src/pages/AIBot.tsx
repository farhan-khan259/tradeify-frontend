import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Brain,
  CheckCircle2,
  ChevronDown,
  Circle,
  Pause,
  Play,
  Sparkles,
  Square,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { api, apiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Status = "standby" | "running" | "paused";

type LogLine =
  | {
      type: "system";
      time: string;
      text: string;
    }
  | {
      type: "trade";
      time: string;
      side: "BUY" | "SELL";
      pair: string;
    };

interface BotTradeResponse {
  pair: string;
  side: "BUY" | "SELL";
  amount: number;
  win: boolean;
  delta: number;
  balance: number;
}

const PAIRS = ["XAU/USD (Gold)", "BTC/USD", "ETH/USD", "EUR/USD", "GBP/USD", "SOL/USD"];
const DURATIONS = [
  { label: "1 Minute", seconds: 60 },
  { label: "5 Minutes", seconds: 300 },
  { label: "15 Minutes", seconds: 900 },
  { label: "1 Hour", seconds: 3600 },
];

const money = (n: number) =>
  `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function AIBot() {
  const { user, updateBalance } = useAuth();
  const [currentBalance, setCurrentBalance] = useState(Number(user?.balance ?? 0));

  const [status, setStatus] = useState<Status>("standby");
  const [pair, setPair] = useState(PAIRS[0]);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(DURATIONS[0].seconds);
  const [error, setError] = useState("");

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [runPL, setRunPL] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);

  const termRef = useRef<HTMLDivElement>(null);
  const tradeBusyRef = useRef(false);
  const cfgRef = useRef({ pair, amount });
  cfgRef.current = { pair, amount };

  useEffect(() => {
    setCurrentBalance(Number(user?.balance ?? 0));
  }, [user?.balance]);

  useEffect(() => {
    if (status !== "running") return;

    const tradeTimer = window.setInterval(async () => {
      if (tradeBusyRef.current) return;

      const amt = Number(cfgRef.current.amount) || 0;
      if (amt <= 0) return;
      if (currentBalance <= 0 || amt > currentBalance) {
        setStatus("standby");
        pushSystem("Insufficient balance for the next trade.");
        return;
      }

      tradeBusyRef.current = true;
      try {
        const { data } = await api.post<BotTradeResponse>("/bot/trade", {
          pair: cfgRef.current.pair,
          amount: amt,
        });

        const now = new Date();
        const line: LogLine = {
          type: "trade",
          time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
          side: data.side,
          pair: data.pair,
        };

        setLogs((prev) => [...prev.slice(-39), line]);
        setRunPL((prev) => prev + data.delta);
        setCurrentBalance(data.balance);
        updateBalance(data.balance);
        if (data.win) setWins((prev) => prev + 1);
        else setLosses((prev) => prev + 1);

        if (data.balance <= 0 || amt > data.balance) {
          setStatus("standby");
          pushSystem("Session ended after the last trade closed.");
        }
      } catch (err) {
        setError(apiError(err, "Could not execute bot trade"));
        setStatus("standby");
      } finally {
        tradeBusyRef.current = false;
      }
    }, 2000);

    const countdownTimer = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(tradeTimer);
      window.clearInterval(countdownTimer);
    };
  }, [status, currentBalance, updateBalance]);

  useEffect(() => {
    if (status === "running" && remaining === 0) {
      setStatus("standby");
      pushSystem("Session complete.");
    }
  }, [remaining, status]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs]);

  function pushSystem(text: string) {
    const now = new Date();
    setLogs((prev) => [
      ...prev.slice(-39),
      {
        type: "system",
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
        text,
      },
    ]);
  }

  function start() {
    const amt = Number(amount) || 0;
    setError("");

    if (currentBalance <= 0) {
      setError("Account balance must be greater than $0 to trade.");
      return;
    }
    if (amt <= 0) {
      setError("Please enter a valid trade amount.");
      return;
    }
    if (amt > currentBalance) {
      setError("Trade amount cannot exceed account balance.");
      return;
    }

    if (status === "paused") {
      setStatus("running");
      pushSystem("Session resumed.");
      return;
    }

    setWins(0);
    setLosses(0);
    setRunPL(0);
    setLogs([]);
    setRemaining(duration);
    setSessions((prev) => prev + 1);
    setStatus("running");
    pushSystem("AI engine initialized.");
  }

  function pause() {
    if (status !== "running") return;
    setStatus("paused");
    pushSystem("Session paused.");
  }

  function stop() {
    if (status === "standby") return;
    setStatus("standby");
    setRemaining(0);
    pushSystem("Session stopped.");
  }

  const total = wins + losses;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const running = status === "running";
  const amountValue = Number(amount) || 0;

  const statusMeta = {
    standby: { text: "STANDBY", color: "var(--muted)" },
    running: { text: "RUNNING", color: "var(--success)" },
    paused: { text: "PAUSED", color: "var(--warning)" },
  }[status];

  return (
    <div className="bot-page bot-page--sim">
      <div className="bot-shell">
        <h1 className="bot-shell__title">AI Trading Bot</h1>

        <section className="card bot-engine-card">
          <div className="bot-engine-card__top">
            <div className="bot-engine-card__identity">
              <div className="bot-engine-card__icon">
                <Brain size={20} />
              </div>
              <div>
                <div className="bot-engine-card__name">
                  Crown AI Engine <Sparkles size={14} />
                </div>
                <div className="bot-engine-card__subtext">
                  {running ? "Running - executing session" : status === "paused" ? "Paused" : "Standby - configure to start"}
                </div>
              </div>
            </div>

            <div className="bot-engine-pill" style={{ color: statusMeta.color }}>
              <Circle size={7} fill={statusMeta.color} strokeWidth={0} />
              <span>{statusMeta.text}</span>
            </div>
          </div>

          <div className="bot-engine-card__body">
            <div>
              <div className="bot-label">Run P/L</div>
              <div className={`bot-pl ${runPL > 0 ? "is-positive" : runPL < 0 ? "is-negative" : ""}`}>
                {runPL >= 0 ? "+" : "-"}{money(Math.abs(runPL))}
              </div>
              <div className="bot-meta">
                across {sessions} sessions · {wins}W / {losses}L
                {running && ` · ${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)} left`}
              </div>
            </div>

            <div className="bot-winring">
              <div className="bot-winring__inner">
                <strong>{total ? `${winRate}%` : "—"}</strong>
                <span>WIN</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bot-ready-banner">
          <div className="bot-ready-banner__dot" />
          <div>
            <div className="bot-ready-banner__title">Ready to Trade</div>
            <div className="bot-ready-banner__text">Pick a pair, set your stake, and tap Start.</div>
          </div>
          <Sparkles size={15} />
        </section>

        <section className="card bot-config-card">
          <div className="bot-config-card__header">
            <div className="bot-config-card__title">
              <Activity size={16} />
              <span>Session Config</span>
            </div>
            <span className="bot-config-card__status">Ready</span>
          </div>

          <label className="bot-field">
            <span>Trading Pair</span>
            <div className="bot-select-wrap">
              <select className="input bot-control" value={pair} disabled={running} onChange={(e) => setPair(e.target.value)}>
                {PAIRS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={16} className="bot-select-wrap__icon" />
            </div>
          </label>

          <label className="bot-field">
            <span className="bot-field__row">
              <span>Trade Amount (USD)</span>
              <span>Bal: {money(currentBalance)}</span>
            </span>
            <input
              className="input bot-control"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              disabled={running}
              placeholder="Enter amount"
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="bot-field">
            <span>Session Duration</span>
            <div className="bot-select-wrap">
              <select
                className="input bot-control"
                value={duration}
                disabled={running}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {DURATIONS.map((item) => (
                  <option key={item.seconds} value={item.seconds}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="bot-select-wrap__icon" />
            </div>
          </label>

          {error && <p className="error">{error}</p>}

          <div className="bot-actions">
            <button
              className="bot-action bot-action--start"
              disabled={running || amountValue <= 0 || currentBalance <= 0 || amountValue > currentBalance}
              onClick={start}
            >
              <Play size={16} fill="currentColor" />
              <span>{status === "paused" ? "Resume" : "Start"}</span>
            </button>
            <button className="bot-action bot-action--pause" disabled={!running} onClick={pause}>
              <Pause size={16} />
              <span>Pause</span>
            </button>
            <button className="bot-action bot-action--stop" disabled={status === "standby"} onClick={stop}>
              <Square size={14} fill="currentColor" />
              <span>Stop</span>
            </button>
          </div>
        </section>

        <section className="bot-stats-grid">
          <article className="card bot-stat-card">
            <div className="bot-stat-card__icon bot-stat-card__icon--balance">
              <Wallet size={15} />
            </div>
            <div className="bot-label">Balance</div>
            <strong>{money(currentBalance).replace(".00", "")}</strong>
          </article>

          <article className="card bot-stat-card">
            <div className="bot-stat-card__icon bot-stat-card__icon--wins">
              <CheckCircle2 size={15} />
            </div>
            <div className="bot-label">Wins</div>
            <strong>{wins}</strong>
          </article>

          <article className="card bot-stat-card">
            <div className="bot-stat-card__icon bot-stat-card__icon--losses">
              <TriangleAlert size={15} />
            </div>
            <div className="bot-label">Losses</div>
            <strong>{losses}</strong>
          </article>
        </section>

        <section className="card bot-progress-card">
          <div className="bot-progress-card__meta">
            <span className="is-green">• wins</span>
            <span>{sessions} sessions</span>
            <span className="is-red">losses •</span>
          </div>
          <div className="bot-progress-card__track">
            <div className="bot-progress-card__fill" style={{ width: `${total ? (wins / total) * 100 : 0}%` }} />
          </div>
        </section>

        <section className="card bot-terminal-card">
          <div className="bot-terminal-card__header">
            <div className="bot-terminal-card__lights">
              <span className="red" />
              <span className="amber" />
              <span className="green" />
            </div>
            <span className="bot-terminal-card__prompt">crown@ai-engine:~$</span>
            <span className="bot-terminal-card__lines">{logs.length} lines</span>
          </div>

          <div ref={termRef} className="bot-terminal-card__body">
            {logs.length === 0 ? (
              <div className="bot-terminal-card__empty">
                <div className="bot-terminal-card__empty-icon">
                  <Activity size={16} />
                </div>
                <div>Awaiting session start...</div>
                <span>Live trade execution will stream here</span>
              </div>
            ) : (
              logs.map((line, index) =>
                line.type === "system" ? (
                  <div key={`${line.time}-${index}`} className="bot-log bot-log--system">
                    <span>[{line.time}]</span> {line.text}
                  </div>
                ) : (
                  <div key={`${line.time}-${index}`} className="bot-log">
                    <span className="bot-log__time">[{line.time}]</span>{" "}
                    <span className="bot-log__side">{line.side}</span>{" "}
                    {line.pair}
                  </div>
                ),
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
