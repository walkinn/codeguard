// Express entry point — boots the codeguard API server.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reviewRouter from './routes/review.js';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'codeguard-ai', time: new Date().toISOString() });
});

app.use('/api/review', reviewRouter);

app.use((err, _req, res, _next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`codeguard server listening on http://localhost:${PORT}`);
});
