import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsersListResponse {
  data: User[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface CreateUserResponse {
  user: User;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${API_URL}/users`;

  constructor(private http: HttpClient) {}

  listUsers(): Observable<UsersListResponse> {
    return this.http.get<UsersListResponse>(this.apiUrl);
  }

  createUser(payload: CreateUserPayload): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.apiUrl, payload);
  }
}
