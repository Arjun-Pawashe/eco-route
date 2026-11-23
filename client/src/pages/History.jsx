import { useEffect, useMemo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function History() {
  const [journeys, setJourneys] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/journeys')
      .then((res) => setJourneys(res.data.journeys || []))
      .catch((err) =>
        setError(err.response?.data?.message || 'Could not load journeys')
      )
      .finally(() => setLoading(false));
  }, []);

  const modes = useMemo(
    () => ['all', ...new Set(journeys.map((j) => j.transportMode))],
    [journeys]
  );
  const visible =
    filter === 'all'
      ? journeys
      : journeys.filter((j) => j.transportMode === filter);

  const exportCsv = () => {
    if (visible.length === 0) return;
    const headers = [
      'Date',
      'Origin',
      'Destination',
      'Mode',
      'Distance (km)',
      'Duration (min)',
      'CO2e Emitted (kg)',
      'CO2e Saved (kg)'
    ];
    const rows = visible.map((j) => [
      new Date(j.createdAt).toISOString().slice(0, 10),
      j.origin?.name || '',
      j.destination?.name || '',
      j.transportMode || '',
      Number(j.distance || 0).toFixed(2),
      j.duration ?? 0,
      Number(j.carbonEmission || 0).toFixed(2),
      Number(j.carbonSaved || 0).toFixed(2)
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvField).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecoroute-journeys.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const removeJourney = async (id) => {
    const previous = journeys;
    setJourneys((current) => current.filter((j) => j._id !== id));
    try {
      await API.delete(`/journeys/${id}`);
    } catch (err) {
      setJourneys(previous);
      setError(err.response?.data?.message || 'Could not delete journey');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3F7] flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-5 pt-20 pb-24 md:p-10 md:pt-10 md:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-[#644DFF] mb-1.5">Trips</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#111018]">
              Journey <span className="text-[#644DFF]">History</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="inline-flex items-center gap-2 bg-[#FFFFFF] border-[1.5px] border-[#14121D] text-[#111018] px-4 py-2.5 rounded-[10px] text-sm font-semibold hover:bg-[#ECEAF3] disabled:opacity-50 self-start sm:self-auto transition cursor-pointer"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3.5 py-1.5 rounded-[8px] text-sm font-medium capitalize transition cursor-pointer ${
                filter === mode
                  ? 'bg-[#111018] text-white'
                  : 'bg-[#ECEAF3] text-[#111018] hover:bg-[#E5E0FF] hover:text-[#5D45F8]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        {loading && <p className="text-[#6E6B7B] text-sm">Loading journeys...</p>}
        {error && (
          <p className="bg-[#FCE4E1] text-[#D94A38] text-sm font-medium p-3 rounded-[10px] mb-4">
            {error}
          </p>
        )}
        <div className="space-y-4">
          {visible.map((journey) => (
            <article key={journey._id} className="bg-[#FFFFFF] border border-[#E4E1F2] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#111018]">
                    {journey.origin.name} → {journey.destination.name}
                  </p>
                  <p className="text-sm text-[#6E6B7B] capitalize mt-1">
                    {journey.transportMode} ·{' '}
                    {new Date(journey.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeJourney(journey._id)}
                  className="text-[#D94A38] p-2 hover:bg-[#FCE4E1] rounded-[10px] transition cursor-pointer"
                  title="Delete journey"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Badge
                  label="Distance"
                  value={`${Number(journey.distance).toFixed(1)} km`}
                />
                <Badge label="Duration" value={`${journey.duration} min`} />
                <Badge
                  label="CO₂e emitted"
                  value={`${Number(journey.carbonEmission).toFixed(2)} kg`}
                />
                <Badge
                  label="CO₂e saved"
                  value={`${Number(journey.carbonSaved).toFixed(2)} kg`}
                  highlight
                />
              </div>
              {journey.legs?.length > 0 && (
                <div className="mt-4 border-t border-[#E4E1F2] pt-3">
                  <p className="text-sm font-semibold text-[#111018] mb-2">Journey legs</p>
                  {journey.legs.map((leg, index) => (
                    <p
                      key={index}
                      className="text-sm text-[#6E6B7B] capitalize"
                    >
                      {leg.mode}: {Number(leg.distance).toFixed(1)} km ·{' '}
                      {leg.duration} min
                    </p>
                  ))}
                </div>
              )}
            </article>
          ))}
          {!loading && visible.length === 0 && (
            <p className="text-[#6E6B7B] text-sm">No journeys found.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function Badge({ label, value, highlight = false }) {
  return (
    <div className={`${highlight ? 'bg-[#D9F7F4]' : 'bg-[#F4F3F7]'} rounded-[10px] p-3`}>
      <p className={`text-xs ${highlight ? 'text-[#0E9F96]' : 'text-[#9A96A6]'}`}>{label}</p>
      <p className="font-semibold text-[#111018] mt-0.5">{value}</p>
    </div>
  );
}
