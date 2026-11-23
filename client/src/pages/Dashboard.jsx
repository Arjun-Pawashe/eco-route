
import { useEffect, useState } from 'react';
import {
    Leaf, Route, MapPin, Cloud, TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await API.get('/dashboard/stats');
                setStats(response.data.stats);
                setCharts(response.data.charts || { timeSeries: [], transportModes: [] });
                setGreenStreak(response.data.greenStreak || 0);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
        <div className="min-h-screen bg-slate-50 flex">

            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10">

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">
                            Dashboard
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Track your journeys and environmental impact.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/route-planner')}
                        className="bg-green-700 text-white px-5 py-3 rounded-lg hover:bg-green-800"
                    >
                        + Plan a Journey
                    </button>
                </div>

                {/* Welcome Card */}
                <div className="bg-green-800 text-white rounded-2xl p-7 mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <Leaf size={28} />
                        <span className="font-semibold">EcoRoute Impact</span>
                    </div>

                    <h3 className="text-2xl font-bold">
                        Every greener journey counts!
                    </h3>

                    <p className="text-green-100 mt-2">
                        Choose smarter routes and contribute to a
                        sustainable future.
                    </p>
                </div>

                {/* Statistics */}
                <h3 className="text-xl font-bold text-gray-800 mb-5">
                    Your Travel Statistics
                </h3>

                {loading ? (
                    <p className="text-gray-500">Loading statistics...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                        {cards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <div
                                    key={card.title}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-500 text-sm">
                                            {card.title}
                                        </p>

                                        <div className="bg-green-100 p-3 rounded-lg">
                                            <Icon className="text-green-700" size={22} />
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-bold text-gray-800 mt-5">
                                        {card.value}
                                    </h3>

                                    <p className="text-gray-400 text-sm mt-1">
                                        {card.unit}
                                    </p>
                                </div>
                            );
                        })}

                    </div>
                )}

                <div className="bg-white rounded-xl p-6 mt-8 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Your Environmental Contribution
                    </h3>

                    <p className="text-gray-500">
                        You have saved {stats.totalCarbonSaved} kg CO₂e
                        through your recorded journeys.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">Equivalent trees / year</p>
                            <p className="text-2xl font-bold text-green-800">{(stats.totalCarbonSaved / 21).toFixed(1)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">Petrol avoided</p>
                            <p className="text-2xl font-bold text-green-800">{(stats.totalCarbonSaved / 2.31).toFixed(1)} L</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">Green streak</p>
                            <p className="text-2xl font-bold text-green-800">{greenStreak} days</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly carbon impact</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts.timeSeries}>
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="carbonEmission" stroke="#ef4444" fill="#fee2e2" name="Emitted" />
                                    <Area type="monotone" dataKey="carbonSaved" stroke="#16a34a" fill="#dcfce7" name="Saved" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Distance by transport mode</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.transportModes}>
                                    <XAxis dataKey="mode" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="distance" fill="#16a34a" name="Distance (km)" />
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
