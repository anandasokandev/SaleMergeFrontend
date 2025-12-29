import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { ToastComponent } from './pages/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, CommonModule, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = signal('SaleMerge');
  showNavbar = signal<boolean>(true);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(event => this.checkRoute(event));
  }

  checkRoute(event: any) {
    const url = event.url.split('?')[0]; // Ignore query parameters
    const hiddenRoutes = ['/login', '/forgot-password', '/signup', '/'];
    this.showNavbar.set(!hiddenRoutes.includes(url));
  }
}