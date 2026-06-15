import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  GitBranch,
  Settings,
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Incident Reports',
    path: '/incidents',
    icon: AlertCircle,
  },
  {
    name: 'Drift History',
    path: '/drift-history',
    icon: GitBranch,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },
];

export const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
  }, []);

  return (
    <div className="flex h-screen bg-[#0b0e14] text-white">
      {/* Sidebar */}
      <aside className="glass-panel flex w-64 flex-col !rounded-none border-r border-l-0 border-t-0 border-b-0 border-[rgba(0,243,255,0.1)]">
        {/* Logo/Brand */}
        <div className="border-b border-[rgba(0,243,255,0.1)] p-5">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            StageTrace
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-cyan-300/60">
            DevOps Configuration Drift
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                  isActive
                    ? 'border border-[#00f3ff] bg-[rgba(0,243,255,0.1)] font-medium text-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                    : 'border border-transparent text-cyan-200/80 hover:bg-[rgba(0,243,255,0.05)] hover:text-[#00f3ff]'
                }`}
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="glass-panel !rounded-none !border-0 !bg-transparent !backdrop-blur-none p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

