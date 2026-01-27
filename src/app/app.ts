import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardComponent } from './components/dashboard/dashboard';
import { SuggestionsComponent } from './components/suggestions/suggestions';
import { ProfileComponent } from './components/profile/profile';
import { LoginComponent } from './components/login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    DashboardComponent,
    SuggestionsComponent,
    ProfileComponent,
    LoginComponent
    
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent { 

  currentPage = signal<'login' | 'dashboard' | 'suggestions' | 'profile'>('login');
  darkMode = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.darkMode()) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    });
  }

  setPage(page: 'login' | 'dashboard' | 'suggestions' | 'profile') {
    this.currentPage.set(page);
    window.scrollTo(0, 0);
  }

  toggleDarkMode() {
    this.darkMode.update(value => !value);
  }
}