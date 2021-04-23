const mysql = require('mysql2/promise');

const allowedTypes = ['number', 'boolean', 'string'];
function forbiddenValueType(v) {
  if (typeof v === 'number') return false;
  if (typeof v === 'boolean') return false;
  if (typeof v === 'string') return false;
  if (v === null) return false;
  return true;
}

const db = mysql.createPool({
  host: 'db',
  user: 'root',
  password: '',
  database: process.env.MYSQL_DATABASE,
  timezone: 'Z'
});
module.exports.db = db;
