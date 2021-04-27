import db from '../src/db.js';
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

export default (async function() {
  await db.execute('TRUNCATE TABLE windows');
  await db.execute('TRUNCATE TABLE appointments');

  await db.execute(`
    INSERT INTO windows
      (start, end, numQueues, appointmentDuration)
    VALUES
      (?, ?, 2, 300),
      (?, ?, 1, 300)
  `, [
    tomorrow + ' 09:00:00', tomorrow + ' 12:00:00',
    tomorrow + ' 13:00:00', tomorrow + ' 16:00:00',
  ]);
})();
