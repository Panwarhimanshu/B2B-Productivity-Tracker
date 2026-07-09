import { useMemo } from 'react';
import {
  PROFILE_COLUMNS,
  STATUS_OPTIONS,
  COMMUNICATION_ITEMS,
  computeTotals,
} from '../../constants/tracker';

const TOTAL_DAYS = 300; // 25 days × 12 months

// Controlled editor / viewer for an RM Daily Tracker payload.
// Props: value (tracker object), onChange(next), readOnly, yearlyTarget ({ profiles, wt } yearly values).
const TrackerForm = ({ value, onChange, readOnly = false, yearlyTarget = null }) => {
  const targets = yearlyTarget ? {
    daily:   { profiles: Math.round((yearlyTarget.profiles || 0) / TOTAL_DAYS), wt: Math.round((yearlyTarget.wt || 0) / TOTAL_DAYS) },
    monthly: { profiles: Math.round((yearlyTarget.profiles || 0) / 12),         wt: Math.round((yearlyTarget.wt || 0) / 12)         },
    yearly:  { profiles: yearlyTarget.profiles || 0,                             wt: yearlyTarget.wt || 0                            },
  } : null;
  const data = value;
  const totals = useMemo(() => computeTotals(data), [data]);

  const emit = (next) => onChange && onChange(next);

  const autoStatus = (committed, achieved) => {
    const c = Number(committed) || 0;
    const a = Number(achieved) || 0;
    if (c === 0) return '';
    if (a >= c) return 'Achieved';
    return 'At Risk';
  };

  const updateProfile = (idx, key, val) => {
    const profile = data.profile.map((row, i) => {
      if (i !== idx) return row;
      const updated = { ...row, [key]: val };
      if (key === 'committed' || key === 'achieved') {
        updated.status = autoStatus(
          key === 'committed' ? val : row.committed,
          key === 'achieved'  ? val : row.achieved,
        );
      }
      return updated;
    });
    emit({ ...data, profile });
  };
  const updateFollowUp = (idx, key, val) => {
    const followUpTasks = data.followUpTasks.map((row, i) => (i === idx ? { ...row, [key]: val } : row));
    emit({ ...data, followUpTasks });
  };
  const updateComm = (key, val) => emit({ ...data, communication: { ...data.communication, [key]: val } });
  const updateExtra = (key, val) => emit({ ...data, extraInitiatives: { ...data.extraInitiatives, [key]: val } });

  const cellInput = (val, onChangeVal, type = 'number') => {
    if (readOnly) return <span className="text-gray-700 dark:text-gray-300">{val || (val === 0 ? '0' : '-')}</span>;
    if (type === 'status') {
      return (
        <select className="input-field py-1 text-xs min-w-[110px]" value={val || ''} onChange={(e) => onChangeVal(e.target.value)}>
          <option value="">—</option>
          {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        type={type === 'number' ? 'number' : 'text'}
        min={type === 'number' ? 0 : undefined}
        className={`input-field py-1 text-xs ${type === 'number' ? 'w-20' : 'min-w-[140px]'}`}
        value={val ?? ''}
        onChange={(e) => onChangeVal(e.target.value)}
      />
    );
  };

  const SectionTitle = ({ children, hint }) => (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{children}</h3>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Application Targets */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Application Targets</p>
        {targets ? (
          <div className="grid grid-cols-3 gap-3">
            {/* Daily */}
            <div className="rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 p-4">
              <p className="text-xs font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-wider mb-3 text-center">Daily</p>
              <div className="flex items-stretch">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Profile</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 leading-none">{targets.daily.profiles}</p>
                </div>
                <div className="w-px bg-primary-200 dark:bg-primary-700 mx-3" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Wire Transfer</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 leading-none">{targets.daily.wt}</p>
                </div>
              </div>
            </div>
            {/* Monthly */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-3 text-center">Monthly</p>
              <div className="flex items-stretch">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Profile</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-none">{targets.monthly.profiles}</p>
                </div>
                <div className="w-px bg-blue-200 dark:bg-blue-700 mx-3" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Wire Transfer</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-none">{targets.monthly.wt}</p>
                </div>
              </div>
            </div>
            {/* Yearly */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">Yearly</p>
              <div className="flex items-stretch">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Profile</p>
                  <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 leading-none">{targets.yearly.profiles}</p>
                </div>
                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-3" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Wire Transfer</p>
                  <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 leading-none">{targets.yearly.wt}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Daily Application Target</p>
            {readOnly ? (
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data.dailyApplicationTarget || '-'}</span>
            ) : (
              <input
                type="number"
                min={0}
                className="input-field w-32"
                value={data.dailyApplicationTarget ?? ''}
                onChange={(e) => emit({ ...data, dailyApplicationTarget: e.target.value })}
                placeholder="Enter target"
              />
            )}
          </div>
        )}
      </div>

      {/* Section 1: Profile grid */}
      <div className="card p-4">
        <SectionTitle hint="Daily commitment vs actual, per country">Section 1 · Profile</SectionTitle>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-2 py-2 sticky left-0 bg-white dark:bg-gray-800 font-medium">Country</th>
                {PROFILE_COLUMNS.map((c) => (
                  <th key={c.key} className="px-2 py-2 font-medium whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.profile.map((row, idx) => (
                <tr key={row.country}>
                  <td className="px-2 py-1.5 sticky left-0 bg-white dark:bg-gray-800 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.country}</td>
                  {PROFILE_COLUMNS.map((c) => (
                    <td key={c.key} className="px-2 py-1.5">
                      {cellInput(row[c.key], (v) => updateProfile(idx, c.key, v), c.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                <td className="px-2 py-2 sticky left-0 bg-white dark:bg-gray-800">Total</td>
                {PROFILE_COLUMNS.map((c) => (
                  <td key={c.key} className="px-2 py-2">{c.type === 'number' ? totals[c.key] ?? 0 : ''}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Communication */}
      <div className="card p-4">
        <SectionTitle>Communication</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {COMMUNICATION_ITEMS.map((c) => (
            <div key={c.key}>
              <label className="label">{c.label}</label>
              {readOnly ? (
                <p className="font-medium text-gray-800 dark:text-gray-200">{data.communication?.[c.key] || '0'}</p>
              ) : (
                <input
                  type="number"
                  min={0}
                  className="input-field"
                  value={data.communication?.[c.key] ?? ''}
                  onChange={(e) => updateComm(c.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Follow-up tasks */}
      <div className="card p-4">
        <SectionTitle hint="Completion status of daily follow-up tasks">Section 2 · Follow-up Tasks</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-2 py-2 font-medium">Task</th>
                <th className="px-2 py-2 font-medium">Committed</th>
                <th className="px-2 py-2 font-medium">Completed</th>
                <th className="px-2 py-2 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.followUpTasks.map((row, idx) => (
                <tr key={row.task}>
                  <td className="px-2 py-1.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.task}</td>
                  <td className="px-2 py-1.5">{cellInput(row.committed, (v) => updateFollowUp(idx, 'committed', v), 'number')}</td>
                  <td className="px-2 py-1.5">{cellInput(row.completed, (v) => updateFollowUp(idx, 'completed', v), 'number')}</td>
                  <td className="px-2 py-1.5">{cellInput(row.remarks, (v) => updateFollowUp(idx, 'remarks', v), 'text')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Extra initiatives */}
      <div className="card p-4">
        <SectionTitle>Section 3 · Extra Initiatives</SectionTitle>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          {[
            { key: 'leadsCommitted', label: 'Leads Committed' },
            { key: 'leadsGenerated', label: 'Leads Generated' },
          ].map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {readOnly ? (
                <p className="font-medium text-gray-800 dark:text-gray-200">{data.extraInitiatives?.[f.key] || '0'}</p>
              ) : (
                <input
                  type="number"
                  min={0}
                  className="input-field"
                  value={data.extraInitiatives?.[f.key] ?? ''}
                  onChange={(e) => updateExtra(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4">
        <SectionTitle hint="Totals auto-calculated from Section 1">Summary</SectionTitle>
        <div className="flex flex-wrap gap-2 mb-4">
          {['applications', 'offer', 'wt', 'visa', 'rejection', 'refund', 'defer', 'commission'].map((k) => {
            const label = PROFILE_COLUMNS.find((c) => c.key === k)?.label || k;
            return (
              <span key={k} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs">
                <span className="text-gray-500 dark:text-gray-400">{label}: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{totals[k] ?? 0}</span>
              </span>
            );
          })}
        </div>
        <label className="label">One-line summary from RM</label>
        {readOnly ? (
          <p className="text-gray-700 dark:text-gray-300">{data.summary || '-'}</p>
        ) : (
          <textarea
            className="input-field resize-none"
            rows={2}
            value={data.summary ?? ''}
            onChange={(e) => emit({ ...data, summary: e.target.value })}
            placeholder="A one-line summary of the day..."
          />
        )}
      </div>
    </div>
  );
};

export default TrackerForm;
