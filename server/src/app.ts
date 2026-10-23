import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import { errorHandler } from './middleware/error';
import { config } from './config';

const app = express();

// Enable Gzip/Deflate compression for fast network payload transfer
app.use(compression({
  threshold: 1024,
  level: 6,
}));

// Security Headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiters for Security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // limit each IP to 100 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 mins
  max: 30, // 30 AI assistant requests per 5 mins
  message: {
    success: false,
    message: 'AI assistant rate limit reached. Please wait a few minutes.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EduSathi Backend API',
    version: '1.0.0',
  });
});

// Main API Router
app.use('/api', apiRouter);

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
