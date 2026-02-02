import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CaretakerService, Caretaker, CaretakersListResponse } from '../services';

@Component({
  selector: 'app-caretaker-list',
  standalone: false,
  templateUrl: './caretaker-list.html',
  styleUrl: './caretaker-list.scss',
})
export class CaretakerList implements OnInit, OnDestroy, AfterViewInit {

  searchTerm: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  searching: boolean = false;

  // Paginação
  currentPage: number = 1;
  perPage: number = 15;
  totalPages: number = 0;
  totalItems: number = 0;

  // Lista de cuidadores
  caretakers: Caretaker[] = [];
  filteredCaretakers: Caretaker[] = [];

  // Metadados de paginação
  paginationMeta: any = null;

  // Timeout para pesquisa com delay
  private searchTimeout: any;

  // Templates
  @ViewChild('nameTpl') nameTpl!: TemplateRef<any>;
  @ViewChild('ageTpl') ageTpl!: TemplateRef<any>;
  @ViewChild('genderTpl') genderTpl!: TemplateRef<any>;
  @ViewChild('kinshipTpl') kinshipTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl') actionsTpl!: TemplateRef<any>;

  // Columns definition
  columns: any[] = [];

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal control
  showCaretakerModal: boolean = false;
  currentCaretaker: Caretaker | null = null;

  constructor(
    private router: Router,
    private caretakerService: CaretakerService
  ) { }

  ngOnInit(): void {
    this.loadCaretakers();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.columns = [
        { key: 'full_name', label: 'Nome', sortable: true, type: 'template', cellTemplate: this.nameTpl, headerClass: 'w-30' },
        { key: 'cpf', label: 'CPF', sortable: true, type: 'text', cellClass: 'font-mono' },
        { key: 'birth_date', label: 'Idade', sortable: true, type: 'template', cellTemplate: this.ageTpl },
        { key: 'gender', label: 'Gênero', sortable: true, type: 'template', cellTemplate: this.genderTpl, headerClass: 'text-center', cellClass: 'text-center' },
        { key: 'patients', label: 'Pacientes', sortable: false, type: 'template', cellTemplate: this.kinshipTpl },
        { key: 'actions', label: 'Ações', sortable: false, type: 'template', cellTemplate: this.actionsTpl, headerClass: 'text-center', cellClass: 'text-center w-actions' }
      ];
    });
  }

  loadCaretakers(page: number = 1, searchTerm?: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;

    const search = searchTerm !== undefined ? searchTerm : this.searchTerm;

    this.caretakerService.getCaretakers(page, this.perPage, search).subscribe({
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
        if (error.status === 401) {
          this.errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.status === 0) {
          this.errorMessage = 'Erro de conexão. Verifique se o backend está rodando.';
        } else {
          this.errorMessage = error.error?.message || 'Erro ao carregar lista de cuidadores. Tente novamente.';
        }
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.searching = true;

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadCaretakers(1, this.searchTerm);
    }, 500); // Debounce
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    console.log('Sorting by', this.sortColumn, this.sortDirection);
  }

  onPageChange(page: number): void {
    this.loadCaretakers(page, this.searchTerm);
  }

  onRowClick(caretaker: Caretaker): void {
    this.viewCaretaker(caretaker.id!);
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  getPatientsSummary(patients: any[]): string {
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

  addCaretaker(): void {
    this.currentCaretaker = null;
    this.showCaretakerModal = true;
  }

  viewCaretaker(id: number): void {
    this.router.navigate(['/cuidador', id]);
  }

  editCaretaker(id: number): void {
    // Find the caretaker and open modal for editing
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
    this.loadCaretakers(this.currentPage, this.searchTerm);
  }

  deleteCaretaker(id: number): void {
    if (confirm('Tem certeza que deseja deletar este cuidador?')) {
      this.caretakerService.deleteCaretaker(id).subscribe({
        next: () => {
          this.loadCaretakers(this.currentPage, this.searchTerm);
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

