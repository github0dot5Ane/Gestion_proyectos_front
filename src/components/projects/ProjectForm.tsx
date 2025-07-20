import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { Project, ProjectFormData, User } from '../../types';
import { fetchUsers, selectAllUsers, selectUsersStatus } from '../../features/users/userSlice';
import { selectProjectsError, clearProjectError } from '../../features/projects/projectSlice';

interface ProjectFormProps {
    project?: Project | null;
    onSubmit: (formData: ProjectFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSubmit, onCancel, isLoading: isSubmitting }) => {
    const dispatch: AppDispatch = useDispatch();
    const users = useSelector(selectAllUsers);
    const usersStatus = useSelector(selectUsersStatus);
    const projectError = useSelector(selectProjectsError);

    const [formData, setFormData] = useState<ProjectFormData>({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_finalizacion: '',
        id_responsable: 0,
    });

    const [dateError, setDateError] = useState<string | null>(null);

    useEffect(() => {
        if (usersStatus === 'idle') {
            dispatch(fetchUsers());
        }
    }, [usersStatus, dispatch]);

    useEffect(() => {
        if (project) {
            setFormData({
                titulo: project.titulo,
                descripcion: project.descripcion,
                fecha_inicio: project.fecha_inicio ? project.fecha_inicio.split(' ')[0] : '',
                fecha_finalizacion: project.fecha_finalizacion ? project.fecha_finalizacion.split(' ')[0] : '',
                id_responsable: project.id_responsable,
            });
        } else {
            setFormData({
                titulo: '', descripcion: '', fecha_inicio: '', fecha_finalizacion: '', id_responsable: 0
            });
        }
        dispatch(clearProjectError());
    }, [project, dispatch]);

    useEffect(() => {
        if (!project && users.length > 0 && formData.id_responsable === 0) {
            setFormData(prev => ({ ...prev, id_responsable: users[0].id }));
        }
    }, [users, project, formData.id_responsable]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = {
            ...formData,
            [name]: name === 'id_responsable' ? parseInt(value, 10) : value,
        };

        setFormData(newFormData);

        // Validar fechas
        if (name === 'fecha_inicio' || name === 'fecha_finalizacion') {
            if (newFormData.fecha_inicio && newFormData.fecha_finalizacion) {
                if (new Date(newFormData.fecha_finalizacion) <= new Date(newFormData.fecha_inicio)) {
                    setDateError('La fecha de finalización debe ser posterior a la fecha de inicio');
                } else {
                    setDateError(null);
                }
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearProjectError());
        
        if (!formData.titulo || !formData.id_responsable || !formData.fecha_inicio || !formData.fecha_finalizacion) {
            alert("Título, Responsable y Fechas son requeridos.");
            return;
        }

        if (dateError) {
            alert(dateError);
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {projectError && (
                <div className="p-4 bg-red-100 border-l-4 border-red-600 rounded-lg shadow">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-red-800">Error:</span>
                    </div>
                    <p className="mt-1 ml-7 text-red-700">{projectError}</p>
                </div>
            )}

            <div className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div>
                    <label htmlFor="titulo" className="block text-sm font-bold text-gray-800 mb-2">
                        Título del Proyecto <span className="text-red-600">*</span>
                    </label>
                    <input 
                        type="text" 
                        name="titulo" 
                        id="titulo" 
                        required 
                        value={formData.titulo} 
                        onChange={handleChange} 
                        disabled={isSubmitting}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:text-black" 
                        placeholder="Ingrese el nombre del proyecto"
                    />
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-bold text-gray-800 mb-2">
                        Descripción
                    </label>
                    <textarea 
                        name="descripcion" 
                        id="descripcion" 
                        rows={4} 
                        value={formData.descripcion} 
                        onChange={handleChange} 
                        disabled={isSubmitting}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:text-black"
                        placeholder="Describa los detalles del proyecto"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="fecha_inicio" className="block text-sm font-bold text-gray-800 mb-2">
                            Fecha de Inicio <span className="text-red-600">*</span>
                        </label>
                        <input 
                            type="date" 
                            name="fecha_inicio" 
                            id="fecha_inicio" 
                            required 
                            value={formData.fecha_inicio} 
                            onChange={handleChange} 
                            disabled={isSubmitting}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="fecha_finalizacion" className="block text-sm font-bold text-gray-800 mb-2">
                            Fecha de Finalización <span className="text-red-600">*</span>
                        </label>
                        <input 
                            type="date" 
                            name="fecha_finalizacion" 
                            id="fecha_finalizacion" 
                            required 
                            value={formData.fecha_finalizacion} 
                            onChange={handleChange} 
                            disabled={isSubmitting}
                            min={formData.fecha_inicio}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:text-black"
                        />
                        {dateError && (
                            <p className="mt-2 text-sm text-red-600">{dateError}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="id_responsable" className="block text-sm font-bold text-gray-800 mb-2">
                        Responsable <span className="text-red-600">*</span>
                    </label>
                    <select 
                        name="id_responsable" 
                        id="id_responsable" 
                        required 
                        value={formData.id_responsable} 
                        onChange={handleChange} 
                        disabled={isSubmitting || usersStatus !== 'succeeded'}
                        className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:text-black"
                    >
                        <option value={0} disabled>
                            {usersStatus === 'loading' ? 'Cargando usuarios...' : 'Seleccione'}
                        </option>
                        {users.map((user: User) => (
                            <option key={user.id} value={user.id}>
                                {user.nombre} ({user.email})
                            </option>
                        ))}
                    </select>
                    {usersStatus === 'failed' && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Error al cargar usuarios
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-2">
                {onCancel && (
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        disabled={isSubmitting}
                        className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-sm font-bold rounded-lg shadow-sm text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        Cancelar
                    </button>
                )}
                <button 
                    type="submit" 
                    disabled={isSubmitting || usersStatus !== 'succeeded' || !!dateError}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                >
                    {isSubmitting && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {project ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
            </div>
        </form>
    );
};

export default ProjectForm;