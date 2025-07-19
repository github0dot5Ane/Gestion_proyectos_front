// src/features/auth/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios"; // Importa la instancia de Axios
import {
  AuthState,
  User,
  LoginCredentials,
  RegisterData,
  LoginResponse,
  RegisterResponse,
} from "../../types";
import { AxiosError } from "axios"; // Importar AxiosError

// --- Thunk para Login ---
export const loginUser = createAsyncThunk<
  LoginResponse, // Tipo de retorno en caso de éxito (fulfilled)
  LoginCredentials, // Tipo del argumento que recibe el thunk
  { rejectValue: string } // Tipo del valor en caso de rechazo (rejected)
>(
  "auth/login", // Nombre de la acción
  async (credentials, { rejectWithValue }) => {
    try {
      // '/login' asume que tu endpoint de login en Laravel es /api/login
      const response = await axiosInstance.post<LoginResponse>(
        "/login",
        credentials
      );
      return response.data; // Devuelve { user: User, token: string }
    } catch (err) {
      const error = err as AxiosError;
      let errorMessage = "Error desconocido durante el inicio de sesión.";
      if (error.response) {
        // Error específico del backend (401, 422, etc.)
        // Intenta obtener el mensaje del backend, si no, usa un genérico
        const responseData = error.response.data as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        errorMessage =
          responseData?.message ?? `Error ${error.response.status}`;
        // Podrías manejar errores de validación (422) de forma más específica si quieres
        if (error.response.status === 422 && responseData?.errors) {
          errorMessage =
            "Datos inválidos: " +
            Object.values(responseData.errors).flat().join(", ");
        } else if (error.response.status === 401) {
          errorMessage = "Credenciales incorrectas.";
        }
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage =
          "No se pudo conectar con el servidor. Verifica tu conexión.";
      } else {
        // Error al configurar la petición
        errorMessage = error.message;
      }
      // Rechaza la promesa con el mensaje de error
      return rejectWithValue(errorMessage);
    }
  }
);

// --- Thunk para Registro ---
export const registerUser = createAsyncThunk<
  RegisterResponse, // Tipo de retorno en caso de éxito
  RegisterData, // Tipo del argumento
  { rejectValue: string } // Tipo en caso de rechazo
>("auth/register", async (userData, { rejectWithValue }) => {
  // Renombrar 'nombre' a 'name' si tu backend espera 'name'
  const apiData = { ...userData, name: userData.nombre };
  // Añadir password_confirmation si el backend lo requiere
  // apiData.password_confirmation = userData.password; // Asumiendo que el form lo tiene

  try {
    // '/register' asume endpoint /api/register
    const response = await axiosInstance.post<RegisterResponse>(
      "/register",
      apiData
    );
    // Aquí podrías querer hacer login automáticamente después del registro
    // o simplemente devolver los datos/mensaje de éxito
    return response.data; // Devuelve { user: User } o { message: string }
  } catch (err) {
    const error = err as AxiosError;
    let errorMessage = "Error desconocido durante el registro.";
    if (error.response) {
      const responseData = error.response.data as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      errorMessage = responseData?.message ?? `Error ${error.response.status}`;
      if (error.response.status === 422 && responseData?.errors) {
        // Formatear errores de validación
        errorMessage =
          "Error de validación: " +
          Object.values(responseData.errors).flat().join(" ");
      }
    } else if (error.request) {
      errorMessage = "No se pudo conectar con el servidor.";
    } else {
      errorMessage = error.message;
    }
    return rejectWithValue(errorMessage);
  }
});

// ... (resto del código de initialState y reducers síncronos como setLoading, setAuthSuccess, etc.) ...
// Leer estado inicial del localStorage si existe (para persistencia básica)
const loadInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem("authToken");
    const userString = localStorage.getItem("authUser");
    if (token && userString) {
      const user: User = JSON.parse(userString);
      // Retorna el estado completo si encuentra datos
      return { user, token, status: "idle", error: null };
    }
  } catch (error) {
    console.error("Failed to load auth state from localStorage", error);
    // Limpiar en caso de error al parsear
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  }
  // Retorna el estado por defecto si no hay datos o hay error
  return { user: null, token: null, status: "idle", error: null };
};
// ***** FIN DE LA FUNCIÓN A AÑADIR *****

const initialState: AuthState = loadInitialState(); // Asegúrate que loadInitialState esté definido como antes

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setAuthSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = "succeeded";
      state.error = null;
      localStorage.setItem("authToken", action.payload.token);
      localStorage.setItem("authUser", JSON.stringify(action.payload.user));
    },
    setAuthFailed: (state, action: PayloadAction<string | null>) => {
      state.user = null;
      state.token = null;
      state.status = "failed";
      state.error = action.payload ?? "Authentication failed";
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("authUser", JSON.stringify(state.user));
      }
    },
    // Limpiar errores manualmente si es necesario (ej, al navegar a otra página)
    clearAuthError: (state) => {
      state.error = null;
      // Podrías querer resetear status a 'idle' también si no está 'loading'
      if (state.status === "failed") {
        state.status = "idle";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Manejadores para loginUser ---
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          // Usamos el reducer síncrono para actualizar el estado y localStorage
          authSlice.caseReducers.setAuthSuccess(state, action);
          // El payload aquí es { user: User, token: string }
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        // Usamos el reducer síncrono, pasando el mensaje de error
        authSlice.caseReducers.setAuthFailed(state, {
          payload: action.payload ?? "Login fallido",
          type: action.type,
        });
        // action.payload contiene el string devuelto por rejectWithValue
      })
      // --- Manejadores para registerUser ---
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        registerUser.fulfilled,
        (state, action: PayloadAction<RegisterResponse>) => {
          state.status = "succeeded"; // Registro exitoso
          state.error = null;
          // OJO: El registro exitoso NO actualiza user/token aquí.
          // El usuario deberá hacer login después.
          // Podríamos guardar el mensaje de éxito si la API lo devuelve.
          console.log("Registro exitoso:", action.payload);
          // Considera limpiar el estado de error si venía de un intento anterior
          state.error = null;
        }
      )
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Registro fallido"; // Mensaje de rejectWithValue
      });
  },
});

// Exportar la nueva acción síncrona y el resto
export const {
  setLoading,
  setAuthSuccess,
  setAuthFailed,
  logout,
  updateUser,
  clearAuthError, // Exportar el limpiador de errores
} = authSlice.actions;

export default authSlice.reducer;

// --- Selectors (ya definidos antes) ---
export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  !!state.auth.token;
export const selectAuthStatus = (state: { auth: AuthState }) =>
  state.auth.status;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.admin ?? false;
