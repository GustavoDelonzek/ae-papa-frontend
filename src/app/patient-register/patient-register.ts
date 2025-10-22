import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../services';

@Component({
  selector: 'app-patient-register',
  standalone: false,
  templateUrl: './patient-register.html',
  styleUrl: './patient-register.scss'
})
export class PatientRegister {
  
  patientData: Patient = {
    full_name: '',
    birth_date: '',
    gender: '',
    marital_status: '',
    cpf: '',
    rg: ''
  };

  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Simular chamada à API
      this.savePatient();
    }
  }

  private validateForm(): boolean {
    // Validação adicional se necessário
    if (!this.patientData.full_name.trim()) {
      this.errorMessage = 'Nome completo é obrigatório';
      return false;
    }

    if (!this.patientData.birth_date) {
      this.errorMessage = 'Data de nascimento é obrigatória';
      return false;
    }

    if (!this.patientData.gender) {
      this.errorMessage = 'Gênero é obrigatório';
      return false;
    }

    if (!this.patientData.marital_status) {
      this.errorMessage = 'Estado civil é obrigatório';
      return false;
    }

    if (!this.patientData.cpf) {
      this.errorMessage = 'CPF é obrigatório';
      return false;
    }

    if (!this.isValidCPF(this.patientData.cpf)) {
      this.errorMessage = 'CPF inválido';
      return false;
    }

    return true;
  }

  private isValidCPF(cpf: string): boolean {
    // Remover formatação
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  private savePatient(): void {
    // Formatar a data para o formato esperado pelo backend (m-d-Y)
    const formattedData = {
      ...this.patientData,
      birth_date: this.formatDateForAPI(this.patientData.birth_date)
    };

    this.patientService.createPatient(formattedData).subscribe({
      next: (response) => {
        console.log('Paciente cadastrado com sucesso:', response);
        this.isLoading = false;
        this.successMessage = 'Paciente cadastrado com sucesso!';
        
        // Resetar formulário após sucesso
        setTimeout(() => {
          this.resetForm();
          this.successMessage = '';
          // Opcionalmente redirecionar para lista de pacientes
          // this.router.navigate(['/lista-pacientes']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erro ao cadastrar paciente:', error);
        this.isLoading = false;
        
        if (error.status === 422) {
          // Erro de validação
          this.handleValidationErrors(error.error.errors);
        } else if (error.status === 409) {
          this.errorMessage = 'CPF ou RG já cadastrado no sistema';
        } else {
          this.errorMessage = 'Erro no servidor. Tente novamente.';
        }
      }
    });
  }

  private formatDateForAPI(date: string): string {
    // Converter de YYYY-MM-DD para MM-DD-YYYY (formato esperado pelo backend)
    if (!date) return '';
    
    const [year, month, day] = date.split('-');
    return `${month}-${day}-${year}`;
  }

  private handleValidationErrors(errors: any): void {
    // Tratar erros de validação específicos
    if (errors.cpf) {
      this.errorMessage = errors.cpf[0];
    } else if (errors.full_name) {
      this.errorMessage = errors.full_name[0];
    } else if (errors.birth_date) {
      this.errorMessage = 'Data de nascimento inválida';
    } else if (errors.gender) {
      this.errorMessage = 'Gênero inválido';
    } else if (errors.marital_status) {
      this.errorMessage = 'Estado civil inválido';
    } else if (errors.rg) {
      this.errorMessage = errors.rg[0];
    } else {
      this.errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
    }
  }

  resetForm(): void {
    this.patientData = {
      full_name: '',
      birth_date: '',
      gender: '',
      marital_status: '',
      cpf: '',
      rg: ''
    };
    
    this.errorMessage = '';
    this.successMessage = '';
  }
}
