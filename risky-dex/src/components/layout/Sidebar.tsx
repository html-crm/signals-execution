'use client';

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@utils/helpers';
import { Panel, StatusIndicator } from '@components/ui';
import { Button } from '@components/ui/Button';
import {
  LayoutDashboard,
  Bot,
  BarChart3,
  ListChecks,
  Wallet,
  BarChart2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Circle,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@store/appStore';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Bots', href: '/bots', icon: Bot },
  { name: 'Markets', href: '/markets', icon: BarChart3 },
  { name: 'Orders', href: '/orders', icon: ListChecks },
  { name: 'Positions', href: '/positions', icon: Wallet },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, systemStatus } = useAppStore();
  const [hovered, setHovered] = useState(false);

  const isActive = (href: string) => location.pathname === href || (href !== '/' && location.pathname.startsWith(href));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-background-secondary border-r border-border-primary transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={cn('flex items-center justify-between h-16 px-4 border-b border-border-primary', sidebarCollapsed && 'justify-center')}>
        {!sidebarCollapsed && (
          <Link to="/" className="flex items-center gap-2" aria-label="RISKY-DEX Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-background-primary" />
            </div>
            <span className="font-display font-bold text-xl text-text-primary">RISKY-DEX</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link to="/" className="flex items-center justify-center" aria-label="RISKY-DEX Home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-background-primary" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn('text-text-secondary hover:text-text-primary', sidebarCollapsed && 'ml-2')}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'relative overflow-hidden',
                active
                  ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                sidebarCollapsed && 'justify-center px-0'
              )}
              title={sidebarCollapsed ? item.name : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-accent-primary')} aria-hidden="true" />
              {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              {active && !sidebarCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn('border-t border-border-primary p-3 space-y-3', sidebarCollapsed && 'items-center')}>
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="flex items-center gap-2">
            <StatusIndicator status={systemStatus.connection === 'LIVE' ? 'RUNNING' : 'STOPPED'} size="sm" />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">System Status</p>
                <p className="text-xs text-text-secondary truncate">
                  {systemStatus.connection === 'LIVE' ? 'OPERATIONAL' : 'DISCONNECTED'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="flex items-center gap-2">
            <Circle className={cn('w-3 h-3', systemStatus.connection === 'LIVE' ? 'text-status-success' : 'text-status-danger')} />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">Live Connection</p>
                <p className="text-xs text-text-secondary truncate">
                  {systemStatus.connection === 'LIVE' ? 'LIVE' : 'OFFLINE'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="flex items-center gap-2">
            <Wifi className={cn('w-4 h-4', systemStatus.apiStatus === 'HEALTHY' ? 'text-status-success' : 'text-status-warning')} />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">Network</p>
                <p className="text-xs text-text-secondary truncate">
                  {systemStatus.apiStatus === 'HEALTHY' ? 'HEALTHY' : 'DEGRADED'}
                </p>
              </div>
            )}
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="pt-2">
            <Button variant="ghost" fullWidth size="sm" className="text-status-danger hover:text-status-danger justify-start">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>

      {sidebarCollapsed && hovered && (
        <div className="absolute left-16 top-0 h-screen w-48 bg-background-secondary border-r border-border-primary shadow-panel-hover z-50 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', active && 'text-accent-primary')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </aside>
  );
}