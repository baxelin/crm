const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  DATA_DIR,
  DB_PATH: path.join(DATA_DIR, 'crm.db'),
  UPLOADS_DIR: process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'),
  CLIENT_DIST: path.join(__dirname, '..', 'client', 'dist'),
};
