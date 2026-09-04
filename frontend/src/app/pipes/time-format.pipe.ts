import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.substring(0, 5);
  }
}
