import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Cpu, LogOut } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Prediksi Kelulusan', href: '/predictions', icon: Activity },
    { name: 'Data Mahasiswa', href: '/students', icon: Users },
    { name: 'Training Model', href: '/training', icon: Cpu },
  ];

  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200 h-full shadow-sm">
      <div className="flex items-center justify-center h-20 border-b border-slate-100">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          SGP Platform
        </h1>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 transition-transform duration-200',
                    isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600',
                    isActive && 'scale-110'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-slate-100 p-4">
        <Link to="/login" className="flex-shrink-0 w-full group block">
          <div className="flex items-center text-slate-500 hover:text-red-600 transition-colors">
            <LogOut className="inline-block h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Keluar</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
