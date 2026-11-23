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
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-16 px-5 flex items-center justify-between bg-[#FFFFFF]/95 border-b border-[#E4E1F2] backdrop-blur">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5"
          aria-label="Go to dashboard"
        >
          <span className="w-9 h-9 rounded-[10px] bg-[#E5E0FF] flex items-center justify-center">
            <Leaf className="text-[#644DFF]" size={19} />
          </span>
          <span className="text-lg font-bold tracking-[-0.02em] text-[#111018]">EcoRoute</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-10 h-10 rounded-[10px] text-[#6E6B7B] hover:bg-[#FCE4E1] hover:text-[#D94A38] flex items-center justify-center transition"
          aria-label="Log out"
        >
          <LogOut size={19} />
        </button>
      </header>

      <aside className="w-64 shrink-0 bg-[#ECEAF3] border-r border-[#E4E1F2] p-5 hidden md:flex flex-col h-screen sticky top-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-2 mb-9"
        >
          <span className="w-10 h-10 rounded-[12px] bg-[#644DFF] flex items-center justify-center shadow-sm">
            <Leaf className="text-white" size={20} />
          </span>
          <h1 className="text-xl font-bold tracking-[-0.02em] text-[#111018]">EcoRoute</h1>
        </button>
        <nav className="space-y-1.5 flex-1" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm transition ${
                  isActive
                    ? 'bg-[#644DFF] text-white font-semibold shadow-sm'
                    : 'text-[#6E6B7B] hover:bg-[#E4E1F2]/70 hover:text-[#111018]'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.9} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-[#6E6B7B] hover:bg-[#FCE4E1] hover:text-[#D94A38] rounded-[10px] transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <nav
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 h-16 px-2 bg-[#FFFFFF]/95 border border-[#E4E1F2] shadow-[0_12px_36px_rgba(40,25,80,0.14)] rounded-2xl backdrop-blur grid grid-cols-4"
        aria-label="Mobile navigation"
      >
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition my-1 ${
                isActive ? 'bg-[#111018] text-white font-semibold' : 'text-[#6E6B7B]'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label === 'Journey History' ? 'History' : label === 'Route Planner' ? 'Routes' : label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
