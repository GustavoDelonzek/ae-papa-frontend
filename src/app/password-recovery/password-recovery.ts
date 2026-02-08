import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services';

interface RecoveryData {
  email: string;
}

@Component({
  selector: 'app-password-recovery',
  standalone: false,
  templateUrl: './password-recovery.html',
  styleUrls: ['../login/login.scss']
})
export class PasswordRecovery {

  recoveryData: RecoveryData = {
    email: ''
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    @Inject(AuthService) private authService: AuthService
  ) {
    
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.requestPasswordReset(this.recoveryData.email)
        .subscribe({
          next: (response: any) => {
            console.log('Solicitação de recuperação enviada:', response);
            this.isLoading = false;
            this.successMessage = 'Um link de recuperação foi enviado para seu email. Verifique sua caixa de entrada.';
            
            
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          },
          error: (error: any) => {
            console.error('Erro ao solicitar recuperação:', error);
            this.isLoading = false;
            
            if (error.status === 404) {
              this.errorMessage = 'Email não encontrado no sistema';
            } else if (error.status === 400) {
              this.errorMessage = error.error.message || 'Email inválido';
            } else {
              this.errorMessage = 'Erro ao processar solicitação. Tente novamente.';
            }
          }
        });
    }
  }

  private validateForm(): boolean {
    if (!this.recoveryData.email.trim()) {
      this.errorMessage = 'Email é obrigatório';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.recoveryData.email)) {
      this.errorMessage = 'Email inválido';
      return false;
    }

    return true;
  }
}
