// api/history.js  —  Vercel Serverless Function
// Handles POST / DELETE for heart_history table in Neon

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ── POST  /api/history  — upsert a history entry ──
    if (req.method === 'POST') {
      const { id, client_id, date, amount, note } = req.body;
      if (!id || !client_id || !date || !amount) {
        return res.status(400).json({ error: 'id, client_id, date, amount are required' });
      }
      await sql`
        INSERT INTO heart_history (id, client_id, date, amount, note)
        VALUES (${id}, ${client_id}, ${date}, ${amount}, ${note || ''})
        ON CONFLICT (id) DO UPDATE SET
          date      = EXCLUDED.date,
          amount    = EXCLUDED.amount,
          note      = EXCLUDED.note
      `;
      return res.status(200).json({ ok: true });
    }

    // ── DELETE  /api/history?id=xxx  — delete one history entry ──
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });
      await sql`DELETE FROM heart_history WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[api/history]', err);
    return res.status(500).json({ error: err.message });
  }
}
