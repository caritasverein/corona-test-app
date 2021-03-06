process.env.NODE_ENV = 'test';

import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import chaiSchema from 'chai-json-schema';
chai.use(chaiSchema);
import initPromise from './init.js';

const server = 'http://api:8080';
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

const debug = false;

import {windowSchema, appointmentSchemaUser, subsetSchema} from '../src/schema.js';

describe('user-api', function() {
  before(async function() {
    await initPromise;
  });
  let appointmentUuid;
  describe('appointments', function() {
    it('should create new appointments', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:20:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid'], appointmentSchemaUser));

      appointmentUuid = res.body.uuid;
    });

    it('should create second appointment', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:21:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid'], appointmentSchemaUser));
    });

    it('should fail to create third appointment', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:23:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(409, JSON.stringify(res.body));
    });

    it('should PATCH an appointment by uuid', async function() {
      const res = await chai.request(server)
        .patch('/appointments/' + appointmentUuid)
        .send({
          'nameGiven': 'abc',
          'nameFamily': 'cde\'d',
          'address': 'ef-g. 12\n123 aaa (bbb)',
          'dateOfBirth': '2001-10-01',
          'email': 'root@localhost',
          'phoneLandline': '04442222',
          'phoneMobile': null,
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(appointmentSchemaUser);
    });

    it('should fail to PATCH invalid names', async function() {
      const reqbody = {
        'nameGiven': '=abc',
        'nameFamily': 'cde',
        'address': 'efg\naaa',
        'dateOfBirth': '2001-10-01',
        'email': 'root@localhost',
        'phoneLandline': '04442222',
        'phoneMobile': null,
      };
      const res = await chai.request(server)
        .patch('/appointments/' + appointmentUuid)
        .send(reqbody);
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(400, JSON.stringify(res.body) + '\n' + JSON.stringify(reqbody));
    });

    it('should GET an appointment by uuid', async function() {
      const res = await chai.request(server)
        .get('/appointments/' + appointmentUuid);
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(appointmentSchemaUser);
    });

    it('should DELETE an appointment by uuid', async function() {
      const res = await chai.request(server)
        .delete('/appointments/' + appointmentUuid);
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(204, JSON.stringify(res.body));
    });

    it('should free the timeslot', async function() {
      const res = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T11:20:00Z').toISOString()});
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid'], appointmentSchemaUser));
    });
  });

  describe('windows', function() {
    it('should GET all windows', async function() {
      const res = await chai.request(server).get('/windows');
    if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.at.least(2);
      res.body.forEach((e)=>
        expect(e).to.be.jsonSchema(subsetSchema(['id', 'start', 'end'], windowSchema)),
      );
    });

    it('should GET windows of a specific date', async function() {
      const res = await chai.request(server)
        .get('/windows/' + tomorrow);
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      res.body.forEach((e)=>
        expect(e).to.be.jsonSchema(subsetSchema(['id', 'start', 'end', 'times', 'externalRef'], windowSchema)),
      );
    });

    it('should set FULL on timeslots', async function() {
      const appointment = await chai.request(server)
        .post('/appointments')
        .send({time: new Date(tomorrow+'T14:20:00Z').toISOString()});
      if (debug) console.log(appointment.status, appointment.body);

      expect(appointment.status).to.eq(201, JSON.stringify(appointment.body));

      const res = await chai.request(server)
        .get('/windows/' + tomorrow);
      if (debug) console.log(res.status, res.body);

      const afternoon = res.body[1].times;
      const full = afternoon.filter((a)=>a.full);
      expect(full.length).to.equal(1);
    });
  });
});
