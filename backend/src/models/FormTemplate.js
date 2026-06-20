const mongoose = require('mongoose');

const fieldDefinitionSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    fieldType: { type: String, enum: ['text', 'number', 'date', 'dropdown', 'textarea'], required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    order: { type: Number, default: 0 },
    placeholder: { type: String },
  },
  { _id: false }
);

const formTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Default Daily Report' },
    fields: [fieldDefinitionSchema],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FormTemplate', formTemplateSchema);
