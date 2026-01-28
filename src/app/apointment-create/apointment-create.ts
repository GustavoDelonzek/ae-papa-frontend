import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../services/patient.service';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentCreate } from '../core/models/appointment.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-apointment-create',
  standalone: false,
  templateUrl: './apointment-create.html',
  styleUrl: './apointment-create.scss'
})
export class ApointmentCreate {
  showSearchModal = false;
  searchCpf = '';
  searching = false;
  errorMessage = '';
  searchResult: Patient | null = null;
  selectedPatient: Patient | null = null;
  
  // Campos do formulário
  appointmentDate = '';
  appointmentObjective = '';
  observations = '';
  submitting = false;
  successMessage = '';
  currentUserId: number = 0;

  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {
    // Obter ID do usuário logado
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || 0;
  }

  openPatientSearchModal(): void {
    this.showSearchModal = true;
    this.searchCpf = '';
    this.errorMessage = '';
    this.searchResult = null;
  }

  closeModal(): void {
    this.showSearchModal = false;
    this.searchCpf = '';
    this.errorMessage = '';
    this.searchResult = null;
  }

  onSearchCpfChange(): void {
    // Formatar CPF automaticamente enquanto digita
    let cpf = this.searchCpf.replace(/\D/g, '');
    if (cpf.length > 11) {
      cpf = cpf.substring(0, 11);
    }
    
    if (cpf.length > 9) {
      this.searchCpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (cpf.length > 6) {
      this.searchCpf = cpf.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (cpf.length > 3) {
      this.searchCpf = cpf.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    } else {
      this.searchCpf = cpf;
    }

    this.errorMessage = '';
  }

  searchPatientByCpf(): void {
    if (!this.searchCpf) {
      return;
    }

    this.searching = true;
    this.errorMessage = '';
    this.searchResult = null;

    const cpfOnly = this.searchCpf.replace(/\D/g, '');

    // Buscar pelo CPF usando o serviço específico
    this.patientService.getPatientByCpf(cpfOnly).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          const patient = response.data[0];
          this.searchResult = {
            ...patient,
            name: patient.full_name
          } as any;
        } else {
          this.errorMessage = 'Atendido não encontrado';
        }
        this.searching = false;
      },
      error: (error) => {
        console.error('Erro ao buscar paciente:', error);
        this.errorMessage = 'Erro ao buscar atendido. Tente novamente.';
        this.searching = false;
      }
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.closeModal();
  }

  formatCpf(cpf: string): string {
    const cpfOnly = cpf.replace(/\D/g, '');
    return cpfOnly.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.appointmentDate = input.value;
  }

  createAppointment(): void {
    if (!this.selectedPatient || !this.appointmentDate || !this.appointmentObjective) {
      this.errorMessage = 'Preencha todos os campos obrigatórios.';
      return;
    }

    if (!this.currentUserId) {
      this.errorMessage = 'Usuário não identificado. Faça login novamente.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Converter data do formato YYYY-MM-DD para MM-DD-YYYY
    const [year, month, day] = this.appointmentDate.split('-');
    const formattedDate = `${month}-${day}-${year}`;

    const appointmentData: AppointmentCreate = {
      patient_id: this.selectedPatient.id!,
      user_id: this.currentUserId,
      date: formattedDate,
      objective: this.appointmentObjective,
      observations: this.observations.trim() || undefined
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (response) => {
        this.successMessage = 'Consulta criada com sucesso!';
        this.submitting = false;
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erro ao criar consulta:', error);
        this.errorMessage = error.error?.message || 'Erro ao criar consulta. Tente novamente.';
        this.submitting = false;
      }
    });
  }

  resetForm(): void {
    this.selectedPatient = null;
    this.appointmentDate = '';
    this.appointmentObjective = '';
    this.observations = '';
    this.errorMessage = '';
    this.successMessage = '';
  }
}
