import { api } from "./api";
import type { AuthUser } from "./auth-storage";

type SignupResponse = {
  success: boolean;
  message: string;
  data: AuthUser;
};

type SigninResponse = {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
    refresh_token?: string;
  };
};

type RefreshResponse = {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
    refresh_token?: string;
  };
};

export async function signupRequest(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>("/api/auth/signup", payload);
  return response.data;
}

export async function signinRequest(payload: {
  email: string;
  password: string;
}): Promise<SigninResponse> {
  const response = await api.post<SigninResponse>("/api/auth/signin", payload);
  return response.data;
}

export async function refreshRequest(): Promise<RefreshResponse> {
  const response = await api.post<RefreshResponse>("/api/auth/refresh", null);
  return response.data;
}

export async function firebaseAuthRequest(payload: {
  id_token: string;
}): Promise<SigninResponse> {
  const response = await api.post<SigninResponse>("/api/auth/firebase", payload);
  return response.data;
}

export type SimpleAuthResponse = {
  success: boolean;
  message: string;
};

export async function forgotPasswordRequest(payload: {
  email: string;
}): Promise<SimpleAuthResponse> {
  const response = await api.post<SimpleAuthResponse>("/api/auth/forgot-password", payload);
  return response.data;
}

export async function resetPasswordRequest(payload: {
  token: string;
  password: string;
}): Promise<SimpleAuthResponse> {
  const response = await api.post<SimpleAuthResponse>("/api/auth/reset-password", payload);
  return response.data;
}
