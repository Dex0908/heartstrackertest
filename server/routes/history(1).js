import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// ── GET /api/history/:friendId ────────────────────────
// All history entries for a friend (newest first)
router.get('/:friendId', async (req, res) => {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('friend_id', req.params.friendId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── POST /api/history ─────────────────────────────────
// Body: { friendId, amount, note }
// Records a gifting event and updates hearts_gifted on the friend row
router.post('/', async (req, res) => {
  const { friendId, amount, note = '' } = req.body;

  if (!friendId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'friendId and amount > 0 are required' });
  }

  // 1. Fetch current friend
  const { data: friend, error: fetchErr } = await supabase
    .from('friends')
    .select('hearts_gifted')
    .eq('id', friendId)
    .single();

  if (fetchErr) return res.status(404).json({ error: 'Friend not found' });

  const newGifted = (friend.hearts_gifted ?? 0) + Number(amount);

  // 2. Update hearts_gifted
  const { error: updateErr } = await supabase
    .from('friends')
    .update({ hearts_gifted: newGifted })
    .eq('id', friendId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // 3. Insert history entry
  const { data: entry, error: insertErr } = await supabase
    .from('history')
    .insert({ friend_id: friendId, amount: Number(amount), note })
    .select()
    .single();

  if (insertErr) return res.status(500).json({ error: insertErr.message });

  res.status(201).json({ entry, newGifted });
});

// ── DELETE /api/history/:id ───────────────────────────
// Deletes a history entry and rolls back hearts_gifted
router.delete('/:id', async (req, res) => {
  // 1. Fetch entry
  const { data: entry, error: fetchErr } = await supabase
    .from('history')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchErr) return res.status(404).json({ error: 'Entry not found' });

  // 2. Fetch friend
  const { data: friend } = await supabase
    .from('friends')
    .select('hearts_gifted')
    .eq('id', entry.friend_id)
    .single();

  const rollback = Math.max(0, (friend?.hearts_gifted ?? 0) - entry.amount);

  // 3. Rollback gifted count
  await supabase.from('friends').update({ hearts_gifted: rollback }).eq('id', entry.friend_id);

  // 4. Delete entry
  const { error: delErr } = await supabase.from('history').delete().eq('id', req.params.id);
  if (delErr) return res.status(500).json({ error: delErr.message });

  res.json({ ok: true, rollback });
});

export default router;
