/**
 * Interfaces que modelan las respuestas del backend Laravel + Sanctum.
 * Usadas para tipado estricto en los servicios — sin `any`.
 */

// ── Respuesta de la API de login ────────────────────────────────────────────
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  profile?: {
    role: string;
    full_name?: string;
  };
}

export interface LoginApiResponse {
  token: string;
  user: BackendUser;
}

// ── Respuesta de /me (sesión activa) ────────────────────────────────────────
export interface MeApiResponse {
  user: BackendUser;
}

// ── Respuestas genéricas de la API ──────────────────────────────────────────
export interface ApiMessageResponse {
  message: string;
}

export interface ApiDataResponse<T> extends ApiMessageResponse {
  data: T;
}

export interface PaginatedApiResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from?: number | null;
  last_page?: number;
  last_page_url?: string;
  next_page_url?: string | null;
  path?: string;
  per_page?: number;
  prev_page_url?: string | null;
  to?: number | null;
  total?: number;
}

export type CollectionResponse<T> =
  | T[]
  | { data: T[] }
  | PaginatedApiResponse<T>
  | { data: PaginatedApiResponse<T> };

export type PaginatedResponse<T> = PaginatedApiResponse<T>;
