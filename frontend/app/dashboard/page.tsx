'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Percent, 
  Video, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { useAttendanceWebSocket } from '@/hooks/useAttendanceWebSocket';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { stats } = useAttendanceWebSocket();

  const fetchDashboardData = async () => {
    try {
      const res = await api.getTodayAttendance();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-850 border border-slate-700/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">
              FACULTY MONITORING CONSOLE
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Department of AI & AI/DS Attendance Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Periodic Temporal Face Verification • Autonomous Multi-Interval Classroom Validation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/enrollment"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4 text-gold-400" />
            <span>Enroll Student</span>
          </Link>
          <Link
            href="/live"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 flex items-center gap-2 transition"
          >
            <Video className="w-4 h-4" />
            <span>Open Live Camera</span>
          </Link>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* TOTAL STUDENTS */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Total Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {loading ? '—' : data?.total_students || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Enrolled Students</div>
        </div>

        {/* PRESENT TODAY */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
              Present Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {loading ? '—' : data?.present_today || 0}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">≥ 3 / 5 Intervals Verified</div>
        </div>

        {/* ABSENT TODAY */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-rose-400 uppercase">
              Absent Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">
            {loading ? '—' : data?.absent_today || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">&lt; 3 Intervals Verified</div>
        </div>

        {/* CURRENT SESSION */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-gold-400 uppercase">
              Current Session
            </span>
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-sm font-bold text-slate-100 truncate">
            {stats?.session_status === 'ACTIVE' 
              ? `Session #${stats.session_id}` 
              : (data?.current_session || 'No Active Session')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${stats?.session_status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
            <span>{stats?.session_status === 'ACTIVE' ? `Interval ${stats.current_interval}/5` : 'Standby'}</span>
          </div>
        </div>

        {/* ATTENDANCE RATE */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Attendance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {loading ? '—' : `${data?.attendance_rate || 0}%`}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Verified Presence Ratio</div>
        </div>
      </div>

      {/* Today's Attendance Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/60 overflow-hidden">
        <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Today's Attendance Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live verification observations with multi-interval breakdown
            </p>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition"
          >
            <span>View Complete History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Student</th>
                <th className="py-3.5 px-4 font-semibold">Roll Number</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Intervals Breakdown (5 Intervals)</th>
                <th className="py-3.5 px-4 font-semibold">Verification Count</th>
                <th className="py-3.5 px-4 font-semibold">Confidence</th>
                <th className="py-3.5 px-4 font-semibold">Liveness</th>
                <th className="py-3.5 px-4 font-semibold">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : !data?.records || data.records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No attendance records for today yet. Start a session or open the live camera.
                  </td>
                </tr>
              ) : (
                data.records.map((rec: any) => {
                  const isPresent = rec.status === 'PRESENT';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {rec.student_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {rec.roll_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isPresent
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          {rec.status}
                        </span>
                      </td>
                      {/* 5-Interval Visual Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((i) => {
                            const passed = rec.intervals_detail?.[i.toString()];
                            return (
                              <div
                                key={i}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border ${
                                  passed
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-500 border-slate-700'
                                }`}
                                title={`Interval ${i}: ${passed ? 'Verified' : 'Not Verified'}`}
                              >
                                {passed ? '✓' : '—'}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">
                        {rec.verification_count}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {rec.confidence ? rec.confidence.toFixed(2) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {rec.liveness}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {rec.last_verified}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
