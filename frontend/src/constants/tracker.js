// RM Daily Tracker structure (mirrors the Google Sheet). Keep keys in sync with
// backend/src/config/tracker.js.

export const COUNTRIES = ['Canada', 'UK', 'USA', 'Germany', 'Dubai', 'Europe'];

// Section 1 – Profile grid columns (per country).
export const PROFILE_COLUMNS = [
  { key: 'committed', label: 'Committed (Morning)', type: 'number' },
  { key: 'achieved', label: 'Achieved (EOD)', type: 'number' },
  { key: 'wt', label: 'WT', type: 'number' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'dropOff', label: 'Drop-off %', type: 'number' },
  { key: 'reason', label: 'Reason (If Any)', type: 'text' },
  { key: 'applications', label: 'Applications', type: 'number' },
  { key: 'offer', label: 'Offer', type: 'number' },
  { key: 'visa', label: 'Visa', type: 'number' },
  { key: 'rejection', label: 'Rejection', type: 'number' },
  { key: 'refund', label: 'Refund', type: 'number' },
  { key: 'defer', label: 'Defer', type: 'number' },
  { key: 'commission', label: 'Commission', type: 'number' },
];

export const PROFILE_NUMERIC_KEYS = PROFILE_COLUMNS.filter((c) => c.type === 'number').map((c) => c.key);

export const STATUS_OPTIONS = ['Achieved', 'On Track', 'At Risk'];

export const FOLLOW_UP_TASKS = [
  'New Applications Follow-up',
  'Offer Letter Updates',
  'Payment/Wire-Transfer Follow-up',
  'Visa Status Follow-up',
  'Defer & Refund Follow-up',
  'Commission Drive',
  'Event Promotion',
  'Agent Activation Activity',
];

export const COMMUNICATION_ITEMS = [
  { key: 'zoomMeetings',    label: 'Zoom Meetings',      linkKey: 'zoomMeetingLink',  linkLabel: 'Recording / Meeting Link' },
  { key: 'callsMade',       label: 'Calls Made',         linkKey: 'callsSheetLink',   linkLabel: 'Google Sheet Link' },
  { key: 'meetings',        label: 'Meetings',           linkKey: 'meetingMomLink',   linkLabel: 'MOM Link' },
  { key: 'kApplyDiscussion',label: 'K Apply Discussion' },
  { key: 'whatsappQuery',   label: 'WhatsApp Query' },
];

export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// A blank tracker payload, ready to bind to the form.
export const emptyTracker = () => ({
  dailyApplicationTarget: '',
  profile: COUNTRIES.map((country) => {
    const row = { country };
    PROFILE_COLUMNS.forEach((c) => { row[c.key] = ''; });
    return row;
  }),
  followUpTasks: FOLLOW_UP_TASKS.map((task) => ({ task, committed: '', completed: '', remarks: '' })),
  communication: COMMUNICATION_ITEMS.reduce((acc, c) => ({
    ...acc,
    [c.key]: '',
    ...(c.linkKey ? { [c.linkKey]: '' } : {}),
  }), {}),
  extraInitiatives: { leadsCommitted: '', leadsGenerated: '' },
  summary: '',
});

// Merge a stored (possibly partial / legacy) tasks object onto the empty shape so the
// form always has every country row / task / field present.
export const normalizeTracker = (tasks) => {
  const base = emptyTracker();
  if (!tasks || typeof tasks !== 'object') return base;

  base.dailyApplicationTarget = tasks.dailyApplicationTarget ?? '';
  base.summary = tasks.summary ?? '';

  if (Array.isArray(tasks.profile)) {
    base.profile = base.profile.map((row) => {
      const stored = tasks.profile.find((p) => p.country === row.country);
      return stored ? { ...row, ...stored } : row;
    });
  }
  if (Array.isArray(tasks.followUpTasks)) {
    base.followUpTasks = base.followUpTasks.map((row) => {
      const stored = tasks.followUpTasks.find((t) => t.task === row.task);
      return stored ? { ...row, ...stored } : row;
    });
  }
  if (tasks.communication) base.communication = { ...base.communication, ...tasks.communication };
  if (tasks.extraInitiatives) base.extraInitiatives = { ...base.extraInitiatives, ...tasks.extraInitiatives };
  return base;
};

// Flat numeric totals for one tracker payload (used for the auto-calculated summary).
export const computeTotals = (tasks) => {
  const t = tasks || {};
  const profile = Array.isArray(t.profile) ? t.profile : [];
  const profileTotals = {};
  PROFILE_NUMERIC_KEYS.forEach((k) => {
    profileTotals[k] = profile.reduce((s, row) => s + num(row?.[k]), 0);
  });
  return profileTotals;
};
