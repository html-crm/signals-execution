'use client';

import { cn } from '../../utils/helpers';
import { Panel, Badge } from '../../components/ui';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatPercent, formatNumber, getPnlClass, getSideClass } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Minus, DollarSign, Wallet, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Portfolio, BotPortfolio } from '../../types';

const metricCards = [
  { key: 'totalEquity', label: 'TOTAL EQUITY', icon: DollarSign, color: 'text-text-primary' },
  { key: 'availableBalance', label: 'AVAILABLE BALANCE', icon: Wallet, color: 'text-accent-primary' },
  { key: 'deployedCapital', label: 'DEPLOYED CAPITAL', icon: PieChart, color: 'text-status-warning' },
  { key: 'unrealizedPnl', label: 'UNREALIZED P&L', icon: TrendingUp, color: 'text-status-success' },
  { key: 'realizedPnl', label: 'REALIZED P&L', icon: TrendingDown, color: 'text-status-success' },
  { key: 'totalFees', label: 'TOTAL FEES', icon: Minus, color: 'text-status-danger' },
];

export function PortfolioOverview() {
  const { portfolio } = useAppStore();

  if (!portfolio) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {metricCards.map((metric, index) => (
        <motion.div
          key={metric.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Panel variant="default" padding="md" className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn('text-2xl font-bold font-mono tabular-nums', metric.color)}>
                    {formatCurrency(portfolio[metric.key as keyof Portfolio] as number)}
                  </span>
                  {['unrealizedPnl', 'realizedPnl'].includes(metric.key) && (
                    <span className={cn('text-sm font-mono font-medium', getPnlClass(portfolio[metric.key as keyof Portfolio] as number))}>
                      {formatPercent(((portfolio[metric.key as keyof Portfolio] as number) / portfolio.totalEquity) * 100)}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center text-text-muted">
                <metric.icon className="w-6 h-6" />
              </div>
            </div>
            {metric.key === 'totalEquity' && (
              <div className="mt-4 pt-4 border-t border-border-primary/50 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Exposure</span>
                <span className="font-mono font-medium text-text-primary">{formatPercent(portfolio.exposurePercent)}</span>
              </div>
            )}
          </Panel>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Panel variant="default" padding="md" className="xl:col-span-2">
          <h3 className="font-display font-semibold text-lg text-text-primary mb-4">BY BLOCKCHAIN</h3>
          <div className="space-y-3">
            {Object.entries(portfolio.byBlockchain).map(([blockchain, data]) => {
              if (data.totalValue === 0) return null;
              return (
                <div key={blockchain} className="flex items-center justify-between p-3 bg-background-tertiary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-background-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{blockchain}</p>
                      <p className="text-xs text-text-secondary">{formatCurrency(data.deployedCapital)} deployed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-text-primary">{formatCurrency(data.totalValue)}</p>
                    <p className={cn('text-xs font-mono', getPnlClass(data.unrealizedPnl + data.realizedPnl))}>
                      {formatCurrency(data.unrealizedPnl + data.realizedPnl)} ({formatPercent(((data.unrealizedPnl + data.realizedPnl) / data.totalValue) * 100)})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <Panel variant="default" padding="md" className="xl:col-span-2">
          <h3 className="font-display font-semibold text-lg text-text-primary mb-4">TOP BOTS BY P&L</h3>
          <div className="space-y-3">
            {Object.entries(portfolio.byBot)
              .sort(([, a], [, b]) => b.pnl - a.pnl)
              .slice(0, 5)
              .map(([botId, bot]) => (
                <div key={botId} className="flex items-center justify-between p-3 bg-background-tertiary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={bot.pnl >= 0 ? 'success' : 'danger'} dot>
                      {bot.pnl >= 0 ? '▲' : '▼'}
                    </Badge>
                    <div>
                      <p className="font-medium text-text-primary truncate max-w-[150px]">{bot.botName}</p>
                      <p className="text-xs text-text-secondary">{bot.trades} trades • {formatPercent(bot.winRate)} win rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-mono font-medium', getPnlClass(bot.pnl))}>{formatCurrency(bot.pnl)}</p>
                    <p className="text-xs text-text-secondary">{formatPercent(bot.pnlPercent)}</p>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}