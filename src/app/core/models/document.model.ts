export interface Document {
  id: number;
  patient_id?: number | null;
  caregiver_id?: number | null;
  user_id: number;
  appointment_id?: number;
  file_name: string;
  file_path: string;
  document_type?: string;
  mime_type: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  public_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFilters {
  patient_id?: number | string;
  caregiver_id?: number | string;
  document_type?: string;
  status?: 'pending' | 'completed' | 'failed';
  name?: string;
  per_page?: number;
  page?: number;
  start_date?: string;
  end_date?: string;
}

export interface DocumentUpload {
  file: File;
  patient_id?: number;
  caregiver_id?: number;
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
