export type Timeframe = 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';

export type ExchangeName = 'BINANCE' | 'BYBIT' | 'OKX' | 'MEXC' | 'BITGET' | 'BINGX';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LIMIT' | 'STOP_MARKET';
export type OrderStatus = 'OPEN' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'FAILED' | 'PENDING';

export type PositionSide = 'LONG' | 'SHORT';
export type PositionStatus = 'OPEN' | 'CLOSING' | 'CLOSED';

export type SignalDirection = 'BUY' | 'SELL' | 'LONG' | 'SHORT' | 'HOLD';
export type SignalStrength = 'WEAK' | 'NEUTRAL' | 'STRONG' | 'VERY_STRONG' | 'EXTREMELY_STRONG';

export type TradeMode = 'PAPER' | 'LIVE';

export type BotStatus = 
  | 'STOPPED'
  | 'STARTING'
  | 'RUNNING'
  | 'PAUSED'
  | 'WAITING'
  | 'ANALYZING'
  | 'BUY_SIGNAL'
  | 'BUYING'
  | 'POSITION_OPEN'
  | 'SELL_SIGNAL'
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

export interface Ticker {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  volumeUsd24h: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  timestamp: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  tradesCount: number;
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
  usdValue?: number;
}

export interface OrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  price?: number;
  stopPrice?: number;
  reduceOnly?: boolean;
  postOnly?: boolean;
  timeInForce?: string;
  clientOrderId?: string;
  leverage?: number;
}

export interface OrderResult {
  id: string;
  clientOrderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  filledAmount: number;
  status: OrderStatus;
  fee: number;
  feeAsset: string;
  timestamp: number;
}

export interface PositionInfo {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  size: number;
  value: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  stopLoss?: number;
  takeProfit?: number;
  liquidationPrice?: number;
  status: PositionStatus;
  timestamp: number;
}

export interface FundingRate {
  symbol: string;
  rate: number;
  nextFundingTime: number;
  timestamp: number;
}

export interface OpenInterest {
  symbol: string;
  value: number;
  timestamp: number;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  testnet?: boolean;
}

export interface MarketDataPoint {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
}

export interface SignalInput {
  symbol: string;
  timeframe: Timeframe;
  exchange: ExchangeName;
  candles: Candle[];
  ticker: Ticker;
  orderBook?: OrderBook;
  fundingRate?: FundingRate;
  openInterest?: OpenInterest;
  currentBalance?: Balance[];
}

export interface SignalOutput {
  direction: SignalDirection;
  strength: SignalStrength;
  confidence: number;
  entryPrice: number;
  entryZoneLow: number;
  entryZoneHigh: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  riskReward: number;
  invalidationLevel?: number;
  
  trendScore: number;
  momentumScore: number;
  volumeScore: number;
  structureScore: number;
  futuresScore: number;
  riskScore: number;
  
  indicators: IndicatorValues;
  supportLevels: number[];
  resistanceLevels: number[];
  fundingRate?: number;
  openInterest?: number;
  volumeAnalysis: VolumeAnalysis;
  reasons: string[];
  warnings: string[];
}

export interface IndicatorValues {
  rsi: number;
  stochRsi: { k: number; d: number };
  williamsR: number;
  macd: { value: number; signal: number; histogram: number };
  bollingerBands: { upper: number; middle: number; lower: number; position: number };
  vwap: number;
  ema200: number;
  emaTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  atr: number;
  volumeRatio: number;
  volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  currentPrice: number;
  [key: string]: unknown;
}

export interface VolumeAnalysis {
  currentVolume: number;
  averageVolume: number;
  volumeRatio: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  buyVolume: number;
  sellVolume: number;
  delta: number;
  [key: string]: unknown;
}

export interface RiskCalculation {
  positionSize: number;
  marginRequired: number;
  maxLoss: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskRewardRatio: number;
  leverage: number;
  liquidationPrice?: number;
}

export interface UserJwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBotRequest {
  name: string;
  exchangeAccountId: string;
  symbol: string;
  strategy: BotStrategy;
  timeframe: Timeframe;
  tradeMode: TradeMode;
  leverage: number;
  config: BotConfig;
  riskSettings: RiskSettings;
}

export interface BotConfig {
  buyConditions: BuyConditions;
  sellConditions: SellConditions;
  capital: CapitalConfig;
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

export interface PlaceOrderRequest {
  botId?: string;
  exchangeAccountId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  price?: number;
  stopPrice?: number;
  reduceOnly?: boolean;
  postOnly?: boolean;
  tradeMode: TradeMode;
}

export interface ClosePositionRequest {
  positionId: string;
  percentage?: number;
}

export interface ModifyPositionRequest {
  positionId: string;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
}

// ============================================================
// NEWS INTELLIGENCE TYPES
// ============================================================

export type NewsSourceType = 
  | 'RSS' 
  | 'API' 
  | 'TWITTER' 
  | 'TELEGRAM' 
  | 'DISCORD' 
  | 'REDDIT' 
  | 'YOUTUBE' 
  | 'OFFICIAL_BLOG' 
  | 'EXCHANGE_ANNOUNCEMENT' 
  | 'REGULATORY_FILING' 
  | 'WHALE_ALERT' 
  | 'ON_CHAIN' 
  | 'MANUAL';

export type NewsCategory = 
  | 'REGULATORY'
  | 'ETF'
  | 'EXCHANGE_LISTING'
  | 'EXCHANGE_DELISTING'
  | 'PARTNERSHIP'
  | 'PROTOCOL_UPGRADE'
  | 'TOKEN_UNLOCK'
  | 'HACK_EXPLOIT'
  | 'SECURITY_INCIDENT'
  | 'WHALE_ACTIVITY'
  | 'MACRO_ECONOMIC'
  | 'FED_DECISION'
  | 'CPI_DATA'
  | 'EMPLOYMENT_DATA'
  | 'EARNINGS'
  | 'CORPORATE_ADOPTION'
  | 'GOVERNANCE'
  | 'AIRDROP'
  | 'BURN'
  | 'STAKING'
  | 'DEFI_LAUNCH'
  | 'NFT'
  | 'MEME_COIN'
  | 'LAYER2'
  | 'INFRASTRUCTURE'
  | 'OTHER';

export type NewsSentiment = 
  | 'VERY_BEARISH'
  | 'BEARISH'
  | 'NEUTRAL'
  | 'BULLISH'
  | 'VERY_BULLISH';

export type NewsImpactLevel = 
  | 'NEGLIGIBLE'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type NewsEventStatus = 
  | 'BREAKING'
  | 'ACTIVE'
  | 'FADING'
  | 'RESOLVED'
  | 'ARCHIVED';

export type TradeGateDecision = 
  | 'APPROVED'
  | 'BLOCKED'
  | 'WARNING'
  | 'WAIT_FOR_CONFIRMATION';

export type TradeGateCheckStatus = 
  | 'PASS'
  | 'FAIL'
  | 'WARNING'
  | 'SKIPPED';

export type MacroEventType = 
  | 'FOMC_MEETING'
  | 'FOMC_MINUTES'
  | 'CPI_RELEASE'
  | 'PPI_RELEASE'
  | 'EMPLOYMENT_REPORT'
  | 'GDP_RELEASE'
  | 'FED_SPEECH'
  | 'ECB_DECISION'
  | 'BOE_DECISION'
  | 'BOJ_DECISION'
  | 'ETF_DECISION'
  | 'REGULATORY_ANNOUNCEMENT'
  | 'GOVERNMENT_POLICY'
  | 'GEOPOLITICAL'
  | 'CRYPTO_SPECIFIC';

export type SocialSourceType = 
  | 'TWITTER'
  | 'TELEGRAM'
  | 'DISCORD'
  | 'REDDIT'
  | 'YOUTUBE'
  | 'LINKEDIN'
  | 'MEDIUM'
  | 'SUBSTACK'
  | 'TRADINGVIEW';

export type NewsTimelineEventType = 
  | 'SIGNAL_GENERATED'
  | 'NEWS_DETECTED'
  | 'NEWS_CONFIRMED'
  | 'VOLUME_CONFIRMATION'
  | 'TRADE_OPENED'
  | 'SOCIAL_MENTION'
  | 'OI_CHANGE'
  | 'MACRO_EVENT'
  | 'RISK_CHANGE'
  | 'PRICE_MOVEMENT'
  | 'TRADE_CLOSED'
  | 'NEWS_CONTRADICTION'
  | 'NEWS_CONFIRMATION';

export interface NewsEvent {
  id: string;
  userId?: string;
  sourceId: string;
  sourceType: NewsSourceType;
  sourceName: string;
  sourceUrl?: string;
  title: string;
  summary?: string;
  content?: string;
  category: NewsCategory;
  sentiment: NewsSentiment;
  impactLevel: NewsImpactLevel;
  impactScore: number;
  direction: SignalDirection;
  confidence: number;
  affectedAssets: NewsAssetMapping[];
  primaryAsset?: string;
  relevanceScores: Record<string, number>;
  status: NewsEventStatus;
  publishedAt: Date;
  detectedAt: Date;
  expiresAt?: Date;
  resolvedAt?: Date;
  isVerified: boolean;
  verificationSources: string[];
  marketReaction: NewsMarketReaction;
  priceChange1h?: number;
  priceChange4h?: number;
  priceChange24h?: number;
  volumeChange1h?: number;
  volumeChange24h?: number;
  oiChange1h?: number;
  fundingChange?: number;
  liquidationData: NewsLiquidationData;
  socialMetrics: NewsSocialMetrics;
  keywords: string[];
  entities: Record<string, unknown>;
  relatedEventIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsAssetMapping {
  id: string;
  newsEventId: string;
  asset: string;
  baseAsset: string;
  quoteAsset: string;
  relevanceScore: number;
  direction?: SignalDirection;
  sentiment?: NewsSentiment;
  expectedImpact: NewsImpactLevel;
  reasoning?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsMarketReaction {
  priceChange1h?: number;
  priceChange4h?: number;
  priceChange24h?: number;
  volumeChange1h?: number;
  volumeChange24h?: number;
  oiChange1h?: number;
  oiChange24h?: number;
  fundingChange?: number;
  liquidationsLong?: number;
  liquidationsShort?: number;
  bidAskSpread?: number;
  orderBookImbalance?: number;
  timestamp: number;
}

export interface NewsLiquidationData {
  totalLong: number;
  totalShort: number;
  largestLong: number;
  largestShort: number;
  cascadeRisk: number;
}

export interface NewsSocialMetrics {
  twitterMentions: number;
  redditMentions: number;
  telegramMentions: number;
  sentimentScore: number;
  influencerCount: number;
  viralScore: number;
}

export interface NewsSource {
  id: string;
  userId?: string;
  name: string;
  type: NewsSourceType;
  url?: string;
  apiEndpoint?: string;
  credentials?: Record<string, unknown>;
  isActive: boolean;
  reliability: number;
  weight: number;
  categories: NewsCategory[];
  assets: string[];
  keywords: string[];
  excludedKeywords: string[];
  fetchInterval: number;
  lastFetchedAt?: Date;
  lastError?: string;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeGate {
  id: string;
  userId: string;
  botId?: string;
  signalId?: string;
  newsEventId?: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  direction: SignalDirection;
  tradeMode: TradeMode;
  technicalScore: number;
  technicalStatus: TradeGateCheckStatus;
  newsScore: number;
  newsStatus: TradeGateCheckStatus;
  marketScore: number;
  marketStatus: TradeGateCheckStatus;
  liquidityScore: number;
  liquidityStatus: TradeGateCheckStatus;
  riskScore: number;
  riskStatus: TradeGateCheckStatus;
  socialScore: number;
  socialStatus: TradeGateCheckStatus;
  macroScore: number;
  macroStatus: TradeGateCheckStatus;
  finalScore: number;
  decision: TradeGateDecision;
  confidence: number;
  reasoning: string;
  warnings: string[];
  blockedReasons: string[];
  weights: TradeGateWeights;
  executed: boolean;
  executedAt?: Date;
  tradeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeGateWeights {
  technical: number;
  news: number;
  marketStructure: number;
  volume: number;
  futures: number;
  social: number;
  risk: number;
  macro: number;
}

export interface NewsTimelineEvent {
  id: string;
  userId: string;
  tradeId?: string;
  signalId?: string;
  newsEventId?: string;
  type: NewsTimelineEventType;
  title: string;
  description: string;
  data: Record<string, unknown>;
  impact: number;
  timestamp: Date;
  createdAt: Date;
}

export interface MacroEvent {
  id: string;
  type: MacroEventType;
  title: string;
  description?: string;
  scheduledAt: Date;
  actualAt?: Date;
  status: string;
  importance: NewsImpactLevel;
  affectedAssets: string[];
  expectedVolatility: number;
  previousValue?: string;
  forecastValue?: string;
  actualValue?: string;
  marketReaction: Record<string, unknown>;
  source: string;
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowedPerson {
  id: string;
  userId: string;
  name: string;
  handle: string;
  type: SocialSourceType;
  profileUrl: string;
  avatarUrl?: string;
  reliability: number;
  influence: number;
  assets: string[];
  categories: NewsCategory[];
  isVerified: boolean;
  isActive: boolean;
  lastPostAt?: Date;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialSignal {
  id: string;
  userId: string;
  personId: string;
  sourceType: SocialSourceType;
  sourceUrl: string;
  content: string;
  assets: string[];
  sentiment: NewsSentiment;
  relevance: number;
  engagement: Record<string, unknown>;
  publishedAt: Date;
  detectedAt: Date;
  processed: boolean;
  linkedNewsEventId?: string;
  createdAt: Date;
}

export interface MarketReactionSnapshot {
  id: string;
  newsEventId?: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceChange1m: number;
  priceChange5m: number;
  priceChange15m: number;
  priceChange1h: number;
  priceChange4h: number;
  priceChange24h: number;
  volume: number;
  volumeChange1m: number;
  volumeChange5m: number;
  volumeChange1h: number;
  volumeChange24h: number;
  openInterest: number;
  oiChange1h: number;
  oiChange24h: number;
  fundingRate: number;
  fundingChange: number;
  liquidationsLong: number;
  liquidationsShort: number;
  bidAskSpread: number;
  orderBookImbalance: number;
  timestamp: Date;
  createdAt: Date;
}

export interface TradePostMortem {
  id: string;
  userId: string;
  tradeId: string;
  signalId?: string;
  newsEventId?: string;
  technicalContribution: number;
  newsContribution: number;
  marketContribution: number;
  socialContribution: number;
  riskEventImpact: number;
  macroEventImpact: number;
  finalOutcome: string;
  netPnl: number;
  pnlPercent: number;
  heldDurationMinutes: number;
  entryReasoning: string;
  exitReasoning: string;
  lessonsLearned: string;
  newsTimeline: NewsTimelineEvent[];
  marketReactionSummary: Record<string, unknown>;
  createdAt: Date;
}

export interface NewsReactionHistory {
  id: string;
  category: NewsCategory;
  asset: string;
  baseAsset: string;
  quoteAsset: string;
  sentiment: NewsSentiment;
  impactLevel: NewsImpactLevel;
  avgPriceChange1h: number;
  avgPriceChange4h: number;
  avgPriceChange24h: number;
  avgVolumeChange: number;
  avgOIChange: number;
  sampleCount: number;
  winRate: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface TradeGateCheckInput {
  symbol: string;
  direction: SignalDirection;
  tradeMode: TradeMode;
  technicalScore: number;
  newsEventIds?: string[];
  weights?: Partial<TradeGateWeights>;
}

export interface TradeGateResult {
  decision: TradeGateDecision;
  confidence: number;
  finalScore: number;
  breakdown: {
    technical: { score: number; status: TradeGateCheckStatus; details: string };
    news: { score: number; status: TradeGateCheckStatus; details: string };
    market: { score: number; status: TradeGateCheckStatus; details: string };
    liquidity: { score: number; status: TradeGateCheckStatus; details: string };
    risk: { score: number; status: TradeGateCheckStatus; details: string };
    social: { score: number; status: TradeGateCheckStatus; details: string };
    macro: { score: number; status: TradeGateCheckStatus; details: string };
  };
  reasoning: string;
  warnings: string[];
  blockedReasons: string[];
}
