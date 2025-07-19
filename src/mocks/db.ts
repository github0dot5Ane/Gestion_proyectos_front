// src/mocks/db.ts
import { User, Project, Task, ProjectFile, TaskFile } from "../types";

// --- Contadores de ID ---
let lastUserId = 0;
let lastProjectId = 0;
let lastTaskId = 0;
let lastProjectFileId = 0;
let lastTaskFileId = 0;

const getNextUserId = () => ++lastUserId;
const getNextProjectId = () => ++lastProjectId;
const getNextTaskId = () => ++lastTaskId;
const getNextProjectFileId = () => ++lastProjectFileId;
const getNextTaskFileId = () => ++lastTaskFileId;

// --- Datos de Usuarios (Seed inicial) ---
export let users: User[] = [];
export const userPasswords: { [email: string]: string } = {};

const seedUsers = () => {
  users = []; // Limpiar antes de sembrar
  Object.keys(userPasswords).forEach((email) => delete userPasswords[email]); // Limpiar passwords
  lastUserId = 0; // Resetear contador

  // --- CORRECCIÓN 1: No asignar a variables si no se usan aquí ---
  addUser(
    {
      nombre: "Admin User",
      email: "admin@test.com",
      telefono: "111111",
      estado: true,
      admin: true,
    },
    "password"
  );
  addUser(
    {
      nombre: "Project Manager User",
      email: "pm@test.com",
      telefono: "222222",
      estado: true,
      admin: false,
    },
    "password"
  );
  addUser(
    {
      nombre: "Task User",
      email: "task@test.com",
      telefono: "333333",
      estado: true,
      admin: false,
    },
    "password"
  );
  addUser(
    {
      nombre: "Inactive User",
      email: "inactive@test.com",
      telefono: "444444",
      estado: false,
      admin: false,
    },
    "password"
  );
};

// --- Datos de Proyectos (Seed inicial) ---
export let projects: Project[] = [];

const seedProjects = () => {
  projects = []; // Limpiar
  lastProjectId = 0; // Resetear

  const pmUser = findUserByEmail("pm@test.com");
  const adminUser = findUserByEmail("admin@test.com");

  if (pmUser) {
    addProject({
      titulo: "Proyecto Alpha",
      descripcion: "Descripción detallada del Proyecto Alpha.",
      fecha_inicio: "2024-05-01 00:00:00",
      fecha_finalizacion: "2024-08-31 00:00:00",
      id_responsable: pmUser.id,
    });
  }
  if (adminUser) {
    addProject({
      titulo: "Proyecto Beta (Sin Descripción)",
      descripcion: "",
      fecha_inicio: "2024-06-15 00:00:00",
      fecha_finalizacion: "2024-12-15 00:00:00",
      id_responsable: adminUser.id,
    });
  }
};

// --- Datos de Tareas (Seed inicial) ---
export let tasks: Task[] = [];

const seedTasks = () => {
  tasks = [];
  lastTaskId = 0;

  const projAlpha = projects[0]; // Asumiendo que existe
  const projBeta = projects[1]; // Asumiendo que existe
  const pmUser = findUserByEmail("pm@test.com");
  const taskUser = findUserByEmail("task@test.com");
  const adminUser = findUserByEmail("admin@test.com");

  if (projAlpha && pmUser && taskUser) {
    addTask({
      titulo: "Tarea 1 (Alpha)",
      descripcion: "Hacer cosa X",
      fecha_inicio: "2024-05-05",
      fecha_finalizacion: "2024-05-15",
      id_proyecto: projAlpha.id,
      id_usuario: pmUser.id,
      status: "Pendiente",
    });
    addTask({
      titulo: "Tarea 2 (Alpha)",
      descripcion: "Hacer cosa Y",
      fecha_inicio: "2024-05-16",
      fecha_finalizacion: "2024-05-30",
      id_proyecto: projAlpha.id,
      id_usuario: taskUser.id,
      status: "En Progreso",
    });
  }
  if (projBeta && adminUser && taskUser) {
    addTask({
      titulo: "Tarea 1 (Beta)",
      descripcion: "Configurar Z",
      fecha_inicio: "2024-06-20",
      fecha_finalizacion: "2024-06-30",
      id_proyecto: projBeta.id,
      id_usuario: adminUser.id,
      status: "Completada",
    });
    addTask({
      titulo: "Tarea 2 (Beta)",
      descripcion: "Revisar W",
      fecha_inicio: "2024-07-01",
      fecha_finalizacion: "2024-07-10",
      id_proyecto: projBeta.id,
      id_usuario: taskUser.id,
      status: "Pendiente",
    });
  }
};

// --- Datos de Archivos (Seed inicial) ---
export let projectFiles: ProjectFile[] = [];
export let taskFiles: TaskFile[] = [];

const seedFiles = () => {
  projectFiles = [];
  taskFiles = [];
  lastProjectFileId = 0;
  lastTaskFileId = 0;

  const projAlpha = projects[0];
  const task1Alpha = tasks.find((t) => t.titulo === "Tarea 1 (Alpha)");

  if (projAlpha) {
    addProjectFile({
      id_proyecto: projAlpha.id,
      nombre_original: "documento_alpha.pdf",
      nombre_archivo: `proj_${projAlpha.id}_file1.pdf`,
      ruta: `/uploads/projects/${projAlpha.id}/proj_${projAlpha.id}_file1.pdf`,
      tipo_archivo: "application/pdf",
      tamano: 102400,
    });
    addProjectFile({
      id_proyecto: projAlpha.id,
      nombre_original: "imagen_alpha.jpg",
      nombre_archivo: `proj_${projAlpha.id}_file2.jpg`,
      ruta: `/uploads/projects/${projAlpha.id}/proj_${projAlpha.id}_file2.jpg`,
      tipo_archivo: "image/jpeg",
      tamano: 51200,
    });
  }
  if (task1Alpha) {
    addTaskFile({
      id_tarea: task1Alpha.id,
      nombre_original: "detalle_tarea1.docx",
      nombre_archivo: `task_${task1Alpha.id}_file1.docx`,
      ruta: `/uploads/tasks/${task1Alpha.id}/task_${task1Alpha.id}_file1.docx`,
      tipo_archivo:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      tamano: 25600,
    });
  }
};

// --- Funciones Helper ---

// Usuarios
export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email);
}
export function findUserById(id: number): User | undefined {
  return users.find((u) => u.id === id);
}
export function addUser(
  userData: Omit<User, "id" | "created_at" | "updated_at">,
  password?: string
): User {
  const newUser: User = {
    ...userData,
    id: getNextUserId(),
    // --- CORRECCIÓN 2: Asegúrate que User en types/index.ts tenga created_at y updated_at ---
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(newUser);
  if (password) {
    userPasswords[newUser.email] = password;
  }
  return newUser;
}
export function updateUserInDb(
  id: number,
  data: Partial<Omit<User, "id" | "created_at" | "updated_at">>
): User | null {
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    // --- CORRECCIÓN 2: Asegúrate que User en types/index.ts tenga updated_at ---
    users[index] = {
      ...users[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return users[index];
  }
  return null;
}
export function deleteUserFromDb(id: number): boolean {
  const initialLength = users.length;
  users = users.filter((u) => u.id !== id);
  return users.length < initialLength;
}

// Proyectos (sin cambios necesarios aquí por los errores reportados)
export function findProjectById(id: number): Project | undefined {
  return projects.find((p) => p.id === id);
}
export function addProject(
  projectData: Omit<Project, "id" | "created_at" | "updated_at">
): Project {
  const newProject: Project = {
    ...projectData,
    id: getNextProjectId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  projects.push(newProject);
  return newProject;
}
export function updateProjectInDb(
  id: number,
  data: Partial<Omit<Project, "id" | "created_at" | "updated_at">>
): Project | null {
  const index = projects.findIndex((p) => p.id === id);
  if (index !== -1) {
    const updateData = { ...data };
    if (
      updateData.id_responsable &&
      typeof updateData.id_responsable === "string"
    ) {
      updateData.id_responsable = parseInt(updateData.id_responsable, 10);
    }
    projects[index] = {
      ...projects[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    return projects[index];
  }
  return null;
}
export function deleteProjectFromDb(id: number): boolean {
  const initialLength = projects.length;
  projects = projects.filter((p) => p.id !== id);
  return projects.length < initialLength;
}

// Tareas (sin cambios necesarios aquí por los errores reportados)
export function findTaskById(id: number): Task | undefined {
  return tasks.find((t) => t.id === id);
}
export function findTasksByProjectId(projectId: number): Task[] {
  return tasks.filter((t) => t.id_proyecto === projectId);
}
export function findTasksByUserId(userId: number): Task[] {
  return tasks.filter((t) => t.id_usuario === userId);
}
export function addTask(
  taskData: Omit<Task, "id" | "created_at" | "updated_at">
): Task {
  const newTask: Task = {
    ...taskData,
    id: getNextTaskId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  tasks.push(newTask);
  return newTask;
}
export function updateTaskInDb(
  id: number,
  data: Partial<Omit<Task, "id" | "created_at" | "updated_at">>
): Task | null {
  const index = tasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    const updateData = { ...data };
    if (updateData.id_usuario && typeof updateData.id_usuario === "string") {
      updateData.id_usuario = parseInt(updateData.id_usuario, 10);
    }
    if (updateData.id_proyecto && typeof updateData.id_proyecto === "string") {
      updateData.id_proyecto = parseInt(updateData.id_proyecto, 10);
    }
    tasks[index] = {
      ...tasks[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    return tasks[index];
  }
  return null;
}
export function deleteTaskFromDb(id: number): boolean {
  const initialLength = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  return tasks.length < initialLength;
}

// Archivos de Proyecto (sin cambios necesarios aquí por los errores reportados)
export function findProjectFileById(id: number): ProjectFile | undefined {
  return projectFiles.find((f) => f.id === id);
}
export function findProjectFilesByProjectId(projectId: number): ProjectFile[] {
  return projectFiles.filter((f) => f.id_proyecto === projectId);
}
export function addProjectFile(
  fileData: Omit<ProjectFile, "id" | "created_at">
): ProjectFile {
  const newFile: ProjectFile = {
    ...fileData,
    id: getNextProjectFileId(),
    created_at: new Date().toISOString(),
  };
  projectFiles.push(newFile);
  return newFile;
}
export function deleteProjectFileFromDb(id: number): boolean {
  const initialLength = projectFiles.length;
  projectFiles = projectFiles.filter((f) => f.id !== id);
  return projectFiles.length < initialLength;
}

// Archivos de Tarea (sin cambios necesarios aquí por los errores reportados)
export function findTaskFileById(id: number): TaskFile | undefined {
  return taskFiles.find((f) => f.id === id);
}
export function findTaskFilesByTaskId(taskId: number): TaskFile[] {
  return taskFiles.filter((f) => f.id_tarea === taskId);
}
export function addTaskFile(
  fileData: Omit<TaskFile, "id" | "created_at">
): TaskFile {
  const newFile: TaskFile = {
    ...fileData,
    id: getNextTaskFileId(),
    created_at: new Date().toISOString(),
  };
  taskFiles.push(newFile);
  return newFile;
}
export function deleteTaskFileFromDb(id: number): boolean {
  const initialLength = taskFiles.length;
  taskFiles = taskFiles.filter((f) => f.id !== id);
  return taskFiles.length < initialLength;
}

// --- Inicialización ---
seedUsers();
seedProjects();
seedTasks();
seedFiles();

console.log("[MSW DB] Mock database initialized.");
// Comentado para reducir ruido en consola, descomentar si necesitas debuggear
// console.log('[MSW DB] Users:', users);
// console.log('[MSW DB] Projects:', projects);
// console.log('[MSW DB] Tasks:', tasks);
// console.log('[MSW DB] Project Files:', projectFiles);
// console.log('[MSW DB] Task Files:', taskFiles);

// --- Exportar IDs (opcional, si handlers los necesitan) ---
export const getNextAvailableProjectId = getNextProjectId;
export const getNextAvailableUserId = getNextUserId;
export const getNextAvailableTaskId = getNextTaskId;
export const getNextAvailableProjectFileId = getNextProjectFileId;
export const getNextAvailableTaskFileId = getNextTaskFileId;
