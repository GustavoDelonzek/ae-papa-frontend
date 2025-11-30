import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(
    private router: Router,
    private caretakerService: CaretakerService
  ) { }

  ngOnInit(): void {
    this.loadCaretakers();
  }

  loadCaretakers(page: number = 1, searchTerm?: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;
    
    // Se há termo de pesquisa, usar o termo atual ou o fornecido
    const search = searchTerm !== undefined ? searchTerm : this.searchTerm;
    
    this.caretakerService.getCaretakers(page, this.perPage, search).subscribe({
      next: (response: CaretakersListResponse) => {
        console.log('Resposta da API:', response);
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
        console.error('Detalhes do erro:', error.error);
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

  performSearch(): void {
    this.searching = true;
    this.currentPage = 1;
    this.loadCaretakers(1, this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadCaretakers(1);
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

  // Métodos de paginação
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.loadCaretakers(page, this.searchTerm);
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
    return `Mostrando ${from} a ${to} de ${total} cuidadores`;
  }

  addCaretaker(): void {
    this.router.navigate(['/registro-cuidador']);
  }

  viewCaretaker(id: number): void {
    this.router.navigate(['/cuidador', id]);
  }

  editCaretaker(id: number): void {
    this.router.navigate(['/registro-cuidador', id]);
  }

  deleteCaretaker(id: number): void {
    if (confirm('Tem certeza que deseja deletar este cuidador?')) {
      this.caretakerService.deleteCaretaker(id).subscribe({
        next: () => {
          console.log('Cuidador deletado com sucesso');
          this.loadCaretakers(this.currentPage, this.searchTerm);
        },
        error: (error: any) => {
          console.error('Erro ao deletar cuidador:', error);
          this.errorMessage = 'Erro ao deletar cuidador. Tente novamente.';
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

