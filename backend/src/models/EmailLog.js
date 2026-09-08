const mongoose = require('mongoose');

// One row per email send attempt — lets a HOD see whether a notification actually went out.
const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: '' },
    type: { type: String, enum: ['REPORT_SUBMITTED', 'TEST'], required: true },
    status: { type: String, enum: ['sent', 'failed', 'skipped'], required: true },
    error: { type: String, default: '' },
    relatedEntity: { type: String, default: null },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ to: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
