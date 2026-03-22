import { Component, OnInit } from '@angular/core';
import { ReportsService, ReportConfig, ReportStats } from '../services/reports.service';
import {
  DashboardService,
  DashboardStatistics,
  DashboardMonthlyItem,
  DashboardAppointmentsByTypeItem
} from '../services/dashboard.service';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../core/models/appointment.model';
import { PatientService, Patient, PatientsListResponse } from '../services/patient.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SharedUtils } from '../core/utils/shared-utils';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ScriptableContext, TooltipItem } from 'chart.js';

type StatsChartCardKey =
  | 'attended'
  | 'socioeconomicProfiles'
  | 'clinicalRecords'
  | 'appointmentsMonth'
  | 'newPatients'
  | 'patientsGrowth';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    BaseChartDirective
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  selectedColumns = {
    personalInfo: true,
    clinicalRecords: true,
    socioeconomic: false,
    attendanceHistory: false
  };

  period = {
    from: this.getFirstDayOfMonth(),
    to: new Date()
  };
  maxPeriodDate: Date = new Date();

  private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  detailLevel = 'Completo'; // 'Completo' | 'Resumido'
  fileFormat = 'PDF'; // 'PDF' | 'XLSX' | 'CSV'
  loading = false;
  statisticsLoading = false;
  stats: ReportStats = {
    patient_count: 0,
    clinical_record_count: 0,
    socioeconomic_profile_count: 0
  };

  newPatientsInSelectedMonth = 0;
  appointmentsInCurrentMonth = 0;
  patientsMonthlyGrowthDirection: 'up' | 'down' | 'flat' = 'flat';
  patientsMonthlyGrowthText = 'Sem comparação com mês anterior';
  appointmentsByType: DashboardAppointmentsByTypeItem[] = [];
  appointmentsByTypeSorted: DashboardAppointmentsByTypeItem[] = [];
  appointmentsByTypeLoaded = false;
  selectedStatisticsDate: Date = this.getCurrentMonthDate();
  selectedStatisticsMonth = this.formatMonthInput(this.getCurrentMonthDate());
  selectedStatsChartCard: StatsChartCardKey = 'appointmentsMonth';
  periodChartType: ChartType = 'line';
  periodChartTitle = 'Atendimentos por período';
  periodChartSubtitle = 'Mostra crescimento ou queda';
  periodChartTooltipLabel = 'Atendimentos';

  periodGranularity: 'day' | 'week' | 'month' = 'month';
  periodChartPoints: Array<{ label: string; value: number }> = [];
  periodChartData: ChartConfiguration<ChartType>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Atendimentos',
        data: [],
        borderColor: '#5b2fa8',
        backgroundColor: (context: ScriptableContext<'line'>) => this.createPeriodChartGradient(context),
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#5b2fa8',
        pointRadius: (context: ScriptableContext<'line'>) => this.resolvePointRadius(context),
        pointHoverRadius: 6,
        pointHoverBorderWidth: 3,
        pointBorderWidth: 2,
        borderWidth: 4,
        tension: 0.42,
        cubicInterpolationMode: 'monotone',
        fill: true
      }
    ]
  };
  periodChartOptions: ChartOptions<ChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#5b2fa8',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 10,
        displayColors: true,
        boxPadding: 5,
        callbacks: {
          title: (items) => items[0]?.label ? `Período: ${items[0].label}` : '',
          label: (context) => {
            return `${this.periodChartTooltipLabel}: ${context.formattedValue}`;
          },
          afterLabel: (context) => this.periodChartType === 'line'
            ? this.getTooltipVariationText(context)
            : ''
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    animation: {
      duration: 950,
      easing: 'easeOutQuart'
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 6,
        ticks: {
          precision: 0,
          color: '#6b7280',
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.16)',
          drawTicks: false
        }
      },
      x: {
        offset: true,
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          color: '#6b7280',
          font: { size: 10, weight: 600 },
          callback: (_value, index) => {
            const labels = (this.periodChartData.labels ?? []) as string[];
            if (!labels.length) {
              return '';
            }

            return this.shouldDisplayLabel(index, labels.length) ? labels[index] : '';
          }
        },
        grid: {
          display: false
        }
      }
    }
  };
  periodChartLoading = false;
  periodTrendDirection: 'up' | 'down' | 'flat' = 'flat';
  periodTrendPercentage = 0;
  periodTrendText = 'Sem variação no período';

  private appointmentsCache: Appointment[] | null = null;
  private appointmentsByMonthSeries: DashboardMonthlyItem[] = [];
  private newPatientsByMonthSeries: DashboardMonthlyItem[] = [];

  constructor(
    private reportsService: ReportsService,
    private dashboardService: DashboardService,
    private appointmentService: AppointmentService,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.fetchStats();
    this.fetchDashboardStatistics();
  }

  fetchStats(): void {
    this.reportsService.getStats().subscribe({
      next: (data) => {
        this.stats = this.normalizeReportStats(data);
        this.ensureStatsCompleteness();
      },
      error: (err) => {
        console.error('Erro ao buscar estatísticas:', err);
        this.fetchStatsFallbackFromPatients();
      }
    });
  }

  private normalizeReportStats(data: unknown): ReportStats {
    const payload = this.extractPayload(data);

    return {
      patient_count: this.toNumber(
        payload['patient_count'],
        payload['patients_count'],
        payload['total_patients'],
        payload['patientCount']
      ),
      clinical_record_count: this.toNumber(
        payload['clinical_record_count'],
        payload['clinical_records_count'],
        payload['clinical_records_total'],
        payload['total_clinical_records'],
        payload['clinicalRecordCount'],
        payload['clinical_records']
      ),
      socioeconomic_profile_count: this.toNumber(
        payload['socioeconomic_profile_count'],
        payload['socioeconomic_profiles_count'],
        payload['socioeconomic_profiles_total'],
        payload['total_socioeconomic_profiles'],
        payload['socioeconomicProfileCount'],
        payload['socioeconomic_profiles']
      )
    };
  }

  private extractPayload(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const typed = data as Record<string, unknown>;
    if (typed['data'] && typeof typed['data'] === 'object') {
      return typed['data'] as Record<string, unknown>;
    }

    return typed;
  }

  private toNumber(...values: unknown[]): number {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  }

  private ensureStatsCompleteness(): void {
    const needsPatientCount = this.stats.patient_count <= 0;
    const needsClinicalCount = this.stats.clinical_record_count <= 0;
    const needsSocioeconomicCount = this.stats.socioeconomic_profile_count <= 0;

    if (!needsPatientCount && !needsClinicalCount && !needsSocioeconomicCount) {
      return;
    }

    this.fetchStatsFallbackFromPatients(needsPatientCount, needsClinicalCount, needsSocioeconomicCount);
  }

  private fetchStatsFallbackFromPatients(
    needsPatientCount = true,
    needsClinicalCount = true,
    needsSocioeconomicCount = true
  ): void {
    const perPage = 100;

    this.patientService.getPatients(1, perPage).subscribe({
      next: (firstPage) => {
        const totalPages = firstPage.meta?.last_page ?? 1;
        const mergedPatients: Patient[] = [...(firstPage.data ?? [])];

        if (totalPages <= 1) {
          this.applyStatsFromPatientsData(
            mergedPatients,
            firstPage.meta?.total ?? mergedPatients.length,
            needsPatientCount,
            needsClinicalCount,
            needsSocioeconomicCount
          );
          return;
        }

        const requests = [];
        for (let page = 2; page <= totalPages; page++) {
          requests.push(
            this.patientService.getPatients(page, perPage).pipe(
              catchError((err) => {
                console.error(`Erro ao carregar pacientes da página ${page} para fallback de stats:`, err);
                return of(this.createEmptyPatientsListResponse(page, perPage));
              })
            )
          );
        }

        forkJoin(requests).subscribe({
          next: (responses) => {
            responses.forEach((response) => {
              mergedPatients.push(...(response.data ?? []));
            });

            this.applyStatsFromPatientsData(
              mergedPatients,
              firstPage.meta?.total ?? mergedPatients.length,
              needsPatientCount,
              needsClinicalCount,
              needsSocioeconomicCount
            );
          },
          error: (err) => {
            console.error('Erro ao consolidar pacientes para fallback de stats:', err);
            this.applyStatsFromPatientsData(
              mergedPatients,
              firstPage.meta?.total ?? mergedPatients.length,
              needsPatientCount,
              needsClinicalCount,
              needsSocioeconomicCount
            );
          }
        });
      },
      error: (fallbackError) => {
        console.error('Erro ao buscar fallback de estatísticas por pacientes:', fallbackError);
      }
    });
  }

  private createEmptyPatientsListResponse(page: number, perPage: number): PatientsListResponse {
    return {
      data: [],
      links: {
        first: null,
        last: null,
        prev: null,
        next: null
      },
      meta: {
        current_page: page,
        from: 0,
        last_page: page,
        per_page: perPage,
        to: 0,
        total: 0,
        path: ''
      }
    };
  }

  private applyStatsFromPatientsData(
    patients: Patient[],
    patientsTotal: number,
    shouldUpdatePatients: boolean,
    shouldUpdateClinicalRecords: boolean,
    shouldUpdateSocioeconomicProfiles: boolean
  ): void {
    let clinicalRecordsCount = 0;
    let socioeconomicProfilesCount = 0;

    (patients ?? []).forEach((patient) => {
      const clinicalRecords = (patient as any)['clinical_records'] ?? (patient as any)['clinicalRecords'];
      if (Array.isArray(clinicalRecords)) {
        clinicalRecordsCount += clinicalRecords.length;
      } else if (clinicalRecords && typeof clinicalRecords === 'object') {
        clinicalRecordsCount += 1;
      }

      const socioeconomicProfile = (patient as any)['socioeconomic_profile'] ?? (patient as any)['socioeconomicProfile'];
      if (Array.isArray(socioeconomicProfile)) {
        socioeconomicProfilesCount += socioeconomicProfile.length;
      } else if (socioeconomicProfile && typeof socioeconomicProfile === 'object') {
        socioeconomicProfilesCount += 1;
      }
    });

    this.stats = {
      ...this.stats,
      patient_count: shouldUpdatePatients
        ? (patientsTotal || patients.length)
        : this.stats.patient_count,
      clinical_record_count: shouldUpdateClinicalRecords
        ? clinicalRecordsCount
        : this.stats.clinical_record_count,
      socioeconomic_profile_count: shouldUpdateSocioeconomicProfiles
        ? socioeconomicProfilesCount
        : this.stats.socioeconomic_profile_count
    };
  }

  fetchDashboardStatistics(): void {
    this.statisticsLoading = true;

    const months = this.getStatisticsMonthsRange();
    const selectedMonthKey = this.getMonthKeyFromDate(this.selectedStatisticsDate);
    const periodRange = this.getMonthRange(this.selectedStatisticsDate);

    forkJoin({
      statistics: this.dashboardService.getStatistics(months),
      periodStats: this.reportsService.getStats(periodRange.startDate, periodRange.endDate).pipe(
        catchError((err) => {
          console.error('Erro ao buscar estatísticas mensais de relatórios:', err);
          return of(null);
        })
      )
    }).subscribe({
      next: ({ statistics, periodStats }) => {
        const totals = this.resolveStatisticsTotals(statistics);
        this.appointmentsByType = statistics.appointments_by_type ?? [];
        this.appointmentsByTypeSorted = this.sortAppointmentsByType(this.appointmentsByType);
        this.refreshAppointmentsByTypeBySelectedMonth();

        const monthlyItem = (statistics.appointments_by_month ?? []).find(item => item.month === selectedMonthKey);
        this.appointmentsInCurrentMonth = monthlyItem?.total ?? 0;
        this.appointmentsByMonthSeries = statistics.appointments_by_month ?? [];

        this.newPatientsByMonthSeries = statistics.new_patients?.by_month ?? [];
        this.newPatientsInSelectedMonth = this.getMonthlyTotalByKey(
          this.newPatientsByMonthSeries,
          selectedMonthKey,
          0
        );

        const normalizedPeriodStats = periodStats ? this.normalizeReportStats(periodStats) : null;
        if (normalizedPeriodStats) {
          this.stats = {
            ...this.stats,
            patient_count: normalizedPeriodStats.patient_count,
            clinical_record_count: normalizedPeriodStats.clinical_record_count,
            socioeconomic_profile_count: normalizedPeriodStats.socioeconomic_profile_count
          };
        } else {
          this.stats = {
            ...this.stats,
            patient_count: this.pickNonZero(this.stats.patient_count, totals.patients_active + totals.patients_inactive),
            clinical_record_count: this.pickNonZero(this.stats.clinical_record_count, totals.clinical_records),
            socioeconomic_profile_count: this.pickNonZero(this.stats.socioeconomic_profile_count, totals.socioeconomic_profiles)
          };
        }

        this.updateMonthlyPatientsGrowth(selectedMonthKey);

        this.refreshSelectedChart();
        this.statisticsLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar estatisticas detalhadas:', err);
        this.applyChartPoints([]);
        this.statisticsLoading = false;
      }
    });
  }

  private resolveStatisticsTotals(statistics: DashboardStatistics): {
    patients_active: number;
    patients_inactive: number;
    new_patients: number;
    appointments: number;
    clinical_records: number;
    socioeconomic_profiles: number;
  } {
    const totals = statistics.totals;

    return {
      patients_active: this.toNumber(
        totals?.patients_active,
        statistics.patients_active_inactive?.active
      ),
      patients_inactive: this.toNumber(
        totals?.patients_inactive,
        statistics.patients_active_inactive?.inactive
      ),
      new_patients: this.toNumber(
        totals?.new_patients,
        statistics.new_patients?.total
      ),
      appointments: this.toNumber(
        totals?.appointments,
        statistics.appointments_by_month?.reduce((sum, item) => sum + (item.total ?? 0), 0)
      ),
      clinical_records: this.toNumber(
        totals?.clinical_records,
        statistics.clinical_records?.total,
        statistics.clinical_records?.count,
        statistics.clinical_records_total,
        statistics.clinical_records_count
      ),
      socioeconomic_profiles: this.toNumber(
        totals?.socioeconomic_profiles,
        statistics.socioeconomic_profiles?.total,
        statistics.socioeconomic_profiles?.count,
        statistics.socioeconomic_profiles_total,
        statistics.socioeconomic_profiles_count
      )
    };
  }

  private pickNonZero(currentValue: number, candidateValue: number): number {
    return currentValue > 0 ? currentValue : candidateValue;
  }

  private getCurrentMonthDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getStatisticsMonthsRange(): number {
    const selectedMonth = this.getMonthStartDate(this.selectedStatisticsDate);
    const currentMonth = this.getCurrentMonthDate();

    const diff = (currentMonth.getFullYear() - selectedMonth.getFullYear()) * 12
      + (currentMonth.getMonth() - selectedMonth.getMonth());

    const months = diff + 1;
    const safeMonths = Number.isFinite(months) ? months : 1;
    return Math.min(Math.max(safeMonths, 1), 24);
  }

  private getMonthStartDate(dateValue: Date | string | null | undefined): Date {
    const date = dateValue instanceof Date ? dateValue : this.getCurrentMonthDate();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private formatMonthInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private parseMonthInput(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const [yearText, monthText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);

    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return null;
    }

    return new Date(year, month - 1, 1);
  }

  private getMonthRange(dateValue: Date | string | null | undefined): { startDate: string; endDate: string } {
    const baseDate = this.getMonthStartDate(dateValue);
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

    return {
      startDate: SharedUtils.formatDateForAPI(start),
      endDate: SharedUtils.formatDateForAPI(end)
    };
  }

  private refreshAppointmentsByTypeBySelectedMonth(): void {
    this.loadAppointmentsForChart(() => {
      const selected = this.getMonthStartDate(this.selectedStatisticsDate);
      const year = selected.getFullYear();
      const month = selected.getMonth();
      const byObjective = new Map<string, DashboardAppointmentsByTypeItem>();

      (this.appointmentsCache ?? []).forEach((appointment) => {
        const date = SharedUtils.parseDate(appointment.date);
        if (date.getFullYear() !== year || date.getMonth() !== month) {
          return;
        }

        const rawObjective = String(appointment.objective ?? '').trim();
        if (!rawObjective) {
          return;
        }

        const key = rawObjective.toLowerCase();
        const existing = byObjective.get(key);
        if (!existing) {
          byObjective.set(key, {
            objective: rawObjective,
            total: 1
          });
          return;
        }

        existing.total += 1;
      });

      const filteredByMonth = Array.from(byObjective.values());
      this.appointmentsByType = filteredByMonth;
      this.appointmentsByTypeSorted = this.sortAppointmentsByType(this.appointmentsByType);
      this.appointmentsByTypeLoaded = true;
    });
  }

  private getMonthKeyFromDate(dateValue: Date | string | null | undefined): string {
    const date = this.getMonthStartDate(dateValue);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }

  private normalizeMonthKey(monthValue: string | null | undefined): string {
    if (!monthValue) {
      return '';
    }

    const value = String(monthValue).trim();

    const yearMonthMatch = value.match(/^(\d{4})[-/](\d{1,2})$/);
    if (yearMonthMatch) {
      const year = yearMonthMatch[1];
      const month = String(Number(yearMonthMatch[2])).padStart(2, '0');
      return `${year}-${month}`;
    }

    const dateMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = String(Number(dateMatch[2])).padStart(2, '0');
      return `${year}-${month}`;
    }

    const parsed = SharedUtils.parseDate(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    }

    return value;
  }

  private getMonthlyTotalByKey(
    series: DashboardMonthlyItem[] | null | undefined,
    selectedMonthKey: string,
    fallbackValue = 0
  ): number {
    const normalizedSelected = this.normalizeMonthKey(selectedMonthKey);
    const item = (series ?? []).find((entry) => this.normalizeMonthKey(entry.month) === normalizedSelected);
    return item?.total ?? fallbackValue;
  }

  private getPreviousMonthKey(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
    const safeMonth = Number.isFinite(month) && month >= 1 && month <= 12 ? month : 1;
    const date = new Date(safeYear, safeMonth - 2, 1);
    return this.getMonthKeyFromDate(date);
  }

  private updateMonthlyPatientsGrowth(monthKey: string): void {
    const byMonth = new Map<string, number>();
    this.newPatientsByMonthSeries.forEach((item) => {
      byMonth.set(this.normalizeMonthKey(item.month), item.total ?? 0);
    });

    const normalizedCurrentMonth = this.normalizeMonthKey(monthKey);
    const current = byMonth.get(normalizedCurrentMonth) ?? 0;
    const previousMonthKey = this.getPreviousMonthKey(normalizedCurrentMonth);
    const previous = byMonth.get(previousMonthKey) ?? 0;
    const diff = current - previous;

    if (diff > 0) {
      this.patientsMonthlyGrowthDirection = 'up';
    } else if (diff < 0) {
      this.patientsMonthlyGrowthDirection = 'down';
    } else {
      this.patientsMonthlyGrowthDirection = 'flat';
    }

    const percentage = previous === 0
      ? (current > 0 ? 100 : 0)
      : Math.round((Math.abs(diff) / previous) * 100);

    if (this.patientsMonthlyGrowthDirection === 'up') {
      this.patientsMonthlyGrowthText = `+${percentage}% (${current} vs ${previous})`;
    } else if (this.patientsMonthlyGrowthDirection === 'down') {
      this.patientsMonthlyGrowthText = `-${percentage}% (${current} vs ${previous})`;
    } else {
      this.patientsMonthlyGrowthText = `0% (${current} vs ${previous})`;
    }
  }

  onStatisticsMonthChange(monthValue: string): void {
    const parsed = this.parseMonthInput(monthValue);
    if (!parsed) {
      return;
    }

    this.selectedStatisticsMonth = monthValue;
    this.selectedStatisticsDate = this.getMonthStartDate(parsed);
    this.fetchDashboardStatistics();
  }

  onStatisticsMonthPicked(date: Date, picker: MatDatepicker<Date>): void {
    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    this.selectedStatisticsDate = normalized;
    this.selectedStatisticsMonth = this.formatMonthInput(normalized);
    this.fetchDashboardStatistics();
    picker.close();
  }

  setPeriodGranularity(granularity: 'day' | 'week' | 'month'): void {
    if (this.periodGranularity === granularity) {
      return;
    }

    this.periodGranularity = granularity;
    this.refreshSelectedChart();
  }

  onStatisticsCardClick(card: StatsChartCardKey): void {
    if (this.selectedStatsChartCard === card) {
      return;
    }

    this.selectedStatsChartCard = card;
    this.refreshSelectedChart();
  }

  isChartCardSelected(card: StatsChartCardKey): boolean {
    return this.selectedStatsChartCard === card;
  }

  canShowPeriodGranularityToggle(): boolean {
    return this.selectedStatsChartCard === 'appointmentsMonth';
  }

  private refreshSelectedChart(): void {
    switch (this.selectedStatsChartCard) {
      case 'attended':
      case 'socioeconomicProfiles':
      case 'clinicalRecords':
        this.configureGeneralTotalsChart(this.selectedStatsChartCard);
        return;
      case 'newPatients':
        this.configureNewPatientsChart();
        return;
      case 'patientsGrowth':
        this.configurePatientsGrowthChart();
        return;
      case 'appointmentsMonth':
      default:
        this.configureAppointmentsChart();
        return;
    }
  }

  private configureAppointmentsChart(): void {
    this.periodChartType = 'line';
    this.periodChartTitle = 'Atendimentos por período';
    this.periodChartSubtitle = 'Mostra crescimento ou queda';
    this.periodChartTooltipLabel = 'Atendimentos';

    if (this.periodGranularity === 'month') {
      const points = this.buildMonthChartPoints();
      this.applyChartPoints(points, 'Atendimentos');
      return;
    }

    this.periodChartLoading = true;
    this.loadAppointmentsForChart(() => {
      const points = this.periodGranularity === 'day'
        ? this.buildDayChartPoints()
        : this.buildWeekChartPoints();
      this.applyChartPoints(points, 'Atendimentos');
      this.periodChartLoading = false;
    });
  }

  private configureNewPatientsChart(): void {
    this.periodChartType = 'line';
    this.periodChartTitle = 'Novos pacientes por mês';
    this.periodChartSubtitle = 'Evolução mensal de novos cadastros';
    this.periodChartTooltipLabel = 'Novos pacientes';

    const points = this.buildNewPatientsMonthChartPoints();
    this.applyChartPoints(points, 'Novos pacientes');
  }

  private configurePatientsGrowthChart(): void {
    const selectedMonthKey = this.getMonthKeyFromDate(this.selectedStatisticsDate);
    const previousMonthKey = this.getPreviousMonthKey(selectedMonthKey);
    const map = new Map<string, number>();

    this.newPatientsByMonthSeries.forEach((item) => {
      map.set(item.month, item.total ?? 0);
    });

    const previous = map.get(previousMonthKey) ?? 0;
    const current = map.get(selectedMonthKey) ?? 0;

    this.periodChartType = 'bar';
    this.periodChartTitle = 'Crescimento mensal de pacientes';
    this.periodChartSubtitle = 'Comparativo entre mês atual e mês anterior';
    this.periodChartTooltipLabel = 'Pacientes';
    this.periodChartPoints = [];

    this.periodChartData = {
      labels: ['Mês anterior', 'Mês atual'],
      datasets: [
        {
          label: 'Pacientes',
          data: [previous, current],
          backgroundColor: ['rgba(148, 163, 184, 0.45)', 'rgba(15, 118, 110, 0.45)'],
          borderColor: ['#64748b', '#0f766e'],
          borderRadius: 12,
          borderWidth: 2,
          barPercentage: 0.7,
          categoryPercentage: 0.66
        }
      ]
    };

    const diff = current - previous;
    if (diff > 0) {
      this.periodTrendDirection = 'up';
      this.periodTrendText = `Crescimento de ${current - previous} paciente(s) em relação ao mês anterior`;
    } else if (diff < 0) {
      this.periodTrendDirection = 'down';
      this.periodTrendText = `Redução de ${Math.abs(diff)} paciente(s) em relação ao mês anterior`;
    } else {
      this.periodTrendDirection = 'flat';
      this.periodTrendText = 'Sem variação de novos pacientes entre os meses';
    }
    this.periodTrendPercentage = 0;
  }

  private configureGeneralTotalsChart(selectedCard: StatsChartCardKey): void {
    const labels = ['Atendidos', 'Perfis socioeconômicos', 'Registros clínicos'];
    const values = [
      this.stats.patient_count,
      this.stats.socioeconomic_profile_count,
      this.stats.clinical_record_count
    ];

    const selectedIndex = selectedCard === 'attended'
      ? 0
      : selectedCard === 'socioeconomicProfiles'
        ? 1
        : 2;

    const backgroundColors = [
      'rgba(3, 105, 161, 0.22)',
      'rgba(16, 185, 129, 0.22)',
      'rgba(249, 115, 22, 0.22)'
    ];
    const borderColors = ['#0369a1', '#10b981', '#f97316'];
    backgroundColors[selectedIndex] = backgroundColors[selectedIndex].replace('0.22', '0.45');

    const titles = [
      'Comparativo geral de atendidos',
      'Comparativo de perfis socioeconômicos',
      'Comparativo de registros clínicos'
    ];

    this.periodChartType = 'bar';
    this.periodChartTitle = titles[selectedIndex];
    this.periodChartSubtitle = 'Panorama consolidado dos totais atuais';
    this.periodChartTooltipLabel = 'Total';
    this.periodChartPoints = [];

    this.periodChartData = {
      labels,
      datasets: [
        {
          label: 'Totais',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderRadius: 12,
          borderWidth: 2,
          barPercentage: 0.7,
          categoryPercentage: 0.66
        }
      ]
    };

    this.periodTrendDirection = 'flat';
    this.periodTrendPercentage = 0;
    this.periodTrendText = `Destaque atual: ${labels[selectedIndex]} (${values[selectedIndex]})`;
  }

  private loadAppointmentsForChart(onLoaded: () => void): void {
    if (this.appointmentsCache) {
      onLoaded();
      return;
    }

    const perPage = 100;
    this.appointmentService.listAppointments(1, perPage).subscribe({
      next: (firstPage) => {
        const baseData = firstPage.data ?? [];
        const totalPages = firstPage.meta?.last_page ?? 1;

        if (totalPages <= 1) {
          this.appointmentsCache = baseData;
          onLoaded();
          return;
        }

        const requests = [];
        for (let page = 2; page <= totalPages; page++) {
          requests.push(this.appointmentService.listAppointments(page, perPage));
        }

        forkJoin(requests).subscribe({
          next: (responses) => {
            const merged = [...baseData];
            responses.forEach(response => {
              merged.push(...(response.data ?? []));
            });
            this.appointmentsCache = merged;
            onLoaded();
          },
          error: (err) => {
            console.error('Erro ao carregar páginas de atendimentos para gráfico:', err);
            this.appointmentsCache = baseData;
            onLoaded();
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar atendimentos para gráfico:', err);
        this.appointmentsCache = [];
        onLoaded();
      }
    });
  }

  private buildMonthChartPoints(): Array<{ label: string; value: number }> {
    return (this.appointmentsByMonthSeries ?? []).map(item => ({
      label: this.formatMonthLabel(item.month),
      value: item.total ?? 0
    }));
  }

  private buildNewPatientsMonthChartPoints(): Array<{ label: string; value: number }> {
    return (this.newPatientsByMonthSeries ?? []).map(item => ({
      label: this.formatMonthLabel(item.month),
      value: item.total ?? 0
    }));
  }

  private buildDayChartPoints(): Array<{ label: string; value: number }> {
    const selected = this.getMonthStartDate(this.selectedStatisticsDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const counts = new Map<number, number>();

    (this.appointmentsCache ?? []).forEach(appointment => {
      const date = SharedUtils.parseDate(appointment.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        counts.set(day, (counts.get(day) ?? 0) + 1);
      }
    });

    const points: Array<{ label: string; value: number }> = [];
    for (let day = 1; day <= daysInMonth; day++) {
      points.push({
        label: String(day).padStart(2, '0'),
        value: counts.get(day) ?? 0
      });
    }
    return points;
  }

  private buildWeekChartPoints(): Array<{ label: string; value: number }> {
    const selected = this.getMonthStartDate(this.selectedStatisticsDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    const counts = new Array(weeksInMonth).fill(0);

    (this.appointmentsCache ?? []).forEach(appointment => {
      const date = SharedUtils.parseDate(appointment.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const weekIndex = Math.floor((date.getDate() - 1) / 7);
        counts[weekIndex] += 1;
      }
    });

    return counts.map((value, index) => ({
      label: `Sem ${index + 1}`,
      value
    }));
  }

  private applyChartPoints(points: Array<{ label: string; value: number }>, datasetLabel = 'Atendimentos'): void {
    this.periodChartPoints = points;

    const labels = points.map(point => point.label);
    const values = points.map(point => point.value);

    this.periodChartData = {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: values,
          borderColor: '#5b2fa8',
          backgroundColor: (context: ScriptableContext<'line'>) => this.createPeriodChartGradient(context),
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#5b2fa8',
          pointRadius: (context: ScriptableContext<'line'>) => this.resolvePointRadius(context),
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3,
          pointBorderWidth: 2,
          borderWidth: 4,
          tension: 0.42,
          cubicInterpolationMode: 'monotone',
          fill: true
        }
      ]
    };

    if (!points.length) {
      this.periodTrendDirection = 'flat';
      this.periodTrendPercentage = 0;
      this.periodTrendText = 'Sem dados para o período selecionado';
      return;
    }

    const firstValue = points[0].value;
    const lastValue = points[points.length - 1].value;
    const diff = lastValue - firstValue;

    if (diff > 0) {
      this.periodTrendDirection = 'up';
    } else if (diff < 0) {
      this.periodTrendDirection = 'down';
    } else {
      this.periodTrendDirection = 'flat';
    }

    if (firstValue === 0) {
      this.periodTrendPercentage = lastValue > 0 ? 100 : 0;
    } else {
      this.periodTrendPercentage = Math.round((Math.abs(diff) / firstValue) * 100);
    }

    if (this.periodTrendDirection === 'up') {
      this.periodTrendText = `Crescimento de ${this.periodTrendPercentage}% no período`;
    } else if (this.periodTrendDirection === 'down') {
      this.periodTrendText = `Queda de ${this.periodTrendPercentage}% no período`;
    } else {
      this.periodTrendText = 'Sem variação no período';
    }
  }

  private createPeriodChartGradient(context: ScriptableContext<'line'>): CanvasGradient | string {
    const chart = context.chart;
    const { ctx, chartArea } = chart;

    if (!chartArea) {
      return 'rgba(91, 47, 168, 0.12)';
    }

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(91, 47, 168, 0.34)');
    gradient.addColorStop(0.55, 'rgba(91, 47, 168, 0.16)');
    gradient.addColorStop(1, 'rgba(91, 47, 168, 0.02)');
    return gradient;
  }

  private resolvePointRadius(context: ScriptableContext<'line'>): number {
    const data = context.dataset.data as number[];
    if (!data.length) {
      return 0;
    }

    const index = context.dataIndex;
    const lastIndex = data.length - 1;
    const maxValue = Math.max(...data);
    const currentValue = data[index] ?? 0;

    if (index === lastIndex || currentValue === maxValue) {
      return 4.5;
    }

    return this.periodGranularity === 'day' ? 2.5 : 3.2;
  }

  private getTooltipVariationText(context: TooltipItem<'line'>): string {
    const dataset = context.dataset.data as number[];
    const index = context.dataIndex;
    if (index <= 0 || !dataset.length) {
      return 'Sem comparação anterior';
    }

    const previous = dataset[index - 1] ?? 0;
    const current = dataset[index] ?? 0;
    const diff = current - previous;

    if (diff === 0) {
      return 'Sem variação vs período anterior';
    }

    if (previous === 0) {
      return diff > 0 ? 'Alta vs período anterior' : 'Queda vs período anterior';
    }

    const percentage = Math.round((Math.abs(diff) / previous) * 100);
    return diff > 0
      ? `Alta de ${percentage}% vs período anterior`
      : `Queda de ${percentage}% vs período anterior`;
  }

  private shouldDisplayLabel(index: number, total: number): boolean {
    if (this.periodChartType !== 'line') {
      return true;
    }

    if (total <= 1) {
      return true;
    }

    if (this.periodGranularity === 'day') {
      const preferredIndexes = [0, 6, 13, 20, 27, total - 1]
        .filter(i => i >= 0 && i < total);
      return preferredIndexes.includes(index);
    }

    if (this.periodGranularity === 'week') {
      return true;
    }

    if (total <= 8) {
      return true;
    }

    const step = Math.ceil(total / 8);
    return index === 0 || index === total - 1 || index % step === 0;
  }

  private formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const safeMonth = Number.isFinite(month) && month >= 1 && month <= 12 ? month : 1;
    return `${months[safeMonth - 1]}/${year}`;
  }

  getAppointmentsByTypeTotal(): number {
    return (this.appointmentsByType ?? []).reduce((sum, item) => sum + (item.total ?? 0), 0);
  }

  private sortAppointmentsByType(items: DashboardAppointmentsByTypeItem[]): DashboardAppointmentsByTypeItem[] {
    return [...(items ?? [])].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  }

  getAppointmentTypePercentage(totalByType: number): number {
    const grandTotal = this.getAppointmentsByTypeTotal();
    if (!grandTotal) {
      return 0;
    }

    return Math.round((totalByType / grandTotal) * 100);
  }

  getAppointmentObjectiveLabel(objective: string): string {
    const key = String(objective ?? '').trim().toLowerCase();
    const labelMap: Record<string, string> = {
      donation: 'Doacao',
      project: 'Projeto',
      treatment: 'Tratamento',
      consultation: 'Consulta',
      follow_up: 'Acompanhamento',
      'follow-up': 'Acompanhamento',
      emergency: 'Emergencia',
      screening: 'Triagem',
      guidance: 'Orientacao',
      social_support: 'Apoio social',
      psychosocial_support: 'Apoio psicossocial'
    };

    if (labelMap[key]) {
      return labelMap[key];
    }

    const normalized = key.replace(/[_-]+/g, ' ').trim();
    if (!normalized) {
      return 'Nao informado';
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  toggleColumn(column: 'personalInfo' | 'clinicalRecords' | 'socioeconomic'): void {
    this.selectedColumns[column] = !this.selectedColumns[column];
  }

  setDetailLevel(level: string): void {
    this.detailLevel = level;
  }

  setFileFormat(format: string): void {
    this.fileFormat = format;
  }

  onDownload(): void {
    if (!this.validatePeriod()) {
      return;
    }

    const config = this.mapStateToConfig();
    this.executeDownload(config, 'relatorio_customizado');
  }

  private validatePeriod(): boolean {
    if (!this.period.from || !this.period.to) {
      alert('Preencha as datas inicial e final do período.');
      return false;
    }

    const from = new Date(this.period.from);
    const to = new Date(this.period.to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    if (from > to) {
      alert('A data inicial não pode ser maior que a data final.');
      return false;
    }

    if (from > today || to > today) {
      alert('As datas do período não podem ser futuras.');
      return false;
    }

    return true;
  }

  private mapStateToConfig(): ReportConfig {
    const columns: string[] = [];
    if (this.selectedColumns.personalInfo) columns.push('personal_info');
    if (this.selectedColumns.clinicalRecords) columns.push('clinical_records');
    if (this.selectedColumns.socioeconomic) columns.push('socioeconomic_history');
    if (this.selectedColumns.attendanceHistory) columns.push('attendance_frequency');

    return {
      columns,
      start_date: SharedUtils.formatDateForAPI(this.period.from),
      end_date: SharedUtils.formatDateForAPI(this.period.to),
      detail_level: this.detailLevel === 'Completo' ? 'complete' : 'resumed',
      format: this.fileFormat.toLowerCase() as 'pdf' | 'xlsx' | 'csv'
    };
  }

  private executeDownload(config: ReportConfig, fileName: string): void {
    if (this.loading) return;
    
    this.loading = true;
    this.reportsService.generateReport(config)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${fileName}.${config.format}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Erro ao gerar relatório:', err);
          alert('Erro ao gerar relatório. Por favor, tente novamente.');
        }
      });
  }

  onQuickExport(type: string): void {
    let config: ReportConfig;

    if (type === 'PDF') {
      config = {
        columns: ['personal_info', 'clinical_records', 'socioeconomic_history', 'attendance_frequency'],
        detail_level: 'complete',
        format: 'pdf'
      };
    } else {
      config = {
        columns: ['socioeconomic_history'],
        detail_level: 'resumed',
        format: 'xlsx'
      };
    }

    this.executeDownload(config, `exportacao_rapida_${type.toLowerCase()}`);
  }
}
