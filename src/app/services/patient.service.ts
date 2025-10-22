import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  links?: any;
  meta?: any;
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
   * Obter lista de pacientes
   */
  getPatients(): Observable<PatientsListResponse> {
    return this.http.get<PatientsListResponse>(`${API_URL}/patients`);
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