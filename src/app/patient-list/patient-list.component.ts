import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient } from '../services';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
  standalone: false,
})
export class PatientListComponent implements OnInit {
  
  searchTerm: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  
  // Lista de pacientes do backend
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];

  constructor(
    private router: Router,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.patientService.getPatients().subscribe({
      next: (response) => {
        this.patients = response.data;
        this.filteredPatients = [...this.patients];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar pacientes:', error);
        this.loading = false;
        this.errorMessage = 'Erro ao carregar lista de pacientes. Tente novamente.';
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = [...this.patients];
      return;
    }
    
    this.filteredPatients = this.patients.filter(patient => 
      patient.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      patient.cpf.includes(this.searchTerm) ||
      (patient.id && patient.id.toString().includes(this.searchTerm))
    );
  }

  getStatusClass(status: string): string {
    return status || 'active';
  }

  getPatientAge(birthDate: string): number {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getMaritalStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)'
    };
    return statusMap[status] || status;
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '';
    // Remove tudo que não é dígito
    const cleaned = cpf.replace(/\D/g, '');
    // Aplica a máscara XXX.XXX.XXX-XX
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  addPatient(): void {
    this.router.navigate(['/registro-paciente']);
  }

  viewPatient(id: number): void {
    this.router.navigate(['/paciente', id]);
  }

  editPatient(id: number): void {
    this.router.navigate(['/paciente', id, 'edit']);
  }

  deletePatient(id: number): void {
    if (confirm('Tem certeza que deseja deletar este paciente?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.patients = this.patients.filter(p => p.id !== id);
          this.onSearch();
          console.log('Paciente deletado com sucesso');
        },
        error: (error) => {
          console.error('Erro ao deletar paciente:', error);
          this.errorMessage = 'Erro ao deletar paciente. Tente novamente.';
        }
      });
    }
  }
}