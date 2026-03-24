import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() iconClass: string = '';
  @Input() iconColor: 'purple' | 'blue' | 'orange' | 'green' = 'purple';
  
  @Input() title: string = '';
  @Input() value: string | number = '';
  
  @Input() supportText: string = '';
  
  @Input() trendValue: string = ''; // e.g. '+12.5%', 'Steady'
  @Input() trendType: 'up' | 'down' | 'neutral' = 'neutral';
}
