import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch } from '../app/store';
import {
    fetchProjects,
    deleteProject,
    selectAllProjects,
    selectProjectsStatus,
    selectProjectsError,
    clearProjectError,
    createProject
} from '../features/projects/projectSlice';
import { selectIsAdmin } from '../features/auth/authSlice';
import { Project, ProjectFormData } from '../types';
import ProjectForm from '../components/projects/ProjectForm';

const ProjectListPage: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const projects = useSelector(selectAllProjects);
    const status = useSelector(selectProjectsStatus);
    const error = useSelector(selectProjectsError);
    const isAdmin = useSelector(selectIsAdmin);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProjects());
        }
        dispatch(clearProjectError());
    }, [status, dispatch]);

    const handleDelete = (projectId: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
            setDeletingId(projectId);
            dispatch(deleteProject(String(projectId)))
                .unwrap()
                .catch((err) => console.error("Failed to delete project:", err))
                .finally(() => setDeletingId(null));
        }
    };

    const handleCreateProject = (formData: ProjectFormData) => {
        dispatch(createProject(formData))
            .unwrap()
            .then(() => setShowCreateForm(false))
            .catch((err) => console.error("Failed to create project:", err));
    };

    if (status === 'loading' && projects.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-white rounded-lg shadow">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg font-medium text-gray-700">Cargando proyectos...</p>
                </div>
            </div>
        );
    }

    if (status === 'failed' && projects.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-semibold text-red-700">Error al cargar proyectos</h3>
                    </div>
                    <p className="mt-2 text-red-700">{error}</p>
                    <button 
                        onClick={() => dispatch(fetchProjects())}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Listado de Proyectos</h2>
                    <p className="mt-2 text-sm text-gray-500">Gestión completa de todos los proyectos del sistema</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Crear Proyecto
                    </button>
                )}
            </div>

            {status === 'failed' && error && projects.length > 0 && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {showCreateForm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl ring-1 ring-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-900">Crear Nuevo Proyecto</h3>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <ProjectForm
                                onSubmit={handleCreateProject}
                                onCancel={() => setShowCreateForm(false)}
                                isLoading={status === 'loading'}
                            />
                        </div>
                    </div>
                </div>
            )}

            {projects.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {projects.map((project: Project) => (
                            <li key={project?.id} className="hover:bg-gray-50 transition-colors duration-150 px-2 sm:px-4">
                                <div className="py-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                to={`/projects/${project?.id}`}
                                                className="group block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                                    {project?.titulo}
                                                </h3>
                                                <p className="mt-1 text-gray-600">
                                                    {project?.descripcion || 'Sin descripción'}
                                                </p>
                                            </Link>
                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <svg className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-sm">
                                                        {new Date(project?.fecha_inicio).toLocaleDateString()} - {new Date(project?.fecha_finalizacion).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() => handleDelete(project.id)}
                                                    disabled={deletingId === project?.id}
                                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        deletingId === project?.id
                                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                            : 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500'
                                                    } transition-colors duration-150`}
                                                >
                                                    {deletingId === project?.id ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Eliminando...
                                                        </>
                                                    ) : 'Eliminar'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                status !== 'loading' && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-md ring-1 ring-gray-200">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-xl font-semibold text-gray-800">No hay proyectos</h3>
                        <p className="mt-1 text-sm text-gray-500">No se encontraron proyectos para mostrar.</p>
                        {isAdmin && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Crear primer proyecto
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};

export default ProjectListPage;
