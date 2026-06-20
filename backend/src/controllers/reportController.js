const DailyReport = require('../models/DailyReport');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { exportToExcel } = require('../services/exportService');
const { getDateRange } = require('../utils/helpers');
const {
  COUNTRIES,
  PROFILE_NUMERIC_KEYS,
  COMMUNICATION_ITEMS,
  computeReportTotals,
} = require('../config/tracker');

// Headline count shown in lists/cards: total applications across countries.
const applicationsCount = (tasks) => computeReportTotals(tasks).profile.applications || 0;

const submitReport = async (req, res, next) => {
  try {
    const { date, tasks, taskFields, remarks } = req.body;
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const existing = await DailyReport.findOne({ userId: req.user._id, date: reportDate });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Report already submitted for this date' });
    }

    const totalTasksCount = applicationsCount(tasks);

    const report = await DailyReport.create({
      userId: req.user._id,
      date: reportDate,
      tasks,
      taskFields,
      remarks,
      totalTasksCount,
      status: 'Submitted',
    });

    res.status(201).json({ success: true, message: 'Report submitted successfully', data: report });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const { period = 'monthly', page = 1, limit = 20 } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const filter = { userId: req.user._id, date: { $gte: startDate, $lte: endDate } };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      DailyReport.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit))
        .populate('modifiedBy', 'name role'),
      DailyReport.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getTeamReports = async (req, res, next) => {
  try {
    const { period = 'monthly', userId, page = 1, limit = 20 } = req.query;
    const { startDate, endDate } = getDateRange(period);

    let userIds;
    if (req.user.role === 'TEAM_LEAD') {
      const teamMembers = await User.find({ teamLeadId: req.user._id, isActive: true }).select('_id');
      userIds = teamMembers.map((m) => m._id);
    } else {
      userIds = (await User.find({ isActive: true }).select('_id')).map((u) => u._id);
    }

    const filter = {
      userId: userId ? userId : { $in: userIds },
      date: { $gte: startDate, $lte: endDate },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reports, total] = await Promise.all([
      DailyReport.find(filter)
        .populate('userId', 'name employeeId role zoneId')
        .populate('modifiedBy', 'name role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyReport.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getAllReports = async (req, res, next) => {
  try {
    const { period = 'monthly', userId, zoneId, page = 1, limit = 20 } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const userFilter = { isActive: true };
    if (zoneId) userFilter.zoneId = zoneId;

    let userIds;
    if (userId) {
      userIds = [userId];
    } else {
      const users = await User.find(userFilter).select('_id');
      userIds = users.map((u) => u._id);
    }

    const filter = { userId: { $in: userIds }, date: { $gte: startDate, $lte: endDate } };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      DailyReport.find(filter)
        .populate('userId', 'name employeeId role zoneId teamLeadId')
        .populate('modifiedBy', 'name role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyReport.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (req.user.role === 'RM' && report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user.role === 'TEAM_LEAD') {
      const reportUser = await User.findById(report.userId);
      if (!reportUser || reportUser.teamLeadId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const before = report.toObject();
    const { tasks, taskFields, remarks } = req.body;

    report.tasks = tasks ?? report.tasks;
    report.taskFields = taskFields ?? report.taskFields;
    report.remarks = remarks ?? report.remarks;
    report.status = 'Modified';
    report.modifiedBy = req.user._id;

    if (tasks) {
      report.totalTasksCount = applicationsCount(tasks);
    }

    await report.save();

    await AuditLog.create({
      action: 'MODIFY_REPORT',
      entity: 'DailyReport',
      entityId: report._id,
      performedBy: req.user._id,
      before,
      after: report.toObject(),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Report updated successfully', data: report });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    let userFilter = {};
    if (req.user.role === 'RM') {
      userFilter = { _id: req.user._id };
    } else if (req.user.role === 'TEAM_LEAD') {
      const members = await User.find({ teamLeadId: req.user._id, isActive: true }).select('_id');
      userFilter = { _id: { $in: members.map((m) => m._id) } };
    }

    const users = await User.find({ ...userFilter, isActive: true }).select('_id name employeeId');
    const userIds = users.map((u) => u._id);

    const reports = await DailyReport.find({
      userId: { $in: userIds },
      date: { $gte: startDate, $lte: endDate },
    }).select('userId date totalTasksCount status');

    const totalReports = reports.length;
    const totalTasks = reports.reduce((sum, r) => sum + (r.totalTasksCount || 0), 0);
    const submittedCount = reports.filter((r) => r.status === 'Submitted').length;
    const modifiedCount = reports.filter((r) => r.status === 'Modified').length;

    const dailyBreakdown = reports.reduce((acc, r) => {
      const day = r.date.toISOString().split('T')[0];
      if (!acc[day]) acc[day] = { date: day, count: 0, tasks: 0 };
      acc[day].count++;
      acc[day].tasks += r.totalTasksCount || 0;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: { totalReports, totalTasks, submittedCount, modifiedCount, totalUsers: users.length },
        dailyBreakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
        period,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Aggregated KPI rollup over a date range, scoped by role (mirrors the TL Dashboard tab).
const getTrackerSummary = async (req, res, next) => {
  try {
    const { period = 'monthly', userId, zoneId } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Resolve which users are in scope.
    const userFilter = { isActive: true };
    if (req.user.role === 'RM') {
      userFilter._id = req.user._id;
    } else if (req.user.role === 'TEAM_LEAD') {
      const members = await User.find({ teamLeadId: req.user._id, isActive: true }).select('_id');
      userFilter._id = { $in: members.map((m) => m._id) };
    }
    if (zoneId) userFilter.zoneId = zoneId;
    if (userId) userFilter._id = userId;

    const scopedUsers = await User.find(userFilter).select('_id');
    const userIds = scopedUsers.map((u) => u._id);

    const reports = await DailyReport.find({
      userId: { $in: userIds },
      date: { $gte: startDate, $lte: endDate },
    }).select('tasks').lean();

    // Per-country accumulator + flat KPI totals.
    const perCountry = COUNTRIES.reduce((acc, c) => {
      acc[c] = PROFILE_NUMERIC_KEYS.reduce((o, k) => ({ ...o, [k]: 0 }), { country: c });
      return acc;
    }, {});
    const kpiTotals = PROFILE_NUMERIC_KEYS.reduce((o, k) => ({ ...o, [k]: 0 }), {});
    const communication = COMMUNICATION_ITEMS.reduce((o, c) => ({ ...o, [c.key]: 0 }), {});
    const followUp = { committed: 0, completed: 0 };
    const leads = { committed: 0, generated: 0 };

    for (const r of reports) {
      const tasks = r.tasks || {};
      const profile = Array.isArray(tasks.profile) ? tasks.profile : [];
      profile.forEach((row) => {
        if (!perCountry[row.country]) return;
        PROFILE_NUMERIC_KEYS.forEach((k) => {
          const n = parseFloat(row[k]);
          if (Number.isFinite(n)) {
            perCountry[row.country][k] += n;
            kpiTotals[k] += n;
          }
        });
      });
      const totals = computeReportTotals(tasks);
      COMMUNICATION_ITEMS.forEach(({ key }) => { communication[key] += totals.communication[key]; });
      followUp.committed += totals.followUp.committed;
      followUp.completed += totals.followUp.completed;
      leads.committed += totals.leads.committed;
      leads.generated += totals.leads.generated;
    }

    res.json({
      success: true,
      data: {
        perCountry: Object.values(perCountry),
        kpiTotals,
        communication,
        followUp,
        leads,
        reportsCount: reports.length,
        rmCount: userIds.length,
        period,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

const exportReports = async (req, res, next) => {
  try {
    const { period = 'monthly', userId, format = 'xlsx' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (userId) filter.userId = userId;

    if (req.user.role === 'TEAM_LEAD') {
      const members = await User.find({ teamLeadId: req.user._id }).select('_id');
      filter.userId = { $in: members.map((m) => m._id) };
    }

    const reports = await DailyReport.find(filter)
      .populate('userId', 'name employeeId role')
      .populate('modifiedBy', 'name')
      .sort({ date: -1 })
      .lean();

    const buffer = await exportToExcel(reports);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reports_${period}_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const getFormTemplate = async (req, res, next) => {
  try {
    const FormTemplate = require('../models/FormTemplate');
    const template = await FormTemplate.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitReport, getMyReports, getTeamReports, getAllReports, updateReport, getAnalytics, getTrackerSummary, exportReports, getFormTemplate };
