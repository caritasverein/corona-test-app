import mail from './mail.js';
import sms from './sms.js';
import {appointmentURL} from './url.js';

function datetime(date) {
    return [
      new Date(date).toLocaleString('de-DE', {timeZone: 'Europe/Berlin', day: 'numeric', month: 'numeric', year: '2-digit'}),
      new Date(date).toLocaleString('de-DE', {timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit'}),
    ];
}

export async function sendNotifications(appointment) {
  if (!appointment) return;
  if (appointment.testResult) {
    return sendResultNotifications(appointment);
  }
  if (appointment.invalidatedAt) {
    return sendCancelationNotifications(appointment);
  }
  return sendAppointmentNotifications(appointment);
}

async function sendMailAndSMS(appointment, subject, message) {
  if (appointment.email) {
    await mail(
      appointment.email,
      subject,
      message,
    );
  }
  if (appointment.phoneMobile) {
    await sms(appointment.phoneMobile, message);
  }
}

export async function sendAppointmentNotifications(appointment) {
  const [date, time] = datetime(appointment.time);
  const message = `Ihr Test-Termin findet am ${date} um ${time} Uhr statt. Mehr unter ${appointmentURL(appointment)}`;
  await sendMailAndSMS(appointment, 'Ihr Termin - '+process.env.LOCATION_NAME, message);
}

export async function sendResultNotifications(appointment) {
  const [date, time] = datetime(appointment.time);
  const resultString = ({'positive': 'positiv', 'negative': 'negativ', 'invalid': 'ungültig'})[appointment.testResult];
  const message = `Ihr Testergebnis ist ${resultString}.\nWeitere Informationen unter ${appointmentURL(appointment).toString()}\n`;
  await sendMailAndSMS(appointment, 'Ihr Testergebnis - '+process.env.LOCATION_NAME, message);
  if (appointment.testResult === 'positive') {
    const message = `Ein Person wurde am ${date} um ${time} Uhr positiv getestet:\n`+
      `Zeitpunkt: ${new Date(appointment.testStartedAt).toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})}\n`+
      `Name: ${appointment.nameFamily}, ${appointment.nameGiven}\n`+
      `Geburtsdatum: ${appointment.dateOfBirth.toLocaleDateString('de-DE')}\n`+
      `Kontakt: ${appointment.phoneLandline || ' - '}, ${appointment.phoneMobile || ' - '}, ${appointment.email || ' - '}\n`;

    await mail(process.env.REPORT_MAIL, 'Positives Testergebnis - '+process.env.LOCATION_NAME, message);
  }
}

export async function sendCancelationNotifications(appointment) {
  const [date, time] = datetime(appointment.time);
  const message = `Ihr Termin am ${date} um ${time} Uhr wurde abgesagt.`;
  await sendMailAndSMS(appointment, 'Terminabsage - '+process.env.LOCATION_NAME, message);
}
