import { NgModule, APP_INITIALIZER } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router } from '@angular/router';

// Angular Material Modules
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

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
import { ApointmentCreate } from './apointment-create/apointment-create';
import { ApointmentList } from './apointment-list/apointment-list';
import { UserRegister } from './user-register/user-register';
import { PatientFormModalComponent } from './shared/components/patient-form-modal/patient-form-modal.component';
import { CaretakerFormModalComponent } from './shared/components/caretaker-form-modal/caretaker-form-modal.component';
import { SharedTableComponent } from './shared/components/shared-table/shared-table.component';
import { CaretakerComponent } from './caretaker/caretaker.component';
import { SocioeconomicProfileModalComponent } from './shared/components/socioeconomic-profile-modal/socioeconomic-profile-modal.component';
import { ClinicalRecordModalComponent } from './shared/components/clinical-record-modal/clinical-record-modal.component';
import { AppointmentDetailsModalComponent } from './shared/components/appointment-details-modal/appointment-details-modal.component';
import { ToastComponent } from './shared/components/toast/toast.component';

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
    ApointmentCreate,
    ApointmentList,
    UserRegister,
    PatientFormModalComponent,
    CaretakerFormModalComponent,
    SocioeconomicProfileModalComponent,
    ClinicalRecordModalComponent,
    SharedTableComponent,
    CaretakerComponent,
    ToastComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    DocumentListComponent,
    DocumentUploadComponent,
    AppointmentDetailsModalComponent
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
    },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  bootstrap: [App]
})
export class AppModule { }