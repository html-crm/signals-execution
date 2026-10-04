import type { Bot, BotEvent, Market, Order, Position, Portfolio, SystemStatus, Trade, Wallet, BotStatus, TradeEventType } from '../types';
import { useAppStore } from '@store/appStore';
import { generateId } from '@utils/helpers';

type EventCallback = (event: BotEvent) => void;

class WebSocketService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private priceIntervalId: ReturnType<typeof setInterval> | null = null;
  private botIntervalId: ReturnType<typeof setInterval> | null = null;
  private callbacks: Set<EventCallback> = new Set();
  private isRunning = false;

  connect() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.simulateSystemStatus();
    this.simulatePriceUpdates();
    this.simulateBotActivity();
  }

  disconnect() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.priceIntervalId) clearInterval(this.priceIntervalId);
    if (this.botIntervalId) clearInterval(this.botIntervalId);
  }

  subscribe(callback: EventCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private emit(event: BotEvent) {
    this.callbacks.forEach((cb) => cb(event));
  }

  private simulateSystemStatus() {
    this.intervalId = setInterval(() => {
      const state = useAppStore.getState();
      const latency = Math.max(8, Math.min(45, state.systemStatus.latency + (Math.random() - 0.5) * 4));
      state.setSystemStatus({ latency: Math.round(latency), lastUpdate: new Date().toISOString() });
    }, 5000);
  }

  private simulatePriceUpdates() {
    const pairs = [
      { base: 'SOL', quote: 'USDC', price: 169.42, volatility: 0.02 },
      { base: 'BONK', quote: 'SOL', price: 0.00001234, volatility: 0.05 },
      { base: 'ETH', quote: 'USDC', price: 2634.12, volatility: 0.015 },
      { base: 'BNB', quote: 'USDT', price: 312.45, volatility: 0.018 },
      { base: 'WIF', quote: 'SOL', price: 0.001234, volatility: 0.06 },
      { base: 'PEPE', quote: 'USDC', price: 0.00001245, volatility: 0.04 },
    ];

    this.priceIntervalId = setInterval(() => {
      pairs.forEach((pair) => {
        const change = (Math.random() - 0.5) * pair.volatility * 2;
        pair.price = Math.max(0.00000001, pair.price * (1 + change));
        const priceChange24h = pair.price * (Math.random() - 0.5) * 0.1;
        const priceChangePercent24h = (priceChange24h / pair.price) * 100;

        const market = {
          pair: { base: pair.base, quote: pair.quote, symbol: `${pair.base}/${pair.quote}`, blockchain: 'SOLANA' as const, decimals: 6, minOrderSize: 0.01, tickSize: 0.01 },
          price: pair.price,
          priceChange24h,
          priceChangePercent24h,
          volume24h: Math.random() * 10000000 + 1000000,
          volumeUsd24h: Math.random() * 50000000 + 5000000,
          liquidity: Math.random() * 5000000 + 500000,
          spread: pair.price * 0.001,
          spreadPercent: 0.1,
          high24h: pair.price * 1.05,
          low24h: pair.price * 0.95,
          bid: pair.price * 0.9995,
          ask: pair.price * 1.0005,
          bidSize: Math.random() * 1000 + 100,
          askSize: Math.random() * 1000 + 100,
          updatedAt: new Date().toISOString(),
        };

        useAppStore.getState().setMarket(market);

        this.emit({
          id: generateId(),
          botId: 'system',
          botName: 'SYSTEM',
          type: 'PRICE_UPDATE',
          message: `Price update: ${pair.base}/${pair.quote} = $${pair.price.toFixed(pair.base === 'BONK' || pair.base === 'PEPE' ? 8 : 4)}`,
          data: { pair: `${pair.base}/${pair.quote}`, price: pair.price },
          severity: 'INFO',
          timestamp: new Date().toISOString(),
        });
      });
    }, 2000);
  }

  private simulateBotActivity() {
    const botNames = ['SOL MOMENTUM', 'MEME SCALPER', 'GRID TRADER', 'DCA BOT', 'BREAKOUT HUNTER'];
    const pairs = ['SOL/USDC', 'BONK/SOL', 'ETH/USDC', 'BNB/USDT', 'WIF/SOL'];
    const statuses: BotStatus[] = ['RUNNING', 'RUNNING', 'RUNNING', 'WAITING', 'PAUSED'];

    this.botIntervalId = setInterval(() => {
      const state = useAppStore.getState();
      const bots = state.bots;

      if (bots.length === 0) return;

      const runningBots = bots.filter((b) => b.status === 'RUNNING');
      if (runningBots.length === 0) return;

      const bot = runningBots[Math.floor(Math.random() * runningBots.length)];
      const pair = bot.pair;
      const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const amount = Math.random() * 2 + 0.1;
      const price = pair.base === 'BONK' || pair.base === 'PEPE' 
        ? 0.00001234 + Math.random() * 0.000002 
        : 160 + Math.random() * 20;
      const value = amount * price;
      const pnl = action === 'SELL' ? (Math.random() - 0.3) * 5 : undefined;

      // Emit trade event
      this.emit({
        id: generateId(),
        botId: bot.id,
        botName: bot.name,
        type: action === 'BUY' ? 'BUY' : 'SELL',
        message: `${action} ${amount.toFixed(4)} ${pair.base} @ $${price.toFixed(pair.base === 'BONK' || pair.base === 'PEPE' ? 8 : 4)}`,
        data: { pair: `${pair.base}/${pair.quote}`, amount, price, value, side: action },
        severity: 'SUCCESS',
        timestamp: new Date().toISOString(),
        pair: bot.pair,
        price,
        amount,
        pnl,
      });

      // Update bot P&L
      const pnlChange = pnl || (action === 'BUY' ? 0 : (Math.random() - 0.4) * 3);
      state.updateBot(bot.id, {
        performance: {
          ...bot.performance,
          totalPnl: bot.performance.totalPnl + (pnlChange || 0),
          todayPnl: bot.performance.todayPnl + (pnlChange || 0),
          totalTrades: bot.performance.totalTrades + 1,
          winningTrades: bot.performance.winningTrades + (pnlChange && pnlChange > 0 ? 1 : 0),
          losingTrades: bot.performance.losingTrades + (pnlChange && pnlChange < 0 ? 1 : 0),
          currentEquity: bot.performance.currentEquity + (pnlChange || 0),
          realizedPnl: bot.performance.realizedPnl + (pnlChange || 0),
        },
      });

      // Add trade record
      const trade: Trade = {
        id: generateId(),
        botId: bot.id,
        botName: bot.name,
        pair: bot.pair,
        side: action,
        type: 'MARKET',
        price,
        amount,
        value,
        fee: value * 0.001,
        pnl: pnlChange,
        pnlPercent: pnlChange ? (pnlChange / value) * 100 : undefined,
        status: 'FILLED',
        executedAt: new Date().toISOString(),
        signal: {
          id: generateId(),
          botId: bot.id,
          type: action,
          confidence: 75 + Math.random() * 20,
          strength: 60 + Math.random() * 30,
          indicators: {
            momentum: 50 + Math.random() * 40,
            volumeChange: (Math.random() - 0.5) * 200,
            trend: action === 'BUY' ? 'BULLISH' : 'BEARISH',
          },
          reasoning: `${action} signal detected: momentum ${(50 + Math.random() * 40).toFixed(1)}%, volume ${((Math.random() - 0.5) * 200).toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          executed: true,
        },
      };
      state.addTrade(trade);

      // Maybe emit signal event
      if (Math.random() > 0.7) {
        this.emit({
          id: generateId(),
          botId: bot.id,
          botName: bot.name,
          type: 'SIGNAL',
          message: `Signal: ${action} ${pair.base} - Confidence: ${(75 + Math.random() * 20).toFixed(0)}%`,
          data: { action, confidence: 75 + Math.random() * 20 },
          severity: 'INFO',
          timestamp: new Date().toISOString(),
        });
      }

      // Random bot state changes
      if (Math.random() > 0.95) {
        const newStatus: BotStatus = Math.random() > 0.5 ? 'WAITING' : 'RUNNING';
        state.updateBot(bot.id, { status: newStatus });
        this.emit({
          id: generateId(),
          botId: bot.id,
          botName: bot.name,
          type: newStatus === 'WAITING' ? 'BOT_PAUSED' : 'BOT_STARTED',
          message: `Bot ${newStatus === 'WAITING' ? 'paused' : 'resumed'}`,
          severity: 'INFO',
          timestamp: new Date().toISOString(),
        });
      }
    }, 8000 + Math.random() * 12000);
  }

  // Manual trade execution
  executeManualTrade(botId: string, side: 'BUY' | 'SELL', amount: number, pair: { base: string; quote: string }, price: number) {
    const state = useAppStore.getState();
    const bot = state.getBot(botId);
    if (!bot) return;

    const value = amount * price;
    const trade: Trade = {
      id: generateId(),
      botId,
      botName: bot.name,
      pair: bot.pair,
      side,
      type: 'MARKET',
      price,
      amount,
      value,
      fee: value * 0.001,
      status: 'FILLED',
      executedAt: new Date().toISOString(),
    };
    state.addTrade(trade);

    this.emit({
      id: generateId(),
      botId,
      botName: bot.name,
      type: side === 'BUY' ? 'BUY' : 'SELL',
      message: `MANUAL ${side} ${amount.toFixed(4)} ${pair.base} @ $${price.toFixed(4)}`,
      data: { pair: `${pair.base}/${pair.quote}`, amount, price, value, side, manual: true },
      severity: 'SUCCESS',
      timestamp: new Date().toISOString(),
      pair: bot.pair,
      price,
      amount,
    });
  }

  // Bot control
  startBot(botId: string) {
    const state = useAppStore.getState();
    const bot = state.getBot(botId);
    if (!bot) return;

    state.updateBot(botId, { status: 'RUNNING', startedAt: new Date().toISOString() });
    this.emit({
      id: generateId(),
      botId,
      botName: bot.name,
      type: 'BOT_STARTED',
      message: `Bot started`,
      severity: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });
  }

  pauseBot(botId: string) {
    const state = useAppStore.getState();
    const bot = state.getBot(botId);
    if (!bot) return;

    state.updateBot(botId, { status: 'PAUSED' });
    this.emit({
      id: generateId(),
      botId,
      botName: bot.name,
      type: 'BOT_PAUSED',
      message: `Bot paused`,
      severity: 'WARNING',
      timestamp: new Date().toISOString(),
    });
  }

  stopBot(botId: string) {
    const state = useAppStore.getState();
    const bot = state.getBot(botId);
    if (!bot) return;

    state.updateBot(botId, { status: 'STOPPED', stoppedAt: new Date().toISOString() });
    this.emit({
      id: generateId(),
      botId,
      botName: bot.name,
      type: 'BOT_STOPPED',
      message: `Bot stopped`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });
  }

  emergencyStopAll() {
    const state = useAppStore.getState();
    state.bots.forEach((bot) => {
      if (bot.status === 'RUNNING' || bot.status === 'BUYING' || bot.status === 'SELLING' || bot.status === 'WAITING') {
        state.updateBot(bot.id, { status: 'STOPPED', stoppedAt: new Date().toISOString() });
        this.emit({
          id: generateId(),
          botId: bot.id,
          botName: bot.name,
          type: 'BOT_STOPPED',
          message: `Emergency stop executed`,
          severity: 'ERROR',
          timestamp: new Date().toISOString(),
        });
      }
    });
  }
}

export const wsService = new WebSocketService();