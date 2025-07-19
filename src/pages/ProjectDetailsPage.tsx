// src/pages/ProjectDetailsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store';
import { fetchProjectById, selectCurrentProject, selectProjectsStatus, selectProjectsError, clearCurrentProject, updateProject, deleteProject } from '../features/projects/projectSlice';
import { selectIsAdmin, selectCurrentUser } from '../features/auth/authSlice';
import { ProjectFormData } from '../types';
import ProjectForm from '../components/projects/ProjectForm'; // Reutilizamos el formulario

import { fetchTasks, createTask, clearTasks, selectAllTasks, selectTasksStatus, selectTasksError } from '../features/tasks/taskSlice'; // Importar acciones y selectores de tareas
import TaskList from '../components/tasks/TaskList'; // Importar componente de lista
import TaskForm from '../components/tasks/TaskForm'; // Importar formulario de tareas
import { TaskFormData } from '../types'; // Importar tipo

import { getProjectFiles, uploadProjectFiles, deleteProjectFile, downloadProjectFile } from '../api/fileService'; // Importar servicios de archivos
import FileUpload from '../components/common/FileUpload'; // Importar componente de subida
import FileList from '../components/common/FileList';   // Importar componente de lista
import { ProjectFile } from '../types';

const ProjectDetailsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    const project = useSelector(selectCurrentProject);
    const status = useSelector(selectProjectsStatus);
    const error = useSelector(selectProjectsError);
    const isAdmin = useSelector(selectIsAdmin);
    const currentUser = useSelector(selectCurrentUser);

    const [isEditing, setIsEditing] = useState(false); // Para mostrar/ocultar form de edición
    const [isDeleting, setIsDeleting] = useState(false); // Estado de eliminación específico

    const tasks = useSelector(selectAllTasks);
    const tasksStatus = useSelector(selectTasksStatus);
    const tasksError = useSelector(selectTasksError);

    const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);

    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState<string | null>(null);

    // Cargar detalles del proyecto al montar o si cambia el ID
    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId));
        }
        // Limpiar el proyecto actual al desmontar
        return () => {
            dispatch(clearCurrentProject());
        };
    }, [projectId, dispatch]);


    // Determinar si el usuario actual puede editar (Admin o RP del proyecto)
    const canEdit = project && currentUser && (isAdmin || currentUser.id === project.id_responsable);
    // Determinar si el usuario actual puede eliminar (Admin)
    const canDelete = isAdmin;

    const handleUpdateProject = (formData: ProjectFormData) => {
        if (!projectId) return;
        dispatch(updateProject({ projectId, projectData: formData }))
            .unwrap()
            .then(() => {
                setIsEditing(false); // Ocultar formulario al éxito
                // No es necesario fetchProjectById de nuevo, el slice ya se actualizó
            })
            .catch((err) => {
                console.error("Failed to update project:", err);
                // El error se muestra en el ProjectForm
            });
    };

    const handleDeleteProject = () => {
        if (!projectId || !canDelete) return;
        if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción es irreversible.')) {
            setIsDeleting(true);
            dispatch(deleteProject(projectId))
                .unwrap()
                .then(() => {
                    navigate('/projects'); // Redirigir a la lista después de eliminar
                })
                .catch((err) => {
                    console.error("Failed to delete project:", err);
                    alert(`Error al eliminar: ${err}`); // Mostrar alerta si falla
                })
                .finally(() => setIsDeleting(false));
        }
    };

    // Cargar detalles del proyecto Y tareas del proyecto
    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId));
            dispatch(fetchTasks({ projectId })); // Cargar tareas de este proyecto
        }
        // Limpiar proyecto y tareas al desmontar
        return () => {
            dispatch(clearCurrentProject());
            dispatch(clearTasks()); // Limpiar lista de tareas
        };
    }, [projectId, dispatch]);

    // Permisos para añadir tarea (Admin o RP)
    const canAddTask = project && currentUser && (isAdmin || currentUser.id === project.id_responsable);

    const handleCreateTask = (formData: TaskFormData) => {
        dispatch(createTask(formData))
            .unwrap()
            .then(() => {
                setShowCreateTaskForm(false); // Cerrar modal/form
                // No es necesario refetch, el slice añade la tarea
            })
            .catch((err) => {
                console.error("Failed to create task:", err);
                // El error se muestra en TaskForm
            });
    };

    // Permisos para archivos de proyecto (Admin o RP)
    const canManageProjectFiles = project && currentUser && (isAdmin || currentUser.id === project.id_responsable);

    // Cargar archivos del proyecto
    const loadProjectFiles = useCallback(async () => {
        if (!projectId) return;
        setFilesLoading(true);
        setFilesError(null);
        try {
            const files = await getProjectFiles(projectId);
            setProjectFiles(files);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setFilesError(error.message || 'Error al cargar archivos del proyecto');
            } else if (typeof error === 'string') {
                setFilesError(error || 'Error al cargar archivos del proyecto');
            }
        } finally {
            setFilesLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            // ... (cargas existentes de proyecto y tareas) ...
            loadProjectFiles(); // Cargar archivos al montar/cambiar ID
        }
        // ... (limpieza existente) ...
    }, [projectId, dispatch, loadProjectFiles]); // Añadir loadProjectFiles a dependencias

    // --- Handlers para archivos de proyecto ---
    const handleUploadProjectFiles = async (files: FileList) => {
        if (!projectId || !canManageProjectFiles) return;
        try {
            // Llama al servicio API
            await uploadProjectFiles(projectId, files);
            // Refrescar la lista de archivos después de subir
            loadProjectFiles();
            // Nota: FileUpload muestra su propio mensaje de éxito/error interno
        } catch (error: unknown) {
            console.error("Upload failed in page:", error);
            // Lanzar error para que FileUpload lo capture si es necesario o mostrar aquí
            throw error;
        }
    };

    const handleDeleteProjectFile = async (fileId: number) => {
        if (!projectId || !canManageProjectFiles) return;
        try {
            await deleteProjectFile(projectId, fileId);
            // Refrescar lista localmente o volver a cargar
            setProjectFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
        } catch (error: unknown) {
            console.error("Delete failed in page:", error);
            throw error; // Relanzar para que FileList lo pueda manejar si quiere
        }
    };

    const handleDownloadProjectFile = async (fileId: number, filename: string) => {
        if (!projectId) return;
        try {
            await downloadProjectFile(projectId, fileId, filename);
        } catch (error: unknown) {
            console.error("Download failed in page:", error);
            throw error; // Relanzar para FileList
        }
    };

    if (status === 'loading' && !project) { // Muestra carga solo si no hay datos previos
        return <div className="text-center p-10">Cargando detalles del proyecto...</div>;
    }

    if (status === 'failed') {
        return <div className="text-center p-10 text-red-600">Error al cargar el proyecto: {error}</div>;
    }

    if (!project) {
        // Si status no es loading y no hay proyecto, probablemente no se encontró
        return <div className="text-center p-10 text-gray-500">Proyecto no encontrado. <Link to="/projects" className='text-indigo-600'>Volver a la lista</Link></div>;
    }


    return (
        <div>
            {/* Modo Edición */}
            {isEditing ? (
                <div className='mb-6 p-4 border rounded shadow-sm bg-white'>
                    <h2 className="text-2xl font-semibold mb-4">Editando Proyecto: {project.titulo}</h2>
                    <ProjectForm
                        project={project}
                        onSubmit={handleUpdateProject}
                        onCancel={() => setIsEditing(false)}
                        isLoading={status === 'loading'} // Usar status general
                    />
                </div>
            ) : (
                /* Modo Vista Detalles */
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl leading-6 font-medium text-gray-900">
                                {project.titulo}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                {project.descripcion || 'Sin descripción detallada.'}
                            </p>
                        </div>
                        <div className='flex space-x-2'>
                            {canEdit && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
                                >
                                    Editar
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={handleDeleteProject}
                                    disabled={isDeleting}
                                    className="text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded disabled:opacity-50"
                                >
                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Responsable</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {project.responsable?.nombre ?? `ID: ${project.id_responsable}`} {/* Muestra nombre si la API lo incluye */}
                                </dd>
                            </div>
                            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Fecha Inicio</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(project.fecha_inicio).toLocaleDateString()}
                                </dd>
                            </div>
                            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Fecha Fin</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(project.fecha_finalizacion).toLocaleDateString()}
                                </dd>
                            </div>
                            {/* Añadir más detalles si es necesario */}
                        </dl>
                    </div>
                </div>
            )}

            {/* --- Secciones Futuras para Tareas y Archivos --- */}
            {/* --- Sección de Tareas --- */}
            {!isEditing && project && ( // Mostrar solo si no estamos editando el proyecto
                <>
                    {/* Modal o Sección para el Formulario de Creación de Tarea */}
                    {showCreateTaskForm && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-10">
                            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">Crear Nueva Tarea</h3>
                                    <button onClick={() => setShowCreateTaskForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                                </div>
                                <TaskForm
                                    projectId={project.id} // Pasar ID del proyecto actual
                                    onSubmit={handleCreateTask}
                                    onCancel={() => setShowCreateTaskForm(false)}
                                    isLoading={tasksStatus === 'loading'} // Estado de carga de tareas
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-semibold">Tareas del Proyecto</h4>
                            {canAddTask && ( // Botón solo para Admin/RP
                                <button
                                    onClick={() => setShowCreateTaskForm(true)}
                                    className="bg-teal-500 hover:bg-teal-600 text-white py-1 px-3 rounded-md text-sm"
                                >
                                    + Añadir Tarea
                                </button>
                            )}
                        </div>
                        {/* Renderizar la lista de tareas */}
                        <TaskList
                            tasks={tasks}
                            isLoading={tasksStatus === 'loading'}
                            error={tasksError}
                        />
                    </div>

                    {!isEditing && project && (
                        <div className="mt-8">
                            <h4 className="text-xl font-semibold mb-4">Archivos del Proyecto</h4>
                            {/* Componente de Subida */}
                            {canManageProjectFiles && ( // Mostrar solo si tiene permiso
                                <div className='mb-4'>
                                    <FileUpload
                                        onUpload={handleUploadProjectFiles}
                                        disabled={filesLoading} // Deshabilitar si la lista está cargando
                                    />
                                </div>
                            )}

                            {/* Componente de Lista */}
                            <FileList
                                files={projectFiles}
                                onDownload={handleDownloadProjectFile}
                                onDelete={handleDeleteProjectFile}
                                canDelete={() => canManageProjectFiles ?? false} // Solo Admin/RP pueden borrar
                                isLoading={filesLoading}
                                error={filesError}
                            />
                        </div>
                    )}
                </>
            )}

            <div className="mt-6">
                <Link to="/projects" className="text-indigo-600 hover:text-indigo-800 text-sm">
                    ← Volver a la lista de proyectos
                </Link>
            </div>
        </div>
    );
};

export default ProjectDetailsPage;