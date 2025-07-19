// src/api/axiosInstance.ts
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; // Valor por defecto por si acaso

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest", // Importante para que Laravel sepa que es una petición AJAX (Sanctum lo usa)
  },
  withCredentials: true, // ¡CRUCIAL para Sanctum SPA Authentication (cookies)!
});

// Interceptor para el token (si usas tokens API además de Sanctum, o si no usas Sanctum SPA)
// Para Sanctum SPA, la autenticación principal es vía cookies después del login.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // O donde sea que guardes tu token si lo usas
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Opcional: Interceptor de respuesta para manejar errores globalmente (ej. 401 Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Lógica para desloguear al usuario si el token/sesión expira
      // Ejemplo: dispatch(logout()); window.location.href = '/login';
      console.error("Unauthorized! Logging out or redirecting to login...");
      // Aquí podrías despachar una acción de logout de Redux si estás en un contexto donde puedas hacerlo,
      // o emitir un evento personalizado que tu App escuche.
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
