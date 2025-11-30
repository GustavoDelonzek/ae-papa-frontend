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
          // Redirecionar para login apenas se o token foi invalidado (erro 401)
          const currentUrl = router.url;
          if (currentUrl !== '/login') {
            router.navigate(['/login'], {
              queryParams: { returnUrl: currentUrl, expired: 'true' }
            });
          }
        }
        resolve();
      },
      error: (err) => {
        console.error('Erro ao validar token:', err);
        // Não redirecionar em caso de erro de rede, apenas resolver
        resolve();
      }
    });
  });
}
