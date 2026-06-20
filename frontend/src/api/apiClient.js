/**
 * Centralized API Client for FinanceFlow.
 *
 * Replaces all hardcoded `http://127.0.0.1:8000` URLs with a configurable
 * base URL read from the VITE_API_BASE_URL environment variable.
 *
 * Features:
 *   - Automatic Bearer token injection from localStorage
 *   - Consistent error handling (throws on non-2xx responses)
 *   - Single place to update the base URL for all environments
 *
 * Usage:
 *   import { apiClient } from '../api/apiClient';
 *   const data = await apiClient.get('/api/transactions');
 *   const result = await apiClient.post('/api/auth/login', { email, password });
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const TOKEN_KEY = 'finance_auth_token';

/** Retrieve the stored JWT token from localStorage. */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/** Persist a JWT token to localStorage. */
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

/** Remove the JWT token (logout). */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Returns true if a token is currently stored. */
export const isAuthenticated = () => Boolean(getToken());


/**
 * Core fetch wrapper.
 * Automatically attaches the Authorization header if a token is available.
 * Throws an error with the server's error message on non-2xx responses.
 *
 * @param {string} path - API path starting with '/'  (e.g. '/api/kpis')
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<any>} - Parsed JSON response body
 */
async function request(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    // 204 No Content – return null (DELETE responses)
    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = data?.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(message);
    }

    return data;
}


/** API client with typed HTTP methods. */
export const apiClient = {
    get: (path) => request(path),

    post: (path, body) =>
        request(path, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    put: (path, body) =>
        request(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    delete: (path) =>
        request(path, { method: 'DELETE' }),
};
