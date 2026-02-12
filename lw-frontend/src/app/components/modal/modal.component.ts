import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  title = input.required<string>();
  show = input<boolean>(true);
  closed = output<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }

  onCloseClick(): void {
    this.closed.emit();
  }
}
