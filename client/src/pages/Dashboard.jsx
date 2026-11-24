import { useEffect, useState } from 'react';
import {
  Leaf,
  Route,
  MapPin,
  Cloud,
  TrendingDown,
  Award,
  Target,
  Navigation
} from 'lucide-react';
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
import TopNav from '../components/TopNav';
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
      unit: 'saved trips',
      icon: Route,
      accent: 'bg-[#E8F0FE] text-[#1A73E8]'
    },
    {
      title: 'Distance Travelled',
      value: stats.totalDistance,
      unit: 'km',
      icon: MapPin,
      accent: 'bg-[#E8F0FE] text-[#1A73E8]'
    },
    {
      title: 'Carbon Emitted',
      value: stats.totalCarbonEmission,
      unit: 'kg CO₂e',
      icon: Cloud,
      accent: 'bg-[#FCE8E6] text-[#D93025]'
    },
    {
      title: 'Carbon Saved',
      value: stats.totalCarbonSaved,
      unit: 'kg CO₂e',
      icon: TrendingDown,
      accent: 'bg-[#E6F4EA] text-[#188038]'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1A73E8] mb-1">
              Carbon Analytics
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#202124]">
              Impact Dashboard
            </h1>
            <p className="text-[#5F6368] mt-1 text-sm">
              Real-time summary of your saved Google Maps journeys and CO₂e reductions.
            </p>
          </div>

          <button
            onClick={() => navigate('/route-planner')}
            className="inline-flex items-center gap-2 bg-[#1A73E8] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#1765CC] shadow-sm transition self-start sm:self-auto cursor-pointer"
          >
            <Navigation size={16} />
            Plan a Route
          </button>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <p className="text-[#5F6368] text-sm">Loading statistics...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white p-5 rounded-2xl border border-[#DADCE0] shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-[#5F6368] text-sm font-medium">{card.title}</p>
                    <div className={`p-2.5 rounded-full ${card.accent}`}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold tracking-[-0.02em] text-[#202124] mt-4">
                    {card.value}
                  </h3>
                  <p className="text-[#5F6368] text-xs mt-1">{card.unit}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Environmental Contribution */}
        <div className="bg-white rounded-2xl p-6 mt-6 border border-[#DADCE0] shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="text-[#188038]" size={18} />
            <h2 className="text-base font-semibold text-[#202124]">
              Environmental Contribution
            </h2>
          </div>
          <p className="text-[#5F6368] text-sm">
            Based on {stats.totalCarbonSaved} kg CO₂e saved across your recorded journeys.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-[#E6F4EA] rounded-xl p-4">
              <p className="text-xs font-medium text-[#137333]">Trees / year (approx.)</p>
              <p className="text-2xl font-bold text-[#202124] mt-1">{equivalents.trees}</p>
              <p className="text-xs text-[#137333] mt-1">~21 kg CO₂ per tree</p>
            </div>
            <div className="bg-[#E8F0FE] rounded-xl p-4">
              <p className="text-xs font-medium text-[#1967D2]">Phone charges (approx.)</p>
              <p className="text-2xl font-bold text-[#202124] mt-1">
                {equivalents.phoneCharges.toLocaleString()}
              </p>
              <p className="text-xs text-[#1967D2] mt-1">~0.008 kg per charge</p>
            </div>
            <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E8EAED]">
              <p className="text-xs font-medium text-[#5F6368]">Petrol avoided (approx.)</p>
              <p className="text-2xl font-bold text-[#202124] mt-1">
                {equivalents.petrolLiters} L
              </p>
            </div>
            <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E8EAED]">
              <p className="text-xs font-medium text-[#5F6368]">Green streak</p>
              <p className="text-2xl font-bold text-[#202124] mt-1">
                {greenStreak} days
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Goal & Eco Badges */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="text-[#1A73E8]" size={20} />
                <h2 className="text-base font-semibold text-[#202124]">
                  Monthly CO₂ Savings Goal
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                {monthlyGoal.percent}%
              </span>
            </div>
            <p className="text-sm text-[#5F6368] mb-3">
              {monthlyGoal.savedKg} / {monthlyGoal.targetKg} kg CO₂e saved
              {monthlyGoal.month ? ` (${monthlyGoal.month})` : ''}
            </p>
            <div className="w-full h-3 bg-[#F1F3F4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#188038] rounded-full transition-all"
                style={{ width: `${monthlyGoal.percent}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#DADCE0] shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-[#1A73E8]" size={20} />
              <h2 className="text-base font-semibold text-[#202124]">Eco Badges</h2>
            </div>
            {badges.length === 0 ? (
              <p className="text-sm text-[#5F6368]">
                Save journeys from the route planner to earn badges.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.description}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      badge.earned
                        ? 'bg-[#E6F4EA] text-[#137333]'
                        : 'bg-[#F1F3F4] text-[#5F6368]'
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

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border border-[#DADCE0] rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-semibold text-[#202124] mb-4">
              Monthly Carbon Impact
            </h2>
            <div className="h-72">
              {charts.timeSeries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#5F6368]">
                  No recorded journeys yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.timeSeries}>
                    <XAxis dataKey="period" stroke="#5F6368" fontSize={12} />
                    <YAxis stroke="#5F6368" fontSize={12} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="carbonEmission"
                      stroke="#EA4335"
                      fill="#FCE8E6"
                      name="Emitted (kg)"
                    />
                    <Area
                      type="monotone"
                      dataKey="carbonSaved"
                      stroke="#188038"
                      fill="#E6F4EA"
                      name="Saved (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#DADCE0] rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-semibold text-[#202124] mb-4">
              Distance by Transport Mode
            </h2>
            <div className="h-72">
              {charts.transportModes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#5F6368]">
                  No recorded journeys yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.transportModes}>
                    <XAxis dataKey="mode" stroke="#5F6368" fontSize={12} />
                    <YAxis stroke="#5F6368" fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="distance"
                      fill="#1A73E8"
                      radius={[6, 6, 0, 0]}
                      name="Distance (km)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
