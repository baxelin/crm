const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { db, findById, insert, update } = require('../db');
const { UPLOADS_DIR } = require('../config');
const { todayISO, daysFromToday, mergeFields, paymentStatus, notFound, badRequest } = require('../utils');

const router = express.Router();

const FIELDS = ['service_id', 'type', 'amount', 'due_date', 'paid_date', 'notes'];
const NOT_FOUND = 'Pagamento não encontrado';
const MAX_PROOF_SIZE = 10 * 1024 * 1024;

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  limits: { fileSize: MAX_PROOF_SIZE },
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
      cb(null, `${Date.now()}-${safeName}${ext}`);
    },
  }),
});

function refreshOverdueStatuses() {
  db.prepare(`
    UPDATE payments
    SET status = CASE WHEN due_date < @today THEN 'atrasado' ELSE 'pendente' END,
        updated_at = datetime('now')
    WHERE paid_date IS NULL
      AND status != CASE WHEN due_date < @today THEN 'atrasado' ELSE 'pendente' END
  `).run({ today: todayISO() });
}

router.get('/payments', (req, res) => {
  refreshOverdueStatuses();
  const payments = db.prepare(`
    SELECT p.*, c.name AS contact_name, s.type AS service_type
    FROM payments p
    JOIN contacts c ON c.id = p.contact_id
    LEFT JOIN services s ON s.id = p.service_id
    ORDER BY COALESCE(p.paid_date, p.due_date) DESC, p.id DESC
  `).all();
  res.json(payments);
});

router.get('/payments/upcoming', (req, res) => {
  refreshOverdueStatuses();
  const days = Number.parseInt(req.query.days, 10) || 7;
  const payments = db.prepare(`
    SELECT p.*, c.name AS contact_name
    FROM payments p
    JOIN contacts c ON c.id = p.contact_id
    WHERE p.status = 'atrasado' OR (p.status = 'pendente' AND p.due_date <= ?)
    ORDER BY p.due_date
  `).all(daysFromToday(days));
  res.json(payments);
});

router.get('/contacts/:contactId/payments', (req, res) => {
  refreshOverdueStatuses();
  const payments = db
    .prepare('SELECT * FROM payments WHERE contact_id = ? ORDER BY due_date DESC, id DESC')
    .all(req.params.contactId);
  res.json(payments);
});

router.post('/contacts/:contactId/payments', (req, res) => {
  const contact = findById('contacts', req.params.contactId);
  if (!contact) return notFound(res, 'Contato não encontrado');

  const { service_id, type, amount, due_date, paid_date, notes } = req.body;
  if (!type || amount === undefined || amount === '') return badRequest(res, 'Tipo e valor são obrigatórios');

  const payment = insert('payments', {
    contact_id: contact.id,
    service_id: service_id || null,
    type,
    amount,
    due_date: due_date || null,
    paid_date: paid_date || null,
    status: paymentStatus({ paid_date, due_date }),
    notes: notes || null,
  });
  res.status(201).json(payment);
});

router.post('/services/:serviceId/generate-charge', (req, res) => {
  const service = findById('services', req.params.serviceId);
  if (!service) return notFound(res, 'Serviço não encontrado');

  const { amount, due_date, notes } = req.body;
  if (amount === undefined || amount === '') return badRequest(res, 'Valor é obrigatório');

  const dueDate = due_date || todayISO();
  const payment = insert('payments', {
    contact_id: service.contact_id,
    service_id: service.id,
    type: 'mensalidade',
    amount,
    due_date: dueDate,
    status: paymentStatus({ due_date: dueDate }),
    notes: notes || null,
  });
  res.status(201).json(payment);
});

router.put('/payments/:id', (req, res) => {
  const payment = findById('payments', req.params.id);
  if (!payment) return notFound(res, NOT_FOUND);

  const changes = mergeFields(payment, req.body, FIELDS);
  res.json(update('payments', payment.id, { ...changes, status: paymentStatus(changes) }));
});

router.post('/payments/:id/mark-paid', upload.single('proof'), (req, res) => {
  const payment = findById('payments', req.params.id);
  if (!payment) return notFound(res, NOT_FOUND);

  res.json(
    update('payments', payment.id, {
      paid_date: req.body.paid_date || todayISO(),
      status: 'pago',
      proof_file_path: req.file ? `/uploads/${req.file.filename}` : payment.proof_file_path,
    })
  );
});

router.post('/payments/:id/proof', upload.single('proof'), (req, res) => {
  const payment = findById('payments', req.params.id);
  if (!payment) return notFound(res, NOT_FOUND);
  if (!req.file) return badRequest(res, 'Nenhum arquivo enviado');

  res.json(update('payments', payment.id, { proof_file_path: `/uploads/${req.file.filename}` }));
});

router.delete('/payments/:id', (req, res) => {
  if (!findById('payments', req.params.id)) return notFound(res, NOT_FOUND);
  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
