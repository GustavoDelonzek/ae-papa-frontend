export interface Document {
  id: number;
  patient_id: number;
  user_id: number;
  appointment_id?: number;
  file_name: string;
  file_path: string;
  document_type?: string;
  mime_type: string;
  description?: string;
  status: 'pending' | 'uploaded' | 'failed';
  public_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFilters {
  patient_id?: number;
  document_type?: string;
  status?: 'pending' | 'uploaded' | 'failed';
  name?: string;
  per_page?: number;
}

export interface DocumentUpload {
  file: File;
  patient_id: number;
  user_id: number;
  file_name: string;
  appointment_id?: number;
  document_type?: string;
  description?: string;
}

export interface DocumentsResponse {
  data: Document[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
