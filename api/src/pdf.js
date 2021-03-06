import {PDFDocument} from 'pdf-lib';
import fs from 'fs';

const formatDate = (d, opts)=>{
  if (isNaN(new Date(d))) return null;
  return new Date(d).toLocaleString('de-DE', {timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', ...opts});
};

// eslint-disable-next-line security/detect-non-literal-fs-filename
const formPdfBytes = fs.readFileSync(process.env.CERTIFICATE_PATH);
export async function createTestCertificate(appointment) {
  const pdfDoc = await PDFDocument.load(formPdfBytes);

  const form = pdfDoc.getForm();

  const textFields = {
    name: `${appointment.nameFamily}, ${appointment.nameGiven}`,
    nameFamily: appointment.nameFamily,
    nameGiven: appointment.nameGiven,
    address: appointment.address.replace('\n', ' '),
    addr1: appointment.address.split('\n')[0],
    addr2: appointment.address.split('\n')[1],
    dateOfBirth: appointment.dateOfBirth.toLocaleDateString('de-DE', {timeZone: 'UTC'}),
    testedAt: new Date(appointment.testStartedAt).toLocaleString('de-DE', {timeZone: 'Europe/Berlin'}),
    signature: ``, // `Dieses Dokument wurde maschinell erstellt und ist ohne Unterschrift gültig`,
    date: formatDate(appointment.testStartedAt),
  };
  const checkboxes = {
    positive: appointment.testResult === 'positive',
    negative: appointment.testResult === 'negative',
  };

  Object.entries(textFields).forEach(([key, value])=>{
    let field;
    try {
      field = form.getTextField(key);
    } catch (e) {
      return;
    }

    field.setText(value);
    field.enableReadOnly();
  });

  Object.entries(checkboxes).forEach(([key, value])=>{
    const field = form.getCheckBox(key);
    field[value?'check':'uncheck']();
    field.enableReadOnly();
  });

  form.flatten();
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
