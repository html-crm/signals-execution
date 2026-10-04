'use client';

import { cn } from '../../utils/helpers';
import { Panel } from '../ui';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatNumber, formatPercent, formatTimestamp } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Activity, Zap, Droplet, Pulse, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';

const markets = [
  { symbol: 'SOL/USDC', base: 'SOL', quote: 'USDC', blockchain: 'SOLANA' },
  { symbol: 'BONK/SOL', base: 'BONK', quote: 'SOL', blockchain: 'SOLANA' },
  { symbol: 'ETH/USDC', base: 'ETH', quote: 'USDC', blockchain: 'ETHEREUM' },
  { symbol: 'BNB/USDT', base: 'BNB', quote: 'USDT', blockchain: 'BSC' },
  { symbol: 'WIF/SOL', base: 'WIF', quote: 'SOL', blockchain: 'SOLANA' },
];

export function MarketActivityPanel() {
  const { markets: marketData, setMarket } = useAppStore();
  const [selectedMarket, setSelectedMarket] = useState('SOL/USDC');
  const [showSelector, setShowSelector] = useState(false);

  const market = useMemo(() => marketData.get(selectedMarket), [marketData, selectedMarket]);

  const priceChange = market?.priceChangePercent24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <Panel variant="default" padding="none" className="h-[320px] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-lg text-text-primary">MARKET ACTIVITY</h3>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 px-3"
              onClick={() => setShowSelector(!showSelector)}
            >
              <span className="font-mono text-sm text-text-primary">{selectedMarket}</span>
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            </Button>
            {showSelector && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-background-panel border border-border-primary rounded-lg shadow-panel-hover z-50 animate-in">
                {markets.map(m => (
                  <button
                    key={m.symbol}
                    onClick={() => {
                      setSelectedMarket(m.symbol);
                      setShowSelector(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm font-mono transition-colors hover:bg-background-tertiary',
                      selectedMarket === m.symbol && 'bg-accent-primary/10 text-accent-primary'
                    )}
                  >
                    {m.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {market && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <MarketMetric
                label="PRICE"
                value={market.price}
                decimals={market.pair.base === 'BONK' || market.pair.base === 'PEPE' ? 8 : 4}
                change={priceChange}
                changeLabel="24h"
                positive={isPositive}
                icon={isPositive ? TrendingUp : TrendingDown}
              />
              <MarketMetric
                label="24H VOLUME"
                value={market.volumeUsd24h}
                compact={true}
                icon={Activity}
              />
              <MarketMetric
                label="LIQUIDITY"
                value={market.liquidity}
                compact={true}
                icon={Droplet}
              />
              <MarketMetric
                label="SPREAD"
                value={market.spreadPercent}
                suffix="%"
                compact={true}
                icon={Pulse}
              />
            </div>

            <div className="pt-4 border-t border-border-primary/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-text-secondary">ORDER BOOK</span>
                <span className="font-mono text-text-muted">Updated {formatTimestamp(market.updatedAt)}</span>
              </div>
              <OrderBook market={market} />
            </div>

            <div className="pt-4 border-t border-border-primary/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-text-secondary">RECENT TRADES</span>
                <span className="font-mono text-text-muted">{market.volume24h.toLocaleString()} 24h</span>
              </div>
              <RecentTrades market={market} />
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

interface MarketMetricProps {
  label: string;
  value: number;
  decimals?: number;
  change?: number;
  changeLabel?: string;
  positive?: boolean;
  compact?: boolean;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function MarketMetric({ label, value, decimals = 2, change, changeLabel, positive, compact, suffix, icon: Icon }: MarketMetricProps) {
  const isPositive = positive ?? (change ?? 0) >= 0;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-background-tertiary/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-text-muted" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
        </div>
        <span className="font-mono font-medium text-text-primary">
          {formatCurrency(value, decimals)}{suffix}
        </span>
      </div>
    );
  }

  return (
    <div className="col-span-2 p-4 bg-background-tertiary/50 rounded-lg">
      <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
        <Icon className="w-4 h-4" />
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end gap-3">
        <span className="font-mono text-2xl font-semibold text-text-primary">
          {formatCurrency(value, decimals)}{suffix}
        </span>
        {change !== undefined && (
          <span className={cn('font-mono text-sm font-medium mb-1', isPositive ? 'text-status-success' : 'text-status-danger')}>
            {isPositive ? '+' : ''}{formatPercent(change)} {changeLabel}
          </span>
        )}
      </div>
    </div>
  );
}

interface OrderBookProps {
  market: any;
}

function OrderBook({ market }: OrderBookProps) {
  const spread = market?.spread || 0.01;
  const midPrice = market?.price || 100;
  const levels = 8;

  const bids = Array.from({ length: levels }, (_, i) => ({
    price: midPrice - spread * (i + 1),
    size: Math.random() * 100 + 10,
    total: Math.random() * 1000 + 100,
  }));

  const asks = Array.from({ length: levels }, (_, i) => ({
    price: midPrice + spread * (i + 1),
    size: Math.random() * 100 + 10,
    total: Math.random() * 1000 + 100,
  }));

  return (
    <div className="grid grid-cols-2 gap-1 text-xs font-mono">
      <div className="text-right pr-2">
        {asks.slice().reverse().map((ask, i) => (
          <div key={i} className="flex justify-end gap-2 py-1">
            <span className="text-status-danger">{formatCurrency(ask.price, 4)}</span>
            <span className="text-text-muted w-16 text-right">{formatNumber(ask.size, 1)}</span>
          </div>
        ))}
      </div>
      <div className="pl-2 border-l border-border-primary/30">
        {bids.map((bid, i) => (
          <div key={i} className="flex gap-2 py-1">
            <span className="text-status-success">{formatCurrency(bid.price, 4)}</span>
            <span className="text-text-muted w-16 text-right">{formatNumber(bid.size, 1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecentTradesProps {
  market: any;
}

function RecentTrades({ market }: RecentTradesProps) {
  const trades = Array.from({ length: 6 }, (_, i) => ({
    time: new Date(Date.now() - i * 30000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    side: Math.random() > 0.5 ? 'BUY' : 'SELL',
    price: market?.price ? market.price * (0.999 + Math.random() * 0.002) : 100,
    size: Math.random() * 5 + 0.1,
  }));

  return (
    <div className="space-y-1">
      {trades.map((trade, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between p-2 bg-background-tertiary/50 rounded text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <span className="text-text-muted">{trade.time}</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', trade.side === 'BUY' ? 'bg-status-success/20 text-status-success' : 'bg-status-danger/20 text-status-danger')}>
              {trade.side}
            </span>
          </div>
          <div className="flex items-center gap-3 text-right">
            <span className="text-text-primary w-20 text-right">{formatCurrency(trade.price, 4)}</span>
            <span className="text-text-secondary w-16 text-right">{formatNumber(trade.size, 2)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}