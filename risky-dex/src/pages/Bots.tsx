'use client';

import { Layout } from '../components/layout/Layout';
import { BotCard } from '../components/bots/BotCard';
import { Panel, Badge } from '../components/ui';
import { Button, Input } from '../components/ui';
import { useAppStore } from '../store/appStore';
import { mockBots } from '../utils/mockData';
import { wsService } from '../services/websocket';
import { useEffect, useState } from 'react';
import { formatCurrency, formatPercent, getPnlClass } from '../utils/helpers';
import { Plus, Search, Filter, Bot, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BotsPage() {
  const { bots, setBots, setSelectedBotId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'PAUSED' | 'STOPPED'>('ALL');

  useEffect(() => {
    if (bots.length === 0) {
      setBots(mockBots);
    }
  }, [bots.length, setBots]);

  const filteredBots = bots.filter((bot) => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.pair.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || bot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const runningBots = bots.filter((b) => b.status === 'RUNNING').length;
  const pausedBots = bots.filter((b) => b.status === 'PAUSED').length;
  const stoppedBots = bots.filter((b) => b.status === 'STOPPED').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">BOTS</h1>
            <p className="text-text-secondary mt-1">Manage your autonomous trading bots</p>
          </div>
          <Button variant="primary" onClick={() => window.location.href = '/bots/create'}>
            <Plus className="w-4 h-4 mr-2" />
            Create Bot
          </Button>
        </div>

        <Panel variant="default" padding="md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="bg-background-tertiary border border-border-secondary rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2364748b%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%27')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat pr-10"
              >
                <option value="ALL">All Status</option>
                <option value="RUNNING">Running</option>
                <option value="PAUSED">Paused</option>
                <option value="STOPPED">Stopped</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <Badge variant="running" dot>{runningBots} Running</Badge>
              <Badge variant="paused" dot>{pausedBots} Paused</Badge>
              <Badge variant="stopped" dot>{stoppedBots} Stopped</Badge>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBots.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-text-secondary">
              <Bot className="w-12 h-12 mb-4 text-text-muted" />
              <p className="text-lg">No bots found</p>
              <p className="text-sm mt-1">{searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'Create your first trading bot'}</p>
              {!searchQuery && statusFilter === 'ALL' && (
                <Button variant="primary" className="mt-4" onClick={() => window.location.href = '/bots/create'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bot
                </Button>
              )}
            </div>
          ) : (
            filteredBots.map((bot, index) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <BotCard
                  bot={bot}
                  compact={false}
                  onPause={() => wsService.pauseBot(bot.id)}
                  onStop={() => wsService.stopBot(bot.id)}
                  onDetails={() => {
                    setSelectedBotId(bot.id);
                    window.location.href = `/bots/${bot.id}`;
                  }}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}