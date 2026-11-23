import { Leaf, LayoutDashboard, MapPin, History, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/route-planner', label: 'Route Planner', icon: MapPin },
  { to: '/history', label: 'Journey History', icon: History },
  { to: '/profile', label: 'Preferences', icon: Settings }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r p-6 hidden md:flex flex-col min-h-screen">
      <div className="flex items-center gap-2 mb-10">
        <Leaf className="text-green-700" size={30} />
        <h1 className="text-2xl font-bold text-green-800">EcoRoute</h1>
      </div>
      <nav className="space-y-3 flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg ${
                isActive
                  ? 'bg-green-100 text-green-800 font-semibold'
                  : 'text-gray-600 hover:bg-green-50'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg"
      >
        <LogOut size={20} /> Logout
      </button>
    </aside>
  );
}
