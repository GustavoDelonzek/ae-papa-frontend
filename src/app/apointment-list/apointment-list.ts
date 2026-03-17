import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { AppointmentService } from '../services/appointment.service';
import { PatientService, Patient } from '../services/patient.service';
import { Router } from '@angular/router';
import { Appointment, AppointmentCreate } from '../core/models/appointment.model';
import { TableColumn } from '../shared/components/shared-table/shared-table.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

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

  // Pagination Configuration
  paginationMeta: any = null;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal Detail
  showDetailsModal: boolean = false;
  selectedAppointment: Appointment | null = null;

  // Filtros
  searchTerm: string = '';
  statusFilter: string = '';
  dateFilter: string = '';
  objectiveFilter: string = '';

  // ========================================
  // Modal de Criação de Atendimento
  // ========================================
  showCreateModal: boolean = false;

  // Patient Search
  showPatientSearch: boolean = false;
  searchCpf: string = '';
  searching: boolean = false;
  searchResult: Patient | null = null;
  selectedPatient: Patient | null = null;

  // Form Fields
  appointmentDate: string = '';
  appointmentObjective: string = '';
  observations: string = '';
  submitting: boolean = false;
  currentUserId: number = 0;

  // Timeout para pesquisa com delay
  private searchTimeout: any;

  protected Math = Math;

  constructor(
    private router: Router,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || 0;
  }

  ngOnInit(): void {
    this.initialLoad();
  }



  initialLoad() {
    this.loadAppointments();
  }

  loadAppointments(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';

    const filters: any = {
      per_page: 15
    };

    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.dateFilter) filters.date = this.dateFilter;
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.objectiveFilter) filters.objective = this.objectiveFilter;

    if (this.sortColumn) {
      filters.sort_by = this.sortColumn;
      filters.sort_order = this.sortDirection;
    }

    console.log('Sending filters to backend (Appointments):', filters);

    this.appointmentService.listAppointments(page, 15, filters).subscribe({
      next: (response: any) => {
        this.appointments = response.data;
        this.paginationMeta = response.meta;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar consultas:', error);
        this.errorMessage = 'Erro ao carregar lista de atendimentos. Tente novamente.';
        this.loading = false;
      }
    });
  }

  // Event Handlers for Shared Table
  onSearch(term: string): void {
    this.searchTerm = term;

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.loadAppointments(1);
    }, 500);
  }

  onFilterChange(): void {
    this.loadAppointments(1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.dateFilter = '';
    this.objectiveFilter = '';
    this.loadAppointments(1);
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.statusFilter || this.dateFilter || this.objectiveFilter);
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadAppointments(1);
  }

  onPageChange(page: number): void {
    this.loadAppointments(page);
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  getObjectiveClass(objective: string): string {
    const map: { [key: string]: string } = {
      'donation': 'objective-donation',
      'treatment': 'objective-treatment',
      'exam': 'objective-exam'
    };
    return map[objective] || '';
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

  // ========================================
  // Modal de Criação
  // ========================================

  createAppointment(): void {
    // Abrir modal ao invés de navegar
    this.openCreateModal();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  // Patient Search Methods
  openPatientSearch(): void {
    this.showPatientSearch = true;
    this.searchCpf = '';
    this.searchResult = null;
  }

  closePatientSearch(): void {
    this.showPatientSearch = false;
    this.searchCpf = '';
    this.searchResult = null;
  }

  onSearchCpfChange(): void {
    let cpf = this.searchCpf.replace(/\D/g, '');
    if (cpf.length > 11) {
      cpf = cpf.substring(0, 11);
    }

    if (cpf.length > 9) {
      this.searchCpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (cpf.length > 6) {
      this.searchCpf = cpf.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (cpf.length > 3) {
      this.searchCpf = cpf.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    } else {
      this.searchCpf = cpf;
    }
  }

  searchPatientByCpf(): void {
    if (!this.searchCpf) return;

    this.searching = true;
    this.searchResult = null;

    const cpfOnly = this.searchCpf.replace(/\D/g, '');

    this.patientService.getPatientByCpf(cpfOnly).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          this.searchResult = response.data[0];
        } else {
          this.toastService.error('Atendido não encontrado');
        }
        this.searching = false;
      },
      error: (error) => {
        console.error('Erro ao buscar paciente:', error);
        this.toastService.error('Erro ao buscar atendido. Tente novamente.');
        this.searching = false;
      }
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.closePatientSearch();
  }

  // Form Submission
  submitAppointment(): void {
    if (!this.selectedPatient || !this.appointmentDate || !this.appointmentObjective) {
      this.toastService.warning('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!this.currentUserId) {
      this.toastService.error('Usuário não identificado. Faça login novamente.');
      return;
    }

    this.submitting = true;

    // Converter data do formato YYYY-MM-DD para MM-DD-YYYY
    const [year, month, day] = this.appointmentDate.split('-');
    const formattedDate = `${month}-${day}-${year}`;

    const appointmentData: AppointmentCreate = {
      patient_id: this.selectedPatient.id!,
      user_id: this.currentUserId,
      date: formattedDate,
      objective: this.appointmentObjective,
      observations: this.observations.trim() || undefined
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (response) => {
        this.toastService.success('Atendimento criado com sucesso!');
        this.submitting = false;
        this.closeCreateModal();
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Erro ao criar consulta:', error);
        this.toastService.error(error.error?.message || 'Erro ao criar atendimento. Tente novamente.');
        this.submitting = false;
      }
    });
  }

  resetForm(): void {
    this.selectedPatient = null;
    this.appointmentDate = '';
    this.appointmentObjective = '';
    this.observations = '';
    this.searchCpf = '';
    this.searchResult = null;
    this.showPatientSearch = false;
  }

  // ========================================
  // Details Modal
  // ========================================

  viewAppointment(id: number): void {
    const appointment = this.appointments.find(a => a.id === id);
    if (appointment) {
      this.selectedAppointment = appointment;
      this.showDetailsModal = true;
    }
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  onEditAppointment(appointment: Appointment): void {
    console.log('Edit appointment:', appointment);
    this.closeDetailsModal();
  }

  applyFilters(): void {
    this.loadAppointments(1);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}



