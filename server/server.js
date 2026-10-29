const fs = require('fs');
const path = require('path');
const express = require('express');
const { PORT, UPLOADS_DIR, CLIENT_DIST } = require('./config');

const app = express();

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api', require('./routes/interactions'));
app.use('/api', require('./routes/services'));
app.use('/api', require('./routes/payments'));
app.use('/api', require('./routes/tasks'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
