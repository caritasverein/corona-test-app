import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_SMS_FROM;
const client = accountSid ? twilio(accountSid, authToken) : null;

export async function sms(to, body) {
  if (!client) return console.log('No SMS transport configured');
  return client.messages
    .create({
       body,
       from,
       to: process.env.TWILIO_OVERWRITE_TO || to,
     });
}

export default sms;
