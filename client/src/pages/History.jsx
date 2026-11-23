import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

export default function History() {
    const [journeys, setJourneys] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get('/journeys')
            .then(res => setJourneys(res.data.journeys || []))
            .catch(err => setError(err.response?.data?.message || 'Could not load journeys'))
            .finally(() => setLoading(false));
    }, []);

    const modes = useMemo(() => ['all', ...new Set(journeys.map(j => j.transportMode))], [journeys]);
    const visible = filter === 'all' ? journeys : journeys.filter(j => j.transportMode === filter);

    const removeJourney = async (id) => {
        setJourneys(current => current.filter(j => j._id !== id));
        try {
            await API.delete(`/journeys/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not delete journey');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Journey History</h1>
                <div className="flex gap-2 flex-wrap mb-6">
                    {modes.map(mode => (
                        <button key={mode} onClick={() => setFilter(mode)}
                            className={`px-4 py-2 rounded-full text-sm capitalize ${filter === mode ? 'bg-green-700 text-white' : 'bg-white border'}`}>
                            {mode}
                        </button>
                    ))}
                </div>
                {loading && <p className="text-gray-500">Loading journeys...</p>}
                {error && <p className="text-red-600 mb-4">{error}</p>}
                <div className="space-y-4">
                    {visible.map(journey => (
                        <article key={journey._id} className="bg-white border rounded-xl p-5">
                            <div className="flex justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800">{journey.origin.name} → {journey.destination.name}</p>
                                    <p className="text-sm text-gray-500 capitalize mt-1">{journey.transportMode} · {new Date(journey.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => removeJourney(journey._id)} className="text-red-600 p-2 hover:bg-red-50 rounded-lg" title="Delete journey">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                <Badge label="Distance" value={`${Number(journey.distance).toFixed(1)} km`} />
                                <Badge label="Duration" value={`${journey.duration} min`} />
                                <Badge label="CO₂e emitted" value={`${Number(journey.carbonEmission).toFixed(2)} kg`} />
                                <Badge label="CO₂e saved" value={`${Number(journey.carbonSaved).toFixed(2)} kg`} />
                            </div>
                            {journey.legs?.length > 0 && (
                                <div className="mt-4 border-t pt-3">
                                    <p className="text-sm font-semibold mb-2">Journey legs</p>
                                    {journey.legs.map((leg, index) => (
                                        <p key={index} className="text-sm text-gray-600 capitalize">
                                            {leg.mode}: {Number(leg.distance).toFixed(1)} km · {leg.duration} min
                                        </p>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                    {!loading && visible.length === 0 && <p className="text-gray-500">No journeys found.</p>}
                </div>
            </main>
        </div>
    );
}

function Badge({ label, value }) {
    return <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value}</p></div>;
}
