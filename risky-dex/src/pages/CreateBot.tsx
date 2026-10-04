import { Layout } from '../components/layout/Layout';
import { Panel, Button } from '../components/ui';
import { Plus, Settings } from 'lucide-react';

export default function CreateBotPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">CREATE BOT</h1>
            <p className="text-text-secondary mt-1">Configure a new autonomous trading bot</p>
          </div>
        </div>
        <Panel variant="default" padding="lg">
          <div className="text-center py-12 text-text-secondary">
            <Settings className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-lg">Bot Creation Wizard</p>
            <p className="text-sm mt-2">Step-by-step bot configuration coming soon</p>
            <Button variant="primary" className="mt-6" onClick={() => window.location.href = '/bots'}>
              Browse Templates
            </Button>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}