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
    newPassword: new FormControl<string>('', [Validators.required, Validators.minLength(6)]),
  });

  // Loading state for form submission
  loading = false;
  otpSent = false;
  otpVerified = false;
  isVerifying = false;
  resetToken: string | null = null;

  // Timer properties
  countdown = 30;
  canResendOtp = true;
  private timerSubscription?: Subscription;
  private otpSubscription?: Subscription;

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

    // Auto-verify OTP when 6 digits are entered
    this.otpSubscription = this.resetForm.get('otp')?.valueChanges.subscribe((value) => {
      if (value && value.length === 6 && !this.otpVerified && !this.isVerifying) {
        this.verifyOtp();
      }
    });
  }

  // OnDestroy lifecycle hook
  ngOnDestroy(): void {
    this.stopTimer();
    if (this.otpSubscription) {
      this.otpSubscription.unsubscribe();
    }
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
        this.otpVerified = false;
        this.toastService.success(res?.message || 'OTP sent to your email.', 'Success');
        console.log('OTP sent:', res);

        // Enable OTP field and disable email
        this.resetForm.get('otp')?.enable();
        this.resetForm.get('otp')?.reset();
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

  // Verify OTP
  verifyOtp() {
    if (this.isVerifying || this.otpVerified) {
      return;
    }

    const email = this.resetForm.get('email')?.value;
    const otp = this.resetForm.get('otp')?.value;

    if (!email || !otp) {
      this.toastService.error('Email and OTP are required.', 'Error');
      return;
    }

    this.isVerifying = true;
    this.loading = true;

    // Verify OTP API - Use the verify-otp-reset endpoint
    this.loginApi.verifyOtp({ email, otp }).subscribe({
      next: (res) => {
        this.loading = false;
        this.isVerifying = false;

        if (res.status === true) {
          this.otpVerified = true;
          this.resetToken = res.resetToken; // Store the reset token
          this.toastService.success(res?.message || 'OTP verified successfully.', 'Success');

          this.stopTimer();
          
          // Disable OTP field and enable password field
          this.resetForm.get('otp')?.disable();
          this.resetForm.get('newPassword')?.enable();
          
          // Trigger change detection
          this.cdr.markForCheck();

          console.log('OTP verified, reset token received:', this.resetToken);
        } else {
          this.otpVerified = false;
          this.toastService.error(res?.message || 'Invalid OTP. Please try again.', 'Error');
          console.error('OTP verification failed:', res);
        }
      },
      error: (err) => {
        this.loading = false;
        this.isVerifying = false;
        this.otpVerified = false;
        this.toastService.error(err?.error?.message || 'Invalid OTP. Please try again.', 'Error');
        console.error('verifyOtp error:', err);
      },
    });
  }

  // Reset password
  onResetPassword() {
    if (!this.otpVerified) {
      this.toastService.error('Please verify OTP first.', 'Error');
      return;
    }

    if (!this.resetToken) {
      this.toastService.error('Reset token is missing. Please verify OTP again.', 'Error');
      return;
    }

    
    this.loading = true;

    const email = this.resetForm.get('email')?.value;
    // Call reset password API with email and resetToken
    this.loginApi.resetPassword({ email, resetToken: this.resetToken }).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.status === false) {
          this.toastService.error(res?.message || 'Failed to reset password.', 'Error');
          return;
        }

        this.toastService.success(
          res?.message || 'Password reset successfully. New password sent to your email.',
          'Success'
        );
        console.log('Password reset:', res);

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
    return !this.otpVerified || this.loading || false;
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
    return this.otpVerified;
  }
}
