import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit2, EyeOff, Eye, Trash2, Phone, Mail, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { directoryAPI } from '../api/directory';
import { DIRECTORY_DEPARTMENTS } from '../utils/constants';
import { classNames, getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'team-leaders', label: 'Team Leaders' },
  { key: 'relationship-managers', label: 'Relationship Managers' },
  { key: 'other', label: 'Other Members' },
];

const CATEGORY_LABELS = {
  leadership: 'Leadership',
  'team-leaders': 'Team Leaders',
  'relationship-managers': 'Relationship Managers',
  other: 'Other Members',
};

const ROLE_BADGE_CLASSES = {
  leadership: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'team-leaders': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'relationship-managers': 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  other: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const categoryOf = (role = '') => {
  if (role === 'Head of Department') return 'leadership';
  if (/Zonal Head|^Team Leader$|Sr\. Team Leader/i.test(role)) return 'team-leaders';
  if (/Relationship Manager/i.test(role)) return 'relationship-managers';
  return 'other';
};

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const AVATAR_SIZE = 256;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Could not read that image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });

const emptyForm = { name: '', role: '', department: DIRECTORY_DEPARTMENTS[0], phone: '', email: '', desc: '', visible: true };

const Directory = () => {
  const { user } = useAuth();
  const isHOD = user?.role === 'HOD';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoData, setPhotoData] = useState(null); // undefined-ish sentinel handling: null = no change / removed
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await directoryAPI.getAll();
      setMembers(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members
      .filter((m) => isHOD || m.visible !== false)
      .filter((m) =>
        !term ||
        m.name.toLowerCase().includes(term) ||
        m.role.toLowerCase().includes(term) ||
        m.department.toLowerCase().includes(term)
      )
      .filter((m) => !deptFilter || m.department === deptFilter)
      .filter((m) => activeTab === 'all' || categoryOf(m.role) === activeTab);
  }, [members, search, deptFilter, activeTab, isHOD]);

  const grouped = useMemo(() => {
    const groups = [];
    if (activeTab === 'other') {
      DIRECTORY_DEPARTMENTS.forEach((dept) => {
        const items = filtered.filter((m) => m.department === dept);
        if (items.length) groups.push({ key: dept, label: dept, items });
      });
    } else if (activeTab === 'all') {
      ['leadership', 'team-leaders', 'relationship-managers', 'other'].forEach((cat) => {
        const items = filtered.filter((m) => categoryOf(m.role) === cat);
        if (items.length) groups.push({ key: cat, label: CATEGORY_LABELS[cat], items });
      });
    } else {
      if (filtered.length) groups.push({ key: activeTab, label: CATEGORY_LABELS[activeTab], items: filtered });
    }
    return groups;
  }, [filtered, activeTab]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoData(undefined);
    setPhotoPreview('');
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditingId(member._id);
    setForm({
      name: member.name,
      role: member.role,
      department: member.department,
      phone: member.phone || '',
      email: member.email || '',
      desc: member.desc || '',
      visible: member.visible !== false,
    });
    setPhotoData(undefined);
    setPhotoPreview(member.photo || '');
    setShowModal(true);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > MAX_FILE_BYTES) { toast.error('Image must be smaller than 5MB'); return; }
    try {
      const dataUrl = await resizeImage(file);
      setPhotoData(dataUrl);
      setPhotoPreview(dataUrl);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error('Name and role are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (photoData !== undefined) payload.photo = photoData;
      if (editingId) {
        await directoryAPI.update(editingId, payload);
        toast.success('Member updated');
      } else {
        await directoryAPI.create(payload);
        toast.success('Member added');
      }
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (member) => {
    try {
      await directoryAPI.toggleVisibility(member._id);
      toast.success(member.visible === false ? 'Member is now visible' : 'Member hidden');
      fetchMembers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Permanently remove ${member.name} from the directory?`)) return;
    try {
      await directoryAPI.delete(member._id);
      toast.success('Member removed');
      fetchMembers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Team Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">B2B Agent Division &mdash; department directory &amp; contacts</p>
        </div>
        {isHOD && (
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add Member</button>
        )}
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search by name, role, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field w-auto" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {DIRECTORY_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {filtered.length} member{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={classNames(
              'px-4 py-2 rounded-full text-sm font-semibold border transition-colors',
              activeTab === t.key
                ? 'bg-primary-700 border-primary-700 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : grouped.length === 0 ? (
        <div className="card py-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          No team members match your search. Try a different name, role or department.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{group.label}</h3>
                <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{group.items.length}</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((m) => {
                  const cat = categoryOf(m.role);
                  const hidden = m.visible === false;
                  return (
                    <div key={m._id} className={classNames('card p-4 flex flex-col gap-3', hidden && 'opacity-60')}>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary-600 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                          {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{m.name}</p>
                          <span className={classNames('badge mt-1', ROLE_BADGE_CLASSES[cat])}>{m.role}</span>
                        </div>
                      </div>
                      {m.desc && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{m.desc}</p>}
                      <div className="text-xs text-primary-700 dark:text-primary-400 flex flex-col gap-1 mt-auto">
                        {m.phone && <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="hover:underline flex items-center gap-1.5"><Phone className="w-3 h-3" />{m.phone}</a>}
                        {m.email && <a href={`mailto:${m.email}`} className="hover:underline flex items-center gap-1.5 break-all"><Mail className="w-3 h-3 flex-shrink-0" />{m.email}</a>}
                        <span className="text-gray-400 dark:text-gray-500">{m.department}{hidden ? ' · Hidden' : ''}</span>
                      </div>
                      {isHOD && (
                        <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggle(m)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={hidden ? 'Unhide' : 'Hide'}>
                            {hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDelete(m)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Member' : 'Add Member'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  {photoPreview
                    ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                    : <span className="text-primary-700 dark:text-primary-400 font-bold">{initials(form.name || '?')}</span>}
                </div>
                <label className="btn-secondary cursor-pointer">
                  <Camera className="w-4 h-4" />Choose Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Chirag Parmar" />
              </div>
              <div>
                <label className="label">Role / Title <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} required placeholder="e.g. Relationship Manager" />
              </div>
              <div>
                <label className="label">Department / Team</label>
                <select className="input-field" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                  {DIRECTORY_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="text" className="input-field" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="text" className="input-field" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@kanan.co" />
              </div>
              <div>
                <label className="label">Profile / What to contact for</label>
                <textarea className="input-field resize-none" rows={3} value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.visible} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))} />
                Visible in directory
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Member' : 'Add Member'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Directory;
