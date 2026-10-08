import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { errorHandler } from './middleware/validation.js';

import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import loanRoutes from './routes/loans.js';
import emiRoutes from './routes/emi.js';
import disbursementRoutes from './routes/disbursements.js';
import ledgerRoutes from './routes/ledger.js';
import dashboardRoutes from './routes/dashboard.js';
import communicationRoutes from './routes/communication.js';
import taskRoutes from './routes/tasks.js';
import areaRoutes from './routes/areas.js';

import { closePool } from './config/db.js';
import settingsRoutes from './routes/settings.js';
import cronRoutes from './routes/cron.js';
import reportsRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import notificationsRoutes from './routes/notifications.js';

config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health'
});
app.use(limiter);

import path from 'path';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/disbursements', disbursementRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found: ' + req.method + ' ' + req.path });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CMF Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closePool();
  process.exit(0);
});

export default app;