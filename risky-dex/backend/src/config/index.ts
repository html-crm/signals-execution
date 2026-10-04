import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long!!',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  exchanges: {
    binance: {
      apiKey: process.env.BINANCE_API_KEY || '',
      apiSecret: process.env.BINANCE_API_SECRET || '',
      passphrase: '',
      baseUrl: 'https://api.binance.com',
      wsUrl: 'wss://stream.binance.com:9443/ws',
      testnetBaseUrl: 'https://testnet.binance.vision',
      testnetWsUrl: 'wss://testnet.binance.vision/ws',
    },
    bybit: {
      apiKey: process.env.BYBIT_API_KEY || '',
      apiSecret: process.env.BYBIT_API_SECRET || '',
      passphrase: '',
      baseUrl: 'https://api.bybit.com',
      wsUrl: 'wss://stream.bybit.com/v5/public/linear',
      testnetBaseUrl: 'https://api-testnet.bybit.com',
      testnetWsUrl: 'wss://stream-testnet.bybit.com/v5/public/linear',
    },
    okx: {
      apiKey: process.env.OKX_API_KEY || '',
      apiSecret: process.env.OKX_API_SECRET || '',
      passphrase: process.env.OKX_PASSPHRASE || '',
      baseUrl: 'https://www.okx.com',
      wsUrl: 'wss://ws.okx.com:8443/api/v5/market',
      testnetBaseUrl: 'https://www.okx.com',
      testnetWsUrl: 'wss://ws.okx.com:8443/api/v5/market',
    },
    mexc: {
      apiKey: process.env.MEXC_API_KEY || '',
      apiSecret: process.env.MEXC_API_SECRET || '',
      passphrase: '',
      baseUrl: 'https://api.mexc.com',
      wsUrl: 'wss://wbs.mexc.com/ws',
    },
    bitget: {
      apiKey: process.env.BITGET_API_KEY || '',
      apiSecret: process.env.BITGET_API_SECRET || '',
      passphrase: process.env.BITGET_PASSPHRASE || '',
      baseUrl: 'https://api.bitget.com',
      wsUrl: 'wss://ws.bitget.com/mix/v1/stream',
    },
    bingx: {
      apiKey: process.env.BINGX_API_KEY || '',
      apiSecret: process.env.BINGX_API_SECRET || '',
      passphrase: '',
      baseUrl: 'https://open-api.bingx.com',
      wsUrl: 'wss://open-api.bingx.com/market/ws',
    },
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },
  
  redis: {
    url: process.env.REDIS_URL || '',
  },
} as const;

export type Config = typeof config;
