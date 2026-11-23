import { useEffect, useState } from 'react';
import { Leaf, Route, MapPin, Cloud, TrendingDown, Award, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import { computeCarbonEquivalents } from '../utils/carbonCalculator';

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalJourneys: 0,
    totalDistance: 0,
    totalCarbonEmission: 0,
    totalCarbonSaved: 0
  });

  const [loading, setLoading] = useState(true);
  const [charts, setCharts] = useState({ timeSeries: [], transportModes: [] });
  const [greenStreak, setGreenStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [monthlyGoal, setMonthlyGoal] = useState({
    month: '',
    targetKg: 25,
    savedKg: 0,
    percent: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get('/dashboard/stats');
        setStats(response.data.stats);
        setCharts(response.data.charts || { timeSeries: [], transportModes: [] });
        setGreenStreak(response.data.greenStreak || 0);
        setBadges(response.data.badges || []);
        if (response.data.monthlyGoal) {
          setMonthlyGoal(response.data.monthlyGoal);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const equivalents = computeCarbonEquivalents(stats.totalCarbonSaved);

  const cards = [
    {
      title: 'Total Journeys',
      value: stats.totalJourneys,
      unit: 'journeys',
      icon: Route
    },
    {
      title: 'Distance Travelled',
      value: stats.totalDistance,
      unit: 'km',
      icon: MapPin
    },
    {
      title: 'Carbon Emitted',
      value: stats.totalCarbonEmission,
      unit: 'kg CO₂e',
      icon: Cloud
    },
    {
      title: 'Carbon Saved',
      value: stats.totalCarbonSaved,
      unit: 'kg CO₂e',
      icon: TrendingDown
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F3F7] flex">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-5 pt-20 pb-24 md:p-10 md:pt-10 md:pb-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#644DFF] mb-1.5">Overview</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#111018]">
              Impact <span className="text-[#644DFF]">Dashboard</span>
            </h2>
            <p className="text-[#6E6B7B] mt-2 max-w-xl text-sm">
              Track your journeys and environmental impact.
            </p>
          </div>

          <button
            onClick={() => navigate('/route-planner')}
            className="bg-[#644DFF] text-white font-semibold px-5 py-3 rounded-[10px] hover:bg-[#533CE6] shadow-sm transition self-start sm:self-auto cursor-pointer"
          >
            + Plan a Journey
          </button>
        </div>

        {/* Welcome Card */}
        <div className="relative overflow-hidden bg-[#281950] text-white rounded-[20px] p-7 md:p-9 mb-8 border border-[#644DFF]/30">
          <div className="absolute -right-12 -top-16 w-52 h-52 rounded-full border-[34px] border-[#644DFF]/25" />
          <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-[8px] bg-[#644DFF] flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </span>
            <span className="font-semibold text-sm text-[#E5E0FF]">EcoRoute Impact</span>
          </div>

          <h3 className="text-2xl font-bold tracking-[-0.02em]">Every greener journey counts</h3>

          <p className="text-[#E5E0FF]/80 mt-2 text-sm">
            Choose smarter routes and contribute to a sustainable future.
          </p>
          </div>
        </div>

        {/* Statistics */}
        <h3 className="text-lg font-semibold text-[#111018] mb-4">
          Travel Statistics
        </h3>

        {loading ? (
          <p className="text-[#6E6B7B] text-sm">Loading statistics...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E4E1F2] shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-[#6E6B7B] text-sm">{card.title}</p>

                    <div className="bg-[#E5E0FF] p-2.5 rounded-[10px]">
                      <Icon className="text-[#644DFF]" size={20} />
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold tracking-[-0.02em] text-[#111018] mt-5">
                    {card.value}
                  </h3>

                  <p className="text-[#9A96A6] text-xs mt-1">{card.unit}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#FFFFFF] rounded-2xl p-6 mt-6 border border-[#E4E1F2] shadow-sm">
          <h3 className="text-lg font-semibold text-[#111018] mb-1">
            Environmental Contribution
          </h3>

          <p className="text-[#6E6B7B] text-sm">
            You have saved {stats.totalCarbonSaved} kg CO₂e through your
            recorded journeys.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <div className="bg-[#D9F7F4] rounded-[12px] p-4">
              <p className="text-xs font-medium text-[#0E9F96]">Trees / year (approx.)</p>
              <p className="text-2xl font-bold text-[#111018] mt-1">
                {equivalents.trees}
              </p>
              <p className="text-xs text-[#0E9F96] mt-1">approx. 21 kg CO₂/tree</p>
            </div>
            <div className="bg-[#E5E0FF] rounded-[12px] p-4">
              <p className="text-xs font-medium text-[#5D45F8]">Phone charges (approx.)</p>
              <p className="text-2xl font-bold text-[#111018] mt-1">
                {equivalents.phoneCharges.toLocaleString()}
              </p>
              <p className="text-xs text-[#5D45F8] mt-1">approx. 0.008 kg/charge</p>
            </div>
            <div className="bg-[#F4F3F7] rounded-[12px] p-4 border border-[#E4E1F2]">
              <p className="text-xs font-medium text-[#6E6B7B]">Petrol avoided (approx.)</p>
              <p className="text-2xl font-bold text-[#111018] mt-1">
                {equivalents.petrolLiters} L
              </p>
            </div>
            <div className="bg-[#F4F3F7] rounded-[12px] p-4 border border-[#E4E1F2]">
              <p className="text-xs font-medium text-[#6E6B7B]">Green streak</p>
              <p className="text-2xl font-bold text-[#111018] mt-1">
                {greenStreak} days
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E4E1F2] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="text-[#644DFF]" size={20} />
                <h3 className="text-lg font-semibold text-[#111018]">
                  Monthly CO₂ Savings Goal
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[8px] bg-[#E5E0FF] text-[#5D45F8]">
                {monthlyGoal.percent}%
              </span>
            </div>
            <p className="text-sm text-[#6E6B7B] mb-3">
              {monthlyGoal.savedKg} / {monthlyGoal.targetKg} kg CO₂e saved
              {monthlyGoal.month ? ` (${monthlyGoal.month})` : ''}
            </p>
            <div className="w-full h-3 bg-[#ECEAF3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#644DFF] rounded-full transition-all"
                style={{ width: `${monthlyGoal.percent}%` }}
              />
            </div>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E4E1F2] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-[#644DFF]" size={20} />
              <h3 className="text-lg font-semibold text-[#111018]">
                Eco Badges
              </h3>
            </div>
            {badges.length === 0 ? (
              <p className="text-sm text-[#6E6B7B]">
                Log journeys to start earning badges.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.description}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold ${
                      badge.earned
                        ? 'bg-[#D9F7F4] text-[#0E9F96]'
                        : 'bg-[#ECEAF3] text-[#6E6B7B]'
                    }`}
                  >
                    {badge.earned ? '✓ ' : ''}
                    {badge.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#FFFFFF] border border-[#E4E1F2] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#111018] mb-4">
              Monthly carbon impact
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.timeSeries}>
                  <XAxis dataKey="period" stroke="#9A96A6" fontSize={12} />
                  <YAxis stroke="#9A96A6" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="carbonEmission"
                    stroke="#FF5D47"
                    fill="#FCE4E1"
                    name="Emitted"
                  />
                  <Area
                    type="monotone"
                    dataKey="carbonSaved"
                    stroke="#644DFF"
                    fill="#E5E0FF"
                    name="Saved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E4E1F2] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#111018] mb-4">
              Distance by transport mode
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.transportModes}>
                  <XAxis dataKey="mode" stroke="#9A96A6" fontSize={12} />
                  <YAxis stroke="#9A96A6" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="distance" fill="#0E9F96" radius={[6, 6, 0, 0]} name="Distance (km)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
