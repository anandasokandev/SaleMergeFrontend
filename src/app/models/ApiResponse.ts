
export interface ApiResponse<T = any> {
  success: boolean | string;
  message: T | string;
  data?: any;
}
