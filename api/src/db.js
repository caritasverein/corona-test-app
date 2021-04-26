import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'db',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: 'Z',
});
export default db;
