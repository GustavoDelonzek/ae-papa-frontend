import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Patient, PatientService } from '../../../services';

@Component({
    selector: 'app-patient-form-modal',
    templateUrl: './patient-form-modal.component.html',
    styleUrls: ['./patient-form-modal.component.scss'],
    standalone: false
})
export class PatientFormModalComponent implements OnInit {
    @Input() visible: boolean = false;
    @Input() patient: Patient | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() success = new EventEmitter<void>();

    isEditing: boolean = false;
    isSaving: boolean = false;
    errorMessage: string = '';

    currentPatient: Patient = {
        full_name: '',
        birth_date: '',
        gender: '',
        marital_status: '',
        cpf: '',
        rg: ''
    };

    constructor(private patientService: PatientService) { }

    ngOnInit(): void {
        // Inicialização se necessário
    }

    // Chamado quando o input patient muda (se usando ngOnChanges ou setter, mas aqui vamos usar um método public ou setter no visible)
    // Melhor abordagem: usar ngOnChanges para detetar quando patient muda, ou simplesmente quando o modal abre.
    // Vamos usar um setter para 'patient' para resetar o form quando ele mudar.
    @Input('patient')
    set setPatient(val: Patient | null) {
        if (val) {
            this.isEditing = true;
            this.currentPatient = { ...val };
            if (this.currentPatient.birth_date) {
                this.currentPatient.birth_date = this.currentPatient.birth_date.split('T')[0];
            }
        } else {
            this.isEditing = false;
            this.resetForm();
        }
    }

    resetForm(): void {
        this.currentPatient = {
            full_name: '',
            birth_date: '',
            gender: '',
            marital_status: '',
            cpf: '',
            rg: ''
        };
        this.errorMessage = '';
    }

    onClose(): void {
        this.close.emit();
    }

    save(): void {
        if (!this.validateForm()) return;

        this.isSaving = true;
        this.errorMessage = '';

        const formattedData = {
            ...this.currentPatient,
            birth_date: this.formatDateForAPI(this.currentPatient.birth_date)
        };

        const payload: any = { ...formattedData };
        if (!payload.rg) delete payload.rg;

        const request = this.isEditing && this.currentPatient.id
            ? this.patientService.updatePatient(this.currentPatient.id, payload)
            : this.patientService.createPatient(payload);

        request.subscribe({
            next: () => {
                this.isSaving = false;
                this.success.emit();
                this.onClose();
            },
            error: (error: any) => {
                console.error('Erro ao salvar paciente:', error);
                this.isSaving = false;
                if (error.status === 409) {
                    this.errorMessage = 'CPF ou RG já cadastrado.';
                } else if (error.status === 422) {
                    this.handleValidationErrors(error.error.errors);
                } else {
                    this.errorMessage = 'Erro ao salvar paciente. Tente novamente.';
                }
            }
        });
    }

    validateForm(): boolean {
        const p = this.currentPatient;
        if (!p.full_name?.trim()) { this.errorMessage = 'Nome completo é obrigatório'; return false; }
        if (!p.birth_date) { this.errorMessage = 'Data de nascimento é obrigatória'; return false; }
        if (!p.gender) { this.errorMessage = 'Gênero é obrigatório'; return false; }
        if (!p.marital_status) { this.errorMessage = 'Estado civil é obrigatório'; return false; }
        if (!p.cpf) { this.errorMessage = 'CPF é obrigatório'; return false; }
        if (!this.isValidCPF(p.cpf)) { this.errorMessage = 'CPF inválido'; return false; }
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
}
