import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Adicionar token ao header se existir
    if (token) {
      req = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    // Interceptar resposta e verificar erros de autenticação
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se receber erro 401 (Unauthorized), redirecionar para login
        if (error.status === 401) {
          console.warn('Sessão expirada ou não autorizado. Redirecionando para login...');
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url, expired: 'true' }
          });
        }
        
        // Se receber erro 403 (Forbidden)
        if (error.status === 403) {
          console.warn('Acesso negado.');
        }
        
        return throwError(() => error);
      })
    );
  }
}