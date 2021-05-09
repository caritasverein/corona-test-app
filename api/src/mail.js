import nodemailer from 'nodemailer';

const server = process.env.SMTP_CONNECTION;
const transporter = server ? nodemailer.createTransport(server) : null;

export async function mail(to, subject, text, html) {
  if (!transporter) return console.log('No SMTP transport configured');
  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

export default mail;
