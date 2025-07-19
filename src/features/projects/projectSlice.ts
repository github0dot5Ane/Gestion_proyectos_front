// src/features/projects/projectSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";
import { Project, ProjectState, ProjectFormData } from "../../types";
import { AxiosError } from "axios";
import { RootState } from "../../app/store"; // Importar RootState

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  status: "idle",
  error: null,
};

// --- Thunks ---

// Fetch all projects (puede aceptar filtros como query params en el futuro)
export const fetchProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>("projects/fetchProjects", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<{ data: Project[] }>("/projects"); // Asumiendo paginación o Resource Collection
    return response.data.data;
  } catch (err) {
    /* ... manejo de error similar a fetchUsers ... */
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || "Error al cargar proyectos");
  }
});

// Fetch single project by ID
export const fetchProjectById = createAsyncThunk<
  Project,
  string,
  { rejectValue: string }
>("projects/fetchProjectById", async (projectId, { rejectWithValue }) => {
  // ID es string por URL param
  try {
    const response = await axiosInstance.get<{ data: Project }>(
      `/projects/${projectId}`
    ); // Asumiendo API Resource
    return response.data.data;
  } catch (err) {
    /* ... manejo de error ... */
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || `Error al cargar proyecto ${projectId}`);
  }
});

// Create new project (Admin only)
export const createProject = createAsyncThunk<
  Project,
  ProjectFormData,
  { rejectValue: string; state: RootState }
>(
  "projects/createProject",
  async (projectData, { rejectWithValue, getState }) => {
    // Opcional: verificar rol de admin desde el estado
    if (!getState().auth.user?.admin)
      return rejectWithValue("Acción no autorizada");
    try {
      const response = await axiosInstance.post<{ data: Project }>(
        "/projects",
        projectData
      );
      return response.data.data;
    } catch (err) {
      /* ... manejo de error (incluir validación 422) ... */
      const error = err as AxiosError;
      let errorMessage = "Error al crear el proyecto.";
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

// Update project (Admin or RP)
export const updateProject = createAsyncThunk<
  Project,
  { projectId: string; projectData: Partial<ProjectFormData> }, // Partial permite actualizar solo algunos campos
  { rejectValue: string; state: RootState }
>(
  "projects/updateProject",
  async ({ projectId, projectData }, { rejectWithValue, getState }) => {
    // Opcional: verificar rol (Admin o RP del proyecto)
    const user = getState().auth.user;
    const project = getState().projects.currentProject; // Asume que currentProject está cargado
    if (!user || (!user.admin && user.id !== project?.id_responsable)) {
      // Comentado temporalmente si currentProject no está siempre disponible
      // return rejectWithValue('Acción no autorizada');
    }
    console.warn("Authorization check for update temporarily simplified."); // Aviso temporal

    try {
      const response = await axiosInstance.put<{ data: Project }>(
        `/projects/${projectId}`,
        projectData
      );
      return response.data.data;
    } catch (err) {
      /* ... manejo de error ... */
      const error = err as AxiosError;
      // ... (manejo similar a createProject) ...
      let errorMessage = "Error al actualizar el proyecto.";
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

// Delete project (Admin only)
export const deleteProject = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>( // Devuelve el ID del proyecto eliminado
  "projects/deleteProject",
  async (projectId, { rejectWithValue, getState }) => {
    // Opcional: verificar rol de admin
    if (!getState().auth.user?.admin)
      return rejectWithValue("Acción no autorizada");
    try {
      await axiosInstance.delete(`/projects/${projectId}`);
      return projectId; // Devolver ID para eliminar de la lista en el state
    } catch (err) {
      /* ... manejo de error ... */
      const error = err as AxiosError;
      const message =
        (error.response?.data as { message?: string })?.message ||
        error.message;
      return rejectWithValue(
        message || `Error al eliminar proyecto ${projectId}`
      );
    }
  }
);

// --- Slice Definition ---
const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Limpiar proyecto actual al salir de la página de detalles, por ejemplo
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.status = "idle"; // Reset status? Depende del flujo deseado
      state.error = null;
    },
    clearProjectError: (state) => {
      state.error = null;
      if (state.status === "failed") state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProjects
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        fetchProjects.fulfilled,
        (state, action: PayloadAction<Project[]>) => {
          state.status = "succeeded";
          state.projects = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // fetchProjectById
      .addCase(fetchProjectById.pending, (state) => {
        state.status = "loading";
        state.currentProject = null;
        state.error = null;
      }) // Limpiar al empezar a cargar uno nuevo
      .addCase(
        fetchProjectById.fulfilled,
        (state, action: PayloadAction<Project>) => {
          state.status = "succeeded";
          state.currentProject = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.currentProject = null; // Asegurar que no quede uno viejo en caso de error
      })
      // createProject
      .addCase(createProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        createProject.fulfilled,
        (state, action: PayloadAction<Project>) => {
          state.status = "succeeded";
          state.projects.push(action.payload); // Añadir el nuevo proyecto a la lista
          state.error = null;
          // Opcional: setear currentProject si se navega directo a detalles
          // state.currentProject = action.payload;
        }
      )
      .addCase(createProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // updateProject
      .addCase(updateProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateProject.fulfilled,
        (state, action: PayloadAction<Project>) => {
          state.status = "succeeded";
          // Actualizar en la lista de proyectos
          const index = state.projects.findIndex(
            (p) => p.id === action.payload.id
          );
          if (index !== -1) {
            state.projects[index] = action.payload;
          }
          // Actualizar el proyecto actual si es el mismo
          if (state.currentProject?.id === action.payload.id) {
            state.currentProject = action.payload;
          }
          state.error = null;
        }
      )
      .addCase(updateProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // deleteProject
      .addCase(deleteProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        deleteProject.fulfilled,
        (state, action: PayloadAction<string>) => {
          // payload es projectId
          state.status = "succeeded";
          // Eliminar de la lista
          state.projects = state.projects.filter(
            (p) => p.id !== parseInt(action.payload)
          ); // Convertir ID a número si es necesario
          // Limpiar si era el actual
          if (state.currentProject?.id === parseInt(action.payload)) {
            state.currentProject = null;
          }
          state.error = null;
        }
      )
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProject, clearProjectError } = projectSlice.actions;

// Selectores
export const selectAllProjects = (state: RootState) => state.projects.projects;
export const selectCurrentProject = (state: RootState) =>
  state.projects.currentProject;
export const selectProjectsStatus = (state: RootState) => state.projects.status;
export const selectProjectsError = (state: RootState) => state.projects.error;

export default projectSlice.reducer;
