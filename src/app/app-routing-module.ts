import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { PatientRegister } from './patient-register/patient-register';

const routes: Routes = [
  { path: '', component: Home },
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro-paciente', component: PatientRegister }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
