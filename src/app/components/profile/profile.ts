import { Component, Input, Output, EventEmitter, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent {
  @Input({ required: true }) darkMode!: Signal<boolean>;
  @Output() changePage = new EventEmitter<'login'>();
  @Output() toggleDarkMode = new EventEmitter<void>();

  moodRemindersEnabled = signal<boolean>(false);
  suggestionAlertsEnabled = signal<boolean>(true);
}