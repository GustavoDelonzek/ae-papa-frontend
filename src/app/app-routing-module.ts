import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'estatisticas',
    loadComponent: () => import('./statistics/statistics.component').then(m => m.StatisticsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'paciente/:id',
    loadComponent: () => import('./patient/patient.component').then(m => m.PatientComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lista-pacientes',
    loadComponent: () => import('./patient-list/patient-list.component').then(m => m.PatientListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lista-atendimentos',
    loadComponent: () => import('./appointment-list/appointment-list.component').then(m => m.AppointmentListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'registro-usuario',
    loadComponent: () => import('./user-register/user-register.component').then(m => m.UserRegisterComponent),
    canActivate: [AuthGuard, roleGuard(['admin'])]
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lista-cuidadores',
    loadComponent: () => import('./caretaker-list/caretaker-list.component').then(m => m.CaretakerListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'cuidador/:id',
    loadComponent: () => import('./caretaker/caretaker.component').then(m => m.CaretakerComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
