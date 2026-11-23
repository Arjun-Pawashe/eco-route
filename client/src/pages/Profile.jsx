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
    <div className="min-h-screen bg-[#F7FAF7] flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-5 pt-20 pb-24 md:p-10 md:pt-10 md:pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-600 mb-2">Settings</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-green-950 mb-6">Preferences</h1>
        {!userProfile ? (
          <p className="text-gray-500">Loading profile...</p>
        ) : (
          <div className="bg-white border border-green-100 rounded-[2rem] p-6 sm:p-8 max-w-xl shadow-sm">
            <div className="mb-6">
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">{userProfile.name}</p>
              <p className="text-sm text-gray-500 mt-3">Email</p>
              <p className="font-semibold">{userProfile.email}</p>
            </div>
            <label className="block text-sm font-medium mb-2">
              Route preference
            </label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="lowest-carbon">Lowest carbon</option>
              <option value="balanced">Balanced</option>
              <option value="fastest">Fastest</option>
            </select>
            <button
              onClick={save}
              disabled={saving}
              className="mt-5 bg-green-700 text-white px-5 py-3 rounded-lg hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Preference'}
            </button>
            {message && <p className="text-green-700 mt-4">{message}</p>}
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
