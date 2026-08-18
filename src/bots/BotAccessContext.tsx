import { createContext, ReactNode, useContext } from "react";
import { useAuth } from "../auth/AuthContext";

interface BotAccessState {
  purchasedBots: Set<string>;
}

const BotAccessContext = createContext<BotAccessState | undefined>(undefined);

export function BotAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const purchasedBots = new Set(user?.purchased_bot_ids ?? []);

  return (
    <BotAccessContext.Provider value={{ purchasedBots }}>
      {children}
    </BotAccessContext.Provider>
  );
}

export function useBotAccess(): BotAccessState {
  const context = useContext(BotAccessContext);
  if (!context) throw new Error("useBotAccess must be used within BotAccessProvider");
  return context;
}
