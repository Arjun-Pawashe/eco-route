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
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-16 px-5 flex items-center justify-between bg-white/95 border-b border-green-100 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
          aria-label="Go to dashboard"
        >
          <span className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
            <Leaf className="text-green-700" size={20} />
          </span>
          <span className="text-lg font-bold text-green-900">EcoRoute</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
          aria-label="Log out"
        >
          <LogOut size={19} />
        </button>
      </header>

      <aside className="w-64 shrink-0 bg-white border-r border-green-100 p-5 hidden md:flex flex-col h-screen sticky top-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-2 mb-9"
        >
          <span className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center">
            <Leaf className="text-green-700" size={24} />
          </span>
          <h1 className="text-xl font-bold text-green-950">EcoRoute</h1>
        </button>
        <nav className="space-y-2 flex-1" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition ${
                  isActive
                    ? 'bg-green-800 text-white font-semibold shadow-sm'
                    : 'text-gray-500 hover:bg-green-50 hover:text-green-800'
                }`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-2xl"
        >
          <LogOut size={19} /> Logout
        </button>
      </aside>

      <nav
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 h-16 px-2 bg-white/95 border border-green-100 shadow-[0_12px_40px_rgba(22,101,52,0.15)] rounded-2xl backdrop-blur grid grid-cols-4"
        aria-label="Mobile navigation"
      >
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition ${
                isActive ? 'text-green-800 font-bold' : 'text-gray-400'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label === 'Journey History' ? 'History' : label === 'Route Planner' ? 'Routes' : label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
