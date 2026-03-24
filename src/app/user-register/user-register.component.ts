import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserService, User } from '../services';

interface UserCreateData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterModule],
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss']
})
export class UserRegisterComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];

  // Requisitos de Senha
  get hasMinLength(): boolean { return this.userData.password.length >= 8; }
  get hasLowerAndUpperCase(): boolean { return /[a-z]/.test(this.userData.password) && /[A-Z]/.test(this.userData.password); }
  get hasNumber(): boolean { return /[0-9]/.test(this.userData.password); }
  get hasSymbol(): boolean { return /[^A-Za-z0-9]/.test(this.userData.password); }
  get isPasswordValid(): boolean { return this.hasMinLength && this.hasLowerAndUpperCase && this.hasNumber && this.hasSymbol; }

  userData: UserCreateData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  showCreateModal: boolean = false;
  showPassword: boolean = false;
  isSubmitting: boolean = false;
  loading: boolean = false;
  searchTerm: string = '';
  sortColumn: 'name' | 'email' | 'role' | 'created_at' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage: number = 1;
  perPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;

  constructor(
    private router: Router,
    @Inject(AuthService) private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;

    this.userService.listUsers().subscribe({
      next: (response) => {
        this.users = response?.data || [];
        this.applyFiltersAndPagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.toastService.error('Não foi possível carregar os usuários.');
        this.loading = false;
      }
    });
  }

  onSubmit(userForm: NgForm): void {
    if (userForm.invalid) {
      Object.values(userForm.controls).forEach((control) => control.markAsTouched());
      this.toastService.warning('Preencha corretamente os campos obrigatórios.');
      return;
    }

    if (this.validateForm()) {
      this.isSubmitting = true;

      this.userService.createUser(this.userData).subscribe({
        next: (response) => {
          console.log('Usuário cadastrado com sucesso:', response);
          this.isSubmitting = false;
          this.toastService.success('Usuário cadastrado com sucesso!');

          this.closeCreateModal();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erro ao cadastrar usuário:', error);
          this.isSubmitting = false;

          if (error.status === 422) {
            const errors = error.error?.errors;
            if (errors) {
              const firstError = Object.values(errors)[0];
              const rawMessage = Array.isArray(firstError) ? String(firstError[0]) : String(firstError);
              this.toastService.error(this.translateValidationMessage(rawMessage));
            } else {
              this.toastService.error('Dados inválidos. Verifique os campos.');
            }
          } else if (error.status === 403) {
            this.toastService.warning('Você não tem permissão para cadastrar usuários.');
          } else {
            this.toastService.error('Erro no servidor. Tente novamente.');
          }
        }
      });
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  onSort(column: 'name' | 'email' | 'role' | 'created_at'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applyFiltersAndPagination();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFiltersAndPagination();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  clearSearch(): void {
    this.onSearch('');
  }

  getRoleLabel(role: string): string {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'admin') return 'Administrador';
    if (normalized === 'clinical') return 'Clínico';
    if (normalized === 'reception') return 'Recepção';
    return role || '-';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private applyFiltersAndPagination(): void {
    const search = this.searchTerm.trim().toLowerCase();

    let result = this.users.filter((user) => {
      if (!search) return true;
      return (
        (user.name || '').toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search) ||
        this.getRoleLabel(user.role).toLowerCase().includes(search)
      );
    });

    result = result.sort((a, b) => this.compareUsers(a, b));

    this.filteredUsers = result;
    this.totalItems = result.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.perPage));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.perPage;
    this.paginatedUsers = result.slice(start, start + this.perPage);
  }

  private compareUsers(a: User, b: User): number {
    const direction = this.sortDirection === 'asc' ? 1 : -1;

    if (this.sortColumn === 'created_at') {
      const aDate = new Date(a.created_at || '').getTime() || 0;
      const bDate = new Date(b.created_at || '').getTime() || 0;
      return (aDate - bDate) * direction;
    }

    const aValue = String(a[this.sortColumn] || '').toLowerCase();
    const bValue = String(b[this.sortColumn] || '').toLowerCase();
    return aValue.localeCompare(bValue) * direction;
  }

  private validateForm(): boolean {
    if (!this.userData.name.trim()) {
      this.toastService.warning('Nome é obrigatório');
      return false;
    }

    if (!this.userData.email.trim()) {
      this.toastService.warning('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.toastService.warning('Email inválido');
      return false;
    }

    if (!this.userData.password.trim()) {
      this.toastService.warning('Senha é obrigatória');
      return false;
    }

    if (!this.isPasswordValid) {
      this.toastService.warning('A senha não atende a todos os requisitos de segurança');
      return false;
    }

    if (this.userData.password !== this.userData.password_confirmation) {
      this.toastService.warning('As senhas não conferem');
      return false;
    }

    return true;
  }

  private resetForm(): void {
    this.userData = {
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    };
  }

  private translateValidationMessage(message: string): string {
    const normalized = message.trim().toLowerCase();

    if (normalized.includes('password field must contain at least one uppercase and one lowercase letter')) {
      return 'A senha deve conter pelo menos uma letra maiúscula e uma minúscula.';
    }

    if (normalized.includes('password field must contain at least one symbol')) {
      return 'A senha deve conter pelo menos um símbolo.';
    }

    if (normalized.includes('password field must contain at least one number')) {
      return 'A senha deve conter pelo menos um número.';
    }

    if (normalized.includes('password field must be at least')) {
      return 'A senha deve ter no mínimo 8 caracteres.';
    }

    if (normalized.includes('password confirmation does not match')) {
      return 'A confirmação da senha não confere.';
    }

    if (normalized.includes('email has already been taken')) {
      return 'Este email já está em uso.';
    }

    if (normalized.includes('name field is required')) {
      return 'Nome é obrigatório.';
    }

    if (normalized.includes('email field is required')) {
      return 'Email é obrigatório.';
    }

    if (normalized.includes('password field is required')) {
      return 'Senha é obrigatória.';
    }

    return message;
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
