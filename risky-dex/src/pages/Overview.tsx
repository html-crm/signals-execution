'use client';

import { cn } from '../utils/helpers';
import { Layout } from '../components/layout/Layout';
import { BotCard } from '../components/bots/BotCard';
import { LiveTradeFeed } from '../components/activity/LiveTradeFeed';
import { PortfolioOverview } from '../components/wallet/PortfolioOverview';
import { Panel, Badge, StatusIndicator } from '../components/ui';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/appStore';
import { mockBots } from '../utils/mockData';
import { wsService } from '../services/websocket';
import { useEffect } from 'react';
import { formatCurrency, formatPercent, formatNumber, getPnlClass } from '../utils/helpers';
import { TrendingUp, TrendingDown, Zap, Activity, Target, Shield, RotateCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OverviewPage() {
  const { bots, setBots, systemStatus, setSystemStatus, portfolio, setPortfolio } = useAppStore();

  useEffect(() => {
    if (bots.length === 0) {
      setBots(mockBots);
    }
    wsService.connect();
    return () => wsService.disconnect();
  }, [bots.length, setBots]);

  const activeBots = bots.filter((b) => b.status === 'RUNNING' || b.status === 'BUYING' || b.status === 'SELLING' || b.status === 'WAITING');
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
    { label: 'ACTIVE BOTS', value: runningBots.length, change: activeBots.length - runningBots.length, changePercent: 0, icon: Activity, color: 'text-accent-primary' },
    { label: 'OPEN POSITIONS', value: activeBots.reduce((sum, b) => sum + Math.floor(Math.random() * 3), 0), change: 0, changePercent: 0, icon: Target, color: 'text-status-warning' },
    { label: '24H VOLUME', value: totalVolume, change: 0, changePercent: 0, icon: TrendingUp, color: 'text-text-secondary' },
    { label: 'WIN RATE', value: winRate, change: 0, changePercent: 0, icon: Shield, color: winRate >= 60 ? 'text-status-success' : 'text-status-warning', isPercent: true },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">RISKY-DEX</h1>
            <p className="text-text-secondary mt-1">TRADING CONTROL CENTER</p>
          </div>
          <div className="flex items-center gap-3">
            <Panel variant="glass" padding="sm" className="flex items-center gap-2">
              <StatusIndicator status={systemStatus.connection === 'LIVE' ? 'RUNNING' : 'STOPPED'} size="sm" />
              <span className="text-xs font-mono font-medium text-text-primary">{systemStatus.connection === 'LIVE' ? 'LIVE' : 'OFFLINE'}</span>
            </Panel>
            <Panel variant="glass" padding="sm" className="flex items-center gap-2">
              <Badge variant={systemStatus.mode === 'LIVE' ? 'danger' : 'info'} dot>
                {systemStatus.mode}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => setSystemStatus({ mode: systemStatus.mode === 'SIMULATION' ? 'LIVE' : 'SIMULATION' })} disabled={systemStatus.mode === 'LIVE'}>
                <RotateCw className="w-4 h-4" />
              </Button>
            </Panel>
            <Button variant="primary" onClick={() => window.location.href = '/bots/create'}>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                      <span className={cn('text-2xl md:text-3xl font-bold font-mono tabular-nums', metric.color)}>
                        {metric.isPercent ? formatPercent(metric.value as number) : formatCurrency(metric.value as number)}
                      </span>
                      {metric.change !== 0 && (
                        <span className={cn('text-sm font-mono font-medium', getPnlClass(metric.change as number))}>
                          {metric.change >= 0 ? '+' : ''}{metric.isPercent ? formatPercent(metric.change as number) : formatCurrency(metric.change as number)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center text-text-muted">
                    <metric.icon className="w-6 h-6" />
                  </div>
                </div>
              </Panel>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel variant="default" padding="none" className="h-[500px] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border-primary">
                <h2 className="font-display font-semibold text-lg text-text-primary">ACTIVE BOTS</h2>
                <Badge variant="running" dot pulsing>MONITORING</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {runningBots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                    <Zap className="w-12 h-12 mb-4 text-text-muted" />
                    <p className="text-lg">No active bots</p>
                    <p className="text-sm mt-1">Create your first trading bot to get started</p>
                    <Button variant="primary" className="mt-4" onClick={() => window.location.href = '/bots/create'}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Bot
                    </Button>
                  </div>
                ) : (
                  runningBots.map((bot, index) => (
                    <motion.div
                      key={bot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <BotCard
                        bot={bot}
                        onPause={() => wsService.pauseBot(bot.id)}
                        onStop={() => wsService.stopBot(bot.id)}
                        onDetails={() => window.location.href = `/bots/${bot.id}`}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <LiveTradeFeed />
            <PortfolioOverview />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel variant="default" padding="lg">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4">SYSTEM STATUS</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatusItem label="System Status" value={systemStatus.status} status={systemStatus.status === 'OPERATIONAL' ? 'success' : 'warning'} />
              <StatusItem label="API Status" value={systemStatus.apiStatus} status={systemStatus.apiStatus === 'HEALTHY' ? 'success' : 'warning'} />
              <StatusItem label="Latency" value={`${systemStatus.latency}ms`} status={systemStatus.latency < 50 ? 'success' : 'warning'} />
              <StatusItem label="Mode" value={systemStatus.mode} status={systemStatus.mode === 'LIVE' ? 'danger' : 'info'} />
            </div>
            <div className="mt-6 pt-6 border-t border-border-primary/50">
              <h4 className="font-medium text-text-secondary mb-3">RPC Endpoints</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(systemStatus.rpcStatus).map(([chain, status]) => (
                  <div key={chain} className="flex items-center justify-between p-2 bg-background-tertiary/50 rounded">
                    <span className="font-medium text-text-primary">{chain}</span>
                    <Badge variant={status === 'HEALTHY' ? 'success' : status === 'DEGRADED' ? 'warning' : 'danger'} dot>
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel variant="default" padding="lg">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4">QUICK ACTIONS</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => window.location.href = '/bots/create'}>
                <Plus className="w-6 h-6" />
                <span>Create Bot</span>
              </Button>
              <Button variant="secondary" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => window.location.href = '/bots'}>
                <Activity className="w-6 h-6" />
                <span>Manage Bots</span>
              </Button>
              <Button variant="secondary" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => window.location.href = '/markets'}>
                <TrendingUp className="w-6 h-6" />
                <span>View Markets</span>
              </Button>
              <Button variant="warning" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => wsService.emergencyStopAll()}>
                <Shield className="w-6 h-6" />
                <span>Emergency Stop</span>
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}

function StatusItem({ label, value, status }: { label: string; value: string; status: 'success' | 'warning' | 'danger' | 'info' }) {
  const statusColors = {
    success: 'text-status-success',
    warning: 'text-status-warning',
    danger: 'text-status-danger',
    info: 'text-accent-primary',
  };

  return (
    <div className="p-3 bg-background-tertiary/50 rounded-lg">
      <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('font-mono font-medium', statusColors[status])}>{value}</p>
    </div>
  );
}