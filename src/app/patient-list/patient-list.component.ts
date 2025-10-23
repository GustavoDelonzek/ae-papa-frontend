import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../services';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
  standalone: false,
})
export class PatientListComponent implements OnInit, OnDestroy {
  
  searchTerm: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  searching: boolean = false;
  
  // Paginação
  currentPage: number = 1;
  perPage: number = 15;
  totalPages: number = 0;
  totalItems: number = 0;
  
  // Lista de pacientes do backend
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  
  // Metadados de paginação
  paginationMeta: any = null;
  
  // Timeout para pesquisa com delay
  private searchTimeout: any;

  constructor(
    private router: Router,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.loadPatients();
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
        this.filteredPatients = [...this.patients];
        this.paginationMeta = response.meta;
        this.totalPages = response.meta.last_page;
        this.totalItems = response.meta.total;
        this.loading = false;
        this.searching = false;
      },
      error: (error) => {
        console.error('Erro ao carregar pacientes:', error);
        this.loading = false;
        this.searching = false;
        this.errorMessage = 'Erro ao carregar lista de pacientes. Tente novamente.';
      }
    });
  }

  onSearch(): void {
    // Limpar timeout anterior se existir
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Adicionar delay para evitar muitas requisições
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 500); // 500ms de delay
  }

  performSearch(): void {
    this.searching = true;
    this.currentPage = 1; // Resetar para primeira página na pesquisa
    this.loadPatients(1, this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadPatients(1);
  }

  getStatusClass(status: string): string {
    return status || 'active';
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

  getMaritalStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)'
    };
    return statusMap[status] || status;
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    // Remove tudo que não é dígito
    const cleaned = cpf.replace(/\D/g, '');
    // Aplica a máscara XXX.XXX.XXX-XX
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Métodos de paginação
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.loadPatients(page, this.searchTerm);
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
      // Se há poucas páginas, mostra todas
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas ao redor da página atual
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, this.currentPage + 2);
      
      // Ajustar se estamos no início ou fim
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
    return `Mostrando ${from} a ${to} de ${total} pacientes`;
  }

  addPatient(): void {
    this.router.navigate(['/registro-paciente']);
  }

  viewPatient(id: number): void {
    this.router.navigate(['/paciente', id]);
  }

  editPatient(id: number): void {
    this.router.navigate(['/paciente', id, 'edit']);
  }

  deletePatient(id: number): void {
    if (confirm('Tem certeza que deseja deletar este paciente?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          console.log('Paciente deletado com sucesso');
          // Recarregar a página atual após deletar
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
    // Limpar timeout ao destruir o componente
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}