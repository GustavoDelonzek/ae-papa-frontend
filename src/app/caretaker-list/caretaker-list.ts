import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CaretakerService, Caretaker, CaretakersListResponse } from '../services';

@Component({
  selector: 'app-caretaker-list',
  standalone: false,
  templateUrl: './caretaker-list.html',
  styleUrl: './caretaker-list.scss',
})
export class CaretakerList implements OnInit, OnDestroy {

  searchTerm: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  searching: boolean = false;

  // Filters
  genderFilter: 'M' | 'F' | null = null;
  ageFilter: string = '';
  kinshipFilter: string = '';

  // Paginação
  currentPage: number = 1;
  perPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;

  // Lista de cuidadores
  caretakers: Caretaker[] = [];
  filteredCaretakers: Caretaker[] = [];

  // Metadados de paginação
  paginationMeta: any = null;

  // Timeout para pesquisa com delay
  private searchTimeout: any;

  protected Math = Math;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal control
  // Properties are re-added in later replacement block



  constructor(
    private router: Router,
    private caretakerService: CaretakerService
  ) { }

  ngOnInit(): void {
    this.loadCaretakers();
  }

  loadCaretakers(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    // Filters object construction
    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.genderFilter) filters.gender = this.genderFilter;
    if (this.kinshipFilter) filters.kinship = this.kinshipFilter;

    if (this.ageFilter) {
      if (this.ageFilter === '20-30') {
        filters.age_min = 20;
        filters.age_max = 30;
      } else if (this.ageFilter === '31-50') {
        filters.age_min = 31;
        filters.age_max = 50;
      } else if (this.ageFilter === '51+') {
        filters.age_min = 51;
      }
    }

    if (this.sortColumn) {
      filters.sort_by = this.sortColumn;
      filters.sort_order = this.sortDirection;
    }

    console.log('Sending filters to backend (Caretakers):', filters);

    // Using simple search for now as per previous service signature, but we should eventually update service
    this.caretakerService.getCaretakers(page, this.perPage, filters.search).subscribe({
      next: (response: CaretakersListResponse) => {
        this.caretakers = response.data || [];
        this.filteredCaretakers = [...this.caretakers];
        this.paginationMeta = response.meta;
        this.totalPages = response.meta?.last_page || 1;
        this.totalItems = response.meta?.total || 0;
        this.loading = false;
        this.searching = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar cuidadores:', error);
        this.loading = false;
        this.searching = false;
        this.errorMessage = 'Erro ao carregar lista de cuidadores.';
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.searching = true;

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.loadCaretakers(1);
    }, 500);
  }

  onFilterChange(): void {
    this.loadCaretakers(1);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.genderFilter = null;
    this.ageFilter = '';
    this.kinshipFilter = '';
    this.loadCaretakers(1);
  }

  hasActiveFilters(): boolean {
    return !!(this.genderFilter || this.ageFilter || this.kinshipFilter || this.searchTerm);
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadCaretakers(1);
  }

  onPageChange(page: number): void {
    this.loadCaretakers(page);
  }

  onRowClick(caretaker: Caretaker): void {
    this.viewCaretaker(caretaker.id!);
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  getPatientsSummary(patients: any[] | undefined | null): string {
    if (!patients || patients.length === 0) return '-';
    // Se tiver apenas 1, mostra "Nome (Parentesco)"
    // Se tiver mais, mostra "X Pacientes"
    if (patients.length === 1) {
      return `${patients[0].full_name} (${this.getKinshipLabel(patients[0].kinship)})`;
    }
    return `${patients.length} Pacientes`;
  }

  getKinshipLabel(kinship: string): string {
    const labels: { [key: string]: string } = {
      'son': 'Filho',
      'daughter': 'Filha',
      'spouse': 'Cônjuge',
      'partner': 'Companheiro(a)',
      'father': 'Pai',
      'mother': 'Mãe',
      'brother': 'Irmão',
      'sister': 'Irmã',
      'grand_son': 'Neto',
      'grand_daughter': 'Neta',
      'nephew': 'Sobrinho',
      'niece': 'Sobrinha',
      'friend': 'Amigo(a)',
      'professional_caregiver': 'Cuidador Profissional',
      'other': 'Outro'
    };
    return labels[kinship] || kinship;
  }

  getCaretakerAge(birthDate: string): number {
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

  // Modal control
  showCaretakerModal: boolean = false;
  currentCaretaker: Caretaker | null = null;

  addCaretaker(): void {
    this.currentCaretaker = null;
    this.showCaretakerModal = true;
  }

  viewCaretaker(id: number): void {
    this.router.navigate(['/cuidador', id]);
  }

  editCaretaker(id: number): void {
    const caretaker = this.caretakers.find(c => c.id === id);
    if (caretaker) {
      this.currentCaretaker = { ...caretaker };
      this.showCaretakerModal = true;
    }
  }

  closeCaretakerModal(): void {
    this.showCaretakerModal = false;
    this.currentCaretaker = null;
  }

  onCaretakerSuccess(): void {
    this.closeCaretakerModal();
    this.loadCaretakers(this.currentPage);
  }



  deleteCaretaker(id: number): void {
    if (confirm('Tem certeza que deseja deletar este cuidador?')) {
      this.caretakerService.deleteCaretaker(id).subscribe({
        next: () => {
          this.loadCaretakers(this.currentPage);
        },
        error: (error: any) => {
          console.error('Erro ao deletar cuidador:', error);
          this.errorMessage = 'Erro ao deletar cuidador. Tente novamente.';
        }
      });
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}
