// api/clients.js  —  Vercel Serverless Function
// Handles GET / POST / DELETE for clients table in Neon

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS headers (needed if you ever call from a different domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ── GET  /api/clients  — fetch all clients + their history ──
    if (req.method === 'GET') {
      const clients = await sql`
        SELECT
          c.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id',     h.id,
                'date',   h.date,
                'amount', h.amount,
                'note',   h.note
              ) ORDER BY h.date DESC
            ) FILTER (WHERE h.id IS NOT NULL),
            '[]'
          ) AS history
        FROM clients c
        LEFT JOIN heart_history h ON h.client_id = c.id
        GROUP BY c.id
        ORDER BY c.added_ts DESC
      `;
      return res.status(200).json({ clients });
    }

    // ── POST  /api/clients  — upsert a client ──
    if (req.method === 'POST') {
      const { id, nick, note, deadline, guarantor, code_phrase, ordered, added_ts } = req.body;
      if (!id || !nick) {
        return res.status(400).json({ error: 'id and nick are required' });
      }
      await sql`
        INSERT INTO clients (id, nick, note, deadline, guarantor, code_phrase, ordered, added_ts)
        VALUES (${id}, ${nick}, ${note || ''}, ${deadline || ''}, ${guarantor || 'нет'}, ${code_phrase || ''}, ${ordered || 0}, ${added_ts || 0})
        ON CONFLICT (id) DO UPDATE SET
          nick        = EXCLUDED.nick,
          note        = EXCLUDED.note,
          deadline    = EXCLUDED.deadline,
          guarantor   = EXCLUDED.guarantor,
          code_phrase = EXCLUDED.code_phrase,
          ordered     = EXCLUDED.ordered,
          added_ts    = EXCLUDED.added_ts
      `;
      return res.status(200).json({ ok: true });
    }

    // ── DELETE  /api/clients?id=xxx  — delete client + cascade history ──
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });
      // heart_history rows are removed automatically via ON DELETE CASCADE
      await sql`DELETE FROM clients WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[api/clients]', err);
    return res.status(500).json({ error: err.message });
  }
}
