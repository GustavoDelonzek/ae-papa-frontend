import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface PatientRelation {
  id: number;
  full_name: string;
  kinship: string;
}

export interface Caretaker {
  id?: number;
  full_name: string;
  cpf: string;
  rg?: string;
  birth_date: string;
  gender: string;
  education_level?: string;
  patients?: PatientRelation[];
  // Optional for creation payload
  patient_id?: number;
  kinship?: string;
  // Pivot data from N:N relationship
  pivot?: {
    patient_id: number;
    caregiver_id: number;
    kinship: string;
    created_at?: string;
    updated_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CaretakerResponse {
  data: Caretaker;
  message?: string;
}

export interface CaretakersListResponse {
  data: Caretaker[];
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
export class CaretakerService {

  constructor(private http: HttpClient) { }

  /**
   * Criar novo cuidador
   */
  createCaretaker(caretakerData: Caretaker): Observable<CaretakerResponse> {
    return this.http.post<CaretakerResponse>(`${API_URL}/caregivers`, caretakerData);
  }

  /**
   * Obter lista de cuidadores com paginação e filtros
   */
  getCaretakers(page: number = 1, perPage: number = 15, searchTerm?: string): Observable<CaretakersListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    // Adicionar filtro de pesquisa se fornecido
    if (searchTerm && searchTerm.trim()) {
      params = params.set('full_name', searchTerm.trim());
    }

    return this.http.get<CaretakersListResponse>(`${API_URL}/caregivers`, { params });
  }

  /**
   * Obter cuidador por ID
   */
  getCaretaker(id: number): Observable<CaretakerResponse> {
    return this.http.get<CaretakerResponse>(`${API_URL}/caregivers/${id}`);
  }

  /**
   * Atualizar cuidador (Dados pessoais apenas)
   */
  updateCaretaker(id: number, caretakerData: Partial<Caretaker>): Observable<CaretakerResponse> {
    return this.http.patch<CaretakerResponse>(`${API_URL}/caregivers/${id}`, caretakerData);
  }

  /**
   * Deletar cuidador
   */
  deleteCaretaker(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/caregivers/${id}`);
  }

  /**
   * Associar cuidador a paciente
   */
  linkPatient(caretakerId: number, patientId: number, kinship: string): Observable<any> {
    return this.http.post(`${API_URL}/caregivers/${caretakerId}/patients/${patientId}`, { kinship });
  }

  /**
   * Atualizar relacionamento (Kinship)
   */
  updatePatientRelation(caretakerId: number, patientId: number, kinship: string): Observable<any> {
    return this.http.patch(`${API_URL}/caregivers/${caretakerId}/patients/${patientId}`, { kinship });
  }

  /**
   * Remover associação com paciente
   */
  unlinkPatient(caretakerId: number, patientId: number): Observable<any> {
    return this.http.delete(`${API_URL}/caregivers/${caretakerId}/patients/${patientId}`);
  }
}
