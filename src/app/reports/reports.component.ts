import { Component, OnInit } from '@angular/core';
import { ReportsService, ReportConfig, ReportStats } from '../services/reports.service';
import { finalize } from 'rxjs/operators';
import { SharedUtils } from '../core/utils/shared-utils';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
    MatNativeDateModule
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

  private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  detailLevel = 'Completo'; // 'Completo' | 'Resumido'
  fileFormat = 'PDF'; // 'PDF' | 'XLSX' | 'CSV'
  loading = false;
  stats: ReportStats = {
    patient_count: 0,
    clinical_record_count: 0,
    socioeconomic_profile_count: 0
  };

  constructor(private reportsService: ReportsService) { }

  ngOnInit(): void {
    this.fetchStats();
  }

  fetchStats(): void {
    this.reportsService.getStats().subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error('Erro ao buscar estatísticas:', err)
    });
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
    const config = this.mapStateToConfig();
    this.executeDownload(config, 'relatorio_customizado');
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
