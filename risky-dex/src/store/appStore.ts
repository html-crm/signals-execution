import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bot, BotStatus, SystemStatus, Alert, Portfolio, Market, Trade, Order, Position, Wallet, BotEvent } from '../types';

interface AppState {
  // System
  systemStatus: SystemStatus;
  setSystemStatus: (status: Partial<SystemStatus>) => void;
  toggleMode: () => void;

  // Bots
  bots: Bot[];
  setBots: (bots: Bot[]) => void;
  addBot: (bot: Bot) => void;
  updateBot: (id: string, updates: Partial<Bot>) => void;
  removeBot: (id: string) => void;
  getBot: (id: string) => Bot | undefined;

  // Selected bot
  selectedBotId: string | null;
  setSelectedBotId: (id: string | null) => void;

  // Portfolio
  portfolio: Portfolio | null;
  setPortfolio: (portfolio: Portfolio) => void;

  // Markets
  markets: Map<string, Market>;
  setMarket: (market: Market) => void;
  getMarket: (pair: string) => Market | undefined;

  // Trades
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  setTrades: (trades: Trade[]) => void;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  setOrders: (orders: Order[]) => void;

  // Positions
  positions: Position[];
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string) => void;
  setPositions: (positions: Position[]) => void;

  // Wallets
  wallets: Wallet[];
  setWallets: (wallets: Wallet[]) => void;

  // Events/Activity feed
  events: BotEvent[];
  addEvent: (event: BotEvent) => void;
  setEvents: (events: BotEvent[]) => void;
  clearEvents: () => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;

  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Live feed filter
  feedFilter: 'ALL' | 'BUYS' | 'SELLS' | 'SYSTEM' | 'ERRORS';
  setFeedFilter: (filter: 'ALL' | 'BUYS' | 'SELLS' | 'SYSTEM' | 'ERRORS') => void;

  // Chart timeframe
  chartTimeframe: '1H' | '6H' | '24H' | '7D' | '30D';
  setChartTimeframe: (timeframe: '1H' | '6H' | '24H' | '7D' | '30D') => void;
}

const initialSystemStatus: SystemStatus = {
  status: 'OPERATIONAL',
  connection: 'LIVE',
  latency: 12,
  rpcStatus: {
    SOLANA: 'HEALTHY',
    BSC: 'HEALTHY',
    ETHEREUM: 'HEALTHY',
    ARBITRUM: 'HEALTHY',
    POLYGON: 'HEALTHY',
    BASE: 'HEALTHY',
  },
  apiStatus: 'HEALTHY',
  lastUpdate: new Date().toISOString(),
  mode: 'SIMULATION',
};

const initialPortfolio: Portfolio = {
  totalEquity: 12482.34,
  availableBalance: 3482.34,
  deployedCapital: 9000,
  unrealizedPnl: 234.56,
  realizedPnl: 1247.89,
  totalFees: 89.32,
  totalExposure: 9000,
  exposurePercent: 72.1,
  byBlockchain: {
    SOLANA: { blockchain: 'SOLANA', totalValue: 6200, deployedCapital: 5000, unrealizedPnl: 156.78, realizedPnl: 834.12, exposure: 5000, tokens: [] },
    BSC: { blockchain: 'BSC', totalValue: 3800, deployedCapital: 3000, unrealizedPnl: 45.23, realizedPnl: 312.45, exposure: 3000, tokens: [] },
    ETHEREUM: { blockchain: 'ETHEREUM', totalValue: 1500, deployedCapital: 1000, unrealizedPnl: 23.45, realizedPnl: 89.32, exposure: 1000, tokens: [] },
    ARBITRUM: { blockchain: 'ARBITRUM', totalValue: 982.34, deployedCapital: 0, unrealizedPnl: 0, realizedPnl: 12.00, exposure: 0, tokens: [] },
    POLYGON: { blockchain: 'POLYGON', totalValue: 0, deployedCapital: 0, unrealizedPnl: 0, realizedPnl: 0, exposure: 0, tokens: [] },
    BASE: { blockchain: 'BASE', totalValue: 0, deployedCapital: 0, unrealizedPnl: 0, realizedPnl: 0, exposure: 0, tokens: [] },
  },
  byBot: {},
  updatedAt: new Date().toISOString(),
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      systemStatus: initialSystemStatus,
      setSystemStatus: (updates) => set((state) => ({ systemStatus: { ...state.systemStatus, ...updates } })),
      toggleMode: () => set((state) => ({ systemStatus: { ...state.systemStatus, mode: state.systemStatus.mode === 'SIMULATION' ? 'LIVE' : 'SIMULATION' } })),

      bots: [],
      setBots: (bots) => set({ bots }),
      addBot: (bot) => set((state) => ({ bots: [...state.bots, bot] })),
      updateBot: (id, updates) => set((state) => ({ bots: state.bots.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      removeBot: (id) => set((state) => ({ bots: state.bots.filter((b) => b.id !== id) })),
      getBot: (id) => get().bots.find((b) => b.id === id),

      selectedBotId: null,
      setSelectedBotId: (id) => set({ selectedBotId: id }),

      portfolio: initialPortfolio,
      setPortfolio: (portfolio) => set({ portfolio }),

      markets: new Map(),
      setMarket: (market) => set((state) => { const newMap = new Map(state.markets); newMap.set(`${market.pair.base}/${market.pair.quote}`, market); return { markets: newMap }; }),
      getMarket: (pair) => get().markets.get(pair),

      trades: [],
      addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades].slice(0, 1000) })),
      setTrades: (trades) => set({ trades }),

      orders: [],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders].slice(0, 1000) })),
      updateOrder: (id, updates) => set((state) => ({ orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)) })),
      setOrders: (orders) => set({ orders }),

      positions: [],
      addPosition: (position) => set((state) => ({ positions: [...state.positions, position] })),
      updatePosition: (id, updates) => set((state) => ({ positions: state.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      closePosition: (id) => set((state) => ({ positions: state.positions.map((p) => (p.id === id ? { ...p, status: 'CLOSED' as const, closedAt: new Date().toISOString() } : p)) })),
      setPositions: (positions) => set({ positions }),

      wallets: [],
      setWallets: (wallets) => set({ wallets }),

      events: [],
      addEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 500) })),
      setEvents: (events) => set({ events }),
      clearEvents: () => set({ events: [] }),

      alerts: [],
      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
      acknowledgeAlert: (id) => set((state) => ({ alerts: state.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) })),
      clearAlerts: () => set({ alerts: [] }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      feedFilter: 'ALL',
      setFeedFilter: (filter) => set({ feedFilter: filter }),

      chartTimeframe: '24H',
      setChartTimeframe: (timeframe) => set({ chartTimeframe: timeframe }),
    }),
    {
      name: 'risky-dex-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        chartTimeframe: state.chartTimeframe,
        feedFilter: state.feedFilter,
      }),
    }
  )
);