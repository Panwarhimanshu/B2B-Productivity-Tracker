const mongoose = require('mongoose');
const EmailConfig = require('../models/EmailConfig');
const EmailLog = require('../models/EmailLog');
const AuditLog = require('../models/AuditLog');
const { sendTestEmail } = require('../services/emailService');

// Returns the config with the app password reduced to a boolean — it's write-only from the API's
// perspective, so the UI can show "already set" without ever receiving the actual secret back.
const getConfig = async (req, res, next) => {
  try {
    const config = await EmailConfig.getSingleton(true);
    await config.populate('zoneRecipients.zoneId', 'name');

    res.json({
      success: true,
      data: {
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        hasAppPassword: !!config.appPassword,
        enabled: config.enabled,
        notifyAllHods: config.notifyAllHods,
        zoneRecipients: config.zoneRecipients.map((zr) => ({
          zoneId: zr.zoneId?._id || zr.zoneId,
          zoneName: zr.zoneId?.name || '',
          emails: zr.emails,
        })),
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const { fromName, fromEmail, appPassword, enabled, notifyAllHods, zoneRecipients } = req.body;
    const config = await EmailConfig.getSingleton(true);
    const before = { ...config.toObject(), appPassword: config.appPassword ? '(hidden)' : '' };

    if (fromName !== undefined) config.fromName = fromName;
    if (fromEmail !== undefined) config.fromEmail = fromEmail;
    if (appPassword) config.appPassword = appPassword; // blank/omitted => keep the existing one
    if (enabled !== undefined) config.enabled = !!enabled;
    if (notifyAllHods !== undefined) config.notifyAllHods = !!notifyAllHods;
    if (Array.isArray(zoneRecipients)) {
      config.zoneRecipients = zoneRecipients
        .filter((zr) => zr.zoneId)
        .map((zr) => ({
          zoneId: zr.zoneId,
          emails: Array.isArray(zr.emails) ? zr.emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean) : [],
        }));
    }
    config.updatedBy = req.user._id;
    await config.save();

    // EmailConfig is a singleton keyed by a fixed string _id, not a real ObjectId — AuditLog's
    // entityId requires one, so generate a fresh one per audit row. There's only ever one
    // EmailConfig, so the `entity: 'EmailConfig'` filter alone is enough to find its history.
    await AuditLog.create({
      action: 'UPDATE_EMAIL_CONFIG',
      entity: 'EmailConfig',
      entityId: new mongoose.Types.ObjectId(),
      performedBy: req.user._id,
      before,
      after: { ...config.toObject(), appPassword: config.appPassword ? '(hidden)' : '' },
      ipAddress: req.ip,
    });

    await config.populate('zoneRecipients.zoneId', 'name');
    res.json({
      success: true,
      message: 'Email configuration updated',
      data: {
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        hasAppPassword: !!config.appPassword,
        enabled: config.enabled,
        notifyAllHods: config.notifyAllHods,
        zoneRecipients: config.zoneRecipients.map((zr) => ({
          zoneId: zr.zoneId?._id || zr.zoneId,
          zoneName: zr.zoneId?.name || '',
          emails: zr.emails,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      EmailLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      EmailLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const sendTest = async (req, res, next) => {
  try {
    await sendTestEmail(req.user.email);
    res.json({ success: true, message: `Test email attempted to ${req.user.email} — check the log below for the result.` });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConfig, updateConfig, getLogs, sendTest };
