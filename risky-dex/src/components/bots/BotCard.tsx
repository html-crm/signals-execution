'use client';

import { cn } from '../../utils/helpers';
import { Panel, Badge, StatusIndicator } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatPercent, formatTimestamp, getBotStatusColor, truncateString } from '../../utils/helpers';
import { Pause, Square, Eye, Zap, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import type { Bot } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface BotCardProps {
  bot: Bot;
  compact?: boolean;
  onPause: () => void;
  onStop: () => void;
  onDetails: () => void;
}

export function BotCard({ bot, compact = false, onPause, onStop, onDetails }: BotCardProps) {
  const { performance, config, pair, status } = bot;
  const isRunning = status === 'RUNNING' || status === 'BUYING' || status === 'SELLING' || status === 'WAITING';
  const isActive = status === 'BUYING' || status === 'SELLING';

  const lastAction = performance.totalTrades > 0 
    ? `Last trade: ${(Math.random() > 0.5 ? 'BUY' : 'SELL')} ${(Math.random() * 2).toFixed(2)} ${pair.base}`
    : 'No trades yet';

  const nextEvalSeconds = Math.floor(Math.random() * 60) + 10;

  if (compact) {
    return (
      <Panel variant="default" padding="sm" className={cn('flex items-center gap-3', isRunning && 'border-l-2 border-accent-primary')}>
        <StatusIndicator status={status} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{bot.name}</p>
          <p className="text-xs text-text-secondary truncate">{pair.symbol} • {bot.blockchain}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className={cn('font-mono font-medium', getPnlClass(performance.todayPnl))}>
            {formatCurrency(performance.todayPnl)}
          </p>
          <p className="text-xs text-text-secondary">{formatPercent(performance.todayPnlPercent)} today</p>
        </div>
        <div className="flex items-center gap-1">
          {isRunning && (
            <Button variant="ghost" size="icon" onClick={onPause} title="Pause">
              <Pause className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onStop} title="Stop">
            <Square className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDetails} title="Details">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Panel
        variant="default"
        padding="md"
        className={cn(
          'relative overflow-hidden',
          isRunning && 'border-l-4 border-accent-primary',
          isActive && 'border-l-4 border-status-danger animate-pulse-slow'
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <StatusIndicator status={status} size="md" />
              <div>
                <h3 className="font-display font-semibold text-lg text-text-primary truncate">{bot.name}</h3>
                <p className="text-xs text-text-secondary truncate max-w-[200px]">{pair.symbol} • {bot.blockchain}</p>
              </div>
            </div>
            <Badge variant={status.toLowerCase() as any} dot pulsing={isActive}>
              {status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <Button variant="secondary" size="sm" onClick={onPause} className="hidden sm:flex">
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={onStop} className="hidden sm:flex">
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
            <Button variant="primary" size="sm" onClick={onDetails}>
              <Eye className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricItem
            label="P&L"
            value={formatCurrency(performance.todayPnl)}
            change={formatPercent(performance.todayPnlPercent)}
            changePositive={performance.todayPnl >= 0}
            icon={performance.todayPnl >= 0 ? TrendingUp : TrendingDown}
          />
          <MetricItem
            label="Capital"
            value={formatCurrency(config.capital.initialCapital)}
            subValue={`${formatPercent((performance.deployedCapital / config.capital.initialCapital) * 100)} deployed`}
            icon={Zap}
          />
          <MetricItem
            label="Today's Trades"
            value={performance.totalTrades.toString()}
            subValue={`${performance.winRate.toFixed(1)}% win rate`}
            icon={Activity}
          />
          <MetricItem
            label="Next Eval"
            value={`${Math.floor(nextEvalSeconds / 60)}:${(nextEvalSeconds % 60).toString().padStart(2, '0')}`}
            subValue="seconds"
            icon={Clock}
          />
        </div>

        <div className="pt-3 border-t border-border-primary/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Last action:</span>
              <span className="font-mono text-text-primary">{truncateString(lastAction, 40)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Strategy:</span>
              <Badge variant="info">{bot.strategy}</Badge>
            </div>
          </div>
        </div>

        {isActive && (
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
      </Panel>
    </motion.div>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function MetricItem({ label, value, change, changePositive, subValue, icon: Icon }: MetricItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Icon className="w-3 h-3" />
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-mono font-medium text-text-primary">{value}</div>
      {change && (
        <span className={cn('text-xs font-mono', changePositive ? 'text-status-success' : 'text-status-danger')}>
          {change}
        </span>
      )}
      {subValue && <span className="text-xs text-text-secondary">{subValue}</span>}
    </div>
  );
}

function getPnlClass(pnl: number) {
  if (pnl > 0) return 'text-status-success';
  if (pnl < 0) return 'text-status-danger';
  return 'text-text-muted';
}