import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../services';
import { SharedUtils } from '../core/utils/shared-utils';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PatientFormModalComponent } from '../shared/components/patient-form-modal/patient-form-modal.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    PatientFormModalComponent
  ],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
})
export class PatientListComponent implements OnInit, OnDestroy, AfterViewInit {

  searchTerm: string = '';
  loading: boolean = false;
  errorMessage: string = '';


  // Filters
  genderFilter: 'M' | 'F' | null = null;
  ageFilter: '20-30' | '31-50' | '51+' | '' = ''; // '20-30', '31-50', '51+'
  birthYearFilter: string = ''; // year as string for select

  // Birth year options
  birthYearOptions: number[] = [];

  // Paginação
  currentPage: number = 1;
  perPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;

  // Ordenação
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Lista de pacientes do backend
  patients: Patient[] = [];
  filteredPatients: Patient[] = []; // Used by shared table

  // Metadados de paginação
  paginationMeta: any = null;

  // Timeout para pesquisa com delay
  private searchTimeout: any;

  protected Math = Math;

  // Templates
  @ViewChild('patientTpl') patientTpl!: TemplateRef<any>;
  @ViewChild('cpfTpl') cpfTpl!: TemplateRef<any>;
  @ViewChild('ageTpl') ageTpl!: TemplateRef<any>;
  @ViewChild('genderTpl') genderTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl') actionsTpl!: TemplateRef<any>;

  // Columns definition
  columns: any[] = [];

  // Modal
  showCreateModal: boolean = false;
  currentPatient: Patient | null = null;

  constructor(
    private router: Router,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.generateBirthYearOptions();
    this.loadPatients();
  }

  generateBirthYearOptions(): void {
    const currentYear = new Date().getFullYear();
    this.birthYearOptions = [];
    for (let year = currentYear; year >= 1900; year--) {
      this.birthYearOptions.push(year);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.columns = [
        { key: 'full_name', label: 'Nome', sortable: true, type: 'template', cellTemplate: this.patientTpl, headerClass: 'w-30' },
        { key: 'cpf', label: 'CPF', sortable: true, type: 'template', cellTemplate: this.cpfTpl, cellClass: 'font-mono' },
        { key: 'birth_date', label: 'Idade', sortable: true, type: 'template', cellTemplate: this.ageTpl },
        { key: 'gender', label: 'Gênero', sortable: true, type: 'template', cellTemplate: this.genderTpl, headerClass: 'text-center', cellClass: 'text-center' },
        { key: 'actions', label: 'Ações', sortable: false, type: 'template', cellTemplate: this.actionsTpl, headerClass: 'text-center', cellClass: 'text-center w-actions' }
      ];
    });
  }

  loadPatients(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.genderFilter) filters.gender = this.genderFilter;

    if (this.ageFilter) {
      filters.ageFilter = this.ageFilter;
    }

    if (this.birthYearFilter) {
      filters.birthYear = parseInt(this.birthYearFilter, 10);
    }

    if (this.sortColumn) {
      filters.sort_by = this.sortColumn;
      filters.sort_order = this.sortDirection;
    }

    console.log('Sending filters to backend:', filters);

    this.patientService.getPatients(page, this.perPage, filters).subscribe({
      next: (response) => {
        this.patients = response.data;
        this.filteredPatients = [...this.patients]; // No client-side filtering
        this.paginationMeta = response.meta;
        this.totalPages = response.meta.last_page;
        this.totalItems = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar atendidos:', error);
        this.loading = false;
        this.errorMessage = 'Erro ao carregar lista de atendidos. Tente novamente.';
      }
    });
  }

  // Filters are handled by ngModel and onFilterChange


  // Age and Date are now handled by ngModel Change or specific methods if needed
  // But we can just use (change)="loadPatients(1)" in the template

  onFilterChange(): void {
    this.loadPatients(1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.genderFilter = null;
    this.ageFilter = '';
    this.birthYearFilter = '';
    this.loadPatients(1);
  }

  hasActiveFilters(): boolean {
    return !!(this.genderFilter || this.ageFilter || this.birthYearFilter || this.searchTerm);
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadPatients(1);
  }

  onSearch(term: string): void {
    this.searchTerm = term;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.loadPatients(1);
    }, 500);
  }

  onPageChange(page: number): void {
    this.loadPatients(page);
  }

  onRowClick(patient: Patient): void {
    this.router.navigate(['/paciente', patient.id]);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  getPatientAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = SharedUtils.parseDate(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  formatCPF(cpf: string): string {
    return SharedUtils.formatCPF(cpf);
  }

  // Modal Logic
  openModal(patient: Patient | null = null): void {
    this.currentPatient = patient;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.currentPatient = null;
  }

  onModalSuccess(): void {
    this.closeCreateModal();
    this.loadPatients(this.currentPage);
  }

  viewPatient(id: number): void {
    this.router.navigate(['/paciente', id]);
  }

  deletePatient(id: number): void {
    if (confirm('Tem certeza que deseja deletar este paciente?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.loadPatients(this.currentPage);
        },
        error: (error) => {
          console.error('Erro ao deletar paciente:', error);
          this.errorMessage = 'Erro ao deletar paciente. Tente novamente.';
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}