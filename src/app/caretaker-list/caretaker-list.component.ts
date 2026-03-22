import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CaretakerService, Caretaker, CaretakersListResponse } from '../services';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CaretakerFormModalComponent } from '../shared/components/caretaker-form-modal/caretaker-form-modal.component';

@Component({
  selector: 'app-caretaker-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent,
    CaretakerFormModalComponent
  ],
  templateUrl: './caretaker-list.component.html',
  styleUrl: './caretaker-list.component.scss',
})
export class CaretakerListComponent implements OnInit, OnDestroy {

  searchTerm: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  searching: boolean = false;

  genderFilter: 'M' | 'F' | null = null;
  ageFilter: string = '';
  kinshipFilter: string = '';
  birthYearFilter: string = ''; // year as string for select

  birthYearOptions: number[] = [];

  kinshipOptions: { value: string; label: string }[] = [
    { value: 'son', label: 'Filho' },
    { value: 'daughter', label: 'Filha' },
    { value: 'spouse', label: 'Cônjuge' },
    { value: 'partner', label: 'Companheiro(a)' },
    { value: 'father', label: 'Pai' },
    { value: 'mother', label: 'Mãe' },
    { value: 'brother', label: 'Irmão' },
    { value: 'sister', label: 'Irmã' },
    { value: 'grand_son', label: 'Neto' },
    { value: 'grand_daughter', label: 'Neta' },
    { value: 'nephew', label: 'Sobrinho' },
    { value: 'niece', label: 'Sobrinha' },
    { value: 'friend', label: 'Amigo(a)' },
    { value: 'professional_caregiver', label: 'Cuidador Profissional' },
    { value: 'other', label: 'Outro' }
  ];

  currentPage: number = 1;
  perPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;

  caretakers: Caretaker[] = [];
  filteredCaretakers: Caretaker[] = [];

  paginationMeta: any = null;

  private searchTimeout: any;

  protected Math = Math;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal control
  // Properties are re-added in later replacement block



  constructor(
    private router: Router,
    private caretakerService: CaretakerService
  ) { }

  ngOnInit(): void {
    this.generateBirthYearOptions();
    this.loadCaretakers();
  }

  generateBirthYearOptions(): void {
    const currentYear = new Date().getFullYear();
    this.birthYearOptions = [];
    for (let year = currentYear; year >= 1900; year--) {
      this.birthYearOptions.push(year);
    }
  }

  loadCaretakers(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.genderFilter) filters.gender = this.genderFilter;
    if (this.kinshipFilter) filters.kinship = this.kinshipFilter;

    if (this.ageFilter) filters.ageFilter = this.ageFilter;
    if (this.birthYearFilter) filters.birthYear = parseInt(this.birthYearFilter, 10);

    if (this.sortColumn) {
      filters.sort_by = this.sortColumn;
      filters.sort_order = this.sortDirection;
    }

    console.log('Sending filters to backend (Caretakers):', filters);

    this.caretakerService.getCaretakers(page, this.perPage, filters).subscribe({
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
    this.birthYearFilter = '';
    this.loadCaretakers(1);
  }

  hasActiveFilters(): boolean {
    return !!(this.genderFilter || this.ageFilter || this.kinshipFilter || this.birthYearFilter || this.searchTerm);
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
