import { AuthService } from '../services';
import { Router } from '@angular/router';

/**
 * Factory para inicialização da aplicação
 * Verifica se o usuário está autenticado ao carregar a app
 */
export function appInitializerFactory(
  authService: AuthService,
  router: Router
): () => Promise<void> {
  return () => new Promise((resolve) => {
    // Verificar se há token no localStorage
    const token = authService.getToken();
    
    if (!token) {
      resolve();
      return;
    }

    // Validar o token com o backend
    authService.validateToken().subscribe({
      next: (isValid) => {
        if (!isValid) {
          console.warn('Token inválido ou expirado');
          // Redirecionar para login se estiver em rota protegida
          const currentUrl = router.url;
          if (currentUrl !== '/login') {
            router.navigate(['/login'], {
              queryParams: { returnUrl: currentUrl, expired: 'true' }
            });
          }
        }
        resolve();
      },
      error: () => {
        console.error('Erro ao validar token');
        resolve();
      }
    });
  });
}
