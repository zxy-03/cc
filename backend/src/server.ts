import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import modelsRouter from './routes/models';
import chatRouter from './routes/chat';
import roundtableRouter from './routes/roundtable';
import collaborationRouter from './routes/collaboration';
import orchestrationRouter from './routes/orchestration';
import authRouter from './routes/auth';
import subscriptionRouter from './routes/subscription';
import apiKeysRouter from './routes/apiKeys';
import { loadEncryptedEnv } from './utils/Crypto';
import { authMiddleware, rateLimitMiddleware, tenantIsolationMiddleware } from './middleware/auth';

dotenv.config();
loadEncryptedEnv();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/api-keys', apiKeysRouter);

app.use('/api/models', authMiddleware, rateLimitMiddleware, tenantIsolationMiddleware, modelsRouter);
app.use('/api/chat', authMiddleware, rateLimitMiddleware, tenantIsolationMiddleware, chatRouter);
app.use('/api/roundtable', authMiddleware, rateLimitMiddleware, tenantIsolationMiddleware, roundtableRouter);
app.use('/api/collaboration', authMiddleware, rateLimitMiddleware, tenantIsolationMiddleware, collaborationRouter);
app.use('/api/orchestration', authMiddleware, rateLimitMiddleware, tenantIsolationMiddleware, orchestrationRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
