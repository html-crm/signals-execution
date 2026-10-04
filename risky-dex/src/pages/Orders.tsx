import { Layout } from '../components/layout/Layout';
import { Panel } from '../components/ui';
import { ListChecks, FileText } from 'lucide-react';

export default function OrdersPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">ORDERS</h1>
            <p className="text-text-secondary mt-1">Order management and history</p>
          </div>
        </div>
        <Panel variant="default" padding="lg">
          <div className="text-center py-12 text-text-secondary">
            <ListChecks className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-lg">Orders Page</p>
            <p className="text-sm mt-2">Order management interface coming soon</p>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}