import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { PatientService, Patient, CaretakerService, Caretaker, SocioeconomicProfileService, SocioeconomicProfile } from '../services';
import { AuthService } from '../services/auth.service';
import { AppointmentService } from '../services/appointment.service';
import { Appointment, AppointmentCreate } from '../core/models/appointment.model';
import { ClinicalRecord, ClinicalRecordService } from '../services/clinical-record.service';

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

  // Socioeconomic Profile
  socioeconomicProfile: SocioeconomicProfile | null = null;
  showSocioeconomicModal: boolean = false;
  loadingProfile: boolean = false;

  // Dados dos cuidadores
  caretakers: Caretaker[] = [];
  loadingCaretakers: boolean = false;

  // Controle do modal de upload de documentos
  showUploadModal = false;
  currentUserId: number = 0;

  // Controle do modal de cuidador
  showCaretakerModal = false;
  currentCaretaker: Caretaker | null = null;

  // Controle do modal de Registros Clínicos
  showClinicalRecordModal = false;
  currentClinicalRecord: ClinicalRecord | null = null;
  existingClinicalRecord: ClinicalRecord | null = null; // Single record reference

  // Dados das consultas
  appointments: Appointment[] = [];
  loadingAppointments: boolean = false;

  // Controle do modal de consulta
  showAppointmentModal = false;
  newAppointment: AppointmentCreate = {
    patient_id: 0,
    date: '',
    objective: '',
    observations: ''
  };
  savingAppointment = false;
  appointmentErrorMessage = '';

  // Appointment Details Modal
  showDetailsModal = false;
  selectedAppointment: Appointment | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private caretakerService: CaretakerService,
    private profileService: SocioeconomicProfileService,
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private clinicalRecordService: ClinicalRecordService
  ) { }

  ngOnInit(): void {
    // Obter ID do usuário logado
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || 0;

    // Pegar ID do paciente da rota
    this.route.params.subscribe((params: Params) => {
      if (params['id']) {
        this.patientId = parseInt(params['id'], 10);
        this.loadPatientData();
      } else {
        this.errorMessage = 'ID do paciente não fornecido';
      }
    });

    // Verificar se deve abrir a aba de cuidadores
    this.route.queryParams.subscribe((queryParams: any) => {
      if (queryParams['tab']) {
        this.activeTab = queryParams['tab'];
        // Se for aba de cuidador, carrega os cuidadores
        if (queryParams['tab'] === 'Cuidador') {
          this.loadCaretakers();
        }
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

        // Populate caretakers from patient data (Pivot mapping)
        if (this.patientData?.caregivers) {
          this.caretakers = this.patientData.caregivers.map(c => ({
            ...c,
            kinship: c.pivot?.kinship || c.kinship || '',
            patient_id: this.patientId
          }));
        }

        this.loading = false;

        // Load related data
        this.loadAppointments();
        this.loadClinicalRecords();
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

  // Controle do modal de edição
  showEditModal: boolean = false;

  openEditModal(): void {
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  onEditSuccess(): void {
    this.loadPatientData();
  }

  editPatient(): void {
    this.openEditModal();
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
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
  }

  onDocumentUploadSuccess(): void {
    this.showUploadModal = false;
    // O componente filho (document-list) vai recarregar automaticamente
  }

  // Métodos para gerenciar cuidadores
  loadCaretakers(): void {
    this.loadingCaretakers = true;

    this.caretakerService.getCaretakers(1, 100).subscribe({
      next: (response: any) => {
        // Filtrar apenas cuidadores deste paciente
        this.caretakers = (response.data || []).filter(
          (caretaker: Caretaker) => caretaker.patient_id === this.patientId
        );
        this.loadingCaretakers = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar cuidadores:', error);
        this.loadingCaretakers = false;
      }
    });
  }

  addCaretaker(): void {
    this.currentCaretaker = null;
    this.showCaretakerModal = true;
  }

  editCaretaker(caretakerId: number): void {
    // Find the caretaker and open modal for editing
    const caretaker = this.caretakers.find(c => c.id === caretakerId);
    if (caretaker) {
      this.currentCaretaker = { ...caretaker, patient_id: this.patientId };
      this.showCaretakerModal = true;
    }
  }

  closeCaretakerModal(): void {
    this.showCaretakerModal = false;
    this.currentCaretaker = null;
  }

  onCaretakerSuccess(): void {
    this.closeCaretakerModal();
    this.loadCaretakers();
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

  getKinshipText(kinship: string): string {
    const kinshipMap: { [key: string]: string } = {
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
    return kinshipMap[kinship] || kinship;
  }

  goBack(): void {
    this.router.navigate(['/lista-pacientes']);
  }

  // Métodos para gerenciar consultas
  loadAppointments(): void {
    this.loadingAppointments = true;

    this.appointmentService.listAppointments(1, 100, { patient_id: this.patientId }).subscribe({
      next: (response: any) => {
        this.appointments = response.data || [];
        this.loadingAppointments = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar consultas:', error);
        this.loadingAppointments = false;
      }
    });
  }

  openCreateAppointmentModal(): void {
    // Resetar formulário
    this.newAppointment = {
      patient_id: this.patientId,
      user_id: this.currentUserId,
      date: '',
      objective: '',
      observations: ''
    };
    this.appointmentErrorMessage = '';
    this.showAppointmentModal = true;
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.appointmentErrorMessage = '';
  }

  reloadAppointments(): void {
    this.loadAppointments();
  }

  createAppointment(): void {
    this.savingAppointment = true;
    this.appointmentErrorMessage = '';

    // Converter data de YYYY-MM-DD para MM-DD-YYYY sem usar Date object
    // para evitar problemas com timezone
    const dateParts = this.newAppointment.date.split('-');
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    const formattedDate = `${month}-${day}-${year}`;

    const appointmentData: AppointmentCreate = {
      ...this.newAppointment,
      date: formattedDate,
      patient_id: this.patientId,
      user_id: this.currentUserId
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (response: any) => {
        this.savingAppointment = false;
        this.closeAppointmentModal();
        // Recarregar lista de consultas
        this.reloadAppointments();
      },
      error: (error: any) => {
        console.error('Erro ao criar consulta:', error);
        this.savingAppointment = false;
        this.appointmentErrorMessage = 'Erro ao criar consulta. Tente novamente.';
      }
    });
  }

  formatAppointmentDate(date: string): string {
    if (!date) return 'Data não informada';

    date = date.trim();
    const parts = date.split('-');

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // Formato YYYY-MM-DD
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${day}/${month}/${year}`;
      } else {
        // Formato MM-DD-YYYY
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${day}/${month}/${year}`;
      }
    }

    return date;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'Agendada',
      'confirmed': 'Confirmada',
      'completed': 'Realizada',
      'cancelled': 'Cancelada',
      'pending': 'Pendente'
    };
    return statusMap[status] || status;
  }

  getObjectiveText(objective: string): string {
    const objectiveMap: { [key: string]: string } = {
      'donation': 'Doação',
      'project': 'Projeto',
      'treatment': 'Tratamento',
      'research': 'Pesquisa',
      'other': 'Outro'
    };
    return objectiveMap[objective] || objective;
  }

  viewAppointment(appointmentId: number): void {
    console.log('Viewing appointment:', appointmentId);
    const appointment = this.appointments.find(a => a.id === appointmentId);
    if (appointment) {
      // Ensure patient data is attached if missing (since we are in patient context)
      if (!appointment.patient && this.patientData) {
        appointment.patient = this.patientData;
      }
      this.selectedAppointment = appointment;
      this.showDetailsModal = true;
    }
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  onEditAppointmentDetails(appointment: Appointment): void {
    this.closeDetailsModal();
    // Logic to edit appointment if needed, maybe open edit modal?
    console.log('Edit appointment from details', appointment);
  }

  viewCaretaker(caretakerId: number): void {
    this.router.navigate(['/cuidador', caretakerId]);
  }

  // Socioeconomic Profile Methods
  openSocioeconomicModal(): void {
    this.showSocioeconomicModal = true;
  }

  closeSocioeconomicModal(): void {
    this.showSocioeconomicModal = false;
  }

  onSocioeconomicSuccess(profile: SocioeconomicProfile): void {
    this.socioeconomicProfile = profile;
    this.closeSocioeconomicModal();
    this.loadPatientData();
  }

  getIncomeDisplay(data: any): string {
    if (!data) return 'Não informado';

    let parsed = data;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        return data;
      }
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const category = parsed.category || '';
      const other = parsed.other ? ` (${parsed.other})` : '';
      return (category + other) || 'Não informado';
    }

    return typeof parsed === 'string' ? parsed : 'Não informado';
  }

  getSanitationDisplay(data: any): string {
    if (!data) return 'Não informado';
    let parsed = data;
    if (typeof data === 'string') {
      try { parsed = JSON.parse(data); } catch (e) { return data; }
    }

    if (typeof parsed !== 'object' || parsed === null) return parsed || 'Não informado';

    const parts = [];
    if (parsed.piped_water) parts.push('Água Encanada');
    if (parsed.water_tank) parts.push('Caixa D\'água');
    if (parsed.electricity) parts.push('Luz Elétrica');
    if (parsed.sewage) parts.push('Rede de Esgoto');
    if (parsed.septic_tank) parts.push('Fossa');
    if (parsed.trash_collection) parts.push('Coleta de Lixo');
    if (parsed.sanitary_installations) parts.push('Instalações Sanitárias');

    return parts.length > 0 ? parts.join(', ') : 'Nenhum item selecionado';
  }

  // Clinical Records Helpers & Logic
  loadClinicalRecords(): void {
    if (!this.patientId) return;

    this.clinicalRecordService.getClinicalRecords(this.patientId).subscribe({
      next: (response: any) => {
        const records = response.data || [];
        // Take the first one if any exist
        this.existingClinicalRecord = records.length > 0 ? records[0] : null;
      },
      error: (error: any) => {
        console.error('Erro ao carregar registros clínicos:', error);
      }
    });
  }

  handleClinicalRecordAction(): void {
    if (this.existingClinicalRecord) {
      this.editClinicalRecord(this.existingClinicalRecord);
    } else {
      this.openClinicalRecordModal();
    }
  }

  getStageClass(stage: string): string {
    if (!stage) return 'status-neutral';
    switch (stage.toLowerCase()) {
      case 'inicial': return 'status-success'; // Green
      case 'intermediário':
      case 'intermediario': return 'status-warning'; // Yellow
      case 'avançado':
      case 'avancado': return 'status-danger'; // Orange/Red
      default: return 'status-neutral';
    }
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Clinical Record Modal Methods
  openClinicalRecordModal() {
    this.currentClinicalRecord = null;
    this.showClinicalRecordModal = true;
  }

  editClinicalRecord(record: any) {
    this.currentClinicalRecord = record;
    this.showClinicalRecordModal = true;
  }

  closeClinicalRecordModal() {
    this.showClinicalRecordModal = false;
    this.currentClinicalRecord = null;
  }

  onClinicalRecordSuccess(record: any) {
    this.closeClinicalRecordModal();
    this.loadPatientData();
  }
}