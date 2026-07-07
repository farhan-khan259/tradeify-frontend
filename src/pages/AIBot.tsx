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
    }
  | {
      type: "analysis";
      time: string;
      text: string;
    };

interface BotTradeResponse {
  pair: string;
  side: "BUY" | "SELL";
  amount: number;
  win: boolean;
  delta: number;
  balance: number;
  message?: string;
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
  const [tradeStarted, setTradeStarted] = useState(false);
  const [pendingStake, setPendingStake] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [startingBalance, setStartingBalance] = useState(Number(user?.balance ?? 0));
  const [lastTradeResult, setLastTradeResult] = useState<string | null>(null);

  const termRef = useRef<HTMLDivElement>(null);
  const tradeBusyRef = useRef(false);
  const mockFeedTimerRef = useRef<number | null>(null);
  const cfgRef = useRef({ pair, amount });
  cfgRef.current = { pair, amount };

  useEffect(() => {
    const balance = Number(user?.balance ?? 0);
    setCurrentBalance(balance);
    if (!tradeStarted) {
      setStartingBalance(balance);
    }
  }, [user?.balance, tradeStarted]);

  useEffect(() => {
    if (status !== "running") return;

    const countdownTimer = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(countdownTimer);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "running" || !tradeStarted) return;

    const balanceRefreshInterval = window.setInterval(() => {
      const balance = Number(user?.balance ?? 0);
      setCurrentBalance(balance);
    }, 2000);

    return () => {
      window.clearInterval(balanceRefreshInterval);
    };
  }, [status, tradeStarted, user?.balance]);

  useEffect(() => {
    if (status !== "running" || !tradeStarted) return;

    const pollLogs = async () => {
      try {
        const { data } = await api.get("/bot/trade/status");
        if (data.recent_logs && Array.isArray(data.recent_logs)) {
          const newLogs: LogLine[] = data.recent_logs.map((log: string) => {
            // Parse log format: "[HH:MM:SS] • message"
            const timeMatch = log.match(/\[(\d{2}:\d{2}:\d{2})\]/);
            const time = timeMatch ? timeMatch[1] : new Date().toTimeString().substring(0, 8);
            const text = log.replace(/\[\d{2}:\d{2}:\d{2}\]\s*•\s*/, "").trim();
            
            // Detect trade execution lines (BUY/SELL)
            if (text.includes("Entering BUY") || text.includes("Entering SELL")) {
              const side = text.includes("BUY") ? "BUY" : "SELL";
              return {
                type: "trade" as const,
                time,
                side,
                pair: cfgRef.current.pair,
              };
            }
            
            // Detect wins/losses
            if (text.includes("Trade WON") || text.includes("Trade LOST")) {
              return {
                type: "system" as const,
                time,
                text,
              };
            }
            
            // All other logs are analysis logs
            return {
              type: "analysis" as const,
              time,
              text,
            };
          });
          
          setLogs((prev) => {
            const combined = [...prev, ...newLogs];
            // Deduplicate and keep last 50 lines
            const seen = new Set<string>();
            const deduped = combined.filter((log) => {
              const key = `${log.type}-${log.time}-${(log as any).text || (log as any).pair}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return deduped.slice(-50);
          });
        }
      } catch (err) {
        // Silent error - just continue polling
      }
    };

    const pollInterval = window.setInterval(pollLogs, 1000);
    return () => window.clearInterval(pollInterval);
  }, [status, tradeStarted]);

  useEffect(() => {
    if (status !== "running" || remaining > 0 || !tradeStarted) return;

    const settleTrade = async () => {
      tradeBusyRef.current = true;
      try {
        const { data } = await api.post<BotTradeResponse>("/bot/trade", {
          pair: pair,
          amount: pendingStake,
          phase: "settle",
        });

        const now = new Date();
        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const tradeLine: LogLine = {
          type: "trade",
          time,
          side: data.side,
          pair: data.pair,
        };

        const resultText = data.win
          ? `WIN +$${data.delta.toFixed(2)}`
          : `LOSS -$${Math.abs(data.delta).toFixed(2)}`;

        setLogs((prev) => [
          ...prev.slice(-39),
          tradeLine,
          {
            type: "system",
            time,
            text: resultText,
          },
        ]);
        setLastTradeResult(resultText);
        // Use data.delta directly for accurate profit/loss calculation
        setRunPL(data.delta);
        setCurrentBalance(data.balance);
        updateBalance(data.balance);
        if (data.win) setWins((prev) => prev + 1);
        else setLosses((prev) => prev + 1);
        setTradeStarted(false);
        setPendingStake(0);
        setStakeAmount(0);
        setStatus("standby");
        pushSystem(data.message || "Trade settled");
      } catch (err) {
        setError(apiError(err, "Could not execute bot trade"));
        setStatus("standby");
        setTradeStarted(false);
        setPendingStake(0);
        setStakeAmount(0);
      } finally {
        tradeBusyRef.current = false;
      }
    };

    settleTrade();
  }, [remaining, status, tradeStarted, pair, pendingStake, updateBalance]);

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

  async function start() {
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
    if (tradeStarted) {
      setError("Trade is already in progress.");
      return;
    }

    setWins(0);
    setLosses(0);
    setRunPL(0);
    setLastTradeResult(null);
    setLogs([]);
    setRemaining(duration);
    setSessions((prev) => prev + 1);
    setStatus("running");
    setTradeStarted(true);
    setPendingStake(amt);
    setStakeAmount(amt);
    
    // Immediately deduct the amount from balance (optimistic update)
    const newBalance = currentBalance - amt;
    setCurrentBalance(newBalance);
    setStartingBalance(newBalance);
    
    pushSystem("AI engine initialized.");

    tradeBusyRef.current = true;
    try {
      const { data } = await api.post<BotTradeResponse>("/bot/trade", {
        pair,
        amount: amt,
        phase: "start",
      });

      setCurrentBalance(data.balance);
      updateBalance(data.balance);
      setLogs((prev) => [
        ...prev.slice(-39),
        {
          type: "system",
          time: `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}`,
          text: data.message || "Trade started and stake reserved",
        },
      ]);
    } catch (err) {
      setError(apiError(err, "Could not start bot trade"));
      // Restore balance on error
      setCurrentBalance(currentBalance + amt);
      setStatus("standby");
      setTradeStarted(false);
      setPendingStake(0);
      setStakeAmount(0);
    } finally {
      tradeBusyRef.current = false;
    }
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

          <div className="bot-engine-card__body bot-engine-card__body--flex">
            <div className="bot-engine-card__left">
              <div className="bot-label">Run P/L</div>
              <div className={`bot-pl ${runPL > 0 ? "is-positive" : runPL < 0 ? "is-negative" : ""}`}>
                {runPL >= 0 ? "+" : "-"}{money(Math.abs(runPL))}
              </div>
              <div className="bot-meta">
                across {sessions} sessions · {wins}W / {losses}L
              </div>
              {lastTradeResult && (
                <div className="bot-meta bot-meta--small">Last result: {lastTradeResult}</div>
              )}
            </div>

            {running && remaining > 0 && (
              <div className="bot-engine-card__right">
                <div className="bot-countdown-timer">
                  <svg className="bot-countdown-timer__svg" viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#20b6ff" />
                        <stop offset="100%" stopColor="#18bbff" />
                      </linearGradient>
                    </defs>
                    <circle
                      className="bot-countdown-timer__bg"
                      cx="60"
                      cy="60"
                      r="54"
                    />
                    <circle
                      className="bot-countdown-timer__progress"
                      cx="60"
                      cy="60"
                      r="54"
                      style={{
                        strokeDasharray: `${(remaining / duration) * 339.29} 339.29`,
                      }}
                    />
                  </svg>
                  <div className="bot-countdown-timer__content">
                    <div className="bot-countdown-timer__time">
                      {pad(Math.floor(remaining / 60))}:{pad(remaining % 60)}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
              logs.map((line, index) => {
                if (line.type === "system") {
                  return (
                    <div key={`${line.time}-${index}`} className="bot-log bot-log--system">
                      <span>[{line.time}]</span> • {line.text}
                    </div>
                  );
                } else if (line.type === "analysis") {
                  return (
                    <div key={`${line.time}-${index}`} className="bot-log bot-log--analysis">
                      <span>[{line.time}]</span> • {line.text}
                    </div>
                  );
                } else {
                  return (
                    <div key={`${line.time}-${index}`} className="bot-log bot-log--trade">
                      <span className="bot-log__time">[{line.time}]</span> • 
                      <span className="bot-log__side">{line.side}</span> {line.pair}
                    </div>
                  );
                }
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
