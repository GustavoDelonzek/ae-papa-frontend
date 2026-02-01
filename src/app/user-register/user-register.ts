import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services';

interface UserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
}

@Component({
  selector: 'app-user-register',
  standalone: false,
  templateUrl: './user-register.html',
  styleUrls: ['./user-register.scss']
})
export class UserRegister implements OnInit {
  userData: UserData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'reception'
  };

  roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'clinical', label: 'Clínico' },
    { value: 'reception', label: 'Recepção' }
  ];

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    @Inject(AuthService) private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar se o usuário logado é admin
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.register(this.userData).subscribe({
        next: (response) => {
          console.log('Usuário cadastrado com sucesso:', response);
          this.isLoading = false;
          this.successMessage = 'Usuário cadastrado com sucesso!';
          
          // Limpar formulário
          this.userData = {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: 'reception'
          };
        },
        error: (error) => {
          console.error('Erro ao cadastrar usuário:', error);
          this.isLoading = false;

          if (error.status === 422) {
            // Erros de validação
            const errors = error.error?.errors;
            if (errors) {
              const firstError = Object.values(errors)[0];
              this.errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
            } else {
              this.errorMessage = 'Dados inválidos. Verifique os campos.';
            }
          } else if (error.status === 403) {
            this.errorMessage = 'Você não tem permissão para cadastrar usuários.';
          } else {
            this.errorMessage = 'Erro no servidor. Tente novamente.';
          }
        }
      });
    }
  }

  private validateForm(): boolean {
    if (!this.userData.name.trim()) {
      this.errorMessage = 'Nome é obrigatório';
      return false;
    }

    if (!this.userData.email.trim()) {
      this.errorMessage = 'Email é obrigatório';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.errorMessage = 'Email inválido';
      return false;
    }

    if (!this.userData.password.trim()) {
      this.errorMessage = 'Senha é obrigatória';
      return false;
    }

    if (this.userData.password.length < 6) {
      this.errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      return false;
    }

    if (this.userData.password !== this.userData.password_confirmation) {
      this.errorMessage = 'As senhas não conferem';
      return false;
    }

    if (!this.userData.role) {
      this.errorMessage = 'Perfil é obrigatório';
      return false;
    }

    return true;
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
