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

  static getGenderLabel(gender: string | null | undefined): string {
    if (!gender) return '';
    const g = String(gender).trim().toUpperCase();
    if (g === 'M' || g === 'MASCULINO') return 'Masculino';
    if (g === 'F' || g === 'FEMININO') return 'Feminino';
    return gender;
  }

  static formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  static getDateParts(dateStr: string | undefined) {
    if (!dateStr) return { day: '', month: '', year: '' };
    const d = this.parseDate(dateStr);
    if (isNaN(d.getTime())) return { day: '', month: '', year: '' };
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
      // If it's YYYY-MM-DD convert to MM-DD-YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(date.split('T')[0])) {
        const [y, m, ds] = date.split('T')[0].split('-');
        return `${m}-${ds}-${y}`;
      }
      // DD/MM/AAAA (Brazilian format from masked input)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split('/');
        return `${month}-${day}-${year}`;
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

  /**
   * Convert DD/MM/AAAA (Brazilian) → MM-DD-YYYY (backend).
   * Returns '' if input is invalid or incomplete.
   */
  static parseBRDate(brDate: string): string {
    if (!brDate) return '';
    const match = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return '';
    return `${match[2]}-${match[1]}-${match[3]}`;
  }

  /**
   * Auto-mask a date string to DD/MM/AAAA as the user types.
   * Call from (input) event handler.
   */
  static maskDateBR(raw: string): string {
    const digits = raw.replace(/\D/g, '').substring(0, 8);
    let result = '';
    if (digits.length > 0) result += digits.substring(0, 2);
    if (digits.length > 2) result += '/' + digits.substring(2, 4);
    if (digits.length > 4) result += '/' + digits.substring(4, 8);
    return result;
  }

  /**
   * Convert YYYY-MM-DD (backend/ISO) → DD/MM/AAAA (display in BR inputs).
   */
  static toDisplayDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const d = this.parseDate(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }


  static parseDate(dateStr: any): Date {
    if (!dateStr) return new Date();
    
    if (dateStr instanceof Date) {
      return new Date(dateStr.getTime());
    }
    
    const str = String(dateStr);
    
    // Handle YYYY-MM-DD or YYYY-MM-DDT...
    if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(str)) {
      const datePart = str.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Handle MM-DD-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [month, day, year] = str.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(NaN) : d;
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
