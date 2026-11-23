import { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function Profile() {
  const { userProfile, setUserProfile } = useAuth();
  const [preference, setPreference] = useState('balanced');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.travelPreference) {
      setPreference(userProfile.travelPreference);
    }
  }, [userProfile]);

  const save = async () => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const res = await API.put('/users/preferences', {
        travelPreference: preference
      });
      setUserProfile(res.data.user);
      setMessage('Travel preference updated.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to update travel preference.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3F7] flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-5 pt-20 pb-24 md:p-10 md:pt-10 md:pb-10">
        <p className="text-xs font-semibold text-[#644DFF] mb-1.5">Settings</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#111018] mb-6">
          User <span className="text-[#644DFF]">Preferences</span>
        </h1>
        {!userProfile ? (
          <p className="text-[#6E6B7B] text-sm">Loading profile...</p>
        ) : (
          <div className="bg-[#FFFFFF] border border-[#E4E1F2] rounded-[20px] p-6 sm:p-8 max-w-xl shadow-sm">
            <div className="mb-6">
              <p className="text-xs text-[#9A96A6]">Name</p>
              <p className="font-semibold text-[#111018] mt-0.5">{userProfile.name}</p>
              <p className="text-xs text-[#9A96A6] mt-4">Email</p>
              <p className="font-semibold text-[#111018] mt-0.5">{userProfile.email}</p>
            </div>
            <label className="block text-sm font-medium text-[#111018] mb-2">
              Route preference
            </label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full bg-[#ECEAF3] text-[#111018] rounded-[10px] px-4 py-3 outline-none focus:ring-2 focus:ring-[#644DFF]"
            >
              <option value="lowest-carbon">Lowest carbon</option>
              <option value="balanced">Balanced</option>
              <option value="fastest">Fastest</option>
            </select>
            <button
              onClick={save}
              disabled={saving}
              className="mt-5 bg-[#644DFF] text-white font-semibold px-5 py-3 rounded-[10px] hover:bg-[#533CE6] disabled:opacity-60 transition cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Preference'}
            </button>
            {message && (
              <p className="bg-[#D9F7F4] text-[#0E9F96] text-sm font-medium p-3 rounded-[10px] mt-4">
                {message}
              </p>
            )}
            {error && (
              <p className="bg-[#FCE4E1] text-[#D94A38] text-sm font-medium p-3 rounded-[10px] mt-4">
                {error}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
