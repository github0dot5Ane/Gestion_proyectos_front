// src/pages/ProjectListPage.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch } from '../app/store';
import { fetchProjects, deleteProject, selectAllProjects, selectProjectsStatus, selectProjectsError, clearProjectError, createProject } from '../features/projects/projectSlice'; // Asegúrate que createProject esté aquí
import { selectIsAdmin } from '../features/auth/authSlice';
import { Project, ProjectFormData } from '../types'; // <--- AÑADE ESTA IMPORTACIÓN (O SOLO ProjectFormData SI Project YA ESTABA)
// import Modal from '../components/common/Modal';
import ProjectForm from '../components/projects/ProjectForm';

const ProjectListPage: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    //const navigate = useNavigate();
    const projects = useSelector(selectAllProjects);
    const status = useSelector(selectProjectsStatus);
    const error = useSelector(selectProjectsError);
    const isAdmin = useSelector(selectIsAdmin); // Para control de acceso

    const [showCreateForm, setShowCreateForm] = useState(false); // Para mostrar/ocultar form (ej. en modal)
    const [deletingId, setDeletingId] = useState<number | null>(null); // Para saber qué proyecto se está eliminando

    // Cargar proyectos al montar
    useEffect(() => {
        // Solo cargar si no se ha cargado o si queremos refrescar
        if (status === 'idle') {
            dispatch(fetchProjects());
        }
        // Limpiar errores al montar
        dispatch(clearProjectError());
    }, [status, dispatch]);

    const handleDelete = (projectId: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
            setDeletingId(projectId);
            dispatch(deleteProject(String(projectId)))
                .unwrap() // Permite usar .then() y .catch() en el resultado del thunk
                .catch((err) => {
                    console.error("Failed to delete project:", err);
                    // El error ya se maneja en el slice, pero podemos hacer algo más aquí si es necesario
                })
                .finally(() => setDeletingId(null)); // Quitar el estado de carga específico
        }
    };

    const handleCreateProject = (formData: ProjectFormData) => {
        dispatch(createProject(formData))
            .unwrap()
            .then(() => { //(newProject) => {
                setShowCreateForm(false); // Cerrar el formulario/modal
                // Opcional: navegar a los detalles del nuevo proyecto
                // navigate(`/projects/${newProject.id}`);
            })
            .catch((err) => {
                console.error("Failed to create project:", err);
                // El error se muestra dentro del ProjectForm
            });
    };

    // Componente para mostrar estado de carga/error
    if (status === 'loading' && projects.length === 0) { // Mostrar solo si no hay datos previos
        return <div className="text-center p-10">Cargando proyectos...</div>;
    }

    if (status === 'failed' && projects.length === 0) {
        return <div className="text-center p-10 text-red-600">Error al cargar proyectos: {error}</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Proyectos</h1>
                {isAdmin && ( // Botón Crear solo para Admin (RF04 modificado)
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm"
                    >
                        + Crear Proyecto
                    </button>
                )}
            </div>

            {/* Mostrar error general si ocurrió después de tener datos */}
            {status === 'failed' && error && projects.length > 0 && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error: {error}
                </div>
            )}


            {/* Modal o Sección para el Formulario de Creación */}
            {showCreateForm && (
                // Aquí podrías usar un componente Modal real
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-10">
                    <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Crear Nuevo Proyecto</h3>
                            <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        <ProjectForm
                            onSubmit={handleCreateProject}
                            onCancel={() => setShowCreateForm(false)}
                            isLoading={status === 'loading'} // Estado de carga general para proyectos
                        />
                    </div>
                </div>
            )}


            {/* Lista de Proyectos */}
            {projects.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {projects.map((project: Project) => (
                            <li key={project?.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <Link to={`/projects/${project?.id}`} className="block">
                                            <p className="text-lg font-medium text-indigo-600 truncate">{project?.titulo}</p>
                                            <p className="text-sm text-gray-500 truncate">{project?.descripcion || 'Sin descripción'}</p>
                                        </Link>
                                        <div className="mt-2 flex items-center text-sm text-gray-500">
                                            {/* Icono Calendario */}
                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" /* SVG */></svg>
                                            <p>
                                                Inicio: {new Date(project?.fecha_inicio).toLocaleDateString()} -
                                                Fin: {new Date(project?.fecha_finalizacion).toLocaleDateString()}
                                            </p>
                                            {/* Aquí podríamos mostrar el responsable */}
                                        </div>
                                    </div>
                                    {isAdmin && ( // Botón Eliminar solo para Admin (RF10)
                                        <button
                                            onClick={() => handleDelete(project.id)}
                                            disabled={deletingId === project?.id}
                                            className={`ml-4 text-sm font-medium ${deletingId === project?.id ? 'text-gray-400' : 'text-red-600 hover:text-red-800'} disabled:opacity-50`}
                                        >
                                            {deletingId === project?.id ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                status !== 'loading' && <p className="text-center text-gray-500 mt-10">No hay proyectos para mostrar.</p>
            )}
        </div>
    );
};

export default ProjectListPage;