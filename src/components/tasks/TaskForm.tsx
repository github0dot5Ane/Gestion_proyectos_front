import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { Task, TaskFormData, User, TaskStatus } from '../../types';
import { selectAllUsers, selectUsersStatus, fetchUsers } from '../../features/users/userSlice';
import { selectTasksError, clearTaskError } from '../../features/tasks/taskSlice';

const taskStatuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada'];

interface TaskFormProps {
    projectId: number;
    task?: Task | null;
    onSubmit: (formData: TaskFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, onSubmit, onCancel, isLoading: isSubmitting }) => {
    const dispatch: AppDispatch = useDispatch();
    const users = useSelector(selectAllUsers);
    const usersStatus = useSelector(selectUsersStatus);
    const taskError = useSelector(selectTasksError);

    const [formData, setFormData] = useState<TaskFormData>({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_finalizacion: '',
        id_proyecto: projectId,
        id_usuario: 0,
        status: 'Pendiente',
    });

    const [minEndDate, setMinEndDate] = useState('');

    // Actualizar fecha mínima para fecha_finalizacion cuando cambia fecha_inicio
    useEffect(() => {
        if (formData.fecha_inicio) {
            setMinEndDate(formData.fecha_inicio);
            
            // Si la fecha final actual es anterior a la nueva fecha inicio, la ajustamos
            if (formData.fecha_finalizacion && new Date(formData.fecha_finalizacion) < new Date(formData.fecha_inicio)) {
                setFormData(prev => ({
                    ...prev,
                    fecha_finalizacion: formData.fecha_inicio
                }));
            }
        } else {
            setMinEndDate('');
        }
    }, [formData.fecha_inicio]);

    // Cargar usuarios si es necesario
    useEffect(() => {
        if (usersStatus === 'idle') {
            dispatch(fetchUsers());
        }
    }, [usersStatus, dispatch]);

    // Pre-rellenar formulario si se edita
    useEffect(() => {
        if (task) {
            setFormData({
                titulo: task.titulo,
                descripcion: task.descripcion,
                fecha_inicio: task.fecha_inicio ? task.fecha_inicio.split(' ')[0] : '',
                fecha_finalizacion: task.fecha_finalizacion ? task.fecha_finalizacion.split(' ')[0] : '',
                id_proyecto: task.id_proyecto,
                id_usuario: task.id_usuario,
                status: task.status,
            });
            
            if (task.fecha_inicio) {
                setMinEndDate(task.fecha_inicio.split(' ')[0]);
            }
        } else {
            setFormData({
                titulo: '', descripcion: '', fecha_inicio: '', fecha_finalizacion: '',
                id_proyecto: projectId, id_usuario: 0, status: 'Pendiente'
            });
            setMinEndDate('');
        }
        dispatch(clearTaskError());
    }, [task, projectId, dispatch]);

    // Asignar primer usuario por defecto si es creación
    useEffect(() => {
        if (!task && users.length > 0 && formData.id_usuario === 0) {
            setFormData(prev => ({ ...prev, id_usuario: users[0].id }));
        }
    }, [users, task, formData.id_usuario]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'id_usuario' ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearTaskError());
        
        if (!formData.titulo || !formData.id_usuario || !formData.id_proyecto || !formData.status || !formData.fecha_inicio || !formData.fecha_finalizacion) {
            alert("Todos los campos marcados como obligatorios (*) son requeridos.");
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Encabezado */}
            <div className="pb-2">
                <h2 className="text-xl font-semibold text-gray-800">
                    {task ? 'Editar Tarea' : 'Nueva Tarea'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    {task ? 'Actualiza los detalles de esta tarea' : 'Completa la información para crear una nueva tarea'}
                </p>
            </div>

            {/* Mensaje de error */}
            {taskError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-start">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{taskError}</p>
                    </div>
                </div>
            )}

            {/* Campos del formulario */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                        Título <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="titulo"
                        id="titulo"
                        required
                        value={formData.titulo}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400 disabled:bg-gray-100"
                        placeholder="Ej: Implementar módulo de usuarios"
                    />
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <textarea
                        name="descripcion"
                        id="descripcion"
                        rows={3}
                        value={formData.descripcion}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400 disabled:bg-gray-100"
                        placeholder="Describe los detalles de la tarea..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha inicio <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="fecha_inicio"
                            id="fecha_inicio"
                            required
                            value={formData.fecha_inicio}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 disabled:bg-gray-100"
                            max={formData.fecha_finalizacion || undefined} // Máximo igual a fecha final si existe
                        />
                    </div>
                    <div>
                        <label htmlFor="fecha_finalizacion" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha final <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="fecha_finalizacion"
                            id="fecha_finalizacion"
                            required
                            value={formData.fecha_finalizacion}
                            onChange={handleChange}
                            disabled={isSubmitting || !formData.fecha_inicio}
                            min={minEndDate}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 disabled:bg-gray-100"
                        />
                        {!formData.fecha_inicio && (
                            <p className="mt-1 text-xs text-gray-500">Selecciona primero la fecha de inicio</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="id_usuario" className="block text-sm font-medium text-gray-700 mb-1">
                            Asignar a <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="id_usuario"
                            id="id_usuario"
                            required
                            value={formData.id_usuario}
                            onChange={handleChange}
                            disabled={isSubmitting || usersStatus !== 'succeeded'}
                            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 disabled:bg-gray-100"
                        >
                            <option value={0} disabled>
                                {usersStatus === 'loading' ? 'Cargando...' : 'Seleccionar usuario'}
                            </option>
                            {users.map((user: User) => (
                                <option key={user.id} value={user.id}>
                                    {user.nombre}
                                </option>
                            ))}
                        </select>
                        {usersStatus === 'failed' && (
                            <p className="mt-1 text-sm text-red-600">Error al cargar usuarios</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Estado <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="status"
                            id="status"
                            required
                            value={formData.status}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 disabled:bg-gray-100"
                        >
                            {taskStatuses.map(status => (
                                <option key={status} value={status} className={status === 'Completada' ? 'font-medium text-gray-900' : ''}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || usersStatus !== 'succeeded' || !formData.fecha_inicio || !formData.fecha_finalizacion}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    {isSubmitting && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {task ? 'Guardar cambios' : 'Crear tarea'}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;