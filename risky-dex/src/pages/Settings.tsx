import { Layout } from '../components/layout/Layout';
import { Panel } from '../components/ui';
import { Settings, Shield, Bell, User, Key } from 'lucide-react';

export default function SettingsPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">SETTINGS</h1>
            <p className="text-text-secondary mt-1">Platform configuration and preferences</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Panel variant="default" padding="lg">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Theme</label>
                <select className="w-full px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary">
                  <option>Dark (Default)</option>
                  <option>System</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Language</label>
                <select className="w-full px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary">
                  <option>English</option>
                </select>
              </div>
            </div>
          </Panel>

          <Panel variant="default" padding="lg">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">Two-Factor Authentication</p>
                  <p className="text-sm text-text-secondary">Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 bg-background-tertiary border border-border-secondary rounded-md text-sm text-text-primary hover:bg-background-panel transition-colors">Enable</button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">API Keys</p>
                  <p className="text-sm text-text-secondary">Manage exchange API connections</p>
                </div>
                <button className="px-4 py-2 bg-background-tertiary border border-border-secondary rounded-md text-sm text-text-primary hover:bg-background-panel transition-colors">Manage</button>
              </div>
            </div>
          </Panel>

          <Panel variant="default" padding="lg">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-text-primary">Trade Execution Alerts</p>
                  <p className="text-sm text-text-secondary">Notify when bots execute trades</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-border-secondary bg-background-tertiary text-accent-primary focus:ring-accent-primary" defaultChecked />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-text-primary">Risk Limit Warnings</p>
                  <p className="text-sm text-text-secondary">Alert when approaching risk limits</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-border-secondary bg-background-tertiary text-accent-primary focus:ring-accent-primary" defaultChecked />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-text-primary">System Status Updates</p>
                  <p className="text-sm text-text-secondary">Connection and maintenance notifications</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-border-secondary bg-background-tertiary text-accent-primary focus:ring-accent-primary" defaultChecked />
              </label>
            </div>
          </Panel>

          <Panel variant="default" padding="lg">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Display Name</label>
                <input type="text" className="w-full px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary" defaultValue="Admin User" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Email</label>
                <input type="email" className="w-full px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary" defaultValue="admin@risky-dex.com" />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}