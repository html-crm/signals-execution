export type ExchangeId = 'binance' | 'bybit' | 'okx' | 'mexc' | 'bitget' | 'bingx';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_limit' | 'stop_market';
export type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'pending';

export type PositionSide = 'long' | 'short';
export type PositionStatus = 'open' | 'closing' | 'closed';

export type TradeMode = 'paper' | 'live';

export type SignalDirection = 'buy' | 'sell' | 'long' | 'short';
export type SignalStrength = 'weak' | 'neutral' | 'strong' | 'very_strong';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  timestamp: number;
}

export interface OrderBook {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface Order {
  id: string;
  clientOrderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price?: number;
  stopPrice?: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  timestamp: number;
  fee?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  leverage: number;
  margin: number;
  liquidationPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: PositionStatus;
  timestamp: number;
}

export interface Signal {
  id: string;
  symbol: string;
  exchange: string;
  timeframe: string;
  direction: SignalDirection;
  strength: SignalStrength;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2?: number;
  riskReward: number;
  invalidationLevel?: number;
  indicators: Record<string, number | string>;
  reasoning: string[];
  timestamp: number;
}

export interface MarketData {
  symbol: string;
  ticker: Ticker;
  candles: Candle[];
  orderBook?: OrderBook;
  fundingRate?: number;
  openInterest?: number;
}

export interface Portfolio {
  totalBalance: number;
  availableBalance: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  positions: Position[];
  openOrders: Order[];
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  testnet?: boolean;
}

export interface ExchangeConfig {
  id: string;
  name: string;
  credentials: ExchangeCredentials;
  testnet: boolean;
  enabled: boolean;
}

export interface BotConfig {
  id: string;
  name: string;
  exchangeId: string;
  symbol: string;
  timeframe: string;
  strategy: string;
  riskPerTrade: number;
  maxPositionSize: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  stopLossATR: number;
  takeProfitATR: number;
  enabled: boolean;
  mode: TradeMode;
}

export interface Trade {
  id: string;
  botId?: string;
  symbol: string;
  exchange: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
  fee: number;
  pnl?: number;
  timestamp: number;
}

export interface BacktestResult {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  roi: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
}

export interface MarketScannerResult {
  symbol: string;
  price: number;
  change24h: number;
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  volume: number;
  volumeChange: number;
  risk: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}