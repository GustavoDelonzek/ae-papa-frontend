import { Component, Inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services';
import { ToastService } from '../services/toast.service';

interface LoginData {
  email: string;
  password: string;
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {

  loginData: LoginData = {
    email: '',
    password: ''
  };

  isLoading: boolean = false;
  returnUrl: string = '/';
  showPassword: boolean = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(AuthService) private authService: AuthService,
    private toastService: ToastService
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
        this.toastService.warning('Sua sessão expirou. Por favor, faça login novamente.');
      }
    });
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;

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
              this.toastService.error('Email ou senha incorretos');
            } else {
              this.toastService.error('Erro no servidor. Tente novamente.');
            }
          }
        });
    }
  }

  private validateForm(): boolean {
    if (!this.loginData.email.trim()) {
      this.toastService.warning('Email é obrigatório');
      return false;
    }

    if (!this.loginData.password.trim()) {
      this.toastService.warning('Senha é obrigatória');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginData.email)) {
      this.toastService.warning('Email inválido');
      return false;
    }

    return true;
  }
}