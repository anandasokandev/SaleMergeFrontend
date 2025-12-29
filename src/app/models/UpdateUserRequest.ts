export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: 'user' | 'admin';
    is_active?: boolean;
    download_limit?: number;
    credits?: number;
}