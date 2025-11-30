import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    
    // Verificar se está autenticado (apenas verifica se tem token, não valida expiração)
    if (this.authService.isAuthenticated()) {
      // Deixar o backend validar o token. Se estiver expirado, o interceptor vai capturar o 401
      return true;
    }

    // Redirecionar para login se não estiver autenticado
    console.warn('Usuário não autenticado. Redirecionando para login...');
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}