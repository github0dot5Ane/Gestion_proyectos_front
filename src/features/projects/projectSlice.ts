// src/features/projects/projectSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";
import { Project, ProjectState, ProjectFormData } from "../../types";
import { AxiosError } from "axios";
import { RootState } from "../../app/store";

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  status: "idle",
  error: null,
};

// --- Thunks ---

export const fetchProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>("projects/fetchProjects", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<{ data: Project[] }>("/projects");
    return response.data.data;
  } catch (err) {
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || "Error al cargar proyectos");
  }
});

export const fetchProjectById = createAsyncThunk<
  Project,
  string,
  { rejectValue: string }
>("projects/fetchProjectById", async (projectId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<{ data: Project }>(
      `/projects/${projectId}`
    );
    return response.data.data;
  } catch (err) {
    const error = err as AxiosError;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    return rejectWithValue(message || `Error al cargar proyecto ${projectId}`);
  }
});

export const createProject = createAsyncThunk<
  Project,
  ProjectFormData,
  { rejectValue: string; state: RootState }
>(
  "projects/createProject",
  async (projectData, { rejectWithValue, getState }) => {
    if (!getState().auth.user?.admin)
      return rejectWithValue("Acción no autorizada");
    try {
      const response = await axiosInstance.post<{ data: Project }>(
        "/projects",
        projectData
      );
      return response.data.data;
    } catch (err) {
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

export const updateProject = createAsyncThunk<
  Project,
  { projectId: string; projectData: Partial<ProjectFormData> },
  { rejectValue: string; state: RootState }
>(
  "projects/updateProject",
  async ({ projectId, projectData }, { rejectWithValue, getState }) => {
    const user = getState().auth.user;
    const project = getState().projects.currentProject;
    if (!user || (!user.admin && user.id !== project?.id_responsable)) {
      // return rejectWithValue('Acción no autorizada');
    }
    console.warn("Authorization check for update temporarily simplified.");
    try {
      const response = await axiosInstance.put<{ data: Project }>(
        `/projects/${projectId}`,
        projectData
      );
      return response.data.data;
    } catch (err) {
      const error = err as AxiosError;
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

export const deleteProject = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>(
  "projects/deleteProject",
  async (projectId, { rejectWithValue, getState }) => {
    if (!getState().auth.user?.admin)
      return rejectWithValue("Acción no autorizada");
    try {
      await axiosInstance.delete(`/projects/${projectId}`);
      return projectId;
    } catch (err) {
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
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.status = "idle";
      state.error = null;
    },
    clearProjectError: (state) => {
      state.error = null;
      if (state.status === "failed") state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(fetchProjectById.pending, (state) => {
        state.status = "loading";
        state.currentProject = null;
        state.error = null;
      })
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
        state.currentProject = null;
      })
      .addCase(createProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        createProject.fulfilled,
        (state, action: PayloadAction<Project>) => {
          state.status = "succeeded";
          state.projects.push(action.payload);
          state.error = null;
        }
      )
      .addCase(createProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateProject.fulfilled,
        (state, action: PayloadAction<Project>) => {
          if (!action.payload) return; // ✅ protección contra undefined
          state.status = "succeeded";
          const index = state.projects.findIndex(
            (p) => p.id === action.payload.id
          );
          if (index !== -1) {
            state.projects[index] = action.payload;
          }
          if (state.currentProject?.id === action.payload.id) {
            state.currentProject = action.payload;
          }
          state.error = null;
        }
      )
      .addCase(updateProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Error desconocido al actualizar proyecto.";
      })
      .addCase(deleteProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        deleteProject.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.status = "succeeded";
          state.projects = state.projects.filter(
            (p) => p.id !== parseInt(action.payload)
          );
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

export const selectAllProjects = (state: RootState) => state.projects.projects;
export const selectCurrentProject = (state: RootState) =>
  state.projects.currentProject;
export const selectProjectsStatus = (state: RootState) => state.projects.status;
export const selectProjectsError = (state: RootState) => state.projects.error;

export default projectSlice.reducer;
