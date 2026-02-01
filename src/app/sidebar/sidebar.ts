import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '../services';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  providers: [AuthService]
})
export class Sidebar implements OnInit {
  isAdmin: boolean = false;

  constructor(@Inject(AuthService) private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
  }

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logoutAndRedirect();
    }
  }
}
