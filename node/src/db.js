const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'db',
  user: 'root',
  password: '',
  database: process.env.MYSQL_DATABASE,
  timezone: 'Z',
});
module.exports.db = db;

/*
SELECT
    timestamp,  -- not sure about that
    name,
    count(b.name)
FROM time a, id
WHERE …
GROUP BY
UNIX_TIMESTAMP(timestamp) DIV 300, name
*/
