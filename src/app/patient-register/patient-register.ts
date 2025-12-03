import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { PatientService, Patient } from '../services';

@Component({
  selector: 'app-patient-register',
  standalone: false,
  templateUrl: './patient-register.html',
  styleUrl: './patient-register.scss'
})
export class PatientRegister implements OnInit {
  isEditing: boolean = false;
  patientId: number | null = null;

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
    private patientService: PatientService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      if (params['id']) {
        this.patientId = parseInt(params['id'], 10);
        this.loadPatientForEdit(this.patientId);
      }
    });
  }

  private loadPatientForEdit(id: number): void {
    this.isLoading = true;
    this.patientService.getPatient(id).subscribe({
      next: (response: any) => {
        // Preencher o formulário com os dados retornados, incluindo o id
        this.patientData = {
          id: response.data.id,
          full_name: response.data.full_name || '',
          birth_date: response.data.birth_date || '',
          gender: response.data.gender || '',
          marital_status: response.data.marital_status || '',
          cpf: response.data.cpf || '',
          rg: response.data.rg || ''
        };
        this.isEditing = true;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar paciente para edição:', error);
        this.errorMessage = 'Erro ao carregar dados do paciente para edição.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Chamar criação ou atualização conforme o modo
      if (this.isEditing) {
        this.updatePatient();
      } else {
        this.savePatient();
      }
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

    // Se o RG estiver vazio, não enviar o campo (evita validação do backend que espera string)
    const payload: any = { ...formattedData };
    if (payload.rg === '' || payload.rg === null || payload.rg === undefined) {
      delete payload.rg;
    }

    this.patientService.createPatient(payload).subscribe({
      next: (response: any) => {
        console.log('Paciente cadastrado com sucesso:', response);
        this.isLoading = false;
        this.successMessage = 'Paciente cadastrado com sucesso!';
        
        // Redirecionar para lista de pacientes após sucesso
        setTimeout(() => {
          this.router.navigate(['/lista-pacientes']);
        }, 1200);
      },
  error: (error: any) => {
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

  private updatePatient(): void {
    // Usar o patientId armazenado quando carregamos os dados
    if (!this.patientId) {
      this.errorMessage = 'ID do paciente inválido para atualização.';
      this.isLoading = false;
      return;
    }

    const formattedData = {
      ...this.patientData,
      patient_id: this.patientId, // Enviar como patient_id conforme esperado pelo backend
      birth_date: this.formatDateForAPI(this.patientData.birth_date)
    };

    const payload: any = { ...formattedData };
    // Remover o campo 'id' se existir, pois usamos 'patient_id'
    if (payload.id !== undefined) {
      delete payload.id;
    }
    if (payload.rg === '' || payload.rg === null || payload.rg === undefined) {
      delete payload.rg;
    }

    console.log('Payload de atualização:', payload); // Debug: ver o que está sendo enviado

    this.patientService.updatePatient(this.patientId, payload).subscribe({
      next: (response: any) => {
        console.log('Paciente atualizado com sucesso:', response);
        this.isLoading = false;
        this.successMessage = 'Paciente atualizado com sucesso!';
        setTimeout(() => {
          // Após atualizar, redirecionar para a página do paciente
          this.router.navigate(['/paciente', this.patientId]);
        }, 1200);
      },
  error: (error: any) => {
        console.error('Erro ao atualizar paciente:', error);
        this.isLoading = false;
        if (error.status === 422) {
          this.handleValidationErrors(error.error.errors);
        } else {
          this.errorMessage = 'Erro ao atualizar paciente. Tente novamente.';
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
    // Log completo dos erros para debug
    console.log('Erros de validação do backend:', errors);
    
    // Tratar erros de validação específicos
    if (errors.cpf) {
      this.errorMessage = `CPF: ${errors.cpf[0]}`;
    } else if (errors.full_name) {
      this.errorMessage = `Nome: ${errors.full_name[0]}`;
    } else if (errors.birth_date) {
      this.errorMessage = `Data de nascimento: ${errors.birth_date[0] || 'Data de nascimento inválida'}`;
    } else if (errors.gender) {
      this.errorMessage = `Gênero: ${errors.gender[0] || 'Gênero inválido'}`;
    } else if (errors.marital_status) {
      this.errorMessage = `Estado civil: ${errors.marital_status[0] || 'Estado civil inválido'}`;
    } else if (errors.rg) {
      this.errorMessage = `RG: ${errors.rg[0]}`;
    } else {
      // Mostrar todos os erros disponíveis
      const errorMessages = Object.keys(errors).map(key => {
        const messages = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
        return `${key}: ${messages.join(', ')}`;
      });
      this.errorMessage = errorMessages.length > 0 
        ? `Erros: ${errorMessages.join('; ')}` 
        : 'Dados inválidos. Verifique os campos preenchidos.';
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

  onCancel(): void {
    if (this.isEditing && this.patientId) {
      this.router.navigate(['/paciente', this.patientId]);
      return;
    }

    // Redirecionar para lista de pacientes ao cancelar criação
    this.router.navigate(['/lista-pacientes']);
  }
}
