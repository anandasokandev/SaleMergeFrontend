import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../../services/users';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-users',
  standalone: true,  // Add this if using standalone components
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {  // CHANGED FROM Users to UsersComponent
  users = signal<User[]>([]);
  
  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalUsers = signal(0);
  totalPages = signal(0);

  // UI State
  isModalOpen = signal(false);
  isEditMode = signal(false);
  currentUserId = signal<number | null>(null);
  loading = signal(false);
  searchTerm = signal('');

  userForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private userService: UserService,  // CHANGED FROM userApi to userService
    private toastService: ToastService
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', [Validators.required]],
      download_limit: [10, [Validators.required, Validators.min(0)]],
      is_active: [true]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    
    this.userService.getUsers(  // CHANGED FROM userApi to userService
      this.currentPage(),
      this.pageSize(),
      this.searchTerm()
    ).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalUsers.set(response.pagination.total);
        this.totalPages.set(response.pagination.pages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.toastService.error('Failed to load users', 'Error');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadUsers();
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.currentUserId.set(null);
    this.userForm.reset({
      name: '',
      email: '',
      password: '',
      role: 'user',
      download_limit: 10,
      is_active: true
    });
    
    this.userForm.get('password')?.enable();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    
    this.isModalOpen.set(true);
  }

  openEditModal(user: User) {
    this.isEditMode.set(true);
    this.currentUserId.set(user.userid);
    
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      download_limit: user.download_limit,
      is_active: user.is_active
    });

    this.userForm.get('password')?.disable();
    this.userForm.get('password')?.clearValidators();
    
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.userForm.reset();
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.toastService.error('Please fill all required fields correctly', 'Validation Error');
      return;
    }

    const formValue = this.userForm.getRawValue();
    this.loading.set(true);

    if (this.isEditMode()) {
      const updateData: UpdateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        role: formValue.role,
        download_limit: formValue.download_limit,
        is_active: formValue.is_active
      };

      this.userService.updateUser(this.currentUserId()!, updateData).subscribe({
        next: (response) => {
          this.toastService.success(response.message || 'User updated successfully', 'Success');
          this.loadUsers();
          this.closeModal();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.toastService.error(err.error?.message || 'Failed to update user', 'Error');
          this.loading.set(false);
        }
      });
    } else {
      const createData: CreateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        role: formValue.role,
        download_limit: formValue.download_limit,
        is_active: formValue.is_active
      };

      this.userService.createUser(createData).subscribe({
        next: (response) => {
          this.toastService.success(response.message || 'User created successfully', 'Success');
          this.loadUsers();
          this.closeModal();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error creating user:', err);
          this.toastService.error(err.error?.message || 'Failed to create user', 'Error');
          this.loading.set(false);
        }
      });
    }
  }

  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.loading.set(true);
    this.userService.deleteUser(userId).subscribe({
      next: (response) => {
        this.toastService.success(response.message || 'User deleted successfully', 'Success');
        this.loadUsers();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.toastService.error(err.error?.message || 'Failed to delete user', 'Error');
        this.loading.set(false);
      }
    });
  }

  toggleUserStatus(user: User) {
    this.userService.toggleUserStatus(user.userid, !user.is_active).subscribe({
      next: (response) => {
        this.toastService.success(
          `User ${!user.is_active ? 'activated' : 'deactivated'} successfully`, 
          'Success'
        );
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error toggling user status:', err);
        this.toastService.error(err.error?.message || 'Failed to update user status', 'Error');
      }
    });
  }

  getFilteredUsers() {
    return this.users();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  get hasNextPage(): boolean {
    return this.currentPage() < this.totalPages();
  }

  get hasPrevPage(): boolean {
    return this.currentPage() > 1;
  }
}
