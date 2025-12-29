import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';
import { UserService } from '../../services/users';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user = signal({
    name: '',
    email: '',
    role: '',
    id: 0,
    credits: 0,
    downloads_count: 0
  });

  settingsForm: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    private router: Router
  ) {
    this.settingsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      oldPassword: [''],
      newPassword: ['', [
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    // Load from localStorage or fetch fresh from API
    const id = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (id) {
      this.userService.getUserById(Number(id)).subscribe({
        next: (res: any) => {
          let userData: any = null;
          if (res.message && res.message.id) userData = res.message;
          else if (res.data) userData = res.data;

          if (userData) {
            this.setUserData(userData);
          }
        },
        error: () => {
          // Fallback to local storage
          this.setUserData({
            name: 'User',
            email: email || '',
            role: role || '',
            id: Number(id)
          });
        }
      });
    }
  }

  setUserData(data: any) {
    this.user.set({
      name: data.name || 'User',
      email: data.email,
      role: data.role,
      id: data.id,
      credits: data.credits || 0,
      downloads_count: data.downloads_count || 0
    });

    // Update form values
    this.settingsForm.patchValue({
      name: data.name || '',
      email: data.email || ''
    });
  }

  onUpdateProfile() {
    if (this.settingsForm.invalid) {
      this.toast.error('Please check your input', 'Validation Error');
      return;
    }

    this.loading.set(true);
    const formVal = this.settingsForm.value;

    // Construct payload ensuring keys match backend expectation
    // Only include password fields if they are provided
    const payload: any = {
      name: formVal.name,
      email: formVal.email
    };

    if (formVal.newPassword) {
      if (!formVal.oldPassword) {
        this.loading.set(false);
        this.toast.error('Current password is required to set a new password', 'Validation Error');
        return;
      }
      payload.old_password = formVal.oldPassword;
      payload.new_password = formVal.newPassword;
    }

    this.userService.updateProfile(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success('Profile updated successfully', 'Success');

        // Update local signal 
        this.user.update(u => ({
          ...u,
          name: formVal.name,
          email: formVal.email
        }));

        // Clear sensitive fields
        this.settingsForm.patchValue({
          oldPassword: '',
          newPassword: ''
        });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to update profile';
        this.toast.error(msg, 'Error');
      }
    });
  }

  deactivateAccount() {
    if (!confirm('Are you sure you want to deactivate your account? You will be logged out immediately.')) return;

    const userId = this.user().id;
    if (!userId) return;

    this.loading.set(true);
    // Use the toggleUserStatus method, setting active to false
    this.userService.toggleUserStatus(userId, false).subscribe({
      next: () => {
        this.toast.success('Account deactivated successfully', 'Success');
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Failed to deactivate account', 'Error');
      }
    });
  }
}
