import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {

  loginData: LoginData = {
    email: '',
    password: ''
  };

  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    @Inject(AuthService) private authService: AuthService
  ) {
    // Se já estiver logado, redirecionar para home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginData.email, this.loginData.password)
        .subscribe({
          next: (response) => {
            console.log('Login realizado com sucesso:', response);
            
            // Salvar dados de autenticação
            this.authService.setAuthData(response.user, response.token);
            
            this.isLoading = false;
            
            // Redirecionar para a página inicial
            this.router.navigate(['/']);
          },
          error: (error) => {
            console.error('Erro no login:', error);
            this.isLoading = false;
            
            if (error.status === 401) {
              this.errorMessage = 'Email ou senha incorretos';
            } else {
              this.errorMessage = 'Erro no servidor. Tente novamente.';
            }
          }
        });
    }
  }

  private validateForm(): boolean {
    if (!this.loginData.email.trim()) {
      this.errorMessage = 'Email é obrigatório';
      return false;
    }

    if (!this.loginData.password.trim()) {
      this.errorMessage = 'Senha é obrigatória';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginData.email)) {
      this.errorMessage = 'Email inválido';
      return false;
    }

    return true;
  }
}