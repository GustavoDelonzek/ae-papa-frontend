import { Component, Inject } from '@angular/core';
import { AuthService } from '../services';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  providers: [AuthService]
})
export class Sidebar {

  constructor(@Inject(AuthService) private authService: AuthService) {}

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logoutAndRedirect();
    }
  }
}
