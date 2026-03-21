import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Document } from '../core/models/document.model';
import { DocumentService } from '../services/document.service';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss']
})
export class DocumentListComponent implements OnInit, OnDestroy {
  @Input() patientId!: number;
  @Output() onUploadClick = new EventEmitter<void>();

  documents: Document[] = [];
  loading = false;
  errorMessage = '';
  
  // Smart Polling
  private destroy$ = new Subject<void>();
  private pollingSubscription?: Subscription;
  private isPollingActive = false;

  // Filtros
  statusFilter: '' | 'pending' | 'completed' | 'failed' = '';

  selectedType: string = '';
  searchTerm = '';
  startDate: string = '';
  endDate: string = '';

  // Paginação
  currentPage = 1;
  lastPage = 1;
  perPage = 10;
  total = 0;

  constructor(private documentService: DocumentService) { }

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }

  trackById(index: number, doc: Document): number | undefined {
    return doc.id;
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    }
    return '';
  }

  private getFilters(page: number) {
    const formattedStartDate = this.formatDateForApi(this.startDate);
    const formattedEndDate = this.formatDateForApi(this.endDate);

    return {
      patient_id: this.patientId,
      per_page: this.perPage,
      page: page,
      ...(this.statusFilter && { status: this.statusFilter }),
      ...(this.searchTerm && { name: this.searchTerm }),
      ...(this.selectedType && { document_type: this.selectedType }),
      ...(formattedStartDate && { start_date: formattedStartDate }),
      ...(formattedEndDate && { end_date: formattedEndDate })
    };
  }

  private processResponse(response: any): void {
    this.documents = response.data;
    if (response.meta) {
      this.currentPage = response.meta.current_page;
      this.lastPage = response.meta.last_page;
      this.perPage = response.meta.per_page;
      this.total = response.meta.total;
    } else {
      this.currentPage = response.current_page;
      this.lastPage = response.last_page;
      this.perPage = response.per_page;
      this.total = response.total;
    }
  }

  loadDocuments(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';

    this.documentService.listDocuments(this.getFilters(page)).subscribe({
      next: (response: any) => {
        this.processResponse(response);
        this.loading = false;
        this.checkAndStartSmartPolling(page);
      },
      error: (error: any) => {
        console.error('Erro ao carregar documentos:', error);
        this.errorMessage = 'Erro ao carregar documentos. Tente novamente.';
        this.loading = false;
      }
    });
  }

  private checkAndStartSmartPolling(page: number): void {
    const hasPending = this.documents.some(doc => doc.status === 'pending');
    
    if (hasPending && !this.isPollingActive) {
      this.isPollingActive = true;
      
      this.pollingSubscription = timer(2500, 2500).pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.documentService.listDocuments(this.getFilters(page)))
      ).subscribe({
        next: (response: any) => {
          this.processResponse(response);
          
          const stillHasPending = this.documents.some(doc => doc.status === 'pending');
          if (!stillHasPending) {
            this.stopPolling();
          }
        },
        error: () => this.stopPolling()
      });
    } else if (!hasPending && this.isPollingActive) {
      this.stopPolling();
    }
  }

  private stopPolling(): void {
    this.isPollingActive = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  applyFilters(): void {
    this.stopPolling();
    this.currentPage = 1;
    this.loadDocuments();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.searchTerm = '';
    this.selectedType = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  clearDates(): void {
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendente',
      'completed': 'Enviado',
      'failed': 'Falhou'
    };
    return statusMap[status] || status;
  }

  getDocumentTypeText(type: string): string {
    if (!type) return '';
    const typeMap: { [key: string]: string } = {
      'exam': 'Exame',
      'medical_report': 'Laudo',
      'prescription': 'Receita',
      'report': 'Relatório',
      'referral': 'Referenciamento',
      'others': 'Outros'
    };
    return typeMap[type] || type;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getFileIcon(mimeType: string): string {
    if (!mimeType) return 'fa-file';
    if (mimeType.includes('pdf')) return 'fa-file-pdf';
    if (mimeType.includes('image')) return 'fa-file-image';
    if (mimeType.includes('word') || mimeType.includes('doc')) return 'fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fa-file-excel';
    return 'fa-file';
  }

  getFileTypeClass(mimeType: string): string {
    if (!mimeType) return '';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('doc')) return 'docx';
    return '';
  }

  getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
  }

  openDocument(doc: Document): void {
    if (doc.public_url && doc.status === 'completed') {
      this.documentService.openDocument(doc.public_url);
    }
  }



  deleteDocument(doc: Document): void {
    if (confirm(`Tem certeza que deseja excluir o documento "${doc.file_name}"?`)) {
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.loadDocuments();
        },
        error: (error: any) => {
          console.error('Erro ao deletar documento:', error);
          alert('Erro ao deletar documento. Tente novamente.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  uploadNewDocument(): void {
    this.onUploadClick.emit();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.lastPage <= maxVisible) {
      for (let i = 1; i <= this.lastPage; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.lastPage - 2) {
        for (let i = this.lastPage - 4; i <= this.lastPage; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  }
}
