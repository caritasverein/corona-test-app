import {PDFDocument} from 'pdf-lib';
import fs from 'fs';

const formPdfBytes = fs.readFileSync(process.env.CERTIFICATE_PATH);

export async function createTestCertificate(appointment) {
  const pdfDoc = await PDFDocument.load(formPdfBytes);

  const form = pdfDoc.getForm();

  const textFields = {
      name: `${appointment.nameFamily}, ${appointment.nameGiven}`,
      addr1: appointment.address.split('\n')[0],
      addr2: appointment.address.split('\n')[1],
      dateOfBirth: appointment.dateOfBirth.toLocaleDateString('de-DE', {timeZone: 'UTC'}),
      testedAt: new Date(appointment.testStartedAt).toLocaleString('de-DE', {timeZone: 'Europe/Berlin'}),
      signature: ``, // `Dieses Dokument wurde maschinell erstellt und ist ohne Unterschrift gültig`,
  };
  const checkboxes = {
    positive: appointment.testResult === 'positive',
    negative: appointment.testResult === 'negative',
    invalid: appointment.testResult === 'invalid',
  };

  Object.entries(textFields).forEach(([key, value])=>{
    const field = form.getTextField(key);
    field.setText(value);
    field.enableReadOnly();
  });

  Object.entries(checkboxes).forEach(([key, value])=>{
    const field = form.getCheckBox(key);
    field[value?'check':'uncheck']();
    field.enableReadOnly();
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
