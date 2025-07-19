// src/components/tasks/TaskForm.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { Task, TaskFormData, User, TaskStatus } from '../../types';
import { selectAllUsers, selectUsersStatus, fetchUsers } from '../../features/users/userSlice';
import { selectTasksError, clearTaskError } from '../../features/tasks/taskSlice';

// Array de estados posibles para el selector
const taskStatuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada'];

interface TaskFormProps {
    projectId: number; // ID del proyecto al que pertenece la tarea
    task?: Task | null; // Tarea existente para editar
    onSubmit: (formData: TaskFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean; // Estado de carga externo (del thunk create/update)
}

const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, onSubmit, onCancel, isLoading: isSubmitting }) => {
    const dispatch: AppDispatch = useDispatch();
    const users = useSelector(selectAllUsers);
    const usersStatus = useSelector(selectUsersStatus);
    const taskError = useSelector(selectTasksError); // Error específico de tarea

    const [formData, setFormData] = useState<TaskFormData>({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_finalizacion: '',
        id_proyecto: projectId, // Asignar ID del proyecto
        id_usuario: 0, // Asignado
        status: 'Pendiente', // Estado inicial por defecto
    });

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
        } else {
            // Resetear si es creación
            setFormData({
                titulo: '', descripcion: '', fecha_inicio: '', fecha_finalizacion: '',
                id_proyecto: projectId, id_usuario: 0, status: 'Pendiente'
            });
        }
        // Limpiar errores al cambiar modo o montar
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
            alert("Título, Asignado, Proyecto, Estado y Fechas son requeridos.");
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mostrar error de creación/actualización */}
            {taskError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error: {taskError}
                </div>
            )}

            {/* Campos del formulario (Título, Descripción, Fechas, Usuario Asignado, Estado) */}
            {/* Adaptar campos de ProjectForm */}
            <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título Tarea <span className="text-red-500">*</span></label>
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
                    <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">Fecha Inicio <span className="text-red-500">*</span></label>
                    <input type="date" name="fecha_inicio" id="fecha_inicio" required value={formData.fecha_inicio} onChange={handleChange} disabled={isSubmitting}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
                </div>
                <div>
                    <label htmlFor="fecha_finalizacion" className="block text-sm font-medium text-gray-700">Fecha Fin <span className="text-red-500">*</span></label>
                    <input type="date" name="fecha_finalizacion" id="fecha_finalizacion" required value={formData.fecha_finalizacion} onChange={handleChange} disabled={isSubmitting}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50" />
                </div>
            </div>
            <div>
                <label htmlFor="id_usuario" className="block text-sm font-medium text-gray-700">Asignado a <span className="text-red-500">*</span></label>
                <select name="id_usuario" id="id_usuario" required value={formData.id_usuario} onChange={handleChange} disabled={isSubmitting || usersStatus !== 'succeeded'}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50">
                    <option value={0} disabled>{usersStatus === 'loading' ? 'Cargando...' : 'Selecciona usuario'}</option>
                    {users.map((user: User) => (
                        <option key={user.id} value={user.id}>{user.nombre}</option>
                    ))}
                </select>
                {usersStatus === 'failed' && <p className='text-xs text-red-600 mt-1'>Error al cargar usuarios</p>}
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado <span className="text-red-500">*</span></label>
                <select name="status" id="status" required value={formData.status} onChange={handleChange} disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50">
                    {taskStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>


            <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                )}
                <button type="submit" disabled={isSubmitting || usersStatus !== 'succeeded'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50 flex items-center">
                    {isSubmitting && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" /* Spinner */></svg>}
                    {task ? 'Guardar Tarea' : 'Crear Tarea'}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;