const express = require('express');
const { db, findById, insert } = require('../db');
const { todayISO, notFound } = require('../utils');

const router = express.Router();

const NOT_FOUND = 'Interação não encontrada';

function syncLastContactDate(contactId) {
  db.prepare(`
    UPDATE contacts
    SET last_contact_date = (SELECT MAX(date) FROM interactions WHERE contact_id = @id),
        updated_at = datetime('now')
    WHERE id = @id
  `).run({ id: contactId });
}

router.get('/contacts/:contactId/interactions', (req, res) => {
  const interactions = db
    .prepare('SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC, id DESC')
    .all(req.params.contactId);
  res.json(interactions);
});

router.post('/contacts/:contactId/interactions', (req, res) => {
  const contact = findById('contacts', req.params.contactId);
  if (!contact) return notFound(res, 'Contato não encontrado');

  const interaction = insert('interactions', {
    contact_id: contact.id,
    date: req.body.date || todayISO(),
    note: req.body.note || null,
  });
  syncLastContactDate(contact.id);
  res.status(201).json(interaction);
});

router.put('/interactions/:id', (req, res) => {
  const interaction = findById('interactions', req.params.id);
  if (!interaction) return notFound(res, NOT_FOUND);

  db.prepare('UPDATE interactions SET date = ?, note = ? WHERE id = ?').run(
    req.body.date ?? interaction.date,
    req.body.note ?? interaction.note,
    interaction.id
  );
  syncLastContactDate(interaction.contact_id);
  res.json(findById('interactions', interaction.id));
});

router.delete('/interactions/:id', (req, res) => {
  const interaction = findById('interactions', req.params.id);
  if (!interaction) return notFound(res, NOT_FOUND);

  db.prepare('DELETE FROM interactions WHERE id = ?').run(interaction.id);
  syncLastContactDate(interaction.contact_id);
  res.status(204).end();
});

module.exports = router;
