import { formatDate } from '../../utils/helpers';
import { REPORT_STATUS_COLORS } from '../../utils/constants';

const RecentReports = ({ reports = [], showUser = false }) => (
  <div className="card p-5">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Reports</h3>
    {reports.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No reports found</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700">
              {showUser && <th className="pb-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Employee</th>}
              <th className="pb-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th className="pb-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Tasks</th>
              <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {reports.slice(0, 8).map((r) => (
              <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {showUser && (
                  <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200 font-medium">
                    {r.userId?.name || '-'}
                  </td>
                )}
                <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{formatDate(r.date)}</td>
                <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{r.totalTasksCount || 0}</td>
                <td className="py-2.5">
                  <span className={`badge ${REPORT_STATUS_COLORS[r.status]}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default RecentReports;
