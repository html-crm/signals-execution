import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '@config/index';
import { errorHandler, notFoundHandler, AppError } from '@middleware/errorHandler';
import authRoutes from './routes/auth';
import marketRoutes from './routes/market';
import analysisRoutes from './routes/analysis';
import tradingRoutes from './routes/trading';
import portfolioRoutes from './routes/portfolio';
import exchangeRoutes from './routes/exchanges';
import botsRoutes from './routes/bots';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/bots', botsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = config.port || 3001;

const server = app.listen(port, () => {
  console.log(`🚀 RISKY-DEX Backend running on port ${port}`);
  console.log(`📊 Environment: ${config.env}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
