import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Minus } from 'lucide-react';
import { targetsAPI } from '../../api/targets';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TARGET_FIELDS = [
  { key: 'profiles',        label: 'Profiles',         tracked: true },
  { key: 'wt',              label: 'WT',               tracked: true },
  { key: 'visaServices',    label: 'Visa',             tracked: true },
  { key: 'sop',             label: 'SOP',              tracked: false },
  { key: 'educationLoan',   label: 'Edu Loan',         tracked: false },
  { key: 'gic',             label: 'GIC',              tracked: false },
  { key: 'blockAccount',    label: 'Block Acct',       tracked: false },
  { key: 'forexRemittance', label: 'Forex/Rem.',       tracked: false },
  { key: 'insurance',       label: 'Insurance',        tracked: false },
];

const TOTAL_DAYS = 25 * 12;
const round1 = (n) => Math.round(n * 10) / 10;

const getTargetVal = (target, key, view) => {
  if (!target) return 0;
  const y = target[key] || 0;
  if (view === 'yearly')  return y;
  if (view === 'monthly') return round1(y / 12);
  return Math.round(y / TOTAL_DAYS);
};

const getActualVal = (actuals, key, view) => {
  const monthly = actuals?.[key] || 0;
  if (view === 'yearly')  return monthly;
  if (view === 'monthly') return monthly;
  return Math.round(monthly / 25);
};

const pct = (actual, target) => (target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0);

const StatusDot = ({ p }) => {
  if (p >= 100) return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (p >= 70)  return <AlertCircle  className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
  return              <XCircle       className="w-4 h-4 text-red-400 flex-shrink-0" />;
};

const now = new Date();
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TeamTargets = () => {
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view,  setView]  = useState('monthly');
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  useEffect(() => {
    setLoading(true);
    targetsAPI.getTeamTargets(month, year)
      .then((res) => setRows(res.data.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [month, year]);

  // Team-level totals
  const totals = TARGET_FIELDS.reduce((acc, f) => {
    acc[f.key] = {
      target: rows.reduce((s, r) => s + getTargetVal(r.target, f.key, view), 0),
      actual: f.tracked ? rows.reduce((s, r) => s + getActualVal(r.actuals, f.key, view), 0) : null,
    };
    return acc;
  }, {});

  const viewLabel = { daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly' };
  const actualLabel = { daily: "Today's", monthly: "This Month's", yearly: "This Month's" };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Team Targets</h1>
          <p className="text-xs text-gray-400 mt-0.5">25 working days/month · 300 days/year</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Period toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            {['daily', 'monthly', 'yearly'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  view === v
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {viewLabel[v]}
              </button>
            ))}
          </div>
          {/* Month picker */}
          <select className="input-field w-auto text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          {/* Year picker */}
          <select className="input-field w-auto text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Team summary cards — tracked metrics only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TARGET_FIELDS.filter((f) => f.tracked).map((f) => {
          const t = totals[f.key];
          const p = pct(t.actual, t.target);
          const barColor = p >= 100 ? 'bg-green-500' : p >= 70 ? 'bg-yellow-400' : 'bg-red-400';
          return (
            <div key={f.key} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{f.label}</p>
                <StatusDot p={p} />
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{t.actual}</span>
                <span className="text-sm text-gray-400">/ {t.target}</span>
                <span className={`ml-auto text-xs font-bold ${p >= 100 ? 'text-green-600' : p >= 70 ? 'text-yellow-600' : 'text-red-500'}`}>{p}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Team {viewLabel[view]} target · {actualLabel[view]} actual
              </p>
            </div>
          );
        })}
      </div>

      {/* Per-RM table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No RMs assigned to your team yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-10">
                    RM
                  </th>
                  {TARGET_FIELDS.map((f) => (
                    <th key={f.key} className="px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((row) => {
                  const trackedFields = TARGET_FIELDS.filter((f) => f.tracked && getTargetVal(row.target, f.key, view) > 0);
                  const allMet = trackedFields.length > 0 && trackedFields.every(
                    (f) => pct(getActualVal(row.actuals, f.key, view), getTargetVal(row.target, f.key, view)) >= 100
                  );
                  const anyLow = trackedFields.some(
                    (f) => pct(getActualVal(row.actuals, f.key, view), getTargetVal(row.target, f.key, view)) < 70
                  );
                  const overallPct = !row.target ? null : allMet ? 100 : anyLow ? 30 : 75;

                  return (
                    <tr key={row.user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      {/* RM name */}
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-800 z-10">
                        <p className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.user.name}</p>
                        <p className="text-xs text-gray-400">{row.user.zoneId?.name || '—'}</p>
                      </td>

                      {/* 9 metric cells */}
                      {TARGET_FIELDS.map((f) => {
                        const t = getTargetVal(row.target, f.key, view);
                        const a = f.tracked ? getActualVal(row.actuals, f.key, view) : null;
                        const p = f.tracked ? pct(a, t) : null;
                        const cellBg =
                          !row.target ? '' :
                          !f.tracked  ? '' :
                          p >= 100    ? 'bg-green-50 dark:bg-green-900/10' :
                          p >= 70     ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                                        'bg-red-50 dark:bg-red-900/10';

                        return (
                          <td key={f.key} className={`px-3 py-3 text-center ${cellBg}`}>
                            {!row.target ? (
                              <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                            ) : f.tracked ? (
                              <div>
                                <p className={`text-xs font-semibold ${p >= 100 ? 'text-green-700 dark:text-green-400' : p >= 70 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {a} / {t}
                                </p>
                                <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden mt-1 mx-auto w-14">
                                  <div
                                    className={`h-full rounded-full ${p >= 100 ? 'bg-green-500' : p >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                    style={{ width: `${p}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t}</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Overall status */}
                      <td className="px-3 py-3 text-center">
                        {!row.target ? (
                          <span className="text-xs text-gray-400">No target</span>
                        ) : (
                          <StatusDot p={overallPct} />
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Team totals row */}
                <tr className="bg-gray-100 dark:bg-gray-700/60 font-semibold border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-3 sticky left-0 bg-gray-100 dark:bg-gray-700/60 z-10 text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">
                    Team Total
                  </td>
                  {TARGET_FIELDS.map((f) => {
                    const t = totals[f.key];
                    const p = f.tracked ? pct(t.actual, t.target) : null;
                    return (
                      <td key={f.key} className="px-3 py-3 text-center">
                        {f.tracked ? (
                          <p className={`text-xs font-bold ${p >= 100 ? 'text-green-700 dark:text-green-400' : p >= 70 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                            {t.actual} / {t.target}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-600 dark:text-gray-400">{t.target}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {rows.filter((r) => r.target).length}/{rows.length} set
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Met (≥ 100%)</span>
        <span className="flex items-center gap-1.5"><AlertCircle  className="w-3.5 h-3.5 text-yellow-500" /> On track (≥ 70%)</span>
        <span className="flex items-center gap-1.5"><XCircle      className="w-3.5 h-3.5 text-red-400" /> Behind (&lt; 70%)</span>
        <span className="flex items-center gap-1.5"><Minus        className="w-3.5 h-3.5 text-gray-400" /> Tracked (actual / target) · Untracked = target only</span>
      </div>
    </div>
  );
};

export default TeamTargets;
