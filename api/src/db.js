import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'db',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: 'Z',
});
export default db;
export const initPromise = (async ()=>{
  await db.query(`
    ALTER TABLE \`coronatests\`.\`appointments\`
    ADD COLUMN IF NOT EXISTS \`marked\` ENUM('true') NULL DEFAULT NULL AFTER needsCertificate;
  `);
  await db.query(`
    CREATE OR REPLACE
      ALGORITHM = UNDEFINED
      DEFINER = \`coronatests\`@\`%\`
      SQL SECURITY DEFINER
    VIEW \`appointments_valid\` AS
        SELECT
            \`appointments\`.*
        FROM
            \`appointments\`
        WHERE
            \`appointments\`.\`invalidatedAt\` IS NULL
            AND (
              \`appointments\`.\`updatedAt\` > \`appointments\`.\`createdAt\`
              OR \`appointments\`.\`createdAt\` > CURRENT_TIMESTAMP() - INTERVAL '1' HOUR
            );
  `);
})();
