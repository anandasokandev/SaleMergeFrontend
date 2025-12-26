import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authentication } from '../../services/authentication';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(6)]),
  });

  loading = false;
  errorMsg = '';

  constructor(
    private router: Router,
    private loginApi: Authentication,
    private toast: ToastService
  ) {}

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
      
        this.loading = false;
        if (response.status == false) {
          this.toast.error(response.message);
          return;
        }
        // Save token if needed
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.user.id);
        }

        // Navigate after successful login
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading = false;
        this.toast.error('Invalid credentials');
      },
    });
  }
}
