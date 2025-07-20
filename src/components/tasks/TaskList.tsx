import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { Task, TaskStatus } from '../../types';
import { updateTask, deleteTask } from '../../features/tasks/taskSlice';
import { selectIsAdmin, selectCurrentUser } from '../../features/auth/authSlice';
import { selectCurrentProject } from '../../features/projects/projectSlice';
import TaskFilesModal from './TaskFilesModal';

interface TaskListProps {
    tasks: Task[];
    isLoading: boolean;
    error?: string | null;
}

const taskStatuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada'];

const TaskList: React.FC<TaskListProps> = ({ tasks, isLoading, error }) => {
    const dispatch: AppDispatch = useDispatch();
    const isAdmin = useSelector(selectIsAdmin);
    const currentUser = useSelector(selectCurrentUser);
    const currentProject = useSelector(selectCurrentProject);

    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [selectedTaskForFiles, setSelectedTaskForFiles] = useState<Task | null>(null);

    const canEditTaskDetails = (task: Task): boolean => {
        return !!currentUser && (isAdmin || (currentProject?.id === task.id_proyecto && currentUser.id === currentProject.id_responsable));
    };

    const canChangeStatus = (task: Task): boolean => {
        return !!currentUser && (canEditTaskDetails(task) || currentUser.id === task.id_usuario);
    };

    const canDeleteTask = (task: Task): boolean => {
        return canEditTaskDetails(task);
    };

    const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
        setEditingTaskId(taskId);
        dispatch(updateTask({ taskId: String(taskId), taskData: { status: newStatus } }))
            .unwrap()
            .catch(err => alert(`Error al actualizar estado: ${err}`))
            .finally(() => setEditingTaskId(null));
    };

    const handleDelete = (taskId: number) => {
        if (window.confirm('¿Seguro que quieres eliminar esta tarea?')) {
            setEditingTaskId(taskId);
            dispatch(deleteTask(String(taskId)))
                .unwrap()
                .catch(err => alert(`Error al eliminar tarea: ${err}`))
                .finally(() => setEditingTaskId(null));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">Error al cargar tareas: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No hay tareas</h3>
                <p className="mt-1 text-sm text-gray-500">No se encontraron tareas para mostrar.</p>
            </div>
        );
    }

    return (
        <>
            {selectedTaskForFiles && (
                <TaskFilesModal
                    task={selectedTaskForFiles}
                    onClose={() => setSelectedTaskForFiles(null)}
                />
            )}
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                        <li key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                {/* Información principal */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">
                                            {task.titulo}
                                        </h3>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {task.descripcion || 'Sin descripción'}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                                        <div className="flex items-center">
                                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {task.usuario?.nombre || `ID: ${task.id_usuario}`}
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(task.fecha_inicio).toLocaleDateString()} - {new Date(task.fecha_finalizacion).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Controles */}
                                <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    {/* Selector de estado */}
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                        disabled={!canChangeStatus(task) || editingTaskId === task.id}
                                        className={`px-3 py-1 text-sm rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                            task.status === 'Completada' ? 'bg-green-100 text-green-800 border-green-200' :
                                            task.status === 'En Progreso' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                            task.status === 'Bloqueada' ? 'bg-red-100 text-red-800 border-red-200' :
                                            'bg-gray-100 text-gray-800 border-gray-200'
                                        } disabled:opacity-60`}
                                    >
                                        {taskStatuses.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>

                                    {/* Botones de acción */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedTaskForFiles(task)}
                                            title="Gestionar archivos"
                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                        </button>

                                        {canEditTaskDetails(task) && (
                                            <button 
                                                title="Editar detalles" 
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}

                                        {canDeleteTask(task) && (
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                disabled={editingTaskId === task.id}
                                                title="Eliminar tarea"
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                            >
                                                {editingTaskId === task.id ? (
                                                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default TaskList;