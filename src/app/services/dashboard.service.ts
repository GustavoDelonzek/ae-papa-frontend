import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface DashboardMetrics {
  patient_count: number;
  appointments_count: number;
  documents_count: number;
}

export interface DashboardPeriod {
  start: string;
  end: string;
  months: number;
}

export interface DashboardMonthlyItem {
  month: string;
  total: number;
}

export interface DashboardPatientsActiveInactive {
  active: number;
  inactive: number;
}

export interface DashboardNewPatients {
  total: number;
  by_month: DashboardMonthlyItem[];
}

export interface DashboardAppointmentsByTypeItem {
  objective: string;
  total: number;
}

export interface DashboardCancelledAppointments {
  supported: boolean;
  reason?: string;
  total?: number;
}

export interface DashboardCanonicalTotals {
  patients_active: number;
  patients_inactive: number;
  new_patients: number;
  appointments: number;
  clinical_records: number;
  socioeconomic_profiles: number;
}

export interface DashboardLegacyTotalAlias {
  total?: number;
  count?: number;
}

export interface DashboardStatistics {
  period: DashboardPeriod;
  totals?: DashboardCanonicalTotals;
  appointments_by_month: DashboardMonthlyItem[];
  patients_active_inactive?: DashboardPatientsActiveInactive;
  new_patients?: DashboardNewPatients;
  appointments_by_type: DashboardAppointmentsByTypeItem[];
  cancelled_appointments: DashboardCancelledAppointments;

  // Legacy aliases kept by backend for temporary compatibility.
  clinical_records?: DashboardLegacyTotalAlias;
  socioeconomic_profiles?: DashboardLegacyTotalAlias;
  clinical_records_total?: number;
  clinical_records_count?: number;
  socioeconomic_profiles_total?: number;
  socioeconomic_profiles_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${API_URL}/dashboard`;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/metrics`);
  }

  getStatistics(months: number = 12): Observable<DashboardStatistics> {
    return this.http.get<DashboardStatistics>(`${this.apiUrl}/statistics`, {
      params: { months }
    });
  }
}
