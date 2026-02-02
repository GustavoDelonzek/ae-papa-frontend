import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '../services';

interface MenuItem {
  text: string;
  icon?: string; // Optional for headers
  link?: string;
  children?: MenuItem[];
  expanded?: boolean;
  adminOnly?: boolean;
  type?: 'link' | 'header'; // To distinguish headers
  active?: boolean; // For default active state if needed (mainly handled by routerLinkActive)
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  providers: [AuthService]
})
export class Sidebar implements OnInit {
  isAdmin: boolean = false;
  isSidebarOpen: boolean = false;

  menuItems: MenuItem[] = [
    {
      text: 'Início',
      icon: 'fa-solid fa-border-all',
      link: '/',
      type: 'link'
    },
    {
      text: 'PRINCIPAL',
      type: 'header'
    },
    {
      text: 'Atendidos',
      icon: 'fa-solid fa-user-group',
      type: 'link',
      link: '/lista-pacientes'
    },
    {
      text: 'Cuidadores',
      icon: 'fa-solid fa-hand-holding-heart',
      type: 'link',
      link: '/lista-cuidadores'
    },
    {
      text: 'Atendimentos',
      icon: 'fa-solid fa-calendar-check',
      type: 'link',
      link: '/lista-consultas'
    },
    {
      text: 'RELATÓRIOS',
      type: 'header'
    },
    {
      text: 'Estatísticas',
      icon: 'fa-solid fa-chart-simple',
      link: '/estatisticas', // Placeholder link
      type: 'link'
    },
    {
      text: 'Documentos',
      icon: 'fa-solid fa-file-lines',
      link: '/documentos', // Placeholder link
      type: 'link'
    },
    {
      text: 'ADMINISTRAÇÃO',
      type: 'header',
      adminOnly: true
    },
    {
      text: 'Cadastrar Usuário',
      icon: 'fa-solid fa-user-shield',
      link: '/registro-usuario',
      type: 'link',
      adminOnly: true
    }
  ];

  constructor(@Inject(AuthService) private authService: AuthService) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  toggleGroup(item: MenuItem) {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logoutAndRedirect();
    }
  }
}
