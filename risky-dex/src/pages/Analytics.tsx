import { Layout } from '../components/layout/Layout';
import { Panel } from '../components/ui';
import { BarChart2, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">ANALYTICS</h1>
            <p className="text-text-secondary mt-1">Performance analytics and reporting</p>
          </div>
        </div>
        <Panel variant="default" padding="lg">
          <div className="text-center py-12 text-text-secondary">
            <BarChart2 className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-lg">Analytics Page</p>
            <p className="text-sm mt-2">Advanced analytics and reporting coming soon</p>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}