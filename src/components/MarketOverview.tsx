import { useEffect, useState } from "react";
import { Bitcoin, Coins, Droplets } from "lucide-react";

interface Coin {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const SEED: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", price: 60123.96, change: -0.46 },
  { symbol: "ETH", name: "Ethereum", price: 1576.67, change: -0.46 },
  { symbol: "BNB", name: "BNB", price: 555.18, change: -1.54 },
  { symbol: "SOL", name: "Solana", price: 71.54, change: -0.5 },
  { symbol: "XRP", name: "XRP", price: 1.05, change: -1.05 },
  { symbol: "ADA", name: "Cardano", price: 0.1448, change: -1.7 },
];

const fmt = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: n < 1 ? 4 : 2,
    maximumFractionDigits: n < 1 ? 4 : 2,
  })}`;

const iconFor = (symbol: string) => {
  if (symbol === "BTC") return <Bitcoin size={18} />;
  if (symbol === "ETH") return <Droplets size={18} />;
  if (symbol === "BNB") return <Coins size={18} />;
  if (symbol === "SOL") return <span className="dashboard-coin-mark">S</span>;
  if (symbol === "XRP") return <span className="dashboard-coin-mark">X</span>;
  return <span className="dashboard-coin-mark">A</span>;
};

export function MarketOverview() {
  const [coins, setCoins] = useState(SEED);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCoins((prev) =>
        prev.map((coin) => {
          const delta = (Math.random() - 0.58) * 0.18;
          return {
            ...coin,
            price: coin.price * (1 + delta / 100),
            change: coin.change + delta,
          };
        }),
      );
    }, 2600);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="dashboard-market-list">
      {coins.map((coin, index) => (
        <div key={coin.symbol} className={`dashboard-market-row ${index < coins.length - 1 ? "has-border" : ""}`}>
          <div className={`dashboard-market-row__icon dashboard-market-row__icon--${coin.symbol.toLowerCase()}`}>
            {iconFor(coin.symbol)}
          </div>

          <div className="dashboard-market-row__identity">
            <strong>{coin.name}</strong>
            <span>{coin.symbol}</span>
          </div>

          <div className="dashboard-market-row__value">
            <strong>{fmt(coin.price)}</strong>
            <span className="dashboard-market-row__change">
              {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}% ~ {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
