import { useState, useEffect } from 'react';
import { Download, Eye } from 'lucide-react';
import { reportsAPI } from '../../api/reports';
import { usersAPI } from '../../api/users';
import { PERIODS, REPORT_STATUS_COLORS } from '../../utils/constants';
import { formatDate, downloadBlob, getErrorMessage } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EditReportModal from '../../components/reports/EditReportModal';
import toast from 'react-hot-toast';

const EmployeeReports = () => {
  const [reports, setReports] = useState([]);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [period, setPeriod] = useState('monthly');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editReport, setEditReport] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, membersRes] = await Promise.all([
        reportsAPI.getTeam({ period, userId: userId || undefined, page, limit: 15 }),
        usersAPI.getAll({ role: 'RM' }),
      ]);
      setReports(reportsRes.data.data);
      setPagination(reportsRes.data.pagination);
      setMembers(membersRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period, userId, page]);

  const handleExport = async () => {
    try {
      const res = await reportsAPI.export({ period, userId: userId || undefined });
      downloadBlob(res.data, `team_reports_${period}.xlsx`);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Employee Reports</h1>
        <div className="flex flex-wrap gap-2">
          <select className="input-field w-auto text-sm" value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1); }}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="input-field w-auto text-sm" value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }}>
            <option value="">All Members</option>
            {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" />Export
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner className="py-16" /> : reports.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-16">No reports found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Employee', 'Date', 'Applications', 'Status', 'Modified By', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      <div>{r.userId?.name}</div>
                      <div className="text-xs text-gray-500">{r.userId?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.totalTasksCount || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${REPORT_STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.modifiedBy?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditReport(r)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">{reports.length} of {pagination.total} records</p>
          <div className="flex gap-2">
            <button className="btn-secondary py-1 px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span className="px-3 py-1 text-gray-700 dark:text-gray-300">{page}/{pagination.pages}</span>
            <button className="btn-secondary py-1 px-3" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {editReport && (
        <EditReportModal
          report={editReport}
          readOnly={true}
          onClose={() => setEditReport(null)}
          onSaved={() => { setEditReport(null); fetchData(); }}
        />
      )}
    </div>
  );
};

export default EmployeeReports;
