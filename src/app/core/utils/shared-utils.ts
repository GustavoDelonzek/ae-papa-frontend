export class SharedUtils {
  
  static formatCPF(cpf: string | undefined): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  static getInitials(name: string | undefined): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  static formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  static getDateParts(dateStr: string | undefined) {
    if (!dateStr) return { day: '', month: '', year: '' };
    const d = this.parseDate(dateStr);
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return {
      day: String(d.getDate()).padStart(2, '0'),
      month: months[d.getMonth()],
      year: String(d.getFullYear())
    };
  }

  static formatDateForAPI(date: any): string {
    if (!date) return '';
    
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      const parts = date.split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[1]}-${parts[2]}-${parts[0]}`;
      }
      d = new Date(date);
    } else {
      return String(date);
    }

    if (isNaN(d.getTime())) return String(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}-${day}-${year}`;
  }

  static parseDate(dateStr: string): Date {
    // Handle YYYY-MM-DD or YYYY-MM-DDT...
    if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Handle MM-DD-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  static toInputDate(date: string | undefined): string {
    if (!date) return '';

    if (date.includes('T')) {
      return date.split('T')[0];
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [month, day, year] = date.split('-');
      return `${year}-${month}-${day}`;
    }

    const parsedDate = this.parseDate(date);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  }

  static isValidCPF(cpf: string | undefined): boolean {
    if (!cpf) return false;
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  }
}
