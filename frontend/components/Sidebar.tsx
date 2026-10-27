'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Video, 
  CalendarClock, 
  History, 
  BarChart3, 
  Award, 
  Network, 
  Settings as SettingsIcon,
  GraduationCap,
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Enrollment', href: '/enrollment', icon: UserPlus },
  { name: 'Live Attendance', href: '/live', icon: Video, badge: 'LIVE' },
  { name: 'Attendance Sessions', href: '/sessions', icon: CalendarClock },
  { name: 'Attendance History', href: '/history', icon: History },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Evaluation', href: '/evaluation', icon: Award },
  { name: 'Architecture', href: '/architecture', icon: Network },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  // If on login page, don't show sidebar
  if (pathname === '/') return null;

  return (
    <aside className="w-64 bg-navy-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md z-40 select-none">
      <div>
        {/* Brand / Institution Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-navy-950 font-bold shadow-lg shadow-gold-500/20">
              <GraduationCap className="w-6 h-6 text-navy-900" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">
                AI ATTENDANCE
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">GNIOT • Dept of AI & AI/DS</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500/20 to-transparent text-gold-400 border-l-2 border-gold-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-950/40">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit / Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
