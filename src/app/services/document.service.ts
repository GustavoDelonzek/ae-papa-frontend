import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../consts';
import { Document, DocumentFilters, DocumentUpload, DocumentsResponse } from '../core/models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${API_URL}/documents`;

  constructor(private http: HttpClient) {}

  /**
   * Upload de documento
   */
  uploadDocument(documentData: DocumentUpload): Observable<Document> {
    const formData = new FormData();
    
    formData.append('file', documentData.file);
    formData.append('patient_id', documentData.patient_id.toString());
    formData.append('user_id', documentData.user_id.toString());
    formData.append('file_name', documentData.file_name);
    
    if (documentData.appointment_id) {
      formData.append('appointment_id', documentData.appointment_id.toString());
    }
    
    if (documentData.document_type) {
      formData.append('document_type', documentData.document_type);
    }
    
    if (documentData.description) {
      formData.append('description', documentData.description);
    }

    return this.http.post<Document>(this.apiUrl, formData);
  }

  /**
   * Listar documentos com filtros
   */
  listDocuments(filters?: DocumentFilters): Observable<DocumentsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.patient_id) {
        params = params.set('patient_id', filters.patient_id.toString());
      }
      if (filters.document_type) {
        params = params.set('document_type', filters.document_type);
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.name) {
        params = params.set('name', filters.name);
      }
      if (filters.per_page) {
        params = params.set('per_page', filters.per_page.toString());
      }
    }

    return this.http.get<DocumentsResponse>(this.apiUrl, { params });
  }

  /**
   * Buscar documento por ID
   */
  getDocument(id: number): Observable<{ data: Document }> {
    return this.http.get<{ data: Document }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Deletar documento
   */
  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Abrir documento em nova aba
   */
  openDocument(publicUrl: string): void {
    window.open(publicUrl, '_blank');
  }

  /**
   * Baixar documento
   */
  downloadDocument(publicUrl: string, fileName: string): void {
    fetch(publicUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
  }
}
