import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { PatientComponent } from './patient/patient.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { CaretakerListComponent } from './caretaker-list/caretaker-list.component';
import { CaretakerComponent } from './caretaker/caretaker.component';
import { AuthGuard } from './guards/auth.guard';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { ReportsComponent } from './reports/reports.component';
import { StatisticsComponent } from './statistics/statistics.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'estatisticas',
    component: StatisticsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'paciente',
    component: PatientComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'paciente/:id',
    component: PatientComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'lista-pacientes',
    component: PatientListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'lista-consultas',
    component: AppointmentListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'registro-usuario',
    component: UserRegisterComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'relatorios',
    component: ReportsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'lista-cuidadores',
    component: CaretakerListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cuidador/:id',
    component: CaretakerComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
