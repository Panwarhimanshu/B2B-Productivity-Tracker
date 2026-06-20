import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { zonesAPI } from '../../api/zones';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ZoneManagement = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await zonesAPI.getAll();
      setZones(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  const openCreate = () => { setForm({ name: '', description: '' }); setEditingZone(null); setShowForm(true); };
  const openEdit = (zone) => { setForm({ name: zone.name, description: zone.description || '' }); setEditingZone(zone); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingZone) {
        await zonesAPI.update(editingZone._id, form);
        toast.success('Zone updated');
      } else {
        await zonesAPI.create(form);
        toast.success('Zone created');
      }
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
          {zones.map((zone) => (
            <div key={zone._id} className="card p-5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg mt-0.5">
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{zone.name}</h3>
                  {zone.description && <p className="text-xs text-gray-500 mt-0.5">{zone.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">Created {formatDate(zone.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(zone)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(zone)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingZone ? 'Edit Zone' : 'Create Zone'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <Plus className="w-5 h-5 text-gray-500 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Zone Name <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. North, South..." />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneManagement;
