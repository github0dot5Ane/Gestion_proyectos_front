// src/pages/ProjectDetailsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store';
import { fetchProjectById, selectCurrentProject, selectProjectsStatus, selectProjectsError, clearCurrentProject, updateProject, deleteProject } from '../features/projects/projectSlice';
import { selectIsAdmin, selectCurrentUser } from '../features/auth/authSlice';
import { ProjectFormData } from '../types';
import ProjectForm from '../components/projects/ProjectForm';
import { fetchTasks, createTask, clearTasks, selectAllTasks, selectTasksStatus, selectTasksError } from '../features/tasks/taskSlice';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import { TaskFormData } from '../types';
import { getProjectFiles, uploadProjectFiles, deleteProjectFile, downloadProjectFile } from '../api/fileService';
import FileUpload from '../components/common/FileUpload';
import FileList from '../components/common/FileList';
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

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const tasks = useSelector(selectAllTasks);
    const tasksStatus = useSelector(selectTasksStatus);
    const tasksError = useSelector(selectTasksError);

    const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);

    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState<string | null>(null);

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId));
        }
        return () => {
            dispatch(clearCurrentProject());
        };
    }, [projectId, dispatch]);

    const canEdit = project && currentUser && (isAdmin || currentUser.id === project.id_responsable);
    const canDelete = isAdmin;

    const handleUpdateProject = (formData: ProjectFormData) => {
        if (!projectId) return;
        dispatch(updateProject({ projectId, projectData: formData }))
            .unwrap()
            .then(() => setIsEditing(false))
            .catch((err) => console.error("Failed to update project:", err));
    };

    const handleDeleteProject = () => {
        if (!projectId || !canDelete) return;
        if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción es irreversible.')) {
            setIsDeleting(true);
            dispatch(deleteProject(projectId))
                .unwrap()
                .then(() => navigate('/projects'))
                .catch((err) => alert(`Error al eliminar: ${err}`))
                .finally(() => setIsDeleting(false));
        }
    };

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId));
            dispatch(fetchTasks({ projectId }));
        }
        return () => {
            dispatch(clearCurrentProject());
            dispatch(clearTasks());
        };
    }, [projectId, dispatch]);

    const canAddTask = project && currentUser && (isAdmin || currentUser.id === project.id_responsable);

    const handleCreateTask = (formData: TaskFormData) => {
        dispatch(createTask(formData))
            .unwrap()
            .then(() => setShowCreateTaskForm(false))
            .catch((err) => console.error("Failed to create task:", err));
    };

    const canManageProjectFiles = project && currentUser && (isAdmin || currentUser.id === project.id_responsable);

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
            loadProjectFiles();
        }
    }, [projectId, dispatch, loadProjectFiles]);

    const handleUploadProjectFiles = async (files: FileList) => {
        if (!projectId || !canManageProjectFiles) return;
        try {
            await uploadProjectFiles(projectId, files);
            loadProjectFiles();
        } catch (error: unknown) {
            console.error("Upload failed in page:", error);
            throw error;
        }
    };

    const handleDeleteProjectFile = async (fileId: number) => {
        if (!projectId || !canManageProjectFiles) return;
        try {
            await deleteProjectFile(projectId, fileId);
            setProjectFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
        } catch (error: unknown) {
            console.error("Delete failed in page:", error);
            throw error;
        }
    };

    const handleDownloadProjectFile = async (fileId: number, filename: string) => {
        if (!projectId) return;
        try {
            await downloadProjectFile(projectId, fileId, filename);
        } catch (error: unknown) {
            console.error("Download failed in page:", error);
            throw error;
        }
    };

    if (status === 'loading' && !project) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error al cargar el proyecto</h3>
                            <div className="mt-2 text-sm text-red-700">
                                {error}
                            </div>
                        </div>
                    </div>
                </div>
                <Link to="/projects" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Volver a la lista de proyectos
                </Link>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Proyecto no encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">El proyecto que buscas no existe o no tienes permisos para verlo.</p>
                <div className="mt-6">
                    <Link to="/projects" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Volver a la lista de proyectos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Modo Edición */}
            {isEditing ? (
                <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Editando Proyecto: {project.titulo}</h2>
                    </div>
                    <div className="px-6 py-4">
                        <ProjectForm
                            project={project}
                            onSubmit={handleUpdateProject}
                            onCancel={() => setIsEditing(false)}
                            isLoading={status === 'loading'}
                        />
                    </div>
                </div>
            ) : (
                /* Modo Vista Detalles */
                <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
                    <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {project.titulo}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                {project.descripcion || 'Sin descripción detallada.'}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            {canEdit && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    Editar
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={handleDeleteProject}
                                    disabled={isDeleting}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Responsable</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {project.responsable?.nombre ?? `ID: ${project.id_responsable}`}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Fecha Inicio</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(project.fecha_inicio).toLocaleDateString()}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Fecha Fin</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(project.fecha_finalizacion).toLocaleDateString()}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}

            {/* Sección de Tareas */}
            {!isEditing && project && (
                <>
                    {showCreateTaskForm && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-10">
                            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-900"></h3>
                                    <button 
                                        onClick={() => setShowCreateTaskForm(false)} 
                                        className="text-gray-400 hover:text-gray-500 text-2xl focus:outline-none"
                                    >
                                        &times;
                                    </button>
                                </div>
                                <TaskForm
                                    projectId={project.id}
                                    onSubmit={handleCreateTask}
                                    onCancel={() => setShowCreateTaskForm(false)}
                                    isLoading={tasksStatus === 'loading'}
                                />
                            </div>
                        </div>
                    )}

                    <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="text-xl font-bold text-gray-900">Tareas del Proyecto</h4>
                            {canAddTask && (
                                <button
                                    onClick={() => setShowCreateTaskForm(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                >
                                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Añadir Tarea
                                </button>
                            )}
                        </div>
                        <div className="px-6 py-4">
                            <TaskList
                                tasks={tasks}
                                isLoading={tasksStatus === 'loading'}
                                error={tasksError}
                            />
                        </div>
                    </div>

                    {/* Sección de Archivos */}
                    <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h4 className="text-xl font-bold text-gray-900">Archivos del Proyecto</h4>
                        </div>
                        <div className="px-6 py-4">
                            {canManageProjectFiles && (
                                <div className='mb-6'>
                                    <FileUpload
                                        onUpload={handleUploadProjectFiles}
                                        disabled={filesLoading}
                                    />
                                </div>
                            )}
                            <FileList
                                files={projectFiles}
                                onDownload={handleDownloadProjectFile}
                                onDelete={handleDeleteProjectFile}
                                canDelete={() => canManageProjectFiles ?? false}
                                isLoading={filesLoading}
                                error={filesError}
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="mt-6">
                <Link 
                    to="/projects" 
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium"
                >
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Volver a la lista de proyectos
                </Link>
            </div>
        </div>
    );
};

export default ProjectDetailsPage;