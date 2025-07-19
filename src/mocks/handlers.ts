// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import * as db from "./db"; // Importar nuestra 'base de datos' simulada
import {
  LoginCredentials,
  RegisterData,
  ProjectFormData,
  Task,
  TaskFormData,
  UserFormData,
  ProjectFile,
  TaskFile,
} from "../types"; // Tus tipos

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

console.log(`[MSW] Mocking API calls to: ${API_BASE_URL}`);

// Helper para simular latencia
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const LATENCY_MS = 300; // Simular 300ms de retraso

// Helper para obtener user ID del token mock
const getUserIdFromToken = (request: Request): number | null => {
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (token?.startsWith("mock-token-")) {
    const userId = parseInt(token.split("-")[2] || "0");
    return userId > 0 ? userId : null;
  }
  return null;
};

export const handlers = [
  // --- Handlers de Autenticación (existentes, revisados) ---
  http.post(`${API_BASE_URL}/login`, async ({ request }) => {
    await delay(LATENCY_MS);
    const { email, password } = (await request.json()) as LoginCredentials;
    const user = db.findUserByEmail(email);
    const expectedPassword = db.userPasswords[email];
    if (user && user.estado && password === expectedPassword) {
      const token = `mock-token-${user.id}-${Date.now()}`;
      return HttpResponse.json({ user, token });
    } else if (user && !user.estado) {
      return HttpResponse.json(
        { message: "Usuario deshabilitado." },
        { status: 401 }
      );
    } else {
      return HttpResponse.json(
        { message: "Credenciales incorrectas." },
        { status: 401 }
      );
    }
  }),

  http.post(`${API_BASE_URL}/register`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as RegisterData & { name?: string };
    const registerData = { ...body, nombre: body.name ?? body.nombre };
    if (db.findUserByEmail(registerData.email)) {
      return HttpResponse.json(
        {
          message: "Validation Error",
          errors: { email: ["El email ya está registrado."] },
        },
        { status: 422 }
      );
    }
    if (!registerData.password || registerData.password.length < 8) {
      return HttpResponse.json(
        {
          message: "Validation Error",
          errors: {
            password: ["La contraseña debe tener al menos 8 caracteres."],
          },
        },
        { status: 422 }
      );
    }
    const newUser = db.addUser(
      {
        nombre: registerData.nombre,
        email: registerData.email,
        telefono: registerData.telefono,
        estado: true,
        admin: false,
      },
      registerData.password
    );
    return HttpResponse.json({ user: newUser }, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/logout`, async () => {
    await delay(LATENCY_MS / 2);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE_URL}/user`, async ({ request }) => {
    await delay(LATENCY_MS / 2);
    const userId = getUserIdFromToken(request);
    if (userId) {
      const user = db.findUserById(userId);
      if (user) return HttpResponse.json(user);
    }
    return HttpResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }),

  // --- Handlers de Usuarios (Admin) ---
  http.get(`${API_BASE_URL}/users`, async ({ request }) => {
    await delay(LATENCY_MS);
    const userId = getUserIdFromToken(request); // Simular chequeo de admin
    const currentUser = userId ? db.findUserById(userId) : null;
    if (!currentUser?.admin) {
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return HttpResponse.json({ data: db.users });
  }),

  http.post(`${API_BASE_URL}/users`, async ({ request }) => {
    await delay(LATENCY_MS);
    const userId = getUserIdFromToken(request);
    const currentUser = userId ? db.findUserById(userId) : null;
    if (!currentUser?.admin)
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as UserFormData & { name?: string };
    const userData = { ...body, nombre: body.name ?? body.nombre };

    if (db.findUserByEmail(userData.email)) {
      return HttpResponse.json(
        {
          message: "Validation Error",
          errors: { email: ["El email ya existe."] },
        },
        { status: 422 }
      );
    }
    if (!userData.password || userData.password.length < 8) {
      return HttpResponse.json(
        {
          message: "Validation Error",
          errors: { password: ["La contraseña es requerida (mín 8 chars)."] },
        },
        { status: 422 }
      );
    }
    const newUser = db.addUser(
      {
        nombre: userData.nombre,
        email: userData.email,
        telefono: userData.telefono,
        estado: userData.estado,
        admin: userData.admin,
      },
      userData.password
    );
    return HttpResponse.json({ data: newUser }, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/users/:userId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const authUserId = getUserIdFromToken(request);
    const currentUser = authUserId ? db.findUserById(authUserId) : null;
    if (!currentUser?.admin)
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });

    const targetUserId = parseInt(params.userId as string);
    const body = (await request.json()) as Omit<
      Partial<UserFormData>,
      "password"
    > & { name?: string };
    const userData = { ...body, nombre: body.name ?? body.nombre };
    delete userData.name; // Limpiar si existe

    const userToUpdate = db.findUserById(targetUserId);
    if (!userToUpdate)
      return HttpResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );

    // Evitar que se actualice el email a uno existente (excepto el propio)
    if (
      userData.email &&
      userData.email !== userToUpdate.email &&
      db.findUserByEmail(userData.email)
    ) {
      return HttpResponse.json(
        {
          message: "Validation Error",
          errors: { email: ["El email ya está en uso."] },
        },
        { status: 422 }
      );
    }

    const updatedUser = db.updateUserInDb(targetUserId, userData);
    return HttpResponse.json({ data: updatedUser });
  }),

  http.delete(`${API_BASE_URL}/users/:userId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const authUserId = getUserIdFromToken(request);
    const currentUser = authUserId ? db.findUserById(authUserId) : null;
    if (!currentUser?.admin)
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });

    const targetUserId = parseInt(params.userId as string);
    if (targetUserId === authUserId)
      return HttpResponse.json(
        { message: "No puedes eliminarte a ti mismo" },
        { status: 403 }
      );

    const deleted = db.deleteUserFromDb(targetUserId);
    if (deleted) {
      return new HttpResponse(null, { status: 204 });
    } else {
      return HttpResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }
  }),

  // --- Handlers de Proyectos (existentes, revisados) ---
  http.get(`${API_BASE_URL}/projects`, async () => {
    await delay(LATENCY_MS);
    const projectsWithResponsable = db.projects.map((p) => ({
      ...p,
      responsable: db.findUserById(p.id_responsable),
    }));
    return HttpResponse.json({ data: projectsWithResponsable });
  }),

  http.get(`${API_BASE_URL}/projects/:projectId`, async ({ params }) => {
    await delay(LATENCY_MS / 2);
    const id = parseInt(params.projectId as string);
    const project = db.findProjectById(id);
    if (project) {
      const projectWithResponsable = {
        ...project,
        responsable: db.findUserById(project.id_responsable),
      };
      return HttpResponse.json({ data: projectWithResponsable });
    } else {
      return HttpResponse.json(
        { message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }
  }),

  http.post(`${API_BASE_URL}/projects`, async ({ request }) => {
    await delay(LATENCY_MS);
    // Simular chequeo de admin (podría ser más específico)
    const userId = getUserIdFromToken(request);
    const currentUser = userId ? db.findUserById(userId) : null;
    if (!currentUser?.admin)
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });

    const projectData = (await request.json()) as ProjectFormData;
    if (
      !projectData.titulo ||
      !projectData.id_responsable ||
      !projectData.fecha_inicio ||
      !projectData.fecha_finalizacion
    ) {
      return HttpResponse.json(
        { message: "Faltan campos requeridos" },
        { status: 422 }
      );
    }
    const newProject = db.addProject(projectData);
    const projectWithResponsable = {
      ...newProject,
      responsable: db.findUserById(newProject.id_responsable),
    };
    return HttpResponse.json({ data: projectWithResponsable }, { status: 201 });
  }),

  http.put(
    `${API_BASE_URL}/projects/:projectId`,
    async ({ request, params }) => {
      await delay(LATENCY_MS);
      // Simular chequeo de admin/rp
      const authUserId = getUserIdFromToken(request);
      const currentUser = authUserId ? db.findUserById(authUserId) : null;
      const id = parseInt(params.projectId as string);
      const project = db.findProjectById(id);
      if (!project)
        return HttpResponse.json(
          { message: "Proyecto no encontrado" },
          { status: 404 }
        );
      if (
        !currentUser ||
        (!currentUser.admin && currentUser.id !== project.id_responsable)
      ) {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const updateData = (await request.json()) as Partial<ProjectFormData>;
      const updatedProject = db.updateProjectInDb(id, updateData);
      if (updatedProject) {
        const projectWithResponsable = {
          ...updatedProject,
          responsable: db.findUserById(updatedProject.id_responsable),
        };
        return HttpResponse.json({ data: projectWithResponsable });
      } else {
        // Ya se chequeó antes, pero por si acaso
        return HttpResponse.json(
          { message: "Proyecto no encontrado" },
          { status: 404 }
        );
      }
    }
  ),

  http.delete(
    `${API_BASE_URL}/projects/:projectId`,
    async ({ request, params }) => {
      await delay(LATENCY_MS);
      // Simular chequeo de admin
      const userId = getUserIdFromToken(request);
      const currentUser = userId ? db.findUserById(userId) : null;
      if (!currentUser?.admin)
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });

      const id = parseInt(params.projectId as string);
      const deleted = db.deleteProjectFromDb(id);
      if (deleted) {
        return new HttpResponse(null, { status: 204 });
      } else {
        return HttpResponse.json(
          { message: "Proyecto no encontrado" },
          { status: 404 }
        );
      }
    }
  ),

  // --- Handlers de Tareas ---
  http.get(`${API_BASE_URL}/projects/:projectId/tasks`, async ({ params }) => {
    await delay(LATENCY_MS);
    const projectId = parseInt(params.projectId as string);
    const projectTasks = db.findTasksByProjectId(projectId).map((t) => ({
      ...t,
      usuario: db.findUserById(t.id_usuario), // Añadir info de usuario
      // proyecto: db.findProjectById(t.id_proyecto) // Podría añadirse si es necesario
    }));
    return HttpResponse.json({ data: projectTasks });
  }),

  http.get(`${API_BASE_URL}/tasks`, async ({ request }) => {
    await delay(LATENCY_MS);
    const url = new URL(request.url);
    const assignedTo = url.searchParams.get("assigned_to");
    let userTasks: Task[] = [];

    if (assignedTo === "me") {
      const userId = getUserIdFromToken(request);
      if (userId) {
        userTasks = db.findTasksByUserId(userId);
      } else {
        return HttpResponse.json(
          { message: "Unauthenticated for 'me'" },
          { status: 401 }
        );
      }
    } else if (assignedTo) {
      // Simular permiso de admin/rp para ver tareas de otros
      const authUserId = getUserIdFromToken(request);
      const currentUser = authUserId ? db.findUserById(authUserId) : null;
      // TODO: Añadir lógica de RP si es necesario
      if (!currentUser?.admin)
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      userTasks = db.findTasksByUserId(parseInt(assignedTo));
    } else {
      // GET /tasks sin filtros podría devolver todas (si es admin) o error
      const authUserId = getUserIdFromToken(request);
      const currentUser = authUserId ? db.findUserById(authUserId) : null;
      if (!currentUser?.admin)
        return HttpResponse.json(
          { message: "Forbidden to list all tasks" },
          { status: 403 }
        );
      userTasks = db.tasks; // Devolver todas si es admin
    }

    const tasksWithDetails = userTasks.map((t) => ({
      ...t,
      usuario: db.findUserById(t.id_usuario),
      proyecto: db.findProjectById(t.id_proyecto),
    }));
    return HttpResponse.json({ data: tasksWithDetails });
  }),

  http.post(`${API_BASE_URL}/tasks`, async ({ request }) => {
    await delay(LATENCY_MS);
    // Simular chequeo de admin/rp
    const authUserId = getUserIdFromToken(request);
    const currentUser = authUserId ? db.findUserById(authUserId) : null;
    const taskData = (await request.json()) as TaskFormData;
    const project = db.findProjectById(taskData.id_proyecto);
    if (!project)
      return HttpResponse.json(
        { message: "Proyecto no encontrado" },
        { status: 404 }
      );
    if (
      !currentUser ||
      (!currentUser.admin && currentUser.id !== project.id_responsable)
    ) {
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    // Validación simple
    if (
      !taskData.titulo ||
      !taskData.id_usuario ||
      !taskData.id_proyecto ||
      !taskData.status ||
      !taskData.fecha_inicio ||
      !taskData.fecha_finalizacion
    ) {
      return HttpResponse.json(
        { message: "Faltan campos requeridos" },
        { status: 422 }
      );
    }

    const newTask = db.addTask(taskData);
    const taskWithDetails = {
      ...newTask,
      usuario: db.findUserById(newTask.id_usuario),
      proyecto: db.findProjectById(newTask.id_proyecto),
    };
    return HttpResponse.json({ data: taskWithDetails }, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/tasks/:taskId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const taskId = parseInt(params.taskId as string);
    const task = db.findTaskById(taskId);
    if (!task)
      return HttpResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 }
      );

    // Simular permisos (Admin, RP, o Asignado para cambiar SOLO status)
    const authUserId = getUserIdFromToken(request);
    const currentUser = authUserId ? db.findUserById(authUserId) : null;
    const project = db.findProjectById(task.id_proyecto);
    const updateData = (await request.json()) as Partial<TaskFormData>;

    const canEditAll =
      !!currentUser &&
      project &&
      (currentUser.admin || currentUser.id === project.id_responsable);
    const canEditStatus =
      canEditAll || (!!currentUser && currentUser.id === task.id_usuario);

    // Si solo se quiere cambiar status y no tiene permiso total, verificar permiso de status
    if (
      Object.keys(updateData).length === 1 &&
      updateData.status &&
      !canEditAll &&
      !canEditStatus
    ) {
      return HttpResponse.json(
        { message: "Forbidden to change status" },
        { status: 403 }
      );
    }
    // Si quiere cambiar más que el status y no tiene permiso total
    if (
      (Object.keys(updateData).length > 1 || !updateData.status) &&
      !canEditAll
    ) {
      return HttpResponse.json(
        { message: "Forbidden to edit task details" },
        { status: 403 }
      );
    }
    // Si tiene algún permiso, proceder (backend haría la validación final)
    if (!canEditStatus && !canEditAll) {
      // Doble chequeo por si acaso
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedTask = db.updateTaskInDb(taskId, updateData);
    if (updatedTask) {
      const taskWithDetails = {
        ...updatedTask,
        usuario: db.findUserById(updatedTask.id_usuario),
        proyecto: db.findProjectById(updatedTask.id_proyecto),
      };
      return HttpResponse.json({ data: taskWithDetails });
    } else {
      return HttpResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 }
      ); // Aunque ya chequeamos antes
    }
  }),

  http.delete(`${API_BASE_URL}/tasks/:taskId`, async ({ request, params }) => {
    await delay(LATENCY_MS);
    const taskId = parseInt(params.taskId as string);
    const task = db.findTaskById(taskId);
    if (!task)
      return HttpResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 }
      );

    // Simular chequeo de admin/rp
    const authUserId = getUserIdFromToken(request);
    const currentUser = authUserId ? db.findUserById(authUserId) : null;
    const project = db.findProjectById(task.id_proyecto);
    if (
      !currentUser ||
      !project ||
      (!currentUser.admin && currentUser.id !== project.id_responsable)
    ) {
      return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const deleted = db.deleteTaskFromDb(taskId);
    if (deleted) {
      return new HttpResponse(null, { status: 204 });
    } else {
      return HttpResponse.json(
        { message: "Tarea no encontrada" },
        { status: 404 }
      );
    }
  }),

  // --- Handlers de Archivos de Proyecto ---
  http.get(`${API_BASE_URL}/projects/:projectId/files`, async ({ params }) => {
    await delay(LATENCY_MS / 2);
    const projectId = parseInt(params.projectId as string);
    const files = db.findProjectFilesByProjectId(projectId);
    return HttpResponse.json({ data: files });
  }),

  http.post(
    `${API_BASE_URL}/projects/:projectId/files`,
    async ({ request, params }) => {
      await delay(LATENCY_MS * 1.5); // Simular subida más lenta
      const projectId = parseInt(params.projectId as string);
      // Simular chequeo de permiso (Admin/RP) - Asumimos que tiene permiso por simplicidad aquí
      const formData = await request.formData();
      const files = formData.getAll("archivos[]") as File[]; // 'archivos[]' debe coincidir

      const addedFiles: ProjectFile[] = [];
      for (const file of files) {
        // Simular guardado
        const newFile = db.addProjectFile({
          id_proyecto: projectId,
          nombre_original: file.name,
          nombre_archivo: `proj_${projectId}_file_${Date.now()}_${file.name}`,
          ruta: `/uploads/projects/${projectId}/proj_${projectId}_file_${Date.now()}_${
            file.name
          }`,
          tipo_archivo: file.type,
          tamano: file.size,
        });
        addedFiles.push(newFile);
      }
      return HttpResponse.json({ data: addedFiles }, { status: 201 });
    }
  ),

  http.delete(
    `${API_BASE_URL}/projects/:projectId/files/:fileId`,
    async ({ params }) => {
      await delay(LATENCY_MS);
      // Simular chequeo de permiso (Admin/RP)
      const fileId = parseInt(params.fileId as string);
      const deleted = db.deleteProjectFileFromDb(fileId);
      if (deleted) {
        return new HttpResponse(null, { status: 204 });
      } else {
        return HttpResponse.json(
          { message: "Archivo no encontrado" },
          { status: 404 }
        );
      }
    }
  ),

  http.get(
    `${API_BASE_URL}/projects/:projectId/files/:fileId/download`,
    async ({ params }) => {
      await delay(LATENCY_MS);
      const fileId = parseInt(params.fileId as string);
      const fileInfo = db.findProjectFileById(fileId);
      if (fileInfo) {
        // Simular contenido de archivo
        const blob = new Blob(
          [`Contenido simulado para: ${fileInfo.nombre_original}`],
          { type: fileInfo.tipo_archivo }
        );
        return new HttpResponse(blob, {
          status: 200,
          headers: {
            "Content-Type": fileInfo.tipo_archivo,
            // Opcional, el frontend lo setea con el nombre original
            // 'Content-Disposition': `attachment; filename="${fileInfo.nombre_original}"`
          },
        });
      } else {
        return HttpResponse.json(
          { message: "Archivo no encontrado" },
          { status: 404 }
        );
      }
    }
  ),

  // --- Handlers de Archivos de Tarea ---
  http.get(`${API_BASE_URL}/tasks/:taskId/files`, async ({ params }) => {
    await delay(LATENCY_MS / 2);
    const taskId = parseInt(params.taskId as string);
    const files = db.findTaskFilesByTaskId(taskId);
    return HttpResponse.json({ data: files });
  }),

  http.post(
    `${API_BASE_URL}/tasks/:taskId/files`,
    async ({ request, params }) => {
      await delay(LATENCY_MS * 1.5);
      const taskId = parseInt(params.taskId as string);
      // Simular chequeo de permiso (Admin/RP/Asignado)
      const formData = await request.formData();
      const files = formData.getAll("archivos[]") as File[];

      const addedFiles: TaskFile[] = [];
      for (const file of files) {
        const newFile = db.addTaskFile({
          id_tarea: taskId,
          nombre_original: file.name,
          nombre_archivo: `task_${taskId}_file_${Date.now()}_${file.name}`,
          ruta: `/uploads/tasks/${taskId}/task_${taskId}_file_${Date.now()}_${
            file.name
          }`,
          tipo_archivo: file.type,
          tamano: file.size,
        });
        addedFiles.push(newFile);
      }
      return HttpResponse.json({ data: addedFiles }, { status: 201 });
    }
  ),

  http.delete(
    `${API_BASE_URL}/tasks/:taskId/files/:fileId`,
    async ({ params }) => {
      await delay(LATENCY_MS);
      // Simular chequeo de permiso (Admin/RP/Asignado)
      const fileId = parseInt(params.fileId as string);
      const deleted = db.deleteTaskFileFromDb(fileId);
      if (deleted) {
        return new HttpResponse(null, { status: 204 });
      } else {
        return HttpResponse.json(
          { message: "Archivo no encontrado" },
          { status: 404 }
        );
      }
    }
  ),

  http.get(
    `${API_BASE_URL}/tasks/:taskId/files/:fileId/download`,
    async ({ params }) => {
      await delay(LATENCY_MS);
      const fileId = parseInt(params.fileId as string);
      const fileInfo = db.findTaskFileById(fileId);
      if (fileInfo) {
        const blob = new Blob(
          [`Contenido tarea simulado para: ${fileInfo.nombre_original}`],
          { type: fileInfo.tipo_archivo }
        );
        return new HttpResponse(blob, {
          status: 200,
          headers: { "Content-Type": fileInfo.tipo_archivo },
        });
      } else {
        return HttpResponse.json(
          { message: "Archivo no encontrado" },
          { status: 404 }
        );
      }
    }
  ),
]; // Fin del array de handlers
