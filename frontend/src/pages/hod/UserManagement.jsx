import { useState, useEffect } from 'react';
import { Plus, Edit2, UserX, UserCheck, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { usersAPI } from '../../api/users';
import { zonesAPI } from '../../api/zones';
import { targetsAPI } from '../../api/targets';
import { ROLE_LABELS, ROLES } from '../../utils/constants';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

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

const emptyTargetForm = () => Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, '']));

const emptyForm = { name: '', email: '', password: '', role: 'RM', employeeId: '', zoneId: '', teamLeadId: '', joiningDate: '' };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [targetForm, setTargetForm] = useState(emptyTargetForm());
  const [showTargets, setShowTargets] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, zonesRes, tlRes] = await Promise.all([
        usersAPI.getAll({ isActive: !showInactive, search: search || undefined, page, limit: 15 }),
        zonesAPI.getAll(),
        usersAPI.getAll({ role: 'TEAM_LEAD' }),
      ]);
      setUsers(usersRes.data.data);
      setPagination(usersRes.data.pagination);
      setZones(zonesRes.data.data);
      setTeamLeads(tlRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [showInactive, search, page]);

  const openCreate = () => { setForm(emptyForm); setTargetForm(emptyTargetForm()); setShowTargets(false); setEditingUser(null); setShowForm(true); };
  const openEdit = (user) => {
    setForm({
      name: user.name, email: user.email, password: '', role: user.role,
      employeeId: user.employeeId || '', zoneId: user.zoneId?._id || '',
      teamLeadId: user.teamLeadId?._id || '',
      joiningDate: user.joiningDate ? user.joiningDate.split('T')[0] : '',
    });
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.zoneId || payload.zoneId === 'all') delete payload.zoneId;
      if (!payload.teamLeadId) delete payload.teamLeadId;

      if (editingUser) {
        await usersAPI.update(editingUser._id, payload);
        toast.success('User updated');
      } else {
        const res = await usersAPI.create(payload);
        const newUserId = res.data.data?._id;
        // Save yearly targets if any field was filled
        const hasTargets = TARGET_FIELDS.some((f) => Number(targetForm[f.key]) > 0);
        if (newUserId && hasTargets) {
          await targetsAPI.upsert({
            userId: newUserId,
            year: new Date().getFullYear(),
            ...Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, Number(targetForm[f.key]) || 0])),
          });
        }
        toast.success('User created');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.isActive) {
        await usersAPI.hide(user._id);
        toast.success(`${user.name} deactivated`);
      } else {
        await usersAPI.reactivate(user._id);
        toast.success(`${user.name} reactivated`);
      }
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input-field pl-8 w-48 text-sm"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
            Inactive
          </label>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add User</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner className="py-16" /> : users.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Name', 'Employee ID', 'Role', 'Zone', 'Team Lead', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.employeeId || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.zoneId?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{u.teamLeadId?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.joiningDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded ${u.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
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
          <p className="text-gray-500">{users.length} of {pagination.total} users</p>
          <div className="flex gap-2">
            <button className="btn-secondary py-1 px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span className="px-3 py-1 text-gray-700 dark:text-gray-300">{page}/{pagination.pages}</span>
            <button className="btn-secondary py-1 px-3" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingUser ? 'Edit User' : 'Create User'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <Plus className="w-5 h-5 text-gray-500 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text', required: true },
                { label: 'Email', key: 'email', type: 'email', required: true },
                { label: editingUser ? 'New Password (leave blank to keep)' : 'Password', key: 'password', type: 'password', required: !editingUser },
                { label: 'Employee ID', key: 'employeeId', type: 'text' },
                { label: 'Joining Date', key: 'joiningDate', type: 'date' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
                  <input type={type} className="input-field" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required={required} />
                </div>
              ))}
              <div>
                <label className="label">Role <span className="text-red-500">*</span></label>
                <select className="input-field" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} required>
                  {Object.entries(ROLE_LABELS).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Zone</label>
                <select className="input-field" value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))}>
                  <option value="">Select zone...</option>
                  <option value="all">All Zone</option>
                  {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
                </select>
              </div>
              {form.role === 'RM' && (
                <div>
                  <label className="label">Team Lead</label>
                  <select className="input-field" value={form.teamLeadId} onChange={(e) => setForm((f) => ({ ...f, teamLeadId: e.target.value }))}>
                    <option value="">Select team lead...</option>
                    {teamLeads.map((tl) => <option key={tl._id} value={tl._id}>{tl.name}</option>)}
                  </select>
                </div>
              )}

              {/* Yearly targets — only for new RM creation */}
              {!editingUser && form.role === 'RM' && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowTargets((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span>Set Yearly Targets (optional)</span>
                    {showTargets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showTargets && (
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-gray-400">Enter yearly totals. Monthly = ÷12 · Daily = ÷300 (25 days × 12 months)</p>
                      <div className="grid grid-cols-2 gap-3">
                        {TARGET_FIELDS.map((f) => {
                          const y = Number(targetForm[f.key]) || 0;
                          return (
                            <div key={f.key}>
                              <label className="label text-xs">
                                {f.label}
                                {f.hint && <span className="text-gray-400 ml-1">({f.hint})</span>}
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Yearly"
                                className="input-field text-sm"
                                value={targetForm[f.key]}
                                onChange={(e) => setTargetForm((p) => ({ ...p, [f.key]: e.target.value }))}
                              />
                              {y > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {round1(y / 12)}/mo · {Math.round(y / TOTAL_DAYS)}/day
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
            <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleSubmit} className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
