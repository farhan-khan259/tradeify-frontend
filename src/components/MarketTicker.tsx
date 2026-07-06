import { useEffect, useState } from "react";
import { Bitcoin, Coins, Droplets } from "lucide-react";

interface Coin {
  symbol: string;
  price: number;
  change: number;
}

const SEED: Coin[] = [
  { symbol: "BTC", price: 60123.96, change: -0.46 },
  { symbol: "ETH", price: 1576.67, change: -0.46 },
  { symbol: "BNB", price: 555.18, change: -1.54 },
  { symbol: "SOL", price: 71.54, change: -0.5 },
  { symbol: "XRP", price: 1.05, change: -1.05 },
  { symbol: "ADA", price: 0.1448, change: -1.7 },
];

const iconFor = (symbol: string) => {
  if (symbol === "BTC") return <Bitcoin size={12} />;
  if (symbol === "ETH") return <Droplets size={12} />;
  return <Coins size={12} />;
};

export function MarketTicker() {
  const [coins, setCoins] = useState(SEED);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCoins((prev) =>
        prev.map((coin) => {
          const delta = (Math.random() - 0.58) * 0.22;
          return {
            ...coin,
            price: coin.price * (1 + delta / 100),
            change: coin.change + delta,
          };
        }),
      );
    }, 2200);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCoins((prev) => [...prev.slice(1), prev[0]]);
    }, 5200);

    return () => window.clearInterval(id);
  }, []);

  const items = [...coins, ...coins, ...coins];

  return (
    <section className="dashboard-ticker card">
      <div className="dashboard-ticker__marquee">
        <div className="dashboard-ticker__track">
          {items.map((coin, index) => (
            <div key={`${coin.symbol}-${index}`} className="dashboard-ticker__coin">
              <div className={`dashboard-ticker__coin-icon dashboard-ticker__coin-icon--${coin.symbol.toLowerCase()}`}>
                {iconFor(coin.symbol)}
              </div>
              <span className="dashboard-ticker__coin-symbol">{coin.symbol}</span>
              <strong>
                ${coin.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
              <span className="dashboard-ticker__coin-change">
                {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        <div className="dashboard-ticker__signal" />
      </div>
    </section>
  );
}
