import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { SocioeconomicProfile, SocioeconomicProfileService } from '../../../services/socioeconomic-profile.service';

@Component({
    selector: 'app-socioeconomic-profile-modal',
    templateUrl: './socioeconomic-profile-modal.component.html',
    styleUrls: ['./socioeconomic-profile-modal.component.scss'],
    standalone: false
})
export class SocioeconomicProfileModalComponent implements OnInit {
    @Input() visible: boolean = false;
    @Input() patientId: number | null = null;
    @Input() profile: SocioeconomicProfile | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() success = new EventEmitter<SocioeconomicProfile>();

    isEditing: boolean = false;
    isSaving: boolean = false;
    errorMessage: string = '';

    currentProfile: Partial<SocioeconomicProfile> = {};

    // Options matching the provided image
    occupationOptions = [
        'Assalariado com CTPS',
        'Assalariado sem CTPS',
        'Autônomo com previdência',
        'Autônomo sem/ previdência',
        'Aposentado',
        'Pensionista',
        'Não Trabalha',
        'Outros'
    ];

    housingOptions = [
        'Própria',
        'Alugada',
        'Cedida',
        'Outros'
    ];

    constructionOptions = [
        'Madeira',
        'Alvenaria',
        'Pré Mold.',
        'Outros'
    ];

    // Local state for complex fields
    incomeSourceData: { category: string; other: string } = { category: '', other: '' };

    sanitationData = {
        piped_water: false,
        water_tank: false,
        electricity: false, // Sim/Não (Radio usually better but bool works)
        sewage: false,
        septic_tank: false,
        trash_collection: false,
        sanitary_installations: false
    };

    constructor(private profileService: SocioeconomicProfileService) { }

    ngOnInit(): void {
    }

    @Input('profile')
    set setProfile(val: SocioeconomicProfile | null) {
        if (val) {
            this.isEditing = true;
            this.currentProfile = { ...val };
            this.parseIncomeSource(val.income_source);
            this.parseSanitationDetails(val.sanitation_details);
        } else {
            this.isEditing = false;
            this.resetForm();
        }
    }

    parseIncomeSource(data: any) {
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                this.incomeSourceData = parsed;
            } catch (e) {
                // Fallback if legacy string
                this.incomeSourceData = { category: data, other: '' };
            }
        } else if (typeof data === 'object' && data !== null) {
            this.incomeSourceData = { category: data.category || '', other: data.other || '' };
        } else {
            this.incomeSourceData = { category: '', other: '' };
        }
    }

    parseSanitationDetails(data: any) {
        const defaultData = {
            piped_water: false,
            water_tank: false,
            electricity: false,
            sewage: false,
            septic_tank: false,
            trash_collection: false,
            sanitary_installations: false
        };

        if (typeof data === 'string') {
            try {
                this.sanitationData = { ...defaultData, ...JSON.parse(data) };
            } catch (e) {
                this.sanitationData = defaultData;
            }
        } else if (typeof data === 'object' && data !== null) {
            this.sanitationData = { ...defaultData, ...data };
        } else {
            this.sanitationData = defaultData;
        }
    }

    resetForm(): void {
        this.currentProfile = {
            housing_ownership: '',
            construction_type: '',
            number_of_rooms: undefined,
            number_of_residents: undefined
        };
        this.incomeSourceData = { category: '', other: '' };
        this.sanitationData = {
            piped_water: false,
            water_tank: false,
            electricity: false,
            sewage: false,
            septic_tank: false,
            trash_collection: false,
            sanitary_installations: false
        };
        this.errorMessage = '';
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

        // Prepare JSON fields
        const payload = {
            ...this.currentProfile,
            patient_id: this.patientId,
            income_source: this.incomeSourceData,
            sanitation_details: this.sanitationData
        };

        const request = this.isEditing && this.currentProfile.id
            ? this.profileService.updateProfile(this.currentProfile.id, payload)
            : this.profileService.createProfile(payload);

        request.subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.success.emit(response.data);
                this.onClose();
            },
            error: (error: any) => {
                console.error('Erro ao salvar perfil socioeconômico:', error);
                this.isSaving = false;
                if (error.status === 422) {
                    const errors = error.error.errors;
                    const firstError = Object.values(errors)[0] as string[];
                    this.errorMessage = firstError ? firstError[0] : 'Dados inválidos.';
                } else {
                    this.errorMessage = 'Erro ao salvar perfil. Tente novamente.';
                }
            }
        });
    }

    onlyNumbers(event: KeyboardEvent): boolean {
        // Allow control keys (Backspace, Delete, Tab, Arrows, Enter, etc.)
        // These usually don't trigger keypress in some browsers, but keydown.
        // For keypress, simple digit check:
        const pattern = /[0-9]/;
        const inputChar = String.fromCharCode(event.charCode);

        if (event.code.includes('Arrow') || event.code === 'Backspace' || event.code === 'Delete' || event.code === 'Tab') {
            return true;
        }

        if (!pattern.test(inputChar)) {
            // invalid character, prevent input
            event.preventDefault();
            return false;
        }
        return true;
    }
}
