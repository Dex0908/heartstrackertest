import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// ── GET /api/orders ──────────────────────────────────
// Returns all orders with their friends
router.get('/', async (req, res) => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      friends (*)
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(orders);
});

// ── GET /api/orders/:id ──────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, friends (*)`)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Order not found' });
  res.json(data);
});

// ── POST /api/orders ─────────────────────────────────
// Body: { clientName, codePhrase, deadline, paymentMethod, withGuarantor, notes, friends[] }
router.post('/', async (req, res) => {
  const { clientName, codePhrase, deadline, paymentMethod, withGuarantor, notes, friends = [] } = req.body;

  if (!clientName) return res.status(400).json({ error: 'clientName is required' });

  // Insert order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ client_name: clientName, code_phrase: codePhrase, deadline, payment_method: paymentMethod, with_guarantor: withGuarantor ?? false, notes })
    .select()
    .single();

  if (orderErr) return res.status(500).json({ error: orderErr.message });

  // Insert friends
  if (friends.length > 0) {
    const friendRows = friends.map(f => ({
      order_id: order.id,
      nick: f.nick,
      hearts_target: f.heartsTarget ?? 0,
      hearts_gifted: f.heartsGifted ?? 0,
      notes: f.notes ?? '',
    }));

    const { error: friendErr } = await supabase.from('friends').insert(friendRows);
    if (friendErr) return res.status(500).json({ error: friendErr.message });
  }

  // Return full order
  const { data: full } = await supabase
    .from('orders')
    .select(`*, friends (*)`)
    .eq('id', order.id)
    .single();

  res.status(201).json(full);
});

// ── PUT /api/orders/:id ──────────────────────────────
// Full update: replaces friends list
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { clientName, deadline, paymentMethod, withGuarantor, notes, friends = [] } = req.body;

  const { error: orderErr } = await supabase
    .from('orders')
    .update({ client_name: clientName, deadline, payment_method: paymentMethod, with_guarantor: withGuarantor, notes })
    .eq('id', id);

  if (orderErr) return res.status(500).json({ error: orderErr.message });

  // Replace friends
  await supabase.from('friends').delete().eq('order_id', id);

  if (friends.length > 0) {
    const friendRows = friends.map(f => ({
      order_id: id,
      nick: f.nick,
      hearts_target: f.heartsTarget ?? 0,
      hearts_gifted: f.heartsGifted ?? 0,
      notes: f.notes ?? '',
    }));
    const { error: friendErr } = await supabase.from('friends').insert(friendRows);
    if (friendErr) return res.status(500).json({ error: friendErr.message });
  }

  const { data: full } = await supabase
    .from('orders')
    .select(`*, friends (*)`)
    .eq('id', id)
    .single();

  res.json(full);
});

// ── PATCH /api/orders/:orderId/friends/:friendId ─────
// Update gifted hearts for one friend
router.patch('/:orderId/friends/:friendId', async (req, res) => {
  const { friendId } = req.params;
  const { heartsGifted, notes } = req.body;

  const updates = {};
  if (heartsGifted !== undefined) updates.hearts_gifted = heartsGifted;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from('friends')
    .update(updates)
    .eq('id', friendId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── PATCH /api/orders/:id/notes ──────────────────────
// Save order notes (live autosave)
router.patch('/:id/notes', async (req, res) => {
  const { notes } = req.body;
  const { error } = await supabase
    .from('orders')
    .update({ notes })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── DELETE /api/orders/:id ───────────────────────────
router.delete('/:id', async (req, res) => {
  // friends cascade-deleted via FK ON DELETE CASCADE in Supabase
  const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
