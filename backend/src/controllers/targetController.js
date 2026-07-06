const Target = require('../models/Target');
const DailyReport = require('../models/DailyReport');
const User = require('../models/User');
const { computeReportTotals } = require('../config/tracker');

const TARGET_FIELDS = [
  'profiles', 'wt', 'visaServices', 'sop', 'educationLoan',
  'gic', 'blockAccount', 'forexRemittance', 'insurance',
];

const derive = (yearly, wdpm = 25) => {
  const totalDays = wdpm * 12;
  const out = {};
  TARGET_FIELDS.forEach((f) => {
    const y = yearly[f] || 0;
    out[f] = {
      yearly: y,
      monthly: Math.round((y / 12) * 10) / 10,
      daily: Math.round((y / totalDays) * 100) / 100,
    };
  });
  return out;
};

// HOD: create or update yearly targets for a user
const upsertTarget = async (req, res, next) => {
  try {
    const { userId, year, workingDaysPerMonth, ...fields } = req.body;
    if (!userId || !year) {
      return res.status(400).json({ success: false, message: 'userId and year are required' });
    }

    const update = { workingDaysPerMonth: Number(workingDaysPerMonth) || 25 };
    TARGET_FIELDS.forEach((f) => { update[f] = Number(fields[f]) || 0; });

    const target = await Target.findOneAndUpdate(
      { userId, year: Number(year) },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Target saved', data: target });
  } catch (error) {
    next(error);
  }
};

// HOD: table of all RMs with their yearly targets + derived daily/monthly
const getTargetsTable = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const [rms, targets] = await Promise.all([
      User.find({ role: 'RM', isActive: true })
        .select('name employeeId zoneId')
        .populate('zoneId', 'name'),
      Target.find({ year }),
    ]);

    const targetMap = {};
    targets.forEach((t) => { targetMap[t.userId.toString()] = t; });

    const rows = rms.map((rm) => {
      const t = targetMap[rm._id.toString()];
      return {
        user: rm,
        target: t || null,
        derived: t ? derive(t, t.workingDaysPerMonth) : null,
      };
    });

    res.json({ success: true, data: rows, year });
  } catch (error) {
    next(error);
  }
};

// RM: get own target with derived values + actuals for current month
const getTargetWithActuals = async (req, res, next) => {
  try {
    const userId = req.params.userId === 'me' ? req.user._id : req.params.userId;
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;

    const [target, reports] = await Promise.all([
      Target.findOne({ userId, year }),
      DailyReport.find({
        userId,
        date: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0, 23, 59, 59),
        },
      }),
    ]);

    // Actuals from submitted daily reports for the current month
    const actuals = { profiles: 0, wt: 0, visaServices: 0 };
    reports.forEach((r) => {
      const t = computeReportTotals(r.tasks);
      actuals.profiles  += t.profile.achieved || 0;
      actuals.wt        += t.profile.wt       || 0;
      actuals.visaServices += t.profile.visa  || 0;
    });

    res.json({
      success: true,
      data: {
        target:  target  || null,
        derived: target  ? derive(target, target.workingDaysPerMonth) : null,
        actuals,
        month,
        year,
      },
    });
  } catch (error) {
    next(error);
  }
};

// TEAM_LEAD: all RMs in their team with yearly targets + this-month actuals
const getTeamTargets = async (req, res, next) => {
  try {
    const teamLeadId = req.user._id;
    const year  = Number(req.query.year)  || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;

    const rms = await User.find({ role: 'RM', isActive: true, teamLeadId })
      .select('name employeeId zoneId')
      .populate('zoneId', 'name');

    if (!rms.length) return res.json({ success: true, data: [], year, month });

    const rmIds = rms.map((r) => r._id);

    const [targets, reports] = await Promise.all([
      Target.find({ userId: { $in: rmIds }, year }),
      DailyReport.find({
        userId: { $in: rmIds },
        date: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0, 23, 59, 59),
        },
      }),
    ]);

    const targetMap = {};
    targets.forEach((t) => { targetMap[t.userId.toString()] = t; });

    const reportsByUser = {};
    reports.forEach((r) => {
      const uid = r.userId.toString();
      if (!reportsByUser[uid]) reportsByUser[uid] = [];
      reportsByUser[uid].push(r);
    });

    const rows = rms.map((rm) => {
      const t          = targetMap[rm._id.toString()];
      const userReports = reportsByUser[rm._id.toString()] || [];

      const actuals = { profiles: 0, wt: 0, visaServices: 0 };
      userReports.forEach((r) => {
        const tot = computeReportTotals(r.tasks);
        actuals.profiles     += tot.profile?.achieved || 0;
        actuals.wt           += tot.profile?.wt       || 0;
        actuals.visaServices += tot.profile?.visa     || 0;
      });

      return {
        user:    rm,
        target:  t || null,
        derived: t ? derive(t, t.workingDaysPerMonth) : null,
        actuals,
      };
    });

    res.json({ success: true, data: rows, year, month });
  } catch (error) {
    next(error);
  }
};

module.exports = { upsertTarget, getTargetsTable, getTargetWithActuals, getTeamTargets };
