const express = require('express');
const { randomUUID } = require('node:crypto');
const { db, findById, insert, update, transaction } = require('../db');
const { pickFields, mergeFields, buildWhere, notFound, badRequest } = require('../utils');

const router = express.Router();

const SERIES_FIELDS = ['contact_id', 'period', 'start_time', 'end_time', 'title', 'notes'];
const TASK_FIELDS = [...SERIES_FIELDS, 'date', 'done'];
const RECURRENCE_UNITS = ['diario', 'semanal', 'quinzenal', 'mensal'];
const DAYS_PER_UNIT = { diario: 1, semanal: 7, quinzenal: 14 };
const OCCURRENCES_PER_SERIES = 12;
const NOT_FOUND = 'Tarefa não encontrada';

const SELECT_WITH_CONTACT = `
  SELECT t.*, c.name AS contact_name
  FROM tasks t
  LEFT JOIN contacts c ON c.id = t.contact_id
`;

function occurrenceDate(startDate, unit, interval, index) {
  const [year, month, day] = startDate.split('-').map(Number);
  const steps = interval * index;

  if (unit === 'mensal') {
    const targetMonth = month - 1 + steps;
    const lastDayOfTargetMonth = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, targetMonth, Math.min(day, lastDayOfTargetMonth))).toISOString().slice(0, 10);
  }

  return new Date(Date.UTC(year, month - 1, day + DAYS_PER_UNIT[unit] * steps)).toISOString().slice(0, 10);
}

function resolveScope(task, requestedScope) {
  const isSeriesScope = ['all', 'following'].includes(requestedScope);
  return isSeriesScope && task.recurrence_group_id ? requestedScope : 'this';
}

function seriesFilter(task, scope) {
  if (scope === 'following') {
    return {
      sql: 'recurrence_group_id = @group_id AND date >= @date',
      params: { group_id: task.recurrence_group_id, date: task.date },
    };
  }
  return { sql: 'recurrence_group_id = @group_id', params: { group_id: task.recurrence_group_id } };
}

function updateSeries(task, scope, values) {
  const filter = seriesFilter(task, scope);
  const assignments = Object.keys(values).map((column) => `${column} = @${column}`);
  db.prepare(`
    UPDATE tasks SET ${assignments.join(', ')}, updated_at = datetime('now')
    WHERE ${filter.sql} AND id != @id
  `).run({ ...values, ...filter.params, id: task.id });
}

router.get('/tasks', (req, res) => {
  const { from, to, contact_id } = req.query;
  const { where, params } = buildWhere([
    ['t.date >= ?', from],
    ['t.date <= ?', to],
    ['t.contact_id = ?', contact_id],
  ]);
  res.json(db.prepare(`${SELECT_WITH_CONTACT} ${where} ORDER BY t.date, t.id`).all(...params));
});

router.get('/tasks/:id', (req, res) => {
  const task = db.prepare(`${SELECT_WITH_CONTACT} WHERE t.id = ?`).get(req.params.id);
  if (!task) return notFound(res, NOT_FOUND);
  res.json(task);
});

router.get('/contacts/:contactId/tasks', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE contact_id = ? ORDER BY date DESC, id DESC')
    .all(req.params.contactId);
  res.json(tasks);
});

router.post('/tasks', (req, res) => {
  const { date, title, done, recurrence_unit, recurrence_interval } = req.body;
  if (!date || !title?.trim()) return badRequest(res, 'Data e título são obrigatórios');

  const isRecurring = RECURRENCE_UNITS.includes(recurrence_unit);
  const interval = isRecurring ? Math.max(1, Number.parseInt(recurrence_interval, 10) || 1) : 1;
  const occurrences = isRecurring ? OCCURRENCES_PER_SERIES : 1;
  const base = {
    ...pickFields(req.body, SERIES_FIELDS),
    period: req.body.period || 'dia_inteiro',
    recurrence_group_id: isRecurring ? randomUUID() : null,
    recurrence_unit: isRecurring ? recurrence_unit : null,
    recurrence_interval: interval,
  };

  const firstTask = transaction(() => {
    const created = [];
    for (let index = 0; index < occurrences; index++) {
      created.push(
        insert('tasks', {
          ...base,
          date: isRecurring ? occurrenceDate(date, recurrence_unit, interval, index) : date,
          done: index === 0 && done ? 1 : 0,
        })
      );
    }
    return created[0];
  });

  res.status(201).json(firstTask);
});

router.put('/tasks/:id', (req, res) => {
  const task = findById('tasks', req.params.id);
  if (!task) return notFound(res, NOT_FOUND);
  if (req.body.title !== undefined && !req.body.title.trim()) return badRequest(res, 'Título é obrigatório');

  const changes = mergeFields(task, req.body, TASK_FIELDS);
  changes.done = changes.done ? 1 : 0;
  const scope = resolveScope(task, req.body.scope);

  const updated = transaction(() => {
    if (scope !== 'this') updateSeries(task, scope, pickFields(changes, SERIES_FIELDS));
    return update('tasks', task.id, changes);
  });

  res.json(updated);
});

router.delete('/tasks/:id', (req, res) => {
  const task = findById('tasks', req.params.id);
  if (!task) return notFound(res, NOT_FOUND);

  const scope = resolveScope(task, req.query.scope);
  if (scope === 'this') {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  } else {
    const filter = seriesFilter(task, scope);
    db.prepare(`DELETE FROM tasks WHERE ${filter.sql}`).run(filter.params);
  }

  res.status(204).end();
});

module.exports = router;
