process.env.NODE_ENV = 'test';

import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import chaiSchema from 'chai-json-schema';
chai.use(chaiSchema);
import initPromise, {generateApointment} from './init.js';

const server = 'http://api:8080';
const agent = chai.request.agent(server);

const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1, 0, 0, 0, 0);
const tomorrow = tomorrowDate.toISOString().split('T')[0];
const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1, 0, 0, 0, 0);
const yesterday = yesterdayDate.toISOString().split('T')[0];

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
          numQueues: 1,
          appointmentDuration: 300,
          externalRef: null,
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
          ...generateApointment(),
          email: 'root@localhost',
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(201, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(subsetSchema(['uuid']));

      appointmentUuid = res.body.uuid;
    });

    it('should set appointments arrivedAt', async function() {
      const res = await agent
        .patch('/admin/appointments/'+appointmentUuid)
        .send({
          arrivedAt: new Date().toISOString(),
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(appointmentSchema);
      expect(res.body.arrivedAt).to.not.eq(null);
      expect(res.body.slot).to.eq(1);
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

    it('should set appointment test needsCertificate', async function() {
      const res = await agent
        .patch('/admin/appointments/'+appointmentUuid)
        .send({
          needsCertificate: 'true',
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body).to.be.jsonSchema(appointmentSchema);
      expect(res.body.needsCertificate).to.eq('true');
    });

    it('should create collision-free slots', async function() {
      for (const [i, m] of Object.entries([10, 15, 15, 20])) {
        const res = await agent
          .post('/admin/appointments')
          .send({
            time: new Date(tomorrow + `T00:${m}:00Z`).toISOString(),
            ...generateApointment(),
          });
        expect(res.status).to.eq(201, JSON.stringify(res.body));

        const res2 = await agent
          .patch('/admin/appointments/'+res.body.uuid)
          .send({
            arrivedAt: new Date().toISOString(),
          });

        // slot reuse is implied because there should be a previous appointment that finished between tests
        expect(res2.body.slot).to.eq(parseInt(i)+1, JSON.stringify(res2.body));
      }
    });

    it('should hide old appointments', async function() {
      const res = await agent
        .post('/admin/appointments')
        .send({
          time: new Date(tomorrow + `T00:00:00Z`).toISOString(),
          ...generateApointment(),
        });
      expect(res.status).to.eq(201, JSON.stringify(res.body));

      await agent
        .patch('/admin/appointments/'+res.body.uuid)
        .send({
          arrivedAt: yesterdayDate.toISOString(),
          testStartedAt: yesterdayDate.toISOString(),
        });

      const res3 = await agent
        .get('/appointments/'+res.body.uuid)
        .send();

      expect(res3.status).to.eq(404, JSON.stringify(res3.body));
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

    it('find users from userlist', async function() {
      const res = await agent
        .get('/admin/userlist?q=mia');
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body.nameFamily).to.equal('Muster');
    });

    it('find empty users for random input', async function() {
      const res = await agent
        .get('/admin/userlist?q=mus');
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body.nameFamily).to.equal('');
    });

    it('should list groups', async function() {
      const res = await agent
        .get('/admin/userlist/groups');
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body.length).to.eq(1);
      expect(res.body[0]).to.eq('Musters');
    });

    it('should test groups', async function() {
      const res = await agent
        .post('/admin/userlist/testgroup')
        .send({
          name: 'Musters',
          time: new Date(tomorrow),
        });
      if (debug) console.log(res.status, res.body);

      expect(res.status).to.eq(200, JSON.stringify(res.body));
      expect(res.body.length).to.eq(2);
      expect(res.body[0].length).to.eq(36);
    });
  });
});
