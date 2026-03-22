import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly title = signal('src');
}
