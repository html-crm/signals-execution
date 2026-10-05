import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { setupWebSocket } from './services/websocket';
import { authRoutes } from './routes/auth';
import { marketRoutes } from './routes/market';
import { analysisRoutes } from './routes/analysis';
import { tradingRoutes } from './routes/trading';
import { portfolioRoutes } from './routes/portfolio';
import { exchangeRoutes } from './routes/exchanges';
import { botRoutes } from './routes/bots';
import { notificationRoutes } from './routes/notifications';
import { healthRoutes } from './routes/health';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/trading', authMiddleware, tradingRoutes);
app.use('/api/portfolio', authMiddleware, portfolioRoutes);
app.use('/api/exchanges', authMiddleware, exchangeRoutes);
app.use('/api/bots', authMiddleware, botRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/health', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 RISKY-DEX Backend running on port ${config.port}`);
  console.log(`📊 Environment: ${config.env}`);
  console.log(`🔗 Frontend URL: ${config.cors.origin}`);
});

import { setupWebSocket } from './services/websocket';
setupWebSocket(server);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;