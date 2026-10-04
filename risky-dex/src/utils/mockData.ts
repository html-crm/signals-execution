import type { Bot, BotConfig, BotPerformance, RiskSettings, TradingPair, BotStatus, BotStrategy, Blockchain } from '../types';
import { generateId } from '../utils/helpers';

const tradingPairs: Record<string, TradingPair> = {
  'SOL/USDC': { base: 'SOL', quote: 'USDC', symbol: 'SOL/USDC', blockchain: 'SOLANA', decimals: 9, minOrderSize: 0.01, tickSize: 0.01 },
  'BONK/SOL': { base: 'BONK', quote: 'SOL', symbol: 'BONK/SOL', blockchain: 'SOLANA', decimals: 5, minOrderSize: 1000, tickSize: 0.00000001 },
  'ETH/USDC': { base: 'ETH', quote: 'USDC', symbol: 'ETH/USDC', blockchain: 'ETHEREUM', decimals: 18, minOrderSize: 0.001, tickSize: 0.01 },
  'BNB/USDT': { base: 'BNB', quote: 'USDT', symbol: 'BNB/USDT', blockchain: 'BSC', decimals: 18, minOrderSize: 0.01, tickSize: 0.01 },
  'WIF/SOL': { base: 'WIF', quote: 'SOL', symbol: 'WIF/SOL', blockchain: 'SOLANA', decimals: 6, minOrderSize: 1, tickSize: 0.000001 },
};

function createBotConfig(strategy: BotStrategy): BotConfig {
  const baseConfig: BotConfig = {
    buyConditions: {
      priceChangePercent: 2.5,
      volumeThreshold: 150000,
      momentumThreshold: 'BULLISH',
      allowSlippage: 0.5,
      minimumLiquidity: 250000,
    },
    sellConditions: {
      takeProfitPercent: 4,
      stopLossPercent: 2,
      trailingStopPercent: 1.5,
    },
    capital: {
      initialCapital: 2500,
      tradeSize: 250,
      tradeSizeType: 'FIXED',
      maxExposure: 2000,
      maxExposureType: 'FIXED',
      reserveCapital: 500,
    },
    riskLimits: {
      maxDailyLoss: 100,
      maxDailyLossType: 'FIXED',
      maxOpenPositions: 3,
      maxPositionSize: 1000,
      maxSlippage: 1,
      cooldownAfterLoss: 15,
      emergencyStopLoss: 5,
    },
  };

  switch (strategy) {
    case 'MOMENTUM':
      return {
        ...baseConfig,
        buyConditions: { ...baseConfig.buyConditions, priceChangePercent: 3, momentumThreshold: 'BULLISH' },
        sellConditions: { ...baseConfig.sellConditions, takeProfitPercent: 5, stopLossPercent: 2.5 },
      };
    case 'MEAN_REVERSION':
      return {
        ...baseConfig,
        buyConditions: { ...baseConfig.buyConditions, priceChangePercent: -2, momentumThreshold: 'BEARISH' },
        sellConditions: { ...baseConfig.sellConditions, takeProfitPercent: 3, stopLossPercent: 1.5 },
      };
    case 'GRID':
      return {
        ...baseConfig,
        buyConditions: { ...baseConfig.buyConditions, priceChangePercent: 0.5, volumeThreshold: 50000 },
        sellConditions: { ...baseConfig.sellConditions, takeProfitPercent: 1.5, stopLossPercent: 0.8 },
      };
    case 'DCA':
      return {
        ...baseConfig,
        buyConditions: { ...baseConfig.buyConditions, priceChangePercent: 0, volumeThreshold: 10000 },
        sellConditions: { ...baseConfig.sellConditions, takeProfitPercent: 8, stopLossPercent: 5 },
      };
    case 'BREAKOUT':
      return {
        ...baseConfig,
        buyConditions: { ...baseConfig.buyConditions, priceChangePercent: 5, volumeThreshold: 300000, momentumThreshold: 'BULLISH' },
        sellConditions: { ...baseConfig.sellConditions, takeProfitPercent: 6, stopLossPercent: 3 },
      };
    default:
      return baseConfig;
  }
}

function createBotPerformance(initialCapital: number): BotPerformance {
  const totalPnl = (Math.random() - 0.3) * initialCapital * 0.3;
  const todayPnl = (Math.random() - 0.4) * 200;
  const totalTrades = Math.floor(Math.random() * 50) + 10;
  const winRate = 55 + Math.random() * 30;
  const winningTrades = Math.floor(totalTrades * (winRate / 100));

  return {
    totalPnl,
    totalPnlPercent: (totalPnl / initialCapital) * 100,
    todayPnl,
    todayPnlPercent: (todayPnl / initialCapital) * 100,
    totalTrades,
    winningTrades,
    losingTrades: totalTrades - winningTrades,
    winRate,
    avgWin: 15 + Math.random() * 30,
    avgLoss: 8 + Math.random() * 15,
    profitFactor: 1.2 + Math.random() * 1.5,
    sharpeRatio: 0.8 + Math.random() * 1.5,
    maxDrawdown: Math.random() * initialCapital * 0.15,
    maxDrawdownPercent: Math.random() * 15,
    currentEquity: initialCapital + totalPnl,
    startingCapital: initialCapital,
    deployedCapital: initialCapital * 0.7,
    unrealizedPnl: (Math.random() - 0.4) * 100,
    realizedPnl: totalPnl - (Math.random() - 0.4) * 100,
    fees: totalTrades * 2.5,
    exposure: initialCapital * 0.7,
    exposurePercent: 70,
  };
}

function createRiskSettings(): RiskSettings {
  return {
    maxTradeSize: 1000,
    maxDailyLoss: 200,
    maxExposure: 5000,
    maxOpenPositions: 5,
    maxSlippage: 1,
    stopLossPercent: 2,
    takeProfitPercent: 4,
    emergencyShutdown: false,
  };
}

export const mockBots: Bot[] = [
  {
    id: generateId(),
    name: 'SOL MOMENTUM',
    status: 'RUNNING',
    strategy: 'MOMENTUM',
    blockchain: 'SOLANA',
    pair: tradingPairs['SOL/USDC'],
    config: createBotConfig('MOMENTUM'),
    performance: createBotPerformance(2500),
    riskSettings: createRiskSettings(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: 'MEME SCALPER',
    status: 'RUNNING',
    strategy: 'MOMENTUM',
    blockchain: 'SOLANA',
    pair: tradingPairs['BONK/SOL'],
    config: createBotConfig('MOMENTUM'),
    performance: createBotPerformance(1500),
    riskSettings: createRiskSettings(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: 'GRID TRADER',
    status: 'RUNNING',
    strategy: 'GRID',
    blockchain: 'ETHEREUM',
    pair: tradingPairs['ETH/USDC'],
    config: createBotConfig('GRID'),
    performance: createBotPerformance(3000),
    riskSettings: createRiskSettings(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: 'BNB DCA',
    status: 'PAUSED',
    strategy: 'DCA',
    blockchain: 'BSC',
    pair: tradingPairs['BNB/USDT'],
    config: createBotConfig('DCA'),
    performance: createBotPerformance(2000),
    riskSettings: createRiskSettings(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    stoppedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: 'BREAKOUT HUNTER',
    status: 'WAITING',
    strategy: 'BREAKOUT',
    blockchain: 'SOLANA',
    pair: tradingPairs['WIF/SOL'],
    config: createBotConfig('BREAKOUT'),
    performance: createBotPerformance(1000),
    riskSettings: createRiskSettings(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const botTemplates = [
  {
    id: 'momentum-template',
    name: 'MOMENTUM',
    description: 'Trend-following strategy that buys on momentum breakouts and sells on trend exhaustion',
    strategy: 'MOMENTUM' as BotStrategy,
    riskLevel: 'MEDIUM' as const,
    recommendedCapital: 2000,
    typicalTradeFrequency: '10-30 trades/day',
    config: createBotConfig('MOMENTUM'),
    tags: ['Trending', 'High Frequency', 'Solana', 'Ethereum'],
  },
  {
    id: 'mean-reversion-template',
    name: 'MEAN REVERSION',
    description: 'Buys oversold assets and sells overbought assets based on statistical deviation',
    strategy: 'MEAN_REVERSION' as BotStrategy,
    riskLevel: 'LOW' as const,
    recommendedCapital: 1500,
    typicalTradeFrequency: '5-15 trades/day',
    config: createBotConfig('MEAN_REVERSION'),
    tags: ['Range-bound', 'Lower Risk', 'All Chains'],
  },
  {
    id: 'grid-template',
    name: 'GRID',
    description: 'Places buy/sell orders at fixed intervals to profit from sideways markets',
    strategy: 'GRID' as BotStrategy,
    riskLevel: 'LOW' as const,
    recommendedCapital: 3000,
    typicalTradeFrequency: '20-50 trades/day',
    config: createBotConfig('GRID'),
    tags: ['Sideways', 'Consistent', 'High Frequency'],
  },
  {
    id: 'dca-template',
    name: 'DCA',
    description: 'Dollar-cost averaging into positions over time to reduce entry timing risk',
    strategy: 'DCA' as BotStrategy,
    riskLevel: 'LOW' as const,
    recommendedCapital: 5000,
    typicalTradeFrequency: '2-5 trades/day',
    config: createBotConfig('DCA'),
    tags: ['Long-term', 'Low Stress', 'All Chains'],
  },
  {
    id: 'breakout-template',
    name: 'BREAKOUT',
    description: 'Captures explosive moves when price breaks key resistance/support levels',
    strategy: 'BREAKOUT' as BotStrategy,
    riskLevel: 'HIGH' as const,
    recommendedCapital: 1000,
    typicalTradeFrequency: '3-10 trades/day',
    config: createBotConfig('BREAKOUT'),
    tags: ['Volatile', 'High Reward', 'Meme Coins'],
  },
  {
    id: 'scalper-template',
    name: 'SCALPER',
    description: 'Ultra-fast trades capturing small price movements with tight stops',
    strategy: 'MOMENTUM' as BotStrategy,
    riskLevel: 'EXTREME' as const,
    recommendedCapital: 500,
    typicalTradeFrequency: '50-200 trades/day',
    config: { ...createBotConfig('MOMENTUM'), capital: { ...createBotConfig('MOMENTUM').capital, tradeSize: 50, maxExposure: 300 } },
    tags: ['Ultra-fast', 'High Risk', 'MEV Protection'],
  },
];