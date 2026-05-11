import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ordersRouter from './routes/orders.js';
import historyRouter from './routes/history.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/orders', ordersRouter);
app.use('/api/history', historyRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`✦ АКИ Server running on http://localhost:${PORT}`);
});
