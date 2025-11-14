import { Component, Inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
export class Login implements OnInit {

  loginData: LoginData = {
    email: '',
    password: ''
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  sessionExpiredMessage: string = '';
  returnUrl: string = '/';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(AuthService) private authService: AuthService
  ) {
    // Se já estiver logado, redirecionar para home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    // Capturar parâmetros da URL
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
      
      // Verificar se foi redirecionado por sessão expirada
      if (params['expired'] === 'true') {
        this.sessionExpiredMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
      }
    });
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.sessionExpiredMessage = '';

      this.authService.login(this.loginData.email, this.loginData.password)
        .subscribe({
          next: (response) => {
            console.log('Login realizado com sucesso:', response);
            
            // Salvar dados de autenticação
            this.authService.setAuthData(response.user, response.token);
            
            this.isLoading = false;
            
            // Redirecionar para a URL de retorno ou página inicial
            this.router.navigate([this.returnUrl]);
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