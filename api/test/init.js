import db from '../src/db.js';

const todayDate = new Date();
const today = todayDate.toISOString().split('T')[0];

const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

function daysAhead(x) {
  const d = new Date();
  d.setDate(d.getDate() + x);
  return d.toISOString().split('T')[0];
}

import {v4 as uuidv4} from 'uuid';

const randomDate = (start, end) => {
  return new Date(+start + Math.random() * (end - start));
};

//const namesFamily = ['Müller', '💩 Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Schulz', 'Becker', 'Hoffmann', 'Schäfer', '🐮 Koch', 'Richter', 'Bauer', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Hofmann', 'Krüger', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'Walter', 'König', 'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert'];
const namesFamily = ['Probst', 'Haneklau', 'de Buhr', 'Oltmann', 'Emken', 'Westerkamp', 'Burmeista', 'Heyen'];
const namesGiven = ['Marie', 'Sofie', 'Sophia', 'Maria', 'Emma', 'Emilia', 'Mia', 'Anna', 'Hannah', 'Johanna', 'Elias', 'Alexander', 'Maximilian', 'Paul', 'Leon', 'Louis', 'Ben', 'Jonas', 'Noah', 'Luca', 'Katharina', 'Christina', 'Jennifer', 'Sarah', 'Julia', 'Stefanie', 'Nadine', 'Anna', 'Kathrin', 'Sabrina', 'Christian', 'Daniel', 'Sebastian', 'Michael', 'Alexander', 'Stefan', 'Dennis', 'Patrick', 'Tobias', 'Philipp'];
const plz = ['26121 Oldenburg', '26160 Bad Zwischenahn', '26169 Friesoythe', '26180 Rastede', '26188 Edewecht', '26197 Großenkneten', '26203 Wardenburg', '49661 Cloppenburg', '49681 Garrel', '49685 Emstek', '49688 Lastrup', '49692 Cappeln (Oldenburg)', '49696 Molbergen'];
const streets = ['Dachsweg', 'Dahlienstr.', 'Dailer', 'Deepstreek', 'Deterskamp', 'Direktor-Sperl-Weg', 'Dohlenweg', 'Doktorskamp', 'Don-Bosco-Str.', 'Dorfstr.', 'Dr.-Niermann-Str.', 'Dr.Niermann-Str.', 'Drosselweg', 'Dwergter Str.', 'Falkenweg', 'Fasanenweg', 'Feddenbergsweg', 'Feldhüterweg', 'Feldstr.', 'Feuerwehrstr.', 'Fichtenweg', 'Finkenweg', 'Fleerweg', 'Fliederstr.', 'Franz-Mecking-Str.', 'Franz-Sin-Damm', 'Franz-Tobey-Str.', 'Franziskusplatz', 'Franziskusstr.', 'Friesoyther Str.', 'Fuchsweg', 'Föhrenstr.', 'Magnolienweg', 'Maiglöckchenweg', 'Malvenstr.', 'Marienstr.', 'Markaweg', 'Markhauser Kämpen', 'Markhauser Weg', 'Mecklenburgsdamm', 'Meeschenkamp', 'Meeschenstr.', 'Mehrenkamper Str.', 'Meisenweg', 'Menricusstr.', 'Milanweg', 'Mittelthüler Str.', 'Moorstr.', 'Morgenlandstr.', 'Mozartstr.', 'Möllers Kamp', 'Mückenkamp', 'Mühlenbergsiedlung', 'Mühlenstr.', 'Mühlenweg', 'Achterhörner Str.', 'Ahornstr.', 'Ahornweg', 'Akazienweg', 'Alte Gartenstr.', 'Alte Ginsterstr.', 'Alte Hauptstr.', 'Alte Meeschen', 'Alte Moorstr.', 'Alte Mühlenstr.', 'Alte Rosenstr.', 'Alte Tulpenstr.', 'Altenend', 'Altenoyther Ringstr.'];

export const generateApointment = ()=>{
  const ret = {
    nameFamily: namesFamily[Math.floor(Math.random() * namesFamily.length)],
    nameGiven: namesGiven[Math.floor(Math.random() * namesGiven.length)],
    dateOfBirth: randomDate(new Date('1960-01-01T00:00:00.000Z'), new Date('2003-01-01T00:00:00.000Z')),
    address: streets[Math.floor(Math.random() * streets.length)] + ' ' + Math.floor(Math.random() * 20 + 1) + '\n' + plz[Math.floor(Math.random() * plz.length)],
    phoneLandline: '044' + Math.floor(Math.random() * 100000000),
    phoneMobile: null,
    email: null,
  };
  ret.dateOfBirth = ret.dateOfBirth.toISOString().split('T')[0];
  return ret;
};


const generateApointments = async (numbers) => {
  const times = new Array(numbers + 1).fill(6 * 60).map((e, i) => e + i * 5);
  const tests = [];

  for (let i = 0; i <= numbers; i++) {
    const time = new Date();
    time.setHours(0);
    time.setMinutes(times[i]); // eslint-disable-line security/detect-object-injection
    tests.push({
      uuid: uuidv4(),
      time: time,
      ...generateApointment(),
      arrivedAt: null,
      testStartedAt: null,
      invalidatedAt: null,
      testResult: null,
    });
  }

  await db.execute(`
  INSERT INTO appointments
    (uuid, time, nameFamily, nameGiven, dateOfBirth, address, phoneLandLine, phoneMobile, email, arrivedAt, testStartedAt, invalidatedAt, testResult)
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
      (?, ?, 1, 300),
      (?, ?, 2, 300),
      (?, ?, 1, 300),
      (?, ?, 2, 300),
      (?, ?, 2, 300)
  `, [
    today + ' 06:00:00', today + ' 22:00:00',
    tomorrow + ' 09:00:00', tomorrow + ' 12:00:00',
    tomorrow + ' 13:00:00', tomorrow + ' 16:00:00',
    daysAhead(2) + ' 09:00:00', daysAhead(2) + ' 12:00:00',
    daysAhead(6) + ' 09:00:00', daysAhead(6) + ' 12:00:00',
  ]);

  await db.execute(`
    INSERT INTO windows
      (start, end, numQueues, appointmentDuration, externalRef)
    VALUES
      (?, ?, 0, 0, ?)
  `, [
    daysAhead(3) + ' 09:00:00', daysAhead(3) + ' 12:00:00',
    'https://yatcw.com',
  ]);

  await generateApointments(10);
})();
