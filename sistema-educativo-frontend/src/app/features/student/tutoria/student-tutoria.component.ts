import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message, MessagingService } from '@core/services/messaging.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-student-tutoria',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './student-tutoria.component.html'
})
export class StudentTutoriaComponent implements OnInit {
  private readonly messagingService = inject(MessagingService);

  messages: Message[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  get unreadCount(): number {
    return this.messages.filter((message) => !this.isRead(message)).length;
  }

  isRead(message: Message): boolean {
    return !!message.recipients?.[0]?.read_at;
  }

  openMessage(message: Message): void {
    if (this.isRead(message)) {
      return;
    }

    this.messagingService.markRecipientRead(message.id).subscribe({
      next: () => {
        if (message.recipients?.[0]) {
          message.recipients[0].read_at = new Date().toISOString();
        }
      }
    });
  }

  private load(): void {
    this.loading = true;
    this.error = '';

    this.messagingService.getStudentInbox().subscribe({
      next: (response) => {
        this.messages = (response.data || []).sort((left, right) =>
          new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'No se pudieron cargar tus mensajes de tutoría.';
      }
    });
  }
}
