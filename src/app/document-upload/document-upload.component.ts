import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../services/document.service';
import { DocumentUpload } from '../core/models/document.model';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss']
})
export class DocumentUploadComponent {
  @Input() patientId!: number;
  @Input() user_id!: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  selectedFile: File | null = null;
  fileName = '';
  documentType = '';
  description = '';
  uploading = false;
  errorMessage = '';
  dragOver = false;

  constructor(private documentService: DocumentService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File): void {
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Tipo de arquivo não permitido. Use PDF, JPG, JPEG ou PNG.';
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.errorMessage = 'Arquivo muito grande. O tamanho máximo é 5MB.';
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.errorMessage = '';
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.fileName.trim()) {
      this.errorMessage = 'Selecione um arquivo e informe o nome.';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';

    const uploadData: DocumentUpload = {
      file: this.selectedFile,
      patient_id: this.patientId,
      user_id: this.user_id,
      file_name: this.fileName.trim(),
      document_type: this.documentType.trim() || undefined,
      description: this.description.trim() || undefined
    };

    this.documentService.uploadDocument(uploadData).subscribe({
      next: () => {
        this.uploading = false;
        this.onSuccess.emit();
        this.close();
      },
      error: (error: any) => {
        console.error('Erro ao fazer upload:', error);
        this.errorMessage = error.error?.message || 'Erro ao fazer upload do documento. Tente novamente.';
        this.uploading = false;
      }
    });
  }

  close(): void {
    this.onClose.emit();
  }

  getFileIcon(): string {
    if (!this.selectedFile) return 'fa-file';
    
    const type = this.selectedFile.type;
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('image')) return 'fa-file-image';
    return 'fa-file';
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    
    const bytes = this.selectedFile.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
