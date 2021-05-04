export async function sendNotifications(appointment) {
  if (!appointment) return;
  if (appointment.mail) sendMail(appointment);
  if (appointment.phoneMobile) sendSms(appointment);
}
export async function sendMail(appointment) {
  // TODO
}
export async function sendSms(appointment) {
  // TODO
}
