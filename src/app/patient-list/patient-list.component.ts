import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../services';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
  standalone: false,
})
export class PatientListComponent implements OnInit, OnDestroy, AfterViewInit {

  searchTerm: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  // Paginação
  currentPage: number = 1;
  perPage: number = 15;
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
    this.loadPatients();
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

  loadPatients(page: number = 1, searchTerm?: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    // Se há termo de pesquisa, usar o termo atual ou o fornecido
    const search = searchTerm !== undefined ? searchTerm : this.searchTerm;

    this.patientService.getPatients(page, this.perPage, search).subscribe({
      next: (response) => {
        this.patients = response.data;
        this.filteredPatients = [...this.patients]; // Update filtered list for shared table
        this.paginationMeta = response.meta;
        this.totalPages = response.meta.last_page;
        this.totalItems = response.meta.total;

        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar pacientes:', error);
        this.loading = false;
        this.errorMessage = 'Erro ao carregar lista de pacientes. Tente novamente.';
      }
    });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }

  sortData(): void {
    if (!this.patients) return;
    if (!this.sortColumn) {
      this.filteredPatients = [...this.patients];
      return;
    }
    this.filteredPatients = [...this.patients].sort((a: any, b: any) => {
      const res = (a[this.sortColumn] < b[this.sortColumn]) ? -1 : (a[this.sortColumn] > b[this.sortColumn]) ? 1 : 0;
      return this.sortDirection === 'asc' ? res : -res;
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 500);
  }

  performSearch(): void {
    this.currentPage = 1;
    this.loadPatients(1, this.searchTerm);
  }

  onPageChange(page: number): void {
    this.loadPatients(page, this.searchTerm);
  }

  onRowClick(patient: Patient): void {
    this.router.navigate(['/paciente', patient.id]);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  getPatientAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
    this.loadPatients(this.currentPage, this.searchTerm);
  }

  viewPatient(id: number): void {
    this.router.navigate(['/paciente', id]);
  }

  deletePatient(id: number): void {
    if (confirm('Tem certeza que deseja deletar este paciente?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.loadPatients(this.currentPage, this.searchTerm);
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