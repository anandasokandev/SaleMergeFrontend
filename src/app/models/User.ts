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