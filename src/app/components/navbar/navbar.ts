import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  logo = signal('SaleMerge');
  isDropdownOpen = signal(false);
  isMobileMenuOpen = signal(false);

  currentUser = signal('');
  userEmail = signal('');
  userRole = signal('');
  userId = signal<number | null>(null);
  token = signal<string | null>(null);

  constructor(
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo() {
    const token = localStorage.getItem('token');
    const userIdRaw = localStorage.getItem('userId');

    if (!token || !userIdRaw) {
      return; // Navbar just stays unauthenticated
    }

    this.token.set(token);
    this.userId.set(Number(userIdRaw));
    this.userEmail.set(localStorage.getItem('email') || '');
    this.userRole.set(localStorage.getItem('role') || '');
    this.currentUser.set(this.userEmail() || 'User');
  }

  getInitials(): string {
    const value = this.currentUser();
    return value ? value.substring(0, 2).toUpperCase() : 'U';
  }

  isAdmin(): boolean {
    return this.userRole() === 'ADMIN';
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    this.isMobileMenuOpen.set(false);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
    this.isDropdownOpen.set(false);
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  onLogout() {
    localStorage.clear(); // 🔥 safest

    this.closeDropdown();
    this.toast.success('Logged out successfully');

    this.router.navigate(['/login'], { replaceUrl: true });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown-container')) {
      this.closeDropdown();
    }
  }
}
