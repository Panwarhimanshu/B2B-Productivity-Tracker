import { useState, useEffect } from 'react';
import { FileText, TrendingUp, CheckCircle, BarChart2 } from 'lucide-react';
import { reportsAPI } from '../../api/reports';
import KPICard from '../../components/dashboard/KPICard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import { PERIODS } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Performance = () => {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsAPI.getAnalytics({ period })
      .then((res) => setAnalytics(res.data.data))
      .finally(() => setLoading(false));
  }, [period]);

  const summary = analytics?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Performance</h1>
        <select className="input-field w-auto text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Reports Submitted" value={summary.totalReports} icon={FileText} color="blue" />
            <KPICard title="Total Tasks" value={summary.totalTasks} icon={TrendingUp} color="green" />
            <KPICard title="On Time" value={summary.submittedCount} icon={CheckCircle} color="purple" />
            <KPICard
              title="Avg Tasks/Day"
              value={summary.totalReports > 0 ? Math.round(summary.totalTasks / summary.totalReports) : 0}
              icon={BarChart2}
              color="yellow"
            />
          </div>

          {analytics?.dailyBreakdown?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PerformanceChart
                title="Reports Over Time"
                data={analytics.dailyBreakdown}
                type="area"
                dataKeys={[{ key: 'count', name: 'Reports', color: '#2563eb' }]}
              />
              <PerformanceChart
                title="Tasks Completed Per Day"
                data={analytics.dailyBreakdown}
                type="bar"
                dataKeys={[{ key: 'tasks', name: 'Tasks', color: '#7c3aed' }]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Performance;
