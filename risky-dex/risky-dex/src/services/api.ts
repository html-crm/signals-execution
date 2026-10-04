const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) return null as T;
    return response.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ user: any; accessToken: string; refreshToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(email: string, password: string, name?: string) {
    return this.request<{ user: any; accessToken: string; refreshToken: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  refreshToken(refreshToken: string) {
    return this.request<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  getMe() {
    return this.request<any>('/api/auth/me');
  }

  // Market Data
  getTicker(exchange: string, symbol: string) {
    return this.request<any>(`/api/market/ticker?exchange=${exchange}&symbol=${symbol}`);
  }

  getTickers(exchange: string) {
    return this.request<any[]>(`/api/market/tickers?exchange=${exchange}`);
  }

  getCandles(exchange: string, symbol: string, timeframe: string, limit = 500) {
    return this.request<any[]>(`/api/market/candles?exchange=${exchange}&symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
  }

  getOrderBook(exchange: string, symbol: string, limit = 100) {
    return this.request<any>(`/api/market/orderbook?exchange=${exchange}&symbol=${symbol}&limit=${limit}`);
  }

  getMarketData(exchange: string, symbol: string, timeframe: string) {
    return this.request<any>(`/api/market/market-data?exchange=${exchange}&symbol=${symbol}&timeframe=${timeframe}`);
  }

  // Analysis
  analyzeSignal(data: { exchangeAccountId: string; symbol: string; timeframe: string }) {
    return this.request<any>('/api/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  scanMarket(data: { exchangeAccountId: string; symbols: string; timeframe: string }) {
    return this.request<any[]>('/api/analysis/scanner', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getSignalHistory(params: { exchangeAccountId?: string; symbol?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params.exchangeAccountId) query.set('exchangeAccountId', params.exchangeAccountId);
    if (params.symbol) query.set('symbol', params.symbol);
    if (params.limit) query.set('limit', params.limit.toString());
    return this.request<any[]>(`/api/analysis/signals/history?${query}`);
  }

  // Trading
  placeOrder(data: any) {
    return this.request<any>('/api/trading/order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  cancelOrder(exchangeAccountId: string, orderId: string, symbol: string) {
    return this.request(`/api/trading/order/${orderId}?exchangeAccountId=${exchangeAccountId}&symbol=${symbol}`, {
      method: 'DELETE',
    });
  }

  closePosition(data: { exchangeAccountId: string; positionId: string; percentage?: number }) {
    return this.request<any>('/api/trading/position/close', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  modifyPosition(data: { exchangeAccountId: string; positionId: string; stopLoss?: number; takeProfit?: number }) {
    return this.request(`/api/trading/position/${data.positionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stopLoss: data.stopLoss, takeProfit: data.takeProfit }),
    });
  }

  getPositions(exchangeAccountId: string) {
    return this.request<any[]>(`/api/trading/positions?exchangeAccountId=${exchangeAccountId}`);
  }

  syncPositions(exchangeAccountId: string) {
    return this.request(`/api/trading/positions/sync`, {
      method: 'POST',
      body: JSON.stringify({ exchangeAccountId }),
    });
  }

  getOrders(params: { exchangeAccountId?: string; botId?: string; symbol?: string; status?: string; limit?: number }) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
    return this.request<any[]>(`/api/trading/orders?${query}`);
  }

  getTrades(params: { exchangeAccountId?: string; botId?: string; symbol?: string; tradeMode?: string; limit?: number }) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
    return this.request<any[]>(`/api/trading/trades?${query}`);
  }

  getRiskMetrics(exchangeAccountId: string) {
    return this.request<any>(`/api/trading/risk/metrics?exchangeAccountId=${exchangeAccountId}`);
  }

  // Portfolio
  getPortfolioOverview(exchangeAccountId?: string) {
    const query = exchangeAccountId ? `?exchangeAccountId=${exchangeAccountId}` : '';
    return this.request<any>(`/api/portfolio/overview${query}`);
  }

  getEquityCurve(params: { exchangeAccountId?: string; timeframe?: string }) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
    return this.request<any[]>(`/api/portfolio/equity?${query}`);
  }

  getPerformance(params: { exchangeAccountId?: string; botId?: string }) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
    return this.request<any>(`/api/portfolio/performance?${query}`);
  }

  // Exchanges
  getExchangeAccounts() {
    return this.request<any[]>('/api/exchanges');
  }

  getExchangeAccount(id: string) {
    return this.request<any>(`/api/exchanges/${id}`);
  }

  createExchangeAccount(data: any) {
    return this.request<any>('/api/exchanges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateExchangeAccount(id: string, data: any) {
    return this.request<any>(`/api/exchanges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteExchangeAccount(id: string) {
    return this.request(`/api/exchanges/${id}`, { method: 'DELETE' });
  }

  testExchangeAccount(id: string) {
    return this.request<any>(`/api/exchanges/${id}/test`, { method: 'POST' });
  }

  // Bots
  getBots() {
    return this.request<any[]>('/api/bots');
  }

  getBot(id: string) {
    return this.request<any>(`/api/bots/${id}`);
  }

  createBot(data: any) {
    return this.request<any>('/api/bots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateBot(id: string, data: any) {
    return this.request<any>(`/api/bots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteBot(id: string) {
    return this.request(`/api/bots/${id}`, { method: 'DELETE' });
  }

  startBot(id: string) {
    return this.request(`/api/bots/${id}/start`, { method: 'POST' });
  }

  stopBot(id: string) {
    return this.request(`/api/bots/${id}/stop`, { method: 'POST' });
  }

  pauseBot(id: string) {
    return this.request(`/api/bots/${id}/pause`, { method: 'POST' });
  }

  getBotTemplates() {
    return this.request<any[]>('/api/bots/templates/list');
  }
}

export const api = new ApiClient();

// WebSocket helper
export function createWebSocket(path: string): WebSocket {
  return new WebSocket(`${WS_BASE}${path}`);
}

export function createWS(url: string): WebSocket {
  return new WebSocket(`${WS_BASE}${url}`);
}