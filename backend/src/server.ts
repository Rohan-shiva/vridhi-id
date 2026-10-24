import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase } from './config/database';
import routes from './routes';
import { apiRateLimiter } from './middleware/rateLimiter';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: [config.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to general API routes
app.use('/api', apiRateLimiter);

// Mount API routes
app.use('/api/v1', routes);

// Fallback error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[ServerError]", err);
  res.status(err.status || 500).json({
    error: 'SERVER_ERROR',
    message: config.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message
  });
});

export async function startServer() {
  await connectDatabase();
  const server = app.listen(config.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏛️  Vridhi-ID Backend Service running on port ${config.PORT}`);
    console.log(`🌐  Environment: ${config.NODE_ENV}`);
    console.log(`🔗  Model Microservice: ${config.MODEL_SERVICE_URL}`);
    console.log(`=======================================================`);
  });
  return { app, server };
}

if (require.main === module) {
  startServer();
}

export default app;
