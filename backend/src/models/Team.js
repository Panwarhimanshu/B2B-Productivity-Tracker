const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    teamLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
