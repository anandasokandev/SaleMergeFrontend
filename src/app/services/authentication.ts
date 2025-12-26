import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Authentication {
  private readonly API_URL = 'http://localhost:3000';

  constructor(private http: HttpClient){}

  login(user: any) : Observable<any>{
    return this.http.post(`${this.API_URL}/api/auth/login`,user);
  }

  sendOtp(email: any) : Observable<any>{
    return this.http.post(`${this.API_URL}/api/auth/request-otp`,{email: email});
  }

  verifyOtp(data: any) : Observable<any>{
    return this.http.post(`${this.API_URL}/api/auth/verify-otp-reset`,data);
  }

  resetPassword(resetData: any) : Observable<any>{
    return this.http.post(`${this.API_URL}/api/auth/reset-password`,resetData);
  }
}
