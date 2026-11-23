import { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [preference, setPreference] = useState('balanced');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/auth/profile')
            .then(res => {
                setProfile(res.data.user);
                setPreference(res.data.user.travelPreference);
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setMessage('');
        const res = await API.put('/users/preferences', { travelPreference: preference });
        const user = res.data.user;
        setProfile(user);
        localStorage.setItem('user', JSON.stringify(user));
        setMessage('Travel preference updated.');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Preferences</h1>
                {loading ? <p className="text-gray-500">Loading profile...</p> : (
                    <div className="bg-white border rounded-xl p-6 max-w-xl">
                        <div className="mb-6">
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-semibold">{profile.name}</p>
                            <p className="text-sm text-gray-500 mt-3">Email</p>
                            <p className="font-semibold">{profile.email}</p>
                        </div>
                        <label className="block text-sm font-medium mb-2">Route preference</label>
                        <select value={preference} onChange={e => setPreference(e.target.value)}
                            className="w-full border rounded-lg px-4 py-3">
                            <option value="lowest-carbon">Lowest carbon</option>
                            <option value="balanced">Balanced</option>
                            <option value="fastest">Fastest</option>
                        </select>
                        <button onClick={save} className="mt-5 bg-green-700 text-white px-5 py-3 rounded-lg hover:bg-green-800">
                            Save Preference
                        </button>
                        {message && <p className="text-green-700 mt-4">{message}</p>}
                    </div>
                )}
            </main>
        </div>
    );
}
