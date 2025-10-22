import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService, Patient } from '../services';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss'],
  standalone: false,
})
export class PatientComponent implements OnInit {
  
  patientId: number = 0;
  activeTab: string = 'detalhes';
  loading: boolean = false;
  errorMessage: string = '';
  
  // Dados reais do paciente do backend
  patientData: Patient | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    // Pegar ID do paciente da rota
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.patientId = parseInt(params['id'], 10);
        this.loadPatientData();
      } else {
        this.errorMessage = 'ID do paciente não fornecido';
      }
    });
  }

  loadPatientData(): void {
    if (!this.patientId) return;
    
    this.loading = true;
    this.errorMessage = '';
    
    this.patientService.getPatient(this.patientId).subscribe({
      next: (response) => {
        this.patientData = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do paciente:', error);
        this.loading = false;
        
        if (error.status === 404) {
          this.errorMessage = 'Paciente não encontrado';
        } else {
          this.errorMessage = 'Erro ao carregar dados do paciente. Tente novamente.';
        }
      }
    });
  }


  isTabActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  getPatientAge(): number {
    if (!this.patientData?.birth_date) return 0;
    
    const birth = new Date(this.patientData.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getGenderText(): string {
    if (!this.patientData?.gender) return 'Não informado';
    return this.patientData.gender === 'M' ? 'Masculino' : 'Feminino';
  }

  getMaritalStatusText(): string {
    if (!this.patientData?.marital_status) return 'Não informado';
    
    const statusMap: { [key: string]: string } = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)'
    };
    return statusMap[this.patientData.marital_status] || this.patientData.marital_status;
  }

  formatCPF(cpf: string): string {
    if (!cpf) return 'Não informado';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatDate(date: string): string {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  editPatient(): void {
    this.router.navigate(['/registro-paciente', this.patientId]);
  }

  onPhotoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Aqui você pode implementar upload real de foto
        if (this.patientData) {
          this.patientData.photo = e.target.result;
        }
        console.log('Foto carregada:', e.target.result);
        // TODO: Implementar upload real para o backend
      };
      reader.readAsDataURL(file);
    }
  }

  deleteDocument(document: any): void {
    if (confirm(`Tem certeza que deseja deletar o documento "${document.name}"?`)) {
      // TODO: Implementar deleção real no backend
      console.log('Documento deletado:', document.name);
    }
  }

  downloadDocument(documentName: string): void {
    // TODO: Implementar download real do backend
    console.log('Baixar documento:', documentName);
  }

  addDocument(): void {
    // TODO: Implementar modal para upload de documento
    console.log('Adicionar novo documento');
  }

  goBack(): void {
    this.router.navigate(['/lista-pacientes']);
  }
}