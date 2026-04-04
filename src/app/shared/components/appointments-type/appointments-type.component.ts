import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardAppointmentsByTypeItem } from '../../../services/dashboard.service';

@Component({
  selector: 'app-appointments-type',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointments-type.component.html',
  styleUrls: ['./appointments-type.component.scss']
})
export class AppointmentsTypeComponent {
  @Input() items: DashboardAppointmentsByTypeItem[] = [];
  @Input() totalItems: number = 0;
  @Input() score: number = 0; // efficiency score demo

  getAppointmentObjectiveLabel(objective: string): string {
    const objectiveMap: { [key: string]: string } = {
      'donation': 'Doação',
      'project': 'Projeto',
      'treatment': 'Tratamento',
      'research': 'Pesquisa',
      'visit': 'Visita',
      'mesa_brasil': 'Mesa Brasil',
      'social_assistance': 'Sócio Assistencial',
      'other': 'Outro'
    };
    return objectiveMap[objective] || objective || 'Não especificado';
  }

  getAppointmentTypePercentage(total: number): number {
    if (!this.totalItems) return 0;
    return Math.round((total / this.totalItems) * 100);
  }
}
