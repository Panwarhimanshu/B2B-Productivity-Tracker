import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Hash, MapPin, Calendar, Shield, Camera, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { ROLE_LABELS } from '../utils/constants';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // accept up to 5MB before resizing
const AVATAR_SIZE = 256; // px, square output

// Resize an image file to a centered square and return a compressed JPEG data URL
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Could not read that image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <div className="mt-0.5 p-1.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
      <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">{value || '-'}</p>
    </div>
  </div>
);

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      const res = await authAPI.updateAvatar(dataUrl);
      setUser(res.data.data);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await authAPI.removeAvatar();
      setUser(res.data.data);
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove photo');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      {/* Avatar section */}
      <div className="card p-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-60 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 badge bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
            <Shield className="w-3 h-3" />
            {ROLE_LABELS[user?.role]}
          </span>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : user?.avatar ? 'Change photo' : 'Upload photo'}
            </button>
            {user?.avatar && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-60"
              >
                <Trash2 className="w-3 h-3" />
                {removing ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Account Details</h3>
        <InfoRow icon={User} label="Full Name" value={user?.name} />
        <InfoRow icon={Mail} label="Email Address" value={user?.email} />
        <InfoRow icon={Hash} label="Employee ID" value={user?.employeeId} />
        <InfoRow icon={Shield} label="Role" value={ROLE_LABELS[user?.role]} />
        <InfoRow icon={MapPin} label="Zone" value={user?.zoneId?.name} />
        <InfoRow icon={User} label="Reporting Manager" value={user?.teamLeadId?.name} />
        <InfoRow icon={Calendar} label="Joining Date" value={formatDate(user?.joiningDate)} />
        <InfoRow icon={Calendar} label="Account Created" value={formatDate(user?.createdAt)} />
      </div>
    </div>
  );
};

export default Profile;
