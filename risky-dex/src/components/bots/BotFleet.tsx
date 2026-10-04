'use client';

import { cn } from '../../utils/helpers';
import { Panel, Badge, StatusIndicator } from '../ui';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/helpers';
import { Pause, Square, Eye, Zap, TrendingUp, TrendingDown, Clock, Activity, RotateCcw, AlertTriangle, MousePointer, Shield } from 'lucide-react';
import type { Bot } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { wsService } from '../../services/websocket';

type BadgeVariant = 'default' | 'running' | 'paused' | 'stopped' | 'buying' | 'selling' | 'error' | 'manual' | 'risk-locked' | 'success' | 'warning' | 'danger' | 'info';

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  pulse: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const statusConfig: Record<string, StatusConfig> = {
  STOPPED: { label: 'STOPPED', variant: 'stopped', pulse: false },
  STARTING: { label: 'STARTING', variant: 'info', pulse: true, icon: Activity },
  RUNNING: { label: 'RUNNING', variant: 'running', pulse: true },
  ANALYZING: { label: 'ANALYZING', variant: 'info', pulse: true, icon: Activity },
  WAITING: { label: 'WAITING', variant: 'paused', pulse: true },
  BUY_SIGNAL: { label: 'BUY SIGNAL', variant: 'buying', pulse: true, icon: TrendingUp },
  BUYING: { label: 'BUYING', variant: 'buying', pulse: true, icon: Zap },
  POSITION_OPEN: { label: 'POSITION OPEN', variant: 'success', pulse: true },
  SELL_SIGNAL: { label: 'SELL SIGNAL', variant: 'selling', pulse: true, icon: TrendingDown },
  SELLING: { label: 'SELLING', variant: 'selling', pulse: true, icon: Zap },
  PAUSED: { label: 'PAUSED', variant: 'paused', pulse: false },
  ERROR: { label: 'ERROR', variant: 'error', pulse: false, icon: AlertTriangle },
  MANUAL_CONTROL: { label: 'MANUAL', variant: 'manual', pulse: true, icon: MousePointer },
  RISK_LOCKED: { label: 'RISK LOCKED', variant: 'risk-locked', pulse: true, icon: Shield },
};

interface BotFleetProps {
  compact?: boolean;
}

export function BotFleet({ compact = false }: BotFleetProps) {
  const { bots } = useAppStore();

  if (bots.length === 0) {
    return (
      <Panel variant="default" padding="lg" className="text-center">
        <Zap className="w-12 h-12 mx-auto mb-4 text-text-muted" />
        <p className="text-lg text-text-secondary mb-2">No bots in fleet</p>
        <p className="text-sm text-text-muted mb-4">Create your first bot to start trading</p>
        <Button variant="primary" onClick={() => window.location.href = '/bots/create'}>
          <Zap className="w-4 h-4 mr-2" />
          Create Bot
        </Button>
      </Panel>
    );
  }

  return (
    <Panel variant="default" padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <h3 className="font-display font-semibold text-lg text-text-primary">BOT FLEET</h3>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <Badge variant="running" dot>{bots.filter(b => b.status === 'RUNNING').length} Running</Badge>
          <Badge variant="paused" dot>{bots.filter(b => b.status === 'PAUSED').length} Paused</Badge>
          <Badge variant="stopped" dot>{bots.filter(b => b.status === 'STOPPED').length} Stopped</Badge>
        </div>
      </div>

      <div className={cn('p-4 space-y-3', compact ? 'max-h-96 overflow-y-auto' : '')}>
        {bots.map((bot, index) => (
          <motion.div
            key={bot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <BotFleetCard bot={bot} compact={compact} />
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

interface BotFleetCardProps {
  bot: Bot;
  compact: boolean;
}

function BotFleetCard({ bot, compact }: BotFleetCardProps) {
  const { performance, config, pair, status } = bot;
  const configStatus = statusConfig[status] || statusConfig.STOPPED;

  const isActive = ['RUNNING', 'ANALYZING', 'WAITING', 'BUY_SIGNAL', 'BUYING', 'POSITION_OPEN', 'SELL_SIGNAL', 'SELLING', 'MANUAL_CONTROL'].includes(status);
  const isTrading = ['BUYING', 'SELLING'].includes(status);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-background-tertiary/50', isActive && 'border-l-2 border-accent-primary')}>
        <StatusIndicator status={status} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{bot.name}</p>
          <p className="text-xs text-text-secondary truncate">{pair.symbol} • {bot.blockchain}</p>
        </div>
        <Badge variant={configStatus.variant} dot pulsing={configStatus.pulse}>
          {configStatus.label}
        </Badge>
        <div className="text-right w-28">
          <p className={cn('font-mono font-medium text-sm', performance.todayPnl >= 0 ? 'text-status-success' : 'text-status-danger')}>
            {formatCurrency(performance.todayPnl)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative p-4 rounded-lg bg-background-tertiary/50 border border-border-primary/50 transition-all', isActive && 'border-l-4 border-accent-primary', isTrading && 'animate-pulse-slow')}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StatusIndicator status={status} size="md" />
            <div>
              <h4 className="font-display font-semibold text-lg text-text-primary truncate">{bot.name}</h4>
              <p className="text-xs text-text-secondary truncate max-w-[200px]">{pair.symbol} • {bot.blockchain}</p>
            </div>
          </div>
          <Badge variant={configStatus.variant} dot pulsing={configStatus.pulse}>
            {configStatus.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isActive && status !== 'MANUAL_CONTROL' && status !== 'ERROR' && (
            <Button variant="ghost" size="icon" onClick={() => wsService.pauseBot(bot.id)} title="Pause">
              <Pause className="w-4 h-4" />
            </Button>
          )}
          {status !== 'STOPPED' && status !== 'STARTING' && (
            <Button variant="ghost" size="icon" onClick={() => wsService.stopBot(bot.id)} title="Stop">
              <Square className="w-4 h-4" />
            </Button>
          )}
          {status === 'MANUAL_CONTROL' && (
            <Button variant="secondary" size="sm" onClick={() => wsService.startBot(bot.id)}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Return to Bot
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => window.location.href = `/bots/${bot.id}`} title="Details">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <BotFleetMetric
          label="P&L"
          value={formatCurrency(performance.todayPnl)}
          change={formatPercent(performance.todayPnlPercent)}
          positive={performance.todayPnl >= 0}
          icon={performance.todayPnl >= 0 ? TrendingUp : TrendingDown}
        />
        <BotFleetMetric
          label="Capital"
          value={formatCurrency(config.capital.initialCapital)}
          subValue={`${formatPercent((performance.deployedCapital / config.capital.initialCapital) * 100)} deployed`}
          icon={Zap}
        />
        <BotFleetMetric
          label="Trades"
          value={performance.totalTrades.toString()}
          subValue={`${performance.winRate.toFixed(1)}% win rate`}
          icon={Activity}
        />
        <BotFleetMetric
          label={isTrading ? 'Executing...' : 'Next Check'}
          value={isTrading ? '—' : `${Math.floor(Math.random() * 60)}s`}
          icon={Clock}
        />
      </div>

      <div className="pt-3 border-t border-border-primary/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">Last:</span>
            <span className="font-mono text-text-primary">
              {performance.totalTrades > 0
                ? `${Math.random() > 0.5 ? 'BUY' : 'SELL'} ${(Math.random() * 2).toFixed(2)} ${pair.base} @ ${formatCurrency(marketPrice(pair), 4)}`
                : 'No trades yet'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">Strategy:</span>
            <Badge variant="info" className="text-xs">{bot.strategy}</Badge>
          </div>
        </div>

        {isTrading && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg flex items-center gap-2 text-sm"
            >
              <Activity className="w-4 h-4 text-accent-primary animate-spin" />
              <span className="text-accent-primary font-mono">
                {status === 'BUYING' ? 'Executing BUY order...' : 'Executing SELL order...'}
              </span>
            </motion.div>
          </AnimatePresence>
        )}

        {status === 'MANUAL_CONTROL' && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-accent-secondary/10 border border-accent-secondary/30 rounded-lg flex items-center gap-2 text-sm"
            >
              <MousePointer className="w-4 h-4 text-accent-secondary" />
              <span className="text-accent-secondary font-mono">MANUAL CONTROL ACTIVE</span>
              <Button variant="secondary" size="sm" className="ml-auto" onClick={() => wsService.startBot(bot.id)}>
                Return Control
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface BotFleetMetricProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function BotFleetMetric({ label, value, change, positive, subValue, icon: Icon }: BotFleetMetricProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Icon className="w-3 h-3" />
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-mono font-medium text-text-primary">{value}</div>
      {change && (
        <span className={cn('text-xs font-mono', positive ? 'text-status-success' : 'text-status-danger')}>
          {change}
        </span>
      )}
      {subValue && <span className="text-xs text-text-secondary">{subValue}</span>}
    </div>
  );
}

function marketPrice(pair: { base: string; quote: string }): number {
  const prices: Record<string, number> = {
    'SOL/USDC': 169.42,
    'BONK/SOL': 0.00001234,
    'ETH/USDC': 2634.12,
    'BNB/USDT': 312.45,
    'WIF/SOL': 0.001234,
  };
  return prices[`${pair.base}/${pair.quote}`] || 100;
}