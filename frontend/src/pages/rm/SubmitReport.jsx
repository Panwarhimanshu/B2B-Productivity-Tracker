import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, AlertCircle, Calendar, User, Hash, Mail } from 'lucide-react';
import { reportsAPI } from '../../api/reports';
import { targetsAPI } from '../../api/targets';
import { useAuth } from '../../context/AuthContext';
import { emptyTracker } from '../../constants/tracker';
import { getErrorMessage } from '../../utils/helpers';
import TrackerForm from '../../components/reports/TrackerForm';
import toast from 'react-hot-toast';

const TOTAL_DAYS = 25 * 12; // 300

const SubmitReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tracker, setTracker] = useState(emptyTracker);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [yearlyTarget, setYearlyTarget] = useState(null);

  useEffect(() => {
    const now = new Date();
    targetsAPI.getMyWithActuals(now.getMonth() + 1, now.getFullYear())
      .then((res) => {
        const t = res.data.data?.target;
        if (!t) return;
        setYearlyTarget(t);
        const daily = Math.round((t.profiles || 0) / TOTAL_DAYS);
        setTracker((prev) => ({ ...prev, dailyApplicationTarget: daily }));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await reportsAPI.submit({ date, tasks: tracker });
      toast.success('Report submitted successfully!');
      navigate('/my-reports');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Submit Daily Report</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">RM Daily Tracker — fill commitments in the morning and update KPIs at end of day.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* A. RM Details */}
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Relationship Manager Details</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar + identity */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {user?.name?.charAt(0)?.toUpperCase() || 'R'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{user?.name || '—'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Hash className="w-3 h-3" />{user?.employeeId || '—'}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Mail className="w-3 h-3" />{user?.email || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Date picker */}
            <div className="sm:w-52 flex-shrink-0">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5" htmlFor="report-date">
                <Calendar className="w-3.5 h-3.5" />Report Date <span className="text-red-500">*</span>
              </label>
              <input
                id="report-date"
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>
        </div>

        <TrackerForm value={tracker} onChange={setTracker} yearlyTarget={yearlyTarget} />

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Submit Report
              </span>
            )}
          </button>
          <button type="button" onClick={() => navigate('/my-reports')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default SubmitReport;
