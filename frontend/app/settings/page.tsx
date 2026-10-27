'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Zap, Clock, ShieldCheck, Check, User, Shield, Building, Mail, RotateCcw } from 'lucide-react';
import { api } from '@/services/api';
import { SystemSettings } from '@/types';
import { useFacultyProfile } from '@/hooks/useFacultyProfile';

const ROLE_PRESETS = [
  'Faculty In-Charge',
  'Assistant Professor',
  'Associate Professor',
  'Course Coordinator',
  'HOD - AI & DS',
];

export default function SettingsPage() {
  const { profile, updateProfile, resetProfile } = useFacultyProfile();
  const [profileForm, setProfileForm] = useState({
    name: '',
    role: '',
    department: '',
    institute: '',
    email: '',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: profile.name || 'Faculty Portal',
      role: profile.role || 'Faculty In-Charge',
      department: profile.department || 'Department of AI / AI&DS',
      institute: profile.institute || 'Greater Noida Institute of Technology (GNIOT)',
      email: profile.email || 'faculty@gniot.net.in',
    });
  }, [profile]);

  const [config, setConfig] = useState<SystemSettings>({
    recognition_threshold: 0.55,
    total_intervals: 5,
    required_verified_intervals: 3,
    is_demo_mode: true,
    demo_burst_duration: 5,
    demo_interval_duration: 15,
    real_burst_duration: 30,
    real_interval_duration: 600,
    enable_liveness: true,
    camera_source: '0',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      setConfig(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: profileForm.name.trim() || 'Faculty Portal',
      role: profileForm.role.trim() || 'Faculty In-Charge',
      department: profileForm.department.trim(),
      institute: profileForm.institute.trim(),
      email: profileForm.email.trim(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleResetProfile = async () => {
    await resetProfile();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      alert('Failed to save settings: ' + e.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-5 rounded-2xl glass-panel border border-slate-700/80">
        <h1 className="text-xl font-bold text-white">System Configuration & Parameters</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Customise faculty identity, FAISS recognition thresholds, interval scheduling, and liveness verification
        </p>
      </div>

      {/* Faculty Profile Card */}
      <form onSubmit={handleProfileSubmit} className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Faculty In-Charge Profile
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configures the faculty name and designation shown in the top navbar and new attendance sessions
              </p>
            </div>
          </div>
          {profileSaved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Profile Saved!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Faculty / Portal Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="e.g. Dr. Amit Sharma or Faculty Portal"
                className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Designation / Role <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                required
                value={profileForm.role}
                onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                placeholder="e.g. Faculty In-Charge or Assistant Professor"
                className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Department</label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                placeholder="e.g. Department of AI / AI&DS"
                className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Faculty Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="e.g. faculty@gniot.net.in"
                className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>

        {/* Quick Role Preset Chips */}
        <div className="flex flex-wrap gap-1.5 items-center pt-1">
          <span className="text-[10px] text-slate-400 mr-1">Quick presets:</span>
          {ROLE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setProfileForm({ ...profileForm, role: preset })}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border ${
                profileForm.role === preset
                  ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetProfile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs shadow-md shadow-gold-500/20 flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Faculty Profile</span>
          </button>
        </div>
      </form>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-6">
        {/* Core Verification Rules */}
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold-400" />
            Core Attendance Rule & Thresholds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Recognition Threshold (Cosine IP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.30"
                max="0.95"
                value={config.recognition_threshold}
                onChange={(e) => setConfig({ ...config, recognition_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-500">Default: 0.55 (Values &lt; threshold classified as UNKNOWN)</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Total Verification Intervals
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.total_intervals}
                onChange={(e) => setConfig({ ...config, total_intervals: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-500">Standard: 5 intervals</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Required Verified Intervals
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.required_verified_intervals}
                onChange={(e) => setConfig({ ...config, required_verified_intervals: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-500">Core rule: ≥ 3 / 5 → PRESENT</span>
            </div>
          </div>
        </div>

        {/* Demo Mode Configuration */}
        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-400" />
            Mode & Timing Acceleration
          </h2>

          <div className="p-4 rounded-xl bg-navy-950/60 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Enable Demo Mode (Accelerated Timings)</div>
                <div className="text-[11px] text-slate-400">
                  Runs complete 5-interval verification cycle in ~1.5 minutes with identical decision rules
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.is_demo_mode}
                onChange={(e) => setConfig({ ...config, is_demo_mode: e.target.checked })}
                className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-slate-300 mb-1">Demo Burst Duration (seconds)</label>
                <input
                  type="number"
                  min="2"
                  value={config.demo_burst_duration}
                  onChange={(e) => setConfig({ ...config, demo_burst_duration: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 bg-navy-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Demo Interval Gap (seconds)</label>
                <input
                  type="number"
                  min="5"
                  value={config.demo_interval_duration}
                  onChange={(e) => setConfig({ ...config, demo_interval_duration: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 bg-navy-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Real Mode Timings */}
        <div className="pt-4 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Real Burst Duration (seconds)</label>
              <input
                type="number"
                value={config.real_burst_duration}
                onChange={(e) => setConfig({ ...config, real_burst_duration: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-500">Default: 30 seconds</span>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Real Interval Cycle (seconds)</label>
              <input
                type="number"
                value={config.real_interval_duration}
                onChange={(e) => setConfig({ ...config, real_interval_duration: parseInt(e.target.value) || 600 })}
                className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
              />
              <span className="text-[10px] text-slate-500">Default: 600s (10 minutes)</span>
            </div>
          </div>
        </div>

        {/* Anti-Proxy / Liveness & Camera Source */}
        <div className="pt-4 border-t border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950/60 border border-slate-800">
            <div>
              <div className="font-semibold text-white">Enable Prototype Liveness Verification</div>
              <div className="text-[11px] text-slate-400">
                Uses multi-frame temporal micro-motion to flag static 2D photos or mobile display replays
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.enable_liveness}
              onChange={(e) => setConfig({ ...config, enable_liveness: e.target.checked })}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Camera Stream Source</label>
            <input
              type="text"
              value={config.camera_source}
              onChange={(e) => setConfig({ ...config, camera_source: e.target.value })}
              placeholder="0 (Webcam) or rtsp://..."
              className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-gold-400"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <Check className="w-4 h-4" />
              <span>Settings updated successfully!</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
