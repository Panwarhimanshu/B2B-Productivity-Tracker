const nodemailer = require('nodemailer');
const EmailConfig = require('../models/EmailConfig');

// Builds a fresh transporter from whatever's currently configured (DB first, env var fallback
// for a zero-config first deploy). Not cached at module scope — credentials can change from the
// HOD's Email Configuration page, so every send must pick up the latest values. Creating a
// nodemailer transport is cheap (no network call happens until sendMail is actually called).
const getTransporter = async () => {
  const config = await EmailConfig.getSingleton(true).catch(() => null);

  const user = config?.fromEmail || process.env.EMAIL_USER;
  const pass = config?.appPassword || process.env.EMAIL_APP_PASSWORD;
  const enabled = config?.enabled ?? true;

  if (!enabled || !user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

module.exports = { getTransporter };
