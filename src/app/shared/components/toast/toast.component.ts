import { Component, OnInit } from '@angular/core';
import { Toast, ToastService } from '../../../services/toast.service';

import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.scss'],
})
export class ToastComponent implements OnInit {
    toasts: Toast[] = [];

    constructor(private toastService: ToastService) { }

    ngOnInit(): void {
        this.toastService.toasts$.subscribe(toasts => {
            this.toasts = toasts;
        });
    }

    remove(id: number): void {
        this.toastService.remove(id);
    }
}
