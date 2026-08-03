const nodemailer = require('nodemailer');

// Lazily created so a missing config doesn't crash the server at boot —
// email sending is best-effort and failures must never block a report submission.
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  return transporter;
};

module.exports = { getTransporter };
