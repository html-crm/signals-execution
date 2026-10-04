import { Layout } from '../components/layout/Layout';
import { Panel } from '../components/ui';
import { Users, Plus } from 'lucide-react';

export default function UsersPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">USERS</h1>
            <p className="text-text-secondary mt-1">User management and permissions</p>
          </div>
          <button className="px-4 py-2 bg-accent-primary text-background-primary rounded-md text-sm font-medium hover:bg-accent-tertiary transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        </div>
        <Panel variant="default" padding="lg">
          <div className="text-center py-12 text-text-secondary">
            <Users className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-lg">User Management</p>
            <p className="text-sm mt-2">Team and permissions management coming soon</p>
          </div>
        </Panel>
      </div>
    </Layout>
  );
}