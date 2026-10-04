import { Layout } from '../components/layout/Layout';
import { Panel } from '../components/ui';
import { TrendingUp, BarChart3 } from 'lucide-react';

export default function MarketsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">MARKETS</h1>
            <p className="text-text-secondary mt-1">Real-time market data and analysis</p>
          </div>
        </div>
        <Panel variant="default" padding="lg">
          <div className="text-center py-12 text-text-secondary">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-lg">Markets Page</p>
            <p className="text-sm mt-2">Real-time market visualization coming soon</p>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}