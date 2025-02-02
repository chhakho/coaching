export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  name?: string;
}
