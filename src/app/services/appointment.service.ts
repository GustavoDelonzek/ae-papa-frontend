import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';
import { Appointment, AppointmentCreate, AppointmentResponse, AppointmentsListResponse, AppointmentFilters } from '../core/models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = `${API_URL}/appointments`;

  constructor(private http: HttpClient) { }

  /**
   * Criar novo agendamento
   */
  createAppointment(appointmentData: AppointmentCreate): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.apiUrl, appointmentData);
  }

  /**
   * Listar agendamentos com filtros
   */
  listAppointments(page: number, perPage: number, filters?: AppointmentFilters): Observable<AppointmentsListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', (filters?.per_page || perPage).toString());

    if (filters) {
      if (filters.patient_id) {
        params = params.set('patient_id', filters.patient_id.toString());
      }
      if (filters.user_id) {
        params = params.set('user_id', filters.user_id.toString());
      }
      if (filters.date) {
        params = params.set('date', filters.date);
      }
      if (filters.start_date) {
        params = params.set('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params = params.set('end_date', filters.end_date);
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.objective) {
        params = params.set('objective', filters.objective);
      }
    }

    return this.http.get<AppointmentsListResponse>(this.apiUrl, { params });
  }

  /**
   * Buscar agendamento por ID
   */
  getAppointment(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Atualizar agendamento
   */
  updateAppointment(id: number, appointmentData: Partial<AppointmentCreate>): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${this.apiUrl}/${id}`, appointmentData);
  }

  /**
   * Deletar agendamento
   */
  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
