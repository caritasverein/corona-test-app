const weburl = new URL('http://localhost');
weburl.protocol = process.env.WEB_PROTO;
weburl.hostname = process.env.WEB_DOMAIN;
weburl.port = process.env.WEB_PORT;
weburl.pathname= process.env.WEB_PATH;
if (!weburl.pathname.endsWith('/')) weburl.pathname += '/';

export function apiURL() {
  return new URL('./api', weburl);
}

export function appointmentURL(appointment) {
  return new URL('./'+appointment.uuid, weburl);
}
