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
    ALTER TABLE \`coronatests\`.\`appointments\`
    ADD COLUMN IF NOT EXISTS \`arrivedAt\` datetime NULL DEFAULT NULL AFTER marked;
  `);
  await db.query(`
    ALTER TABLE \`coronatests\`.\`appointments\`
    ADD COLUMN IF NOT EXISTS \`reportedAt\` datetime NULL DEFAULT NULL AFTER updatedAt;
  `);
  await db.query(`
    ALTER TABLE \`coronatests\`.\`appointments\`
    ADD COLUMN IF NOT EXISTS \`slot\` INT UNSIGNED NULL DEFAULT NULL AFTER arrivedAt;
  `);
  await db.query(`
    ALTER TABLE \`coronatests\`.\`windows\`
    ADD COLUMN IF NOT EXISTS \`externalRef\` varchar(256) NULL DEFAULT NULL AFTER appointmentDuration;
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
              \`appointments\`.\`testStartedAt\` IS NULL
              OR
              \`appointments\`.\`testStartedAt\` > CURRENT_TIMESTAMP() - INTERVAL '24' HOUR
            ) AND (
              \`appointments\`.\`updatedAt\` > \`appointments\`.\`createdAt\`
              OR (
                \`appointments\`.\`createdAt\` > CURRENT_TIMESTAMP() - INTERVAL '1' HOUR
                OR \`appointments\`.\`nameFamily\` IS NOT NULL
              )
            );
  `);
})();

export async function retention() {
  await initPromise;
  return await db.execute(`
    DELETE FROM \`appointments\`
    WHERE time < NOW() - INTERVAL 3 DAY
  `);
}
