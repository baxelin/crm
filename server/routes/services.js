const express = require('express');
const { db, findById, insert, update } = require('../db');
const { todayISO, mergeFields, notFound, badRequest } = require('../utils');

const router = express.Router();

const FIELDS = ['type', 'description', 'status', 'started_at'];
const NOT_FOUND = 'Serviço não encontrado';

router.get('/contacts/:contactId/services', (req, res) => {
  const services = db
    .prepare('SELECT * FROM services WHERE contact_id = ? ORDER BY started_at DESC, id DESC')
    .all(req.params.contactId);
  res.json(services);
});

router.post('/contacts/:contactId/services', (req, res) => {
  const contact = findById('contacts', req.params.contactId);
  if (!contact) return notFound(res, 'Contato não encontrado');

  const { type, description, status, started_at } = req.body;
  if (!type) return badRequest(res, 'Tipo de serviço é obrigatório');

  const service = insert('services', {
    contact_id: contact.id,
    type,
    description: description || null,
    status: status || 'ativo',
    started_at: started_at || todayISO(),
  });
  res.status(201).json(service);
});

router.put('/services/:id', (req, res) => {
  const service = findById('services', req.params.id);
  if (!service) return notFound(res, NOT_FOUND);

  res.json(update('services', service.id, mergeFields(service, req.body, FIELDS)));
});

router.delete('/services/:id', (req, res) => {
  if (!findById('services', req.params.id)) return notFound(res, NOT_FOUND);
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
