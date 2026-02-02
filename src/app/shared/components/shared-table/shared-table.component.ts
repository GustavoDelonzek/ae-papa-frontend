import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    type?: 'text' | 'date' | 'template' | 'action';
    cellTemplate?: TemplateRef<any>;
    headerClass?: string;
    cellClass?: string;
}

export interface TableAction {
    name: string;
    icon: string;
    class?: string;
    title?: string;
}

@Component({
    selector: 'app-shared-table',
    templateUrl: './shared-table.component.html',
    styleUrls: ['./shared-table.component.scss'],
    standalone: false
})
export class SharedTableComponent {
    @Input() data: any[] = [];
    @Input() columns: TableColumn[] = [];
    @Input() loading: boolean = false;
    @Input() paginationMeta: any;
    @Input() searchTerm: string = '';
    @Input() sortColumn: string = '';
    @Input() sortDirection: 'asc' | 'desc' = 'asc';
    @Input() emptyMessage: string = 'Nenhum registro encontrado';

    @Output() search = new EventEmitter<string>();
    @Output() sort = new EventEmitter<string>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() rowClick = new EventEmitter<any>();
    @Output() actionClick = new EventEmitter<{ action: string, item: any }>();

    // Toolbar state
    searching: boolean = false;

    onSearch(term: string): void {
        this.search.emit(term);
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.search.emit('');
    }

    onSort(columnKey: string): void {
        this.sort.emit(columnKey);
    }

    onPageChange(page: number): void {
        this.pageChange.emit(page);
    }

    onRowClick(item: any): void {
        this.rowClick.emit(item);
    }

    onAction(action: string, item: any, event: Event): void {
        event.stopPropagation();
        this.actionClick.emit({ action, item });
    }

    // Pagination helpers
    get totalPages(): number {
        return this.paginationMeta?.last_page || 1;
    }

    get currentPage(): number {
        return this.paginationMeta?.current_page || 1;
    }

    getPaginationInfo(): string {
        if (!this.paginationMeta) return '';
        const { from, to, total } = this.paginationMeta;
        return `Mostrando ${from} a ${to} de ${total} registros`;
    }

    getVisiblePages(): number[] {
        const pages: number[] = [];
        const maxVisible = 5;
        const total = this.totalPages;
        const current = this.currentPage;

        if (total <= maxVisible) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            let start = Math.max(1, current - 2);
            let end = Math.min(total, current + 2);

            if (current <= 3) end = Math.min(total, 5);
            if (current > total - 3) start = Math.max(1, total - 4);

            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    }

    // Nested property access helper
    getProperty(item: any, key: string): any {
        return key.split('.').reduce((o, i) => o?.[i], item);
    }
}
