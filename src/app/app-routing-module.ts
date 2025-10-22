import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { PatientRegister } from './patient-register/patient-register';
import { PatientComponent } from './patient/patient.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: Login },
  { 
    path: '', 
    component: Home, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'registro-paciente', 
    component: PatientRegister,
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
    path: 'registro-paciente/:id', 
    component: PatientRegister,
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
