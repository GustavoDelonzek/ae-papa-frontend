import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface ReportConfig {
  columns: string[];
  start_date?: string;
  end_date?: string;
  detail_level: 'complete' | 'resumed';
  format: 'pdf' | 'xlsx' | 'csv';
}

export interface ReportStats {
  patient_count: number;
  clinical_record_count: number;
  socioeconomic_profile_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(private http: HttpClient) { }

  getStats(startDate?: string, endDate?: string): Observable<ReportStats> {
    const params: Record<string, string> = {};

    if (startDate) {
      params['start_date'] = startDate;
    }

    if (endDate) {
      params['end_date'] = endDate;
    }

    return this.http.get<ReportStats>(`${API_URL}/reports/stats`, { params });
  }

  generateReport(config: ReportConfig): Observable<Blob> {
    return this.http.post(`${API_URL}/reports/generate`, config, {
      responseType: 'blob'
    });
  }
}
