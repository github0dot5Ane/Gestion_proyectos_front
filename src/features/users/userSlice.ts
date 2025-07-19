// src/features/users/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";
import { User, UserState, UserFormData } from "../../types";
import { AxiosError } from "axios";
import { RootState } from "../../app/store"; // Importar RootState para usar en selectores

const initialState: UserState = {
  users: [],
  currentUserForEdit: null, // Añadido para el formulario de edición
  status: "idle",
  error: null,
};

// Thunk para obtener todos los usuarios (simplificado, podría necesitar filtros)
export const fetchUsers = createAsyncThunk<
  User[], // Tipo de retorno exitoso
  void, // Sin argumentos
  { rejectValue: string }
>("users/fetchUsers", async (_, { rejectWithValue }) => {
  try {
    // Endpoint para obtener usuarios (ajustar si es diferente)
    const response = await axiosInstance.get<{ data: User[] }>("/users"); // Asumiendo que Laravel devuelve bajo 'data' en Resource Collection
    return response.data.data; // Acceder a la data
  } catch (err) {
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || "Error al cargar usuarios");
  }
});

// Create User (Admin only)
export const createUser = createAsyncThunk<
  User,
  UserFormData,
  { rejectValue: string; state: RootState }
>("users/createUser", async (userData, { rejectWithValue, getState }) => {
  if (!getState().auth.user?.admin)
    return rejectWithValue("Acción no autorizada");
  // La API espera 'name' y 'password' probablemente
  const apiData = { ...userData, name: userData.nombre };
  if (!apiData.password)
    return rejectWithValue("La contraseña es requerida para crear un usuario.");

  try {
    // Usar el endpoint de admin para crear usuarios, o el genérico si es el mismo
    const response = await axiosInstance.post<{ data: User }>(
      "/users",
      apiData
    ); // Ajustar endpoint si es necesario
    return response.data.data;
  } catch (err) {
    const error = err as AxiosError;
    // ... (manejo de error similar a createProject, incluyendo 422 para validación) ...
    let errorMessage = "Error al crear el usuario.";
    if (error.response) {
      const responseData = error.response.data as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      errorMessage = responseData?.message ?? `Error ${error.response.status}`;
      if (error.response.status === 422 && responseData?.errors) {
        errorMessage =
          "Datos inválidos: " +
          Object.values(responseData.errors).flat().join(", ");
      }
    } else {
      errorMessage = error.message;
    }
    return rejectWithValue(errorMessage);
  }
});

// Update User (Admin only)
interface UpdateUserArgs {
  userId: number;
  // No incluimos password aquí. Si se necesita cambio de pass, debe ser otra acción/endpoint.
  userData: Omit<Partial<UserFormData>, "password">;
}
export const updateUser = createAsyncThunk<
  User,
  UpdateUserArgs,
  { rejectValue: string; state: RootState }
>(
  "users/updateUser",
  async ({ userId, userData }, { rejectWithValue, getState }) => {
    if (!getState().auth.user?.admin)
      return rejectWithValue("Acción no autorizada");
    // Ajustar nombre si es necesario para la API
    const apiData = { ...userData, name: userData.nombre };
    delete apiData.nombre; // Eliminar 'nombre' si la API espera 'name'

    try {
      const response = await axiosInstance.put<{ data: User }>(
        `/users/${userId}`,
        apiData
      );
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError;
      // ... (manejo de error similar a createUser) ...
      let errorMessage = "Error al actualizar el usuario.";
      if (error.response) {
        const responseData = error.response.data as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        errorMessage =
          responseData?.message ?? `Error ${error.response.status}`;
        if (error.response.status === 422 && responseData?.errors) {
          errorMessage =
            "Datos inválidos: " +
            Object.values(responseData.errors).flat().join(", ");
        }
      } else {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Delete User (Admin only)
export const deleteUser = createAsyncThunk<
  number,
  number,
  { rejectValue: string; state: RootState }
>("users/deleteUser", async (userId, { rejectWithValue, getState }) => { // Devuelve ID del usuario eliminado
  if (!getState().auth.user?.admin)
    return rejectWithValue("Acción no autorizada");
  const currentUserId = getState().auth.user?.id;
  if (userId === currentUserId)
    return rejectWithValue("No puedes eliminar tu propia cuenta."); // Autoprotección

  try {
    await axiosInstance.delete(`/users/${userId}`);
    return userId;
  } catch (err) {
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || `Error al eliminar usuario ${userId}`);
  }
});

// --- Slice Definition ---
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    // Acción para seleccionar un usuario para editar y mostrar en el formulario
    setUserForEdit: (state, action: PayloadAction<User | null>) => {
      state.currentUserForEdit = action.payload;
      state.error = null; // Limpiar error al abrir el form
    },
    clearUserError: (state) => {
      state.error = null;
      if (state.status === "failed") state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers (existente)
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = "succeeded";
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // createUser
      .addCase(createUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.users.push(action.payload); // Añadir a la lista
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = "failed"; // Mantener failed para mostrar error en form
        state.error = action.payload;
      })
      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload; // Actualizar en la lista
        }
        // Si el usuario editado era el currentUserForEdit, limpiarlo o actualizarlo?
        // Limpiarlo es más simple, obliga a cerrar el form.
        state.currentUserForEdit = null;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // deleteUser
      .addCase(deleteUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<number>) => {
        // payload es userId
        state.status = "succeeded";
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { setUserForEdit, clearUserError } = userSlice.actions;

// Selectores
export const selectAllUsers = (state: RootState) => state.users.users;
export const selectUsersStatus = (state: RootState) => state.users.status;
export const selectUserError = (state: RootState) => state.users.error;
export const selectUserForEdit = (state: RootState) => state.users.currentUserForEdit;

export default userSlice.reducer;
