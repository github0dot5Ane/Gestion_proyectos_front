// src/types/index.ts

export interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  estado: boolean;
  admin: boolean;
  created_at?: string; // <-- Asegúrate que esta línea exista y sea opcional (?)
  updated_at?: string; // <-- Asegúrate que esta línea exista y sea opcional (?)
}

export interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed"; // Para seguir el estado de las llamadas async
  error: string | null | undefined; // Para mensajes de error
}

// src/types/index.ts
// ... (mantener tipos User y AuthState) ...

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  nombre: string; // Coincide con 'name' que espera Laravel por defecto
  telefono?: string;
  // La contraseña se envía, pero necesitaremos 'password_confirmation' en el backend
}

// Tipo esperado de la respuesta de /api/login (ajustar según tu API)
export interface LoginResponse {
  user: User;
  token: string; // Asumiendo que Laravel Sanctum devuelve un token
}

// Tipo esperado de la respuesta de /api/register (ajustar según tu API)
// Puede que solo devuelva el usuario creado o un mensaje de éxito
export interface RegisterResponse {
  user: User; // O un mensaje: message: string;
  // No suele devolver token directamente en el registro
}

// src/types/index.ts
// ... (mantener User, AuthState, LoginCredentials, etc.) ...

export interface Project {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string; // Usar string para simplicidad, se puede parsear a Date si es necesario
  fecha_finalizacion: string;
  id_responsable: number; // ID del usuario responsable
  responsable?: User; // Opcional: Incluir el objeto User si la API lo devuelve anidado
  created_at?: string;
  updated_at?: string;
  // Podríamos añadir tareas y archivos aquí más adelante
  // tasks?: Task[];
  // files?: ProjectFile[];
}

// Para el formulario, podríamos necesitar un tipo específico
// Omitimos 'id' y 'responsable' (objeto), usamos 'id_responsable'
export type ProjectFormData = Omit<
  Project,
  "id" | "responsable" | "created_at" | "updated_at"
>;

// Estado para el slice de proyectos
export interface ProjectState {
  projects: Project[]; // Lista de todos los proyectos cargados
  currentProject: Project | null; // El proyecto que se está viendo/editando
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | undefined;
}

// Estado mínimo para el slice de usuarios (solo para obtener lista)
export interface UserState {
  users: User[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | undefined;
}

// src/types/index.ts
// ... (mantener User, AuthState, Project, etc.) ...

// Definir los posibles estados de una tarea
// Asegúrate que estos valores coincidan con lo que usará tu backend/enum
export type TaskStatus =
  | "Pendiente"
  | "En Progreso"
  | "Completada"
  | "Bloqueada";

export interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string; // Formato YYYY-MM-DD HH:MM:SS (o solo YYYY-MM-DD)
  fecha_finalizacion: string;
  id_proyecto: number; // FK a Proyecto
  id_usuario: number; // FK a Usuario (asignado)
  status: TaskStatus; // Estado de la tarea (¡Añadido!)
  proyecto?: Project; // Opcional: Si la API devuelve el proyecto anidado
  usuario?: User; // Opcional: Si la API devuelve el usuario asignado anidado
  created_at?: string;
  updated_at?: string;
  // Podríamos añadir archivos aquí más adelante
  // files?: TaskFile[];
}

// Para el formulario de tareas
export type TaskFormData = Omit<
  Task,
  "id" | "proyecto" | "usuario" | "created_at" | "updated_at"
>;

// Estado para el slice de tareas
export interface TaskState {
  tasks: Task[]; // Tareas cargadas (podrían ser de un proyecto o de un usuario)
  currentTask: Task | null; // Tarea seleccionada
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | undefined;
}

// src/types/index.ts
// ... (mantener tipos existentes) ...

// Interfaz base para archivos
interface BaseFile {
  id: number;
  nombre_original: string; // Nombre del archivo subido por el usuario
  nombre_archivo: string; // Nombre del archivo guardado en el servidor (puede ser diferente)
  ruta: string; // Ruta relativa o URL completa para acceder/descargar
  tipo_archivo: string; // MIME type (e.g., 'application/pdf', 'image/jpeg')
  tamano?: number; // Tamaño en bytes (opcional)
  created_at?: string;
  // Podríamos añadir el usuario que lo subió si es necesario
  // id_usuario_subida?: number;
  // usuario_subida?: User;
}

export interface ProjectFile extends BaseFile {
  id_proyecto: number;
}

export interface TaskFile extends BaseFile {
  id_tarea: number;
}

// Añadir listas de archivos opcionales a Project y Task si queremos cargarlos juntos
// export interface Project { ...; files?: ProjectFile[] }
// export interface Task { ...; files?: TaskFile[] }
// Por ahora, las cargaremos por separado.

// src/types/index.ts - Confirmar estructura existente

export interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  estado: boolean; // true = habilitado, false = deshabilitado
  admin: boolean; // true = es administrador, false = no lo es
  created_at?: string; // Podría ser útil mostrar fecha de registro
  // password?: string; // ¡NO almacenar ni exponer la contraseña en el estado!
}

// Datos para crear/actualizar usuario (sin ID, sin password para update)
// Para crear, la API requerirá 'password'. Para update, NO enviaremos password.
export type UserFormData = Omit<User, "id" | "created_at"> & {
  password?: string;
}; // Password opcional aquí, requerido en la llamada API de creación.

export interface UserState {
  users: User[]; // Lista de usuarios gestionados
  currentUserForEdit: User | null; // Usuario seleccionado para editar
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null | undefined;
}
