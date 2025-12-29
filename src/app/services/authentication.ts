import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Authentication {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(user: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/login`, user);
  }

  // Send OTP (User specified endpoint)
  sendOtp(email: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/forgot-password`, { email: email });
  }

  // Final Reset (Payload with OTP)
  resetPassword(resetData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/reset-password`, resetData);
  }
}
