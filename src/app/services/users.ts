import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/User';
import { PaginatedUsersResponse } from '../models/PaginatedResponse';
import { CreateUserRequest } from '../models/CreateUserRequest';
import { UpdateUserRequest } from '../models/UpdateUserRequest';
import { ApiResponse } from '../models/ApiResponse';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class UserService {

  private apiUrl = `${environment.apiUrl}/admin/users`;
  private generatedVideosApiUrl = `${environment.apiUrl}/videos/user`;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of users with search and filters
   */
  getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    active?: boolean
  ): Observable<ApiResponse<PaginatedUsersResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (typeof active !== 'undefined') {
      params = params.set('active', active.toString());
    }

    return this.http.get<ApiResponse<PaginatedUsersResponse>>(this.apiUrl, { params });
  }

  /**
   * Get single user by ID
   */
  getUserById(userId: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Create a new user
   */
  createUser(userData: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, userData);
  }

  /**
   * Update existing user
   */
  updateUser(userId: number, userData: UpdateUserRequest): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${userId}`, userData);
  }

  /**
   * Delete user
   */
  deleteUser(userId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Toggle user active status
   */
  toggleUserStatus(userId: number, isActive: boolean): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${userId}/status`, {
      is_active: isActive
    });
  }

  /**
   * Update user download limit
   */
  updateDownloadLimit(userId: number, downloadLimit: number): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${userId}/download-limit`, {
      download_limit: downloadLimit
    });
  }

  /**
   * Reset user downloads count
   */
  resetDownloads(userId: number): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${userId}/reset-downloads`, {});
  }

  getGeneratedVideos(userId: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.generatedVideosApiUrl}/${userId}`);
  }

  /**
   * Change user password
   */
  changePassword(data: any): Observable<ApiResponse> {
    // Assuming a separate endpoint or using a patch on the user profile
    // Based on typical patterns, let's assume a dedicated endpoint or reuse auth structure
    // Since there's no explicit Profile service, we'll add it here or in Authentication. 
    // Given the requirement is "change password by entering old and new", this is usually an Auth function.
    // However, if it's "updating profile", it might be here. 
    // Let's use the Authentication service for password changes as it relates to credentials.
    // But for now, I will add a method here that calls the backend.
    return this.http.post<ApiResponse>(`${environment.apiUrl}/auth/change-password`, data);
  }
  /**
   * Update User Profile (Self)
   */
  /**
   * Update User Profile (Self)
   * PATCH /api/users/me
   */
  updateProfile(data: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${environment.apiUrl}/users/me`, data);
  }
}
