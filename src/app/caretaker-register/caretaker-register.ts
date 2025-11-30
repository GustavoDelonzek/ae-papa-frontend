import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { CaretakerService, Caretaker, CaretakerResponse } from '../services';

@Component({
  selector: 'app-caretaker-register',
  standalone: false,
  templateUrl: './caretaker-register.html',
  styleUrl: './caretaker-register.scss',
})
export class CaretakerRegister implements OnInit {
  isEditing: boolean = false;
  caretakerId: number | null = null;

  caretakerData: Caretaker = {
    full_name: '',
    cpf: '',
    rg: '',
    birth_date: '',
    gender: '',
    marital_status: '',
    relationship: '',
    patient_id: null
  };

  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private caretakerService: CaretakerService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Capturar query params primeiro (para pegar patientId se vier da página do paciente)
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams['patientId']) {
        this.caretakerData.patient_id = parseInt(queryParams['patientId'], 10);
      }
    });

    // Depois verificar se é edição
    this.route.params.subscribe((params: Params) => {
      if (params['id']) {
        this.caretakerId = parseInt(params['id'], 10);
        this.loadCaretakerForEdit(this.caretakerId);
      }
    });
  }

  private loadCaretakerForEdit(id: number): void {
    this.isLoading = true;
    this.caretakerService.getCaretaker(id).subscribe({
      next: (response: CaretakerResponse) => {
        this.caretakerData = {
          id: response.data.id,
          full_name: response.data.full_name || '',
          cpf: response.data.cpf || '',
          rg: response.data.rg || '',
          birth_date: this.formatDateForAPI(response.data.birth_date) || '',
          gender: response.data.gender || '',
          marital_status: response.data.marital_status || '',
          relationship: response.data.relationship || '',
          patient_id: response.data.patient_id || null
        };
        this.isEditing = true;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar cuidador para edição:', error);
        this.errorMessage = 'Erro ao carregar dados do cuidador para edição.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      if (this.isEditing) {
        this.updateCaretaker();
      } else {
        this.saveCaretaker();
      }
    }
  }

  private validateForm(): boolean {
    if (!this.caretakerData.full_name.trim()) {
      this.errorMessage = 'Nome completo é obrigatório';
      return false;
    }

    if (!this.caretakerData.cpf) {
      this.errorMessage = 'CPF é obrigatório';
      return false;
    }

    if (!this.isValidCPF(this.caretakerData.cpf)) {
      this.errorMessage = 'CPF inválido';
      return false;
    }

    if (!this.caretakerData.birth_date) {
      this.errorMessage = 'Data de nascimento é obrigatória';
      return false;
    }

    if (!this.caretakerData.gender) {
      this.errorMessage = 'Gênero é obrigatório';
      return false;
    }

    if (!this.caretakerData.relationship) {
      this.errorMessage = 'Parentesco/Relação é obrigatório';
      return false;
    }

    if (!this.caretakerData.patient_id) {
      this.errorMessage = 'ID do paciente é obrigatório';
      return false;
    }

    return true;
  }

  private isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
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

  private saveCaretaker(): void {
    const formattedData = {
      ...this.caretakerData,
      birth_date: this.formatDateForAPI(this.caretakerData.birth_date)
    };

    const payload: any = { ...formattedData };
    delete payload.marital_status; // Campo não existe na tabela caregivers
    if (payload.rg === '' || payload.rg === null || payload.rg === undefined) {
      delete payload.rg;
    }
    if (payload.patient_id === null || payload.patient_id === undefined) {
      delete payload.patient_id;
    }
    console.log('Payload enviado:', payload);

    this.caretakerService.createCaretaker(payload).subscribe({
      next: (response: CaretakerResponse) => {
        console.log('Cuidador criado com sucesso:', response);
        this.successMessage = 'Cuidador cadastrado com sucesso!';
        this.isLoading = false;
        
        setTimeout(() => {
          this.router.navigate(['/lista-cuidadores']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Erro ao criar cuidador:', error);
        this.errorMessage = error.error?.message || 'Erro ao cadastrar cuidador. Verifique os dados.';
        this.isLoading = false;
      }
    });
  }

  private updateCaretaker(): void {
    const formattedData = {
      ...this.caretakerData,
      birth_date: this.formatDateForAPI(this.caretakerData.birth_date),
      caretaker_id: this.caretakerId
    };

    const payload: any = { ...formattedData };
    delete payload.id;
    delete payload.marital_status; // Campo não existe na tabela caregivers
    
    if (payload.rg === '' || payload.rg === null || payload.rg === undefined) {
      delete payload.rg;
    }

    this.caretakerService.updateCaretaker(this.caretakerId!, payload).subscribe({
      next: (response: CaretakerResponse) => {
        console.log('Cuidador atualizado com sucesso:', response);
        this.successMessage = 'Cuidador atualizado com sucesso!';
        this.isLoading = false;
        
        setTimeout(() => {
          this.router.navigate(['/lista-cuidadores']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Erro ao atualizar cuidador:', error);
        this.errorMessage = error.error?.message || 'Erro ao atualizar cuidador. Verifique os dados.';
        this.isLoading = false;
      }
    });
  }

  private formatDateForAPI(date: string): string {
    if (!date) return '';
    
    // Se a data já está no formato yyyy-mm-dd
    if (date.includes('-') && date.split('-')[0].length === 4) {
      const [year, month, day] = date.split('-');
      return `${month}-${day}-${year}`;
    }
    
    // Se a data está em outro formato, tenta parsear
    const dateObj = new Date(date);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${month}-${day}-${year}`;
  }

  formatCPF(cpf: string): void {
    let cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length <= 11) {
      if (cleaned.length > 9) {
        cleaned = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (cleaned.length > 6) {
        cleaned = cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (cleaned.length > 3) {
        cleaned = cleaned.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      }
      
      this.caretakerData.cpf = cleaned;
    }
  }

  onCancel(): void {
    this.router.navigate(['/lista-cuidadores']);
  }
}

