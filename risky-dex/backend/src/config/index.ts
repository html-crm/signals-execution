import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here!!',
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  
  exchanges: {
    binance: {
      apiKey: process.env.BINANCE_API_KEY || '',
      apiSecret: process.env.BINANCE_API_SECRET || '',
      baseUrl: 'https://api.binance.com',
      wsUrl: 'wss://stream.binance.com:9443/ws',
      testnetBaseUrl: 'https://testnet.binance.vision',
      testnetWsUrl: 'wss://testnet.binance.vision/ws',
    },
    bybit: {
      apiKey: process.env.BYBIT_API_KEY || '',
      apiSecret: process.env.BYBIT_API_SECRET || '',
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
    },
    mexc: {
      apiKey: process.env.MEXC_API_KEY || '',
      apiSecret: process.env.MEXC_API_SECRET || '',
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
} as const;

export type Config = typeof config;