import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import { reportsAPI } from '../../api/reports';
import { usersAPI } from '../../api/users';
import KPICard from '../../components/dashboard/KPICard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import RecentReports from '../../components/dashboard/RecentReports';
import TrackerSummary from '../../components/dashboard/TrackerSummary';
import { PERIODS } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TeamDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsAPI.getAnalytics({ period }),
      reportsAPI.getSummary({ period }),
      reportsAPI.getTeam({ period, limit: 8 }),
      usersAPI.getAll({ role: 'RM' }),
    ])
      .then(([analyticsRes, summaryRes, reportsRes, usersRes]) => {
        setAnalytics(analyticsRes.data.data);
        setSummary(summaryRes.data.data);
        setReports(reportsRes.data.data);
        setTeamCount(usersRes.data.pagination?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const analyticsSummary = analytics?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Team Dashboard</h1>
        <select className="input-field w-auto text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Team Members" value={teamCount} icon={Users} color="blue" />
            <KPICard title="Total Reports" value={analyticsSummary.totalReports} icon={FileText} color="green" />
            <KPICard title="Applications" value={analyticsSummary.totalTasks} icon={TrendingUp} color="purple" />
            <KPICard title="Submitted" value={analyticsSummary.submittedCount} icon={CheckCircle} color="yellow" />
          </div>

          {analytics?.dailyBreakdown?.length > 0 && (
            <PerformanceChart
              title="Team Reports Over Time"
              data={analytics.dailyBreakdown}
              type="area"
              dataKeys={[
                { key: 'count', name: 'Reports', color: '#2563eb' },
                { key: 'tasks', name: 'Applications', color: '#16a34a' },
              ]}
            />
          )}

          <TrackerSummary summary={summary} />

          <RecentReports reports={reports} showUser />
        </>
      )}
    </div>
  );
};

export default TeamDashboard;
