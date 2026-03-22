import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CaretakerService, Caretaker, CaretakerResponse, PatientService, Patient } from '../../../services';
import { SharedUtils } from '../../../core/utils/shared-utils';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-caretaker-form-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './caretaker-form-modal.component.html',
    styleUrls: ['./caretaker-form-modal.component.scss'],
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
                    const date = SharedUtils.parseDate(this.currentCaretaker.birth_date);
                    if (!isNaN(date.getTime())) {
                        (this.currentCaretaker as any).birth_date = date;
                    }
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
            this.searchCpf = SharedUtils.formatCPF(cpf);
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
        const isCpf = term.replace(/[0-9.\- ]/g, '').length === 0 && cpfOnly.length > 0;

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
            birth_date: SharedUtils.formatDateForAPI(this.currentCaretaker.birth_date)
        };

        const payload: any = { ...formattedData };
        if (!payload.rg) delete payload.rg;

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
        if (!SharedUtils.isValidCPF(c.cpf)) { this.errorMessage = 'CPF inválido'; return false; }

        if (!this.isEditing) {
            if (!c.patient_id) { this.errorMessage = 'Selecione um paciente'; return false; }
            if (!c.kinship) { this.errorMessage = 'Parentesco é obrigatório'; return false; }
        }

        return true;
    }

    handleValidationErrors(errors: any): void {
        if (errors.cpf) this.errorMessage = `CPF: ${errors.cpf[0]}`;
        else if (errors.full_name) this.errorMessage = `Nome: ${errors.full_name[0]}`;
        else this.errorMessage = 'Dados inválidos. Verifique os campos.';
    }

    formatCPF(event: Event): void {
        const input = event.target as HTMLInputElement;
        const cleaned = input.value.replace(/\D/g, '');
        if (cleaned.length <= 11) {
            this.currentCaretaker.cpf = SharedUtils.formatCPF(cleaned);
        }
    }

    formatPatientCPF(cpf: string): string {
        return SharedUtils.formatCPF(cpf);
    }

    getInitials(name: string): string {
        return SharedUtils.getInitials(name);
    }
}
