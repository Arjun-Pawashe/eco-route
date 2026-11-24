import { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';

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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1A73E8] mb-1">
          Settings
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#202124] mb-6">
          Account & Route Preferences
        </h1>

        {!userProfile ? (
          <p className="text-[#5F6368] text-sm">Loading profile...</p>
        ) : (
          <div className="bg-white border border-[#DADCE0] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-6 border-b border-[#E8EAED]">
              <p className="text-xs text-[#5F6368]">Name</p>
              <p className="font-semibold text-[#202124] mt-0.5">{userProfile.name}</p>
              <p className="text-xs text-[#5F6368] mt-4">Email</p>
              <p className="font-semibold text-[#202124] mt-0.5">{userProfile.email}</p>
            </div>

            <label className="block text-sm font-medium text-[#202124] mb-2">
              Default route priority
            </label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] rounded-xl px-4 py-3 outline-none focus:border-[#1A73E8]"
            >
              <option value="lowest-carbon">Lowest carbon</option>
              <option value="balanced">Balanced (time & emissions)</option>
              <option value="fastest">Fastest (live traffic)</option>
            </select>

            <button
              onClick={save}
              disabled={saving}
              className="mt-5 bg-[#1A73E8] text-white font-semibold px-6 py-2.5 rounded-full hover:bg-[#1765CC] disabled:opacity-60 transition cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Preference'}
            </button>

            {message && (
              <p className="bg-[#E6F4EA] text-[#137333] text-sm font-medium p-3 rounded-xl mt-4">
                {message}
              </p>
            )}
            {error && (
              <p className="bg-[#FCE8E6] text-[#C5221F] text-sm font-medium p-3 rounded-xl mt-4">
                {error}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
