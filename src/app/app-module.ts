import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router } from '@angular/router';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Login } from './login/login';
import { Home } from './home/home';
import { Sidebar } from './sidebar/sidebar';
import { PatientRegister } from './patient-register/patient-register';
import { PatientComponent } from './patient/patient.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentUploadComponent } from './document-upload/document-upload.component';

// Services e Guards
import { AuthService } from './services';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { appInitializerFactory } from './core/app-initializer';
import { CaretakerList } from './caretaker-list/caretaker-list';
import { CaretakerRegister } from './caretaker-register/caretaker-register';
import { ApointmentCreate } from './apointment-create/apointment-create';
import { ApointmentList } from './apointment-list/apointment-list';
import { UserRegister } from './user-register/user-register';

@NgModule({
  declarations: [
    App,
    Login,
    Home,
    PatientRegister,
    Sidebar,
    PatientComponent,
    PatientListComponent,
    CaretakerList,
    CaretakerRegister,
    ApointmentCreate,
    ApointmentList,
    UserRegister,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    DocumentListComponent,
    DocumentUploadComponent
  ],
  providers: [
    AuthService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [AuthService, Router],
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }