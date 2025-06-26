const fs = require('fs');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Memory = require('lowdb/adapters/Memory');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const isTest = process.env.NODE_ENV === 'test';

let adapter;
if (isTest) {
  adapter = new Memory();
} else {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const file = path.join(dataDir, 'storage.json');
  adapter = new FileSync(file);
}

const db = low(adapter);
db.defaults({ ideas: [] }).write();

module.exports = db;