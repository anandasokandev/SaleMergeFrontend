import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../models/ApiResponse';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VideoGenerationService {

  private apiUrl = `${environment.apiUrl}/videos/generate`;

  constructor(private http: HttpClient) { }

  generateVideo(data: any) {
    return this.http.post<ApiResponse>(this.apiUrl, data);
  }
}
