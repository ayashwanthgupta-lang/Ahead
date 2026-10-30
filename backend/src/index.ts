import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import preferencesRoutes from './routes/preferences';
import servicesRoutes from './routes/services';
import appointmentsRoutes from './routes/appointments';
import visitGuidesRoutes from './routes/visitGuides';
import voiceRoutes from './routes/voice';
import adminRoutes from './routes/admin';

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
});
app.use(globalLimiter);

// Stricter limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'AI_RATE_LIMITED', message: 'Too many AI requests. Please wait a moment.' } },
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'AHEAD API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',         authRoutes);
app.use('/api/v1/profile',      profileRoutes);
app.use('/api/v1/preferences',  preferencesRoutes);
app.use('/api/v1/services',     servicesRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/visit-guides', aiLimiter, visitGuidesRoutes);
app.use('/api/v1/voice',        aiLimiter, voiceRoutes);
app.use('/api/v1/admin',        adminRoutes);

// ── 404 & Error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT, 10);
app.listen(PORT, () => {
  console.log(`\n🚀 AHEAD API running on port ${PORT}`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   AI Provider : ${env.AI_PROVIDER}`);
  console.log(`   Health      : http://localhost:${PORT}/health\n`);
});

export default app;

