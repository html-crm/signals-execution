import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals = 2, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
      currency: 'USD',
      style: 'currency',
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    currency: 'USD',
    style: 'currency',
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatTimestamp(timestamp: string, options: Intl.DateTimeFormatOptions = {}): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options,
  });
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export function getPnlColor(pnl: number): 'success' | 'danger' | 'muted' {
  if (pnl > 0) return 'success';
  if (pnl < 0) return 'danger';
  return 'muted';
}

export function getPnlClass(pnl: number): string {
  if (pnl > 0) return 'text-status-success';
  if (pnl < 0) return 'text-status-danger';
  return 'text-text-muted';
}

export function getSideClass(side: 'BUY' | 'SELL'): string {
  return side === 'BUY' ? 'text-status-success' : 'text-status-danger';
}

export function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    RUNNING: 'badge-running',
    PAUSED: 'badge-paused',
    STOPPED: 'badge-stopped',
    WAITING: 'badge-paused',
    BUYING: 'badge-buying',
    SELLING: 'badge-selling',
    ERROR: 'badge-error',
    RISK_LOCKED: 'badge-risk-locked',
    MANUAL_CONTROL: 'badge-manual',
    OPEN: 'text-status-success',
    CLOSED: 'text-text-muted',
    CLOSING: 'text-status-warning',
    FILLED: 'text-status-success',
    CANCELLED: 'text-text-muted',
    FAILED: 'text-status-danger',
    PENDING: 'text-status-warning',
  };
  return statusMap[status] || '';
}

export function getBotStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    RUNNING: 'text-status-success',
    PAUSED: 'text-status-warning',
    STOPPED: 'text-text-muted',
    WAITING: 'text-status-warning',
    BUYING: 'text-accent-primary',
    SELLING: 'text-status-danger',
    ERROR: 'text-status-danger',
    RISK_LOCKED: 'text-status-warning',
    MANUAL_CONTROL: 'text-accent-secondary',
  };
  return colorMap[status] || 'text-text-muted';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function animateValue(
  start: number,
  end: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: (t: number) => number = t => t * (2 - t)
): () => void {
  const startTime = performance.now();
  let animationId: number;

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = lerp(start, end, easedProgress);
    onUpdate(currentValue);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };

  animationId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(animationId);
}

export function parsePairSymbol(symbol: string): { base: string; quote: string } | null {
  const commonQuotes = ['USDC', 'USDT', 'USD', 'SOL', 'ETH', 'BNB', 'BTC'];
  for (const quote of commonQuotes) {
    if (symbol.endsWith(quote)) {
      const base = symbol.slice(0, -quote.length);
      if (base) return { base, quote };
    }
  }
  const parts = symbol.split('/');
  if (parts.length === 2) return { base: parts[0], quote: parts[1] };
  return null;
}

export function formatPair(base: string, quote: string): string {
  return `${base}/${quote}`;
}

export function calculatePnl(entryPrice: number, currentPrice: number, size: number, side: 'LONG' | 'SHORT'): number {
  if (side === 'LONG') {
    return (currentPrice - entryPrice) * size;
  }
  return (entryPrice - currentPrice) * size;
}

export function calculatePnlPercent(entryPrice: number, currentPrice: number, side: 'LONG' | 'SHORT'): number {
  if (side === 'LONG') {
    return ((currentPrice - entryPrice) / entryPrice) * 100;
  }
  return ((entryPrice - currentPrice) / entryPrice) * 100;
}

export function getRandomColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}