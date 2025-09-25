import { Component } from '@angular/core';
interface LoginData {
  usuario: string;
  senha: string;
}

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginData: LoginData = {
    usuario: '',
    senha: ''
  };

  onSubmit(): void {
    if (this.loginData.usuario && this.loginData.senha) {
      console.log('Dados de login:', this.loginData);
      // Aqui você pode implementar a lógica de autenticação
      // Por exemplo, chamar um serviço de autenticação
      this.authenticateUser();
    }
  }

  private authenticateUser(): void {
    // Implementar lógica de autenticação aqui
    // Por enquanto, apenas um log
    console.log('Tentando autenticar usuário:', this.loginData.usuario);
    
    // Exemplo de validação simples (remover em produção)
    if (this.loginData.usuario === 'admin' && this.loginData.senha === 'admin') {
      alert('Login realizado com sucesso!');
      // Redirecionar para dashboard ou página principal
    } else {
      alert('Credenciais inválidas!');
    }
  }
}
