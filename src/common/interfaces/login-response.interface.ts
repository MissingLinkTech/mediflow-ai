export interface LoginResponse {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    isActive: boolean;
    access_token: string;
    refresh_token: string;
}