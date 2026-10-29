function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayISO() {
  return toISODate(new Date());
}

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function emptyToNull(value) {
  return value === undefined || value === '' ? null : value;
}

function pickFields(source, fields) {
  return Object.fromEntries(fields.map((field) => [field, emptyToNull(source[field])]));
}

function mergeFields(existing, changes, fields) {
  return Object.fromEntries(
    fields.map((field) => [field, changes[field] === undefined ? existing[field] : emptyToNull(changes[field])])
  );
}

function buildWhere(filters) {
  const active = filters.filter(([, value]) => value);
  return {
    where: active.length ? `WHERE ${active.map(([clause]) => clause).join(' AND ')}` : '',
    params: active.map(([, value]) => value),
  };
}

function paymentStatus({ paid_date, due_date }) {
  if (paid_date) return 'pago';
  if (due_date && due_date < todayISO()) return 'atrasado';
  return 'pendente';
}

function notFound(res, message) {
  return res.status(404).json({ error: message });
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

module.exports = {
  toISODate,
  todayISO,
  daysFromToday,
  pickFields,
  mergeFields,
  buildWhere,
  paymentStatus,
  notFound,
  badRequest,
};
