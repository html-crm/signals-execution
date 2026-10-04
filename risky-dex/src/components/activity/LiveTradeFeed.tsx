'use client';

import { cn } from '../../utils/helpers';
import { Panel, Badge } from '../../components/ui';
import { useAppStore } from '../../store/appStore';
import { formatTimestamp, formatCurrency } from '../../utils/helpers';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BotEvent } from '../../types';
import { useState, useMemo, useRef } from 'react';

const feedFilters = [
  { value: 'ALL', label: 'All', icon: null },
  { value: 'BUYS', label: 'Buys', icon: null },
  { value: 'SELLS', label: 'Sells', icon: null },
  { value: 'SYSTEM', label: 'System', icon: null },
  { value: 'ERRORS', label: 'Errors', icon: null },
] as const;

type FeedFilter = typeof feedFilters[number]['value'];

const eventColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  BUY: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: 'text-status-success' },
  SELL: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', icon: 'text-status-danger' },
  PRICE_UPDATE: { bg: 'bg-accent-primary/10', text: 'text-accent-primary', border: 'border-accent-primary/30', icon: 'text-accent-primary' },
  SIGNAL: { bg: 'bg-accent-secondary/10', text: 'text-accent-secondary', border: 'border-accent-secondary/30', icon: 'text-accent-secondary' },
  RISK_CHECK: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', icon: 'text-status-warning' },
  ERROR: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', icon: 'text-status-danger' },
  BOT_STARTED: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: 'text-status-success' },
  BOT_PAUSED: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30', icon: 'text-status-warning' },
  BOT_STOPPED: { bg: 'bg-text-muted/10', text: 'text-text-muted', border: 'border-text-muted/30', icon: 'text-text-muted' },
  POSITION_OPENED: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: 'text-status-success' },
  POSITION_CLOSED: { bg: 'bg-accent-primary/10', text: 'text-accent-primary', border: 'border-accent-primary/30', icon: 'text-accent-primary' },
  STOP_LOSS_HIT: { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30', icon: 'text-status-danger' },
  TAKE_PROFIT_HIT: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30', icon: 'text-status-success' },
};

export function LiveTradeFeed() {
  const { events, feedFilter, setFeedFilter } = useAppStore();
  const [autoScroll, setAutoScroll] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  const filteredEvents = useMemo(() => {
    if (feedFilter === 'ALL') return events;
    if (feedFilter === 'BUYS') return events.filter((e) => e.type === 'BUY');
    if (feedFilter === 'SELLS') return events.filter((e) => e.type === 'SELL');
    if (feedFilter === 'SYSTEM') return events.filter((e) => ['PRICE_UPDATE', 'SIGNAL', 'RISK_CHECK', 'BOT_STARTED', 'BOT_PAUSED', 'BOT_STOPPED'].includes(e.type));
    if (feedFilter === 'ERRORS') return events.filter((e) => e.type === 'ERROR' || e.severity === 'ERROR');
    return events;
  }, [events, feedFilter]);

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  return (
    <Panel variant="default" padding="none" className="h-[400px] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-lg text-text-primary">LIVE TRADE FEED</h3>
          <Badge variant="running" dot pulsing>LIVE</Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={feedFilter}
            onChange={(e) => setFeedFilter(e.target.value as FeedFilter)}
            className="bg-background-tertiary border border-border-secondary rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2364748b%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat pr-10"
          >
            {feedFilters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <button
            onClick={() => setAutoScroll(true)}
            className={cn('p-1.5 rounded-lg transition-colors', autoScroll ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary')}
            title={autoScroll ? 'Auto-scroll enabled' : 'Click to enable auto-scroll'}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Live trade feed"
      >
        <AnimatePresence mode="popLayout">
          {filteredEvents.slice(0, 100).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                eventColors[event.type]?.bg || 'bg-background-tertiary/50',
                eventColors[event.type]?.border || 'border-border-primary/50'
              )}
            >
              <div className="flex-shrink-0 w-20 text-right text-xs text-text-muted font-mono">
                {formatTimestamp(event.timestamp)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'text-xs font-mono font-medium px-2 py-0.5 rounded',
                    eventColors[event.type]?.text || 'text-text-secondary',
                    eventColors[event.type]?.bg || 'bg-background-tertiary'
                  )}>
                    {event.type}
                  </span>
                  {event.botName && (
                    <span className="text-xs text-text-secondary font-mono">{event.botName}</span>
                  )}
                  {event.severity !== 'INFO' && (
                    <Badge variant={event.severity.toLowerCase() as any} className="text-xs">
                      {event.severity}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-text-primary font-mono tabular-nums">{event.message}</p>
                {event.data && (
                  <div className="mt-1 text-xs text-text-secondary font-mono">
                    {Object.entries(event.data)
                      .filter(([k]) => !['pair', 'amount', 'price', 'value', 'side'].includes(k))
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' | ')}
                  </div>
                )}
              </div>
              {event.pnl !== undefined && (
                <div className="flex-shrink-0 text-right">
                  <span className={cn('font-mono font-medium text-sm', getPnlClass(event.pnl || 0))}>
                    {event.pnl >= 0 ? '+' : ''}{formatCurrency(event.pnl)}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-secondary text-sm">
            No events matching filter
          </div>
        )}

        {!autoScroll && (
          <div className="fixed bottom-4 right-4 z-10 animate-in">
            <button
              onClick={() => {
                setAutoScroll(true);
                feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
              }}
              className="bg-accent-primary text-background-primary px-3 py-1.5 rounded-lg text-xs font-mono shadow-glow-cyan flex items-center gap-1"
            >
              <span>Jump to live</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function getPnlClass(pnl: number) {
  if (pnl > 0) return 'text-status-success';
  if (pnl < 0) return 'text-status-danger';
  return 'text-text-muted';
}