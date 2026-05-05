export interface Student {
  id: string;
  nisn: string;
  fullname: string;
  class: string;
  is_active: boolean;
  role: string;
  created_at: number;
}

export interface LeaveRequest {
  id: string;
  student_id: string;
  type: 'izin' | 'sakit';
  reason: string | null;
  attachment_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason: string | null;
  date_from: string | null;
  date_to: string | null;
  created_at: number;
  student?: { fullname: string; class: string; nisn: string };
}

export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  type: 'UTS' | 'UAS' | 'tugas';
  score: number;
  semester: number;
  year: number;
  student?: { fullname: string; nisn: string };
}

export interface AttendanceSummary {
  date: string;
  student_id: string;
  status: string;
  time_in: string | null;
  student?: { fullname: string; class: string };
}
