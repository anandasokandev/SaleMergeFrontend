export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  download_limit?: number;
  is_active?: boolean;
}