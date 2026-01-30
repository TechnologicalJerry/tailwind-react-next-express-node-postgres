// Type definitions
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
