import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../core/models/appointment.model';
import { SharedUtils } from '../../../core/utils/shared-utils';

@Component({
    selector: 'app-appointment-details-modal',
    templateUrl: './appointment-details-modal.component.html',
    styleUrls: ['./appointment-details-modal.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class AppointmentDetailsModalComponent {
    @Input() visible: boolean = false;
    @Input() appointment: Appointment | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() edit = new EventEmitter<Appointment>();

    closeModal(): void {
        this.close.emit();
    }

    onEdit(): void {
        if (this.appointment) {
            this.edit.emit(this.appointment);
        }
    }

    formatDate(dateStr: string | undefined): string {
        return SharedUtils.formatDate(dateStr);
    }

    private parseDate(dateStr: string): Date {
        return SharedUtils.parseDate(dateStr);
    }

    getObjectiveLabel(objective: string | undefined): string {
        if (!objective) return '-';
        // Map objectives if needed, or return capitalized
        const map: { [key: string]: string } = {
            'donation': 'Doação',
            'treatment': 'Tratamento',
            'exam': 'Exame',
            'consultation': 'Consulta'
        };
        return map[objective] || objective;
    }

    getInitials(name: string | undefined): string {
        return SharedUtils.getInitials(name);
    }
}

