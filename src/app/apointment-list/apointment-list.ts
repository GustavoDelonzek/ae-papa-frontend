import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { AppointmentService } from '../services/appointment.service';
import { Router } from '@angular/router';
import { Appointment } from '../core/models/appointment.model';
import { TableColumn } from '../shared/components/shared-table/shared-table.component';

@Component({
  selector: 'app-apointment-list',
  standalone: false,
  templateUrl: './apointment-list.html',
  styleUrl: './apointment-list.scss'
})
export class ApointmentList implements OnInit {

  @ViewChild('patientTpl') patientTpl!: TemplateRef<any>;
  @ViewChild('dateTpl') dateTpl!: TemplateRef<any>;
  @ViewChild('objectiveTpl') objectiveTpl!: TemplateRef<any>;
  @ViewChild('statusTpl') statusTpl!: TemplateRef<any>;

  appointments: Appointment[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  // Shared Table Configuration
  columns: TableColumn[] = [];
  paginationMeta: any = null;

  // Modal Detail
  showDetailsModal: boolean = false;
  selectedAppointment: Appointment | null = null;

  // Filtros
  filterText: string = '';
  filterStatus: string = '';
  filterDate: string = '';

  constructor(
    private router: Router,
    private appointmentService: AppointmentService
  ) { }

  ngOnInit(): void {
    // Columns will be initialized in ngAfterViewInit normally, but for simple cases we can define them here 
    // if templates are not static. However, since we use @ViewChild, we should better set them 
    // after view init or use a timeout, or just rely on Angular to resolve them.
    // Actually, simply defining them in ngAfterViewInit is safer for ViewChild templates.
    this.initialLoad();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.columns = [
        { key: 'id', label: 'ID', sortable: true, cellClass: 'text-muted' },
        { key: 'patient', label: 'PACIENTE', type: 'template', cellTemplate: this.patientTpl },
        { key: 'date', label: 'DATA DO ATENDIMENTO', type: 'template', cellTemplate: this.dateTpl },
        { key: 'objective', label: 'OBJETIVO', type: 'template', cellTemplate: this.objectiveTpl },
        { key: 'status', label: 'STATUS', type: 'template', cellTemplate: this.statusTpl },
        { key: 'observations', label: 'OBSERVAÇÕES', type: 'text', cellClass: 'text-truncate', headerClass: 'w-25' }
      ];
    });
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

    if (this.filterText) filters.search = this.filterText;
    if (this.filterDate) filters.date = this.filterDate;
    if (this.filterStatus) filters.status = this.filterStatus;

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
    this.filterText = term;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.loadAppointments(page);
  }

  onRowClick(appointment: Appointment): void {
    console.log('Row clicked:', appointment);
    this.viewAppointment(appointment.id!);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

  createAppointment(): void {
    this.router.navigate(['/criar-consulta']);
  }

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
    // Navigate to edit page (assuming reusing creation page or specific edit route)
    // currently we don't have a clear edit route, but we can structure this for future
    console.log('Edit appointment:', appointment);
    // this.router.navigate(['/consulta/editar', appointment.id]); 
    // For now just close or keep logic placeholder
    this.closeDetailsModal();
  }

  applyFilters(): void {
    this.loadAppointments(1);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}


