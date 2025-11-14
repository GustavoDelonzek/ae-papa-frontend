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
    
    // Verificar se está autenticado
    if (this.authService.isAuthenticated()) {
      // Verificar se o token ainda é válido
      const token = this.authService.getToken();
      if (token && this.isTokenExpired(token)) {
        console.warn('Token expirado. Redirecionando para login...');
        this.authService.logout();
        return this.router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url, expired: 'true' }
        });
      }
      return true;
    }

    // Redirecionar para login se não estiver autenticado
    console.warn('Usuário não autenticado. Redirecionando para login...');
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  /**
   * Verificar se o token JWT está expirado
   */
  private isTokenExpired(token: string): boolean {
    try {
      // Decodificar o JWT (formato: header.payload.signature)
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      
      // Verificar se tem campo 'exp' (expiration time)
      if (!payload.exp) {
        return false; // Se não tem expiração, considera válido
      }
      
      // Comparar timestamp atual com expiração (exp está em segundos)
      const expirationTime = payload.exp * 1000; // Converter para milissegundos
      const currentTime = Date.now();
      
      return currentTime >= expirationTime;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true; // Se houver erro, considerar expirado por segurança
    }
  }
}