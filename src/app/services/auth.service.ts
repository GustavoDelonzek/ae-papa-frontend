import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_URL } from '../../consts';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public currentUser: Observable<any> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Verificar se há usuário logado no localStorage
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  /**
   * Verificar se o usuário está logado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    return !!(token && user);
  }

  /**
   * Verificar sessão com o backend (valida se o token está válido)
   */
  checkSession(): Observable<any> {
    return this.http.get<any>(`${API_URL}/user`);
  }

  /**
   * Validar token com o backend
   */
  validateToken(): Observable<boolean> {
    return new Observable(observer => {
      if (!this.isAuthenticated()) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.checkSession().subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: (err) => {
          // Só fazer logout se for erro 401 (token expirado/inválido)
          if (err.status === 401) {
            this.logout();
            observer.next(false);
          } else {
            // Outros erros (rede, servidor) não devem deslogar
            observer.next(true);
          }
          observer.complete();
        }
      });
    });
  }

  /**
   * Obter o token atual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obter dados do usuário atual
   */
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Realizar login
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/login`, { email, password });
  }

  /**
   * Registrar novo usuário (apenas admin)
   */
  register(userData: { name: string; email: string; password: string; password_confirmation: string; role: string }): Observable<any> {
    return this.http.post<any>(`${API_URL}/register`, userData);
  }

  /**
   * Verificar se o usuário atual é admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  /**
   * Salvar dados de autenticação
   */
  setAuthData(user: any, token: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(user);
  }

  /**
   * Realizar logout
   */
  logout(): void {
    // Limpar localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Limpar subject
    this.currentUserSubject.next(null);
    
    // Não redirecionar aqui, deixar o interceptor ou guard fazer isso
    // para evitar redirecionamento duplo
  }

  /**
   * Realizar logout e redirecionar
   */
  logoutAndRedirect(): void {
    this.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Solicitar recuperação de senha
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/forgot-password`, { email });
  }

  /**
   * Confirmar resetar senha com token
   */
  resetPassword(token: string, password: string, password_confirmation: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/reset-password`, { token, password, password_confirmation });
  }
}