import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authentication } from '../../services/authentication';
import { ToastService } from '../../services/toast';
import { UserService } from '../../services/users';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ],
    }),
  });

  loading = false;
  errorMsg = '';

  constructor(
    private router: Router,
    private loginApi: Authentication,
    private toast: ToastService,
    private userService: UserService
  ) { }


  submit() {
    if (this.loginForm.invalid) {
      this.errorMsg = 'Please enter valid credentials';
      return;
    }

    const { email, password } = this.loginForm.value;

    if (!email || !password) {
      this.errorMsg = 'Email and password are required';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.loginApi.login({ email, password }).subscribe({
      next: (response: any) => {

        if (!response?.success) {
          this.loading = false;
          const msg = response?.message || 'Login failed';

          if (msg.toLowerCase().includes('disabled')) {
            this.toast.error('Account is disabled. Check your mail', 'Account Disabled');
          } else {
            this.toast.error(msg);
          }
          return;
        }

        const { token, user } = response.data;

        if (!token || !user) {
          this.loading = false;
          this.toast.error('Invalid server response');
          return;
        }

        // Store tentatively to allow verification call
        localStorage.setItem('token', token);

        // Verify Status via User Service (in case login payload misses is_active)
        this.userService.getUserById(user.id).subscribe({
          next: (userRes: any) => {
            let fullUser = null;
            if (userRes.message && userRes.message.id) fullUser = userRes.message;
            else if (userRes.data) fullUser = userRes.data;
            else fullUser = user;

            // Robust check
            const isActive = fullUser.is_active;
            const active = fullUser.active;

            const isExplicitlyDisabled =
              (isActive === 0 || isActive === false || isActive === '0' || isActive === 'false') ||
              (active === 0 || active === false || active === '0' || active === 'false');

            if (isExplicitlyDisabled) {
              this.loading = false;
              localStorage.clear();
              this.toast.error('Account is disabled. Check your mail', 'Account Disabled');
              return;
            }

            // If valid
            localStorage.setItem('userId', user.id);
            localStorage.setItem('email', user.email);
            localStorage.setItem('role', user.role);
            this.loading = false;
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            // If verification fails, fallback to strict check of login object
            this.loading = false;

            const isActive = user.is_active;
            const isExplicitlyDisabled = (isActive === 0 || isActive === false || isActive === '0' || isActive === 'false');

            if (isExplicitlyDisabled) {
              localStorage.clear();
              this.toast.error('Account is disabled. Check your mail', 'Account Disabled');
              return;
            }

            localStorage.setItem('userId', user.id);
            localStorage.setItem('email', user.email);
            localStorage.setItem('role', user.role);
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (err: any) => {
        this.loading = false;
        const errorMsg = err?.error?.message || err?.message || 'Invalid credentials';

        if (errorMsg.toLowerCase().includes('disabled')) {
          this.toast.error('Account is disabled. Check your mail', 'Account Disabled');
        } else {
          this.toast.error(errorMsg);
        }
      },
    });
  }
}
