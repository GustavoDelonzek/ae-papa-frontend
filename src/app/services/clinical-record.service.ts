import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface ClinicalRecord {
    id?: number;
    patient_id: number;
    diagnosis_date: string;
    disease_stage?: string;
    comorbidities?: string[]; // Array of strings based on request
    responsible_doctor?: string;
    health_unit_location?: string;
    medications_usage?: string;

    // Evaluation fields
    recognizes_family?: string; // Request says string
    emotional_state?: string;   // Request says string
    wandering_risk?: boolean;
    verbal_communication?: boolean;
    disorientation_frequency?: boolean;
    has_falls_history?: boolean;
    needs_feeding_help?: boolean;
    needs_hygiene_help?: boolean;
    has_sleep_issues?: boolean;
    has_hallucinations?: boolean;
    reduced_mobility?: boolean;
    is_aggressive?: boolean;

    created_at?: string;
    updated_at?: string;
}

export interface ClinicalRecordResponse {
    data: ClinicalRecord;
    message?: string;
}

export interface ClinicalRecordsListResponse {
    data: ClinicalRecord[];
}

@Injectable({
    providedIn: 'root'
})
export class ClinicalRecordService {

    constructor(private http: HttpClient) { }

    getClinicalRecords(patientId: number): Observable<ClinicalRecordsListResponse> {
        // Usually filtered by patient on backend or separate endpoint? 
        // The user said "listagem ... também virão no get do patients". 
        // But we might need a dedicated GET if not using the patient include.
        // Assuming standard resource route for now:
        return this.http.get<ClinicalRecordsListResponse>(`${API_URL}/clinical-records?patient_id=${patientId}`);
    }

    createClinicalRecord(data: ClinicalRecord): Observable<ClinicalRecordResponse> {
        return this.http.post<ClinicalRecordResponse>(`${API_URL}/clinical-records`, data);
    }

    updateClinicalRecord(id: number, data: Partial<ClinicalRecord>): Observable<ClinicalRecordResponse> {
        return this.http.patch<ClinicalRecordResponse>(`${API_URL}/clinical-records/${id}`, data);
    }

    deleteClinicalRecord(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/clinical-records/${id}`);
    }
}
