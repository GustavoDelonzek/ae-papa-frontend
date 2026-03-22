import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';
import { SocioeconomicProfile } from './socioeconomic-profile.service';
import { Caretaker } from './caretaker.service';
import { ClinicalRecord } from './clinical-record.service';

export interface Patient {
  id?: number;
  full_name: string;
  birth_date: string;
  gender: string;
  marital_status: string;
  cpf: string;
  rg?: string;
  photo?: string;
  profile_picture_url?: string;
  created_at?: string;
  updated_at?: string;
  socioeconomic_profile?: SocioeconomicProfile;
  caregivers?: Caretaker[];
  clinical_records?: ClinicalRecord[];
  contacts?: PatientContact[];
  addresses?: Address[];
}

export interface PatientContact {
  id?: number;
  type: string; // 'email', 'phone', 'whatsapp'
  value: string;
  is_primary: boolean;
  patient_id?: number | null;
}

export interface Address {
  id?: number;
  patient_id?: number;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  cep: string;
  reference_point?: string;
  state?: string; // Adding state mostly standard even if not in example payload
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

  constructor(private http: HttpClient) { }

  createPatient(patientData: Patient): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(`${API_URL}/patients`, patientData);
  }

  getPatients(page: number = 1, perPage: number = 15, filters: any = {}): Observable<PatientsListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());


    if (filters.search) params = params.set('search', filters.search.trim());
    if (filters.cpf) params = params.set('cpf', filters.cpf.trim());
    if (filters.full_name) params = params.set('full_name', filters.full_name.trim());
    if (filters.gender) params = params.set('gender', filters.gender);
    if (filters.age_filter || filters.ageFilter) {
      params = params.set('age_filter', filters.age_filter || filters.ageFilter);
    }
    if (filters.age_min) params = params.set('age_min', filters.age_min.toString());
    if (filters.age_max) params = params.set('age_max', filters.age_max.toString());
    if (filters.birth_year || filters.birthYear) {
      params = params.set('birth_year', (filters.birth_year || filters.birthYear).toString());
    }
    if (filters.created_at) params = params.set('created_at', filters.created_at);
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.sort_order) params = params.set('sort_order', filters.sort_order);

    return this.http.get<PatientsListResponse>(`${API_URL}/patients`, { params });
  }

  getPatientByCpf(cpf: string): Observable<PatientsListResponse> {
    const params = new HttpParams()
      .set('cpf', cpf)
      .set('per_page', '5');

    return this.http.get<PatientsListResponse>(`${API_URL}/patients`, { params });
  }

  getPatient(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${API_URL}/patients/${id}`);
  }

  updatePatient(id: number, patientData: Partial<Patient>): Observable<PatientResponse> {
    return this.http.patch<PatientResponse>(`${API_URL}/patients/${id}`, patientData);
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/patients/${id}`);
  }



  createContact(contact: PatientContact): Observable<any> {
    return this.http.post(`${API_URL}/contacts`, contact);
  }

  updateContact(id: number, contact: Partial<PatientContact>): Observable<any> {
    return this.http.patch(`${API_URL}/contacts/${id}`, contact);
  }

  deleteContact(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/contacts/${id}`);
  }



  createAddress(address: Address): Observable<any> {
    return this.http.post(`${API_URL}/addresses`, address);
  }

  updateAddress(id: number, address: Partial<Address>): Observable<any> {
    return this.http.patch(`${API_URL}/addresses/${id}`, address);
  }

  deleteAddress(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/addresses/${id}`);
  }

  uploadProfilePicture(id: number, file: File): Observable<PatientResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<PatientResponse>(`${API_URL}/patients/${id}/profile-picture`, formData);
  }
}