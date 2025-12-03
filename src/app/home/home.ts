import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService, DashboardMetrics } from '../services';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  // Estatísticas do dashboard
  totalPatients: number = 0;
  appointmentsToday: number = 0;
  pendingTasks: number = 0;
  recentActivity: number = 0;
  
  // Calendário
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;
  calendarDays: any[] = [];
  selectedDate: Date | null = null;
  
  // Loading
  loading: boolean = false;
  
  constructor(
    private router: Router,
    private dashboardService: DashboardService
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
    this.initializeCalendar();
  }
  
  loadDashboardData(): void {
    this.loading = true;
    
    // Carregar métricas do dashboard
    this.dashboardService.getMetrics().subscribe({
      next: (metrics: DashboardMetrics) => {
        this.totalPatients = metrics.patient_count;
        this.appointmentsToday = metrics.appointments_count;
        this.pendingTasks = metrics.documents_count;
        this.recentActivity = 12;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar métricas do dashboard:', error);
        this.loading = false;
      }
    });
  }
  
  initializeCalendar(): void {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    this.currentMonth = months[this.currentDate.getMonth()];
    this.currentYear = this.currentDate.getFullYear();
    this.generateCalendarDays();
    
    // Selecionar automaticamente o dia atual se estamos no mês atual
    const today = new Date();
    if (this.currentDate.getMonth() === today.getMonth() && 
        this.currentDate.getFullYear() === today.getFullYear()) {
      const todayDay = this.calendarDays.find(d => d.isToday);
      if (todayDay) {
        this.selectDate(todayDay);
      }
    }
  }
  
  generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    this.calendarDays = [];
    
    // Dias do mês anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
      this.calendarDays.push({ day: '', isCurrentMonth: false });
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = this.isToday(date);
      this.calendarDays.push({
        day: day,
        date: date,
        isCurrentMonth: true,
        isToday: isToday,
        isSelected: false
      });
    }
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.initializeCalendar();
  }
  
  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.initializeCalendar();
  }
  
  selectDate(dayData: any): void {
    if (!dayData.isCurrentMonth) return;
    
    this.selectedDate = dayData.date;
    this.calendarDays.forEach(d => d.isSelected = false);
    dayData.isSelected = true;
  }
  
  goToToday(): void {
    this.currentDate = new Date();
    this.initializeCalendar();
  }
  
  getFormattedSelectedDate(): string {
    if (!this.selectedDate) return '';
    
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    const dayOfWeek = days[this.selectedDate.getDay()];
    const day = this.selectedDate.getDate();
    const month = months[this.selectedDate.getMonth()];
    const year = this.selectedDate.getFullYear();
    
    return `${dayOfWeek}, ${day} de ${month} de ${year}`;
  }
  
  isCurrentMonth(): boolean {
    const today = new Date();
    return this.currentDate.getMonth() === today.getMonth() && 
           this.currentDate.getFullYear() === today.getFullYear();
  }
  
  getCurrentDateFormatted(): string {
    const today = new Date();
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    const dayOfWeek = days[today.getDay()];
    const day = today.getDate();
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    
    return `${dayOfWeek}, ${day} de ${month} de ${year}`;
  }
  
  navigateToPatients(): void {
    this.router.navigate(['/lista-pacientes']);
  }
  
  navigateToRegister(): void {
    this.router.navigate(['/registro-paciente']);
  }
}
