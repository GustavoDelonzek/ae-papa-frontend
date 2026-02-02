import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ClinicalRecord, ClinicalRecordService } from '../../../services/clinical-record.service';

@Component({
    selector: 'app-clinical-record-modal',
    templateUrl: './clinical-record-modal.component.html',
    styleUrls: ['./clinical-record-modal.component.scss'],
    standalone: false
})
export class ClinicalRecordModalComponent implements OnInit {
    @Input() visible: boolean = false;
    @Input() patientId: number | null = null;
    @Input() patientName: string = ''; // For the header pill
    @Input() record: ClinicalRecord | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() success = new EventEmitter<ClinicalRecord>();

    isEditing: boolean = false;
    isSaving: boolean = false;
    errorMessage: string = '';

    currentRecord: Partial<ClinicalRecord> = {};

    // Options
    stageOptions = ['Inicial', 'Intermediário', 'Avançado'];

    constructor(private recordService: ClinicalRecordService) { }

    ngOnInit(): void {
    }

    @Input('record')
    set setRecord(val: ClinicalRecord | null) {
        if (val) {
            this.isEditing = true;
            this.currentRecord = { ...val };
        } else {
            this.isEditing = false;
            this.resetForm();
        }
    }

    resetForm(): void {
        this.currentRecord = {
            diagnosis_date: '',
            disease_stage: '',
            responsible_doctor: '',
            health_unit_location: '',
            medications_usage: '', /// Plano Terapêutico

            // Booleans / Toggles
            recognizes_family: 'Não', // Request says string? validation says string max 255. UI shows toggle. Maybe "Sim"/"Não"? Or null. 
            // Wait, request validation: `recognizes_family` => ['nullable', 'string']. NOT boolean.
            // `emotional_state` => string.
            // `wandering_risk` => boolean.

            // Let's assume the UI toggles map to these.
            // If `recognizes_family` is string, maybe "Sim"/"Não" or "Parcial".
            // If the user wants a toggle, I'll use boolean logic in frontend and map to string for backend if needed, OR the backend actually expects boolean casted to string?
            // "Validation rules... recognizes_family ... string".
            // "wandering_risk ... boolean".

            // I'll assume for `recognizes_family` and `emotional_state`, I might need a dropdown or text? 
            // BUT Image 1 clearly shows "Reconhece Familiares" as a TOGGLE. 
            // Maybe the backend changed or the request validation I saw earlier (previous prompt) was slightly off/legacy?
            // "recognizes_family": ['nullable', 'string']
            // "emotional_state": ['nullable', 'string']
            // "wandering_risk": ['boolean']

            // I'll implement "Reconhece Familiares" and "Instabilidade Emocional" as Booleans in the UI to match the Image.
            // When saving, I'll convert boolean `true` -> "Sim", `false` -> "Não" for the string fields if that's what backend wants. 
            // Or maybe the User wants me to change the backend validation? The user didn't ask that.
            // I'll stick to string "Sim"/"Não" for those two specific fields. 

            wandering_risk: false,
            verbal_communication: false,
            disorientation_frequency: false,
            has_falls_history: false,
            needs_feeding_help: false,
            needs_hygiene_help: false,
            has_sleep_issues: false,
            has_hallucinations: false,
            reduced_mobility: false,
            is_aggressive: false
        };

        // Initialize string toggles as boolean for UI if needed, but for now I'll just init to empty or defaults.
        // Actually, for `recognizes_family`, I'll use a helper property `_recognizesFamilyBool` or just map it in `save()`.
    }

    // Helper for string-based toggles
    get recognizesFamilyBool(): boolean {
        return this.currentRecord.recognizes_family === 'Sim';
    }
    set recognizesFamilyBool(val: boolean) {
        this.currentRecord.recognizes_family = val ? 'Sim' : 'Não';
    }

    get emotionalStateBool(): boolean {
        return this.currentRecord.emotional_state === 'Sim'; // Or 'Instável'? "Instabilidade Emocional"
        // If the field is "emotional_state", usually it describes the state.
        // If the toggle is "Instabilidade Emocional", then True = Unstable.
        // Backend field `emotional_state`. Maybe text?
        // I'll treat it as "Instável" if true, "Estável" if false? 
        // Or just "Sim"/"Não" for "Instabilidade"?
        // I'll use "Instável"/"Estável".
    }
    set emotionalStateBool(val: boolean) {
        this.currentRecord.emotional_state = val ? 'Instável' : 'Estável';
    }

    onClose(): void {
        this.close.emit();
    }

    save(): void {
        if (!this.patientId) {
            this.errorMessage = 'Erro: Paciente não identificado.';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';

        const payload = {
            ...this.currentRecord,
            patient_id: this.patientId
        };

        // Ensure string fields are set defaults if missing?

        const request = this.isEditing && this.currentRecord.id
            ? this.recordService.updateClinicalRecord(this.currentRecord.id, payload)
            : this.recordService.createClinicalRecord(payload as ClinicalRecord);

        request.subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.success.emit(response.data);
                this.onClose();
            },
            error: (error: any) => {
                console.error('Erro ao salvar registro clínico:', error);
                this.isSaving = false;
                if (error.status === 422) {
                    const errors = error.error.errors;
                    const firstError = Object.values(errors)[0] as string[];
                    this.errorMessage = firstError ? firstError[0] : 'Dados inválidos.';
                } else {
                    this.errorMessage = 'Erro ao salvar registro. Tente novamente.';
                }
            }
        });
    }
}
