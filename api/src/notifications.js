import mail from './mail.js';
import sms from './sms.js';
import {appointmentURL} from './url.js';

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
  const message = `Ihr Termin am ${new Date(appointment.time).toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})} wurde erfolgreich für Sie gebucht. Für weitere Informationen besuchen Sie bitte ${appointmentURL(appointment)}`;
  sendMailAndSMS(appointment, 'Ihr Termin - Testzentrum Wassermühle', message);
}

export async function sendResultNotifications(appointment) {
  const resultString = {'positive': 'positiv', 'negative': 'negativ', 'invalid': 'ungültig'};
  const message = `Ihr Testergebnis ist ${resultString}.\nFür weitere Informationen besuchen Sie bitte ${appointmentURL(appointment).toString()}\n`;
  sendMailAndSMS(appointment, 'Ihr Testergebnis - Testzentrum Wassermühle', message);
}

export async function sendCancelationNotifications(appointment) {
  const message = `Ihr Termin am ${new Date(appointment.time).toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})} wurde abgesagt.`;
  sendMailAndSMS(appointment, 'Terminabsage - Testzentrum Wassermühle', message);
}
