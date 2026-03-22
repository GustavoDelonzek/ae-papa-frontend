import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReportsService, ReportConfig } from '../services/reports.service';
import { SharedUtils } from '../core/utils/shared-utils';
import { finalize } from 'rxjs/operators';
import { ToastService } from '../services/toast.service'; // Assuming ToastService is in services folder

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
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
  maxPeriodDate: Date = new Date();

  detailLevel = 'Completo'; // 'Completo' | 'Resumido'
  fileFormat = 'PDF'; // 'PDF' | 'XLSX' | 'CSV'
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private reportsService: ReportsService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
  }

  private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  toggleColumn(column: 'personalInfo' | 'clinicalRecords' | 'socioeconomic' | 'attendanceHistory'): void {
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

  goHome(): void {
    this.router.navigate(['/']);
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
