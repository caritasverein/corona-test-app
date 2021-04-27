import db from '../src/db.js';
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];
import { v4 as uuidv4 } from 'uuid';

const randomDate = (start, end) => {
  return new Date(+start + Math.random() * (end - start));
};

const generateApointments = async (numbers) => {
  const namesFamily = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Schulz', 'Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Richter', 'Bauer', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Hofmann', 'Krüger', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'Walter', 'König', 'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert']
  const namesGiven = ['Marie', 'Sofie', 'Sophia', 'Maria', 'Emma', 'Emilia', 'Mia', 'Anna', 'Hannah', 'Johanna', 'Elias', 'Alexander', 'Maximilian', 'Paul', 'Leon', 'Louis', 'Ben', 'Jonas', 'Noah', 'Luca', 'Katharina', 'Christina', 'Jennifer', 'Sarah', 'Julia', 'Stefanie', 'Nadine', 'Anna', 'Kathrin', 'Sabrina', 'Christian', 'Daniel', 'Sebastian', 'Michael', 'Alexander', 'Stefan', 'Dennis', 'Patrick', 'Tobias', 'Philipp'];
  const plz = ['26121 Oldenburg', '26160 Bad Zwischenahn', '26169 Friesoythe', '26180 Rastede', '26188 Edewecht', '26197 Großenkneten', '26203 Wardenburg', '49661 Cloppenburg', '49681 Garrel', '49685 Emstek', '49688 Lastrup', '49692 Cappeln (Oldenburg)', '49696 Molbergen']
  const streets = ['Dachsweg', 'Dahlienstr.', 'Dailer', 'Deepstreek', 'Deterskamp', 'Direktor-Sperl-Weg', 'Dohlenweg', 'Doktorskamp', 'Don-Bosco-Str.', 'Dorfstr.', 'Dr.-Niermann-Str.', 'Dr.Niermann-Str.', 'Drosselweg', 'Dwergter Str.', 'Falkenweg', 'Fasanenweg', 'Feddenbergsweg', 'Feldhüterweg', 'Feldstr.', 'Feuerwehrstr.', 'Fichtenweg', 'Finkenweg', 'Fleerweg', 'Fliederstr.', 'Franz-Mecking-Str.', 'Franz-Sin-Damm', 'Franz-Tobey-Str.', 'Franziskusplatz', 'Franziskusstr.', 'Friesoyther Str.', 'Fuchsweg', 'Föhrenstr.', 'Magnolienweg', 'Maiglöckchenweg', 'Malvenstr.', 'Marienstr.', 'Markaweg', 'Markhauser Kämpen', 'Markhauser Weg', 'Mecklenburgsdamm', 'Meeschenkamp', 'Meeschenstr.', 'Mehrenkamper Str.', 'Meisenweg', 'Menricusstr.', 'Milanweg', 'Mittelthüler Str.', 'Moorstr.', 'Morgenlandstr.', 'Mozartstr.', 'Möllers Kamp', 'Mückenkamp', 'Mühlenbergsiedlung', 'Mühlenstr.', 'Mühlenweg', 'Achterhörner Str.', 'Ahornstr.', 'Ahornweg', 'Akazienweg', 'Alte Gartenstr.', 'Alte Ginsterstr.', 'Alte Hauptstr.', 'Alte Meeschen', 'Alte Moorstr.', 'Alte Mühlenstr.', 'Alte Rosenstr.', 'Alte Tulpenstr.', 'Altenend', 'Altenoyther Ringstr.'];
  const times = new Array(numbers + 1).fill(8 * 60).map((e, i) => e + i * 5);
  const tests = [];

  for (let i = 0; i <= numbers; i++) {
    const time = new Date();
    time.setMinutes(times[i]);
    tests.push({
      uuid: uuidv4(),
      time: time,
      nameFamily: namesFamily[Math.floor(Math.random() * namesFamily.length)],
      nameGiven: namesGiven[Math.floor(Math.random() * namesGiven.length)],
      dateOfBirth: randomDate(new Date('1960-01-01T00:00:00.000Z'), new Date('2003-01-01T00:00:00.000Z')),
      address: streets[Math.floor(Math.random() * streets.length)] + ' ' + Math.floor(Math.random() * 20 + 1) + ', ' + plz[Math.floor(Math.random() * plz.length)],
      phoneLandLine: '044' + Math.floor(Math.random() * 100000000),
      testStartedAt: i <= 4 ? new Date() : null,
      invalidatedAt: i === 6 ? new Date() : null, 
      testResult: i === 0 ? 'positive' : i === 1 ? 'negative' : i === 2 ? 'invalid' : null,
    });
  }

  await db.execute(`
  INSERT INTO appointments
    (uuid, time, nameFamily, nameGiven, dateOfBirth, address, phoneLandLine, testStartedAt, invalidatedAt, testResult)
  VALUES
    ${tests.map((test) => '(' + Object.keys(test).map((t) => '?').join(',') + ')' ).join(',')}
  `, tests.flatMap((test) => Object.values(test)));
};

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


  await generateApointments(10);
})();
