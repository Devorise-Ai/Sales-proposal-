import express from 'express';
import { env } from './config/env';
import { corsMiddleware } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import industryRoutes from './routes/industry.routes';
import proposalRoutes from './routes/proposal.routes';
import configRoutes from './routes/config.routes';
import aiRoutes from './routes/ai.routes';
import { pool } from './config/database';

const app = express();

app.use(corsMiddleware);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/industries', industryRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/config', configRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
});
