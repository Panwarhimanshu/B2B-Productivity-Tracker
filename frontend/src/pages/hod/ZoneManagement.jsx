import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Users } from 'lucide-react';
import { zonesAPI } from '../../api/zones';
import { teamsAPI } from '../../api/teams';
import { usersAPI } from '../../api/users';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '' };
const newTeamRow = () => ({ key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, _id: null, name: '', teamLeadId: '', members: [] });

const ZoneManagement = () => {
  const [zones, setZones] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [teamRows, setTeamRows] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const [zonesRes, teamsRes, tlRes] = await Promise.all([
        zonesAPI.getAll(),
        teamsAPI.getAll(),
        usersAPI.getAll({ role: 'TEAM_LEAD' }),
      ]);
      setZones(zonesRes.data.data);
      setTeams(teamsRes.data.data);
      setTeamLeads(tlRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  const teamsForZone = (zoneId) => teams.filter((t) => t.zoneId?._id === zoneId);

  const openCreate = () => { setForm(emptyForm); setEditingZone(null); setTeamRows([]); setShowForm(true); };
  const openEdit = (zone) => {
    setForm({ name: zone.name, description: zone.description || '' });
    setTeamRows(teamsForZone(zone._id).map((t) => ({
      key: t._id, _id: t._id, name: t.name, teamLeadId: t.teamLeadId?._id || '', members: t.members || [],
    })));
    setEditingZone(zone);
    setShowForm(true);
  };

  const addTeamRow = () => setTeamRows((rows) => [...rows, newTeamRow()]);
  const updateTeamRow = (key, field, value) => setTeamRows((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const removeTeamRow = (key) => setTeamRows((rows) => rows.filter((r) => r.key !== key));

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const row of teamRows) {
      if (row.name.trim() && !row.teamLeadId) {
        toast.error(`Select a Team Lead for "${row.name.trim()}"`);
        return;
      }
    }
    setSaving(true);
    try {
      let zoneId = editingZone?._id;
      if (editingZone) {
        await zonesAPI.update(editingZone._id, form);
      } else {
        const res = await zonesAPI.create(form);
        zoneId = res.data.data._id;
      }

      for (const row of teamRows) {
        if (!row.name.trim()) continue;
        if (row._id) {
          await teamsAPI.update(row._id, {
            name: row.name.trim(),
            teamLeadId: row.teamLeadId,
            zoneId,
            members: row.members.map((m) => m._id),
          });
        } else {
          await teamsAPI.create({ name: row.name.trim(), teamLeadId: row.teamLeadId, zoneId });
        }
      }

      toast.success(editingZone ? 'Zone updated' : 'Zone created');
      setShowForm(false);
      fetchZones();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Deactivate zone "${zone.name}"?`)) return;
    try {
      await zonesAPI.delete(zone._id);
      toast.success('Zone deactivated');
      fetchZones();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Zone Management</h1>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add Zone</button>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => {
            const zoneTeams = teamsForZone(zone._id);
            return (
              <div key={zone._id} className="card p-5 flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg mt-0.5">
                    <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{zone.name}</h3>
                    {zone.description && <p className="text-xs text-gray-500 mt-0.5">{zone.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">Created {formatDate(zone.createdAt)}</p>
                    {zoneTeams.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {zoneTeams.map((t) => (
                          <span key={t._id} className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" title={t.teamLeadId?.name ? `Lead: ${t.teamLeadId.name}` : ''}>
                            <Users className="w-3 h-3 mr-1" />{t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(zone)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(zone)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {zones.length === 0 && (
            <div className="col-span-3 py-16 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No zones created yet</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingZone ? 'Edit Zone' : 'Create Zone'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <Plus className="w-5 h-5 text-gray-500 rotate-45" />
              </button>
            </div>
            <form id="zoneForm" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <label className="label">Zone Name <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. North, South..." />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label !mb-0">Teams</label>
                  <button type="button" onClick={addTeamRow} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />Add Team
                  </button>
                </div>
                {teamRows.length === 0 && (
                  <p className="text-xs text-gray-400">No teams yet. Add one or more to organize RMs under a Team Lead within this zone.</p>
                )}
                {teamRows.map((row) => (
                  <div key={row.key} className="flex gap-2 items-start border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        className="input-field text-sm"
                        placeholder="Team name"
                        value={row.name}
                        onChange={(e) => updateTeamRow(row.key, 'name', e.target.value)}
                      />
                      <select
                        className="input-field text-sm"
                        value={row.teamLeadId}
                        onChange={(e) => updateTeamRow(row.key, 'teamLeadId', e.target.value)}
                      >
                        <option value="">Select team lead...</option>
                        {teamLeads.map((tl) => <option key={tl._id} value={tl._id}>{tl.name}</option>)}
                      </select>
                    </div>
                    {!row._id && (
                      <button type="button" onClick={() => removeTeamRow(row.key)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </form>
            <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button type="submit" form="zoneForm" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneManagement;
