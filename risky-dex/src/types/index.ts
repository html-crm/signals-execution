export type BotStatus = 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'STOPPED' 
  | 'WAITING' 
  | 'BUYING' 
  | 'SELLING' 
  | 'ERROR' 
  | 'RISK_LOCKED' 
  | 'MANUAL_CONTROL';

export type BotStrategy = 
  | 'MOMENTUM' 
  | 'MEAN_REVERSION' 
  | 'GRID' 
  | 'DCA' 
  | 'BREAKOUT' 
  | 'CUSTOM';

export type Blockchain = 'SOLANA' | 'BSC' | 'ETHEREUM' | 'ARBITRUM' | 'POLYGON' | 'BASE';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LIMIT' | 'STOP_MARKET';
export type OrderStatus = 'OPEN' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'FAILED' | 'PENDING';

export type TradeEventType = 
  | 'BUY' 
  | 'SELL' 
  | 'PRICE_UPDATE' 
  | 'SIGNAL' 
  | 'RISK_CHECK' 
  | 'ERROR' 
  | 'BOT_STARTED' 
  | 'BOT_PAUSED' 
  | 'BOT_STOPPED' 
  | 'POSITION_OPENED' 
  | 'POSITION_CLOSED' 
  | 'STOP_LOSS_HIT' 
  | 'TAKE_PROFIT_HIT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export type Timeframe = '1H' | '6H' | '24H' | '7D' | '30D';

export interface Bot {
  id: string;
  name: string;
  status: BotStatus;
  strategy: BotStrategy;
  blockchain: Blockchain;
  pair: TradingPair;
  config: BotConfig;
  performance: BotPerformance;
  riskSettings: RiskSettings;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  stoppedAt?: string;
}

export interface TradingPair {
  base: string;
  quote: string;
  symbol: string;
  blockchain: Blockchain;
  decimals: number;
  minOrderSize: number;
  tickSize: number;
}

export interface BotConfig {
  // Buy conditions
  buyConditions: BuyConditions;
  // Sell conditions
  sellConditions: SellConditions;
  // Capital management
  capital: CapitalConfig;
  // Risk limits
  riskLimits: RiskLimits;
}

export interface BuyConditions {
  priceChangePercent: number;
  volumeThreshold: number;
  momentumThreshold: 'BEARISH' | 'NEUTRAL' | 'BULLISH';
  allowSlippage: number;
  minimumLiquidity: number;
  customIndicators?: Record<string, unknown>;
}

export interface SellConditions {
  takeProfitPercent: number;
  stopLossPercent: number;
  trailingStopPercent?: number;
  timeBasedExit?: {
    enabled: boolean;
    maxHoldTimeMinutes: number;
  };
}

export interface CapitalConfig {
  initialCapital: number;
  tradeSize: number;
  tradeSizeType: 'FIXED' | 'PERCENTAGE';
  maxExposure: number;
  maxExposureType: 'FIXED' | 'PERCENTAGE';
  reserveCapital: number;
}

export interface RiskLimits {
  maxDailyLoss: number;
  maxDailyLossType: 'FIXED' | 'PERCENTAGE';
  maxOpenPositions: number;
  maxPositionSize: number;
  maxSlippage: number;
  cooldownAfterLoss: number;
  emergencyStopLoss: number;
}

export interface RiskSettings {
  maxTradeSize: number;
  maxDailyLoss: number;
  maxExposure: number;
  maxOpenPositions: number;
  maxSlippage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  emergencyShutdown: boolean;
}

export interface BotPerformance {
  totalPnl: number;
  totalPnlPercent: number;
  todayPnl: number;
  todayPnlPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentEquity: number;
  startingCapital: number;
  deployedCapital: number;
  unrealizedPnl: number;
  realizedPnl: number;
  fees: number;
  exposure: number;
  exposurePercent: number;
}

export interface Trade {
  id: string;
  botId: string;
  botName: string;
  pair: TradingPair;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  value: number;
  fee: number;
  pnl?: number;
  pnlPercent?: number;
  status: OrderStatus;
  executedAt: string;
  signal?: TradeSignal;
  decisionLog?: DecisionLogEntry[];
}

export interface Order {
  id: string;
  botId?: string;
  botName?: string;
  pair: TradingPair;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  filledAmount: number;
  remainingAmount: number;
  value: number;
  fee: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  filledAt?: string;
  cancelledAt?: string;
  stopPrice?: number;
  limitPrice?: number;
  clientOrderId?: string;
}

export interface Position {
  id: string;
  botId: string;
  botName: string;
  pair: TradingPair;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  size: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
  status: 'OPEN' | 'CLOSING' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface Wallet {
  id: string;
  blockchain: Blockchain;
  address: string;
  balances: TokenBalance[];
  totalValueUsd: number;
  updatedAt: string;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  amount: number;
  valueUsd: number;
  priceUsd: number;
  decimals: number;
  contractAddress?: string;
}

export interface Market {
  pair: TradingPair;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  volumeUsd24h: number;
  liquidity: number;
  spread: number;
  spreadPercent: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  updatedAt: string;
}

export interface TradeSignal {
  id: string;
  botId: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strength: number;
  indicators: SignalIndicators;
  reasoning: string;
  timestamp: string;
  executed: boolean;
  tradeId?: string;
}

export interface SignalIndicators {
  momentum: number;
  volumeChange: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  bollingerBands?: { upper: number; middle: number; lower: number };
  customIndicators?: Record<string, number>;
}

export interface DecisionLogEntry {
  timestamp: string;
  stage: 'SIGNAL_DETECTION' | 'ANALYSIS' | 'RISK_CHECK' | 'EXECUTION' | 'MONITORING' | 'EXIT';
  description: string;
  data?: Record<string, unknown>;
  passed?: boolean;
  details?: string;
}

export interface BotEvent {
  id: string;
  botId: string;
  botName: string;
  type: TradeEventType;
  message: string;
  data?: Record<string, unknown>;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: string;
  pair?: TradingPair;
  price?: number;
  amount?: number;
  pnl?: number;
}

export interface Portfolio {
  totalEquity: number;
  availableBalance: number;
  deployedCapital: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalFees: number;
  totalExposure: number;
  exposurePercent: number;
  byBlockchain: Record<Blockchain, BlockchainPortfolio>;
  byBot: Record<string, BotPortfolio>;
  updatedAt: string;
  [key: string]: unknown;
}

export interface BlockchainPortfolio {
  blockchain: Blockchain;
  totalValue: number;
  deployedCapital: number;
  unrealizedPnl: number;
  realizedPnl: number;
  exposure: number;
  tokens: TokenBalance[];
}

export interface BotPortfolio {
  botId: string;
  botName: string;
  capital: number;
  equity: number;
  pnl: number;
  pnlPercent: number;
  trades: number;
  winRate: number;
  exposure: number;
  drawdown: number;
}

export interface SystemStatus {
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'OFFLINE';
  connection: 'LIVE' | 'CONNECTING' | 'DISCONNECTED' | 'RECONNECTING';
  latency: number;
  rpcStatus: Record<Blockchain, 'HEALTHY' | 'DEGRADED' | 'DOWN'>;
  apiStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  lastUpdate: string;
  mode: 'SIMULATION' | 'LIVE';
}

export interface BotTemplate {
  id: string;
  name: string;
  description: string;
  strategy: BotStrategy;
  riskLevel: RiskLevel;
  recommendedCapital: number;
  typicalTradeFrequency: string;
  config: Partial<BotConfig>;
  tags: string[];
}

export interface Alert {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  botId?: string;
  botName?: string;
  timestamp: string;
  acknowledged: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface BotHealth {
  botId: string;
  botName: string;
  connection: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  executionLatency: number;
  rpcStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  apiStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  strategyStatus: 'ACTIVE' | 'WAITING' | 'ERROR';
  riskEngine: 'ACTIVE' | 'TRIGGERED' | 'ERROR';
  lastHeartbeat: string;
  uptime: number;
}

export interface LiveTradeMapData {
  blockchain: Blockchain;
  activeBots: number;
  openPositions: number;
  volume24h: number;
  pnl24h: number;
  topPairs: { pair: TradingPair; volume: number; pnl: number }[];
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export type WebSocketEventType = 
  | 'trade.executed'
  | 'order.created'
  | 'order.filled'
  | 'order.cancelled'
  | 'bot.started'
  | 'bot.paused'
  | 'bot.stopped'
  | 'bot.signal'
  | 'bot.error'
  | 'price.updated'
  | 'balance.updated'
  | 'position.updated'
  | 'bot.status.changed'
  | 'alert.created'
  | 'system.status';