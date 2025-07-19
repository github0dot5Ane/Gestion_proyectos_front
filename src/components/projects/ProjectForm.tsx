// src/components/projects/ProjectForm.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { Project, ProjectFormData, User } from '../../types';
import { fetchUsers, selectAllUsers, selectUsersStatus } from '../../features/users/userSlice';
import { selectProjectsError, clearProjectError } from '../../features/projects/projectSlice'; // Para status y error

interface ProjectFormProps {
    project?: Project | null; // Proyecto existente para editar (opcional)
    onSubmit: (formData: ProjectFormData) => void; // Función a llamar al guardar
    onCancel?: () => void; // Función para cancelar/cerrar
    isLoading?: boolean; // Estado de carga externo (del thunk create/update)
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSubmit, onCancel, isLoading: isSubmitting }) => {
    const dispatch: AppDispatch = useDispatch();
    const users = useSelector(selectAllUsers);
    const usersStatus = useSelector(selectUsersStatus);
    const projectError = useSelector(selectProjectsError); // Error específico de proyecto

    const [formData, setFormData] = useState<ProjectFormData>({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_finalizacion: '',
        id_responsable: 0, // Valor inicial inválido o seleccionar el primero
    });

    // Cargar usuarios al montar el formulario si no están cargados
    useEffect(() => {
        if (usersStatus === 'idle') {
            dispatch(fetchUsers());
        }
    }, [usersStatus, dispatch]);

    // Pre-rellenar formulario si se está editando
    useEffect(() => {
        if (project) {
            setFormData({
                titulo: project.titulo,
                descripcion: project.descripcion,
                // Formatear fechas para input type="date" (YYYY-MM-DD)
                fecha_inicio: project.fecha_inicio ? project.fecha_inicio.split(' ')[0] : '',
                fecha_finalizacion: project.fecha_finalizacion ? project.fecha_finalizacion.split(' ')[0] : '',
                id_responsable: project.id_responsable,
            });
        } else {
            // Resetear si no hay proyecto (útil si el mismo form se reutiliza)
            setFormData({
                titulo: '', descripcion: '', fecha_inicio: '', fecha_finalizacion: '', id_responsable: 0
            });
        }
        // Limpiar errores al cambiar de modo (crear/editar) o al montar
        dispatch(clearProjectError());
    }, [project, dispatch]);

    // Cargar ID del primer usuario como default si no hay selección previa
    useEffect(() => {
        if (!project && users.length > 0 && formData.id_responsable === 0) {
            setFormData(prev => ({ ...prev, id_responsable: users[0].id }));
        }
    }, [users, project, formData.id_responsable]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'id_responsable' ? parseInt(value, 10) : value, // Convertir ID a número
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Limpiar error previo antes de enviar
        dispatch(clearProjectError());
        // Validación simple
        if (!formData.titulo || !formData.id_responsable || !formData.fecha_inicio || !formData.fecha_finalizacion) {
            // Podrías usar un estado local para errores de formulario aquí
            alert("Título, Responsable y Fechas son requeridos.");
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mostrar error de creación/actualización */}
            {projectError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error: {projectError}
                </div>
            )}

            <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título del Proyecto <span className="text-red-500">*</span></label>
                <input type="text" name="titulo" id="titulo" required value={formData.titulo} onChange={handleChange} disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="descripcion" id="descripcion" rows={3} value={formData.descripcion} onChange={handleChange} disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                    <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">Fecha de Inicio <span className="text-red-500">*</span></label>
                    <input type="date" name="fecha_inicio" id="fecha_inicio" required value={formData.fecha_inicio} onChange={handleChange} disabled={isSubmitting}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
                </div>
                <div>
                    <label htmlFor="fecha_finalizacion" className="block text-sm font-medium text-gray-700">Fecha de Finalización <span className="text-red-500">*</span></label>
                    <input type="date" name="fecha_finalizacion" id="fecha_finalizacion" required value={formData.fecha_finalizacion} onChange={handleChange} disabled={isSubmitting}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
                </div>
            </div>
            <div>
                <label htmlFor="id_responsable" className="block text-sm font-medium text-gray-700">Responsable <span className="text-red-500">*</span></label>
                <select name="id_responsable" id="id_responsable" required value={formData.id_responsable} onChange={handleChange} disabled={isSubmitting || usersStatus !== 'succeeded'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50">
                    <option value={0} disabled>{usersStatus === 'loading' ? 'Cargando usuarios...' : 'Selecciona un responsable'}</option>
                    {users.map((user: User) => (
                        <option key={user.id} value={user.id}>{user.nombre} ({user.email})</option>
                    ))}
                </select>
                {usersStatus === 'failed' && <p className='text-xs text-red-600 mt-1'>Error al cargar usuarios</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={isSubmitting}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm disabled:opacity-50">
                        Cancelar
                    </button>
                )}
                <button type="submit" disabled={isSubmitting || usersStatus !== 'succeeded'} // Deshabilitar si los usuarios no cargaron
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50 flex items-center">
                    {isSubmitting && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" /* SVG Spinner */></svg>}
                    {project ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
            </div>
        </form>
    );
};

export default ProjectForm;