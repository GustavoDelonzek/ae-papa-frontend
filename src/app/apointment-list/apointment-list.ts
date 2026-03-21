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

    // Avoid timezone shift for date-only strings (YYYY-MM-DD).
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }

    // Keep compatibility if backend returns MM-DD-YYYY.
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [month, day, year] = date.split('-');
      return `${day}/${month}/${year}`;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return date;

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

    if (cpfOnly.length !== 11) {
      this.toastService.warning('Informe um CPF valido com 11 digitos.');
      this.searching = false;
      return;
    }

    const maskedCpf = this.formatCPF(cpfOnly);

    // First try with digits only, then fallback to masked format used in patient list search.
    this.patientService.getPatients(1, 200, { search: cpfOnly }).subscribe({
      next: (response) => {
        const exactByDigits = this.findPatientByExactCpf(response.data || [], cpfOnly);
        if (exactByDigits) {
          this.searchResult = exactByDigits;
          this.searching = false;
          return;
        }

        this.patientService.getPatients(1, 200, { search: maskedCpf }).subscribe({
          next: (fallbackResponse) => {
            this.searchResult = this.findPatientByExactCpf(fallbackResponse.data || [], cpfOnly);

            if (!this.searchResult) {
              this.toastService.error('Atendido nao encontrado');
            }
            this.searching = false;
          },
          error: (fallbackError) => {
            console.error('Erro ao buscar paciente (fallback):', fallbackError);
            this.toastService.error('Erro ao buscar atendido. Tente novamente.');
            this.searching = false;
          }
        });
      },
      error: (error) => {
        console.error('Erro ao buscar paciente:', error);
        this.toastService.error('Erro ao buscar atendido. Tente novamente.');
        this.searching = false;
      }
    });
  }

  private normalizeCpf(cpf: string): string {
    return (cpf || '').replace(/\D/g, '');
  }

  private findPatientByExactCpf(patients: Patient[], cpfOnly: string): Patient | null {
    return patients.find((patient) => this.normalizeCpf(patient.cpf) === cpfOnly) || null;
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
    this.appointmentDate = this.toInputDate(appointment.date);
    this.appointmentObjective = appointment.objective || '';
    this.observations = appointment.observations || '';
    this.searchCpf = '';
    this.searchResult = null;
    this.showCreateModal = true;

    this.closeDetailsModal();
  }

  isEditMode(): boolean {
    return this.editingAppointmentId !== null;
  }

  private toInputDate(date: string): string {
    if (!date) return '';

    if (date.includes('T')) {
      return date.split('T')[0];
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [month, day, year] = date.split('-');
      return `${year}-${month}-${day}`;
    }

    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  }

  applyFilters(): void {
    this.loadAppointments(1);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}



