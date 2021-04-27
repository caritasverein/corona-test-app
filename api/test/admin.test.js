process.env.NODE_ENV = 'test';

import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import chaiSchema from 'chai-json-schema';
chai.use(chaiSchema);
import initPromise from './init.js';

const server = 'http://api:8080';
const agent = chai.request.agent(server);
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

const debug = false;

import {appointmentSchema, subsetSchema} from '../src/schema.js';


async function login() {
  const callbackLocation = await agent
    .get('/login')
    .redirects(1)
    .then((e)=>e.res.headers.location);

  const callback = new URL(callbackLocation);
  await agent
    .get('/callback'+callback.search+callback.hash);

  const res = await agent.get('/admin/me');
  if (debug) console.log(res.status, res.body);

  expect(res.status).to.eq(200, JSON.stringify(res.body));
}

describe('admin-api', function() {
  before(async function() {
    await initPromise;
  });
  describe('windows', function() {
    it('should log in', login);

    let idWindow;
    it('should create new windows', async function() {
      const res = await agent.post('/admin/windows')
        .send({
          start: new Date(tomorrow + 'T18:00:00Z'),
          end: new Date(tomorrow + 'T19:00:00Z'),
        });
      if (debug) console.log(res.status, res.body);


      expect(res.status).to.eq(201, JSON.stringify(res.body));
      expect(res.body.id).to.be.at.least(0);
      idWindow = res.body.id;
    });

    it('should list created window', async function() {
      const res = await agent.get('/windows');
      if (debug) console.log(res.status, res.body);

      const window = res.body.find((w)=>w.id = idWindow);
      expect(window.id).to.eq(idWindow);
    });

    it('should delete windows', async function() {
      const res = await agent.delete('/admin/windows/'+idWindow);
      if (debug) console.log(res.status, JSON.stringify(res.body));

      expect(res.status).to.eq(204, JSON.stringify(res.body));
    });
  });

  describe('appointments', function() {
    it('should log in', login);

    let appointmentUuid;
    it('should create appointments at any time', async function() {
      const res = await agent
        .post('/admin/appointments')
        .send({
          time: new Date(tomorrow + 'T00:00:00Z').toISOString(),
          nameGiven: 'abc',
          nameFamily: 'cde',
          address: 'efg',
          dateOfBirth: '2001-10-01',
          email: 'toast@teee.a',
          phoneMobile: '01722222',
          phoneLandline: '04442222',
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid']));

      appointmentUuid = res.body.uuid;
    });

    it('should set appointment test testStartedAt', async function() {
      const res = await agent
        .patch('/admin/appointments/'+appointmentUuid)
        .send({
          testStartedAt: new Date().toISOString(),
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(appointmentSchema);
      expect(res.body.testStartedAt).to.not.eq(null);
    });

    it('should set appointment test testResult', async function() {
      const res = await agent
        .patch('/admin/appointments/'+appointmentUuid)
        .send({
          testResult: 'negative',
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(appointmentSchema);
      expect(res.body.testResult).to.eq('negative');
    });

    it('should query appointments', async function() {
      const end = new Date(tomorrow + 'T23:00:00Z');
      const start = new Date();

      const res = await agent
        .get(`/admin/appointments?start=${start.toISOString()}&end=${end.toISOString()}`)
        .send({
          testResult: 'negative',
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      res.body.forEach((a)=>expect(a).to.be.jsonSchema(appointmentSchema));
    });

    it('should generate appointment pdf', async function() {
      const res = await agent
        .get('/appointments/'+appointmentUuid+'/pdf');
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.headers['content-type']).to.contain('application/pdf');
      // expect(res.body).to.contain('negative');
    });
  });
});
