import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface PatientData {
  full_name: string;
  birth_date: string;
  gender: string;
  marital_status: string;
  cpf: string;
  rg: string;
}

@Component({
  selector: 'app-patient-register',
  standalone: false,
  templateUrl: './patient-register.html',
  styleUrl: './patient-register.scss'
})
export class PatientRegister {
  
  patientData: PatientData = {
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

  constructor(private router: Router) {}

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
    // Simular delay de API
    setTimeout(() => {
      console.log('Dados do paciente:', this.patientData);
      
      // Simular sucesso
      this.isLoading = false;
      this.successMessage = 'Paciente cadastrado com sucesso!';
      
      // Resetar formulário após sucesso
      setTimeout(() => {
        this.resetForm();
        this.successMessage = '';
      }, 2000);
      
    }, 1500);
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
