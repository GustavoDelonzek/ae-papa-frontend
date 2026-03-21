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
    showPatientSearch: boolean = false;
    searchCpf: string = '';
    searching: boolean = false;
    searchResults: Patient[] = [];
    selectedPatient: Patient | null = null;
    private patientSearchTimeout: any;

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
        // Nada necessário no onOpen para buscar massiva de pacientes.
    }

    openPatientSearch(): void {
        this.showPatientSearch = true;
        this.searchCpf = '';
        this.searchResults = [];
    }

    closePatientSearch(): void {
        this.showPatientSearch = false;
        this.searchCpf = '';
        this.searchResults = [];
    }

    onSearchCpfChange(): void {
        const isOnlyNumbersAndFormatting = /^[0-9.\- ]*$/.test(this.searchCpf);
        if (this.searchCpf && isOnlyNumbersAndFormatting) {
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
        }

        if (this.patientSearchTimeout) {
            clearTimeout(this.patientSearchTimeout);
        }
        this.patientSearchTimeout = setTimeout(() => {
            this.performSearch(false);
        }, 500);
    }

    performSearch(showErrorIfEmpty: boolean = true): void {
        if (!this.searchCpf || this.searchCpf.trim().length < 3) {
            this.searchResults = [];
            this.searching = false;
            return;
        }

        const term = this.searchCpf.trim();
        const cpfOnly = term.replace(/\D/g, '');
        const isCpf = /^[0-9.\- ]*$/.test(term) && cpfOnly.length > 0;

        const filters: any = isCpf ? { cpf: cpfOnly } : { full_name: term };

        this.searching = true;
        this.searchResults = [];

        this.patientService.getPatients(1, 15, filters).subscribe({
            next: (response: any) => {
                this.searchResults = response.data || [];
                if (showErrorIfEmpty && this.searchResults.length === 0) {
                    this.errorMessage = 'Nenhum atendido encontrado';
                    setTimeout(() => this.errorMessage = '', 3000);
                }
                this.searching = false;
            },
            error: (error: any) => {
                console.error('Erro ao buscar paciente:', error);
                if (showErrorIfEmpty) {
                    this.errorMessage = 'Erro ao buscar atendido. Tente novamente.';
                    setTimeout(() => this.errorMessage = '', 3000);
                }
                this.searching = false;
            }
        });
    }

    searchPatientByCpf(): void {
        if (this.patientSearchTimeout) clearTimeout(this.patientSearchTimeout);
        this.performSearch(true);
    }

    selectPatient(patient: Patient): void {
        this.selectedPatient = patient;
        this.currentCaretaker.patient_id = patient.id!;
        this.closePatientSearch();
    }

    clearPatientSelection(): void {
        this.selectedPatient = null;
        this.currentCaretaker.patient_id = undefined;
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
        this.searchCpf = '';
        this.showPatientSearch = false;
        this.searchResults = [];
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

    formatDateForAPI(date: any): string {
        if (!date) return '';
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}-${day}-${year}`;
        }
        if (typeof date === 'string') {
            const parts = date.split('T')[0].split('-');
            if (parts.length === 3 && parts[0].length === 4) {
                return `${parts[1]}-${parts[2]}-${parts[0]}`;
            }
            return date;
        }
        return String(date);
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

    getInitials(name: string): string {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
}
