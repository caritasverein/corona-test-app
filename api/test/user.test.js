process.env.NODE_ENV = 'test';

import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import chaiSchema from 'chai-json-schema';
chai.use(chaiSchema);

const server = 'http://api:8080';
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

const debug = false;

import db from '../src/db.js';
import {windowSchema, appointmentSchema, subsetSchema} from '../src/schema.js';

describe('user-api', function() {
  before(async function() {
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
  });

  let appointmentUuid;
  describe('appointments', function() {
    it('should create new appointments', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:20:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201);
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid']));

      appointmentUuid = res.body.uuid;
    });

    it('should create second appointment', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:21:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201);
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid']));
    });

    it('should fail to create third appointment', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:23:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(409);
    });

    it('should PATCH an appointment by uuid', async function() {
      const res = await chai.request(server)
        .patch('/appointments/' + appointmentUuid)
        .send({
          'nameGiven': 'abc',
          'nameFamily': 'cde',
          'address': 'efg',
          'dateOfBirth': '2001-10-01',
          'email': 'toast@teee.a',
          'phoneMobile': '01722222',
          'phoneLandline': '04442222',
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200);
      expect(res.body).to.be.jsonSchema(appointmentSchema);
    });

    it('should GET an appointment by uuid', async function() {
      const res = await chai.request(server)
        .get('/appointments/' + appointmentUuid);
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200);
      expect(res.body).to.be.jsonSchema(appointmentSchema);
    });

    it('should DELETE an appointment by uuid', async function() {
      const res = await chai.request(server)
        .delete('/appointments/' + appointmentUuid);
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(204);
    });

    it('should free the timeslot', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:20:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201);
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid']));
    });
  });

  describe('windows', function() {
    it('should GET all windows', async function() {
      const res = await chai.request(server).get('/windows');
    if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      res.body.forEach((e)=>
        expect(e).to.be.jsonSchema(subsetSchema(['id', 'start', 'end'], windowSchema)),
      );
    });

    it('should GET windows of a specific date', async function() {
      const res = await chai.request(server)
        .get('/windows/' + tomorrow);
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      res.body.forEach((e)=>
        expect(e).to.be.jsonSchema(subsetSchema(['id', 'start', 'end', 'times'], windowSchema)),
      );
    });

    it('should set FULL on timeslots', async function() {
      const appointment = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T14:20:00Z').toISOString()});
      if (debug) console.log(appointment.status, appointment.body);

      expect(appointment.status).to.eq(201);

      const res = await chai.request(server)
        .get('/windows/' + tomorrow);
      if (debug) console.log(res.status, res.body);

      const afternoon = res.body[1].times;
      const full = afternoon.filter((a)=>a.full);
      expect(full.length).to.equal(1);
    });
  });
});
