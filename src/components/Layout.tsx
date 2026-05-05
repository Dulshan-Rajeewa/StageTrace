import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  GitBranch,
  Settings,
  Moon,
  Sun,
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = window.localStorage.getItem('stagetrace-theme');

    if (savedTheme === 'light') {
      return false;
    }

    if (savedTheme === 'dark') {
      return true;
    }

    return true;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      window.localStorage.setItem('stagetrace-theme', 'dark');
      return;
    }

    root.classList.remove('dark');
    window.localStorage.setItem('stagetrace-theme', 'light');
  }, [isDarkMode]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Logo/Brand */}
        <div className="border-b border-gray-200 p-5 dark:border-zinc-800">
          <h1 className="text-xl font-semibold tracking-tight">StageTrace</h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">
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
                className={`flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border-gray-200 border-l-2 border-l-gray-600 bg-gray-100 font-medium text-gray-900 dark:border-zinc-700 dark:border-l-zinc-300 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-3 border-t border-gray-200 p-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Toggle theme"
          >
            <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <p className="text-xs text-gray-500 dark:text-zinc-500">v1.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
