import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';
import { AppointmentsTypeComponent } from '../shared/components/appointments-type/appointments-type.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ScriptableContext } from 'chart.js';
import { DashboardService, DashboardAppointmentsByTypeItem, DashboardMonthlyItem } from '../services/dashboard.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    StatCardComponent,
    AppointmentsTypeComponent,
    BaseChartDirective
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  loading = true;

  // Stat metrics
  totalAppointments = 0;
  totalClinicalRecords = 0;
  totalSocioeconomicProfiles = 0;
  newPatientsThisMonth = 0;

  // Trends
  appointmentsTrendValue = '';
  appointmentsTrendType: 'up' | 'down' | 'neutral' = 'neutral';
  
  newPatientsTrendValue = '';
  newPatientsTrendType: 'up' | 'down' | 'neutral' = 'neutral';

  // Appointments Type
  appointmentsByType: DashboardAppointmentsByTypeItem[] = [];
  appointmentsByTypeTotal: number = 0;
  efficiencyScore: number = 0;

  // Chart Toggle State
  activeChartMetric: 'total' | 'new' = 'total';
  monthlyDataRaw: any[] = [];
  newPatientsMonthlyRaw: any[] = [];

  // Chart configuration
  periodChartTitle = 'Atendimentos por período';
  periodChartSubtitle = 'Evolução de atendimentos nos últimos 30 dias.';
  periodChartType: ChartType = 'line';
  periodChartData: ChartConfiguration<ChartType>['data'] = {
    labels: [],
    datasets: []
  };
  periodChartOptions: ChartOptions<ChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        border: { display: false }
      }
    }
  };

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    
    // Default to last 12 months for stats
    this.dashboardService.getStatistics(12).pipe(catchError(() => of(null))).subscribe(dashboard => {
      if (dashboard) {
        // Map Totals
        if (dashboard.totals) {
          this.totalAppointments = dashboard.totals.appointments || 0;
          this.totalSocioeconomicProfiles = dashboard.totals.socioeconomic_profiles || 0;
          this.totalClinicalRecords = dashboard.totals.clinical_records || 0;
        }

        // Map Types
        const objectiveMap: Record<string, string> = {
          'donation': 'Doação',
          'project': 'Projeto',
          'treatment': 'Tratamento',
          'research': 'Pesquisa',
          'other': 'Outro'
        };

        const mappedTypes = (dashboard.appointments_by_type || []).map(item => ({
          ...item,
          type: objectiveMap[item.objective] || item.objective
        }));

        this.appointmentsByType = mappedTypes as any[];
        
        // Sort descending
        this.appointmentsByType.sort((a: any, b: any) => (b.total || 0) - (a.total || 0));
        this.appointmentsByTypeTotal = this.appointmentsByType.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
        
        // Efficiency Score
        this.efficiencyScore = 0;

        // Store raw data for toggle
        this.monthlyDataRaw = dashboard.appointments_by_month || [];
        this.newPatientsMonthlyRaw = dashboard.new_patients?.by_month || [];
        
        if (this.monthlyDataRaw.length > 0) {
          // Calculate trend for appointments
          const trend = this.calculateGrowth(this.monthlyDataRaw);
          this.appointmentsTrendValue = trend.value;
          this.appointmentsTrendType = trend.type;
        }

        if (this.newPatientsMonthlyRaw.length > 0) {
          // Calculate trend for Novos Atendidos
          const newTrend = this.calculateGrowth(this.newPatientsMonthlyRaw);
          this.newPatientsTrendValue = newTrend.value;
          this.newPatientsTrendType = newTrend.type;
        }

        // Initialize chart visually
        this.updateChartData();

        // Map New Patients
        if (dashboard.new_patients) {
          this.newPatientsThisMonth = dashboard.new_patients.total || 0;
        }
      }

      this.loading = false;
    });
  }

  setChartMetric(metric: 'total' | 'new'): void {
    if (this.activeChartMetric === metric) return;
    this.activeChartMetric = metric;
    this.updateChartData();
  }

  private updateChartData(): void {
    let recentLabels: string[] = [];
    let recentData: number[] = [];

    if (this.activeChartMetric === 'total') {
      const recent = this.monthlyDataRaw.slice(-6);
      recentLabels = recent.map(m => m.month);
      recentData = recent.map(m => m.total || 0);

      this.periodChartData.datasets = [{
        type: 'line',
        label: 'Atendimentos Realizados',
        data: recentData,
        borderColor: '#6a307d',
        backgroundColor: 'rgba(91, 47, 168, 0.12)',
        borderWidth: 3,
        tension: 0.45,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#6a307d',
        pointRadius: 4,
        pointHoverRadius: 6,
      }];
    } else {
      const recent = this.newPatientsMonthlyRaw.slice(-6);
      recentLabels = recent.map(m => m.month);
      recentData = recent.map(m => m.total || 0);

      this.periodChartData.datasets = [{
        type: 'line',
        label: 'Novos Atendidos',
        data: recentData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 3,
        tension: 0.45,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#10b981',
        pointRadius: 4,
        pointHoverRadius: 6,
      }];
    }

    this.periodChartData.labels = recentLabels;
    this.periodChartData = { ...this.periodChartData };
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private calculateGrowth(monthlyData: DashboardMonthlyItem[]): { value: string, type: 'up'|'down'|'neutral' } {
    if (!monthlyData || monthlyData.length < 2) return { value: '', type: 'neutral' };
    const current = monthlyData[monthlyData.length - 1].total || 0;
    const previous = monthlyData[monthlyData.length - 2].total || 0;
    
    if (previous === 0) {
      if (current === 0) return { value: 'Steady', type: 'neutral' };
      return { value: '+100%', type: 'up' };
    }
    
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    
    if (percent === 0) return { value: 'Steady', type: 'neutral' };
    const type = percent > 0 ? 'up' : 'down';
    const sign = percent > 0 ? '+' : '';
    return { value: `${sign}${percent.toFixed(1)}%`, type };
  }
}
