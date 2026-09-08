// One-time migration: seed the EmailConfig singleton (zone recipients + sender account) from
// the old hardcoded backend/src/config/zoneNotifyRecipients.js file and EMAIL_* env vars, so
// switching to the DB-backed Email Configuration page doesn't silently stop notifications for
// zones that were already mapped. Safe to re-run — it only fills in fields that are still empty.
require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('../src/models/Zone');
const EmailConfig = require('../src/models/EmailConfig');

// Captured from the file being replaced (backend/src/config/zoneNotifyRecipients.js).
const OLD_ZONE_NOTIFY_RECIPIENTS = {
  North: ['hardik.kanan7567@gmail.com', 'harsh.vadgamaa@kanan.co', 'ketan.bagale@kanan.co', 'happy.5@kanan.co'],
  South: ['mukess.machhi@kanan.co'],
  West: ['mukess.machhi@kanan.co', 'soham@kananinternational.in'],
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const zones = await Zone.find().select('name');
  const zoneRecipients = zones
    .filter((z) => OLD_ZONE_NOTIFY_RECIPIENTS[z.name])
    .map((z) => ({ zoneId: z._id, emails: OLD_ZONE_NOTIFY_RECIPIENTS[z.name] }));

  const config = await EmailConfig.getSingleton(true);

  if (!config.zoneRecipients.length && zoneRecipients.length) {
    config.zoneRecipients = zoneRecipients;
    console.log('Seeded zoneRecipients for zones:', zoneRecipients.map((r) => r.zoneId.toString()));
  } else {
    console.log('zoneRecipients already set — leaving as-is.');
  }

  if (!config.fromEmail && process.env.EMAIL_USER) {
    config.fromEmail = process.env.EMAIL_USER;
    console.log('Seeded fromEmail from EMAIL_USER env var.');
  }
  if (!config.appPassword && process.env.EMAIL_APP_PASSWORD) {
    config.appPassword = process.env.EMAIL_APP_PASSWORD;
    console.log('Seeded appPassword from EMAIL_APP_PASSWORD env var.');
  }
  if (process.env.EMAIL_FROM_NAME) {
    config.fromName = process.env.EMAIL_FROM_NAME;
  }

  await config.save();
  console.log('EmailConfig singleton is now:', {
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    hasAppPassword: !!config.appPassword,
    enabled: config.enabled,
    notifyAllHods: config.notifyAllHods,
    zoneRecipients: config.zoneRecipients,
  });

  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
