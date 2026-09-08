const mongoose = require('mongoose');

// Singleton document (one row, upserted by fixed _id) holding the outgoing mail account and
// notification recipients — replaces the old hardcoded EMAIL_USER/EMAIL_APP_PASSWORD env vars
// and the zoneNotifyRecipients.js file so a HOD can manage both from the UI.
//
// Note: appPassword is stored in plaintext (not encrypted at rest) — it has to be recoverable
// as-is to authenticate with Gmail's SMTP on every send, and this project has no key-management
// infra to encrypt it safely. `select: false` keeps it out of normal query results and it is
// never returned by the API; restrict DB access accordingly.
const SINGLETON_ID = 'singleton';

const zoneRecipientSchema = new mongoose.Schema(
  {
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
    emails: { type: [String], default: [] },
  },
  { _id: false }
);

const emailConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: SINGLETON_ID },
    fromName: { type: String, trim: true, default: 'B2B Task Tracker' },
    fromEmail: { type: String, trim: true, lowercase: true, default: '' },
    appPassword: { type: String, default: '', select: false },
    enabled: { type: Boolean, default: true },
    notifyAllHods: { type: Boolean, default: true },
    zoneRecipients: { type: [zoneRecipientSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Always the same document — create it with defaults on first read if it doesn't exist yet.
emailConfigSchema.statics.getSingleton = async function (withPassword = false) {
  let doc = await (withPassword ? this.findById(SINGLETON_ID).select('+appPassword') : this.findById(SINGLETON_ID));
  if (!doc) {
    doc = await this.create({ _id: SINGLETON_ID });
    if (withPassword) doc = await this.findById(SINGLETON_ID).select('+appPassword');
  }
  return doc;
};

module.exports = mongoose.model('EmailConfig', emailConfigSchema);
