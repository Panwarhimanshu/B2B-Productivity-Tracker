import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, AlertCircle } from 'lucide-react';
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
  const [dailyTarget, setDailyTarget] = useState(null); // derived daily profiles target

  // Fetch yearly target and pre-fill Daily Application Target
  useEffect(() => {
    const now = new Date();
    targetsAPI.getMyWithActuals(now.getMonth() + 1, now.getFullYear())
      .then((res) => {
        const t = res.data.data?.target;
        if (!t) return;
        const daily = Math.round((t.profiles || 0) / TOTAL_DAYS);
        setDailyTarget(daily);
        setTracker((prev) => ({ ...prev, dailyApplicationTarget: daily }));
      })
      .catch(() => {}); // no target set — field stays blank
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

  const detail = (label, val) => (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 dark:text-gray-200">{val || '-'}</p>
    </div>
  );

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
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Relationship Manager Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            <div>
              <label className="label" htmlFor="report-date">Date <span className="text-red-500">*</span></label>
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
            {detail('Name of RM', user?.name)}
            {detail('Employee ID', user?.employeeId)}
            {detail('Email', user?.email)}
          </div>
        </div>

        <TrackerForm value={tracker} onChange={setTracker} dailyTarget={dailyTarget} />

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
