import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { AppointmentService } from '../services/appointment.service';
import { PatientService, Patient } from '../services/patient.service';
import { Router } from '@angular/router';
import { Appointment, AppointmentCreate } from '../core/models/appointment.model';
import { TableColumn } from '../shared/components/shared-table/shared-table.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { SharedUtils } from '../core/utils/shared-utils';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AppointmentDetailsModalComponent } from '../shared/components/appointment-details-modal/appointment-details-modal.component';
import { SecureImageDirective } from '../core/directives/secure-image.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    AppointmentDetailsModalComponent,
    SecureImageDirective,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent implements OnInit {

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
  objectiveFilter: string = '';

  // ========================================
  // Modal de Criação de Atendimento
  // ========================================
  showCreateModal: boolean = false;

  // Patient Search
  showPatientSearch: boolean = false;
  searchCpf: string = '';
  searching: boolean = false;
  searchResults: Patient[] = [];
  selectedPatient: Patient | null = null;
  private patientSearchTimeout: any;

  // Form Fields
  appointmentDate: string = '';
  minAppointmentDate: string = this.getTodayISODate();
  appointmentObjective: string = '';
  observations: string = '';
  submitting: boolean = false;
  editingAppointmentId: number | null = null;
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
    this.objectiveFilter = '';
    this.loadAppointments(1);
  }

  // ====== Event Handlers ======

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.statusFilter || this.objectiveFilter);
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
    return SharedUtils.formatCPF(cpf);
  }

  getInitials(name: string): string {
    return SharedUtils.getInitials(name);
  }

  formatDate(date: string): string {
    return SharedUtils.formatDate(date);
  }

  getDay(date: string): string {
    return SharedUtils.getDateParts(date).day;
  }

  getShortMonth(date: string): string {
    return SharedUtils.getDateParts(date).month;
  }

  getYear(date: string): string {
    return SharedUtils.getDateParts(date).year;
  }

  private parseDate(dateStr: string): Date {
    return SharedUtils.parseDate(dateStr);
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
    this.editingAppointmentId = null;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.editingAppointmentId = null;
    this.resetForm();
  }

  // Patient Search Methods
  openPatientSearch(): void {
    this.showPatientSearch = true;
    this.searchCpf = '';
    this.searchResults = [];
  }

  closePatientSearch(): void {
    this.showPatientSearch = false;
    this.searchCpf = '';
    this.searchResults = [];
  }

  onSearchCpfChange(): void {
    const isOnlyNumbersAndFormatting = /^[0-9.\- ]*$/.test(this.searchCpf);
    if (this.searchCpf && isOnlyNumbersAndFormatting) {
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

    if (this.patientSearchTimeout) {
      clearTimeout(this.patientSearchTimeout);
    }

    this.patientSearchTimeout = setTimeout(() => {
      this.performSearch(false);
    }, 500);
  }

  performSearch(showErrorIfEmpty: boolean = true): void {
    if (!this.searchCpf || this.searchCpf.trim().length < 3) {
      this.searchResults = [];
      this.searching = false;
      return;
    }

    const term = this.searchCpf.trim();
    const cpfOnly = term.replace(/\D/g, '');
    const isCpf = /^[0-9.\- ]*$/.test(term) && cpfOnly.length > 0;

    const filters: any = isCpf ? { cpf: cpfOnly } : { full_name: term };

    this.searching = true;
    this.searchResults = [];

    this.patientService.getPatients(1, 15, filters).subscribe({
      next: (response) => {
        this.searchResults = response.data || [];
        
        if (showErrorIfEmpty && this.searchResults.length === 0) {
          this.toastService.error('Nenhum atendido encontrado');
        }
        this.searching = false;
      },
      error: (error) => {
        console.error('Erro ao buscar paciente:', error);
        if (showErrorIfEmpty) {
          this.toastService.error('Erro ao buscar atendido. Tente novamente.');
        }
        this.searching = false;
      }
    });
  }

  searchPatientByCpf(): void {
    if (this.patientSearchTimeout) clearTimeout(this.patientSearchTimeout);
    this.performSearch(true);
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

    if (this.isDateBeforeToday(this.appointmentDate)) {
      this.toastService.warning('A data do atendimento não pode ser anterior a hoje.');
      return;
    }

    if (!this.currentUserId) {
      this.toastService.error('Usuário não identificado. Faça login novamente.');
      return;
    }

    this.submitting = true;

    // Converter a data suportando string ou objeto Date do Material UI
    let formattedDate = SharedUtils.formatDateForAPI(this.appointmentDate);

    const appointmentData: AppointmentCreate = {
      patient_id: this.selectedPatient.id!,
      user_id: this.currentUserId,
      date: formattedDate,
      objective: this.appointmentObjective,
      observations: this.observations.trim() || undefined
    };

    if (this.editingAppointmentId) {
      this.appointmentService.updateAppointment(this.editingAppointmentId, appointmentData).subscribe({
        next: () => {
          this.toastService.success('Atendimento atualizado com sucesso!');
          this.submitting = false;
          this.closeCreateModal();
          this.loadAppointments();
        },
        error: (error) => {
          console.error('Erro ao atualizar consulta:', error);
          this.toastService.error(error.error?.message || 'Erro ao atualizar atendimento. Tente novamente.');
          this.submitting = false;
        }
      });
      return;
    }

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: () => {
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
    this.searchResults = [];
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
    if (!appointment.id) {
      this.toastService.error('Não foi possível editar: ID do atendimento ausente.');
      return;
    }

    this.editingAppointmentId = appointment.id;
    this.selectedPatient = appointment.patient || {
      id: appointment.patient_id,
      full_name: `Atendido #${appointment.patient_id}`,
      birth_date: '',
      gender: '',
      marital_status: '',
      cpf: ''
    };
    // Convert ISO date from backend to BR format for display
    this.appointmentDate = SharedUtils.toDisplayDate(appointment.date);
    this.appointmentObjective = appointment.objective || '';
    this.observations = appointment.observations || '';
    this.searchCpf = '';
    this.searchResults = [];
    this.showCreateModal = true;

    this.closeDetailsModal();
  }

  isEditMode(): boolean {
    return this.editingAppointmentId !== null;
  }

  applyFilters(): void {
    this.loadAppointments(1);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private getTodayISODate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isDateBeforeToday(date: string | Date): boolean {
    // Accept both DD/MM/AAAA (BR mask) and YYYY-MM-DD (ISO)
    let parsed: Date;
    if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const iso = SharedUtils.parseBRDate(date);
      parsed = SharedUtils.parseDate(iso);
    } else {
      parsed = date instanceof Date ? date : SharedUtils.parseDate(date as string);
    }
    if (isNaN(parsed.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return parsed < today;
  }
}



