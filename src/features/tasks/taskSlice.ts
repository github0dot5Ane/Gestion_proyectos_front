// src/features/tasks/taskSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";
import { Task, TaskState, TaskFormData } from "../../types";
import { AxiosError } from "axios";
import { RootState } from "../../app/store";

const initialState: TaskState = {
  tasks: [],
  currentTask: null, // No lo usaremos mucho en esta fase inicial
  status: "idle",
  error: null,
};

// --- Thunks ---

// Fetch tasks (puede filtrar por proyecto o por usuario)
interface FetchTasksArgs {
  projectId?: string;
  assignedTo?: "me" | string; // 'me' para el usuario actual, o un ID
}
export const fetchTasks = createAsyncThunk<
  Task[],
  FetchTasksArgs | void,
  { rejectValue: string }
>("tasks/fetchTasks", async (args, { rejectWithValue }) => {
  let url = "/tasks";
  const params: Record<string, string> = {};
  if (args) {
    if (args.projectId) {
      // Podría ser un endpoint anidado o un query param
      // Opción 1: Endpoint anidado (preferible si API lo soporta bien)
      url = `/projects/${args.projectId}/tasks`;
      // Opción 2: Query Param
      // params.project_id = args.projectId;
    }
    if (args.assignedTo) {
      params.assigned_to = args.assignedTo === "me" ? "me" : args.assignedTo; // API debe entender 'me'
    }
  }

  try {
    const response = await axiosInstance.get<{ data: Task[] }>(url, { params });
    return response.data.data;
  } catch (err) {
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || "Error al cargar tareas");
  }
});

// Create new task (Admin or RP of the project)
export const createTask = createAsyncThunk<
  Task,
  TaskFormData,
  { rejectValue: string; state: RootState }
>("tasks/createTask", async (taskData, { rejectWithValue, getState }) => {
  const user = getState().auth.user;
  // const project = getState().projects.currentProject; // Necesita que el proyecto esté cargado si validamos aquí

  // Validación de permiso (simplificada: requiere usuario logueado)
  // La validación real (Admin/RP) debería hacerla el backend
  if (!user) return rejectWithValue("Acción no autorizada");
  // if (!user || !project || (!user.admin && user.id !== project.id_responsable)) {
  //    return rejectWithValue('No tienes permiso para crear tareas en este proyecto.');
  // }

  try {
    // Endpoint para crear tareas (puede ser /tasks o /projects/{id}/tasks)
    // Usaremos /tasks y pasaremos id_proyecto en el body
    const response = await axiosInstance.post<{ data: Task }>(
      "/tasks",
      taskData
    );
    return response.data.data;
  } catch (err) {
    const error = err as AxiosError;
    // ... (manejo de error similar a createProject, incluyendo 422) ...
    let errorMessage = "Error al crear la tarea.";
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

// Update task (Admin, RP, or Assigned User for status only)
interface UpdateTaskArgs {
  taskId: string;
  taskData: Partial<TaskFormData>; // Permitir actualizar campos específicos
}
export const updateTask = createAsyncThunk<
  Task,
  UpdateTaskArgs,
  { rejectValue: string; state: RootState }
>(
  "tasks/updateTask",
  async ({ taskId, taskData }, { rejectWithValue, getState }) => {
    const user = getState().auth.user;
    // La validación de permisos es compleja aquí (Admin/RP puede editar todo, RT solo status)
    // El backend DEBE ser la autoridad final para los permisos.
    if (!user) return rejectWithValue("Acción no autorizada");

    try {
      const response = await axiosInstance.put<{ data: Task }>(
        `/tasks/${taskId}`,
        taskData
      );
      return response.data.data;
    } catch (err) {
      // ... (manejo de error similar a createTask) ...
      const error = err as AxiosError;
      let errorMessage = "Error al actualizar la tarea.";
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

// Delete task (Admin or RP)
export const deleteTask = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>("tasks/deleteTask", async (taskId, { rejectWithValue, getState }) => {
  // Devuelve ID de tarea eliminada
  const user = getState().auth.user;
  // Backend debe validar permisos (Admin/RP)
  if (!user) return rejectWithValue("Acción no autorizada");

  try {
    await axiosInstance.delete(`/tasks/${taskId}`);
    return taskId;
  } catch (err) {
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || `Error al eliminar tarea ${taskId}`);
  }
});

// Thunk para obtener una tarea por su ID
export const fetchTaskById = createAsyncThunk<
  Task,
  string,
  { rejectValue: string }
>("tasks/fetchTaskById", async (taskId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<{ data: Task }>(
      `/tasks/${taskId}`
    ); // Asumiendo endpoint /api/tasks/{taskId}
    return response.data.data;
  } catch (err) {
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || `Error al cargar la tarea ${taskId}`);
  }
});

// --- Slice Definition ---
const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.tasks = [];
      state.status = "idle";
      state.error = null;
    },
    clearTaskError: (state) => {
      state.error = null;
      if (state.status === "failed") state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.status = "succeeded";
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.tasks = []; // Limpiar tareas si la carga falla
      })
      // createTask
      .addCase(createTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
      }) // Podría ser un estado 'submitting' diferente
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.status = "succeeded"; // O volver a 'idle' si no afecta la lista principal inmediatamente
        state.tasks.push(action.payload); // Añadir a la lista actual (si aplica)
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = "failed"; // Mantener 'failed' para mostrar error en el form
        state.error = action.payload;
      })
      // updateTask
      .addCase(updateTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.status = "succeeded";
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload; // Actualizar en la lista
        }
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // deleteTask
      .addCase(deleteTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
      }) // O un estado 'deleting'
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
        state.tasks = state.tasks.filter(
          (t) => t.id !== parseInt(action.payload)
        );
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearTasks, clearTaskError } = taskSlice.actions;

// Selectores
export const selectAllTasks = (state: RootState) => state.tasks.tasks;
export const selectTasksStatus = (state: RootState) => state.tasks.status;
export const selectTasksError = (state: RootState) => state.tasks.error;

export default taskSlice.reducer;
