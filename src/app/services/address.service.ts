import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';

export interface Address {
  id?: number;
  patient_id: number;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  cep: string;
  reference_point?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddressResponse {
  data: Address;
}

export interface AddressListResponse {
  data: Address[];
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  constructor(private http: HttpClient) {}

  /**
   * Criar novo endereço
   */
  createAddress(addressData: Address): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(`${API_URL}/addresses`, addressData);
  }

  /**
   * Obter endereço por ID
   */
  getAddress(id: number): Observable<AddressResponse> {
    return this.http.get<AddressResponse>(`${API_URL}/addresses/${id}`);
  }

  /**
   * Atualizar endereço
   */
  updateAddress(id: number, addressData: Partial<Address>): Observable<AddressResponse> {
    return this.http.patch<AddressResponse>(`${API_URL}/addresses/${id}`, addressData);
  }

  /**
   * Deletar endereço
   */
  deleteAddress(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/addresses/${id}`);
  }

  /**
   * Obter todos os endereços
   */
  getAllAddresses(): Observable<AddressListResponse> {
    return this.http.get<AddressListResponse>(`${API_URL}/addresses`);
  }
}
