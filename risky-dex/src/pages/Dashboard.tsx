'use client';

import { cn } from '../utils/helpers';
import { Layout } from '../components/layout/Layout';
import { Panel, Badge, StatusIndicator } from '../components/ui';
import { Button } from '../components/ui/Button';
import { EquityChart } from '../components/charts/EquityChart';
import { LiveTradeFeed } from '../components/activity/LiveTradeFeed';
import { MarketActivityPanel } from '../components/charts/MarketActivityPanel';
import { BotFleet } from '../components/bots/BotFleet';
import { PortfolioOverview } from '../components/wallet/PortfolioOverview';
import { useAppStore } from '../store/appStore';
import { mockBots } from '../utils/mockData';
import { wsService } from '../services/websocket';
import { useEffect } from 'react';
import { formatCurrency, formatPercent, formatNumber, getPnlClass } from '../utils/helpers';
import { TrendingUp, TrendingDown, Zap, Activity, Target, Shield, RotateCw, Plus, Shield as ShieldIcon, AlertTriangle, MousePointer, Wifi, WifiOff, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { bots, setBots, systemStatus, setSystemStatus, portfolio } = useAppStore();

  useEffect(() => {
    if (bots.length === 0) {
      setBots(mockBots);
    }
    wsService.connect();
    return () => wsService.disconnect();
  }, [bots.length, setBots]);

  const activeBots = bots.filter((b) => ['RUNNING', 'BUYING', 'SELLING', 'WAITING', 'ANALYZING', 'BUY_SIGNAL', 'SELL_SIGNAL', 'POSITION_OPEN', 'MANUAL_CONTROL'].includes(b.status));
  const runningBots = bots.filter((b) => b.status === 'RUNNING');
  const totalPnl = bots.reduce((sum, b) => sum + b.performance.totalPnl, 0);
  const todayPnl = bots.reduce((sum, b) => sum + b.performance.todayPnl, 0);
  const totalTrades = bots.reduce((sum, b) => sum + b.performance.totalTrades, 0);
  const winningTrades = bots.reduce((sum, b) => sum + b.performance.winningTrades, 0);
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalVolume = bots.reduce((sum, b) => sum + b.performance.deployedCapital, 0);

  const metrics = [
    { label: 'TOTAL EQUITY', value: portfolio?.totalEquity || 0, change: todayPnl, changePercent: portfolio?.totalEquity ? (todayPnl / portfolio.totalEquity) * 100 : 0, icon: Zap, color: 'text-text-primary' },
    { label: 'TODAY\'S P&L', value: todayPnl, change: todayPnl, changePercent: 0, icon: todayPnl >= 0 ? TrendingUp : TrendingDown, color: getPnlClass(todayPnl) },
    { label: '24H VOLUME', value: totalVolume, change: 0, changePercent: 0, icon: TrendingUp, color: 'text-text-secondary' },
    { label: 'ACTIVE BOTS', value: runningBots.length, change: activeBots.length - runningBots.length, changePercent: 0, icon: Activity, color: 'text-accent-primary' },
    { label: 'OPEN POSITIONS', value: activeBots.reduce((sum, b) => sum + Math.floor(Math.random() * 3), 0), change: 0, changePercent: 0, icon: Target, color: 'text-status-warning' },
    { label: 'WIN RATE', value: winRate, change: 0, changePercent: 0, icon: Shield, color: winRate >= 60 ? 'text-status-success' : 'text-status-warning', isPercent: true },
  ];

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">RISKY-DEX</h1>
            <p className="text-text-secondary mt-1">TRADING CONTROL CENTER</p>
          </div>
          <div className="flex items-center gap-3">
            <Panel variant="glass" padding="sm" className="flex items-center gap-2">
              <StatusIndicator status={systemStatus.connection === 'LIVE' ? 'RUNNING' : 'STOPPED'} size="sm" />
              <span className="text-xs font-mono font-medium text-text-primary">{systemStatus.connection === 'LIVE' ? 'SYSTEM ONLINE' : 'OFFLINE'}</span>
            </Panel>
            <Panel variant="glass" padding="sm" className="flex items-center gap-2">
              <Badge variant={systemStatus.mode === 'LIVE' ? 'danger' : 'info'} dot>
                {systemStatus.mode}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSystemStatus({ mode: systemStatus.mode === 'SIMULATION' ? 'LIVE' : 'SIMULATION' })}
                disabled={systemStatus.mode === 'LIVE'}
                className="px-1"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </Panel>
            <Button variant="primary" onClick={() => window.location.href = '/bots/create'}>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </div>
        </div>

        {/* Top Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Panel variant="default" padding="md" className="relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">{metric.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className={cn('text-xl md:text-2xl font-bold font-mono tabular-nums', metric.color)}>
                        {metric.isPercent ? formatPercent(metric.value as number) : formatCurrency(metric.value as number)}
                      </span>
                      {metric.change !== 0 && (
                        <span className={cn('text-sm font-mono font-medium', getPnlClass(metric.change as number))}>
                          {metric.change >= 0 ? '+' : ''}{metric.isPercent ? formatPercent(metric.change as number) : formatCurrency(metric.change as number)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-background-tertiary flex items-center justify-center text-text-muted">
                    <metric.icon className="w-5 h-5" />
                  </div>
                </div>
              </Panel>
            </motion.div>
          ))}
        </div>

        {/* Main Trading Area - Equity Chart | Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Equity Chart */}
          <div className="lg:col-span-2">
            <EquityChart />
          </div>

          {/* Right: Live Activity */}
          <div className="space-y-4">
            <LiveTradeFeed />
          </div>
        </div>

        {/* Market Activity Panel */}
        <MarketActivityPanel />

        {/* Bot Fleet */}
        <BotFleet />
      </div>
    </Layout>
  );
}