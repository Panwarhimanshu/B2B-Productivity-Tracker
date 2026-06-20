const mongoose = require('mongoose');

const taskFieldSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    fieldType: { type: String, enum: ['text', 'number', 'date', 'dropdown', 'textarea'], default: 'text' },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const dailyReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    tasks: { type: mongoose.Schema.Types.Mixed, required: true },
    taskFields: [taskFieldSchema],
    status: { type: String, enum: ['Submitted', 'Modified'], default: 'Submitted' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, trim: true },
    totalTasksCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dailyReportSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyReportSchema.index({ date: -1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
