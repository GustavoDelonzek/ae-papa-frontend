import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { PatientService, Patient, CaretakerService, Caretaker } from '../services';

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

  // Dados dos cuidadores
  caretakers: Caretaker[] = [];
  loadingCaretakers: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private caretakerService: CaretakerService
  ) { }

  ngOnInit(): void {
    // Pegar ID do paciente da rota
  this.route.params.subscribe((params: Params) => {
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
      next: (response: any) => {
        this.patientData = response.data;
        
        this.loading = false;
      },
  error: (error: any) => {
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
    
    // Carregar cuidadores quando a aba for selecionada
    if (tab === 'Cuidador' && this.caretakers.length === 0) {
      this.loadCaretakers();
    }
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

  // Métodos para gerenciar cuidadores
  loadCaretakers(): void {
    this.loadingCaretakers = true;
    
    this.caretakerService.getCaretakers(1, 100).subscribe({
      next: (response: any) => {
        console.log('Resposta da API (patient):', response);
        // Filtrar apenas cuidadores deste paciente
        this.caretakers = (response.data || []).filter(
          (caretaker: Caretaker) => caretaker.patient_id === this.patientId
        );
        console.log('Cuidadores filtrados:', this.caretakers);
        this.loadingCaretakers = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar cuidadores:', error);
        console.error('Detalhes do erro:', error.error);
        this.loadingCaretakers = false;
      }
    });
  }

  addCaretaker(): void {
    // Redirecionar para a página de cadastro passando o ID do paciente
    this.router.navigate(['/registro-cuidador'], {
      queryParams: { patientId: this.patientId }
    });
  }

  editCaretaker(caretakerId: number): void {
    this.router.navigate(['/registro-cuidador', caretakerId]);
  }

  deleteCaretaker(caretakerId: number): void {
    if (confirm('Tem certeza que deseja excluir este cuidador?')) {
      this.caretakerService.deleteCaretaker(caretakerId).subscribe({
        next: () => {
          // Recarregar lista de cuidadores
          this.loadCaretakers();
        },
        error: (error: any) => {
          console.error('Erro ao deletar cuidador:', error);
          alert('Erro ao excluir cuidador. Tente novamente.');
        }
      });
    }
  }

  getRelationshipText(relationship: string): string {
    const relationshipMap: { [key: string]: string } = {
      'son': 'Filho',
      'daughter': 'Filha',
      'spouse': 'Cônjuge',
      'partner': 'Companheiro(a)',
      'father': 'Pai',
      'mother': 'Mãe',
      'brother': 'Irmão',
      'sister': 'Irmã',
      'grand_son': 'Neto',
      'grand_daughter': 'Neta',
      'nephew': 'Sobrinho',
      'niece': 'Sobrinha',
      'friend': 'Amigo(a)',
      'professional_caregiver': 'Cuidador Profissional',
      'other': 'Outro'
    };
    return relationshipMap[relationship] || relationship;
  }

  goBack(): void {
    this.router.navigate(['/lista-pacientes']);
  }
}