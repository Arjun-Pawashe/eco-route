
import { useEffect, useState } from 'react';
import {
    Leaf, Route, MapPin, Cloud, TrendingDown,
    LayoutDashboard, History, Settings, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Dashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalJourneys: 0,
        totalDistance: 0,
        totalCarbonEmission: 0,
        totalCarbonSaved: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await API.get('/dashboard/stats');
                setStats(response.data.stats);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

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

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r p-6 hidden md:flex flex-col">
                <div className="flex items-center gap-2 mb-10">
                    <Leaf className="text-green-700" size={30} />
                    <h1 className="text-2xl font-bold text-green-800">
                        EcoRoute
                    </h1>
                </div>

                <nav className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 bg-green-100 text-green-800 p-3 rounded-lg font-semibold">
                        <LayoutDashboard size={20} />
                        Dashboard
                    </div>

                    <button
                        onClick={() => navigate('/route-planner')}
                        className="flex items-center gap-3 p-3 w-full hover:bg-green-50 rounded-lg text-gray-600"
                    >
                        <MapPin size={20} />
                        Route Planner
                    </button>

                    <button
                        onClick={() => navigate('/history')}
                        className="flex items-center gap-3 p-3 w-full hover:bg-green-50 rounded-lg text-gray-600"
                    >
                        <History size={20} />
                        Journey History
                    </button>

                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 p-3 w-full hover:bg-green-50 rounded-lg text-gray-600"
                    >
                        <Settings size={20} />
                        Preferences
                    </button>
                </nav>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>

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
                </div>

            </main>
        </div>
    );
}

export default Dashboard;
