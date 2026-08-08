import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import studentsRouter from './routes/students';
import classesRouter from './routes/classes';
import incentivesRouter from './routes/incentives';
import paymentsRouter from './routes/payments';
import paymentRulesRouter from './routes/paymentRules';
import settingsRouter from './routes/settings';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';
import incentiveTypesRouter from './routes/incentiveTypes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: false }));

// Frontend origin(s) allowed to call the API. Set CLIENT_URL in server/.env to
// your deployed frontend URL (comma-separated for multiple). When unset, CORS
// stays open for local development and same-origin production serving.
const clientUrls = (process.env.CLIENT_URL ?? '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header (curl, uptime/health checks) — always allow.
      if (!origin) return callback(null, true);
      // No CLIENT_URL configured → allow every origin (dev / same-origin).
      if (clientUrls.length === 0) return callback(null, true);
      // Otherwise only the configured frontend origin(s) get CORS headers.
      callback(null, clientUrls.includes(origin));
    },
  })
);
app.use(express.json());

app.use('/api/students', studentsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/incentives', incentivesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/payment-rules', paymentRulesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/incentive-types', incentiveTypesRouter);

// Health check — used by Render's health checks and external uptime pingers
app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  res.json({
    status: dbState === 1 ? 'ok' : 'degraded',
    db: dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected',
    uptime: process.uptime(),
  });
});

// In production, serve the built frontend (client/dist) from the same Express app.
// Render's free tier allows one web service, so the API and the SPA share an origin.
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));

  // SPA fallback: any GET that isn't an API route serves index.html
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start HTTP immediately and connect to MongoDB in the background, so the health
// endpoint always responds (and reflects DB state) even while Mongo is warming up.
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentor-tracker')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
