import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../services/appointment.service';
import { Router } from '@angular/router';
import { Appointment } from '../core/models/appointment.model';

@Component({
  selector: 'app-apointment-list',
  standalone: false,
  templateUrl: './apointment-list.html',
  styleUrl: './apointment-list.scss'
})
export class ApointmentList implements OnInit {

  appointments: Appointment[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  
  // Paginação
  currentPage: number = 1;
  perPage: number = 15;
  totalPages: number = 0;
  totalItems: number = 0;
  paginationMeta: any = null;
  
  // Filtros
  filterPatientId: number | undefined;
  filterDate: string = '';
  filterStatus: string = '';

  constructor(
    private router: Router,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    const filters: any = {
      per_page: this.perPage
    };

    if (this.filterPatientId) {
      filters.patient_id = this.filterPatientId;
    }
    if (this.filterDate) {
      filters.date = this.filterDate;
    }
    if (this.filterStatus) {
      filters.status = this.filterStatus;
    }

    this.appointmentService.listAppointments(page, this.perPage, filters).subscribe({
      next: (response) => {
        this.appointments = response.data;
        this.paginationMeta = response.meta;
        this.totalPages = response.meta.last_page;
        this.totalItems = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar consultas:', error);
        this.errorMessage = 'Erro ao carregar lista de consultas. Tente novamente.';
        this.loading = false;
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getObjectiveText(objective: string): string {
    const objectiveMap: { [key: string]: string } = {
      'donation': 'Doação',
      'project': 'Projeto',
      'treatment': 'Tratamento',
      'research': 'Pesquisa',
      'other': 'Outro'
    };
    return objectiveMap[objective] || objective;
  }

  getStatusClass(status: string): string {
    return status || 'pending';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  // Métodos de paginação
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.loadAppointments(page);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, this.currentPage + 2);
      
      if (this.currentPage <= 3) {
        end = Math.min(this.totalPages, 5);
      }
      if (this.currentPage > this.totalPages - 3) {
        start = Math.max(1, this.totalPages - 4);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  getPaginationInfo(): string {
    if (!this.paginationMeta) return '';
    
    const { from, to, total } = this.paginationMeta;
    return `Mostrando ${from} a ${to} de ${total} consultas`;
  }

  createAppointment(): void {
    this.router.navigate(['/criar-consulta']);
  }

  viewAppointment(id: number): void {
    this.router.navigate(['/consulta', id]);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAppointments(1);
  }

  clearFilters(): void {
    this.filterPatientId = undefined;
    this.filterDate = '';
    this.filterStatus = '';
    this.loadAppointments(1);
  }
}

