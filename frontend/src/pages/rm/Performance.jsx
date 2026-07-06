import { useState, useEffect } from 'react';
import { FileText, TrendingUp, CheckCircle, BarChart2 } from 'lucide-react';
import { reportsAPI } from '../../api/reports';
import { targetsAPI } from '../../api/targets';
import KPICard from '../../components/dashboard/KPICard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import { PERIODS } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TARGET_FIELDS = [
  { key: 'profiles',        label: 'Profiles' },
  { key: 'wt',              label: 'WT' },
  { key: 'visaServices',    label: 'Visa Services',      hint: '25% of WT' },
  { key: 'sop',             label: 'SOP',                hint: '15% of Profiles' },
  { key: 'educationLoan',   label: 'Education Loan',     hint: '25% of WT' },
  { key: 'gic',             label: 'GIC',                hint: '50% of Canada WT' },
  { key: 'blockAccount',    label: 'Block Account',      hint: '50% of Germany WT' },
  { key: 'forexRemittance', label: 'Forex / Remittance', hint: '5 / Month' },
  { key: 'insurance',       label: 'Insurance',          hint: '2 / Month' },
];

const TOTAL_DAYS = 25 * 12;
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

const ProgressBar = ({ actual, target }) => {
  const pct = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
  const color = pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-gray-700 dark:text-gray-300">{actual} / {target}</span>
        <span className={`font-bold ${pct >= 100 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const now = new Date();

const Performance = () => {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [targetData, setTargetData] = useState(null);
  const [targetLoading, setTargetLoading] = useState(true);
  const [view, setView] = useState('monthly'); // 'daily' | 'monthly' | 'yearly'

  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  useEffect(() => {
    setLoading(true);
    reportsAPI.getAnalytics({ period })
      .then((res) => setAnalytics(res.data.data))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    setTargetLoading(true);
    targetsAPI.getMyWithActuals(month, year)
      .then((res) => setTargetData(res.data.data))
      .catch(() => setTargetData(null))
      .finally(() => setTargetLoading(false));
  }, []);

  const summary   = analytics?.summary || {};
  const target    = targetData?.target;
  const actuals   = targetData?.actuals || {};

  const getTarget = (fieldKey) => {
    if (!target) return 0;
    const y = target[fieldKey] || 0;
    if (view === 'yearly')  return y;
    if (view === 'monthly') return round1(y / 12);
    return Math.round(y / TOTAL_DAYS);
  };

  const getActual = (fieldKey) => {
    // Actuals are monthly (from this month's reports)
    const monthly = actuals[fieldKey] || 0;
    if (view === 'monthly') return monthly;
    if (view === 'yearly')  return monthly; // can't know ytd without full range query
    return round2(monthly / 25);            // rough daily from monthly actuals
  };

  const viewLabel = { daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Performance</h1>
        <select className="input-field w-auto text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Targets card */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Targets — {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">25 working days/month · 300 days/year</p>
          </div>
          {/* Period toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
            {['daily', 'monthly', 'yearly'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1.5 capitalize transition-colors ${
                  view === v
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {viewLabel[v]}
              </button>
            ))}
          </div>
        </div>

        {targetLoading ? (
          <LoadingSpinner className="py-6" />
        ) : !target ? (
          <p className="text-sm text-gray-400 text-center py-4">No targets set for this year yet.</p>
        ) : (
          <>
            {/* Summary row: yearly → monthly → daily */}
            {view === 'monthly' && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
                Monthly targets auto-calculated from yearly ÷ 12
              </div>
            )}
            {view === 'daily' && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
                Daily targets auto-calculated from yearly ÷ 300 (25 days × 12 months)
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TARGET_FIELDS.map((f) => {
                const t = getTarget(f.key);
                const a = getActual(f.key);
                return (
                  <div key={f.key} className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3">
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{f.label}</p>
                      {f.hint && <p className="text-xs text-gray-400">({f.hint})</p>}
                    </div>
                    <ProgressBar actual={a} target={t} />
                    {/* Show all three derived numbers */}
                    <div className="mt-1.5 flex gap-3 text-xs text-gray-400">
                      <span>Y: {target[f.key] || 0}</span>
                      <span>M: {round1((target[f.key] || 0) / 12)}</span>
                      <span>D: {Math.round((target[f.key] || 0) / TOTAL_DAYS)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* KPI cards */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Reports Submitted" value={summary.totalReports}   icon={FileText}    color="blue" />
            <KPICard title="Total Tasks"        value={summary.totalTasks}     icon={TrendingUp}  color="green" />
            <KPICard title="On Time"            value={summary.submittedCount} icon={CheckCircle} color="purple" />
            <KPICard
              title="Avg Tasks/Day"
              value={summary.totalReports > 0 ? Math.round(summary.totalTasks / summary.totalReports) : 0}
              icon={BarChart2}
              color="yellow"
            />
          </div>
          {analytics?.dailyBreakdown?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PerformanceChart title="Reports Over Time"       data={analytics.dailyBreakdown} type="area" dataKeys={[{ key: 'count', name: 'Reports', color: '#2563eb' }]} />
              <PerformanceChart title="Tasks Completed Per Day" data={analytics.dailyBreakdown} type="bar"  dataKeys={[{ key: 'tasks',  name: 'Tasks',   color: '#7c3aed' }]} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Performance;
