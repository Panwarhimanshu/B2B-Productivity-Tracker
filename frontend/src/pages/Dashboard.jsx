import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, CheckCircle, Clock, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import KPICard from '../components/dashboard/KPICard';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import RecentReports from '../components/dashboard/RecentReports';
import TrackerSummary from '../components/dashboard/TrackerSummary';
import { reportsAPI } from '../api/reports';
import { PERIODS } from '../utils/constants';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, summaryRes, reportsRes] = await Promise.all([
          reportsAPI.getAnalytics({ period }),
          reportsAPI.getSummary({ period }),
          user.role === 'RM'
            ? reportsAPI.getMy({ period, limit: 8 })
            : user.role === 'TEAM_LEAD'
            ? reportsAPI.getTeam({ period, limit: 8 })
            : reportsAPI.getAll({ period, limit: 8 }),
        ]);
        setAnalytics(analyticsRes.data.data);
        setSummary(summaryRes.data.data);
        setRecentReports(reportsRes.data.data);
      } catch {
        // fail silently — loading state handles it
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period, user.role]);

  const analyticsSummary = analytics?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Good {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Here's your performance overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input-field w-auto text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {user?.role === 'RM' && (
            <button onClick={() => navigate('/submit-report')} className="btn-primary">
              <Plus className="w-4 h-4" />
              Submit Report
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Reports" value={analyticsSummary.totalReports} icon={FileText} color="blue" subtitle={`For selected period`} />
        <KPICard title="Applications" value={analyticsSummary.totalTasks} icon={TrendingUp} color="green" />
        <KPICard title="Submitted" value={analyticsSummary.submittedCount} icon={CheckCircle} color="purple" />
        <KPICard title="Modified" value={analyticsSummary.modifiedCount} icon={Clock} color="yellow" />
      </div>

      {/* Charts */}
      {!loading && analytics?.dailyBreakdown?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PerformanceChart
            title="Daily Reports Submitted"
            data={analytics.dailyBreakdown}
            type="area"
            dataKeys={[{ key: 'count', name: 'Reports', color: '#2563eb' }]}
          />
          <PerformanceChart
            title="Daily Tasks Completed"
            data={analytics.dailyBreakdown}
            type="bar"
            dataKeys={[{ key: 'tasks', name: 'Tasks', color: '#16a34a' }]}
          />
        </div>
      )}

      {/* KPI rollup (per-country, communication, follow-up) */}
      {!loading && <TrackerSummary summary={summary} />}

      {/* Recent Reports */}
      <RecentReports reports={recentReports} showUser={user?.role !== 'RM'} />
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;
