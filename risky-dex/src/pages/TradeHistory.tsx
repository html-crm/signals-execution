import { Layout } from '../components/layout/Layout';
import { Panel } from '../components/ui';
import { Button } from '../components/ui/Button';
import { TrendingUp, FileText } from 'lucide-react';

export default function TradeHistoryPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">TRADE HISTORY</h1>
            <p className="text-text-secondary mt-1">Completed trades and performance</p>
          </div>
        </div>
        <Panel variant="default" padding="lg">
          <div className="text-center py-12 text-text-secondary">
            <FileText className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-lg">Trade History</p>
            <p className="text-sm mt-2">Completed trade records coming soon</p>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}