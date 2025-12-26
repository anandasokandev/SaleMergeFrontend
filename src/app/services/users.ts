import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  userid: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  download_limit: number;
  downloads_used: number;
  created_on: string;
  updated_on: string;
}

export interface PaginatedUsersResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  download_limit?: number;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  is_active?: boolean;
  download_limit?: number;
}

export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  private apiUrl = `http://localhost:3000/api/users`;
  token = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.token.set(localStorage.getItem('token'));
  }

  /**
   * Get paginated list of users with search and filters
   */
  getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    active?: boolean
  ): Observable<PaginatedUsersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (typeof active !== 'undefined') {
      params = params.set('active', active.toString());
    }

    return this.http.get<PaginatedUsersResponse>(this.apiUrl, { params, headers: { 'Authorization': `Bearer ${this.token()}` } });
  }

  /**
   * Get single user by ID
   */
  getUserById(userId: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${userId}`, { headers: { 'Authorization': `Bearer ${this.token()}` } });
  }

  /**
   * Create a new user
   */
  createUser(userData: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, userData, { headers: { 'Authorization': `Bearer ${this.token()}` } });
  }

  /**
   * Update existing user
   */
  updateUser(userId: number, userData: UpdateUserRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${userId}`, userData, { headers: { 'Authorization': `Bearer ${this.token()}` } });
  }

  /**
   * Delete user
   */
  deleteUser(userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${userId}`, { headers: { 'Authorization': `Bearer ${this.token()}` } });
  }

  /**
   * Toggle user active status
   */
  toggleUserStatus(userId: number, isActive: boolean): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${userId}/status`, {
      is_active: isActive
    }, { headers: { 'Authorization': `Bearer ${this.token()}` } });
  }

  /**
   * Update user download limit
   */
  updateDownloadLimit(userId: number, downloadLimit: number): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${userId}/download-limit`, {
      download_limit: downloadLimit
    }, { headers: { 'Authorization': `Bearer ${this.token()}` } });
  }

  /**
   * Reset user downloads count
   */
  resetDownloads(userId: number): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${userId}/reset-downloads`, {}, { headers: { 'Authorization': `Bearer ${this.token()}` } });
  }
}
