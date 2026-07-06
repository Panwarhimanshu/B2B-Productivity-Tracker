const mongoose = require('mongoose');

// Targets are stored as YEARLY values.
// Monthly = yearly / 12, Daily = yearly / (workingDaysPerMonth * 12)
const targetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    year:   { type: Number, required: true },
    workingDaysPerMonth: { type: Number, default: 25 },
    // All values are yearly totals set by HOD
    profiles:        { type: Number, default: 0 },
    wt:              { type: Number, default: 0 },
    visaServices:    { type: Number, default: 0 },
    sop:             { type: Number, default: 0 },
    educationLoan:   { type: Number, default: 0 },
    gic:             { type: Number, default: 0 },
    blockAccount:    { type: Number, default: 0 },
    forexRemittance: { type: Number, default: 0 },
    insurance:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

targetSchema.index({ userId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Target', targetSchema);
