const express = require('express');
const { db, findById, insert, update, transaction } = require('../db');
const { todayISO, pickFields, mergeFields, buildWhere, paymentStatus, notFound, badRequest } = require('../utils');

const router = express.Router();

const FIELDS = [
  'name',
  'phone',
  'email',
  'address',
  'website',
  'status',
  'origin',
  'first_contact_date',
  'last_contact_date',
  'notes',
];
const NOT_FOUND = 'Contato não encontrado';
const NAME_REQUIRED = 'Nome é obrigatório';

router.get('/', (req, res) => {
  const { status, q } = req.query;
  const { where, params } = buildWhere([
    ['status = ?', status],
    ['name LIKE ?', q && `%${q}%`],
  ]);
  res.json(db.prepare(`SELECT * FROM contacts ${where} ORDER BY name COLLATE NOCASE`).all(...params));
});

router.get('/:id', (req, res) => {
  const contact = findById('contacts', req.params.id);
  if (!contact) return notFound(res, NOT_FOUND);
  res.json(contact);
});

router.post('/', (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return badRequest(res, NAME_REQUIRED);

  const contact = insert('contacts', {
    ...pickFields(req.body, FIELDS),
    name,
    status: req.body.status || 'lead',
    first_contact_date: req.body.first_contact_date || todayISO(),
  });
  res.status(201).json(contact);
});

router.put('/:id', (req, res) => {
  const contact = findById('contacts', req.params.id);
  if (!contact) return notFound(res, NOT_FOUND);
  if (req.body.name !== undefined && !req.body.name.trim()) return badRequest(res, NAME_REQUIRED);

  res.json(update('contacts', contact.id, mergeFields(contact, req.body, FIELDS)));
});

router.delete('/:id', (req, res) => {
  if (!findById('contacts', req.params.id)) return notFound(res, NOT_FOUND);
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

router.post('/:id/promote', (req, res) => {
  const contact = findById('contacts', req.params.id);
  if (!contact) return notFound(res, NOT_FOUND);

  const { service, payment } = req.body;

  const result = transaction(() => {
    const createdService = service?.type
      ? insert('services', {
          contact_id: contact.id,
          type: service.type,
          description: service.description || null,
          started_at: service.started_at || todayISO(),
        })
      : null;

    const createdPayment = payment?.amount
      ? insert('payments', {
          contact_id: contact.id,
          service_id: createdService?.id ?? null,
          type: payment.type || 'unico',
          amount: payment.amount,
          due_date: payment.due_date || null,
          paid_date: payment.paid_date || null,
          status: paymentStatus(payment),
          notes: payment.notes || null,
        })
      : null;

    const promoted = update('contacts', contact.id, { status: 'cliente' });
    return { contact: promoted, createdService, createdPayment };
  });

  res.json(result);
});

module.exports = router;
