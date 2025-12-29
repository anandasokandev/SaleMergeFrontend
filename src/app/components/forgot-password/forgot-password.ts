import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Authentication } from '../../services/authentication';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})

export class ForgotPassword implements OnDestroy {
  // Form group for reset form
  resetForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    otp: new FormControl<string>('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
    newPassword: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]),
  });

  // Loading state for form submission
  loading = false;
  otpSent = false;

  // Timer properties
  countdown = 30;
  canResendOtp = true;
  private timerSubscription?: Subscription;

  // Constructor
  constructor(
    private router: Router,
    private loginApi: Authentication,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    // Disable OTP and password fields initially
    this.resetForm.get('otp')?.disable();
    this.resetForm.get('newPassword')?.disable();
  }

  // OnDestroy lifecycle hook
  ngOnDestroy(): void {
    this.stopTimer();
  }

  // Send OTP
  sendOTP() {
    const email = this.resetForm.get('email')?.value;

    if (!email) {
      this.toastService.error('Please enter your email first.', 'Error');
      return;
    }

    if (this.resetForm.get('email')?.invalid) {
      this.toastService.error('Please enter a valid email address.', 'Error');
      return;
    }

    this.loading = true;

    // Send OTP API
    this.loginApi.sendOtp(email).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.status === false) {
          this.toastService.error(res?.message || 'Failed to send OTP.', 'Error');
          return;
        }

        this.otpSent = true;
        this.toastService.success('OTP sent successfully. Please check your mail.', 'Success');


        // Enable OTP and Password fields, disable email
        this.resetForm.get('otp')?.enable();
        this.resetForm.get('otp')?.reset();
        this.resetForm.get('newPassword')?.enable();
        this.resetForm.get('email')?.disable();

        this.startResendTimer();
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err?.error?.message || 'Failed to send OTP.', 'Error');
        console.error('sendOTP error:', err);
      },
    });
  }

  // Start resend timer
  startResendTimer() {
    this.canResendOtp = false;
    this.countdown = 30;
    this.stopTimer();

    this.timerSubscription = interval(1000)
      .pipe(take(30))
      .subscribe({
        next: () => {
          this.countdown--;
          this.cdr.markForCheck();

          if (this.countdown <= 0) {
            this.canResendOtp = true;
          }
        },
        complete: () => {
          this.canResendOtp = true;
          this.countdown = 30;
          this.cdr.markForCheck();
        },
      });
  }

  // Stop timer
  stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // Reset password (Final Step)
  onResetPassword() {
    if (this.resetForm.invalid) {
      this.toastService.error('Please fill all fields correctly.', 'Error');
      return;
    }

    this.loading = true;

    const email = this.resetForm.get('email')?.value;
    const otp = this.resetForm.get('otp')?.value;
    const newPassword = this.resetForm.get('newPassword')?.value;

    const payload = { email, otp, newPassword };

    // Call reset password API
    this.loginApi.resetPassword(payload).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.status === false) {
          this.toastService.error(res?.message || 'Failed to reset password.', 'Error');
          return;
        }

        this.toastService.success(
          res?.message || 'Password has been successfully updated.',
          'Success'
        );


        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err?.error?.message || 'Failed to reset password.', 'Error');
        console.error('resetPassword error:', err);
      },
    });
  }

  // Check if submit button is disabled
  isSubmitDisabled(): boolean {
    return !this.otpSent || this.resetForm.invalid || this.loading || false;
  }

  // Check if send OTP button is disabled
  isSendOtpDisabled(): boolean {
    if (!this.otpSent) {
      return this.loading || this.resetForm.get('email')?.invalid || false;
    }
    return this.loading || !this.canResendOtp;
  }

  // Helper to check if password field should be shown
  showPasswordField(): boolean {
    return this.otpSent;
  }
}
