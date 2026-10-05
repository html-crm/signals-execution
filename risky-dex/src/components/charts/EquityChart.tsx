'use client';

import { cn } from '../../utils/helpers';
import { Panel } from '../ui';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  type TooltipPayload,
} from 'recharts';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatPercent } from '../../utils/helpers';
import { useMemo, useEffect, useState } from 'react';

const timeframes = ['1H', '6H', '24H', '7D', '30D'] as const;
type Timeframe = typeof timeframes[number];

interface EquityDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

interface TradeMarker {
  time: string;
  value: number;
  type: 'BUY' | 'SELL';
  pnl?: number;
}

interface ExtendedPortfolio {
  totalEquity: number;
  startingCapital?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
}

export function EquityChart() {
  const { portfolio, chartTimeframe, setChartTimeframe, bots } = useAppStore();
  const [equityData, setEquityData] = useState<EquityDataPoint[]>([]);
  const [tradeMarkers, setTradeMarkers] = useState<TradeMarker[]>([]);

  useEffect(() => {
    generateEquityData();
  }, [chartTimeframe, portfolio?.totalEquity]);

  const generateEquityData = () => {
    const now = Date.now();
    let points: number;
    let intervalMs: number;

    switch (chartTimeframe) {
      case '1H':
        points = 60;
        intervalMs = 60 * 1000;
        break;
      case '6H':
        points = 72;
        intervalMs = 5 * 60 * 1000;
        break;
      case '24H':
        points = 96;
        intervalMs = 15 * 60 * 1000;
        break;
      case '7D':
        points = 168;
        intervalMs = 60 * 60 * 1000;
        break;
      case '30D':
        points = 120;
        intervalMs = 6 * 60 * 60 * 1000;
        break;
    }

    const portfolioData = portfolio as ExtendedPortfolio | null;
    const startEquity = portfolioData?.startingCapital ?? 10000;
    const currentEquity = portfolioData?.totalEquity ?? 12482;
    const totalChange = currentEquity - startEquity;

    const data: EquityDataPoint[] = [];
    let currentValue = startEquity;

    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const baseValue = startEquity + totalChange * progress;
      const volatility = (Math.random() - 0.5) * Math.abs(totalChange) * 0.05;
      currentValue = baseValue + volatility;

      const timestamp = now - (points - i) * intervalMs;
      const date = new Date(timestamp);
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      data.push({
        time: timeStr,
        value: Math.max(currentValue, startEquity * 0.5),
        timestamp,
      });
    }

    data[data.length - 1].value = currentEquity;
    setEquityData(data);

    const markers: TradeMarker[] = [];
    const runningBots = bots.filter(b => b.status === 'RUNNING' || b.status === 'BUYING' || b.status === 'SELLING');
    runningBots.forEach(bot => {
      const trades = Math.min(bot.performance.totalTrades, 10);
      for (let i = 0; i < trades; i++) {
        const randomPoint = Math.floor(Math.random() * data.length);
        const isBuy = Math.random() > 0.5;
        markers.push({
          time: data[randomPoint].time,
          value: data[randomPoint].value,
          type: isBuy ? 'BUY' : 'SELL',
          pnl: isBuy ? undefined : (Math.random() - 0.3) * 10,
        });
      }
    });
    setTradeMarkers(markers);
  };

  const portfolioData = portfolio as ExtendedPortfolio | null;
  const startEquity = portfolioData?.startingCapital ?? 10000;
  const currentEquity = portfolioData?.totalEquity ?? 12482;
  const totalPnl = currentEquity - startEquity;
  const pnlPercent = startEquity !== 0 ? (totalPnl / startEquity) * 100 : 0;

  const isPositive = totalPnl >= 0;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-[#111820] border border-[#1e293b] rounded-lg p-3">
          <p className="text-xs text-[#64748b] mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-mono" style={{ color: entry.color }}>
              {entry.name}: {entry.value !== undefined ? `$${entry.value.toLocaleString()}` : '—'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Panel variant="default" padding="none" className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-lg text-text-primary">EQUITY HISTORY</h3>
          <DollarSign className="w-5 h-5 text-text-muted" />
        </div>
        <div className="flex items-center gap-2">
          {timeframes.map(tf => (
            <Button
              key={tf}
              variant={chartTimeframe === tf ? 'primary' : 'ghost'}
              size="sm"
              className="px-2 py-1 text-xs"
              onClick={() => setChartTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={equityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(30, 41, 59, 0.5)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="rgba(148, 163, 184, 0.5)"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tick={{ fill: '#64748b' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tick={{ fill: '#64748b' }}
              tickFormatter={(value) => formatCurrency(value, 0)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={10000}
              stroke="rgba(148, 163, 184, 0.3)"
              strokeDasharray="4 4"
              label={{ value: 'Start', position: 'left', fill: '#64748b', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="transparent"
              fillOpacity={0.15}
              fill={
                isPositive
                  ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.3) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(239, 68, 68, 0.3) 0%, transparent 100%)'
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            {tradeMarkers.map((marker, idx) => (
              <motion.div
                key={`marker-${idx}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ReferenceLine
                  x={marker.time}
                  stroke={marker.type === 'BUY' ? '#10b981' : '#ef4444'}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={{
                    value: marker.type,
                    position: marker.type === 'BUY' ? 'top' : 'bottom',
                    fill: marker.type === 'BUY' ? '#10b981' : '#ef4444',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    stroke: 'none',
                  }}
                />
              </motion.div>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-border-primary/50 bg-background-tertiary/50">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider">START</p>
            <p className="font-mono font-medium text-text-primary">{formatCurrency(startEquity)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider">CURRENT</p>
            <p className="font-mono font-medium text-text-primary">{formatCurrency(currentEquity)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider">P&L</p>
            <p className={cn('font-mono font-medium', isPositive ? 'text-status-success' : 'text-status-danger')}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)} ({formatPercent(pnlPercent)})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span>Max DD: {formatCurrency((portfolio as any)?.maxDrawdown || 0)}</span>
          <span>Sharpe: {((portfolio as any)?.sharpeRatio || 1.2).toFixed(2)}</span>
        </div>
      </div>
    </Panel>
  );
}