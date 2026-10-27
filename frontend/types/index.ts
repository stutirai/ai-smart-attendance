export interface Student {
  id: number;
  student_id: string;
  name: string;
  roll_number: string;
  department: string;
  section: string;
  email?: string;
  sample_count: number;
  created_at: string;
}

export interface Interval {
  id: number;
  interval_index: number;
  status: 'PENDING' | 'BURST_ACTIVE' | 'COMPLETED';
  start_time?: string;
  end_time?: string;
  faces_detected_count: number;
  verified_students_count: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  roll_number: string;
  department: string;
  verified_intervals_count: number;
  total_intervals: number;
  final_status: 'PRESENT' | 'NOT_VERIFIED' | 'ABSENT';
  average_confidence: number;
  liveness_overall: string;
  intervals_detail: Record<string, boolean>;
  finalized_at: string;
}

export interface AttendanceSession {
  id: number;
  session_code: string;
  subject: string;
  section: string;
  faculty_name: string;
  duration_minutes: number;
  is_demo_mode: boolean;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  total_intervals: number;
  current_interval: number;
  start_time: string;
  end_time?: string;
  intervals: Interval[];
  records: AttendanceRecord[];
}

export interface DetectedFace {
  box: { x1: number; y1: number; x2: number; y2: number };
  identity: string;
  student_id?: number;
  roll_number?: string;
  confidence: number;
  is_known: boolean;
  liveness_status: string;
  liveness_score: number;
  yaw: number;
  pitch: number;
}

export interface LiveSystemStats {
  session_id?: number;
  session_status: string;
  current_interval: number;
  total_intervals: number;
  is_burst_active: boolean;
  burst_remaining_seconds: number;
  next_interval_in_seconds: number;
  is_demo_mode: boolean;
  camera_connected: boolean;
  fps: number;
  faces_detected: number;
  recognized_count: number;
  unknown_count: number;
  average_matching_latency_ms: number;
  active_students_verified: string[];
  student_intervals?: Record<string, Record<string, boolean>>;
  faces?: DetectedFace[];
}

export interface SystemSettings {
  recognition_threshold: number;
  total_intervals: number;
  required_verified_intervals: number;
  is_demo_mode: boolean;
  demo_burst_duration: number;
  demo_interval_duration: number;
  real_burst_duration: number;
  real_interval_duration: number;
  enable_liveness: boolean;
  camera_source: string;
}

export interface FacultyProfile {
  id?: number;
  name: string;
  role: string;
  email?: string;
  department?: string;
  institute?: string;
}
