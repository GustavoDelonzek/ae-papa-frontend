import { Directive, HostListener, Optional, Self } from '@angular/core';
import { SharedUtils } from '../../core/utils/shared-utils';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDateMask]',
  standalone: true
})
export class DateMaskDirective {
  constructor(@Optional() @Self() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    
    const masked = SharedUtils.maskDateBR(val);
    
    if (input.value !== masked) {
      input.value = masked;
      if (this.ngControl && this.ngControl.control) {
        this.ngControl.control.setValue(masked, { emitEvent: false, emitModelToViewChange: false });
      }
    }
  }
}
