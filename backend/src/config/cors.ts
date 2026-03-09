import cors from 'cors';
import { env } from './env';

export const corsMiddleware = cors({
  origin: [env.frontendUrl, 'http://localhost:5000'],
  credentials: true,
});
