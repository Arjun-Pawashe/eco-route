import { useEffect, useMemo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import API from '../services/api';
import TopNav from '../components/TopNav';

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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1A73E8] mb-1">
              Trips
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#202124]">
              Journey History
            </h1>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="inline-flex items-center gap-2 bg-white border border-[#DADCE0] text-[#202124] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#F1F3F4] disabled:opacity-50 self-start sm:self-auto transition cursor-pointer"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition cursor-pointer ${
                filter === mode
                  ? 'bg-[#1A73E8] text-white'
                  : 'bg-white border border-[#DADCE0] text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {loading && <p className="text-[#5F6368] text-sm">Loading journeys...</p>}
        {error && (
          <p className="bg-[#FCE8E6] text-[#C5221F] text-sm font-medium p-3 rounded-xl mb-4">
            {error}
          </p>
        )}

        <div className="space-y-4">
          {visible.map((journey) => (
            <article
              key={journey._id}
              className="bg-white border border-[#DADCE0] rounded-2xl p-5 shadow-xs"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#202124]">
                    {journey.origin.name} → {journey.destination.name}
                  </p>
                  <p className="text-xs text-[#5F6368] capitalize mt-1">
                    {journey.transportMode} ·{' '}
                    {new Date(journey.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeJourney(journey._id)}
                  className="text-[#D93025] p-2 hover:bg-[#FCE8E6] rounded-full transition cursor-pointer self-start"
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
            </article>
          ))}
          {!loading && visible.length === 0 && (
            <div className="bg-white border border-[#DADCE0] rounded-2xl p-8 text-center">
              <p className="text-[#5F6368] text-sm">No journeys saved yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Badge({ label, value, highlight = false }) {
  return (
    <div
      className={`${
        highlight ? 'bg-[#E6F4EA]' : 'bg-[#F8F9FA] border border-[#E8EAED]'
      } rounded-xl p-3`}
    >
      <p className={`text-xs ${highlight ? 'text-[#137333]' : 'text-[#5F6368]'}`}>
        {label}
      </p>
      <p className="font-semibold text-[#202124] mt-0.5">{value}</p>
    </div>
  );
}
