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
  
  currentUser = signal('John Doe');
  userEmail = signal('');
  userRole = signal('admin');
  userId = signal<number>(0);
  token = signal<string | null>(null);

  constructor(
    private router: Router, 
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo() {
    // Get user data from localStorage
    const userId = Number(localStorage.getItem('userId'));
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    this.userId.set(userId);
    this.token.set(token);
    this.currentUser.set(username || 'User');
    this.userEmail.set(email || '');
    this.userRole.set(role || 'admin');

    console.log('Token:', token);
    
    // Redirect to login if not authenticated
    if (!userId || !token) {
      this.toast.info('Please login to continue', 'Info');
      this.router.navigate(['/login']);
    }
  }

  getInitials(): string {
    const name = this.currentUser();
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  isAdmin(): boolean {
    return this.userRole() === 'admin';
  }

  toggleDropdown() {
    this.isDropdownOpen.update(value => !value);
    if (this.isDropdownOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
    if (this.isMobileMenuOpen()) {
      this.isDropdownOpen.set(false);
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  navigateToUsers() {
    this.closeMobileMenu();
    this.closeDropdown();
    this.router.navigate(['/users']);
  }

  navigateToProfile() {
    this.closeDropdown();
    this.router.navigate(['/profile']);
  }

  navigateToSettings() {
    this.closeDropdown();
    this.router.navigate(['/settings']);
  }

  onLogout() {
    console.log('Logging out...');
    
    // Clear all user data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    // Close dropdown
    this.closeDropdown();
    
    // Show logout message
    this.toast.success('Logged out successfully', 'Success');
    
    // Redirect to login
    this.router.navigate(['/login']);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown-container')) {
      this.closeDropdown();
    }
  }
}
