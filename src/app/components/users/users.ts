import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/users';
import { User } from '../../models/User';
import { CreateUserRequest } from '../../models/CreateUserRequest';
import { UpdateUserRequest } from '../../models/UpdateUserRequest';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css'], // ✅ FIXED
})
export class UsersComponent implements OnInit {

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
    private userService: UserService,
    private toastService: ToastService
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', []],
      role: ['user', [Validators.required]],
      download_limit: [10, [Validators.required, Validators.min(0)]],
      is_active: [true]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  // ========================
  // Load Users
  // ========================
  loadUsers() {
    this.loading.set(true);

    this.userService.getUsers(
      this.currentPage(),
      this.pageSize(),
      this.searchTerm()
    )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: any) => {

          // Check if data is in 'message' object (as indicated by user logs)
          if (response && response.message && Array.isArray(response.message.users)) {
            const apiUsers = response.message.users;
            const total = response.message.total || 0;

            // Map backend fields to Frontend User interface
            const mappedUsers: User[] = apiUsers.map((u: any) => ({
              userid: u.id,
              name: u.name || u.email.split('@')[0], // Fallback if name is missing
              email: u.email,
              role: (u.role || 'user').toLowerCase(),
              is_active: u.is_active !== undefined ? u.is_active : true, // Default to true if missing
              download_limit: u.credits !== undefined ? u.credits : 10,  // Map credits to download_limit
              downloads_used: u.downloads_count || 0,
              created_on: u.created_at, // Map created_at to created_on
              updated_on: u.updated_at || u.created_at
            }));

            this.users.set(mappedUsers);
            this.totalUsers.set(total);
            this.totalPages.set(Math.ceil(total / this.pageSize()));
          }
          // Check standard structure just in case
          else if (response && response.data && Array.isArray(response.data.data)) {
            this.users.set(response.data.data);
            this.totalUsers.set(response.data.pagination?.total || 0);
            this.totalPages.set(response.data.pagination?.pages || 0);
          }
          else {
            this.users.set([]);
            this.totalUsers.set(0);
            this.totalPages.set(0);
          }
        },
        error: (err) => {
          console.error('Error loading users:', err);
          const msg = err?.error?.message || err?.message || 'Failed to load users';
          this.toastService.error(msg, 'Error');
        }
      });
  }

  // ========================
  // Search & Pagination
  // ========================
  onSearch() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadUsers();
  }

  // ========================
  // Modal Controls
  // ========================
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

    const passwordCtrl = this.userForm.get('password');
    passwordCtrl?.enable();
    passwordCtrl?.setValidators([
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]);
    passwordCtrl?.updateValueAndValidity(); // ✅ FIX

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

    const passwordCtrl = this.userForm.get('password');
    passwordCtrl?.clearValidators();
    passwordCtrl?.disable();
    passwordCtrl?.updateValueAndValidity(); // ✅ FIX

    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);

    this.userForm.reset({
      name: '',
      email: '',
      password: '',
      role: 'user',
      download_limit: 10,
      is_active: true
    });

    this.userForm.get('password')?.enable(); // ✅ FIX
  }

  // ========================
  // Save User
  // ========================
  saveUser() {
    if (this.userForm.invalid) {
      this.toastService.error('Please fill all required fields correctly', 'Validation Error');
      return;
    }

    const formValue = this.userForm.getRawValue();
    this.loading.set(true);

    if (this.isEditMode()) {
      const userId = this.currentUserId();
      if (!userId) return;

      const updateData: UpdateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        role: formValue.role,
        credits: formValue.download_limit, // Backend expects 'credits'
        is_active: formValue.is_active
      };

      this.userService.updateUser(userId, updateData).subscribe({
        next: (response) => {
          const msg = typeof response.message === 'string' ? response.message
            : (typeof response.success === 'string' ? response.success : 'User updated successfully');
          this.toastService.success(msg, 'Success');
          this.loadUsers();
          this.closeModal();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error updating user:', err);
          const msg = err?.error?.message || err?.message || 'Failed to update user';
          this.toastService.error(msg, 'Error');
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
          const msg = typeof response.message === 'string' ? response.message
            : (typeof response.success === 'string' ? response.success : 'User created successfully');
          this.toastService.success(msg, 'Success');
          this.loadUsers();
          this.closeModal();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error creating user:', err);
          const msg = err?.error?.message || err?.message || 'Failed to create user';
          this.toastService.error(msg, 'Error');
          this.loading.set(false);
        }
      });
    }
  }

  // ========================
  // Delete & Status
  // ========================
  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.loading.set(true);

    this.userService.deleteUser(userId).subscribe({
      next: (response) => {
        const msg = typeof response.message === 'string' ? response.message
          : (typeof response.success === 'string' ? response.success : 'User deleted successfully');
        this.toastService.success(msg, 'Success');
        this.loadUsers();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        const msg = err?.error?.message || err?.message || 'Failed to delete user';
        this.toastService.error(msg, 'Error');
        this.loading.set(false);
      }
    });
  }

  toggleUserStatus(user: User) {
    this.userService.toggleUserStatus(user.userid, !user.is_active).subscribe({
      next: () => {
        this.toastService.success(
          `User ${!user.is_active ? 'activated' : 'deactivated'} successfully`,
          'Success'
        );
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error toggling user status:', err);
        const msg = err?.error?.message || err?.message || 'Failed to update user status';
        this.toastService.error(msg, 'Error');
      }
    });
  }

  // ========================
  // Helpers
  // ========================
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
