import { Layout } from '../components/layout/Layout';
import { Panel, Badge, Button } from '../components/ui';
import { Plus, Bot, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function BotDetailPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">BOT DETAIL</h1>
            <p className="text-text-secondary mt-1">Detailed bot management and monitoring</p>
          </div>
        </div>
        <Panel variant="default" padding="lg">
          <div className="text-center py-12 text-text-secondary">
            <Bot className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-lg">Bot Detail Page</p>
            <p className="text-sm mt-2">Select a bot from the Bots page to view details</p>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}