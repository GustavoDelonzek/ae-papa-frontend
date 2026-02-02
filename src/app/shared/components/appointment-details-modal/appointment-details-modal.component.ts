import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../core/models/appointment.model';

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
        if (!dateStr) return '-';
        // Assume format YYYY-MM-DD
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
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
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    extractTime(dateStr: string | undefined): string {
        if (!dateStr) return '--:--';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}
