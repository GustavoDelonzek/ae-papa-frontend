import { Patient } from '../../services/patient.service';

export interface Appointment {
  id?: number;
  patient_id: number;
  user_id?: number;
  observations?: string;
  date: string; // formato: mm-dd-yyyy
  objective: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  patient?: Patient;
}

export interface AppointmentCreate {
  patient_id: number;
  user_id?: number;
  observations?: string;
  date: string;
  objective: string;
}

export interface AppointmentResponse {
  data: Appointment;
}

export interface AppointmentsListResponse {
  data: Appointment[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    path: string;
  };
}

export interface AppointmentFilters {
  patient_id?: number;
  user_id?: number;
  date?: string;
  status?: string;
  per_page?: number;
}
