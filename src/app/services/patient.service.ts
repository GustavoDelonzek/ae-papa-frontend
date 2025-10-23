import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface Patient {
  id?: number;
  full_name: string;
  birth_date: string;
  gender: string;
  marital_status: string;
  cpf: string;
  rg?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientResponse {
  data: Patient;
}

export interface PatientsListResponse {
  data: Patient[];
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

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  constructor(private http: HttpClient) {}

  /**
   * Criar novo paciente
   */
  createPatient(patientData: Patient): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(`${API_URL}/patients`, patientData);
  }

  /**
   * Obter lista de pacientes com paginação e filtros
   */
  getPatients(page: number = 1, perPage: number = 15, searchTerm?: string): Observable<PatientsListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    
    // Adicionar filtro de pesquisa se fornecido
    if (searchTerm && searchTerm.trim()) {
      params = params.set('full_name', searchTerm.trim());
    }
    
    return this.http.get<PatientsListResponse>(`${API_URL}/patients`, { params });
  }

  /**
   * Obter paciente por ID
   */
  getPatient(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${API_URL}/patients/${id}`);
  }

  /**
   * Atualizar paciente
   */
  updatePatient(id: number, patientData: Partial<Patient>): Observable<PatientResponse> {
    return this.http.patch<PatientResponse>(`${API_URL}/patients/${id}`, patientData);
  }

  /**
   * Deletar paciente
   */
  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/patients/${id}`);
  }
}