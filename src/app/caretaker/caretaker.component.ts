import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { CaretakerService, Caretaker, PatientService, Patient } from '../services';
import { SharedUtils } from '../core/utils/shared-utils';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CaretakerFormModalComponent } from '../shared/components/caretaker-form-modal/caretaker-form-modal.component';

@Component({
    selector: 'app-caretaker',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule,
        SidebarComponent,
        CaretakerFormModalComponent
    ],
    templateUrl: './caretaker.component.html',
    styleUrls: ['./caretaker.component.scss'],
})
export class CaretakerComponent implements OnInit {

    caretakerId: number = 0;
    loading: boolean = false;
    errorMessage: string = '';

    caretakerData: Caretaker | null = null;

    showEditModal: boolean = false;

    showRelationModal: boolean = false;
    allPatients: Patient[] = [];
    loadingPatients: boolean = false;
    newRelationPatientId: number | null = null;
    newRelationKinship: string = '';
    savingRelation: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private caretakerService: CaretakerService,
        private patientService: PatientService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            if (params['id']) {
                this.caretakerId = parseInt(params['id'], 10);
                this.loadCaretakerData();
            } else {
                this.errorMessage = 'ID do cuidador não fornecido';
            }
        });
    }

    loadCaretakerData(): void {
        if (!this.caretakerId) return;

        this.loading = true;
        this.errorMessage = '';

        this.caretakerService.getCaretaker(this.caretakerId).subscribe({
            next: (response: any) => {
                this.caretakerData = response.data;
                this.loading = false;
            },
            error: (error: any) => {
                console.error('Erro ao carregar dados do cuidador:', error);
                this.loading = false;

                if (error.status === 404) {
                    this.errorMessage = 'Cuidador não encontrado';
                } else {
                    this.errorMessage = 'Erro ao carregar dados do cuidador. Tente novamente.';
                }
            }
        });
    }

    getCaretakerAge(): number {
        if (!this.caretakerData?.birth_date) return 0;

        const birth = new Date(this.caretakerData.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }

    getGenderText(): string {
        return SharedUtils.getGenderLabel(this.caretakerData?.gender) || 'Não informado';
    }

    getKinshipText(kinship: string): string {
        if (!kinship) return 'Não informado';

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

    formatCPF(cpf: string): string {
        return SharedUtils.formatCPF(cpf);
    }

    formatDate(date: string): string {
        return SharedUtils.formatDate(date);
    }

    openEditModal(): void {
        this.showEditModal = true;
    }

    closeEditModal(): void {
        this.showEditModal = false;
    }

    onEditSuccess(): void {
        this.closeEditModal();
        this.loadCaretakerData();
    }

    openRelationModal(): void {
        this.showRelationModal = true;
        this.loadAllPatients();
        this.newRelationPatientId = null;
        this.newRelationKinship = '';
    }

    closeRelationModal(): void {
        this.showRelationModal = false;
    }

    loadAllPatients(): void {
        this.loadingPatients = true;
        this.patientService.getPatients(1, 100).subscribe({ // Assuming getPatients exists and handles pagination info
            next: (response: any) => {
                this.allPatients = response.data || [];
                if (this.caretakerData?.patients) {
                    const linkedIds = this.caretakerData.patients.map(p => p.id);
                    this.allPatients = this.allPatients.filter(p => !linkedIds.includes(p.id!));
                }
                this.loadingPatients = false;
            },
            error: (err) => {
                console.error('Erro ao carregar lista de pacientes', err);
                this.loadingPatients = false;
            }
        });
    }

    saveRelation(): void {
        if (!this.newRelationPatientId || !this.newRelationKinship) return;

        this.savingRelation = true;
        this.caretakerService.linkPatient(this.caretakerId, this.newRelationPatientId, this.newRelationKinship).subscribe({
            next: () => {
                this.savingRelation = false;
                this.closeRelationModal();
                this.loadCaretakerData();
            },
            error: (err) => {
                console.error('Erro ao vincular paciente', err);
                this.savingRelation = false;
                alert('Erro ao vincular paciente. Verifique se o paciente já não está vinculado.');
            }
        });
    }

    unlinkPatient(patientId: number): void {
        if (confirm('Tem certeza que deseja desvincular este paciente?')) {
            this.caretakerService.unlinkPatient(this.caretakerId, patientId).subscribe({
                next: () => {
                    this.loadCaretakerData();
                },
                error: (err) => {
                    console.error('Erro ao desvincular paciente', err);
                    alert('Erro ao desvincular paciente.');
                }
            });
        }
    }

    goToPatient(patientId: number): void {
        this.router.navigate(['/paciente', patientId]);
    }

    goBack(): void {
        this.router.navigate(['/lista-cuidadores']);
    }

    deleteCaretaker(): void {
        if (confirm('Tem certeza que deseja excluir este cuidador?')) {
            this.caretakerService.deleteCaretaker(this.caretakerId).subscribe({
                next: () => {
                    this.router.navigate(['/lista-cuidadores']);
                },
                error: (error: any) => {
                    console.error('Erro ao deletar cuidador:', error);
                    alert('Erro ao excluir cuidador. Tente novamente.');
                }
            });
        }
    }
    getPatientColorClass(id: number | undefined): string {
        if (!id) return 'bg-blue';
        const colors = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-teal'];
        return colors[id % colors.length];
    }
}
