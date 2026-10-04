'use client';

import { cn } from '@utils/helpers';
import { Button } from '@components/ui/Button';
import { Badge, StatusIndicator, Panel } from '@components/ui';
import { useAppStore } from '@store/appStore';
import { Sun, Moon, RotateCw, AlertTriangle, Bell, ChevronDown, User, Shield, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { systemStatus, toggleMode, alerts, acknowledgeAlert } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  const handleAlertClick = (alertId: string, actionUrl?: string) => {
    acknowledgeAlert(alertId);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-background-secondary/95 backdrop-blur-sm border-b border-border-primary flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="font-display font-bold text-xl text-text-primary hidden sm:block">
          RISKY-DEX TRADING CONTROL CENTER
        </h1>
        <h1 className="font-display font-bold text-lg text-text-primary sm:hidden">
          RISKY-DEX
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Panel variant="glass" padding="sm" className="flex items-center gap-2">
          <StatusIndicator
            status={systemStatus.connection === 'LIVE' ? 'RUNNING' : 'STOPPED'}
            size="sm"
          />
          <span className="text-xs font-mono font-medium text-text-primary">
            {systemStatus.connection === 'LIVE' ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="w-px h-4 bg-border-secondary mx-2" />
          <span className="text-xs font-mono text-text-secondary">
            {systemStatus.latency}ms
          </span>
        </Panel>

        <Panel variant="glass" padding="sm" className="flex items-center gap-2">
          <Badge variant={systemStatus.mode === 'LIVE' ? 'danger' : 'info'} dot>
            {systemStatus.mode}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="px-2 py-1"
            disabled={systemStatus.mode === 'LIVE'}
          >
            <RotateCw className="w-3 h-3" />
          </Button>
        </Panel>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-status-danger text-xs font-mono flex items-center justify-center text-white">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </Button>

          {showAlerts && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-background-panel border border-border-primary rounded-lg shadow-panel-hover z-50 animate-in">
              <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
                <h4 className="font-medium text-text-primary">Alerts</h4>
                {alerts.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => alerts.forEach((a) => acknowledgeAlert(a.id))}>
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-text-secondary text-sm">
                    No alerts
                  </div>
                ) : (
                  alerts.slice(0, 10).map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => handleAlertClick(alert.id, alert.actionUrl)}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-background-tertiary transition-colors border-b border-border-primary/50 last:border-0',
                        !alert.acknowledged && 'bg-background-tertiary/50'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn(
                          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                          alert.type === 'SUCCESS' && 'bg-status-success',
                          alert.type === 'WARNING' && 'bg-status-warning',
                          alert.type === 'ERROR' && 'bg-status-danger',
                          alert.type === 'INFO' && 'bg-accent-primary'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{alert.message}</p>
                          <p className="text-xs text-text-muted mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pr-2"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-background-primary" />
            </div>
            <span className="text-sm font-medium text-text-primary hidden md:block">Admin</span>
            <ChevronDown className="w-4 h-4 text-text-secondary hidden md:block" />
          </Button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-background-panel border border-border-primary rounded-lg shadow-panel-hover z-50 animate-in">
              <div className="px-4 py-3 border-b border-border-primary">
                <p className="text-sm font-medium text-text-primary">Admin User</p>
                <p className="text-xs text-text-secondary">admin@risky-dex.com</p>
              </div>
              <button className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="border-t border-border-primary" />
              <button className="w-full px-4 py-2 text-left text-sm text-status-danger hover:bg-background-tertiary flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}