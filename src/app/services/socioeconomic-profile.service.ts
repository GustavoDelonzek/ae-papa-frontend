import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface SocioeconomicProfile {
    id?: number;
    patient_id: number;
    income_source?: any;
    housing_ownership?: string;
    construction_type?: string;
    sanitation_details?: any;
    number_of_rooms?: number;
    number_of_residents?: number;
    created_at?: string;
    updated_at?: string;
}

export interface SocioeconomicProfileResponse {
    data: SocioeconomicProfile;
}

@Injectable({
    providedIn: 'root'
})
export class SocioeconomicProfileService {

    constructor(private http: HttpClient) { }

    /**
     * Create new socioeconomic profile
     */
    createProfile(profileData: Partial<SocioeconomicProfile>): Observable<SocioeconomicProfileResponse> {
        return this.http.post<SocioeconomicProfileResponse>(`${API_URL}/socioeconomic-profiles`, profileData);
    }

    /**
     * Get socioeconomic profile by ID
     */
    getProfile(id: number): Observable<SocioeconomicProfileResponse> {
        return this.http.get<SocioeconomicProfileResponse>(`${API_URL}/socioeconomic-profiles/${id}`);
    }

    /**
     * Update socioeconomic profile
     */
    updateProfile(id: number, profileData: Partial<SocioeconomicProfile>): Observable<SocioeconomicProfileResponse> {
        return this.http.put<SocioeconomicProfileResponse>(`${API_URL}/socioeconomic-profiles/${id}`, profileData);
    }

    /**
     * Delete socioeconomic profile
     */
    deleteProfile(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/socioeconomic-profiles/${id}`);
    }
}
