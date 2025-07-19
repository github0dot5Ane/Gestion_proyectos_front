// src/api/fileService.ts
import { AxiosError } from "axios"; // Importar AxiosError
import axiosInstance from "./axios";
import { ProjectFile, TaskFile } from "../types";

// --- Funciones para Archivos de Proyecto ---

export const getProjectFiles = async (
  projectId: string
): Promise<ProjectFile[]> => {
  const response = await axiosInstance.get<{ data: ProjectFile[] }>(
    `/projects/${projectId}/files`
  );
  return response.data.data;
};

export const uploadProjectFiles = async (
  projectId: string,
  files: FileList
): Promise<ProjectFile[]> => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("archivos[]", files[i]); // 'archivos[]' debe coincidir con el backend (espera un array)
  }

  const response = await axiosInstance.post<{ data: ProjectFile[] }>(
    `/projects/${projectId}/files`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Opcional: para seguimiento de progreso (más avanzado)
      // onUploadProgress: progressEvent => { ... }
    }
  );
  return response.data.data; // Asume que devuelve los archivos creados
};

export const deleteProjectFile = async (
  projectId: string,
  fileId: number
): Promise<void> => {
  await axiosInstance.delete(`/projects/${projectId}/files/${fileId}`);
};

// La descarga necesita manejo especial para el Blob
export const downloadProjectFile = async (
  projectId: string,
  fileId: number,
  filename: string
): Promise<void> => {
  try {
    const response = await axiosInstance.get(
      `/projects/${projectId}/files/${fileId}/download`,
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    // err es 'unknown'
    console.error("Error al descargar archivo:", err);
    const error = err as AxiosError; // Aseguramos el tipo (puede fallar si no es AxiosError)

    // Intentamos leer el error si es un blob JSON
    if (
      error?.response?.data instanceof Blob &&
      error.response.data.type === "application/json"
    ) {
      try {
        // Leer el contenido del Blob como texto de forma asíncrona
        const blobText = await error.response.data.text();
        const errorData = JSON.parse(blobText);
        // Relanzar un error con el mensaje del backend
        throw new Error(
          errorData.message || "Error al descargar archivo (contenido en blob)"
        );
      } catch (parseError) {
        console.error("Error al parsear blob de error:", parseError);
        // Si falla el parseo, lanzar un error genérico
        throw new Error("Error al descargar archivo (blob no parseable)");
      }
    } else if (error?.message) {
      // Si no es un blob de error JSON, usar el mensaje de error general si existe
      throw new Error(error.message);
    } else {
      // Fallback si no se puede determinar el mensaje
      throw new Error("Error desconocido al descargar archivo");
    }
  }
};

// --- Funciones para Archivos de Tarea (análogas) ---

export const getTaskFiles = async (taskId: string): Promise<TaskFile[]> => {
  const response = await axiosInstance.get<{ data: TaskFile[] }>(
    `/tasks/${taskId}/files`
  );
  return response.data.data;
};

export const uploadTaskFiles = async (
  taskId: string,
  files: FileList
): Promise<TaskFile[]> => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("archivos[]", files[i]);
  }
  const response = await axiosInstance.post<{ data: TaskFile[] }>(
    `/tasks/${taskId}/files`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data.data;
};

export const deleteTaskFile = async (
  taskId: string,
  fileId: number
): Promise<void> => {
  await axiosInstance.delete(`/tasks/${taskId}/files/${fileId}`);
};

export const downloadTaskFile = async (
  taskId: string,
  fileId: number,
  filename: string
): Promise<void> => {
  try {
    const response = await axiosInstance.get(
      `/tasks/${taskId}/files/${fileId}/download`,
      {
        // Asumiendo endpoint
        responseType: "blob",
      }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al descargar archivo de tarea:", error);
    // ... (manejo de error blob similar a proyecto) ...
    throw new Error("Error al descargar archivo de tarea");
  }
};
