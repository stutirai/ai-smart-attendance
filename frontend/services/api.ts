const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = {
  // Authentication
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Failed to login');
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`);
    if (!res.ok) throw new Error('Failed to fetch faculty profile');
    return res.json();
  },

  updateProfile: async (data: { name: string; role: string; email?: string; department?: string; institute?: string }) => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update faculty profile');
    return res.json();
  },

  // Students
  getStudents: async () => {
    const res = await fetch(`${BASE_URL}/students`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  createStudent: async (data: { student_id: string; name: string; roll_number: string; department: string; section: string; email?: string }) => {
    const res = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create student' }));
      throw new Error(err.detail || 'Failed to create student');
    }
    return res.json();
  },

  captureSample: async (studentId: number, imageBase64?: string, targetPose?: string) => {
    const res = await fetch(`${BASE_URL}/students/${studentId}/samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64, target_pose: targetPose }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to capture face sample' }));
      throw new Error(err.detail || 'Failed to capture face sample');
    }
    return res.json();
  },

  getEnrollmentSummary: async (studentId: number) => {
    const res = await fetch(`${BASE_URL}/students/${studentId}/enrollment-summary`);
    if (!res.ok) throw new Error('Failed to fetch enrollment summary');
    return res.json();
  },

  deleteStudent: async (studentId: number) => {
    const res = await fetch(`${BASE_URL}/students/${studentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete student');
    return res.json();
  },

  // Sessions
  startSession: async (data: { subject: string; section: string; faculty_name: string; duration_minutes: number; is_demo_mode: boolean }) => {
    const res = await fetch(`${BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  stopSession: async () => {
    const res = await fetch(`${BASE_URL}/sessions/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop session');
    return res.json();
  },

  getActiveSession: async () => {
    const res = await fetch(`${BASE_URL}/sessions/active`);
    if (!res.ok) return null;
    return res.json();
  },

  getSessions: async () => {
    const res = await fetch(`${BASE_URL}/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  getSession: async (id: number) => {
    const res = await fetch(`${BASE_URL}/sessions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch session');
    return res.json();
  },

  // Attendance
  getTodayAttendance: async () => {
    const res = await fetch(`${BASE_URL}/attendance/today`);
    if (!res.ok) throw new Error('Failed to fetch today attendance');
    return res.json();
  },

  getAttendanceHistory: async (params?: { date_filter?: string; subject_filter?: string; section_filter?: string }) => {
    const q = new URLSearchParams();
    if (params?.date_filter) q.append('date_filter', params.date_filter);
    if (params?.subject_filter) q.append('subject_filter', params.subject_filter);
    if (params?.section_filter) q.append('section_filter', params.section_filter);
    const res = await fetch(`${BASE_URL}/attendance/history?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch attendance history');
    return res.json();
  },

  getLiveStats: async () => {
    const res = await fetch(`${BASE_URL}/attendance/live`);
    if (!res.ok) throw new Error('Failed to fetch live stats');
    return res.json();
  },

  // Evaluation
  getPptBenchmarks: async () => {
    const res = await fetch(`${BASE_URL}/evaluation/ppt-benchmarks`);
    if (!res.ok) throw new Error('Failed to fetch benchmarks');
    return res.json();
  },

  runEvaluation: async () => {
    const res = await fetch(`${BASE_URL}/evaluation/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run evaluation');
    return res.json();
  },

  // Reports
  getAnalytics: async () => {
    const res = await fetch(`${BASE_URL}/reports/analytics`);
    if (!res.ok) throw new Error('Failed to fetch student analytics');
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings: any) => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Vision
  captureFrame: async () => {
    const res = await fetch(`${BASE_URL}/vision/capture-frame`);
    if (!res.ok) throw new Error('Failed to capture frame');
    return res.json();
  },
};
