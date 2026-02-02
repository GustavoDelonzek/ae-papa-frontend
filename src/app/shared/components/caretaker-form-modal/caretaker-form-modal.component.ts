import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CaretakerService, Caretaker, CaretakerResponse, PatientService, Patient } from '../../../services';

@Component({
    selector: 'app-caretaker-form-modal',
    templateUrl: './caretaker-form-modal.component.html',
    styleUrls: ['./caretaker-form-modal.component.scss'],
    standalone: false
})
export class CaretakerFormModalComponent implements OnChanges {
    @Input() visible: boolean = false;
    @Input() patientId: number | null = null;
    @Input() caretaker: Caretaker | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() success = new EventEmitter<void>();

    isEditing: boolean = false;
    isSaving: boolean = false;
    errorMessage: string = '';

    // Patient search
    patients: Patient[] = [];
    filteredPatients: Patient[] = [];
    patientSearchTerm: string = '';
    selectedPatient: Patient | null = null;
    showPatientDropdown: boolean = false;
    loadingPatients: boolean = false;

    currentCaretaker: Caretaker = {
        full_name: '',
        cpf: '',
        rg: '',
        birth_date: '',
        gender: '',
        kinship: '',
        patient_id: undefined
    };

    constructor(
        private caretakerService: CaretakerService,
        private patientService: PatientService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.onOpen();
        }
        if (changes['caretaker']) {
            if (this.caretaker) {
                this.isEditing = true;
                this.currentCaretaker = { ...this.caretaker };
                if (this.currentCaretaker.birth_date) {
                    this.currentCaretaker.birth_date = this.currentCaretaker.birth_date.split('T')[0];
                }
            } else {
                this.isEditing = false;
                this.resetForm();
            }
        }
        if (changes['patientId'] && this.patientId && !this.isEditing) {
            this.currentCaretaker.patient_id = this.patientId;
        }
    }

    onOpen(): void {
        // Load patients if we need to show the patient selector
        if (!this.patientId && !this.isEditing) {
            this.loadPatients();
        }
    }

    loadPatients(): void {
        this.loadingPatients = true;
        this.patientService.getPatients(1, 100).subscribe({
            next: (response: any) => {
                this.patients = response.data || [];
                this.filteredPatients = [...this.patients];
                this.loadingPatients = false;
            },
            error: (error: any) => {
                console.error('Erro ao carregar pacientes:', error);
                this.loadingPatients = false;
            }
        });
    }

    onPatientSearch(): void {
        const term = this.patientSearchTerm.toLowerCase().trim();
        if (!term) {
            this.filteredPatients = [...this.patients];
        } else {
            this.filteredPatients = this.patients.filter(p =>
                p.full_name.toLowerCase().includes(term) ||
                (p.cpf && p.cpf.replace(/\D/g, '').includes(term.replace(/\D/g, '')))
            );
        }
        this.showPatientDropdown = true;
    }

    selectPatient(patient: Patient): void {
        this.selectedPatient = patient;
        this.currentCaretaker.patient_id = patient.id!;
        this.patientSearchTerm = patient.full_name;
        this.showPatientDropdown = false;
    }

    clearPatientSelection(): void {
        this.selectedPatient = null;
        this.currentCaretaker.patient_id = undefined;
        this.patientSearchTerm = '';
    }

    get needsPatientSelection(): boolean {
        return !this.patientId && !this.isEditing;
    }

    resetForm(): void {
        this.currentCaretaker = {
            full_name: '',
            cpf: '',
            rg: '',
            birth_date: '',
            gender: '',
            kinship: '',
            patient_id: this.patientId || undefined
        };
        this.errorMessage = '';
        this.selectedPatient = null;
        this.patientSearchTerm = '';
        this.showPatientDropdown = false;
    }

    onClose(): void {
        this.resetForm();
        this.close.emit();
    }

    save(): void {
        if (!this.validateForm()) return;

        this.isSaving = true;
        this.errorMessage = '';

        const formattedData = {
            ...this.currentCaretaker,
            birth_date: this.formatDateForAPI(this.currentCaretaker.birth_date)
        };

        const payload: any = { ...formattedData };
        if (!payload.rg) delete payload.rg;

        console.log('Payload sendo enviado:', payload);
        console.log('currentCaretaker:', this.currentCaretaker);

        const request = this.isEditing && this.currentCaretaker.id
            ? this.caretakerService.updateCaretaker(this.currentCaretaker.id, payload)
            : this.caretakerService.createCaretaker(payload);

        request.subscribe({
            next: () => {
                this.isSaving = false;
                this.success.emit();
                this.onClose();
            },
            error: (error: any) => {
                console.error('Erro ao salvar cuidador:', error);
                this.isSaving = false;
                if (error.status === 409) {
                    this.errorMessage = 'CPF já cadastrado.';
                } else if (error.status === 422) {
                    this.handleValidationErrors(error.error.errors);
                } else {
                    this.errorMessage = 'Erro ao salvar cuidador. Tente novamente.';
                }
            }
        });
    }

    validateForm(): boolean {
        const c = this.currentCaretaker;
        if (!c.full_name?.trim()) { this.errorMessage = 'Nome completo é obrigatório'; return false; }
        if (!c.birth_date) { this.errorMessage = 'Data de nascimento é obrigatória'; return false; }
        if (!c.gender) { this.errorMessage = 'Gênero é obrigatório'; return false; }
        if (!c.cpf) { this.errorMessage = 'CPF é obrigatório'; return false; }
        if (!this.isValidCPF(c.cpf)) { this.errorMessage = 'CPF inválido'; return false; }

        // Validação de parentesco apenas na criação
        if (!this.isEditing) {
            if (!c.patient_id) { this.errorMessage = 'Selecione um paciente'; return false; }
            if (!c.kinship) { this.errorMessage = 'Parentesco é obrigatório'; return false; }
        }

        return true;
    }

    isValidCPF(cpf: string): boolean {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;

        return true;
    }

    formatDateForAPI(date: string): string {
        if (!date) return '';
        const [year, month, day] = date.split('-');
        return `${month}-${day}-${year}`;
    }

    handleValidationErrors(errors: any): void {
        if (errors.cpf) this.errorMessage = `CPF: ${errors.cpf[0]}`;
        else if (errors.full_name) this.errorMessage = `Nome: ${errors.full_name[0]}`;
        else this.errorMessage = 'Dados inválidos. Verifique os campos.';
    }

    formatCPF(event: Event): void {
        const input = event.target as HTMLInputElement;
        let cleaned = input.value.replace(/\D/g, '');

        if (cleaned.length <= 11) {
            if (cleaned.length > 9) {
                cleaned = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
            } else if (cleaned.length > 6) {
                cleaned = cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
            } else if (cleaned.length > 3) {
                cleaned = cleaned.replace(/(\d{3})(\d{1,3})/, '$1.$2');
            }

            this.currentCaretaker.cpf = cleaned;
        }
    }

    formatPatientCPF(cpf: string): string {
        if (!cpf) return '';
        const cleaned = cpf.replace(/\D/g, '');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
}
