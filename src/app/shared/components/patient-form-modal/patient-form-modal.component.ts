import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Patient, PatientService, PatientContact, Address } from '../../../services/patient.service';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

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
    currentStep: number = 1;

    currentPatient: Patient = {
        full_name: '',
        birth_date: '',
        gender: '',
        marital_status: '',
        cpf: '',
        rg: ''
    };

    // Contacts
    contactsList: PatientContact[] = [];
    newContact: PatientContact = {
        type: 'phone',
        value: '',
        is_primary: false
    };

    // Addresses
    addressesList: Address[] = [];
    newAddress: Address = {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        cep: ''
    };

    constructor(private patientService: PatientService) { }

    ngOnInit(): void {
    }

    @Input('patient')
    set setPatient(val: Patient | null) {
        if (val) {
            this.isEditing = true;
            this.currentPatient = { ...val };
            if (this.currentPatient.birth_date) {
                this.currentPatient.birth_date = this.currentPatient.birth_date.split('T')[0];
            }

            // Load contacts - Find primary or take first or default
            this.contactsList = val.contacts ? [...val.contacts] : [];
            const primary = this.contactsList.find(c => c.is_primary);
            if (primary) {
                this.newContact = { ...primary }; // Clone for editing
            } else if (this.contactsList.length > 0) {
                // If no primary is marked, take the first one and make it primary effectively in UI?? 
                // Or just show empty form? Let's take first if exists, else empty.
                this.newContact = { ...this.contactsList[0], is_primary: true };
            } else {
                this.newContact = { type: 'phone', value: '', is_primary: true };
            }

            // Load addresses
            if (val.addresses) {
                this.addressesList = [...val.addresses];
            } else {
                this.addressesList = [];
            }
        } else {
            this.isEditing = false;
            this.resetForm();
        }
        this.currentStep = 1;
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
        this.contactsList = [];
        this.newContact = { type: 'phone', value: '', is_primary: true };
        this.addressesList = [];
        this.newAddress = { street: '', number: '', neighborhood: '', city: '', cep: '', reference_point: '' };
        this.errorMessage = '';
        this.currentStep = 1;
    }

    onClose(): void {
        this.close.emit();
    }

    nextStep(): void {
        this.errorMessage = '';
        if (this.currentStep < 3) {
            this.currentStep++;
        }
    }

    prevStep(): void {
        this.errorMessage = '';
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    goToStep(step: number): void {
        this.errorMessage = '';
        if (step >= 1 && step <= 3) {
            this.currentStep = step;
        }
    }

    // --- Step 1: Patient ---

    handleStep1(): void {
        this.isSaving = true;

        const patientPayload: any = {
            ...this.currentPatient,
            birth_date: this.formatDateForAPI(this.currentPatient.birth_date)
        };
        if (!patientPayload.rg) delete patientPayload.rg;

        // Clean up nested
        delete patientPayload.contacts;
        delete patientPayload.addresses;
        delete patientPayload.caregivers;
        delete patientPayload.clinical_records;
        delete patientPayload.socioeconomic_profile;

        let request: Observable<any>;

        if (this.currentPatient.id) {
            request = this.patientService.updatePatient(this.currentPatient.id, patientPayload);
        } else {
            request = this.patientService.createPatient(patientPayload);
        }

        request.subscribe({
            next: (response: any) => {
                this.isSaving = false;
                if (!this.currentPatient.id && response.data?.id) {
                    this.currentPatient.id = response.data.id;
                    this.isEditing = true; // Switch to edit mode
                }
                this.currentStep = 2;
            },
            error: (error) => this.handleError(error)
        });
    }

    // --- Step 2: Contact ---

    handleStep2(): void {
        if (!this.currentPatient.id) {
            this.errorMessage = 'Erro: Atendido não identificado.';
            return;
        }

        this.isSaving = true;
        const patientId = this.currentPatient.id;
        const contact = { ...this.newContact, patient_id: patientId };

        let request: Observable<any>;

        if (contact.id) {
            // Update
            const payload: any = { ...contact };
            delete payload.id;
            delete payload.pivot;
            delete payload.patient_id;
            delete payload.created_at;
            delete payload.updated_at;
            request = this.patientService.updateContact(contact.id, payload);
        } else {
            // Create
            request = this.patientService.createContact(contact);
        }

        request.subscribe({
            next: (response: any) => {
                this.isSaving = false;
                // Update local contact with ID if created
                if (!contact.id && response.data?.id) {
                    this.newContact.id = response.data.id;
                } else if (!contact.id && response.id) {
                    this.newContact.id = response.id;
                }
                this.currentStep = 3;
            },
            error: (error) => this.handleError(error)
        });
    }

    // --- Step 3: Address (Final Save) ---

    addAddress(): void {
        if (!this.newAddress.street) return;
        this.addressesList.push({ ...this.newAddress });
        this.newAddress = { street: '', number: '', neighborhood: '', city: '', cep: '', reference_point: '' };
    }

    removeAddress(index: number): void {
        this.addressesList.splice(index, 1);
    }

    // Legacy stub for contact - template might call it although I removed the button
    addContact(): void { }
    removeContact(index: number): void { }

    save(): void {
        this.errorMessage = '';
        if (!this.validateStep1()) {
            this.currentStep = 1;
            return;
        }

        if (!this.validateStep2()) {
            this.currentStep = 2;
            return;
        }

        this.isSaving = true;
        this.upsertPatient().pipe(
            switchMap((patientId) => {
                if (!patientId) {
                    this.errorMessage = 'Erro: Atendido não identificado.';
                    return of(null);
                }

                this.currentPatient.id = patientId;
                this.isEditing = true;

                return this.upsertContact(patientId).pipe(
                    switchMap(() => this.upsertAddresses(patientId))
                );
            })
        ).subscribe({
            next: (result) => {
                if (result === null) {
                    this.isSaving = false;
                    return;
                }

                this.isSaving = false;
                this.success.emit();
                this.onClose();
            },
            error: (error) => this.handleError(error)
        });
    }

    private upsertPatient(): Observable<number | null> {
        const patientPayload: any = {
            ...this.currentPatient,
            birth_date: this.formatDateForAPI(this.currentPatient.birth_date)
        };

        if (!patientPayload.rg) delete patientPayload.rg;
        delete patientPayload.contacts;
        delete patientPayload.addresses;
        delete patientPayload.caregivers;
        delete patientPayload.clinical_records;
        delete patientPayload.socioeconomic_profile;

        const request = this.currentPatient.id
            ? this.patientService.updatePatient(this.currentPatient.id, patientPayload)
            : this.patientService.createPatient(patientPayload);

        return request.pipe(
            switchMap((response: any) => {
                const patientId = this.currentPatient.id || response?.data?.id || response?.id || null;
                return of(patientId);
            })
        );
    }

    private upsertContact(patientId: number): Observable<any> {
        const contact = {
            ...this.newContact,
            patient_id: patientId,
            is_primary: true
        };

        if (contact.id) {
            const payload: any = { ...contact };
            delete payload.id;
            delete payload.pivot;
            delete payload.patient_id;
            delete payload.created_at;
            delete payload.updated_at;
            return this.patientService.updateContact(contact.id, payload);
        }

        return this.patientService.createContact(contact).pipe(
            switchMap((response: any) => {
                if (response?.data?.id) {
                    this.newContact.id = response.data.id;
                } else if (response?.id) {
                    this.newContact.id = response.id;
                }
                return of(response);
            })
        );
    }

    private upsertAddresses(patientId: number): Observable<any> {
        const addressRequests: Observable<any>[] = [];

        this.addressesList.forEach(a => {
            if (a.id) {
                const payload: any = { ...a };
                delete payload.id;
                delete payload.patient_id;
                delete payload.created_at;
                delete payload.updated_at;
                addressRequests.push(this.patientService.updateAddress(a.id, payload));
            } else {
                addressRequests.push(this.patientService.createAddress({ ...a, patient_id: patientId }));
            }
        });

        return addressRequests.length > 0 ? forkJoin(addressRequests) : of([]);
    }

    handleError(error: any) {
        console.error('Erro:', error);
        this.isSaving = false;
        if (error.status === 422) {
            this.handleValidationErrors(error.error.errors);
        } else {
            this.errorMessage = 'Erro ao salvar. Tente novamente.';
        }
    }

    validateStep1(): boolean {
        const p = this.currentPatient;
        if (!p.full_name?.trim()) { this.errorMessage = 'Nome completo é obrigatório'; return false; }
        if (!p.birth_date) { this.errorMessage = 'Data de nascimento é obrigatória'; return false; }
        if (!p.gender) { this.errorMessage = 'Gênero é obrigatório'; return false; }
        if (!p.marital_status) { this.errorMessage = 'Estado civil é obrigatório'; return false; }
        if (!p.cpf) { this.errorMessage = 'CPF é obrigatório'; return false; }
        if (!this.isValidCPF(p.cpf)) { this.errorMessage = 'CPF inválido'; return false; }
        return true;
    }

    validateStep2(): boolean {
        if (!this.newContact.value) {
            this.errorMessage = 'Informe o contato principal.';
            return false;
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
}
