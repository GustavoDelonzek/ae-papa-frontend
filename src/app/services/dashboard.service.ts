import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface DashboardMetrics {
  patient_count: number;
  appointments_count: number;
  documents_count: number;
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
}
