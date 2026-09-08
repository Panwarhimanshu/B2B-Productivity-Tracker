import { useState, useEffect } from 'react';
import { Mail, Send, Plus, X, Save, RefreshCw } from 'lucide-react';
import { emailConfigAPI } from '../../api/emailConfig';
import { zonesAPI } from '../../api/zones';
import { EMAIL_LOG_STATUS_COLORS } from '../../utils/constants';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Small pill switch — no existing toggle component in this codebase to reuse, kept local since
// it's only used on this page.
const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer">
    <span>
      <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
      {hint && <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</span>}
    </span>
    <span className="relative inline-flex flex-shrink-0 mt-0.5">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-primary-600 transition-colors" />
      <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
    </span>
  </label>
);

const EmailChips = ({ emails, onChange }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const email = draft.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) { toast.error(`"${email}" doesn't look like a valid email`); return; }
    if (emails.includes(email)) { setDraft(''); return; }
    onChange([...emails, email]);
    setDraft('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {emails.map((email) => (
          <span key={email} className="badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 gap-1">
            {email}
            <button type="button" onClick={() => onChange(emails.filter((e) => e !== email))} className="hover:text-red-600">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {emails.length === 0 && <span className="text-xs text-gray-400">No recipients yet.</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          className="input-field text-sm py-1.5"
          placeholder="Add email and press Enter..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="btn-secondary py-1.5 px-3">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const EmailConfiguration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(null); // { fromName, fromEmail, appPassword, hasAppPassword, enabled, hods: [{_id,name,email,notified}], zoneRecipients: [{zoneId, emails}] }

  const [logs, setLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({});
  const [logStatus, setLogStatus] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [configRes, zonesRes] = await Promise.all([emailConfigAPI.get(), zonesAPI.getAll()]);
      const config = configRes.data.data;
      const zoneList = zonesRes.data.data;
      setZones(zoneList);
      setForm({
        fromName: config.fromName || '',
        fromEmail: config.fromEmail || '',
        appPassword: '',
        hasAppPassword: config.hasAppPassword,
        enabled: config.enabled,
        hods: config.hods,
        zoneRecipients: zoneList.map((z) => {
          const existing = config.zoneRecipients.find((zr) => zr.zoneId === z._id);
          return { zoneId: z._id, zoneName: z.name, emails: existing?.emails || [] };
        }),
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await emailConfigAPI.getLogs({ status: logStatus || undefined, page: logPage, limit: 15 });
      setLogs(res.data.data);
      setLogPagination(res.data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);
  useEffect(() => { fetchLogs(); }, [logStatus, logPage]);

  const updateForm = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateZoneEmails = (zoneId, emails) => setForm((f) => ({
    ...f,
    zoneRecipients: f.zoneRecipients.map((zr) => (zr.zoneId === zoneId ? { ...zr, emails } : zr)),
  }));
  const toggleHod = (hodId) => setForm((f) => ({
    ...f,
    hods: f.hods.map((h) => (h._id === hodId ? { ...h, notified: !h.notified } : h)),
  }));
  const setAllHods = (notified) => setForm((f) => ({ ...f, hods: f.hods.map((h) => ({ ...h, notified })) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await emailConfigAPI.update({
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        ...(form.appPassword ? { appPassword: form.appPassword } : {}),
        enabled: form.enabled,
        hodRecipientIds: form.hods.filter((h) => h.notified).map((h) => h._id),
        zoneRecipients: form.zoneRecipients.map(({ zoneId, emails }) => ({ zoneId, emails })),
      });
      toast.success('Email configuration saved');
      const config = res.data.data;
      updateForm({ appPassword: '', hasAppPassword: config.hasAppPassword, hods: config.hods });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await emailConfigAPI.sendTest();
      toast.success(res.data.message);
      setLogPage(1);
      setTimeout(fetchLogs, 800); // give the send a moment to land in the log
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  if (loading || !form) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Email Configuration</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage the sender account, who gets notified when a report is submitted, and whether emails are actually going out.
        </p>
      </div>

      {/* Sender Account */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />Sender Account
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">From Name</label>
            <input type="text" className="input-field" value={form.fromName} onChange={(e) => updateForm({ fromName: e.target.value })} placeholder="B2B Task Tracker" />
          </div>
          <div>
            <label className="label">From Email (Gmail address)</label>
            <input type="email" className="input-field" value={form.fromEmail} onChange={(e) => updateForm({ fromEmail: e.target.value })} placeholder="notifications@yourdomain.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">
              Gmail App Password {form.hasAppPassword && <span className="text-gray-400 font-normal">(already set — leave blank to keep it)</span>}
            </label>
            <input
              type="password"
              className="input-field"
              value={form.appPassword}
              onChange={(e) => updateForm({ appPassword: e.target.value })}
              placeholder={form.hasAppPassword ? '••••••••••••••••' : '16-character app password'}
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-400 mt-1">
              Generate one at <span className="font-mono">myaccount.google.com/apppasswords</span> (requires 2-Step Verification on that Gmail account).
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <Toggle
            checked={form.enabled}
            onChange={(v) => updateForm({ enabled: v })}
            label="Send report-submission emails"
            hint="Turn off to stop all outgoing email for this feature without losing your configuration."
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
          <button onClick={handleTest} disabled={testing || !form.fromEmail} className="btn-secondary">
            {testing ? 'Sending...' : <><Send className="w-4 h-4" />Send Test Email</>}
          </button>
        </div>
      </div>

      {/* Recipients */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recipients</h2>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label !mb-0">Heads of Department</label>
            <div className="flex gap-3 text-xs font-medium">
              <button type="button" onClick={() => setAllHods(true)} className="text-primary-600 dark:text-primary-400 hover:underline">Select all</button>
              <button type="button" onClick={() => setAllHods(false)} className="text-primary-600 dark:text-primary-400 hover:underline">Select none</button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Pick exactly which HODs get a copy of every report-submitted email — unchecked HODs won't receive it.
          </p>
          <div className="space-y-1 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {form.hods.map((h) => (
              <label key={h._id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <input type="checkbox" className="rounded" checked={h.notified} onChange={() => toggleHod(h._id)} />
                <span className="text-gray-800 dark:text-gray-200 font-medium">{h.name}</span>
                <span className="text-xs text-gray-400">{h.email}</span>
              </label>
            ))}
            {form.hods.length === 0 && <p className="text-sm text-gray-400 px-3 py-2">No active HODs found.</p>}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Per zone: who should be notified when an RM in that zone submits a report (usually the zone's Team Leads). These don't have to be existing user accounts.
          </p>
          {form.zoneRecipients.map((zr) => (
            <div key={zr.zoneId}>
              <label className="label">{zr.zoneName}</label>
              <EmailChips emails={zr.emails} onChange={(emails) => updateZoneEmails(zr.zoneId, emails)} />
            </div>
          ))}
          {form.zoneRecipients.length === 0 && <p className="text-sm text-gray-400">No zones configured yet — add one in Zone Management first.</p>}
        </div>
        <div className="pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </div>
      </div>

      {/* Mail Log */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Mail Log</h2>
          <div className="flex items-center gap-2">
            <select className="input-field w-auto text-sm py-1.5" value={logStatus} onChange={(e) => { setLogStatus(e.target.value); setLogPage(1); }}>
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
            <button onClick={fetchLogs} className="btn-secondary py-1.5 px-2.5" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {logsLoading ? <LoadingSpinner className="py-12" /> : logs.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">No emails logged yet</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Sent At', 'To', 'Subject', 'Type', 'Status', 'Error'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(log.createdAt, 'dd MMM yyyy, hh:mm a')}</td>
                    <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">{log.to}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 max-w-xs truncate" title={log.subject}>{log.subject || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{log.type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`badge ${EMAIL_LOG_STATUS_COLORS[log.status] || ''}`}>{log.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-red-500 text-xs max-w-xs truncate" title={log.error}>{log.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logPagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Showing {(logPage - 1) * logPagination.limit + 1}–{(logPage - 1) * logPagination.limit + logs.length} of {logPagination.total} emails
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary py-1 px-3" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>Prev</button>
              <span className="px-3 py-1 text-gray-700 dark:text-gray-300">{logPage}/{logPagination.pages}</span>
              <button className="btn-secondary py-1 px-3" disabled={logPage >= logPagination.pages} onClick={() => setLogPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfiguration;
