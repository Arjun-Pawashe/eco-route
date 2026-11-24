import {
  Leaf,
  Navigation,
  LayoutDashboard,
  History,
  Settings,
  LogOut
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/route-planner', label: 'Directions', icon: Navigation },
  { to: '/dashboard', label: 'Impact', icon: LayoutDashboard },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Settings', icon: Settings }
];

export default function TopNav() {
  const navigate = useNavigate();
  const { userProfile, currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const displayName =
    userProfile?.name || currentUser?.displayName || currentUser?.email || 'Account';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'E';

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur border-b border-[#DADCE0] px-4 lg:px-6 flex items-center justify-between gap-4 shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigate('/route-planner')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
          aria-label="Go to EcoRoute Directions"
        >
          <span className="w-9 h-9 rounded-full bg-[#E6F4EA] border border-[#CEEAD6] flex items-center justify-center group-hover:bg-[#CEEAD6] transition">
            <Leaf className="text-[#188038]" size={18} />
          </span>
          <div className="text-left leading-tight">
            <span className="text-[18px] font-semibold tracking-[-0.02em] text-[#202124]">
              Eco<span className="text-[#1A73E8]">Route</span>
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-[#5F6368]">
              Google Maps Carbon Navigation
            </span>
          </div>
        </button>

        {/* Center Top-Bar Navigation */}
        <nav
          className="hidden md:flex items-center gap-1 bg-[#F1F3F4] p-1 rounded-full border border-[#E8EAED]"
          aria-label="Main navigation"
        >
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-[#1A73E8] shadow-sm'
                    : 'text-[#5F6368] hover:text-[#202124] hover:bg-white/60'
                }`
              }
            >
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right User Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="hidden sm:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] transition cursor-pointer"
            title="Account & Route Preferences"
          >
            <span className="w-7 h-7 rounded-full bg-[#1A73E8] text-white text-xs font-semibold flex items-center justify-center">
              {initial}
            </span>
            <span className="text-xs font-medium text-[#3C4043] max-w-[130px] truncate">
              {displayName}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[#5F6368] hover:bg-[#FCE8E6] hover:text-[#D93025] border border-transparent hover:border-[#FAD2CF] transition cursor-pointer"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 backdrop-blur border-t border-[#DADCE0] grid grid-cols-4 px-2"
        aria-label="Mobile navigation"
      >
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                isActive ? 'text-[#1A73E8]' : 'text-[#5F6368]'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
